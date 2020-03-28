import Vector from '../../common/engine/Vector';
import Particle from './Particle';

class PConfetti extends Particle {
  constructor(position: Vector, strandSize: number, burstIntensity: number) {
    const beginning = position;
    const end = Vector.Add(
      beginning,
      Vector.Multiply(
        Vector.UnitVectorXY(new Vector(Math.random() - 0.5, Math.random() - 0.5, 0)),
        strandSize,
      ),
    );
    super('Confetti', 5, Particle.RGBToHex(Math.random() * 128 + 127, Math.random() * 128 + 127, Math.random() * 128 + 127), beginning, end);

    const veloDir = new Vector(Math.random() - 0.5, Math.random() - 0.5, 0);

    this.Width = strandSize / 3;
    this.UsePhysics = true;
    this.Drag = 0.05;
    this.BounceReturn = 0;
    this.Trail = 0.4;
    this.Velocity = Vector.Multiply(Vector.UnitVectorXY(veloDir), Math.random() * burstIntensity);
    this.Velocity.z = burstIntensity * Math.random();
    this.Acceleration.z = -1;
  }

  // Creates X many petals
  static Burst(particleList: Particle[], position: Vector, petalSize: number, intensity: number, strands: number) {
    for (let i = 0; i < strands; i++) particleList.push(new PConfetti(position, petalSize, intensity));
  }
}

export { PConfetti as default };