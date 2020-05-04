import Vector from '../Vector';
import Fighter from '../Fighter';
import { FighterType } from '../Enums';
import BBullet from '../projectiles/Bullet';
import { MessageBus } from '../../messaging/bus';

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
  constructor(id: number, position: Vector) {
    super(100, 100, 2000, 0.45, 1.05, 17, 30, FighterType.Deer, id, position);
  }

  public fireBullet(): BBullet {
    this.BulletShock += 1.2;
    this.BulletCooldown += 0.125;

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

    const firePos = Vector.Clone(this.Position);
    firePos.z += this.Height * (2 / 3);
    if (this.Flipped === true) firePos.x -= this.Radius;
    else firePos.x += this.Radius;

    const bullet = new BBullet(firePos, aim, this);
    bullet.Velocity = Vector.Add(bullet.Velocity, fireVelo);

    MessageBus.publish('NewProjectile', bullet);
    return bullet;
  }
}

export { Deer as default };