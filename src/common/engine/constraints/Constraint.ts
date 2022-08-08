import Entity from '../Entity';
import { ConstraintType } from '../Enums';

/**
 * @class Constraint
 * @description
 * A physics constraint for joining two entities
 */
class Constraint {
  private maxLife: number;
  private finished: boolean = false;

  constructor(
    public owner: number, // ID of fighter who owns the constraint
    private constraintType: ConstraintType,
    private lifetime: number,
    private infinite: boolean,
    private ignoreCollisions: boolean, // If true, constrained fighter should ignore collisions with constraint owner
    private blockAttacking: boolean, // If true, prevents constrained fighter from attacking
  ) {
    this.maxLife = lifetime;
  }

  /**
   * @function
   * @summary Returns true if the collision candidate should be ignored by this constraint victim
   * @param {number} candidate Collision candidate's fighter ID
   * @returns {boolean} Whether or not the victim of this constraint should collide with this candidate
   */
  public shouldIgnoreCollision(candidate: number): boolean {
    return candidate === this.owner && this.ignoreCollisions;
  }
  public get blocksAttack(): boolean {
    return this.blockAttacking;
  }

  /**
   * @function
   * @summary Ticks the physics constraint
   * @param {number} deltaTime Time in seconds since last tick
   * @param {Entity} victim Victim of the constraint
   * @param {Entity} owner Owner of the constraint
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public tick(deltaTime: number, victim: Entity, owner: Entity) {
    if (!this.infinite) {
      this.lifetime -= deltaTime;
    }
  }

  /**
   * @function
   * @returns {number} Lifetime ratio, time spent alive divided by max lifetime
   */
  public lifetimeRatio(): number {
    if (this.infinite) {
      return 1.0;
    }
    return 1 - Math.max(this.lifetime / this.maxLife, 0);
  }

  /**
   * @returns {boolean} Returns true if this constraint's lifetime/function has ended
   */
  public completed(): boolean {
    return (!this.infinite && this.lifetime <= 0) || this.finished;
  }

  /**
   * @function
   * @summary Forcibly ends constraint with some finalization process. Marks constraint as completed.
   * @param {Entity} vict Victim of constraint
   * @param {Entity} owner Owner of constraint
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public finish(victim: Entity, owner: Entity) {
    this.finished = true;
  }

  public get type(): ConstraintType {
    return this.constraintType;
  }

  public get lifetimeTotal(): number {
    return this.lifetime;
  }

  public set lifetimeTotal(inp: number) {
    this.lifetime = inp;
  }

  public get replicationNumericA(): number {
    return 0.0;
  }
  // To be overridden by subclasses
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public set replicationNumericA(inp: number) {}

  public get replicationNumericB(): number {
    return 0.0;
  }
  // To be overridden by subclasses
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public set replicationNumericB(inp: number) {}
}

export { Constraint as default };