import Vector from '../../src/common/engine/Vector';
import Sheep from '../../src/common/engine/fighters/Sheep';
import Projectile from '../../src/common/engine/projectiles/Projectile';
import Map from '../../src/common/engine/Map';
import Physics from '../../src/common/engine/Physics';

test('physics collision test', () => {
  const mapA = new Map(200, 200, 0, '');
  const a = new Sheep(1, new Vector(100, 99, 0));
  const b = new Sheep(2, new Vector(100, 101, 0));

  a.Velocity = new Vector(0, 5, 0);
  b.Velocity = new Vector(0, -5, 0);

  for (let i = 0; i < 50; i++) {
    Physics.Tick(0.01, [a, b], [], mapA);
  }

  // Velocity of 5 with bounceback added as well
  expect(a.Velocity.y).toBe(-5 - 150 / a.Mass);
  expect(b.Velocity.y).toBe(5 + 150 / b.Mass);
});

test('physics friction and gravity test', () => {
  const mapB = new Map(200, 200, 0.5, '');
  const c = new Sheep(3, new Vector(75, 100, 0));
  const d = new Sheep(4, new Vector(125, 50, 0));

  c.Velocity = new Vector(0, 0, 10);
  d.Velocity = new Vector(5, 0, 0);

  for (let i = 0; i < 50; i++) {
    Physics.Tick(0.01, [c, d], [], mapB);
  }

  expect(c.Velocity.z).toBe(0);
  expect(d.Velocity.y).toBeLessThanOrEqual(0.1);
});

test('physics terminal velocity test', () => {
  const mapA = new Map(500, 1, 0, '');
  const e = new Sheep(5, new Vector(0, 0, 0));
  e.Velocity = new Vector(5000, 0, 0);

  for (let i = 0; i < 50; i++) {
    Physics.Tick(0.02, [e], [], mapA);
  }

  expect(e.Position.x).toBeGreaterThanOrEqual(e.MaxMomentum / e.Mass - 0.01);
  expect(e.Position.x).toBeLessThanOrEqual(e.MaxMomentum / e.Mass + 0.01);
});

test('physics bullet test', () => {
  const map = new Map(20, 20, 0, '');
  const sheep = new Sheep(6, new Vector(0, 10, 0));
  const bullet = [new Projectile('Bullet', null, 10, 1, new Vector(10, 10, 0), new Vector(-15, 0, 0))];

  // Tests bullet in a high-latency setting to make sure they still collide even at fast velocities
  for (let i = 0; i < 10; i++) {
    Physics.Tick(0.1, [sheep], bullet, map);
  }
  expect(sheep.HP).toBe(sheep.MaxHP - 10);
});