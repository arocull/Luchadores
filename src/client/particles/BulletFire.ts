import Vector from '../../common/engine/Vector';
import Particle from './Particle';
import { ParticleType } from '../../common/engine/Enums';

const SpreadAngle = Math.PI / 6; // 12

class PBulletFire extends Particle {
  public points: Vector[];

  constructor(position: Vector, direction: Vector, intensity: number) {
    super(ParticleType.BulletFire, 0.2, '#ffbb00', position, position);

    this.UsePhysics = false;

    const fireAngle = Vector.AngleFromXY(direction);

    const distLarge = -intensity / 2;
    const distSmall = -intensity / 3;
    const spread = (SpreadAngle * intensity);

    this.points = [
      // Top corner
      Vector.Multiply(Vector.UnitVectorFromAngleXZ(fireAngle - spread), distLarge),
      // Mid between top corner and center
      Vector.Multiply(Vector.UnitVectorFromAngleXZ(fireAngle - (spread / 2)), distSmall),
      // Center
      Vector.Multiply(direction, distLarge),
      // Mid between bottom corner and center
      Vector.Multiply(Vector.UnitVectorFromAngleXZ(fireAngle + (spread / 2)), distSmall),
      // Bottom corner
      Vector.Multiply(Vector.UnitVectorFromAngleXZ(fireAngle + spread), distLarge),
    ];

    for (let i = 0; i < this.points.length; i++) {
      this.points[i] = Vector.Add(position, this.points[i]);
    }
  }
}

export { PBulletFire as default };