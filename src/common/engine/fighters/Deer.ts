import Vector from '../Vector';
import Fighter from '../Fighter';
import { FighterType } from '../Enums';
import BBullet from '../projectiles/Bullet';
import { MessageBus } from '../../messaging/bus';
import Random from '../Random';

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

  constructor(id: number, position: Vector) {
    super(100, 100, 2000, 0.45, 1.05, 17, 30, FighterType.Deer, id, position);

    this.bulletCooldownBase = 0.125;
    this.bulletCooldownTime = this.bulletCooldownBase;
    this.boostTimer = 0;
  }

  public EarnKill() {
    super.EarnKill();

    this.bulletCooldownTime = 0.03;
    this.boostTimer += 2;
  }

  public fireBullet(): BBullet {
    this.BulletShock += this.bulletCooldownTime * 10;
    this.BulletCooldown += this.bulletCooldownTime;

    const aim = Vector.Clone(this.AimDirection);
    if (aim.x < 0) this.Flipped = true;
    else if (aim.x > 0) this.Flipped = false;

    const fireVelo = Vector.Clone(this.Velocity); // Take sample now to ignore recoil
    if (this.riding) {
      fireVelo.x += this.riding.Velocity.x;
      fireVelo.y += this.riding.Velocity.y;
      aim.z = -this.riding.Height / 10;
      aim.clamp(1, 1);
    }
    fireVelo.x /= 3;
    fireVelo.y /= 3;
    fireVelo.z *= -1;

    if (this.boostTimer > 0) {
      aim.x += ((Random.getFloat() - 0.5) * this.boostTimer) / 3;
      aim.y += ((Random.getFloat() - 0.5) * this.boostTimer) / 3;
      aim.clamp(1, 1);

      if (this.riding) { // Apply recoil to rider to prevent kill reward from dismounting rider
        this.riding.Velocity = Vector.Add(this.riding.Velocity, Vector.Multiply(aim, -this.boostTimer));
      } else {
        this.Velocity = Vector.Add(this.Velocity, Vector.Multiply(aim, -this.boostTimer));
      }
    }

    const firePos = Vector.Clone(this.Position);
    firePos.z += this.Height * (2 / 3);
    if (this.Flipped === true) firePos.x -= this.Radius;
    else firePos.x += this.Radius;

    const bullet = new BBullet(firePos, aim, this);
    bullet.Velocity = Vector.Add(bullet.Velocity, fireVelo);

    MessageBus.publish('NewProjectile', bullet);
    return bullet;
  }

  public tickCooldowns(DeltaTime: number) {
    super.tickCooldowns(DeltaTime);

    if (this.boostTimer > 0) {
      this.boostTimer -= DeltaTime;
      if (this.boostTimer <= 0) {
        this.boostTimer = 0;
        this.bulletCooldownTime = this.bulletCooldownBase;
      }
    }
  }
}

export { Deer as default };