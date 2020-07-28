import { Vector, PiOverTwo } from '../common/engine/math';
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

  private lerpFocusPosition: Vector; // Initial focus position of lerp
  private lerpFocusPositionEnd: Vector; // End focus position of lerp (used if no focus provided)
  private lerpZoomBoost: number;
  private lerpZoomBoostEnd: number;
  private lerpTime: number; // Time progressed through lerp
  private lerpTimeMax: number; // Set lerp time
  private lerping: boolean;

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

    this.lerpFocusPosition = this.FocusPosition;
    this.lerpFocusPositionEnd = this.FocusPosition;
    this.lerpZoomBoost = 1;
    this.lerpZoomBoostEnd = 1;
    this.lerpTime = 0;
    this.lerpTimeMax = 1;
    this.lerping = false;
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
  public LerpToFocus(newFocus: Fighter, lerpTime: number = 0.15) {
    if (!newFocus) return; // Return if no focus was given
    this.lerpTimeMax = lerpTime;
    this.lerpTime = 0;
    this.lerping = true;

    this.lerpFocusPosition = Vector.Clone(this.FocusPosition);
    this.Focus = newFocus;
    this.lerpZoomBoost = this.lerpZoomBoostEnd;
    this.lerpZoomBoostEnd = 1;
  }
  public LerpToPosition(newPosition: Vector, zoomBoost: number, lerpTime: number = 0.15) {
    this.lerpTimeMax = lerpTime;
    this.lerpTime = 0;
    this.lerping = true;
    this.lerpZoomBoost = this.lerpZoomBoostEnd;
    this.lerpZoomBoostEnd = zoomBoost;

    this.lerpFocusPosition = Vector.Clone(this.FocusPosition);
    this.lerpFocusPositionEnd = Vector.Clone(newPosition);
    this.Focus = null;
  }


  private tickLerpTime(DeltaTime: number) {
    this.lerpTime += DeltaTime;
    if (this.lerpTime >= this.lerpTimeMax) {
      this.lerping = false; // End lerp
      this.lerpTime = this.lerpTimeMax;
      this.lerpZoomBoost = this.lerpZoomBoostEnd;
    }
  }
  public UpdateFocus(DeltaTime: number) { // Internal, snaps camera to focus
    let focusSpeed: number = 0; // Zoom out as speed increases to give you a slight better idea of where you're going
    let zoomBoost: number = 1; // Ranged classes get a slight zoom boost

    if (this.Focus) {
      if (this.lerping) {
        this.tickLerpTime(DeltaTime);
        const alpha = Math.sin(PiOverTwo * (this.lerpTime / this.lerpTimeMax));
        this.FocusPosition = Vector.Lerp(
          this.lerpFocusPosition,
          new Vector(this.Focus.Position.x, this.Focus.Position.y + this.Focus.Height / 2, 0),
          alpha,
        );
        zoomBoost *= (this.lerpZoomBoost * (1 - alpha) + this.lerpZoomBoostEnd * alpha);
      } else { // Focus camera on center of character
        this.FocusPosition = new Vector(this.Focus.Position.x, this.Focus.Position.y + this.Focus.Height / 2, 0);
        zoomBoost *= this.lerpZoomBoost;
      }

      let moveSpeed = this.Focus.Velocity.lengthXY(); // Get velocity of player
      if (this.Focus.riding) moveSpeed += this.Focus.riding.Velocity.lengthXY(); // Don't forget to tack in velocity of who they're riding!
      focusSpeed = Math.max(Math.min(moveSpeed, 50), 0) / 100;
      if (this.Focus.isRanged()) zoomBoost = 0.85;

      // If camera shake is enabled, do it
      if (this.Shake > 0 && RenderSettings.EnableCameraShake) {
        this.Shake -= DeltaTime * 10; // Gradually reduce camera shake over time
        if (this.Shake < 0) this.Shake = 0;

        const shake = (new Vector(Math.random() - 0.5, Math.random() - 0.5, 0)).clamp(1, 1); // Generate random shake direction
        this.FocusPosition = Vector.Add(this.FocusPosition, Vector.Multiply(shake, (Math.random() * this.Shake) / 100)); // Offset camera
      } else if (!RenderSettings.EnableCameraShake) this.Shake = 0; // Otherwise, forcibly zero camera shake
    } else if (this.lerping) { // Run lerp to position if focus does not exist
      this.tickLerpTime(DeltaTime);

      const alpha = Math.sin(PiOverTwo * (this.lerpTime / this.lerpTimeMax));
      const lastFocus = this.FocusPosition;

      this.FocusPosition = Vector.Lerp(
        this.lerpFocusPosition,
        new Vector(this.lerpFocusPositionEnd.x, this.lerpFocusPositionEnd.y + this.lerpFocusPositionEnd.z / 2, 0),
        alpha,
      );

      // Add speed depending on how fast focus changes (just for funsies)
      focusSpeed += (Vector.Subtract(this.FocusPosition, lastFocus).length()) / DeltaTime / 100;
      zoomBoost *= (this.lerpZoomBoost * (1 - alpha) + this.lerpZoomBoostEnd * alpha);
    } else {
      zoomBoost *= this.lerpZoomBoost;
    }

    // Use constant aspect ratio, set a minimum value in case of zero
    this.baseZoom = Math.max(Math.min(this.Width / this.MaxDrawWidth, this.Height / this.MaxDrawHeight), 0.001) * zoomBoost;
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