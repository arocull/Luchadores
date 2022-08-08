import Vector from '../../common/engine/Vector';
import Particle from './Particle';
import { ParticleType } from '../../common/engine/Enums';
import RenderSettings from '../RenderSettings';

class PLandingDirt extends Particle {
  constructor(position: Vector, velocity: Vector) {
    super(ParticleType.LandingDirt, 0.5, '#794e23', position, position);

    this.Width = ((Math.random() / 2) + 0.6) * 0.155;
    this.UsePhysics = true;
    this.StopOnGround = true;
    this.BounceReturn = 0.43;
    this.Drag = 0.02;
    this.Velocity = velocity;
    this.Acceleration.z = -75;
  }

  protected UpdateAlpha() {
    const percent = this.Lifetime / this.MaxLifetime;
    if (percent >= 0.8) {
      this.Alpha = 1 - ((percent - 0.8) / 0.2);
    } else {
      this.Alpha = 1;
    }
  }

  static Burst(particleList: Particle[], position: Vector, mass: number, velocity: number) {
    const count = Math.floor((mass) / 12) * RenderSettings.getParticleRatio();
    const adjustedVelo = Math.sqrt(velocity) * 2;
    const pos = Vector.Clone(position);
    pos.z += 0.05;
    for (let i = 0; i < count; i++) {
      const randomDir = Vector.UnitVectorFromXYZ(Math.random() - 0.5, Math.random() - 0.5, 1.5);
      particleList.push(new PLandingDirt(pos, Vector.Multiply(randomDir, adjustedVelo)));
    }
  }
}

export { PLandingDirt as default };