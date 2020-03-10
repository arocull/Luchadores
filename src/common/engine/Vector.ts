export class Vector {  // A structure that holds position data or direction and magnitude
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
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2) + Math.pow(this.z, 2));
    }

    // Static methods--generates new vectors to avoid overriding old properties
    static Add(a: Vector, b: Vector):Vector {
        return new Vector(a.x + b.x, a.y + b.y, a.z + b.z);
    }
    static Subtract(a: Vector, b: Vector):Vector {
        return new Vector(a.x - b.x, a.y - b.y, a.z - b.z);
    }
    static Multiply(a: Vector, b: number):Vector { // A is a vector, b should be a scalar number
        return new Vector(a.x*b, a.y*b, a.z*b);
    }

    // Returns a copy of the given vector with the same direction but a length of one
    static UnitVector(a: Vector):Vector {
        const len = a.length();
        return new Vector(a.x/len, a.y/len, a.z/len);
    }
    static Distance(a: Vector, b:Vector):number {
        return Vector.Subtract(b, a).length();
    }
}