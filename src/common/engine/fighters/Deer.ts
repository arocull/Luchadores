import Vector from '../Vector';
import Fighter from '../Fighter';
import { FighterType } from '../Enums';
import BBullet from '../projectiles/Bullet';
import { MessageBus } from '../../messaging/bus';
import Random from '../Random';
import { CSuplex } from '../constraints';

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
- Bullet Index

Deer's traits:
- Medium health and mass
- Medium max velocity
- Short and wide
- High move acceleration
- Medium jump height
- Slight air control

*/
class Deer extends Fighter {
  private bulletCooldownBase: number;
  private bulletCooldownTime: number;

  private baseMaxMomentum: number;

  private bulletIndex: number; // Used for tracking which side of deer the bullet should be fired from
  private bulletDisparity: number; // Difference in gun nozzle positions
  private grabDistance: number;
  private suplexJumpBoost: number;
  private suplexJumpBoostBase: number;

  constructor(id: number, position: Vector) {
    super(100, 100, 2000, 0.55, 1.05, 17, 40, 0.2, FighterType.Deer, id, position);
    // 100 kg, top speed of 20 units per second

    this.bulletCooldownBase = 0.14;
    this.bulletCooldownTime = this.bulletCooldownBase;

    this.baseMaxMomentum = this.MaxMomentum;
    this.bulletIndex = 0;
    this.bulletDisparity = 0.6 * this.Radius;
    this.grabDistance = this.Radius * 2.2;
    this.suplexJumpBoostBase = 1.5; // Base multiplier to jump velocity when suplexing
    this.suplexJumpBoost = 1; // Additional multiplier, applied when in kill effect

    this.getSpecialNumber = this.getBulletIndex;
  }

  public EarnKill() {
    super.EarnKill();

    this.bulletCooldownTime = 0.055;
    this.suplexJumpBoost = 2;
    this.boostTimer += 2;
  }

  protected jumpInternal(jumpVelocity: number, fighters: Fighter[]): void {
    if (fighters.length > 0) {
      let nearest: Fighter = null;
      let nearestDist: number = 1000000.0;

      for (let i = 0; i < fighters.length; i++) {
        const candidate = fighters[i];
        // Cannot grab falling fighters, ourself, or fighters we are riding
        if (!candidate.isFalling() && candidate !== this && candidate !== this.riding) {
          const dist = Vector.Distance(this.Position, candidate.Position) - candidate.Radius;
          if (dist < nearestDist) {
            nearestDist = dist;
            nearest = candidate;
          }
        }
      }

      // If we found a valid grab candidate, perform a suplex and suplex jump
      if (nearest && nearestDist < this.grabDistance) {
        const suplex = new CSuplex(this.getOwnerID(), nearest.Position.x < this.Position.x);
        nearest.constraintAdd(suplex);
        nearest.dismountRider = true;
        // Jump with some additional velocity boosting
        super.jumpInternal(jumpVelocity * this.suplexJumpBoost * this.suplexJumpBoostBase, fighters);
        return;
      }
    }
    // Otherwise, use default jump
    super.jumpInternal(jumpVelocity, fighters);
  }

  public fireBullet(): BBullet {
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
        stackBottom.Velocity = Vector.Add(stackBottom.Velocity, Vector.Multiply(aim, -this.boostTimer * 3));
      } else {
        this.Velocity = Vector.Add(this.Velocity, Vector.Multiply(aim, -this.boostTimer));
      }
    }

    let firePos = Vector.Clone(this.Position);
    firePos.z += this.Height * 0.8;
    if (this.Flipped === true) firePos.x -= this.Radius / 1.3;
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
    MessageBus.publish('Audio_General', {
      sfxName: 'Deer/Gunshot',
      pos: this.Position,
      vol: 0.25,
      owner: this,
    });
    MessageBus.publish(`CameraShake${this.getOwnerID()}`, {
      amnt: this.bulletCooldownTime * 9,
      max: 10,
    });
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
    this.suplexJumpBoost = 1.0;
  }

  // Special variable getters/setters
  public getBulletIndex(): number {
    return this.bulletIndex;
  }
  public setBulletIndex(newIndex: number) {
    this.bulletIndex = newIndex;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public setSpecialStates(num: number, bool: boolean) {
    this.bulletIndex = num;
  }
}

export { Deer as default };