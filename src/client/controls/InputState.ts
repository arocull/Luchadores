import { Vector } from '../../common/engine/math';

class InputState {
  public MouseX: number;
  public MouseY: number;
  public MouseDownLastFrame: boolean;

  public MouseDown: boolean;
  public MouseDirection: Vector;
  public Jump: boolean;
  public MoveDirection: Vector;

  constructor() {
    this.MouseX = 0;
    this.MouseY = 0;
    this.MouseDownLastFrame = false; // Was the mouse down last frame (click detection)?
    this.MouseDown = false; // Is the mouse down this frame?
    this.MouseDirection = new Vector(1, 0, 0); // Direction mouse is from center of screen
    this.Jump = false; // Holding spacebar
    this.MoveDirection = new Vector(0, 0, 0); // WASD or neutral
  }
}

export { InputState as default };