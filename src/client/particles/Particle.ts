import Vector from '../../common/engine/Vector';
import Entity from '../../common/engine/Entity';

class Particle extends Entity {
  protected Lifetime: number;

  public Finished: boolean;

  public Alpha: number;
  public Width: number;

  public UsePhysics: boolean;
  protected BounceReturn: number;
  protected Drag: number;

  constructor(
    public Type: string,
    public MaxLifetime: number,
    public RenderStyle: string,
    beginning: Vector,
    public End: Vector,
  ) {
    super('Particle', beginning, new Vector(0, 0, 0), new Vector(0, 0, 0));

    this.Lifetime = 0;
    this.Finished = false;
    this.Alpha = 0;
    this.Width = 0.1;

    this.UsePhysics = false;
    this.BounceReturn = 0.5;
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
      this.Position = Vector.Add(this.Position, dif);
      this.End = Vector.Add(this.End, dif);

      // Bounce
      if (this.Position.z <= 0 || this.End.z <= 0) this.Velocity.z *= -this.BounceReturn;
      // Apply drag
      if (this.Drag > 0) this.Velocity = Vector.Multiply(this.Velocity, 1 - this.Drag);

      this.Velocity = Vector.Add(this.Velocity, Vector.Multiply(this.Acceleration, DeltaTime));
    }
  }
}

export { Particle as default };
