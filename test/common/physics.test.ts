import Vector from '../../src/common/engine/Vector';
import Sheep from '../../src/common/engine/fighters/Sheep';
import Map from '../../src/common/engine/Map';
import Physics from '../../src/common/engine/Physics';

test('physics collision test', () => {
  const mapA = new Map(500, 200, 0, '');
  const mapB = new Map(200, 200, 0.5, '');
  const a = new Sheep(1, new Vector(100, 99, 0));
  const b = new Sheep(2, new Vector(100, 101, 0));
  const c = new Sheep(3, new Vector(75, 100, 0));
  const d = new Sheep(4, new Vector(125, 50, 0));
  const e = new Sheep(5, new Vector(0, 0, 0));

  a.Velocity = new Vector(0, 5, 0);
  b.Velocity = new Vector(0, -5, 0);
  c.Velocity = new Vector(0, 0, 10);
  d.Velocity = new Vector(5, 0, 0);
  e.Velocity = new Vector(500, 0, 0);

  for (let i = 0; i < 50; i++) {
    Physics.Tick(0.01, [a, b], mapA);
    Physics.Tick(0.01, [c, d], mapB);
  }
  Physics.Tick(1, [e], mapA);

  // Velocity of 5 with bounceback added as well
  expect(a.Velocity.y).toBe(-5 - 150 / a.Mass);
  expect(b.Velocity.y).toBe(5 + 150 / b.Mass);

  expect(c.Velocity.z).toBe(0);
  expect(d.Velocity.y).toBeLessThanOrEqual(0.1);

  expect(e.Position.x).toBe(e.MaxMomentum / e.Mass);
});