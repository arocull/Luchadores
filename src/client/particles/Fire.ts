import Vector from '../../common/engine/Vector';
import Particle from './Particle';
import { ParticleType } from '../../common/engine/Enums';

class PFire extends Particle {
  private intensity: number;
  private veloX: number;

  constructor(position: Vector, dir: Vector, intensity: number) {
    const veloDir = Vector.Add(dir, new Vector(
      (Math.random() - 0.5),
      Math.random() / 2,
      Math.random(),
    ));
    const end = Vector.Subtract(position, Vector.Multiply(dir, intensity / 3));

    super(ParticleType.Fire, intensity, Particle.RGBToHex(255, 0, 0), position, end);

    this.Width = intensity * 0.5;
    this.UsePhysics = true;
    this.Drag = 0;
    this.BounceReturn = 0;
    this.Trail = 0;
    this.Velocity = Vector.Multiply(Vector.UnitVectorXY(veloDir), Math.random() * intensity * 5);
    this.veloX = this.Velocity.x;
    this.Velocity.z = intensity;
    this.Acceleration.z = 0.1;

    this.intensity = intensity;
  }

  UpdateAlpha() {
    super.UpdateAlpha();

    const perc = Math.cos(Math.PI * (this.Lifetime / this.MaxLifetime)) / 2 + 0.5;
    this.RenderStyle = Particle.RGBToHex(255, 250 * perc, 30 * perc);
    this.Width = this.intensity * perc * 0.5;

    this.Velocity.x = Math.sin(perc * 3 * Math.PI) * this.veloX;

    this.End = Vector.Subtract(this.Position, Vector.Clone(this.Velocity).clamp(this.intensity / 3, this.intensity / 3));
  }
}

export { PFire as default };