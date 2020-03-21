import Vector from '../../src/common/engine/Vector';

test('vector arithematic test', () => {
  const vect1 = new Vector(0, 0, 0);
  const vect2 = new Vector(1, 0, 0);
  const vect3 = new Vector(1, 0, 1);

  expect(vect2.length()).toBe(1);
  expect(vect2.lengthXY()).toBe(1);

  expect(Vector.Add(vect1, vect2).x).toBe(1);
  expect(Vector.Subtract(vect1, vect2).x).toBe(-1);

  expect(Vector.Multiply(vect2, 3).x).toBe(3);
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