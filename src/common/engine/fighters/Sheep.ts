import Vector from '../Vector';
import Fighter from '../Fighter';

// La Oveja Grande - A tanky character that deals damage primarily off of momentum exchange (running into people at high velocities)
class Sheep extends Fighter {
  constructor(id: number, position: Vector) {
    super(500, 200, 500, 0.5, 1, 8, 'Sheep', id, position);
  }
}

export { Sheep as default };
