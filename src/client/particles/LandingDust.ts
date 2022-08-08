import Vector from '../../common/engine/Vector';
import Particle from './Particle';
import { ParticleType } from '../../common/engine/Enums';
import RenderSettings from '../RenderSettings';

class PLandingDust extends Particle {
  private cloudSize: number;

  constructor(position: Vector, velocity: Vector, intensity: number) {
    super(ParticleType.LandingDust, 0.8 + (intensity * Math.random()), '#ffe8ad', position, position);

    this.cloudSize = intensity;
    this.Width = intensity;
    this.UsePhysics = true;
    this.Drag = 4.5;
    this.Velocity = velocity;
    this.Acceleration.z = -1;
  }

  protected UpdateAlpha() {
    const percent = this.Lifetime / this.MaxLifetime;
    this.Alpha = (1 - percent) * 0.7;
    this.Width = this.cloudSize * percent;
  }

  static Burst(particleList: Particle[], position: Vector, mass: number, velocity: number) {
    const count = Math.floor((mass) / 12) * RenderSettings.getParticleRatio();
    const adjustedVelo = Math.sqrt(velocity) * 1.1;
    const intensity = (mass * adjustedVelo) / 1200;
    for (let i = 0; i < count; i++) {
      const randomDir = Vector.UnitVectorFromXYZ(Math.random() - 0.5, Math.random() - 0.5, 0.3);
      particleList.push(new PLandingDust(position, Vector.Multiply(randomDir, adjustedVelo), intensity));
    }
  }
}

export { PLandingDust as default };