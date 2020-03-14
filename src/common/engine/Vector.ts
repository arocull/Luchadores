class Vector { // A structure that holds position data or direction and magnitude
  public x: number;

  public y: number;

  public z: number;

  constructor(X: number, Y: number, Z: number) {
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
  public clamp(minLen: number, maxLen: number):Vector {
    const len = this.length();
    const lenF = Math.min(Math.max(len, minLen), maxLen);

    if (lenF !== len) {
      const unit = Vector.UnitVector(this);
      this.x = unit.x * lenF;
      this.y = unit.y * lenF;
      this.z = unit.y * lenF;
    }

    return this;
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

  static Distance(a: Vector, b:Vector):number {
    return Vector.Subtract(b, a).length();
  }
  static DistanceXY(a: Vector, b:Vector):number {
    return Vector.Subtract(b, a).lengthXY();
  }

  static Clone(a: Vector):Vector {
    return new Vector(a.x, a.y, a.z);
  }
}

export { Vector as default };
