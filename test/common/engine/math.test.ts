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

test('plane trace surface normal test', () => {
  const trace: Ray = new Ray(new Vector(0, 0, 0), new Vector(10, 0, 0));

  const planePosition = new Vector(5, 0, 0);
  const planeNormal = new Vector(1, 0, 0); // Normal is facing away from ray, meaning it shouldn't collide with it

  // Check to see if the given ray intersects with the plane
  const result1: TraceResult = trace.tracePlane(planePosition, planeNormal, false);
  const result2: TraceResult = trace.tracePlane(planePosition, planeNormal, true);

  expect(result1.collided).toBe(false); // Trace should not count as a hit as hit was not in direction of surface
  expect(result2.collided).toBe(true); // Dual-sided trace should cound as it ignores which direction normal is facing
});

test('cylinder trace tests', () => {
  const trace1: Ray = new Ray(new Vector(0, 0, 0), new Vector(10, 0, 0));
  const trace2: Ray = new Ray(new Vector(0, 0, 0), new Vector(-10, 0, 0));
  const trace3: Ray = new Ray(new Vector(0, 0, 0), new Vector(5, 10, 0));
  const trace4: Ray = new Ray(new Vector(0, 0, 0), new Vector(3, 0, 0));

  // Approximate direction vector


  const pos = new Vector(5, 0, 0);
  const radius = 1;

  // Check to see if the given ray intersects with the plane
  const result1: TraceResult = trace1.traceCylinder(pos, radius);
  const result2: TraceResult = trace2.traceCylinder(pos, radius);
  const result3: TraceResult = trace3.traceCylinder(pos, radius);
  const result4: TraceResult = trace4.traceCylinder(pos, radius);

  expect(result1.collided).toBe(true); // Should hit cylinder directly
  expect(result2.collided).toBe(false); // Should fail dot product test
  expect(result3.collided).toBe(false); // Ray position near cylinder should fail diameter test
  expect(result4.collided).toBe(false); // Trace was too short to hit cylinder (fell short by ~1 unit)

  expect(result1.Normal.x).toBeCloseTo(-1); // Hits section of cylinder facing directly left
  expect(result1.Normal.y).toBeCloseTo(0);
  expect(result1.Normal.z).toBeCloseTo(0);

  // Should intersect dead-center on cylinder due to positioning
  expect(result1.Position.x).toBeCloseTo(pos.x - radius); // Cylinder has an element of depth
  expect(result2.Position.y).toBeCloseTo(pos.y);
  expect(result3.Position.z).toBeCloseTo(pos.z);
});

test('ray point distance test', () => {
  const a = new Ray(new Vector(0, 0, 0), new Vector(10, 0, 0));
  const b = new Ray(new Vector(5, 0, 0), new Vector(10, 0, 0));
  const c = new Ray(new Vector(0, 0, 0), new Vector(10, 10, 10));
  const d = new Ray(new Vector(20, -10, 1), new Vector(20, 10, 2));

  const point1 = new Vector(7, 1, 0);
  const point2 = new Vector(7, 1, 2);
  const point3 = new Vector(5, 5, 5);
  const point4 = new Vector(5, 5, 6);
  const point5 = new Vector(10, 0, 0.5);

  expect(a.pointDistance(point1)).toBeCloseTo(1);
  expect(b.pointDistance(point1)).toBeCloseTo(1);

  expect(a.pointDistance(point2)).toBeGreaterThan(1);
  expect(b.pointDistance(point2)).toBeGreaterThan(1);
  expect(a.pointDistanceXY(point2)).toBeCloseTo(1);
  expect(b.pointDistanceXY(point2)).toBeCloseTo(1);

  expect(c.pointDistance(point3)).toBeCloseTo(0);
  expect(c.pointDistance(point4)).toBeLessThan(1);

  expect(d.pointDistanceXY(point5)).toBeCloseTo(10);
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