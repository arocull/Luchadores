/* eslint-disable object-curly-newline */
import { Vector, Ray, TraceResult } from './math';
import Player from './Player';
import Entity from './Entity';
import Fighter from './Fighter';
import Projectile from './projectiles/Projectile';
import Prop from './props/Prop';
import Map from './Map';
import { IPlayerInputState, IPlayerDied } from '../events/events';
import { MessageBus } from '../messaging/bus';
import { FighterType, MapPreset, EntityType, GamePhase, ScoreMethod, ColliderType, Team } from './Enums';
import { Sheep, Deer, Flamingo, Soccerball } from './fighters';
import { TypeEnum } from '../events';
import { Gamemode, MakeGamemode, GamemodeType, WinStatus, ScoredGoal } from './gamemode';
/* eslint-enable object-curly-newline */


// Internal Functions //
/* eslint-disable no-param-reassign */

/**
 * @function CollisionTrace
 *
 * @summary Does a collision trace upon prop B using the movement ray of prop A
 * @description Tests object B to see if it is in the path of of object A, and then performs a collision test from prop A's trajectory onto prop B
 *
 * @param {Prop}  a   The object that is in motion
 * @param {Prop}  b   The object to test the prop A's trajectory against for collisions
 * @param {Ray}   ray Object A's trajectory, used for collision testing and detection
 *
 * @returns {TraceResult} Returns a bullet trace result, or null if the initial test failed
 */
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
/**
 * @function CollisionTraceBullet
 *
 * @summary Simple collision test and trace for bullets
 * @description Tests the object to see if it is in the path of the bullet's trajectory, and then performs a collision test on the the given prop
 *
 * @param {Prop}  a   The object to test the bullet trajectory against for collisions
 * @param {Ray}   ray The bullet trajectory used for collision testing and detection
 *
 * @returns {TraceResult} Returns a bullet trace result, or null if the initial test failed
 */
function CollisionTraceBullet(a: Prop, ray: Ray): TraceResult {
  if (ray.pointDistanceXY(a.Position) < a.Radius) { // Make sure point of projectile is along a trajectory that faces the prop
    return a.traceProp(ray, 0, true); // If so, trace prop--could potentially increase bullet thickness using the radius boost
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
  public Bullets: Projectile[];
  public Props: Prop[];
  public Map: Map;

  public doReaping: boolean;
  private kills: IPlayerDied[];

  public timer: number;
  public phase: GamePhase;
  public ruleset: Gamemode;
  private winStatus: WinStatus;

  public zonePosition: Vector;
  public zoneRadius: number;
  private totalSoccerballs: number;

  constructor(mapPreset: MapPreset = MapPreset.Sandy, loadProps: boolean = false, loadTextures: boolean = false) {
    this.Map = new Map(40, 40, 23, 10000, mapPreset);
    if (loadTextures) this.Map.loadTexture(mapPreset);

    this.Fighters = [];
    this.Bullets = [];
    this.Props = [];
    if (loadProps) {
      this.Props = this.Map.getProps(mapPreset, loadTextures);
    } else {
      this.Props = []; // Props not loaded by default
    }

    this.doReaping = false;
    this.kills = [];

    // Default to infinite freeplay
    this.timer = -1;
    this.phase = GamePhase.Freeplay;
    this.applyRuleset(MakeGamemode(GamemodeType.Deathmatch));

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
    } else { // Otherwise, just drop them in a random location on the map
      avgLocation.x = Math.random() * this.Map.Width;
      avgLocation.y = Math.random() * this.Map.Height;
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


  // Gamemodes and States //
  /**
   * @function applyRuleset
   * @summary Resets the world and applies the new ruleset
   * @param {Gamemode} newRuleset New ruleset to apply to the world state and enforce
   */
  public applyRuleset(newRuleset: Gamemode) {
    this.ruleset = newRuleset;

    if (this.ruleset.soccerballs > 0) { // Randomly place soccerballs
      for (let i = 1; i <= this.ruleset.soccerballs; i++) {
        this.totalSoccerballs++;
        this.Fighters.push(new Soccerball(-this.totalSoccerballs, new Vector(Math.random() * this.Map.Width, Math.random() * this.Map.Height, 0)));
      }
    }

    this.zonePosition = new Vector(this.Map.Width / 2, this.Map.Height / 2, 0);
    this.zoneRadius = -3; // Players are unable to be registered as "inside the zone" this way
    if (newRuleset.scoreMethod === ScoreMethod.Zone) this.zoneRadius = 3; // Radius of three units
    else if (newRuleset.scoreMethod === ScoreMethod.Goals) {
      // BUILD RED GOAL
      // Load in goals as physical props
      const gr1 = new Prop(new Vector(this.Map.Width * 0.05 - 0.025, this.Map.Height * 0.5 - 1, 0), ColliderType.Prism, 0.05, 1.5, 2); // Back wall
      // Top--Currently depth position of box is the very bottom--not sure why, will have to fix in the future
      const gr2 = new Prop(new Vector(this.Map.Width * 0.05 + 0.5, this.Map.Height * 0.5 - 1, 1.5), ColliderType.Prism, 1, 0.05, 2);
      // Goal sides
      const gr3 = new Prop(new Vector(this.Map.Width * 0.05 + 0.5, this.Map.Height * 0.5 - 1.025, 0), ColliderType.Prism, 1, 1.5, 0.05);
      const gr4 = new Prop(new Vector(this.Map.Width * 0.05 + 0.5, this.Map.Height * 0.5 + 1.025, 0), ColliderType.Prism, 1, 1.5, 0.05);
      // Bounding box (scores happen here)
      const grBounds = new Prop(new Vector(this.Map.Width * 0.05 + 0.5, this.Map.Height * 0.5 - 1, 0), ColliderType.Prism, 1, 1.5, 2);
      gr1.BounceBack = 1.8; // Make sure things don't get stuck inside the goal (otherwise acts as a momentum black hole)
      gr2.BounceBack = 1.8;
      gr3.BounceBack = 1.8;
      gr4.BounceBack = 1.8;
      // Set textures (no back wall texture)
      gr2.SetTexture('Sprites/Soccer/GoalTop_Red.png');
      gr3.SetTexture('Sprites/Soccer/GoalSide_Red.png');
      gr4.SetTexture('Sprites/Soccer/GoalSide_Red.png');

      this.Props.push(gr1, gr2, gr3, gr4); // Add to world props
      this.ruleset.goals.push(grBounds); // Add goal to ruleset for score keeping

      // Time for Blue!
      const gb1 = new Prop(new Vector(this.Map.Width * 0.95 + 0.025, this.Map.Height * 0.5 - 1, 0), ColliderType.Prism, 0.05, 1.5, 2); // Back wall
      const gb2 = new Prop(new Vector(this.Map.Width * 0.95 - 0.5, this.Map.Height * 0.5 - 1, 1.5), ColliderType.Prism, 1, 0.05, 2); // Top
      const gb3 = new Prop(new Vector(this.Map.Width * 0.95 - 0.5, this.Map.Height * 0.5 - 1.025, 0), ColliderType.Prism, 1, 1.5, 0.05); // Sides
      const gb4 = new Prop(new Vector(this.Map.Width * 0.95 - 0.5, this.Map.Height * 0.5 + 1.025, 0), ColliderType.Prism, 1, 1.5, 0.05);
      const gbBounds = new Prop(new Vector(this.Map.Width * 0.95 - 0.5, this.Map.Height * 0.5 - 1, 0), ColliderType.Prism, 1, 1.5, 2);
      gb1.BounceBack = 1.8; // Bounceback
      gb2.BounceBack = 1.8;
      gb3.BounceBack = 1.8;
      gb4.BounceBack = 1.8;
      // Set textures (no back wall texture for Blue either)
      gb2.SetTexture('Sprites/Soccer/GoalTop_Blue.png');
      gb3.SetTexture('Sprites/Soccer/GoalSide_Blue.png');
      gb4.SetTexture('Sprites/Soccer/GoalSide_Blue.png');
      this.Props.push(gb1, gb2, gb3, gb4); // Add to world props
      this.ruleset.goals.push(gbBounds); // Add goal to ruleset for score keeping

      // 3+ teams with soccer is a WIP
      if (newRuleset.teams > 2) { // Build green goal if there are more than 2 teams
        const gg1 = new Prop(new Vector(this.Map.Height * 0.5 + 1, this.Map.Height * 0.95 - 0.025, 0), ColliderType.Prism, 2, 1.5, 0.05); // Back wall
        const gg2 = new Prop(new Vector(this.Map.Width * 0.5, this.Map.Height * 0.95 - 1, 1.5), ColliderType.Prism, 2, 0.05, 1); // Top
        const gg3 = new Prop(new Vector(this.Map.Width * 0.5 - 1.025, this.Map.Height * 0.95 - 1, 0), ColliderType.Prism, 0.05, 1.5, 1); // Sides
        const gg4 = new Prop(new Vector(this.Map.Width * 0.5 + 1.025, this.Map.Height * 0.95 - 1, 0), ColliderType.Prism, 0.05, 1.5, 1);
        const ggBounds = new Prop(new Vector(this.Map.Width * 0.5 - 1, this.Map.Height * 0.95 - 1, 0), ColliderType.Prism, 1, 1.5, 2);
        gg1.BounceBack = 1.8;
        gg2.BounceBack = 1.8;
        gg3.BounceBack = 1.8;
        gg4.BounceBack = 1.8;
        gg1.SetTexture('Sprites/Soccer/GoalTop_Green.png');
        gg2.SetTexture('Sprites/Soccer/GoalTop_Green.png');
        gg3.SetTexture('Sprites/Soccer/GoalSide_Green.png');
        gg4.SetTexture('Sprites/Soccer/GoalSide_Green.png');
        this.Props.push(gg1, gg2, gg3, gg4); // Add to world props
        this.ruleset.goals.push(ggBounds); // Add goal to ruleset for score keeping
      }
    }

    this.timer = 15;
    this.phase = GamePhase.Join;
  }


  /**
   * @function reapKills
   * @summary Returns a list of IPlayerDied events for every fighter that has died.
   * If reaping is enabled, dead fighters are removed from the Fighters list.
   * @returns {IPlayerDied[]} List of death events that occurred since last reaping
   */
  public reapKills(): IPlayerDied[] {
    const killList = this.kills;
    this.kills = [];

    return killList;
  }


  // Normal World Things //

  /**
   * @function tick
   * @summary Run all general world-tick functions
   * @param {number} DeltaTime Time since last tick in seconds
   * @param {boolean} latencyChecks Used to cap certain values that may otherwise act in unexpected ways in a high-latency settings; for client use only
   */
  public tick(DeltaTime: number, latencyChecks: boolean = false) {
    this.doUpdates(DeltaTime, latencyChecks);
    this.TickPhysics(DeltaTime);

    if (this.phase === GamePhase.Overtime) { // Count up from zero when overtime is in progress
      this.timer += DeltaTime;
    } else if (this.timer > 0) { // Otherwise, count down
      this.timer -= DeltaTime;
      if (this.timer < 0 && this.timer !== -1) this.timer = 0;
    }
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
      console.log(ray.direction, ' trace dir, bullet dir ', b.Velocity);

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


  // Score Tracking //
  /**
   * @function scoreZone
   * @summary Returns all fighters within the zone that can score points
   */
  public getZoneControllers(): Fighter[] {
    const inZone: Fighter[] = [];
    for (let i = 0; i < this.Fighters.length; i++) {
      if (
        Vector.DistanceXY(this.Fighters[i].Position, this.zonePosition) <= this.zoneRadius
        && this.Fighters[i].getOwnerID() > 0
        && this.Fighters[i].HP > 0
        && !this.Fighters[i].isFalling()
      ) {
        inZone.push(this.Fighters[i]);
      }
    }
    return inZone;
  }

  /**
   * @function getGoals
   * @summary Returns all valid fighters with soccerballs currently in goals that are not their own
   * @returns {Fighter[]} List of fighters that scored goals this tick
   */
  public getGoals(): ScoredGoal[] {
    const goals: ScoredGoal[] = [];
    let destructs = 0;

    for (let i = 0; i < this.Fighters.length; i++) {
      if (this.Fighters[i].getCharacter() === FighterType.Soccerball) {
        const ball = <Soccerball>(this.Fighters[i]); // First, grab the soccerball

        for (let g = 0; g < this.ruleset.goals.length; g++) { // Check all exsting goals
          const goalTeam: Team = g + 1; // Team who owns this goal
          if (this.ruleset.goals[g].isPointInside(ball.Position, ball.Radius / 2)) { // Is the ball inside of the goal?
            ball.HP = 0; // If so, destroy the ball
            destructs++;

            if (ball.getLastAttacker() && ball.getLastAttacker().Team !== goalTeam) { // Only count it as a goal if it wasn't scored on its own team
              goals.push(new ScoredGoal(ball, ball.getLastAttacker(), ball.getLastAttacker().Team));
            }
          }
        }
      }
    }

    // Spawn new soccerballs for the ones we're losing
    for (let i = 1; i <= destructs; i++) {
      this.totalSoccerballs++;
      this.Fighters.push(new Soccerball(-this.totalSoccerballs, new Vector(Math.random() * this.Map.Width, Math.random() * this.Map.Height, 0)));
    }

    return goals; // No functionality yet
  }
}

export { World as default };
