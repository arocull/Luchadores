import Vector from '../Vector';
import Fighter from '../Fighter';

// La Oveja Grande - A tanky character that deals damage primarily off of momentum exchange (running into people at high velocities)
class Sheep extends Fighter {
  constructor(id: number, position: Vector) {
    super(500, 200, 8000, 0.5, 1, 8, 'Sheep', id, position);
  }

  public CollideWithFighter(hit: Fighter, momentum: number) {
    super.CollideWithFighter(hit, momentum);

    if (momentum > this.MaxMomentum / 3) {
      hit.TakeDamage((momentum / this.MaxMomentum) * 40);
    }
  }
}

export { Sheep as default };
