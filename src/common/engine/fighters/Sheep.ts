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

*/
class Sheep extends Fighter {
  private baseMoveAccel: number;
  private accelBoostTimer: number;

  constructor(id: number, position: Vector) {
    super(200, 200, 8000, 0.6, 1.2, 8, 20, FighterType.Sheep, id, position);

    this.ranged = false;
    this.baseMoveAccel = this.MoveAcceleration;
    this.accelBoostTimer = 0;
  }

  public CollideWithFighter(hit: Fighter, momentum: number) {
    super.CollideWithFighter(hit, momentum);

    if (momentum > this.MaxMomentum / 3) {
      hit.TakeDamage((momentum / this.MaxMomentum) * 40, this);
    }
  }

  public EarnKill() {
    super.EarnKill();

    this.MoveAcceleration = this.baseMoveAccel * 3; // Allows the sheep to quickly get back to speed after a kill
    this.accelBoostTimer += 3; // We add to the speed boost time, so they can continue to have a high accel after a multi-kill
  }

  public tickCooldowns(DeltaTime: number) {
    super.tickCooldowns(DeltaTime);

    if (this.accelBoostTimer > 0) {
      this.accelBoostTimer -= DeltaTime;
      if (this.accelBoostTimer <= 0) {
        this.accelBoostTimer = 0;
        this.MoveAcceleration = this.baseMoveAccel;
      }
    }
  }
}

export { Sheep as default };
