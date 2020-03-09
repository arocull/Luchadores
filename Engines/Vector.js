class Vector {  // A structure that holds position data or direction and magnitude
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    // Returns length of this vector (or should this be static?)
    get length() {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2) + Math.pow(this.z, 2));
    }

    // Static methods--generates new vectors to avoid overriding old properties
    static Add(a, b) {
        return new Vector(a.x + b.x, a.y + b.y, a.z + b.z);
    }
    static Subtract(a, b) {
        return new Vector(a.x - b.x, a.y - b.y, a.z - b.z);
    }
    static Multiply(a, b) { // A is a vector, b should be a scalar number
        return new Vector(a.x*b, a.y*b, a.z*b);
    }

    // Returns a copy of the given vector with the same direction but a length of one
    static UnitVector(a) {
        const len = a.length();
        return new Vector(a.x/len, a.y/len, a.z/len);
    }
}

module.exports.Vector = Vector;