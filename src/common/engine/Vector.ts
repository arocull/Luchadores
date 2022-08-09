const TwoPI = Math.PI * 2;

class Vector { // A structure that holds position data or direction and magnitude
  public x: number;

  public y: number;

  public z: number;

  constructor(X: number = 0, Y: number = 0, Z: number = 0) {
    this.x = X;
    this.y = Y;
    this.z = Z;
  }

  // Returns length of this vector (or should this be static?)
  public length():number {
    return Math.sqrt(this.lengthSquared());
  }
  public lengthXY():number {
    return Math.sqrt(this.lengthSquaredXY());
  }
  public lengthSquared(): number {
    return (this.x ** 2) + (this.y ** 2) + (this.z ** 2);
  }
  public lengthSquaredXY(): number {
    return (this.x ** 2) + (this.y ** 2);
  }

  // Limits length of this vector to a set field
  public clamp(minLen: number, maxLen: number = minLen):Vector {
    const len = this.length();
    const lenF = Math.min(Math.max(len, minLen), maxLen);

    if (lenF !== len) {
      const unit = Vector.UnitVector(this);
      this.x = unit.x * lenF;
      this.y = unit.y * lenF;
      this.z = unit.z * lenF;
    }

    return this;
  }
  // Levels the z component of the given vector
  public level(): Vector {
    this.z = 0;
    return this;
  }

  public equals(compareTo: Vector): boolean {
    return (this.x === compareTo.x && this.y === compareTo.y && this.z === compareTo.z);
  }

  // Static methods--generates new vectors to avoid overriding old properties //

  /**
   * @param a Vector A
   * @param b Vector B
   * @returns A + B
   */
  static Add(a: Vector, b: Vector):Vector {
    return new Vector(a.x + b.x, a.y + b.y, a.z + b.z);
  }
  /**
   * @param a Vector A
   * @param b Vector B
   * @returns A - B
   */
  static Subtract(a: Vector, b: Vector):Vector {
    return new Vector(a.x - b.x, a.y - b.y, a.z - b.z);
  }
  /**
   * @param a Vector A
   * @param b Scalar B
   * @returns A * B
   */
  static Multiply(a: Vector, b: number):Vector { // A is a vector, b should be a scalar number
    return new Vector(a.x * b, a.y * b, a.z * b);
  }
  /**
   * @param a Vector A
   * @param b Scalar B
   * @returns A / B
   */
  static Divide(a: Vector, b: number):Vector {
    return new Vector(a.x / b, a.y / b, a.z / b);
  }
  /**
   * @param a Vector A
   * @param b Vector B
   * @returns A * B
   */
  static MultiplyVectors(a: Vector, b: Vector):Vector {
    return new Vector(a.x * b.x, a.y * b.y, a.z * b.z);
  }

  // Returns a copy of the given vector with the same direction but a length of one //

  /**
   * @summary Returns a normalized version of A
   * @param a Vector A
   * @returns {Vector} Normalized vector with a length of 1
   */
  static UnitVector(a: Vector):Vector {
    const len = a.length();
    if (len <= 0) return new Vector(0, 0, 0);
    return new Vector(a.x / len, a.y / len, a.z / len);
  }
  /**
   * @summary Returns A, normalized on the X and Y axii, with Z zeroed
   * @param a Vector A
   * @returns {Vector} Normalized vector with a length of 1, with no height
   */
  static UnitVectorXY(a: Vector):Vector {
    const len = a.lengthXY();
    if (len <= 0) return new Vector(0, 0, 0);
    return new Vector(a.x / len, a.y / len, 0);
  }
  /**
   * @summary Generates a normalized vector from the given Vector components
   * @param x X vector component
   * @param y Y Vector component
   * @param z Z vectonr component
   * @returns {Vector} Normalized vector using the given components
   */
  static UnitVectorFromXYZ(x: number, y: number, z: number) {
    const len = Math.sqrt((x ** 2) + (y ** 2) + (z ** 2));
    if (len <= 0) return new Vector(0, 0, 0);
    return new Vector(x / len, y / len, z / len);
  }
  static UnitVectorFromAngle(angle: number): Vector {
    return new Vector(Math.cos(angle), Math.sin(angle), 0);
  }
  static UnitVectorFromAngleXZ(angle: number): Vector {
    return new Vector(Math.cos(angle), 0, Math.sin(angle));
  }

  // Gets the dot product between two vectors
  // Use normalized vectors for scalar value between -1 and 1

  /**
   * @summary Performs a dot product between the two vectors
   * @param a Vector A
   * @param b Vector B
   * @returns {number} Ax * Bx + Ay * By + Az * Bz
   */
  static DotProduct(a: Vector, b: Vector): number {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  }
  // For use in ray calculations
  // Taken from here https://www.mathsisfun.com/algebra/vectors-cross-product.html
  static Cross(a: Vector, b: Vector): Vector {
    return new Vector(
      a.y * b.z - a.z * b.y,
      a.z * b.x - a.x * b.z,
      a.x * b.y - a.y * b.x,
    );
  }

  static Distance(a: Vector, b:Vector):number {
    return Math.sqrt(((a.x - b.x) ** 2) + ((a.y - b.y) ** 2) + ((a.z - b.z) ** 2));
  }
  static DistanceXY(a: Vector, b:Vector):number {
    return Math.sqrt(((a.x - b.x) ** 2) + ((a.y - b.y) ** 2));
  }

  static Average(a: Vector, b: Vector):Vector {
    return new Vector((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
  }
  static Lerp(a: Vector, b: Vector, alpha: number):Vector {
    const alpha2 = 1 - alpha;
    return new Vector(a.x * alpha2 + b.x * alpha, a.y * alpha2 + b.y * alpha, a.z * alpha2 + b.z * alpha);
  }

  static Clone(a: Vector):Vector {
    return new Vector(a.x, a.y, a.z);
  }

  static AngleFromXY(a: Vector): number {
    if (a.y < 0) {
      return Math.atan2(a.y, a.x) + TwoPI;
    }
    return Math.atan2(a.y, a.x);
  }
  static AngleFromXYZ(a: Vector): number {
    if (a.y < 0) {
      return Math.atan2(a.z + a.y, a.x) + TwoPI;
    }
    return Math.atan2(a.z + a.y, a.x);
  }
  static RotateXY(a: Vector, angle: number) {
    const delta = Vector.AngleFromXY(a) + angle;
    const out = Vector.Multiply(Vector.UnitVectorFromAngle(delta), a.lengthXY());
    out.z = a.z;
    return out;
  }

  static ConstrainAngle(angle: number, min: number = 0, max: number = TwoPI): number {
    let a = angle;
    while (a < 0) {
      a += TwoPI;
    }
    while (a >= TwoPI) {
      a -= TwoPI;
    }
    return Math.max(min, Math.min(a, max));
  }

  static ToString(a: Vector): string {
    return `(${a.x}, ${a.y}, ${a.z})`;
  }

  // Additional Utility //

  static AddMany(...vect: Vector[]): Vector {
    let x: number = 0;
    let y: number = 0;
    let z: number = 0;

    for (let i = 0; i < vect.length; i++) {
      x += vect[i].x;
      y += vect[i].y;
      z += vect[i].z;
    }

    return new Vector(x, y, z);
  }
  static AverageMany(...vect: Vector[]): Vector {
    const result = this.AddMany(...vect);

    return Vector.Divide(result, vect.length);
  }
}

export { Vector as default };
