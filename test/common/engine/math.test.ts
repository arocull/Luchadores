import { Vector, Ray, TraceResult } from '../../../src/common/engine/math';

test('plane trace test', () => {
  const trace: Ray = new Ray(new Vector(0, 0, 0), new Vector(10, 0, 0));

  // Approximate direction vector
  expect(trace.direction.x).toBeCloseTo(1);
  expect(trace.direction.y).toBeCloseTo(0);
  expect(trace.direction.z).toBeCloseTo(0);

  expect(trace.length).toBeCloseTo(10);

  const planePosition = new Vector(5, 0, 0);
  const planeNormal = new Vector(-1, 0, 0);

  // Check to see if the given ray intersects with the plane
  const result: TraceResult = trace.tracePlane(planePosition, planeNormal);

  expect(result.collided).toBe(true);

  expect(result.Normal.x).toBe(planeNormal.x);
  expect(result.Normal.y).toBe(planeNormal.y);
  expect(result.Normal.z).toBe(planeNormal.z);

  // Should intersect dead-center on plane due to positioning
  expect(result.Position.x).toBeCloseTo(planePosition.x);
  expect(result.Position.y).toBeCloseTo(planePosition.y);
  expect(result.Position.z).toBeCloseTo(planePosition.z);
});

test('plane trace with offset test', () => {
  const trace: Ray = new Ray(new Vector(0, 5, 10), new Vector(10, 0, 0));

  // Approximate direction vector
  expect(trace.direction.x).toBeGreaterThan(0);
  expect(trace.direction.y).toBeLessThan(0);
  expect(trace.direction.z).toBeLessThan(0);

  // Length should consistent work regardless of orientation
  expect(trace.length).toBeCloseTo(Math.sqrt(10 ** 2 + 5 ** 2 + 10 ** 2));

  const planePosition = new Vector(5, 0, 0);
  const planeNormal = new Vector(-1, 0, 0);

  // Check to see if the given ray intersects with the plane
  const result: TraceResult = trace.tracePlane(planePosition, planeNormal);

  expect(result.collided).toBe(true);

  expect(result.Normal.x).toBe(planeNormal.x);
  expect(result.Normal.y).toBe(planeNormal.y);
  expect(result.Normal.z).toBe(planeNormal.z);

  // Trace should hit slightly +y and +z of the plane position, but hit the same X
  expect(result.Position.x).toBeCloseTo(planePosition.x);
  expect(result.Position.y).toBeGreaterThan(planePosition.y);
  expect(result.Position.y).toBeLessThan(5); // Less than start position however
  expect(result.Position.z).toBeGreaterThan(planePosition.z);
  expect(result.Position.z).toBeLessThan(10);
});

test('plane trace miss test', () => {
  const trace: Ray = new Ray(new Vector(0, 0, 0), new Vector(-5, 3, 7));

  expect(trace.direction.x).toBeLessThan(0);
  expect(trace.direction.y).toBeGreaterThan(0);
  expect(trace.direction.z).toBeGreaterThan(0);

  const planePosition = new Vector(5, 0, 0);
  const planeNormal = new Vector(-1, 0, 0);

  // Check to see if the given ray intersects with the plane
  const result: TraceResult = trace.tracePlane(planePosition, planeNormal);

  expect(result.collided).toBe(false); // Trace shouldn't ever hit plane
});

test('ray clone test', () => {
  const a = new Ray(new Vector(0, 0, 0), new Vector(10, 0, 0));
  const b = Ray.Clone(a);

  a.start.z += 10;
  a.calculate();

  expect(a.length).toBeCloseTo(Math.sqrt(2 * (10 ** 2))); // Height of 10, X of 10

  expect(b.start.z).toBe(0); // Manipulating ray A does not change ray B's properties
  expect(b.length).toBe(10);
});