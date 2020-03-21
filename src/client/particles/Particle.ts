import Vector from '../../common/engine/Vector';
import Entity from '../../common/engine/Entity';

class Particle extends Entity {
  protected Lifetime: number;

  public Finished: boolean;

  public Alpha: number;
  public Width: number;

  public UsePhysics: boolean; // Upon ticking, do we update its position and velocity?
  protected BounceReturn: number; // Does it bounce off the ground? How much?
  protected Drag: number; // How much should its speed be dampened as it moves through the air
  protected Trail: number; // Should the tail of the particle slowly follow its head, or operate statically?

  constructor(
    public ParticleType: string,
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
    this.Trail = 0;
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

      if (this.Trail > 0) {
        const trailPoint = Vector.Subtract(this.Position, Vector.Multiply(Vector.UnitVector(this.Velocity), Vector.Distance(this.Position, this.End)));
        this.End = Vector.Lerp(this.End, trailPoint, DeltaTime * this.Trail);
      }

      // Bounce
      if (this.Position.z <= 0 || this.End.z <= 0) this.Velocity.z *= -this.BounceReturn;
      // Apply drag
      if (this.Drag > 0) this.Velocity = Vector.Multiply(this.Velocity, 1 - this.Drag * DeltaTime);

      this.Velocity = Vector.Add(this.Velocity, Vector.Multiply(this.Acceleration, DeltaTime));
    }
  }

  public static RGBToHex(r: number, g: number, b: number):string {
    let hR = Math.floor(r + 0.5).toString(16);
    let hG = Math.floor(g + 0.5).toString(16);
    let hB = Math.floor(b + 0.5).toString(16);
    if (hR.length < 2) hR = `0${hR}`;
    if (hG.length < 2) hG = `0${hG}`;
    if (hB.length < 2) hB = `0${hB}`;
    return `#${hR}${hG}${hB}`;
  }
}

export { Particle as default };
