// Includes Vector.js
import Vector from './Vector';
import Entity from './Entity';

// A standard fighter with basic properties shared by all characters
class Fighter extends Entity {
  public MaxHP: number;

  public Kills: number;
  public LastHitBy: number;

  public Flipped: boolean;
  public Animator: any;

  public JustHitPosition: Vector;
  public JustHitMomentum: number;
  public JustLanded: boolean;
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
    public Class: string, // What class this fighter is so we can differentiate between characters
    public ID: number, // Player/entity ID of this fighter so we can tell who's who
    position: Vector,
  ) {
    super('Fighter', position, new Vector(0, 0, 0), new Vector(0, 0, 0));

    this.MaxHP = HP;

    this.Kills = 0; // How many kills this fighter has racked up this life
    this.LastHitBy = -1; // Player ID of last attacker

    this.Flipped = false; // Do we draw them facing leftward or rightward?
    this.Animator = null; // Animation object

    this.JustHitPosition = new Vector(0, 0, 0);
    this.JustHitMomentum = 0;
    this.AimDirection = new Vector(1, 0, 0);
    this.Firing = false;
    this.BulletCooldown = 0;
    this.BulletShock = 0;
  }


  public TakeDamage(dmg: number, attacker: Fighter) {
    this.HP -= dmg;

    if (attacker) this.LastHitBy = attacker.ID;
    if (this.HP < 0) this.HP = 0;
  }
  public EarnKill() {
    this.Kills++;
  }


  public CollideWithFighter(hit: Fighter, momentum: number) {
    this.JustHitPosition = Vector.Average(this.Position, hit.Position);
    this.JustHitMomentum = momentum;
  }
  /* eslint-disable class-methods-use-this */
  public fireBullet(): any {
    return null;
  }
  /* eslint-enable class-methods-use-this */
  public canFirebullet(): boolean {
    return (this.Firing && this.BulletCooldown <= 0);
  }
  public tryBullet(): any[] {
    const bullets: any[] = [];

    // Fire a bullet--if time had passed to the point where multiple bullets could have been fired, fire all of them and tick them accordingly
    for (let i = 0; i < 10 && this.BulletCooldown <= 0; i++) {
      const t = Math.abs(this.BulletCooldown);

      if (this.canFirebullet()) {
        const b = this.fireBullet();

        if (b === null) return bullets;

        if (t > 0) b.Tick(t);
        bullets.push(b);
      }
    }

    return bullets;
  }


  public Jump() {
    if (this.Position.z <= 0) {
      this.Velocity.z += this.JumpVelocity;
    }
  }
  public Move(direction: Vector) {
    this.Acceleration = Vector.Multiply(Vector.UnitVector(direction), this.MoveAcceleration);
  }
  public Land() {
    this.JustLanded = true;
  }
  public Click(direction: Vector) {
    this.AimDirection = direction;
  }
  public tickCooldowns(DeltaTime: number) {
    this.JustLanded = false;
    this.JustHitMomentum = 0;
    this.BulletShock = 0;

    if (this.BulletCooldown <= 0) this.BulletCooldown = 0;
    else this.BulletCooldown -= DeltaTime;
  }
}

export { Fighter as default };
