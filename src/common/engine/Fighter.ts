import Vector from './Vector';
import Prop from './props/Prop';
// eslint-disable-next-line object-curly-newline
import { EntityType, FighterType, ColliderType, ConstraintType } from './Enums';
import Constraint from './constraints/Constraint';
import { MessageBus } from '../messaging/bus';

// Static Configurations
const KILL_HEALTH_RETURN = 0.25; // Percentage of max health that is restored upon earning a kill

/* A standard fighter with basic properties shared by all characters

Default properties that should always be replicated to client:
- Class Type
- Player ID
- Position
- Velocity
- Acceleration

Any ranged classes should also replicate:
- Firing
- Aim Direction

...as well as any other special properties each class has that must be replicated
 - specified in class files
*/
class Fighter extends Prop {
  public MaxHP: number;

  public Kills: number;
  public DamageDealt: number;
  public LastHitBy: number;

  public Flipped: boolean;
  public Animator: any;
  public UpdatesMissed: number;
  public MarkedForCleanup: boolean;
  public DisplayName: string;

  public JustLanded: boolean;
  private jumpTimer: number;
  public lastCollision: Fighter;

  public lastPosition: Vector;
  public newPosition: Vector;
  public riding: Fighter;
  public rodeThisTick: Fighter;
  public dismountRider: boolean;
  public passengerMass: number;
  public passengerMaxMomentum: number;

  protected ranged: boolean;
  protected AimDirection: Vector;
  public Firing: boolean;
  protected BulletCooldown: number;
  public BulletShock: number;

  protected boostTimer: number;
  protected fighterConstraints: Constraint[] = [];

  constructor(
    public HP: number,
    public Mass: number, // How much mass this fighter has, used in momentum calculations
    public MaxMomentum: number, // Essentially max speed of character
    public Radius: number, // Collision and draw radius
    public Height: number, // Collision and draw height
    private JumpVelocity: number, // The velocity or power this character jumps with
    protected MoveAcceleration: number, // Maximum acceleration one can reach from standard inputs
    public AirControl: number, // How much of the fighter's move acceleration applies while in the air
    private character: FighterType, // What class this fighter is so we can differentiate between characters
    private ID: number, // Player/entity ID of this fighter so we can tell who's who
    position: Vector,
  ) {
    super(position, ColliderType.Cylinder, Radius, Height, Radius);
    this.type = EntityType.Fighter;

    this.MaxHP = HP;

    this.Kills = 0; // How many kills this fighter has racked up this life
    this.DamageDealt = 0; // Total amount of damage dealt in this life
    this.LastHitBy = -1; // Player ID of last attacker

    this.Flipped = false; // Do we draw them facing leftward or rightward?
    this.Animator = null; // Animation object
    this.UpdatesMissed = 0;
    this.MarkedForCleanup = false;
    this.DisplayName = null;
    this.lastCollision = null;

    this.riding = null;
    this.rodeThisTick = null;
    this.dismountRider = false;
    this.passengerMass = 0;
    this.passengerMaxMomentum = 0;

    this.ranged = true;
    this.AimDirection = new Vector(1, 0, 0);
    this.Firing = false;
    this.BulletCooldown = 0;
    this.BulletShock = 0;

    this.boostTimer = 0;
    this.jumpTimer = 0;
  }


  // Takes damage from the set attacker, does NOT handle kills (kills should only be handled by server)
  // Returns true if this value zeroed out the opponent's health
  public TakeDamage(dmg: number, attacker: Fighter): boolean {
    this.HP -= dmg;

    if (attacker) {
      this.LastHitBy = attacker.ID;
      attacker.EarnDamage(dmg);
    }
    if (this.HP < 0) {
      this.HP = 0;
      return true;
    }
    return false;
  }
  /**
   * @function EarnKill
   * @summary Award this fighter a kill, can be overridden by subclasses for special abilities, also awards health
   * @virtual
   */
  public EarnKill() {
    this.Kills++;

    // Restore some HP upon earning a kill
    this.HP = Math.min(this.HP + KILL_HEALTH_RETURN * this.MaxHP, this.MaxHP);
  }
  /**
   * @function EarnDamage
   * @summary Award this fighter positive damage they induced on someone else
   * @param {number} dmg Damage this fighter induced
   */
  public EarnDamage(dmg: number) {
    if (dmg <= 0) { return; }
    this.DamageDealt += dmg;
  }


  // If this collided with another fighter, set state
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public CollideWithFighter(hit: Fighter, momentum: number) { // Momentum used in subclasses
    this.lastCollision = hit;
  }


  // Returns a bullet (overriden by subclasses)
  /* eslint-disable class-methods-use-this */
  public fireBullet(): any {
    return null;
  }
  /* eslint-enable class-methods-use-this */

  // Is this entity able to fire a bullet? Overriden by sublcasses for additional conditions such as reload times
  public canFirebullet(): boolean {
    return (this.Firing && this.BulletCooldown <= 0 && !this.attackBlocked());
  }

  // Attempt to fire a bullet--fires as many bullets as it can until the cooldown is positive or some other condition
  public tryBullet(capShock: boolean = false) {
    if (!this.Firing) return;

    // Fire a bullet--if time had passed to the point where multiple bullets could have been fired, fire all of them and tick them accordingly
    while (this.canFirebullet()) {
      const t = Math.abs(this.BulletCooldown); // Time since bullet was fireable

      if (capShock) this.BulletShock = 0; // Prevent stacking when multiple bullets are fired (happens on higher-latency clients)
      const b = this.fireBullet();

      if (b === null) return; // If no bullet was generated, stop here

      if (t > 0) b.Tick(t); // If a bullet was generated, tick it according to 'when' it was fired
    }
  }


  /**
   * @summary Jump if this character is able
   * @param {boolean} force If true, forces a jump regardless of conditions
   * @param {Fighter[]} fighters Array of fighters for internal character use
   */
  public Jump(force: boolean = false, fighters: Fighter[] = []) {
    if (((this.Position.z <= 0 || this.JustLanded || this.onSurface) && this.jumpTimer <= 0) || force) {
      this.jumpInternal(this.JumpVelocity, fighters);
    }
  }
  /**
   * @summary Internal jump code, for overriding
   * @param {Fighter[]} fighters Array of fighters for internal character use
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected jumpInternal(jumpVelo: number, fighters: Fighter[]) {
    this.Velocity.z += jumpVelo;
    this.dismountRider = true;
    this.jumpTimer = 0.2;
  }

  // Sets the fighter's acceleration in the given vector
  public Move(direction: Vector) {
    this.Acceleration = Vector.Multiply(Vector.UnitVectorXY(direction), this.MoveAcceleration);
  }

  // Called when the fighter has just landed after spending time in the air, can be overriden for special functionality
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public Land(landVelocity: number = 0) {
    this.JustLanded = true;
    if (!this.riding) {
      MessageBus.publish('Effect_Land', { velocity: landVelocity, mass: this.Mass, position: this.Position });
    }
  }

  /**
   * @function
   * @summary Applies a momentum to the given fighter
   * @param {Vector} momentum Momentum vector to add on to current velocity
   * @param {number} mass Mass override, defaults to this fighter's mass
   * @param {number} maxMoment Max momentum override, defaults to this fighter's max momentum
   */
  public ApplyMomentum(momentum: Vector, mass: number = this.Mass, maxMoment: number = this.MaxMomentum) {
    this.Velocity = Vector.Add(this.Velocity, Vector.Divide(momentum, mass)); // Add momentum to fighter

    if (this.Velocity.length() * mass > maxMoment) { // Check to see if we went over the maximum momnentum
      this.Velocity.clamp(0, maxMoment / mass); // Clamp the momentum
    }
  }

  // Returns true if the fighter is falling or not
  public isFalling(): boolean {
    return !(this.Position.z <= 0 || this.riding || this.rodeThisTick || this.onSurface) || this.Velocity.z > 0;
  }

  // Sets aim direction of fighter
  public aim(direction: Vector) {
    this.AimDirection = direction;
  }
  public getAim(): Vector {
    return this.AimDirection;
  }

  // Ticks the fighter by set amount of time, reduces cooldowns and resets states
  public tickCooldowns(DeltaTime: number) {
    // Reset states
    this.JustLanded = false;
    this.rodeThisTick = null;
    this.BulletShock = 0;

    if (!this.isFalling()) this.jumpTimer -= DeltaTime;

    if (this.BulletCooldown <= 0) this.BulletCooldown = 0; // Zeros cooldown
    else this.BulletCooldown -= DeltaTime; // Otherwise, tick cooldown (if it gets below zero and player is still firing, stream stays continous)

    if (this.boostTimer > 0) {
      this.boostTimer -= DeltaTime;
      if (this.boostTimer <= 0) {
        this.boostTimer = 0;
        this.boostEnded();
      }
    }
  }


  public isRanged(): boolean {
    return this.ranged;
  }
  public getCharacter(): FighterType {
    return this.character;
  }
  public getOwnerID(): number {
    return this.ID;
  }
  public getBulletCooldown(): number {
    return this.BulletCooldown;
  }
  public setBulletCooldown(newCooldown: number) {
    this.BulletCooldown = newCooldown;
  }
  public getMomentum(): number {
    return this.Mass * this.Velocity.length();
  }
  public getMomentumXY(): number {
    return this.Mass * this.Velocity.lengthXY();
  }
  public get jumpcooldown(): number {
    return this.jumpTimer;
  }
  public set jumpcooldown(input: number) {
    this.jumpTimer = input;
  }

  /* eslint-disable class-methods-use-this */
  // Methods used in WorldState for sending/recieving special properties; overridden by subclasses
  public getSpecialNumber(): number {
    return 0;
  }
  public getSpecialBoolean(): boolean {
    return false;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public setSpecialStates(num: number, bool: boolean) { }
  /* eslint-enable class-methods-use-this */

  public inKillEffect(): boolean { // Returns true if fighter is in a kill effect
    return (this.boostTimer > 0);
  }
  /* eslint-disable class-methods-use-this */
  // Called when a kill effect / boost ends; Overridden by subclasses
  protected boostEnded() { }
  /* eslint-enable class-methods-use-this */

  // Returns the fighter at the bottom of a stack of players
  public getBottomOfStack(stackTop: boolean = true): Fighter {
    if (this.riding) return this.riding.getBottomOfStack(false);
    if (stackTop) return null;
    return this;
  }
  // FOR USE IN PHYSICS ONLY--Returns the fighter at the bottom of a stack of players
  public getBottomOfStackPhysics(): Fighter {
    if (this.rodeThisTick) return this.rodeThisTick.getBottomOfStackPhysics();
    return this;
  }
  // FOR USE IN PHYSICS ONLY--Returns the total delta position from the bottom of a stack
  public getTotalStackPositionChange(stackTop: boolean = true): Vector {
    if (stackTop) { // If this is the character at the top of a stack, we do not want to include their position in the change
      return this.rodeThisTick.getTotalStackPositionChange(false);
    }

    if (this.rodeThisTick) { // If there is someone below this fighter in the stack, include them too
      return Vector.Add(
        Vector.Subtract(this.newPosition, this.lastPosition),
        this.rodeThisTick.getTotalStackPositionChange(false),
      );
    }

    return Vector.Subtract(this.newPosition, this.lastPosition); // Bottom-of-stack case--return delta position
  }

  public get constraints(): Constraint[] {
    return this.fighterConstraints;
  }
  /**
   * @summary Adds the given constraint to the array of constraints affecting this fighter
   * @param newConst New constraint to add to the constraint array
   */
  public constraintAdd(newConst: Constraint) {
    if (newConst == null) return; // Do nothing if we got an invalid object

    this.fighterConstraints.push(newConst);
    // Fire animation event for us getting constrained
    MessageBus.publish(`Animation_Constrained${this.getOwnerID()}`, newConst.type);
  }
  /**
   * @summary Removes a constraint from the array of constraints affecting this fighter
   * @param remConst Constraint to remove
   */
  public constraintRemove(remConst: Constraint) {
    const idx = this.fighterConstraints.indexOf(remConst);
    if (idx >= 0) {
      this.fighterConstraints.splice(idx, 1);
    }
  }
  /**
   * @function
   * @summary Returns a constraint with the given search paramateres, if possible
   * @param {ConstraintType} constraintType Type of constraint this is
   * @param {number} constraintOwner Fighter ID of the constraint owner
   * @returns {Constraint} Constraint object we were searching for if we found one, or null otherwise
   */
  public constraintFetch(constraintType: ConstraintType, constraintOwner: number): Constraint {
    for (let i = 0; i < this.fighterConstraints.length; i++) {
      const constraint = this.fighterConstraints[i];
      if (constraint.owner === constraintOwner && constraint.type === constraintType) {
        return constraint;
      }
    }

    return null;
  }

  /**
   * @returns {boolean} Returns true if any constraint on this fighter blocks attacking
   */
  public attackBlocked(): boolean {
    for (let i = 0; i < this.fighterConstraints.length; i++) {
      if (this.fighterConstraints[i].blocksAttack) {
        return true;
      }
    }
    return false;
  }

  /**
   * @summary Checks if we can colllide with the given fighter
   * @param otherFighter Other fighter we are colliding with
   * @returns {boolean} True if we can collide with this fighter, false if we cannot
   */
  public canCollideWith(otherFighter: Fighter): boolean {
    for (let i = 0; i < this.fighterConstraints.length; i++) {
      if (this.fighterConstraints[i].shouldIgnoreCollision(otherFighter.getOwnerID())) {
        return false;
      }
    }

    return true;
  }
}

export { Fighter as default };
