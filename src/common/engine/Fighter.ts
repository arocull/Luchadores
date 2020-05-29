// Includes Vector.js
import Vector from './Vector';
import Prop from './props/Prop';
import { EntityType, FighterType, ColliderType } from './Enums';

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
  public LastHitBy: number;

  public Flipped: boolean;
  public Animator: any;
  public UpdatesMissed: number;
  public DisplayName: string;

  public JustHitPosition: Vector;
  public JustHitMomentum: number;
  public JustLanded: boolean;
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
    // super(EntityType.Fighter, position, new Vector(0, 0, 0), new Vector(0, 0, 0));
    super(position, ColliderType.Cylinder, Radius, Height, Radius);
    this.type = EntityType.Fighter;

    this.MaxHP = HP;

    this.Kills = 0; // How many kills this fighter has racked up this life
    this.LastHitBy = -1; // Player ID of last attacker

    this.Flipped = false; // Do we draw them facing leftward or rightward?
    this.Animator = null; // Animation object
    this.UpdatesMissed = 0;
    this.DisplayName = null;

    this.JustHitPosition = new Vector(0, 0, 0);
    this.JustHitMomentum = 0;
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
  }


  // Takes damage from the set attacker, does NOT handle kills (kills should only be handled by server)
  public TakeDamage(dmg: number, attacker: Fighter) {
    this.HP -= dmg;

    if (attacker) this.LastHitBy = attacker.ID;
    if (this.HP < 0) this.HP = 0;
  }
  // Award this fighter a kill, can be overridden by subclasses for special abilities
  public EarnKill() {
    this.Kills++;

    // Restore some HP upon earning a kill
    this.HP = Math.min(this.HP + KILL_HEALTH_RETURN * this.MaxHP, this.MaxHP);
  }


  // If this collided with another fighter, set state
  public CollideWithFighter(hit: Fighter, momentum: number) {
    this.JustHitPosition = Vector.Average(this.Position, hit.Position);
    this.JustHitMomentum = momentum;
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
    return (this.Firing && this.BulletCooldown <= 0);
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


  // Jump if this character is currently on the ground
  public Jump(force: boolean = false) {
    if (this.Position.z <= 0 || this.JustLanded || force) {
      this.Velocity.z += this.JumpVelocity;
      this.dismountRider = true;
    }
  }

  // Sets the fighter's acceleration in the given vector
  public Move(direction: Vector) {
    this.Acceleration = Vector.Multiply(Vector.UnitVectorXY(direction), this.MoveAcceleration);
  }

  // Called when the fighter has just landed after spending time in the air, can be overriden for special functionality
  public Land() {
    this.JustLanded = true;
  }

  // Returns true if the fighter is falling or not
  public isFalling(): boolean {
    return !(this.Position.z <= 0 || this.riding || this.onSurface) || this.Velocity.z > 0;
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
    this.JustHitMomentum = 0;
    this.BulletShock = 0;

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
}

export { Fighter as default };
