import Vector from '../Vector';
import Fighter from '../Fighter';

// La Oveja Grande - A tanky character that deals damage primarily off of momentum exchange (running into people at high velocities)
class Sheep extends Fighter {
  constructor(id: number, position: Vector) {
    super(200, 200, 8000, 0.5, 1, 8, 20, 'Sheep', id, position);
    this.ranged = false;
  }

  public CollideWithFighter(hit: Fighter, momentum: number) {
    super.CollideWithFighter(hit, momentum);

    if (momentum > this.MaxMomentum / 3) {
      hit.TakeDamage((momentum / this.MaxMomentum) * 40, this);
    }
  }
}

export { Sheep as default };
