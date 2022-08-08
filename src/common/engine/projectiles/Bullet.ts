import Vector from '../Vector';
import Fighter from '../Fighter';
import Projectile from './Projectile';
import { ProjectileType } from '../Enums';
import { MessageBus } from '../../messaging/bus';

// BFire - Type bullet of variant Fire
class BBullet extends Projectile {
  constructor(position: Vector, direction: Vector, owner: Fighter) {
    super(ProjectileType.Bullet, owner, 7.5, 2, position, Vector.Multiply(direction, 50));
  }

  public Hit(hit: Fighter) {
    super.Hit(hit);
    if (this.finished) {
      MessageBus.publish('Audio_BulletWhizz', { pos: this.Position, obj: hit });
    }
  }
}

export { BBullet as default };