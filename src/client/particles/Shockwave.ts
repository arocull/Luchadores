import Vector from '../../common/engine/Vector';
import Particle from './Particle';
import { ParticleType } from '../../common/engine/Enums';

// PShockwave - White circle that extends to intensity units in radius over a short period of time
class PShockwave extends Particle {
  constructor(position: Vector, private intensity: number) {
    super(ParticleType.Shockwave, 0.125, '#eeeeff', position, position);

    this.UsePhysics = false;
    this.Width = 0;
    this.intensity *= 2;
  }

  protected UpdateAlpha() {
    this.Alpha = this.Lifetime / this.MaxLifetime;
    this.Width = this.Alpha * this.intensity;
    this.Alpha = 1 - this.Alpha;
  }
}

export { PShockwave as default };