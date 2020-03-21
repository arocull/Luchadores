import Vector from '../../common/engine/Vector';
import Particle from './Particle';

class PSmashEffect extends Particle {
  constructor(position: Vector, intensity: number) {
    const outwardDir = Vector.UnitVector(new Vector(Math.random() - 0.5, 0, Math.random()));
    const start = Vector.Add(position, Vector.Multiply(outwardDir, Math.random()));
    start.y -= 0.5;
    const end = Vector.Add(start, Vector.Multiply(outwardDir, intensity));

    super('SmashEffect', 0.2, '#feee55', start, end);

    this.UsePhysics = true;
    this.Velocity = outwardDir;
  }
}

export { PSmashEffect as default };