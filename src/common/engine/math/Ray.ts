import Vector from '../Vector';
import TraceResult from './TraceResult';

/* Useful guides:
Check plane collision https://stackoverflow.com/questions/23975555/how-to-do-ray-plane-intersection
Other primitives https://www.cs.princeton.edu/courses/archive/spring14/cos426/lectures/12-ray.pdf
*/

// Ray - Contains
class Ray {
  public direction: Vector;
  public length: number;

  constructor(public start: Vector, public end: Vector) {
    const dir = Vector.Subtract(end, start);
    this.direction = Vector.UnitVector(dir);
    this.length = dir.length();
  }

  // Plane
  public tracePlane(planeCenter: Vector, planeNormal: Vector): TraceResult {
    const result = new TraceResult();

    const denom = Vector.DotProduct(planeNormal, this.direction);
    if (Math.abs(denom) > 0) {
      const t = Vector.DotProduct(Vector.Subtract(planeCenter, this.start), planeNormal) / denom;
      if (t >= 0) { // Trace hit the plane, find home position
        result.Position = Vector.Add(this.start, Vector.Multiply(this.direction, t));
        result.Normal = planeNormal;
        result.collided = true;
      }
    }

    return result;
  }
}

export { Ray as default };