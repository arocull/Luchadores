import { MessageBus } from '../../messaging/bus';
import Entity from '../Entity';
import { ConstraintType } from '../Enums';
import Fighter from '../Fighter';
import Vector from '../Vector';
import Constraint from './Constraint';

class CSuplex extends Constraint {
  private transitionAlpha: number = 0;
  private startSide: number = 1;
  private peakFallVelocity: number = 0;
  private lastYVelo: number = 0;

  constructor(owner: number, flipped: boolean) {
    super(owner, ConstraintType.Suplex, 0.5, true, true, true);

    if (flipped) {
      this.startSide = -1;
    }

    MessageBus.publish(`Animation_SuplexStart${owner}`, null);
  }

  public tick(deltaTime: number, victim: Entity, owner: Entity): void {
    super.tick(deltaTime, victim, owner);

    if (owner.Velocity.z < 0) { // Flip character from left to right over the course of a second
      this.transitionAlpha = Math.min(this.transitionAlpha + deltaTime * 5, 1);
    }

    const vict: Fighter = victim as Fighter;
    const inst: Fighter = owner as Fighter;

    // if (inst.Velocity.y < 0) { // Accelerate twice as fast on downward fall
    //   inst.Velocity.y -= Math.abs(inst.Velocity.y - this.lastYVelo) * 2;
    //   this.lastYVelo = inst.Velocity.y;
    // }

    // Copy instigator velocity to victim
    // Combining momentums was ideal, but ended up in glitchty motion and repeated velocity resets
    vict.Velocity = inst.Velocity;

    // Store peak fall velocity
    this.peakFallVelocity = Math.min(this.peakFallVelocity, inst.Velocity.z);

    // Roll victim around the owner
    const radii = (inst.Radius + vict.Radius) * 1.05;
    const angle = Math.PI * this.transitionAlpha;
    const wrapDir = Vector.UnitVectorFromAngleXZ(angle);
    wrapDir.x *= this.startSide;

    vict.lastPosition = vict.Position;
    vict.Position = Vector.Add(Vector.Multiply(wrapDir, radii), inst.Position);

    // Make characters look corresponding directions
    let flipDir = this.startSide < 0; // Don't flip if we didn't start out flipped
    if (this.transitionAlpha > 0.5) {
      flipDir = !flipDir;
    }
    vict.Flipped = !flipDir; // Victim looks in opposite direction
    inst.Flipped = flipDir;

    // If we have landed, perform final event
    if (!inst.isFalling()) {
      this.finish(victim, owner);
    }
  }

  public finish(victim: Entity, owner: Entity): void {
    if (this.completed()) return;
    super.finish(victim, owner);
    const vict: Fighter = victim as Fighter;
    const inst: Fighter = owner as Fighter;

    // Take damage and knockback
    vict.TakeDamage(Math.abs(this.peakFallVelocity * 1.5), inst);
    vict.Velocity.z = 0;
    vict.ApplyMomentum(Vector.Multiply(
      Vector.UnitVector(new Vector(0.5 * this.startSide, 0, 1)),
      (vict.Mass + inst.Mass) * this.peakFallVelocity,
    ));

    // Fire animation events
    MessageBus.publish(`Animation_Suplexor${inst.getOwnerID()}`, { fighter: inst, velo: this.peakFallVelocity }); // Instigator performed suplex
    MessageBus.publish(`Animation_Suplexed${vict.getOwnerID()}`, { fighter: vict, velo: this.peakFallVelocity }); // Victim received suplex
  }

  public get replicationNumericA(): number {
    return this.peakFallVelocity;
  }
  public set replicationNumericA(inp: number) {
    this.peakFallVelocity = inp;
  }

  public get replicationNumericB(): number {
    return this.startSide;
  }
  public set replicationNumericB(inp: number) {
    this.startSide = inp;
  }
}

export { CSuplex as default };