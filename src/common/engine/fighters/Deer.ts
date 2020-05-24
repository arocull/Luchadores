import Vector from '../Vector';
import Fighter from '../Fighter';
import { FighterType } from '../Enums';
import BBullet from '../projectiles/Bullet';
import { MessageBus } from '../../messaging/bus';
import Random from '../Random';

const PIOverTwo = Math.PI / 2;

/* Deer - A general all-around character who can jump high and fire a constant stream of bullets

Properties that need to be replicated from server to client:
- Class Type
- Player ID
- Position
- Velocity
- Acceleration
- Firing
- Aim Direction

*/
class Deer extends Fighter {
  private bulletCooldownBase: number;
  private bulletCooldownTime: number;

  private baseMaxMomentum: number;

  private bulletIndex: number; // Used for tracking which side of deer the bullet should be fired from
  private bulletDisparity: number; // Difference in gun nozzle positions

  constructor(id: number, position: Vector) {
    super(100, 100, 2000, 0.45, 1.05, 17, 40, FighterType.Deer, id, position);

    this.bulletCooldownBase = 0.08;
    this.bulletCooldownTime = this.bulletCooldownBase;

    this.baseMaxMomentum = this.MaxMomentum;
    this.bulletIndex = 0;
    this.bulletDisparity = 0.6 * this.Radius;
  }

  public EarnKill() {
    super.EarnKill();

    this.bulletCooldownTime = 0.03;
    this.boostTimer += 2;
  }

  public fireBullet(): BBullet {
    this.BulletShock += this.bulletCooldownTime * 10;
    this.BulletCooldown += this.bulletCooldownTime;
    this.bulletIndex++;

    const aim = Vector.Clone(this.AimDirection);
    if (aim.x < 0) this.Flipped = true;
    else if (aim.x > 0) this.Flipped = false;

    if (this.Position.z > 0) {
      aim.z = this.Position.z * (-0.05);
      aim.clamp(1, 1);
    }

    const stackBottom = this.getBottomOfStack();
    if (stackBottom) {
      aim.z -= this.Position.z / 10;
      aim.clamp(1, 1);
    }

    if (this.boostTimer > 0) {
      aim.x += ((Random.getFloat() - 0.5) * this.boostTimer) / 3;
      aim.y += ((Random.getFloat() - 0.5) * this.boostTimer) / 3;
      aim.clamp(1, 1);

      if (stackBottom) { // Apply recoil to rider to prevent kill reward from dismounting rider
        stackBottom.Velocity = Vector.Add(stackBottom.Velocity, Vector.Multiply(aim, -this.boostTimer));
      } else {
        this.Velocity = Vector.Add(this.Velocity, Vector.Multiply(aim, -this.boostTimer));
      }
    }

    let firePos = Vector.Clone(this.Position);
    firePos.z += this.Height * 0.8;
    if (this.Flipped === true) firePos.x -= this.Radius;
    else firePos.x += this.Radius;

    firePos = Vector.Add(
      firePos,
      Vector.Multiply(
        Vector.UnitVectorFromAngle(Vector.ConstrainAngle(Vector.AngleFromXY(aim) + PIOverTwo)), // Rotate vector 90 degrees
        ((this.bulletIndex % 2) - 0.5) * this.bulletDisparity, // Difference in gun nozzle positions
      ),
    );

    const bullet = new BBullet(firePos, aim, this);

    MessageBus.publish('NewProjectile', bullet);
    MessageBus.publish(`Animation_FireBullet${this.getOwnerID()}`, bullet);
    return bullet;
  }

  public tickCooldowns(DeltaTime: number) {
    super.tickCooldowns(DeltaTime);

    if (this.BulletCooldown > 0 && !(this.boostTimer > 0)) {
      this.MaxMomentum = this.baseMaxMomentum * 0.5; // Limit movement speed to two thirds if firing and not in boost
    } else { // Otherwise return to normal
      this.MaxMomentum = this.baseMaxMomentum;
    }
  }

  protected boostEnded() {
    this.bulletCooldownTime = this.bulletCooldownBase;
  }

  // Special variable getters/setters
  public getBulletIndex(): number {
    return this.bulletIndex;
  }
  public setBulletIndex(newIndex: number) {
    this.bulletIndex = newIndex;
  }
}

export { Deer as default };