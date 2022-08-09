import Vector from '../Vector';

/**
 * @class Quaternion
 * Used for 3D transforms like rotating vectors
 * without the constant need to work with Euler angles,
 * and without running into issues like gimbal lock.
 *
 * Reference https://github.com/go-gl/mathgl/blob/master/mgl64/quat.go
 */
class Quaternion {
  /**
   * @constructor Generates an identity quaternion
   * @param w 4th dimension of quaternion
   * @param vect Vector properties of quaternion
   */
  constructor(public w: number = 1, private vect: Vector = new Vector(0, 0, 0)) {}

  // Getters and Setters //

  public set x(inp: number) {
    this.vect.x = inp;
  }
  public set y(inp: number) {
    this.vect.x = inp;
  }
  public set z(inp: number) {
    this.vect.x = inp;
  }
  public get x(): number {
    return this.vect.x;
  }
  public get y(): number {
    return this.vect.y;
  }
  public get z(): number {
    return this.vect.z;
  }
  public set xyz(inp: Vector) {
    this.vect = inp;
  }
  public get xyz(): Vector {
    return Vector.Clone(this.vect);
  }

  /**
   * @summary Returns the computed length of the quaternion
   * This is equivalent of getting the length of a 4D Vector
   */
  public get length(): number {
    return Math.sqrt(this.lengthSquared);
  }

  public get lengthSquared(): number {
    return (this.w ** 2) + this.vect.lengthSquared();
  }

  // Functions //

  /**
   * @summary Rotates a given vector by this quaternion
   * @param {Vector} inp Input vector to rotate
   * @returns {Vector} Rotated vector
   */
  public rotate(inp: Vector): Vector {
    const cross = Vector.Cross(this.vect, inp);
    return Vector.AddMany(
      inp,
      Vector.Multiply(cross, 2 * this.w),
      Vector.Cross(Vector.Multiply(this.vect, 2), cross),
    );
  }

  // Algebraic //

  /**
   * @summary Directly adds two quaternions
   * @param a Quat A
   * @param b Quat B
   * @returns {Quaternion} A + B
   */
  public static Add(a: Quaternion, b: Quaternion): Quaternion {
    return new Quaternion(a.w + b.w, Vector.Add(a.vect, b.vect));
  }
  /**
   * @summary Directly subtracts two quaternions
   * @param a Quat A
   * @param b Quat B
   * @returns {Quaternion} A - B
   */
  public static Subtract(a: Quaternion, b: Quaternion): Quaternion {
    return new Quaternion(a.w - b.w, Vector.Subtract(a.vect, b.vect));
  }

  /**
   * @summary Multiplies two quaternions. Order matters.
   * @param a Quat A
   * @param b Quat B
   * @returns A * B
   */
  public static Multiply(a: Quaternion, b: Quaternion): Quaternion {
    const cross = Vector.Cross(a.vect, b.vect);
    const addend1 = Vector.Multiply(b.vect, a.w);
    const addend2 = Vector.Multiply(a.vect, b.w);
    return new Quaternion(
      (a.w * b.w) - Vector.DotProduct(a.vect, b.vect),
      Vector.AddMany(cross, addend1, addend2),
    );
  }

  /**
   * @summary Scales the quaternion
   * @param a Quat A
   * @param b Scalar B
   * @returns A * B
   */
  public static Scale(a: Quaternion, b: number): Quaternion {
    return new Quaternion(a.w * b, Vector.Multiply(a.vect, b));
  }

  /**
   * @summary Returns a dot product between two quaternions, order does not matter
   * @param a Quat A
   * @param b Quat B
   * @returns {number} A dot B
   */
  public static Dot(a: Quaternion, b: Quaternion): number {
    return (a.w * b.w) + Vector.DotProduct(a.vect, b.vect);
  }

  // QUAT EDITING //

  /**
   * @summary Returns the conjugate of the quaternion
   * @param a Quat A
   * @returns Conjguate of A
   */
  public static Conjugate(a: Quaternion): Quaternion {
    return new Quaternion(a.w, Vector.Multiply(a.vect, -1));
  }

  /**
   * @summary Returns the inverse of the quaternion
   * @param a Quat A
   * @returns Inverse of A
   */
  public static Inverse(a: Quaternion): Quaternion {
    return Quaternion.Scale(Quaternion.Conjugate(a), 1 / a.lengthSquared);
  }

  /**
   * @summary Normalizes the quaternion, same as normalizing a 4D vector
   * @param a Quat A
   * @returns Normalized version of A
   */
  public static Normalize(a: Quaternion): Quaternion {
    const len = a.length;

    if (len === 1) {
      return a;
    }
    if (len === 0) {
      return new Quaternion();
    }

    return Quaternion.Scale(a, 1 / len);
  }

  /**
   * @summary Generates a quaternion from the given axis angle
   * @param theta Angle to rotate quaternion by, in radians
   * @param axis Axis to rotate quaternion on
   * @returns A rotated on the given axis by theta
   */
  public static FromAxisAngle(theta: number, axis: Vector): Quaternion {
    return new Quaternion(Math.cos(theta / 2), Vector.Multiply(axis, Math.sin(theta / 2)));
  }

  // INTERPOLATION //

  /**
   * @summary Performs a spherical interpolation between two quaternions.
   * This enforces the shortest distance between two points.
   * NLerp is faster than this, but slightly sloppier.
   * @param a Quat A - MUST be normalized
   * @param b Quat B - MUST be normalized
   * @param alpha Scalar Alpha
   * @returns Normalized and spherically interpolated A and B
   */
  public static SLerp(a: Quaternion, b: Quaternion, alpha: number): Quaternion {
    let dot = Quaternion.Dot(a, b);

    // If the two quaternions are very close, NLerp is indistinguishable from this
    if (dot > 0.9995) {
      return Quaternion.NLerp(a, b, alpha);
    }

    // Ensure floating point doesn't mess us up by clamping dot product from -1 to 1
    dot = Math.min(Math.max(dot, 1), -1);

    const theta = Math.acos(dot) * alpha; // Get distance between quaternions
    const c = Math.cos(theta);
    const s = Math.sin(theta);

    // I'm guessing this is the relative direction to B from A?
    const rel = Quaternion.Normalize(Quaternion.Subtract(b, Quaternion.Scale(a, dot)));

    return Quaternion.Add(Quaternion.Scale(a, c), Quaternion.Scale(rel, s));
  }
  /**
   * @summary Performs a linear interpolation between two quaternions
   * @param a Quat A
   * @param b Quat B
   * @param alpha Scalar Alpha
   * @returns A * (1 - Alpha) + B * Alpha
   */
  public static Lerp(a: Quaternion, b: Quaternion, alpha: number): Quaternion {
    return Quaternion.Add(Quaternion.Scale(a, 1 - alpha), Quaternion.Scale(b, alpha));
  }
  /**
   * @summary Performs a normalized, linear interpolation between two quaternions
   * @param a Quat A
   * @param b Quat B
   * @param alpha Scalar Alpha
   * @returns Normalization of A * (1 - Alpha) + B * Alpha
   */
  public static NLerp(a: Quaternion, b: Quaternion, alpha: number): Quaternion {
    return Quaternion.Normalize(Quaternion.Lerp(a, b, alpha));
  }
}

export { Quaternion as default };