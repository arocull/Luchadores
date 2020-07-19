import Vector from '../Vector';
import Fighter from '../Fighter';
import { FighterType } from '../Enums';

/**
 * @class
 * @name Soccerball
 * @classdesc A mobile prop with fighter properties that can be kicked, shot, and punched around.
 * When slammed into opponents, it deals momentum damage. When knocked into goals, it explodes and scores points.
 */
class Soccerball extends Fighter {
  constructor(id: number, position: Vector) {
    super(1, 10, 10000, 0.55, 1.1, 0, 0, 0, FighterType.Soccerball, id, position);
    // 200 kg, top speed of 35 units per second

    this.ranged = false;
  }

  public CollideWithFighter(hit: Fighter, momentum: number) {
    super.CollideWithFighter(hit, momentum);

    if (momentum > this.MaxMomentum / 10) { // Stacking passengers adds to max momentum
      hit.TakeDamage((momentum / this.MaxMomentum) * 50, this, Vector.UnitVector(this.Velocity));
    }
  }

  public EarnKill() {
    super.EarnKill();

    // Bouncebackwards with double the velocity
    this.Velocity = Vector.Multiply(this.Velocity, -2);
  }
}

export { Soccerball as default };
