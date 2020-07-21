import Vector from '../Vector';
import Fighter from '../Fighter';
import { FighterType } from '../Enums';

/**
 * @class
 * @name Soccerball
 * @classdesc A mobile prop with fighter properties that can be kicked, shot, and punched around.
 * When slammed into opponents, it deals momentum damage. When knocked into goals, it explodes and scores points.
 *
 * To save data during replication, some values are now used for different purposes:
 * - Bullet Cooldown is now used as a timer (counts down to zero before spinning off)
 * - specialNumber is now used to describe how much momentum is stored in the object
 * - AimDirection is now used to store the direction of the incoming momentum boost
 */
class Soccerball extends Fighter {
  private storedMomentum: number;
  private frozen: boolean;
  private lastAttacker: Fighter;
  private queueVelocity: Vector;

  constructor(id: number, position: Vector) {
    super(1, 50, 8000, 0.5, 1, 0, 0, 0, FighterType.Soccerball, id, position);
    // 200 kg, top speed of 35 units per second

    this.ranged = false;
    this.storedMomentum = 0;
    this.AimDirection = new Vector(0, 0, 0);
    this.frozen = false;
    this.lastAttacker = null;
    this.queueVelocity = null;
  }

  public CollideWithFighter(hit: Fighter, momentum: number) {
    super.CollideWithFighter(hit, momentum);

    if (momentum > this.Mass * 8) {
      hit.TakeDamage(momentum / 80, this.lastAttacker, Vector.UnitVector(this.Velocity));

      if (hit.HP <= 0) this.EarnKill();
    }
    if (hit.HP > 0) this.lastAttacker = hit;
  }

  // Takes damage from the set attacker, does NOT handle kills (kills should only be handled by server)
  public TakeDamage(dmg: number, attacker: Fighter, hitDirection: Vector = new Vector(0, 0, 0)) {
    const hitVelo = Vector.Multiply(Vector.UnitVector(hitDirection), (dmg * 10) / this.Mass);

    // If the hit velocity is in the opposite direction of current momentum, slow ball down
    if (Vector.DotProduct(hitDirection, this.Velocity) < 0.5 && dmg < this.Velocity.length()) {
      this.Velocity = Vector.Add(this.Velocity, hitVelo);
    } else { // Otherwise, freeze the ball and add the momentum while resetting the timer
      this.BulletCooldown = 0.2;

      this.storeMomentum(this.Velocity);
      this.storeMomentum(hitVelo);
      this.Velocity = new Vector();

      if (attacker) this.lastAttacker = attacker;
      if (this.storedMomentum * this.Mass > this.MaxMomentum) this.applyMomentum();
    }
  }

  public EarnKill() {
    super.EarnKill();

    // Bouncebackwards with double the velocity
    this.queueVelocity = Vector.Multiply(this.Velocity, -2);
  }

  public tickCooldowns(DeltaTime: number) {
    const timerAboveZero: boolean = (this.BulletCooldown > 0);
    super.tickCooldowns(DeltaTime);

    if (timerAboveZero && this.BulletCooldown <= 0) { // Apply momentum if the standing spin has ended
      this.applyMomentum();
    } else if (timerAboveZero && this.Velocity.length() > 0.5) { // Otherwise, if more velocity has been added to it while in spin...
      if (this.Velocity.length() > 5) this.storeMomentum(this.Velocity); // Store if it was a large increase (prevents repeated collisions rapidly increasing moment)
      this.Velocity = new Vector(); // Zero velocity
    }

    if (this.queueVelocity) {
      this.Velocity = this.queueVelocity;
      this.queueVelocity = null;
    }
  }

  private applyMomentum() {
    this.Velocity = Vector.Multiply(this.AimDirection, this.storedMomentum);
    this.AimDirection = new Vector(0, 0, 0);
    this.setSpecialStates(0, false);
    this.BulletCooldown = 0;
  }
  private storeMomentum(moment: Vector) {
    this.AimDirection = Vector.UnitVector(Vector.Add(Vector.Multiply(this.AimDirection, this.storedMomentum), moment));
    this.storedMomentum += moment.length();
    this.frozen = true;

    this.JustHitMomentum = Math.max(this.storedMomentum * 30, 701);
    this.JustHitPosition = Vector.Add(this.Position, new Vector(0, 0, this.Height * 0.6666));
  }

  public getSpecialNumber(): number {
    return this.storedMomentum;
  }
  public getSpecialBoolean(): boolean {
    return this.frozen;
  }
  public setSpecialStates(specialNum: number, specialBool: boolean) {
    this.storedMomentum = specialNum;
    this.frozen = specialBool;
  }
}

export { Soccerball as default };
