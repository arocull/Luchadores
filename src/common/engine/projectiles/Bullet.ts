import Vector from '../Vector';
import Fighter from '../Fighter';
import Projectile from './Projectile';
import { ProjectileType } from '../Enums';

// BFire - Type bullet of variant Fire
class BBullet extends Projectile {
  constructor(position: Vector, direction: Vector, owner: Fighter) {
    super(ProjectileType.Bullet, owner, 5, 1, position, Vector.Multiply(direction, 20));
  }
}

export { BBullet as default };