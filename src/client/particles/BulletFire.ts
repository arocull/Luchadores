import Vector from '../../common/engine/Vector';
import Particle from './Particle';
import { ParticleType } from '../../common/engine/Enums';

const FifteenDegrees = Math.PI / 6; // 12

class PBulletFire extends Particle {
  public points: Vector[];

  constructor(position: Vector, direction: Vector, intensity: number) {
    super(ParticleType.BulletFire, 0.2, '#ffbb00', position, position);

    this.UsePhysics = false;

    const fireAngle = Vector.ConstrainAngle(Math.PI * 2 - Vector.AngleFromXYZ(direction));
    this.points = [
      Vector.Add( // Top corner
        position,
        Vector.Multiply(
          Vector.UnitVectorFromAngle(fireAngle + FifteenDegrees * intensity),
          -intensity / 2,
        ),
      ),
      Vector.Add( // Mid between top corner and center
        position,
        Vector.Multiply(
          Vector.UnitVectorFromAngle(fireAngle + (FifteenDegrees * intensity) / 2),
          -intensity / 3,
        ),
      ),
      Vector.Add( // Center
        position,
        Vector.Multiply(direction, -intensity / 2),
      ),
      Vector.Add( // Mid between bottom corner and center
        position,
        Vector.Multiply(
          Vector.UnitVectorFromAngle(fireAngle - (FifteenDegrees * intensity) / 2),
          -intensity / 3,
        ),
      ),
      Vector.Add( // Bottom corner
        position,
        Vector.Multiply(
          Vector.UnitVectorFromAngle(fireAngle - FifteenDegrees * intensity),
          -intensity / 2,
        ),
      ),
    ];
  }
}

export { PBulletFire as default };