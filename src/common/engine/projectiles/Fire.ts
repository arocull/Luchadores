import Vector from '../Vector';
import Fighter from '../Fighter';
import Projectile from './Projectile';

// BFire - Type bullet of variant Fire
class BFire extends Projectile {
  constructor(position: Vector, direction: Vector, owner: Fighter) {
    super('Fire', owner, 5, 0.5, position, Vector.Multiply(direction, 3));
    this.BounceReturn = 0;
    this.RenderStyle = '#f0e055';
    this.Width = 3;
  }
}

export { BFire as default };