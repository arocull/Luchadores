import Vector from '../common/engine/Vector';
import Fighter from '../common/engine/Fighter';

class Camera {
  protected Focus: Fighter;
  protected FocusPosition: Vector;

  public Zoom: number;

  constructor(
    public Width: number,
    public Height: number,
    public MaxDrawWidth: number,
    public MaxDrawHeight: number,
  ) {
    this.Focus = null;
    this.FocusPosition = new Vector(0, 0, 0);
  }

  public SetFocus(newFocus: Fighter) { // Should we lerp to new focus or simply snap to them?
    if (newFocus) this.Focus = newFocus;
  }

  public UpdateFocus() { // Internal, lerps camera to focus
    if (this.Focus) {
      this.FocusPosition = new Vector(this.Focus.Position.x, this.Focus.Position.y, 0);
    }

    // Use constant aspect ratio
    this.Zoom = Math.min(this.Width / this.MaxDrawWidth, this.Height / this.MaxDrawHeight);
  }

  public ClearFocus(newFocus: Vector) { // Choose position to focus on and clear focused fighter
    this.Focus = null;
    this.FocusPosition = newFocus;
  }

  public PositionOffset(pos: Vector): Vector {
    return Vector.Subtract(this.FocusPosition, pos);
  }

  public PositionOffsetMap(pos: Vector, offsetX: number, offsetY: number): Vector {
    const vect = Vector.Multiply(this.PositionOffset(pos), this.Zoom);
    vect.x *= -1;
    vect.x += offsetX;
    vect.y += vect.z + offsetY;
    return vect;
  }
}

export { Camera as default };