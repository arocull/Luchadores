// Includes Vector.js
import Vector from './Vector';
import Entity from './Entity';
import { EntityType, FighterType } from './Enums';

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
class Fighter extends Entity {
  public MaxHP: number;

  public Kills: number;
  public LastHitBy: number;

  public Flipped: boolean;
  public Animator: any;

  public JustHitPosition: Vector;
  public JustHitMomentum: number;
  public JustLanded: boolean;

  protected ranged: boolean;
  public AimDirection: Vector;
  public Firing: boolean;
  protected BulletCooldown: number;
  public BulletShock: number;

  constructor(
    public HP: number,
    public Mass: number, // How much mass this fighter has, used in momentum calculations
    public MaxMomentum: number, // Essentially max speed of character
    public Radius: number, // Collision and draw radius
    public Height: number, // Collision and draw height
    private JumpVelocity: number, // The velocity or power this character jumps with
    private MoveAcceleration: number, // Maximum acceleration one can reach from standard inputs
    private character: FighterType, // What class this fighter is so we can differentiate between characters
    private ID: number, // Player/entity ID of this fighter so we can tell who's who
    position: Vector,
  ) {
    super(EntityType.Fighter, position, new Vector(0, 0, 0), new Vector(0, 0, 0));

    this.MaxHP = HP;

    this.Kills = 0; // How many kills this fighter has racked up this life
    this.LastHitBy = -1; // Player ID of last attacker

    this.Flipped = false; // Do we draw them facing leftward or rightward?
    this.Animator = null; // Animation object

    this.JustHitPosition = new Vector(0, 0, 0);
    this.JustHitMomentum = 0;

    this.ranged = true;
    this.AimDirection = new Vector(1, 0, 0);
    this.Firing = false;
    this.BulletCooldown = 0;
    this.BulletShock = 0;
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
  }


  // If this collided with another fighter, set state
  public CollideWithFighter(hit: Fighter, momentum: number) {
    this.JustHitPosition = Vector.Average(this.Position, hit.Position);
    this.JustHitMomentum = momentum;
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
  public tryBullet(): any[] {
    const bullets: any[] = []; // List of bullets generated (multiple may be produced at a time)

    // Fire a bullet--if time had passed to the point where multiple bullets could have been fired, fire all of them and tick them accordingly
    while (this.canFirebullet()) {
      const t = Math.abs(this.BulletCooldown); // Time since bullet was fireable

      const b = this.fireBullet();

      if (b === null) return bullets; // If no bullet was generated, stop here

      if (t > 0) b.Tick(t); // If a bullet was generated, tick it according to 'when' it was fired
      bullets.push(b);
    }

    return bullets;
  }


  // Jump if this character is currently on the ground
  public Jump() {
    if (this.Position.z <= 0) this.Velocity.z += this.JumpVelocity;
  }

  // Sets the fighter's acceleration in the given vector
  public Move(direction: Vector) {
    this.Acceleration = Vector.Multiply(Vector.UnitVector(direction), this.MoveAcceleration);
  }

  // Called when the fighter has just landed after spending time in the air, can be overriden for special functionality
  public Land() {
    this.JustLanded = true;
  }

  // Sets aim direction of fighter
  public aim(direction: Vector) {
    this.AimDirection = direction;
  }

  // Ticks the fighter by set amount of time, reduces cooldowns and resets states
  public tickCooldowns(DeltaTime: number) {
    // Reset states
    this.JustLanded = false;
    this.JustHitMomentum = 0;
    this.BulletShock = 0;

    if (this.BulletCooldown <= 0) this.BulletCooldown = 0; // Zeros cooldown
    else this.BulletCooldown -= DeltaTime; // Otherwise, tick cooldown (if it gets below zero and player is still firing, stream stays continous)
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
}

export { Fighter as default };
