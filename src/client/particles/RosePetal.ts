import Vector from '../../common/engine/Vector';
import Particle from './Particle';

class PRosePetal extends Particle {
  constructor(position: Vector, petalSize: number, burstIntensity: number) {
    const beginning = position;
    const end = Vector.Add(
      beginning,
      Vector.Multiply(
        Vector.UnitVectorXY(new Vector(Math.random() - 0.5, Math.random() - 0.5, 0)),
        petalSize,
      ),
    );
    super('RosePetal', 5, '#de0101', beginning, end);

    const veloDir = new Vector(Math.random() - 0.5, Math.random() - 0.5, 0);

    this.Width = petalSize / 2;
    this.UsePhysics = true;
    this.Drag = 0.05;
    this.Velocity = Vector.Multiply(Vector.UnitVectorXY(veloDir), Math.random() * burstIntensity);
    this.Velocity.z = burstIntensity * Math.random();
    this.Acceleration.z = -3;
  }

  // Creates X many petals
  static Burst(particleList: Particle[], position: Vector, petalSize: number, intensity: number, petals: number) {
    for (let i = 0; i < petals; i++) particleList.push(new PRosePetal(position, petalSize, intensity));
  }
}

export { PRosePetal as default };