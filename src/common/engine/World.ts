import { Vector, Ray, TraceResult } from './math';
import Player from './Player';
import Entity from './Entity';
import Fighter from './Fighter';
import Projectile from './projectiles/Projectile';
import Prop from './props/Prop';
import Map from './Map';
import { IPlayerInputState, IPlayerDied } from '../events/events';
import { MessageBus } from '../messaging/bus';
import { FighterType, MapPreset, EntityType } from './Enums';
import { Sheep, Deer, Flamingo } from './fighters';
import { TypeEnum } from '../events';


// Internal Functions //
/* eslint-disable no-param-reassign */

// Traces does a collision trace upon prop B using the movement ray of prop A
function CollisionTrace(a: Prop, b: Prop, ray: Ray): TraceResult {
  // See if the point is anywhere close enough to the ray for an intersection
  if (ray.pointDistanceXY(b.Position) < a.Radius + b.Radius) { // Bottom center of fighter
    if (b.Position.z > a.Position.z) { // B is above A, meaning we need to trace the top of the objects
      const pos = Vector.Clone(a.Position);
      pos.z += a.Height;
      ray.start.z += a.Height;
      ray.end.z += a.Height;
      return b.traceProp(ray, a.Radius);
    }
    return b.traceProp(ray, a.Radius); // Bottom trace
  }

  return null; // Basic point tests failed, return null
}
// Simple collision test and trace for bullets
function CollisionTraceBullet(a: Prop, ray: Ray): TraceResult {
  if (ray.pointDistanceXY(a.Position) < a.Radius) {
    return a.traceProp(ray);
  }

  return null; // Return null if simple point distance test failed
}

// Collides two fighters, makes a ride b and does momentum transfers
// If the collision is a repeat, momentum is not transferred, but positioning and ridership is still calculated
function CollideFighters(a: Fighter, b: Fighter, info: TraceResult) {
  if (!(a.rodeThisTick === b || b.rodeThisTick === a)) { // If they are not riding each other, treat it like a standard collision
    const massA = a.Mass + a.passengerMass;
    const massB = b.Mass + b.passengerMass;
    let moment1 = a.Velocity.length() * massA; // Momentum of fighter A
    let moment2 = b.Velocity.length() * massB; // Momentum of fighter B

    // Apply ridership momentum additions
    if (a.rodeThisTick) moment1 += a.rodeThisTick.Velocity.length() * massA;
    if (b.rodeThisTick) moment2 += b.rodeThisTick.Velocity.length() * massB;

    a.CollideWithFighter(b, moment1); // Trigger collision events
    b.CollideWithFighter(a, moment2);

    // Momentum Transfer--should we swap momentums or sum them (essentially, what collision do we want)
    const aVelo = Vector.Multiply(Vector.UnitVector(b.Velocity), moment2 / massA);
    b.Velocity = Vector.Multiply(Vector.UnitVector(a.Velocity), moment1 / massB);
    a.Velocity = aVelo;

    a.lastCollision = b;
    b.lastCollision = a;
  }

  // Slight bounceback on air collisions used to prevent characters from getting stuck in eachother
  if (info.topFaceCollision) { // A landed on B
    a.JustLanded = true; // Allows jump
    a.riding = b;
    a.CollideWithProp(info, b, false);
  // Position fighter a around fighter b accordingly (note velocity change already occurred)
  } else if (b.rodeThisTick !== a && b.rodeThisTick !== a) { // Don't let the rider push the fighter around though
    a.CollideWithProp(info, b, false);
  }
}
/* eslint-enable no-param-reassign */


// World Class - Manages bullets and fighters
/* General flow of things:

- Apply player inputs

- Fire bullets and handle character updates
- Tick physics

- Check for deaths

- Distribute updates

*/
class World {
  public static MAX_LOBBY_SIZE: number = 20;

  public Fighters: Fighter[];
  public Bullets: Projectile[];
  public Props: Prop[];
  public Map: Map;

  public doReaping: boolean;
  private kills: IPlayerDied[];

  constructor(mapPreset: MapPreset = MapPreset.Sandy, loadProps: boolean = false, loadTextures: boolean = false) {
    this.Map = new Map(40, 40, 23, 10000, mapPreset);
    if (loadTextures) this.Map.loadTexture();

    this.Fighters = [];
    this.Bullets = [];
    if (loadProps) {
      this.Props = this.Map.getProps(mapPreset, loadTextures);
    } else {
      this.Props = []; // Props not loaded by default
    }

    this.doReaping = false;
    this.kills = [];

    MessageBus.subscribe('NewProjectile', (message) => {
      this.Bullets.push(message as Projectile);
    });
  }


  // Network Interaction //

  // Apply player inputs to player's character
  /* eslint-disable class-methods-use-this */
  public applyAction(player: Player, action: IPlayerInputState) {
    const char = player.getCharacter();
    if (!char || char.HP <= 0) return; // If the player's character is currently dead or missing, do not apply inputs

    char.Move(Vector.UnitVectorFromXYZ(action.moveDirection.x, action.moveDirection.y, 0)); // Apply movement input
    char.aim(Vector.UnitVectorFromXYZ(action.mouseDirection.x, action.mouseDirection.y, 0)); // Apply new aim
    char.Firing = char.isRanged() && action.mouseDown; // Are they trying to fire bullets, and can they?

    if (action.jump === true) {
      char.Jump(); // Jump
    }
  }
  /* eslint-enable class-methods-use-this */


  public spawnFighter(player: Player, characterType: FighterType): Fighter {
    // Try to find a good spawn location
    let avgLocation = new Vector(0, 0, 0);
    if (this.Fighters.length > 0) { // Find one furthest from combat... (note, does not work well if combat is in center of arena)
      for (let i = 0; i < this.Fighters.length; i++) {
        avgLocation = Vector.Add(avgLocation, this.Fighters[i].Position);
      }
      avgLocation = Vector.Divide(avgLocation, this.Fighters.length);
      avgLocation.x = this.Map.Width - avgLocation.x;
      avgLocation.y = this.Map.Height - avgLocation.y;
      avgLocation.z = 0;
    } else { // Otherwise, just drop them in the middle of the map
      avgLocation.x = this.Map.Width / 2;
      avgLocation.y = this.Map.Height / 2;
    }

    let fight: Fighter = null;
    switch (characterType) {
      case FighterType.Sheep:
      default:
        fight = new Sheep(player.getCharacterID(), avgLocation);
        break;
      case FighterType.Deer:
        fight = new Deer(player.getCharacterID(), avgLocation);
        break;
      case FighterType.Flamingo:
        fight = new Flamingo(player.getCharacterID(), avgLocation);
        break;
    }

    this.Fighters.push(fight);

    return fight;
  }

  // Returns a list of IPlayerDied events for every fighter that has died
  // Also removes fighters from the Fighters list
  public reapKills(): IPlayerDied[] {
    const killList = this.kills;
    this.kills = [];

    return killList;
  }


  // Normal World Things //

  // Run all general world-tick functions
  // - DeltaTime should be in seconds
  // - latencyChecks is used to cap certain values that may otherwise act in unexpected ways in a high-latency settings; client-only
  public tick(DeltaTime: number, latencyChecks: boolean = false) {
    this.doUpdates(DeltaTime, latencyChecks);
    this.TickPhysics(DeltaTime);
  }

  // Do various updates that are not realted to physics
  public doUpdates(DeltaTime: number, latencyChecks: boolean) {
    for (let i = 0; i < this.Fighters.length; i++) {
      const a = this.Fighters[i];

      a.tickCooldowns(DeltaTime);
      a.tryBullet(latencyChecks); // Fire bullets (bullets are automatically added to list with events)

      // If they are dead, add them to the kill list, then remove them from future interactions
      if (this.doReaping && a.HP <= 0) {
        this.kills.push({
          type: TypeEnum.PlayerDied,
          characterId: a.getOwnerID(),
          killerId: a.LastHitBy,
        });

        this.Fighters.splice(i, 1);
        i--;
      }
    }
  }

  // Tick physics and collisions for fighters and bullets
  public TickPhysics(DeltaTime: number) {
    // Tick general fighter physics
    for (let i = 0; i < this.Fighters.length; i++) {
      const obj = this.Fighters[i];
      const mass = obj.Mass + obj.passengerMass; // Passengers increase mass for other calculations
      const maxSpeed = obj.MaxMomentum / obj.Mass; // Max speed still remains the same, we do not want passengers causing slowdown

      // Store move acceleration for potential manipulations
      let moveAccel = Vector.Clone(obj.Acceleration);

      // First, apply any potential accelerations due to physics, start with friction as base for optimization
      let accel = new Vector(0, 0, 0);

      // Gravity - Ignores fighter riding because it relies on constant collisions
      if (obj.Position.z > 0 || obj.Velocity.z > 0) accel.z += -50;

      // Ridership stuff
      obj.rodeThisTick = null;
      obj.lastCollision = null;
      if (obj.riding) {
        if ((obj.dismountRider || (obj.riding.dismountRider && obj.riding.Velocity.lengthXY() > 5))) { // Dismount if requested
          if (obj.riding.dismountRider) obj.Jump(true); // Force a jump
          obj.lastCollision = obj.riding;
          obj.Position.z += 0.2; // Add slight bit of offset to avoid clipping into steed

          const veloLeveled = Vector.Clone(obj.riding.Velocity);
          veloLeveled.z = 0;
          obj.Velocity = Vector.Add( // Inherit riding velocity (not momentum)
            obj.Velocity,
            veloLeveled,
          );
        } else {
          obj.rodeThisTick = obj.riding;
        }
      } else { // If fighter is out of bounds, bounce them back (wrestling arena has elastic walls), proportional to distance outward
        if (obj.Position.x < 0) accel.x += this.Map.wallStrength * Math.abs(obj.Position.x);
        else if (obj.Position.x > this.Map.Width) accel.x -= this.Map.wallStrength * (obj.Position.x - this.Map.Width);

        if (obj.Position.y < 0) accel.y += this.Map.wallStrength * Math.abs(obj.Position.y);
        else if (obj.Position.y > this.Map.Height) accel.y -= this.Map.wallStrength * (obj.Position.y - this.Map.Height);

        // Force divided by mass equals acceleration
        accel.x /= mass;
        accel.y /= mass;
      }

      if (obj.isFalling()) { // Manipulate move acceleration of the fighter depending on if they're in the air or not
        moveAccel = Vector.Multiply(moveAccel, obj.AirControl);
      } else { // Note friction is Fn(or mass * gravity) * coefficient of friction, then force is divided by mass for accel
        const leveled = new Vector( // Get approximate X and Y velocity by end of frame
          obj.Velocity.x + (moveAccel.x + accel.x) * DeltaTime,
          obj.Velocity.y + (moveAccel.y + accel.y) * DeltaTime,
          0,
        );
        const len = leveled.lengthXY(); // Get magnitude of the leveled velocity

        // We want more friction at low velocities and less friction at high velocitites so slowdown seems more realistic
        // 'Static' friction would in this case be three times as strong as kinetic friction
        // Frictions are blended using a logarithmic curve
        const force = Math.max(3 - Math.log(len / 2 + 1), 1);

        // Apply friction as an acceleration
        accel = Vector.Subtract(
          accel,
          Vector.Multiply(
            Vector.UnitVector(leveled),
            force * this.Map.Friction,
          ).clamp( // Limit it so it does not push the player backwards while standing still (still acceleration though)
            0,
            len / Math.max(DeltaTime, 0.001), // Ensure DT > 0 so we do not run into any divide by zero errors and corrupt the system
          ),
        );

        // However, we don't want players getting stuck in place, so give them a slight acceleration boost when at low velocities
        if (force > 1) {
          accel = Vector.Add(
            accel,
            Vector.Multiply(
              moveAccel,
              (force - 1), // No boost when at full kinetic friction, but 2x boost when full static
            ),
          );
        }
      }


      // Add physics-based acceleration and player input acceleration, and then calculate position change
      accel = Vector.Add(moveAccel, accel);
      let deltaX = Vector.Add(
        Vector.Multiply(accel, (DeltaTime ** 2) / 2),
        Vector.Multiply(obj.Velocity, DeltaTime),
      );

      // If they attempted to move faster than their max momentum, clamp their movement (but don't clamp vertical component)
      if (deltaX.lengthXY() > maxSpeed * DeltaTime) {
        // eslint-disable-next-line prefer-destructuring
        const z = deltaX.z;
        deltaX = Vector.Multiply(Vector.UnitVectorXY(deltaX), maxSpeed * DeltaTime);
        deltaX.z = z;
      }

      obj.lastPosition = obj.Position; // Used in raycasting and riding position offsets
      obj.Position = Vector.Add(obj.Position, deltaX);
      obj.Velocity = Vector.Add(obj.Velocity, Vector.Multiply(accel, DeltaTime));
      obj.newPosition = obj.Position; // Used in riding position offsets, ignores below position changes

      // Terminal velocity (don't clamp vertical component)
      if (obj.Velocity.lengthXY() > maxSpeed) {
        // eslint-disable-next-line prefer-destructuring
        const z = obj.Velocity.z;
        obj.Velocity = Vector.Multiply(Vector.UnitVectorXY(obj.Velocity), maxSpeed);
        obj.Velocity.z = z;
      }

      if (obj.getBulletCooldown() <= 0) {
        if (moveAccel.x < -1) obj.Flipped = true;
        else if (moveAccel.x > 1) obj.Flipped = false;
      }

      if (obj.Position.z < 0) {
        obj.Position.z = 0;
        obj.Velocity.z = 0;
        obj.Land();
      }

      // Clear ridership for current frame--if they sink into whoever they're riding, they'll collide and this will be reset
      obj.riding = null;
      obj.passengerMass = 0;
      obj.passengerMaxMomentum = 0;
      obj.onSurface = false; // Don't claim they're on a prop until they collide again
      obj.dismountRider = false;
    }


    // Tick bullets
    for (let i = 0; i < this.Bullets.length; i++) {
      if (this.Bullets[i].finished) { // Remove despawning bullets
        this.Bullets.splice(i, 1);
        i--;
      } else this.Bullets[i].Tick(DeltaTime); // Otherwise, tick bullet physics
    }


    // Sort list of fighters so collisions are calculated from bottom up for ridership puprposes
    this.Fighters.sort((a: Fighter, b: Fighter) => {
      if (a.lastPosition.z > b.lastPosition.z) return 1;
      if (a.lastPosition.z < b.lastPosition.z) return -1;
      return 0;
    });


    // Calculate mass boosts and such before applying physics
    for (let i = 0; i < this.Fighters.length; i++) {
      if (this.Fighters[i].rodeThisTick) { // Tally up their mass for future collisions
        const a = this.Fighters[i];
        a.Position = Vector.Add(a.Position, a.getTotalStackPositionChange()); // .level()

        a.getBottomOfStackPhysics().passengerMass += a.Mass + a.passengerMass;
        a.getBottomOfStackPhysics().passengerMaxMomentum += a.MaxMomentum + a.passengerMaxMomentum;
      }
    }

    // Compute collisions using raytraces
    for (let i = 0; i < this.Fighters.length; i++) {
      const a = this.Fighters[i];

      const rayStart = Vector.Clone(a.lastPosition);
      if (a.rodeThisTick) {
        rayStart.z += 0.2; // Add slight bit of z-boost to help raycasts hit the below target
      }
      const moveTrace = new Ray(rayStart, a.Position);

      let closest = 10000; // How many units away closest collision is
      let closestResult: TraceResult = null; // Closest TraceResult, hitInfo is set to prop it collided with

      // Fighter collisions
      for (let j = 0; j < this.Fighters.length; j++) {
        const b = this.Fighters[j];

        // Don't bother attempting to collide with self or someone they just collided with
        if (!(j === i || a.lastCollision === b || b.lastCollision === a || b.Position.z > a.Position.z)) {
          const result = CollisionTrace(a, b, Ray.Clone(moveTrace));
          if (result && result.collided) {
            if (result.distance < closest) {
              closest = result.distance;
              result.hitInfo = b;
              closestResult = result;
            }
          }
        }
      }

      // Prop collisions (always collide with props)
      for (let j = 0; j < this.Props.length; j++) {
        const b = this.Props[j];
        const result = CollisionTrace(a, b, Ray.Clone(moveTrace));
        if (result && result.collided) {
          a.CollideWithProp(result, b, true);
        }
      }

      // Collide with nearest fighter
      if (closestResult && closestResult.hitInfo) {
        CollideFighters(a, <Fighter>closestResult.hitInfo, closestResult);
      }
    }


    // Bullet collisions
    for (let j = 0; j < this.Bullets.length; j++) {
      const b = this.Bullets[j];

      const ray = new Ray(Vector.Subtract(b.Position, b.DeltaPosition), b.Position);

      let closest = 10000; // How many units away the closest collision is
      let closestHit: TraceResult = null; // Fighter hit by this result

      // Normally we would shoot a ray at a cylinder, but that's kind of difficult
      // So instead, we will test 3 point along the bullet trajectory to check if has collided with the fighter or not
      for (let i = 0; i < this.Fighters.length; i++) {
        const result: TraceResult = CollisionTraceBullet(this.Fighters[i], ray);
        if (result && result.collided && this.Fighters[i].getOwnerID() !== b.getOwnerID()) { // If collision is valid and not owner
          if (result.distance < closest) { // Make sure it's closer
            closest = result.distance;
            result.hitInfo = this.Fighters[i];
            closestHit = result; // Save hit, not trace result (position does not need to be specific)
          }
        }
      }

      for (let i = 0; i < this.Props.length; i++) {
        const result: TraceResult = CollisionTraceBullet(this.Props[i], ray);
        if (result && result.collided) { // If collision is valid and not owner
          if (result.distance < closest) { // Make sure it's closer
            closest = result.distance;
            result.hitInfo = this.Props[i];
            closestHit = result; // Save hit, not trace result (position does not need to be specific)
          }
        }
      }

      if (closestHit) { // Do closest hit
        switch ((<Entity>closestHit.hitInfo).type) {
          case EntityType.Fighter: b.Hit(<Fighter>closestHit.hitInfo); break;
          default:
            if (closestHit.topFaceCollision) { // Bounce if it's the top of an object
              b.Bounce(closestHit.Position.z);
            } else { // Otherwise destroy projectile
              b.finished = true;
            }
        }
      }
    }
  }
}

export { World as default };
