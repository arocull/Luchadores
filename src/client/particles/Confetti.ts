import Vector from '../../common/engine/Vector';
import Particle from './Particle';
import { ParticleType } from '../../common/engine/Enums';
import RenderSettings from '../RenderSettings';

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
    super(
      ParticleType.Confetti, 5,
      Particle.RGBToHex(
        Math.random() * 128 + 127,
        Math.random() * 128 + 127,
        Math.random() * 128 + 127,
      ),
      beginning,
      end,
    );

    const veloDir = new Vector(Math.random() - 0.5, Math.random() - 0.5, 0);

    this.Width = strandSize / 3;
    this.UsePhysics = true;
    this.Drag = 10;
    this.BounceReturn = 0;
    this.StopOnGround = true;
    this.Trail = 0.35;
    this.Velocity = Vector.Multiply(Vector.UnitVectorXY(veloDir), Math.random() * burstIntensity * 10);
    this.Velocity.z = (burstIntensity * Math.random() + 0.5) * 7;
    this.Acceleration.z = -1;
  }

  public Tick(DeltaTime: number): void {
    super.Tick(DeltaTime);
    this.Drag = 10 * (this.Alpha ** 3);
  }

  // Creates X many petals
  static Burst(particleList: Particle[], position: Vector, petalSize: number, intensity: number, strands: number) {
    // eslint-disable-next-line no-param-reassign
    strands *= RenderSettings.getParticleRatio(); // Alter number of particles based off of render settings
    for (let i = 0; i < strands; i++) {
      particleList.push(new PConfetti(position, petalSize, intensity));
    }
  }
}

export { PConfetti as default };