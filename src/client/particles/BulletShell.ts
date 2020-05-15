import Vector from '../../common/engine/Vector';
import Particle from './Particle';
import { ParticleType } from '../../common/engine/Enums';

class PBulletShell extends Particle {
  constructor(position: Vector, direction: Vector) {
    const end = Vector.Add(
      position,
      Vector.Multiply(
        Vector.UnitVectorFromXYZ(
          Math.random(),
          Math.random(),
          Math.random() * 3,
        ),
        0.2,
      ),
    );
    super(ParticleType.BulletShell, 0.75, '#cf8a00', position, end);

    this.Width = 0.075;
    this.UsePhysics = true;
    this.BounceReturn = 0.7;
    this.StopOnGround = true;
    this.Trail = 1;
    // this.Drag = 1;
    this.Velocity = Vector.Multiply(
      Vector.Add(
        direction,
        new Vector((Math.random() - 0.5) / 3, (Math.random() - 0.5) / 3, (Math.random() - 0.5) / 5 + 2),
      ),
      7,
    );
    this.Velocity.y *= 0.4;
    this.Acceleration.z = -80;
  }

  protected UpdateAlpha() {
    const percent = this.Lifetime / this.MaxLifetime;
    if (percent >= 0.8) {
      this.Alpha = 1 - ((percent - 0.8) / 0.2);
    } else {
      this.Alpha = 1;
    }
  }
}

export { PBulletShell as default };