import Vector from '../Vector';
import Fighter from '../Fighter';
import { FighterType } from '../Enums';

/* La Oveja Grande - A tanky character that deals damage primarily off of momentum exchange (running into people at high velocities)

Properties that need to be replicated from server to client:
- Class Type
- Player ID
- Position
- Velocity
- Acceleration

Sheep's traits:
- High health
- High mass and max velocity
- Large cube
- Low move acceleration
- Little jump height
- No air control

*/
class Sheep extends Fighter {
  private baseMoveAccel: number;

  constructor(id: number, position: Vector) {
    super(200, 200, 7000, 0.6, 1.2, 8, 30, 0, FighterType.Sheep, id, position);
    // 200 kg, top speed of 35 units per second

    this.ranged = false;
    this.baseMoveAccel = this.MoveAcceleration;
  }

  public CollideWithFighter(hit: Fighter, momentum: number) {
    super.CollideWithFighter(hit, momentum);

    if (momentum > this.MaxMomentum / 3) { // Stacking passengers adds to max momentum
      hit.TakeDamage((momentum / this.MaxMomentum) * 40, this, Vector.UnitVector(this.Velocity));
    }
  }

  public EarnKill() {
    super.EarnKill();

    this.MoveAcceleration = this.baseMoveAccel * 3; // Allows the sheep to quickly get back to speed after a kill
    this.boostTimer += 3; // We add to the speed boost time, so they can continue to have a high accel after a multi-kill

    // Immediately apply move acceleration
    this.Acceleration = Vector.Multiply(Vector.UnitVectorXY(this.Acceleration), this.MoveAcceleration);
  }

  protected boostEnded() {
    this.MoveAcceleration = this.baseMoveAccel;
  }
}

export { Sheep as default };
