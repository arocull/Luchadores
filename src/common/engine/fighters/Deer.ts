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
    super(100, 100, 2000, 0.5, 1, 14, 30, FighterType.Deer, id, position);
  }

  public fireBullet(): BBullet {
    this.BulletShock += 1.2;
    this.BulletCooldown += 0.125;

    const bullet = new BBullet(this.Position, this.AimDirection, this);
    MessageBus.publish('NewProjectile', bullet);
    return bullet;
  }
}

export { Deer as default };