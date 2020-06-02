import Vector from '../../../src/common/engine/Vector';

test('vector arithematic test', () => {
  const vect1 = new Vector(0, 0, 0);
  const vect2 = new Vector(1, 0, 0);
  const vect3 = new Vector(1, 0, 1);

  expect(vect2.length()).toBe(1);
  expect(vect2.lengthXY()).toBe(1);

  expect(Vector.Add(vect1, vect2).x).toBe(1);
  expect(Vector.Subtract(vect1, vect2).x).toBe(-1);

  expect(Vector.Multiply(vect2, 3).x).toBe(3);
  expect(Vector.Divide(vect2, 2).x).toBe(0.5);
  expect(Vector.MultiplyVectors(vect1, vect2).x).toBe(0);

  expect(Vector.Distance(vect1, vect2)).toBe(1);
  expect(Vector.DistanceXY(vect1, vect3)).toBe(1);

  // Make sure that cloning vectors does not simply refer to old pointer
  const vect4 = Vector.Clone(vect1);
  vect1.x = 3;
  expect(vect4.x).toBe(0);

  expect(Vector.UnitVector(vect1).x).toBe(1);
  expect(Vector.UnitVectorXY(vect3).x).toBe(1);

  expect(vect1.clamp(1, 1).x).toBe(1);

  expect(Vector.Lerp(vect2, vect3, 0.5).z).toBe(0.5);
});

test('vector unit-length zero test', () => {
  const vect1 = Vector.UnitVector(new Vector(0, 0, 0));
  const vect2 = Vector.UnitVectorXY(new Vector(0, 0, 0));
  const vect3 = Vector.UnitVectorFromXYZ(0, 0, 0);

  expect(vect1.x).toBe(0);
  expect(vect1.y).toBe(0);
  expect(vect1.z).toBe(0);

  expect(vect2.x).toBe(0);
  expect(vect2.y).toBe(0);
  expect(vect2.z).toBe(0);

  expect(vect3.x).toBe(0);
  expect(vect3.y).toBe(0);
  expect(vect3.z).toBe(0);
});

test('vector compare-to test', () => {
  const vect1 = new Vector(1, 2, 3);
  const vect2 = new Vector(1, 2, 3); // New vector with same props
  const vect3 = vect1; // Pointer to same vector
  const vect4 = Vector.Clone(vect1); // Cloned vector

  expect(vect1.equals(vect2)).toBe(true);
  expect(vect1.equals(vect3)).toBe(true);
  expect(vect1.equals(vect4)).toBe(true);

  vect1.x = 0;

  expect(vect1.equals(vect2)).toBe(false);
  expect(vect1.equals(vect3)).toBe(true);
  expect(vect1.equals(vect4)).toBe(false);
});

test('vector angles testing', () => {
  const vect1 = new Vector(0, -1, 0);
  const vect2 = new Vector(-1, 0, 0);
  const vect3 = new Vector(0, 0, 3);

  const res1 = Vector.AngleFromXY(vect1);
  const res2 = Vector.ConstrainAngle(Vector.AngleFromXY(vect2));
  const res3 = Vector.AngleFromXYZ(vect3);

  expect(res1).toBeCloseTo(Math.PI / 2, 3);
  expect(res2).toBeCloseTo(Math.PI, 3);
  expect(res3).toBeCloseTo(Math.PI / 2, 3);

  const angle = Vector.ConstrainAngle(Math.PI * 7);
  expect(angle).toBe(Math.PI); // Constrain large angle between 0 and 2*pi
});

test('vector dot product testing', () => {
  const vect1 = new Vector(1, 0, 0);
  const vect2 = new Vector(0, 1, 0);
  const vect3 = new Vector(-1, 0, 0);

  const vect4 = Vector.UnitVector(new Vector(1, 1, 0));
  const vect5 = Vector.UnitVector(new Vector(2, 2, 0));

  expect(Vector.DotProduct(vect1, vect1)).toBeCloseTo(1);
  expect(Vector.DotProduct(vect1, vect2)).toBeCloseTo(0);
  expect(Vector.DotProduct(vect1, vect3)).toBeCloseTo(-1);

  expect(Vector.DotProduct(vect1, vect4)).toBeCloseTo(vect4.x);
  expect(Vector.DotProduct(vect1, vect5)).toBeCloseTo(vect5.x);
});

test('vector level testing', () => {
  const vect1 = new Vector(5, 7, 3);
  const vect2 = Vector.Clone(vect1).level(); // Same vector but leveled

  expect(vect2.length()).toBe(vect1.lengthXY()); // Should have same XY length
  expect(Vector.UnitVector(vect2).equals(Vector.UnitVectorXY(vect1))).toBe(true); // XY unit vectors should be the same
});