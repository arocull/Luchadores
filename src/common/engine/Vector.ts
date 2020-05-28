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
    return Math.sqrt((this.x ** 2) + (this.y ** 2) + (this.z ** 2));
  }
  public lengthXY():number {
    return Math.sqrt((this.x ** 2) + (this.y ** 2));
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

  public equals(compareTo: Vector): boolean {
    return (this.x === compareTo.x && this.y === compareTo.y && this.z === compareTo.z);
  }

  // Static methods--generates new vectors to avoid overriding old properties
  static Add(a: Vector, b: Vector):Vector {
    return new Vector(a.x + b.x, a.y + b.y, a.z + b.z);
  }
  static Subtract(a: Vector, b: Vector):Vector {
    return new Vector(a.x - b.x, a.y - b.y, a.z - b.z);
  }
  static Multiply(a: Vector, b: number):Vector { // A is a vector, b should be a scalar number
    return new Vector(a.x * b, a.y * b, a.z * b);
  }
  static Divide(a: Vector, b: number):Vector {
    return new Vector(a.x / b, a.y / b, a.z / b);
  }
  static MultiplyVectors(a: Vector, b: Vector):Vector {
    return new Vector(a.x * b.x, a.y * b.y, a.z * b.z);
  }

  // Returns a copy of the given vector with the same direction but a length of one
  static UnitVector(a: Vector):Vector {
    const len = a.length();
    if (len <= 0) return new Vector(0, 0, 0);
    return new Vector(a.x / len, a.y / len, a.z / len);
  }
  static UnitVectorXY(a: Vector):Vector {
    const len = a.lengthXY();
    if (len <= 0) return new Vector(0, 0, 0);
    return new Vector(a.x / len, a.y / len, 0);
  }
  static UnitVectorFromXYZ(x: number, y: number, z: number) {
    const len = Math.sqrt((x ** 2) + (y ** 2) + (z ** 2));
    if (len <= 0) return new Vector(0, 0, 0);
    return new Vector(x / len, y / len, z / len);
  }
  static UnitVectorFromAngle(angle: number): Vector {
    return this.UnitVectorFromXYZ(Math.cos(angle), Math.sin(angle), 0);
  }

  // Gets the dot product between two vectors
  // Use normalized vectors for scalar value between -1 and 1
  static DotProduct(a: Vector, b: Vector): number {
    return a.x * b.x + a.y * b.y + a.z * b.z;
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
    return Math.atan2(-a.y, a.x);
  }
  static AngleFromXYZ(a: Vector): number {
    return Math.atan2(a.z - a.y, a.x);
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
}

export { Vector as default };
