/* eslint-disable max-classes-per-file */
import { Vector, Quaternion } from '../../../../src/common/engine/math';

test('Quaternion > Identity', () => {
  const id = Quaternion.identity;
  // Expect an identity matrix
  expect(id.w).toBe(1);
  expect(id.x).toBe(0);
  expect(id.y).toBe(0);
  expect(id.z).toBe(0);

  // Editing a generated identity does not modify new identities
  id.x = 10;
  expect(Quaternion.identity.x).toBe(0);
});

test('Quaternion > FromAxisAngle', () => {
  class TestCase {
    constructor(public angle: number, public axis: Vector) {}
  }

  // TODO: Add more test cases once I learn what this should look like
  const cases: TestCase[] = [
    new TestCase(0, new Vector(1, 0, 0)),
  ];
  const results: Quaternion[] = [
    new Quaternion(1, new Vector(0, 0, 0)),
  ];

  for (let i = 0; i < cases.length; i++) {
    const quat = Quaternion.FromAxisAngle(cases[i].angle, cases[i].axis);
    // console.log('Case ', i);
    expect(quat.w).toBeCloseTo(results[i].w);
    expect(quat.x).toBeCloseTo(results[i].x);
    expect(quat.y).toBeCloseTo(results[i].y);
    expect(quat.z).toBeCloseTo(results[i].z);
  }
});

test('Quaternion > Rotate', () => {
  const quats: Quaternion[] = [
    Quaternion.identity,
    Quaternion.identity,
    Quaternion.identity,

    // Rotate counterclockwise on Z axis (yaw) by 90 degrees
    Quaternion.FromAxisAngle(Math.PI / 2, new Vector(0, 0, 1)),
    Quaternion.FromAxisAngle(Math.PI / 2, new Vector(0, 0, 1)),
    Quaternion.FromAxisAngle(Math.PI / 2, new Vector(0, 0, 1)),

    // Rotate clockwise on Z axis (yaw) by 90 degrees
    Quaternion.FromAxisAngle(-Math.PI / 2, new Vector(0, 0, 1)),

    // Rotate counterclockwise on X axis (pitch) by 90 degrees
    Quaternion.FromAxisAngle(Math.PI / 2, new Vector(1, 0, 0)),
    Quaternion.FromAxisAngle(Math.PI / 2, new Vector(1, 0, 0)),
    Quaternion.FromAxisAngle(Math.PI / 2, new Vector(1, 0, 0)),

    // Rotate counterclockwise on Y axis (roll) by 90 degrees
    Quaternion.FromAxisAngle(Math.PI / 2, new Vector(0, 1, 0)),
    Quaternion.FromAxisAngle(Math.PI / 2, new Vector(0, 1, 0)),
  ];
  const inputs: Vector[] = [
    new Vector(1, 0, 0),
    new Vector(0, 1, 0),
    new Vector(0, 0, 1), // Input is Z positive (height)

    new Vector(0, 1, 0), // Input is Y positive (depth/forward)
    new Vector(1, 0, 0), // Input is X positive (rightward direction)
    new Vector(0, 0, 1), // up

    new Vector(0, 1, 0), // forward

    new Vector(1, 0, 0), // Rightward
    new Vector(0, 1, 0), // Forward
    new Vector(0, 0, 1),

    new Vector(1, 0, 0),
    new Vector(0, 0, 1),
  ];
  const results: Vector[] = [
    // Identity matrix should not change vectors
    new Vector(1, 0, 0),
    new Vector(0, 1, 0),
    new Vector(0, 0, 1),

    // Counterclockwise rotation on Yaw axis
    new Vector(-1, 0, 0),
    new Vector(0, 1, 0),
    new Vector(0, 0, 1),

    // Clockwise rotation on Yaw axis
    new Vector(1, 0, 0),

    // Counterclockwise rotation on Pitch axis
    new Vector(1, 0, 0), // Direction should remain unchanged as we're rotating on this axis
    new Vector(0, 0, 1), // Depth should be pushed up to height
    new Vector(0, -1, 0), // Height should be rotated into depth, TODO: Verify this, axis seems flipped

    // Counterclockwise rotation on Roll axis
    new Vector(0, 0, -1), // Right facing vector should be rotated to down-facing
    new Vector(1, 0, 0), // Height is rotated counterclockwise into X axis, TODO: Verify this, axis seems flipped
  ];

  for (let i = 0; i < inputs.length; i++) {
    const res = quats[i].rotate(inputs[i]);
    // console.log('Case ', i);
    expect(res.x).toBeCloseTo(results[i].x, 5);
    expect(res.y).toBeCloseTo(results[i].y, 5);
    expect(res.z).toBeCloseTo(results[i].z, 5);
  }
});

test('Quaternion > Length, Normalize', () => {
  class TestCase {
    constructor(public quat: Quaternion, public size: number) {}
  }

  const cases: TestCase[] = [
    new TestCase(Quaternion.identity, 1),
    new TestCase(new Quaternion(0.5, new Vector(5, 3, 0)), 5.852349955),
    new TestCase(new Quaternion(0, new Vector()), 0),
  ];
  const results: Quaternion[] = [
    new Quaternion(1, new Vector()),
    new Quaternion(0.085435766, new Vector(0.854357658, 0.512614595, 0)),
    Quaternion.identity,
  ];

  for (let i = 0; i < cases.length; i++) {
    // console.log('Case ', i);

    // Length should be about the same as our computed one
    const len = cases[i].quat.length;
    expect(len).toBeCloseTo(cases[i].size, 5);

    // Quaternion's normalized length should be 1
    const norm = Quaternion.Normalize(cases[i].quat);
    expect(norm.length).toBeCloseTo(1.0, 5);

    // Normalized quaternion should be approximately the same
    expect(norm.w).toBeCloseTo(results[i].w);
    expect(norm.x).toBeCloseTo(results[i].x);
    expect(norm.y).toBeCloseTo(results[i].y);
    expect(norm.z).toBeCloseTo(results[i].z);
  }
});

test('Quaternion > Multiplication', () => {
  const stacks: Quaternion[] = [
    Quaternion.Multiply(Quaternion.identity, Quaternion.FromAxisAngle(Math.PI / 2, new Vector(1, 0, 0))),
    Quaternion.Multiply(Quaternion.identity, Quaternion.FromAxisAngle(Math.PI / 2, new Vector(0, 1, 0))),
    Quaternion.Multiply(Quaternion.identity, Quaternion.FromAxisAngle(Math.PI / 2, new Vector(0, 0, 1))),

    Quaternion.Multiply(
      Quaternion.FromAxisAngle(Math.PI / 2, new Vector(0, 0, 1)),
      Quaternion.FromAxisAngle(-Math.PI / 2, new Vector(0, 0, 1)),
    ),

    Quaternion.Multiply(
      Quaternion.FromAxisAngle(Math.PI, new Vector(0, 0, 1)),
      Quaternion.FromAxisAngle(Math.PI * 1.5, new Vector(0, 0, 1)),
    ),

    Quaternion.Multiply(
      Quaternion.FromAxisAngle(Math.PI / 2, new Vector(0, 0, 1)),
      Quaternion.FromAxisAngle(Math.PI / 2, new Vector(1, 0, 0)),
    ),
  ];
  const results: Quaternion[] = [
    Quaternion.FromWXYZ(1, 1, 0, 0),
    Quaternion.FromWXYZ(1, 0, 1, 0),
    Quaternion.FromWXYZ(1, 0, 0, 1),
    Quaternion.identity, // Opposite transforms should cancel
    Quaternion.FromWXYZ(-1, 0, 0, -1), // Transforms should stack cumulatively, but flip after rotating 360 degrees
    Quaternion.FromWXYZ(1, 1, 1, 1), // Not even quite sure what's going on here haha
  ];

  for (let i = 0; i < stacks.length; i++) {
    const norm = Quaternion.Normalize(stacks[i]);
    // console.log(i, norm);
    expect(norm.w).toBeCloseTo(results[i].w, 4);
    expect(norm.x).toBeCloseTo(results[i].x, 4);
    expect(norm.y).toBeCloseTo(results[i].y, 4);
    expect(norm.z).toBeCloseTo(results[i].z, 4);
  }
});

test('Quaternion > Inverse', () => {
  const bases: Quaternion[] = [
    Quaternion.identity,
    Quaternion.FromAxisAngle(Math.PI / 2, new Vector(0, 0, 1)),
    Quaternion.identity,
    Quaternion.identity,
    Quaternion.identity,
  ];
  const multipliers: Quaternion[] = [
    Quaternion.identity,
    Quaternion.identity,
    Quaternion.FromAxisAngle(Math.PI / 2, new Vector(1, 0, 0)),
    Quaternion.FromAxisAngle(-Math.PI / 2, new Vector(1, 0, 0)),
    Quaternion.FromAxisAngle(Math.PI / 2, new Vector(0, 0, 1)),
  ];

  for (let i = 0; i < multipliers.length; i++) {
    // Get combined transform
    const combined = Quaternion.Multiply(bases[i], multipliers[i]);
    // Get inverse of the multiplier we just got
    const inverse = Quaternion.Inverse(multipliers[i]);
    // Multiplying by the inverse should return us our base transform
    const original = Quaternion.Multiply(combined, inverse);

    expect(original.w).toBeCloseTo(bases[i].w, 4);
    expect(original.x).toBeCloseTo(bases[i].x, 4);
    expect(original.y).toBeCloseTo(bases[i].y, 4);
    expect(original.z).toBeCloseTo(bases[i].z, 4);
  }
});

test('Quaternion > Dot', () => {
  const cases: Quaternion[] = [
    Quaternion.identity,
    Quaternion.FromAxisAngle(0, new Vector(0, 1, 0)),
    Quaternion.FromAxisAngle(Math.PI / 2, new Vector(0, 0, 1)),
    Quaternion.FromAxisAngle(-Math.PI / 2, new Vector(0, 0, 1)),
    Quaternion.FromAxisAngle(Math.PI, new Vector(1, 0, 0)),
    Quaternion.FromAxisAngle(Math.PI, new Vector(0, 1, 0)),
    Quaternion.FromAxisAngle(Math.PI, new Vector(0, 0, 1)),
    Quaternion.Inverse(Quaternion.identity),
  ];
  const products: number[] = [
    1,
    1,
    Math.SQRT2 / 2,
    Math.SQRT2 / 2,
    0,
    0,
    0,
    1,
  ];

  // This test is interesting because it really starts to show the 4D properties of quaternions
  // The reason why being rotated 90 degrees to the left or right is still considered close is because
  // quaternions can have the same end rotation, and still be completely opposite opposite from each other.
  // Because this expands our possibility space, we can thus have rotations that are perpendicular,
  // but still in the general direction of each other.
  // At least, that's my best guess.

  for (let i = 0; i < cases.length; i++) {
    // console.log('Case ', i);
    expect(Quaternion.Dot(Quaternion.identity, cases[i])).toBeCloseTo(products[i], 5);
  }
});

// TODO: Not quite sure how to do this yet
test.skip('Quaternion > SLerp', () => {
  const goals: Quaternion[] = [
    Quaternion.identity,
    Quaternion.identity,
    Quaternion.Normalize(Quaternion.FromAxisAngle(Math.PI / 2, new Vector(0, 0, 1))),
    Quaternion.Normalize(Quaternion.FromAxisAngle(Math.PI / 4, new Vector(0, 0, 1))),
    Quaternion.Normalize(Quaternion.FromAxisAngle(Math.PI / 2, new Vector(0, 0, 1))),
  ];
  const alphas: number[] = [
    0.5,
    1.0,
    0.5,
    0.5,
    1.0,
  ];
  const results: Quaternion[] = [
    Quaternion.identity,
    Quaternion.identity,
    Quaternion.Normalize(Quaternion.FromAxisAngle(Math.PI / 4, new Vector(0, 0, 1))),
    Quaternion.Normalize(Quaternion.FromAxisAngle(Math.PI / 8, new Vector(0, 0, 1))),
    Quaternion.Normalize(Quaternion.FromAxisAngle(Math.PI / 2, new Vector(0, 0, 1))),
  ];

  for (let i = 0; i < goals.length; i++) {
    const interp = Quaternion.SLerp(Quaternion.identity, goals[i], alphas[i]);
    console.log('Case ', i);
    expect(interp.w).toBeCloseTo(results[i].w, 4);
    expect(interp.x).toBeCloseTo(results[i].x, 4);
    expect(interp.y).toBeCloseTo(results[i].y, 4);
    expect(interp.z).toBeCloseTo(results[i].z, 4);
  }
});
