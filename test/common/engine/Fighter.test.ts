import Vector from '../../../src/common/engine/Vector';
import Random from '../../../src/common/engine/Random';
import { Sheep, Deer } from '../../../src/common/engine/fighters/index';
import Map from '../../../src/common/engine/Map';
import World from '../../../src/common/engine/World';

test('fighter sheep collision test', () => {
  Random.setSeed(1); // Set the random seed so it is always the same for this unit test
  const world = new World();
  world.Map = new Map(100, 2, 0, '');

  const a = new Sheep(1, new Vector(0, 1, 0));
  const b = new Deer(2, new Vector(50, 1, 5));
  world.Fighters.push(a, b);

  let hasHit = false;

  a.Move(new Vector(1, 0, 0));
  for (let i = 0; i < 75; i++) {
    world.tick(0.04);

    if (a.JustHitMomentum > 0) {
      hasHit = true;
      a.JustHitMomentum = 0;
      a.Move(new Vector(0, 0, 0));
    }
  }

  expect(hasHit).toBe(true);

  expect(a.HP).toBe(a.MaxHP);
  expect(b.HP).toBeLessThan(b.MaxHP);
  expect(b.Position.x).toBeGreaterThan(50);
  expect(b.riding).toBeFalsy();
});

test('fighter riding test', () => {
  Random.setSeed(1); // Set the random seed so it is always the same for this unit test
  const world = new World();
  world.Map = new Map(100, 20, 0, '');

  const a = new Sheep(1, new Vector(10, 10, 0));
  const b = new Deer(2, new Vector(10, 10, 5));
  world.Fighters.push(a, b);

  for (let i = 0; i < 10; i++) {
    world.tick(0.1);
  }

  expect(b.riding).toBeTruthy();

  a.Move(new Vector(1, 0, 0));

  for (let i = 0; i < 10; i++) {
    world.tick(0.1);
  }

  expect(a.Position.x).toBeGreaterThan(10);
  expect(b.Position.x).toBeCloseTo(a.Position.x);
  expect(b.Position.y).toBeCloseTo(a.Position.y);
  expect(b.riding).toBeTruthy();

  a.Jump();
  for (let i = 0; i < 10; i++) {
    world.tick(0.1);

    if (i === 0) {
      a.Move(new Vector(-1, 0, 0));
    }
  }

  expect(b.Position.x).toBeGreaterThan(a.Position.x);
  expect(b.riding).toBeFalsy();
});