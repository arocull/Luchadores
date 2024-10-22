import { Vector, Ray, TraceResult } from './math';
import Player from './Player';
import Entity from './Entity';
import Fighter from './Fighter';
import Projectile from './projectiles/Projectile';
import AOEBlast from './combat/AOEBlast';
import Prop from './props/Prop';
import { MMap } from './maps/index';
import { IPlayerInputState, IPlayerDied } from '../events/events';
import { FighterType, EntityType } from './Enums';
import { Sheep, Deer, Flamingo } from './fighters';
import { TypeEnum } from '../events';
import { CollisionTrace, CollisionTraceBullet, CollideFighters } from './math/Collision';
import { SubscriberContainer } from '../messaging/container';

/**
 * @class
 * @name World
 *
 * @summary Manages bullets and fighters
 *
 * @description General flow of things:
 * - Apply player inputs
 * - Fire bullets and handle character updates
 * - Tick physics
 * - Check for deaths
 * - Distribute updates
 *
 */
class World {
  public static MAX_LOBBY_SIZE: number = 20;

  public Fighters: Fighter[];
  private fightersByIDs: Map<number, Fighter>;
  public Bullets: Projectile[];
  public aoeAttacks: AOEBlast[];
  public Props: Prop[];
  public Map: MMap; // TODO: Make this private so 'Map' is read-only

  public doReaping: boolean;
  private kills: IPlayerDied[];

  private subscribers: SubscriberContainer = new SubscriberContainer();

  constructor(map: MMap) {
    this.Map = map;

    this.Fighters = [];
    this.fightersByIDs = new Map<number, Fighter>();
    this.Bullets = [];
    this.aoeAttacks = [];

    this.Props = this.map.getProps(); // Always load in props

    this.doReaping = false;
    this.kills = [];

    this.subscribers.attach('NewProjectile', (message) => {
      this.Bullets.push(message as Projectile);
    });
    this.subscribers.attach('AOE_Blast', (message) => {
      this.aoeAttacks.push(message as AOEBlast);
    });
  }
  /**
   * @function deconstruct
   * @summary Unsubscribes all message bus subscribers to prevent memory leaks
   */
  public deconstruct() {
    this.subscribers.detachAll();
  }

  // Make map read-only
  public get map(): MMap {
    return this.Map;
  }

  /**
   * @summary Registers a fighter with the world, adding it to both appropiate arrays
   * @param {Fighter} newFighter Fighter object to register with the world
   */
  public registerFighter(newFighter: Fighter) {
    this.Fighters.push(newFighter);
    this.fightersByIDs.set(newFighter.getOwnerID(), newFighter);
  }
  public registerFighters(...items: Fighter[]) {
    for (let i = 0; i < items.length; i++) {
      this.registerFighter(items[i]);
    }
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
      char.Jump(false, this.Fighters); // Jump
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
      avgLocation.x = this.map.width - avgLocation.x;
      avgLocation.y = this.map.height - avgLocation.y;
      avgLocation.z = 0;
    } else { // Otherwise, just drop them in the middle of the map
      avgLocation.x = this.map.width / 2;
      avgLocation.y = this.map.height / 2;
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

    this.registerFighter(fight);

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
        this.fightersByIDs.delete(a.getOwnerID());
        i--;
      }
    }

    // Move through all AOE's until array length hits zero (do not index through and reset array in case more are added during run time)
    while (this.aoeAttacks.length > 0) {
      const aoe = this.aoeAttacks.pop(); // Pop out item from array
      if (aoe) aoe.apply(this.Fighters); // Apply AOE damage
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
        if (obj.Position.x < 0) accel.x += this.map.wallStrength * Math.abs(obj.Position.x);
        else if (obj.Position.x > this.map.width) accel.x -= this.map.wallStrength * (obj.Position.x - this.map.width);

        if (obj.Position.y < 0) accel.y += this.map.wallStrength * Math.abs(obj.Position.y);
        else if (obj.Position.y > this.map.height) accel.y -= this.map.wallStrength * (obj.Position.y - this.map.height);

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
            force * this.map.friction,
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
        obj.Land(-obj.Velocity.z);
        obj.Velocity.z = 0;
      }

      // Clear ridership for current frame--if they sink into whoever they're riding, they'll collide and this will be reset
      obj.riding = null;
      obj.passengerMass = 0;
      obj.passengerMaxMomentum = 0;
      obj.onSurface = false; // Don't claim they're on a prop until they collide again
      obj.dismountRider = false;
    }

    // Tick fighter constraints
    for (let x = 0; x < this.Fighters.length; x++) {
      // eslint-disable-next-line prefer-destructuring
      const constraints = this.Fighters[x].constraints;
      for (let y = 0; y < constraints.length; y++) {
        const bind = constraints[y];
        const instigator = this.fightersByIDs.get(bind.owner);

        // If our instigator does not exist or the bind has completed remove it
        if (bind.completed() || instigator == null) {
          this.Fighters[x].constraintRemove(bind);
          y--;
        } else {
          bind.tick(DeltaTime, this.Fighters[x], instigator);
        }
      }
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
        if (!(j === i || a.lastCollision === b || b.lastCollision === a || b.Position.z > a.Position.z) && a.canCollideWith(b) && b.canCollideWith(a)) {
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

      // First, check collisions on all fighters
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

      // Then check collisions on all props
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
