import Vector from '../Vector';
import Fighter from '../Fighter';

class Projectile {
  protected Lifetime: number;
  public Finished: boolean;

  public RenderStyle: string;
  public Width: number;
  public Length: number;

  public Acceleration: Vector;
  protected BounceReturn: number;

  public DeltaPosition: Vector;

  constructor(
    public Type: string,
    public Owner: Fighter,
    public Damage: number,
    public MaxLifetime: number,
    public Position: Vector,
    public Velocity: Vector,
  ) {
    this.Lifetime = 0;
    this.Finished = false;

    this.RenderStyle = '#feef22';
    this.Width = 0.1;
    this.Length = 0.4;

    this.Acceleration = new Vector(0, 0, 0);
    this.DeltaPosition = new Vector(0, 0, 0);
    this.BounceReturn = 1;
  }

  Tick(DeltaTime: number) {
    this.Lifetime += DeltaTime;

    if (this.Lifetime > this.MaxLifetime) {
      this.Finished = true;
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

  Hit(hit: Fighter) {
    if (this.Owner && hit.ID === this.Owner.ID) return;
    hit.TakeDamage(this.Damage, this.Owner);
    this.Finished = true;
  }

  // Create a string containing only necessary information about this projectile for use for sending to clients
  public ToPacket():string {
    let str = `{id:${this.Owner.ID},t:${this.Type},d:${this.Damage},`;
    str += `p:[${this.Position.x},${this.Position.y},${this.Position.z}],`;
    str += `v:[${this.Velocity.x},${this.Velocity.y},${this.Velocity.z}],`;
    str += `a:[${this.Acceleration.x},${this.Acceleration.y},${this.Acceleration.z}]}`;

    return str;
  }
}

export { Projectile as default };