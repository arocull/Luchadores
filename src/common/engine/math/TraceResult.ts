import Vector from '../Vector';


// TraceResult - Info about ray trace results
class TraceResult {
  public Position: Vector; // Position where the ray collided with the surface
  public Normal: Vector; // Surface normal (direction that is 'up' from the surface)
  public collided: boolean; // Did the ray actually even hit the surface?
  public distance: number; // Distance from the ray origin this trace collided at
  public hitInfo: any; // Info about the trace or collision, can be set to anything

  constructor() {
    this.Position = new Vector(0, 0, 0);
    this.Normal = new Vector(0, 0, 0);
    this.collided = false;
    this.distance = 0;
    this.hitInfo = null;
  }
}

export { TraceResult as default };