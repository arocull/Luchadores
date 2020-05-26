import { Vector, Ray, TraceResult } from '../../../src/common/engine/math';

test('place trace test', () => {
  const trace: Ray = new Ray(new Vector(0, 0, 0), new Vector(10, 0, 0));

  expect(trace.direction.x).toBeCloseTo(1);
  expect(trace.direction.y).toBeCloseTo(0);
  expect(trace.direction.z).toBeCloseTo(0);

  expect(trace.length).toBeCloseTo(10);

  const planePosition = new Vector(5, 0, 0);
  const planeNormal = new Vector(-1, 0, 0);

  const result: TraceResult = trace.tracePlane(planePosition, planeNormal);

  expect(result.collided).toBe(true);

  expect(result.Normal.x).toBe(planeNormal.x);
  expect(result.Normal.y).toBe(planeNormal.y);
  expect(result.Normal.z).toBe(planeNormal.z);

  expect(result.Position.x).toBeCloseTo(planePosition.x);
  expect(result.Position.y).toBeCloseTo(planePosition.y);
  expect(result.Position.z).toBeCloseTo(planePosition.z);
});