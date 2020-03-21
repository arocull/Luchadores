import Vector from '../common/engine/Vector';
import Fighter from '../common/engine/Fighter';

class Camera {
  private Focus: Fighter;
  private FocusPosition: Vector;

  private OffsetX: number;
  private OffsetY: number;

  public Zoom: number;
  public Shake: number;

  constructor(
    public Width: number,
    public Height: number,
    public MaxDrawWidth: number,
    public MaxDrawHeight: number,
  ) {
    this.Focus = null;
    this.FocusPosition = new Vector(0, 0, 0);

    this.Zoom = 20;
    this.Shake = 0;

    this.OffsetX = Width / 2;
    this.OffsetY = Height / 2;
  }

  public Scale(newWidth: number, newHeight: number) {
    this.Width = newWidth;
    this.Height = newHeight;
    this.OffsetX = newWidth / 2;
    this.OffsetY = newHeight / 2;
  }

  public SetFocus(newFocus: Fighter) { // Should we lerp to new focus or simply snap to them?
    if (newFocus) this.Focus = newFocus;
  }
  public UpdateFocus(DeltaTime: number) { // Internal, lerps camera to focus
    if (this.Focus) {
      this.FocusPosition = new Vector(this.Focus.Position.x, this.Focus.Position.y, 0);

      if (this.Shake > 0) {
        this.Shake -= DeltaTime * 10;
        if (this.Shake < 0) this.Shake = 0;

        const shake = (new Vector(Math.random() - 0.5, Math.random() - 0.5, 0)).clamp(1, 1);
        this.FocusPosition = Vector.Add(this.FocusPosition, Vector.Multiply(shake, (Math.random() * this.Shake) / 100));
      }
    }

    // Use constant aspect ratio
    this.Zoom = Math.min(this.Width / this.MaxDrawWidth, this.Height / this.MaxDrawHeight);
  }
  public ClearFocus(newFocus: Vector) { // Choose position to focus on and clear focused fighter
    this.Focus = null;
    this.FocusPosition = newFocus;
  }

  public PositionOffsetBasic(pos: Vector): Vector {
    return Vector.Subtract(this.FocusPosition, pos);
  }
  public PositionOffset(pos: Vector): Vector {
    const vect = Vector.Multiply(Vector.Subtract(this.FocusPosition, pos), this.Zoom);
    vect.x *= -1;
    vect.x += this.OffsetX;
    vect.y += vect.z + this.OffsetY;
    return vect;
  }
}

export { Camera as default };