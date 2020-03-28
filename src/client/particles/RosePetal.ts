import Vector from '../../common/engine/Vector';
import Particle from './Particle';

class PRosePetal extends Particle {
  constructor(position: Vector, petalSize: number, burstIntensity: number) {
    const beginning = position;
    const end = Vector.Add(
      beginning,
      Vector.Multiply(
        Vector.UnitVectorFromXYZ(Math.random() - 0.5, Math.random() - 0.5, 0),
        petalSize,
      ),
    );
    super('RosePetal', 5, Particle.RGBToHex(Math.random() * 55 + 200, Math.random() * 50, Math.random() * 50), beginning, end);

    const veloDir = new Vector(Math.random() - 0.5, Math.random() - 0.5, 0);

    this.Width = petalSize / 1.5;
    this.UsePhysics = true;
    this.Drag = 0.07;
    this.BounceReturn = 0;
    this.StopOnGround = true;
    this.Velocity = Vector.Multiply(Vector.UnitVectorXY(veloDir), Math.random() * (burstIntensity / 4));
    this.Acceleration.z = -2;

    if (Math.random() < 0.05) { // Render a rose stem
      this.RenderStyle = '#22dd33';
      this.Width = petalSize / 4;
      this.BounceReturn = 0.1;
      this.Drag = 0.2;
      this.Acceleration.z = -4;
    }
  }

  protected UpdateAlpha() {
    const percent = this.Lifetime / this.MaxLifetime;
    this.Alpha = 1 - (2 * percent - 1) ** 2;
    this.Trail = Math.sin(Math.PI * percent);
  }

  // Creates X many petals
  static Burst(particleList: Particle[], position: Vector, petalSize: number, intensity: number, petals: number) {
    const pos = Vector.Clone(position);
    pos.z += 1;
    for (let i = 0; i < petals; i++) {
      const dir = Vector.Multiply(
        Vector.UnitVectorFromXYZ(Math.random() - 0.5, Math.random() - 0.5, Math.random() / 2),
        Math.random() * (intensity / 3),
      );
      particleList.push(new PRosePetal(Vector.Add(pos, dir), petalSize, intensity));
    }
  }
}

export { PRosePetal as default };