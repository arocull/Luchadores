import Vector from '../Vector';


// TraceResult - Returend by Ray.tracePlane()
class TraceResult {
  public Position: Vector; // Position where the ray collided with the surface
  public Normal: Vector; // Surface normal (direction that is 'up' from the surface)
  public collided: boolean; // Did the ray actually even hit the surface?

  constructor() {
    this.Position = new Vector(0, 0, 0);
    this.Normal = new Vector(0, 0, 0);
    this.collided = false;
  }
}

export { TraceResult as default };