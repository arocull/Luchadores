import { Vector, PiOverTwo } from '../common/engine/math';
import Fighter from '../common/engine/Fighter';
import RenderSettings from './RenderSettings';
import { MessageBus, Subscriber } from '../common/messaging/bus';

const ClipBound = -0.2; // Only stop drawing the object if it is X * Zoom out of frame
const ClipBoundPlusOne = 1 - ClipBound;

class Camera {
  private Focus: Fighter = null;
  private FocusPosition: Vector = new Vector(0, 0, 0);

  private OffsetX: number;
  private OffsetY: number;

  private baseZoom: number;
  public Zoom: number = 20;
  public shake: number = 0;

  private lerpFocusPosition: Vector; // Initial focus position of lerp
  private lerpTime: number; // Time progressed through lerp
  private lerpTimeMax: number; // Set lerp time
  private lerping: boolean;

  private shakeListener: Subscriber = null;

  constructor(
    public Width: number, // Width of scene in pixels
    public Height: number, // Height of scene in pixels
    public MaxDrawWidth: number, // Maximum width of scene in world units
    public MaxDrawHeight: number, // Maximum height of scene in world units
  ) {
    this.Focus = null;
    this.FocusPosition = new Vector(0, 0, 0);

    this.OffsetX = Width / 2;
    this.OffsetY = Height / 2;

    this.lerpFocusPosition = this.FocusPosition;
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
  /**
   * @function SetFighterID
   * @summary Swaps camera to listen to the given fighter ID for camera shake
   * @param {number} fighter Fighter ID of the fighter to listen to for screenshake
   */
  public SetFighterID(fighter: number) {
    if (this.shakeListener) { // If we were already subscribed, unsubscribe them
      MessageBus.unsubscribe(this.shakeListener.topic, this.shakeListener.consumer);
    }
    // Subscribe new listener
    this.shakeListener = MessageBus.subscribe(`CameraShake${fighter}`, (msg) => {
      this.InduceShake(msg.amnt, msg.max);
    });
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
  }


  public UpdateFocus(DeltaTime: number) { // Internal, snaps camera to focus
    let focusSpeed: number = 0; // Zoom out as speed increases to give you a slight better idea of where you're going
    let zoomBoost: number = 1; // Ranged classes get a slight zoom boost

    if (this.Focus) {
      if (this.lerping) {
        this.lerpTime += DeltaTime;
        if (this.lerpTime >= this.lerpTimeMax) {
          this.lerping = false; // End lerp
          this.lerpTime = this.lerpTimeMax;
        }

        this.FocusPosition = Vector.Lerp(
          this.lerpFocusPosition,
          new Vector(this.Focus.Position.x, this.Focus.Position.y + this.Focus.Height / 2, 0),
          Math.sin(PiOverTwo * (this.lerpTime / this.lerpTimeMax)),
        );
      } else { // Focus camera on center of character
        this.FocusPosition = new Vector(this.Focus.Position.x, this.Focus.Position.y + this.Focus.Height / 2, 0);
      }

      let moveSpeed = this.Focus.Velocity.lengthXY(); // Get velocity of player
      if (this.Focus.riding) moveSpeed += this.Focus.riding.Velocity.lengthXY(); // Don't forget to tack in velocity of who they're riding!
      focusSpeed = Math.max(Math.min(moveSpeed, 50), 0) / 100;
      if (this.Focus.isRanged()) zoomBoost = 0.88; // 0.85

      // If camera shake is enabled, do it
      if (this.shake > 0 && RenderSettings.EnableCameraShake) {
        this.shake -= DeltaTime * 10; // Gradually reduce camera shake over time
        if (this.shake < 0) this.shake = 0;

        const shake = Vector.UnitVector(new Vector(Math.random() - 0.5, Math.random() - 0.5, 0)); // Generate random shake direction
        this.FocusPosition = Vector.Add(this.FocusPosition, Vector.Multiply(shake, (Math.random() * this.shake) / 100)); // Offset camera
      } else if (!RenderSettings.EnableCameraShake) this.shake = 0;
    }

    // Use constant aspect ratio, set a minimum value in case of zero
    this.baseZoom = Math.max(Math.min(this.Width / this.MaxDrawWidth, this.Height / this.MaxDrawHeight), 0.001) * zoomBoost;
    const alpha = DeltaTime * 3; // Lerp speed

    // Smoothly lerp visual zoom to reduce motion, but do not allow it to reach zero
    this.Zoom = Math.max(Math.min(this.baseZoom, (this.Zoom * (1 - alpha) + (this.baseZoom - focusSpeed * this.baseZoom) * alpha)), 0.0001);
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
  /**
   * @function InduceShake
   * @summary Induces camera shake
   * @param {number} amount Amount of camera shake to induce
   * @param {number} max Maximum amount of camera shake that can be induced from this effect
   */
  public InduceShake(amount: number, max: number) {
    // If this newly added shake amount would surpass the maximum it could induce, clamp it
    if (this.shake + amount > max) {
      // eslint-disable-next-line no-param-reassign
      amount = Math.max(max - this.shake, 0); // Clamp camera shake increase to different, or 0
    }

    this.shake += amount; // Add in camera shake
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

  /**
   * @function ScreenToWorld
   * @summary Takes a 2D screen position and converts it into an engine-readable coordinate (XY only)
   * @param {number} inputX Screen X coordinate
   * @param {number} inputY Screen Y coordinate
   * @returns {Vector} Engine-readable coordinate (XY only)
   */
  public ScreenToWorld(inputX: number, inputY: number): Vector {
    return new Vector(
      this.FocusPosition.x - ((inputX - this.OffsetX) / (-this.Zoom)),
      this.FocusPosition.y - ((inputY - this.OffsetY) / this.Zoom),
      0,
    );
  }
  // Returns scene width of Camera in pixels
  public getScreenWidth(): number {
    return this.Width;
  }
  // Returns scene height of Camera in pixels
  public getScreenHeight(): number {
    return this.Height;
  }
}

export { Camera as default };