import Vector from '../../common/engine/Vector';

class Particle {
  protected Lifetime: number;

  public Finished: boolean;

  public Alpha: number;
  public Width: number;

  public Velocity: Vector;
  public Acceleration: Vector;

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

    this.Velocity = new Vector(0, 0, 0);
    this.Acceleration = new Vector(0, 0, 0);
  }

  Tick(DeltaTime: number) {
    this.Lifetime += DeltaTime;

    if (this.Lifetime > this.MaxLifetime) {
      this.Finished = true;
      return;
    }

    this.Alpha = 1 - (this.Lifetime / this.MaxLifetime);

    if (this.Velocity.length() > 0) {
      const dif = Vector.Add(
        Vector.Multiply(this.Acceleration, (DeltaTime ** 2) / 2),
        Vector.Multiply(this.Velocity, DeltaTime),
      );
      this.Beginning = Vector.Add(this.Beginning, dif);
      this.End = Vector.Add(this.End, dif);
    }
    if (this.Acceleration.length() > 0) {
      this.Velocity = Vector.Add(this.Velocity, Vector.Multiply(this.Acceleration, DeltaTime));
    }
  }
}

export { Particle as default };
