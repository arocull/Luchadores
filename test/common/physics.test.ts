import Vector from '../../src/common/engine/Vector';
import Sheep from '../../src/common/engine/fighters/Sheep';
import Projectile from '../../src/common/engine/projectiles/Projectile';
import Map from '../../src/common/engine/Map';
import World from '../../src/common/engine/World';

test('physics collision test', () => {
  const world = new World();
  world.Map = new Map(200, 200, 0, '');
  const a = new Sheep(1, new Vector(100, 99, 0));
  const b = new Sheep(2, new Vector(100, 101, 0));
  world.Fighters.push(a, b);

  a.Velocity = new Vector(0, 5, 0);
  b.Velocity = new Vector(0, -5, 0);

  for (let i = 0; i < 50; i++) {
    world.TickPhysics(0.01);
  }

  // Velocity of 5 with bounceback added as well
  expect(a.Velocity.y).toBe(-5 - 150 / a.Mass);
  expect(b.Velocity.y).toBe(5 + 150 / b.Mass);
});

test('physics friction and gravity test', () => {
  const world = new World();
  world.Map = new Map(200, 200, 0.5, '');
  const c = new Sheep(3, new Vector(75, 100, 0));
  const d = new Sheep(4, new Vector(125, 50, 0));
  world.Fighters.push(c, d);

  c.Velocity = new Vector(0, 0, 10);
  d.Velocity = new Vector(5, 0, 0);

  for (let i = 0; i < 50; i++) {
    world.TickPhysics(0.01);
  }

  expect(c.Velocity.z).toBe(0);
  expect(d.Velocity.y).toBeLessThanOrEqual(0.1);
});

test('physics terminal velocity test', () => {
  const world = new World();
  world.Map = new Map(500, 1, 0, '');
  const e = new Sheep(5, new Vector(0, 0, 0));
  world.Fighters.push(e);
  e.Velocity = new Vector(5000, 0, 0);

  for (let i = 0; i < 50; i++) {
    world.TickPhysics(0.02);
  }

  expect(e.Position.x).toBeGreaterThanOrEqual(e.MaxMomentum / e.Mass - 0.01);
  expect(e.Position.x).toBeLessThanOrEqual(e.MaxMomentum / e.Mass + 0.01);
});

test('physics bullet tests', () => {
  const world = new World();
  world.Map = new Map(20, 20, 0, '');

  const sheep = new Sheep(1, new Vector(0, 10, 0));
  const sheep2 = new Sheep(2, new Vector(0, 20, 0));

  const bullet = new Projectile('Bullet', sheep2, 10, 1, new Vector(10, 10, 0), new Vector(-15, 0, 0));
  const bullet2 = new Projectile('Bullet', sheep2, 10, 1, new Vector(10, 20, 0), new Vector(-15, 0, 0));
  const bullet3 = new Projectile('Bullet', null, 10, 0.5, new Vector(0, 0, 0), new Vector(1, 0, 0));

  world.Fighters.push(sheep, sheep2);
  world.Bullets.push(bullet, bullet2, bullet3);

  // Tests bullet in a high-latency setting to make sure they still collide even at fast velocities
  for (let i = 0; i < 10; i++) {
    world.TickPhysics(0.1);
  }

  expect(sheep.HP).toBe(sheep.MaxHP - 10); // Bullet damage
  expect(sheep.LastHitBy).toBe(sheep2.ID);

  expect(sheep2.HP).toBe(sheep2.MaxHP); // Bullet passing over owner
  expect(world.Bullets.indexOf(bullet3)).toBe(-1); // Bullet timing out
});