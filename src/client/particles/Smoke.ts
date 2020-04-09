import Vector from '../../common/engine/Vector';
import Particle from './Particle';
import { ParticleType } from '../../common/engine/Enums';

class PSmoke extends Particle {
  private intensity: number;

  constructor(position: Vector, velocity: Vector, intensity: number) {
    super(ParticleType.Smoke, intensity, Particle.RGBToHex(200, 200, 200), position, position);

    this.intensity = intensity * (0.75 + Math.random() / 2);
    this.Width = this.intensity;
    this.UsePhysics = true;
    this.Drag = 0.05;
    this.BounceReturn = 0;
    this.Velocity = velocity;
    this.Acceleration.z = 8 + Math.random() * 2;
  }

  UpdateAlpha() {
    const perc = this.Lifetime / this.MaxLifetime;
    this.RenderStyle = Particle.RGBToHex(200 * perc, 200 * perc, 200 * perc);
    this.Width = this.intensity * perc;
    this.Alpha = 0.5 - perc / 2;
  }
}

export { PSmoke as default };