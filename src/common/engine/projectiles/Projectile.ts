import Vector from '../Vector';
import Entity from '../Entity';
import Fighter from '../Fighter';

class Projectile extends Entity {
  protected Lifetime: number;
  public finished: boolean;

  public RenderStyle: string;
  public Width: number;
  public Length: number;

  protected BounceReturn: number;

  public DeltaPosition: Vector;

  constructor(
    public ProjectileType: string,
    public Owner: Fighter,
    public Damage: number,
    protected MaxLifetime: number,
    position: Vector,
    velocity: Vector,
  ) {
    super('Projectile', position, velocity, new Vector(0, 0, 0));

    this.Lifetime = 0;
    this.finished = false;

    this.RenderStyle = '#feef22';
    this.Width = 0.1;
    this.Length = 0.4;

    this.DeltaPosition = new Vector(0, 0, 0);
    this.BounceReturn = 1;
  }

  Tick(DeltaTime: number) {
    this.Lifetime += DeltaTime;

    if (this.Lifetime > this.MaxLifetime) {
      this.finished = true;
      return;
    }

    const dif = Vector.Add(
      Vector.Multiply(this.Acceleration, (DeltaTime ** 2) / 2),
      Vector.Multiply(this.Velocity, DeltaTime),
    );
    this.Position = Vector.Add(this.Position, dif);

    // Bounce
    if (this.Position.z <= 0) this.Velocity.z *= -this.BounceReturn;
  }

  // Called when projectile hits a fighter--it does damage and then marks projectile to be destroyed
  Hit(hit: Fighter) {
    if (this.Owner && hit.ID === this.Owner.ID) return;
    hit.TakeDamage(this.Damage, this.Owner);
    this.finished = true;
  }

  public getLifePercentage() {
    return this.Lifetime / this.MaxLifetime;
  }
}

export { Projectile as default };