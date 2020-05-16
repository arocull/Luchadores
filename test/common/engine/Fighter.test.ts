import Vector from '../../../src/common/engine/Vector';
import Random from '../../../src/common/engine/Random';
import { Sheep, Deer, Flamingo } from '../../../src/common/engine/fighters/index';
import Map from '../../../src/common/engine/Map';
import World from '../../../src/common/engine/World';

test('fighter sheep collision test', () => {
  Random.setSeed(1); // Set the random seed so it is always the same for this unit test
  const world = new World();
  world.Map.Width = 500;
  world.Map.wallStrength = 0;

  const a = new Sheep(1, new Vector(0, 1, 0));
  const b = new Deer(2, new Vector(50, 1, 5));
  world.Fighters.push(a, b);

  let hasHit = false;

  a.Move(new Vector(1, 0, 0));
  for (let i = 0; i < 180; i++) {
    world.tick(0.03);

    if (a.JustHitMomentum > 0 && !hasHit) {
      hasHit = true;
      a.Move(new Vector(-1, 0, 0));
      expect(b.Velocity.x).toBeGreaterThan(0);
      i -= 10; // Allow 10 more ticks for things to settle
    }
  }

  expect(hasHit).toBe(true);

  expect(a.HP).toBe(a.MaxHP);
  expect(b.HP).toBeLessThan(b.MaxHP);
  expect(b.Position.x).toBeGreaterThan(50); // Fighter should have inherited some momentum from sheep
  expect(b.riding).toBeFalsy();
});

test('fighter riding test', () => {
  Random.setSeed(1); // Set the random seed so it is always the same for this unit test
  const world = new World();
  world.Map = new Map(100, 20, 0, '', 0);

  const a = new Sheep(1, new Vector(10, 10, 0));
  const b = new Deer(2, new Vector(10, 10, a.Height + 1));
  const c = new Flamingo(3, new Vector(10, 10, a.Height + b.Height + 2));
  world.Fighters.push(c, a, b); // Order should not matter (was an issue before)

  for (let i = 0; i < 20; i++) {
    world.tick(0.05);
  }

  expect(b.riding).toBe(a);
  expect(c.riding).toBe(b);

  expect(a.getBottomOfStack()).toBe(a);
  expect(b.getBottomOfStack()).toBe(a);
  expect(c.getBottomOfStack()).toBe(a);

  a.Move(new Vector(1, 0, 0));

  for (let i = 0; i < 10; i++) {
    world.tick(0.1);
  }

  expect(a.Position.x).toBeGreaterThan(10);
  expect(b.Position.x).toBeCloseTo(a.Position.x);
  expect(b.Position.y).toBeCloseTo(a.Position.y);
  expect(b.riding).toBe(a);

  expect(c.Position.x).toBeGreaterThan(10);
  expect(c.Position.x).toBeCloseTo(b.Position.x);
  expect(c.Position.y).toBeCloseTo(b.Position.y);
  expect(c.riding).toBe(b);

  a.Jump();
  for (let i = 0; i < 10; i++) {
    world.tick(0.1);

    if (i === 0) {
      a.Move(new Vector(-1, 0, 0));
    }
  }

  expect(b.Position.x).toBeGreaterThan(a.Position.x);
  expect(c.Position.x).toBeCloseTo(b.Position.x);
  expect(b.riding).toBeFalsy();
  expect(c.riding).toBeTruthy();
});