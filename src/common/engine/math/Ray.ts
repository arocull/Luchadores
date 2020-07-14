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
    this.calculate();
  }

  // Calculates direction and length properties of the ray (call incase Ray is manipulated)
  public calculate() {
    const dir = Vector.Subtract(this.end, this.start);
    this.direction = Vector.UnitVector(dir);
    this.length = dir.length();
  }

  // Trace a plane with given center and normal
  // pass true for dualSided if we want to check collisions on both sides (may cause warping)
  public tracePlane(planeCenter: Vector, planeNormal: Vector, dualSided: boolean = false): TraceResult {
    const result = new TraceResult();

    const denom = Vector.DotProduct(planeNormal, this.direction);
    if (denom < 0 || (dualSided && Math.abs(denom) > 0)) { // Math.abs(denom) if we want to check both sides
      const t = Vector.DotProduct(Vector.Subtract(planeCenter, this.start), planeNormal) / denom;
      if (t >= 0) { // Trace hit the plane, find home position
        result.Position = Vector.Add(this.start, Vector.Multiply(this.direction, t));
        result.Normal = planeNormal;
        result.distance = Vector.Distance(this.start, result.Position);
        if (result.distance <= this.length) result.collided = true; // Make sure ray was long enough to hit
      }
    }

    return result;
  }

  /**
   * @function
   * @summary Trace an infinite cylinder with given center and radius.
   *
   * @description Made with special thanks to this guide https://www.cs.princeton.edu/courses/archive/spring14/cos426/lectures/12-ray.pdf
   *
   * @param {Vector} center The center position of the cylinder
   * @param {number} radius The radius of the cylinder--if you are colliding two cylinders, put in the radius of both for proper distancing of positions
   * @param {boolean} dualSided Whether or not this should allow collisions from traces cast inside the cylinder
   *
   * @returns {TraceResult} Returns a TraceResult
   */
  public traceCylinder(center: Vector, radius: number, dualSided: boolean = false): TraceResult {
    const result = new TraceResult();
    const L = Vector.Subtract(center, this.start);
    L.z = 0; // Level off Z component

    const distC = Vector.DotProduct(L, this.direction);
    if (distC < 0) return result; // Ray direction is not facing general direction of sphere

    const diam2 = Vector.DotProduct(L, L) - distC ** 2;
    if (diam2 > radius ** 2) return result; // Ray position near sphere is greater than sphere diameter (squared)

    const distMid = Math.sqrt(radius ** 2 - diam2);
    const t = distC - distMid; // Point closest to ray origin; to get point furthest from ray origin, distC + distMid

    if (t <= this.length) { // Make sure trace went as far as sphere
      result.Position = Vector.Add(this.start, Vector.Multiply(this.direction, t));
      result.Normal = Vector.UnitVectorXY(Vector.Subtract(result.Position, center)); // This is where it variates from a sphere (XY versus XYZ)
      if (!dualSided && Vector.DotProduct(result.Normal, this.direction) >= 0) return result; // Normal should always be somewhat opposite of ray direction
      result.distance = Vector.Distance(this.start, result.Position);
      result.collided = true;
    }
    return result;
  }

  // Returns the distance of a point to this ray
  // https://answers.unity.com/questions/62644/distance-between-a-ray-and-a-point.html
  public pointDistance(point: Vector): number {
    return Vector.Cross(this.direction, Vector.Subtract(point, this.start)).length();
  }
  public pointDistanceXY(point: Vector): number {
    const cross = Vector.Subtract(point, this.start);
    cross.z = 0;
    return Vector.Cross(Vector.UnitVectorXY(this.direction), cross).length();
  }


  public static Clone(a: Ray): Ray {
    return new Ray(Vector.Clone(a.start), Vector.Clone(a.end));
  }
}

export { Ray as default };