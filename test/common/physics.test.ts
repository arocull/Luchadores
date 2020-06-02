import { Vector } from '../../src/common/engine/math';
import Prop from '../../src/common/engine/props/Prop';
import { Sheep } from '../../src/common/engine/fighters';
import Map from '../../src/common/engine/Map';
import World from '../../src/common/engine/World';
import { ColliderType } from '../../src/common/engine/Enums';

test('physics collision test', () => {
  const world = new World();
  world.Map = new Map(200, 200, 0);
  const a = new Sheep(1, new Vector(100, 99, 0));
  const b = new Sheep(2, new Vector(100, 101, 0));
  world.Fighters.push(a, b);

  a.Velocity = new Vector(0, 5, 0);
  b.Velocity = new Vector(0, -5, 0);

  for (let i = 0; i < 50; i++) {
    world.TickPhysics(0.01);
  }

  // Velocity of 5 with bounceback added as well
  expect(a.Velocity.y).toBeCloseTo(-5);
  expect(b.Velocity.y).toBeCloseTo(5);
});

test('physics friction and gravity test', () => {
  const world = new World();
  world.Map = new Map(200, 200, 0.5);
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
  world.Map = new Map(500, 1, 0, 0);
  const e = new Sheep(5, new Vector(0, 0, 0));
  world.Fighters = [e];
  e.Move(new Vector(1, 0, 0));
  e.Velocity = new Vector(5000, 0, 0);

  for (let i = 0; i < 50; i++) {
    world.TickPhysics(0.02);
  }

  expect(e.Position.x).toBeCloseTo(e.MaxMomentum / e.Mass);
});

test('physics prop collision', () => {
  const world = new World();
  world.Map = new Map(500, 500, 0, 0);
  const sheep = new Sheep(1, new Vector(0, 0.1, 0)); // Slight depth offset to test deforming
  const cylinder = new Prop(new Vector(20, 0, 0), ColliderType.Cylinder, 0.5, 5);

  world.Fighters = [sheep];
  world.Props = [cylinder];

  sheep.Move(new Vector(1, 0, 0));

  for (let i = 0; i < 20; i++) {
    world.TickPhysics(0.1);
  }

  expect(sheep.Position.x).toBeGreaterThan(cylinder.Position.x); // Sheep eventually passed cylinder
  expect(sheep.Position.y).toBeGreaterThan(0.1); // Sheep was pushed deeper into frame by the cylinder
});