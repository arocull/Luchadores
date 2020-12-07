import Vector from '../../common/engine/Vector';
import Particle from './Particle';
import { ParticleType } from '../../common/engine/Enums';
import RenderSettings from '../RenderSettings';

const HalfPi = Math.PI / 2;

class PMoveDash extends Particle {
  constructor(position: Vector, dir: Vector, burstIntensity: number) {
    const beginning = position;
    const end = Vector.Add(
      beginning,
      Vector.Multiply(
        dir,
        0.3 * burstIntensity,
      ),
    );
    super(ParticleType.MoveDash, burstIntensity / 3, '#eeeefe', beginning, end);

    this.Width = 0.1 * burstIntensity;
    this.UsePhysics = true;
    this.Drag = 0;
    this.BounceReturn = 0;
    this.Trail = 1;
    this.Velocity = Vector.Multiply(dir, burstIntensity);
  }

  // Creates X many petals
  static Burst(particleList: Particle[], position: Vector, intensity: number, dir: Vector, radius: number) {
    if (RenderSettings.ParticleAmount <= 1) { // If our particle amount is at lowest, only spawn one particle
      particleList.push(new PMoveDash(position, dir, intensity));
    } else { // Otherwise spawn particles procedurally
      for (let i = 0; i < RenderSettings.ParticleAmount; i++) {
        // Get base angle direction, then add offset based off of particle amount and current index--finally, convert angle back to vector
        const newDir = Vector.UnitVectorFromAngle(Vector.AngleFromXYZ(dir) + ((i * Math.PI) / (RenderSettings.ParticleAmount) - HalfPi));

        particleList.push(new PMoveDash(
          Vector.Add(position, Vector.Multiply(newDir, radius)),
          dir,
          intensity,
        ));
      }
    }
  }
}

export { PMoveDash as default };