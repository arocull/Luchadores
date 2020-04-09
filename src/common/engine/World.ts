import Vector from './Vector';
import Player from './Player';
import Fighter from './Fighter';
import Projectile from './projectiles/Projectile';
import Map from './Map';
import { IPlayerInputState, IPlayerDied } from '../events/events';
import { MessageBus } from '../messaging/bus';
import { FighterType } from './Enums';
import { Sheep, Deer, Flamingo } from './fighters';
import { TypeEnum } from '../events';

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
  public Map: Map;

  private kills: IPlayerDied[];

  constructor() {
    this.Map = new Map(50, 50, 10, 'Maps/Arena.png');

    this.Fighters = [];
    this.Bullets = [];

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
  // Note that DeltaTime should be in seconds
  public tick(DeltaTime: number) {
    this.doUpdates(DeltaTime);
    this.TickPhysics(DeltaTime);
  }

  // Do various updates that are not realted to physics
  public doUpdates(DeltaTime: number) {
    for (let i = 0; i < this.Fighters.length; i++) {
      const a = this.Fighters[i];

      a.tickCooldowns(DeltaTime);
      a.tryBullet(); // Fire bullets (bullets are automatically added to list with events)

      // If they are dead, add them to the kill list, then remove them from future interactions
      if (a.HP <= 0) {
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
      const maxSpeed = obj.MaxMomentum / obj.Mass;

      // First, apply any potential accelerations due to physics, start with friction as base for optimization
      let accel = new Vector(0, 0, 0);

      // Gravity
      if (obj.Position.z > 0 || obj.Velocity.z > 0) accel.z += -50;

      // If fighter is out of bounds, bounce them back (wrestling arena has elastic walls), proportional to distance outward
      if (obj.Position.x < 0) accel.x += this.Map.wallStrength * Math.abs(obj.Position.x);
      else if (obj.Position.x > this.Map.Width) accel.x -= this.Map.wallStrength * (obj.Position.x - this.Map.Width);

      if (obj.Position.y < 0) accel.y += this.Map.wallStrength * Math.abs(obj.Position.y);
      else if (obj.Position.y > this.Map.Height) accel.y -= this.Map.wallStrength * (obj.Position.y - this.Map.Height);

      // Note friction is Fn(or mass * gravity) * coefficient of friction, then force is divided by mass for accel
      if (obj.Position.z <= 0) {
        const leveled = new Vector(obj.Velocity.x, obj.Velocity.y, 0);
        const frict = Vector.Multiply(Vector.UnitVector(leveled), -this.Map.Friction).clamp(0, obj.Velocity.length() * 3);
        accel = Vector.Add(accel, frict);
      }


      // Add physics-based acceleration and player input acceleration, and then calculate position change
      accel = Vector.Add(obj.Acceleration, accel);
      let deltaX = Vector.Add(
        Vector.Multiply(accel, (DeltaTime ** 2) / 2),
        Vector.Multiply(obj.Velocity, DeltaTime),
      );

      // If they attempted to move faster than their max momentum, clamp their movement (should do this?)
      if (deltaX.length() > maxSpeed * DeltaTime) {
        deltaX = Vector.Multiply(Vector.UnitVector(deltaX), maxSpeed * DeltaTime);
      }

      obj.Position = Vector.Add(obj.Position, deltaX);
      obj.Velocity = Vector.Add(obj.Velocity, Vector.Multiply(accel, DeltaTime));

      // Terminal velocity
      if (obj.Velocity.length() > maxSpeed) {
        obj.Velocity = Vector.Multiply(Vector.UnitVector(obj.Velocity), maxSpeed);
      }

      if (obj.Acceleration.x < -1) obj.Flipped = true;
      else if (obj.Acceleration.x > 1) obj.Flipped = false;

      if (obj.Position.z < 0) {
        obj.Position.z = 0;
        obj.Velocity.z = 0;
      }
    }

    // Tick bullets
    for (let i = 0; i < this.Bullets.length; i++) {
      if (this.Bullets[i].finished) { // Remove despawning bullets
        this.Bullets.splice(i, 1);
        i--;
      } else this.Bullets[i].Tick(DeltaTime); // Otherwise, tick bullet physics
    }

    // Compute collisions last after everything has moved (makes it slightly more "fair?")
    // Should we do raycasts from previous positions to make sure they do not warp through eachother and avoid collision?
    //      - Note: This is only an issue if DeltaTime and Velocity are too great
    for (let i = 0; i < this.Fighters.length; i++) {
      const a = this.Fighters[i];

      // Fighter collisions
      for (let j = i + 1; j < this.Fighters.length; j++) { // If the entity was already iterated through by main loop, should not need to do it again
        const b = this.Fighters[j];
        const separation = Vector.DistanceXY(a.Position, b.Position);
        const rad = a.Radius + b.Radius;
        if (
          separation <= rad // First check if they're inside each other
          && ( // Then check to make sure collision heights are within each other
            (a.Position.z <= b.Position.z + b.Height && a.Position.z >= b.Position.z)
            || (b.Position.z <= a.Position.z + a.Height && b.Position.z >= a.Position.z)
          )
        ) { // If they are within collision range...
          const moment1 = a.Velocity.length() * a.Mass; // Momentum of fighter A
          const moment2 = b.Velocity.length() * b.Mass; // Momentum of fighter B

          a.CollideWithFighter(b, moment1); // Trigger collision events
          b.CollideWithFighter(a, moment2);

          // Momentum Transfer--should we swap momentums or sum them (essentially, what collision do we want)
          const aVelo = Vector.Multiply(Vector.UnitVector(b.Velocity), moment2 / a.Mass);
          b.Velocity = Vector.Multiply(Vector.UnitVector(a.Velocity), moment1 / b.Mass);
          a.Velocity = aVelo;

          // Slight bounceback on air collisions used to prevent characters from getting stuck in eachother
          if (a.Position.z > b.Position.z + b.Height / 2) { // A landed on B
            const separate = Vector.UnitVector(Vector.Subtract(b.Position, a.Position));
            a.Velocity = Vector.Subtract(a.Velocity, Vector.Multiply(separate, 150 / a.Mass));
            b.Velocity = Vector.Add(b.Velocity, Vector.Multiply(separate, 150 / a.Mass));
            a.Position.z = b.Position.z + b.Height;
            a.JustLanded = true; // Allows jump
          } else if (b.Position.z > a.Position.z + a.Height / 2) { // B landed on A
            const separate = Vector.UnitVector(Vector.Subtract(b.Position, a.Position));
            a.Velocity = Vector.Subtract(a.Velocity, Vector.Multiply(separate, 150 / a.Mass));
            b.Velocity = Vector.Add(b.Velocity, Vector.Multiply(separate, 150 / a.Mass));
            b.Position.z = a.Position.z + a.Height;
            b.JustLanded = true; // Allows jumping
          } else { // Otherwise just force them apart
            const separate = Vector.UnitVectorXY(Vector.Subtract(b.Position, a.Position));
            a.Position = Vector.Subtract(a.Position, Vector.Multiply(separate, (rad - separation) / 2));
            b.Position = Vector.Add(b.Position, Vector.Multiply(separate, (rad - separation) / 2));
          }
        }
      }
    }

    // Bullet collisions
    for (let j = 0; j < this.Bullets.length; j++) {
      const b = this.Bullets[j];

      const start = Vector.Subtract(b.Position, b.DeltaPosition);
      const len = b.DeltaPosition.length();
      const dir = Vector.UnitVector(b.DeltaPosition);

      // Normally we would shoot a ray at a cylinder, but that's kind of difficult
      // So instead, we will test 3 point along the bullet trajectory to check if has collided with the fighter or not
      for (let i = 0; i < this.Fighters.length; i++) {
        const a = this.Fighters[i];
        for (let q = 0; q < 3; q++) {
          const pos = Vector.Add(start, Vector.Multiply(dir, q * (len / 3)));
          if (
            Vector.DistanceXY(a.Position, pos) <= a.Radius
            && pos.z >= a.Position.z
            && pos.z <= a.Position.z + a.Height
          ) {
            b.Hit(a);
            break;
          }
        }
      }
    }
  }
}

export { World as default };