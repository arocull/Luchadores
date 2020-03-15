import Vector from '../../common/engine/Vector';

class Particle {
  protected Lifetime: number;

  public Finished: boolean;

  public Alpha: number;
  public Width: number;

  public UsePhysics: boolean;
  public Velocity: Vector;
  public Acceleration: Vector;
  public BounceReturn: number;
  public Drag: number;

  constructor(
    public Type: string,
    public MaxLifetime: number,
    public RenderStyle: string,
    public Beginning: Vector,
    public End: Vector,
  ) {
    this.Lifetime = 0;
    this.Finished = false;
    this.Alpha = 0;
    this.Width = 1;

    this.UsePhysics = false;
    this.Velocity = new Vector(0, 0, 0);
    this.Acceleration = new Vector(0, 0, 0);
    this.BounceReturn = 0.3;
    this.Drag = 0.1;
  }

  Tick(DeltaTime: number) {
    this.Lifetime += DeltaTime;

    if (this.Lifetime > this.MaxLifetime) {
      this.Finished = true;
      return;
    }

    this.Alpha = 1 - (this.Lifetime / this.MaxLifetime);

    if (this.UsePhysics) {
      const dif = Vector.Add(
        Vector.Multiply(this.Acceleration, (DeltaTime ** 2) / 2),
        Vector.Multiply(this.Velocity, DeltaTime),
      );
      this.Beginning = Vector.Add(this.Beginning, dif);
      this.End = Vector.Add(this.End, dif);

      // Bounce
      if (this.Beginning.z <= 0 || this.End.z <= 0) this.Velocity = Vector.Multiply(this.Velocity, -this.BounceReturn);
      // Apply drag
      if (this.Drag > 0) this.Velocity = Vector.Multiply(this.Velocity, 1 - this.Drag);

      this.Velocity = Vector.Add(this.Velocity, Vector.Multiply(this.Acceleration, DeltaTime));
    }
  }
}

export { Particle as default };
