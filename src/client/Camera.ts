import Vector from '../common/engine/Vector';
import Fighter from '../common/engine/Fighter';
import RenderSettings from './RenderSettings';

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
    public Settings: RenderSettings,
  ) {
    this.Focus = null;
    this.FocusPosition = new Vector(0, 0, 0);

    this.Zoom = 20;
    this.Shake = 0;

    this.OffsetX = Width / 2;
    this.OffsetY = Height / 2;
  }

  // Call this when viewport is resized--adjusts internal variables
  public Scale(newWidth: number, newHeight: number) {
    this.Width = newWidth;
    this.Height = newHeight;
    this.OffsetX = newWidth / 2;
    this.OffsetY = newHeight / 2;
  }

  public SetFocus(newFocus: Fighter) { // Should we lerp to new focus or simply snap to them?
    if (newFocus) this.Focus = newFocus;
  }
  public UpdateFocus(DeltaTime: number) { // Internal, snaps camera to focus
    if (this.Focus) {
      // Focus camera on center of character
      this.FocusPosition = new Vector(this.Focus.Position.x, this.Focus.Position.y + this.Focus.Height / 2, 0);

      // If camera shake is enabled, do it
      if (this.Shake > 0 && this.Settings.EnableCameraShake) {
        this.Shake -= DeltaTime * 10; // Gradually reduce camera shake over time
        if (this.Shake < 0) this.Shake = 0;

        const shake = (new Vector(Math.random() - 0.5, Math.random() - 0.5, 0)).clamp(1, 1); // Generate random shake direction
        this.FocusPosition = Vector.Add(this.FocusPosition, Vector.Multiply(shake, (Math.random() * this.Shake) / 100)); // Offset camera
      } else if (!this.Settings.EnableCameraShake) this.Shake = 0;
    }

    // Use constant aspect ratio
    this.Zoom = Math.min(this.Width / this.MaxDrawWidth, this.Height / this.MaxDrawHeight);
  }


  // Disables camera tracking and forces the camera to focus on a set position
  public ClearFocus(newFocus: Vector) { // Choose position to focus on and clear focused fighter
    this.Focus = null;
    this.FocusPosition = newFocus;
  }
  // Override current focus position, for use when no focus is present
  public SetFocusPosition(position: Vector) {
    this.FocusPosition = position;
  }
  // Returns the current focus position of the camera
  public GetFocusPosition(): Vector {
    return this.FocusPosition;
  }

  // Gets position's offset relative to the camera focal point
  public PositionOffsetBasic(pos: Vector): Vector {
    return Vector.Subtract(this.FocusPosition, pos);
  }
  // Converts the position into a 2D coordinate that can be drawn on the canvas
  public PositionOffset(pos: Vector): Vector {
    const vect = Vector.Multiply(Vector.Subtract(this.FocusPosition, pos), this.Zoom);
    vect.x *= -1;
    vect.x += this.OffsetX;
    vect.y += vect.z + this.OffsetY;
    return vect;
  }
}

export { Camera as default };