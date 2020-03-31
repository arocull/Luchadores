import Vector from '../Vector';
import Fighter from '../Fighter';
import Projectile from './Projectile';
import { ProjectileType } from '../Enums';

// BFire - Type bullet of variant Fire
class BFire extends Projectile {
  constructor(position: Vector, direction: Vector, owner: Fighter) {
    super(ProjectileType.Fire, owner, 5, 1, position, Vector.Multiply(direction, 6));
    this.BounceReturn = 0;
    // this.Acceleration.z = 0.025;

    this.RenderStyle = '#f0e055';
    this.Width = 0.4;
  }
}

export { BFire as default };