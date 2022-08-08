import Vector from '../../common/engine/Vector';
import Particle from './Particle';
import { ParticleType } from '../../common/engine/Enums';
import RenderSettings from '../RenderSettings';

class PLandingSnow extends Particle {
  constructor(position: Vector, velocity: Vector) {
    super(ParticleType.LandingDirt, 0.5, '#fefeff', position, position);

    this.Width = 0.3;
    this.UsePhysics = true;
    this.StopOnGround = true;
    this.Drag = 5;
    this.Velocity = velocity;
    this.Acceleration.z = -3;
  }

  protected UpdateAlpha() {
    const percent = this.Lifetime / this.MaxLifetime;
    this.Alpha = 1 - percent;
    this.Width = 0.3 * (1 - percent);
  }

  static Burst(particleList: Particle[], position: Vector, mass: number, velocity: number) {
    const count = Math.floor(mass / 13) * RenderSettings.getParticleRatio();
    const adjustedVelo = Math.sqrt(velocity) * 3;
    const pos = Vector.Clone(position);
    pos.z += 0.05;
    for (let i = 0; i < count; i++) {
      const randomDir = Vector.UnitVectorFromXYZ(Math.random() - 0.5, Math.random() - 0.5, 0.2);
      particleList.push(new PLandingSnow(pos, Vector.Multiply(randomDir, adjustedVelo)));
    }
  }
}

export { PLandingSnow as default };