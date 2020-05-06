import Vector from '../common/engine/Vector';
import Fighter from '../common/engine/Fighter';
import RenderSettings from './RenderSettings';

const ClipBound = -0.2; // Only stop drawing the object if it is X * Zoom out of frame
const ClipBoundPlusOne = 1 - ClipBound;

class Camera {
  private Focus: Fighter;
  private FocusPosition: Vector;

  private OffsetX: number;
  private OffsetY: number;

  private baseZoom: number;
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
    let focusSpeed: number = 0; // Zoom out as speed increases to give you a slight better idea of where you're going
    let zoomBoost: number = 1; // Ranged classes get a slight zoom boost

    if (this.Focus) {
      // Focus camera on center of character
      this.FocusPosition = new Vector(this.Focus.Position.x, this.Focus.Position.y + this.Focus.Height / 2, 0);

      focusSpeed = Math.max(Math.min(this.Focus.Velocity.lengthXY(), 50), 0) / 100;
      if (this.Focus.isRanged()) zoomBoost = 0.9;

      // If camera shake is enabled, do it
      if (this.Shake > 0 && this.Settings.EnableCameraShake) {
        this.Shake -= DeltaTime * 10; // Gradually reduce camera shake over time
        if (this.Shake < 0) this.Shake = 0;

        const shake = (new Vector(Math.random() - 0.5, Math.random() - 0.5, 0)).clamp(1, 1); // Generate random shake direction
        this.FocusPosition = Vector.Add(this.FocusPosition, Vector.Multiply(shake, (Math.random() * this.Shake) / 100)); // Offset camera
      } else if (!this.Settings.EnableCameraShake) this.Shake = 0;
    }

    // Use constant aspect ratio
    this.baseZoom = Math.min(this.Width / this.MaxDrawWidth, this.Height / this.MaxDrawHeight) * zoomBoost;
    const alpha = DeltaTime * 3; // Lerp speed

    // Smoothly lerp visual zoom to reduce motion
    this.Zoom = Math.min(this.baseZoom, (this.Zoom * (1 - alpha) + (this.baseZoom - focusSpeed * this.baseZoom) * alpha));
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
    return new Vector(
      -(this.FocusPosition.x - pos.x) * this.Zoom + this.OffsetX,
      (
        (this.FocusPosition.y - pos.y)
        + (this.FocusPosition.z - pos.z)
      ) * this.Zoom + this.OffsetY,
      0,
    );
  }
  // Returns true of the position is "in frame" and should be drawn
  public InFrame(input: Vector): boolean {
    const pos = this.PositionOffset(input);

    return (
      pos.x > this.Width * ClipBound
      && pos.x < this.Width * ClipBoundPlusOne
      && pos.y > this.Height * ClipBound
      && pos.y < this.Height * ClipBoundPlusOne
    );
  }
}

export { Camera as default };