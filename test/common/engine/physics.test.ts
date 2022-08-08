import { Vector, Ray } from '../../../src/common/engine/math';
import Prop from '../../../src/common/engine/props/Prop';
import { Sheep, Flamingo } from '../../../src/common/engine/fighters';
import Map from '../../../src/common/engine/maps/Map';
import World from '../../../src/common/engine/World';
import { ColliderType, MapPreset } from '../../../src/common/engine/Enums';

test('physics collision test', () => {
  const world = new World(new Map(MapPreset.None, 200, 200, 0));
  const a = new Sheep(1, new Vector(100, 99, 0));
  const b = new Sheep(2, new Vector(100, 101, 0));
  world.registerFighters(a, b);

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
  const world = new World(new Map(MapPreset.None, 200, 200, 0.5));
  const c = new Sheep(3, new Vector(75, 100, 0));
  const d = new Sheep(4, new Vector(125, 50, 0));
  world.registerFighters(c, d);

  c.Velocity = new Vector(0, 0, 10);
  d.Velocity = new Vector(5, 0, 0);

  for (let i = 0; i < 50; i++) {
    world.TickPhysics(0.01);
  }

  expect(c.Velocity.z).toBe(0);
  expect(d.Velocity.y).toBeLessThanOrEqual(0.1);
});

test('physics terminal velocity test', () => {
  const world = new World(new Map(MapPreset.None, 500, 1, 0, 0));
  const e = new Sheep(5, new Vector(0, 0, 0));
  world.Fighters = [e];
  e.Move(new Vector(1, 0, 0));
  e.Velocity = new Vector(5000, 0, 0);

  for (let i = 0; i < 50; i++) {
    world.TickPhysics(0.02);
  }

  expect(e.Position.x).toBeCloseTo(e.MaxMomentum / e.Mass);
});

test('physics prop collision tests', () => {
  const world = new World(new Map(MapPreset.None, 500, 500, 0, 0));

  const sheep = new Sheep(1, new Vector(0, 0.1, 0)); // Slight depth offset to test deforming
  const cylinder = new Prop(new Vector(20, 0, 0), ColliderType.Cylinder, 0.5, 5);

  const sheep2 = new Sheep(2, new Vector(0, 20.1, 0)); // Slight depth offset
  const flam = new Flamingo(3, new Vector(20, 20, 8)); // he who stands on boxes
  const box = new Prop(new Vector(20, 20, 0), ColliderType.Prism, 0.5, 5); // Box for other collision testing

  const sheep3 = new Sheep(4, new Vector(100, 30, 0)); // Top of sheep should hit box
  const box2 = new Prop(new Vector(100, 20, 0.5), 0.5, 2);

  world.Fighters = [sheep, sheep2, sheep3, flam];
  world.Props = [cylinder, box, box2];

  sheep.Move(new Vector(1, 0, 0));
  sheep2.Move(new Vector(1, 0, 0));
  sheep3.Move(new Vector(0, -1, 0));

  expect(flam.onSurface).toBe(false);

  for (let i = 0; i < 20; i++) {
    world.TickPhysics(0.1);
  }

  expect(sheep.Position.x).toBeGreaterThan(cylinder.Position.x); // Sheep eventually passed cylinder
  expect(sheep.Position.y).toBeGreaterThan(0.1); // Sheep was pushed deeper into frame by the cylinder

  expect(sheep2.Position.x).toBeCloseTo(box.Position.x - box.Width / 2 - sheep2.Radius); // Sheep does not deform around box
  expect(flam.onSurface).toBe(true); // Flamingo is on stable surface

  expect(sheep3.Position.y).toBeCloseTo(box2.Position.y + box2.Depth / 2 + sheep3.Radius); // Sheep does not clip through floating box
});

test('physics inside-bounding collision test', () => {
  const world = new World(new Map());

  // Slight offset to allow direction vector to form if pushed outward
  const xPos = 0.01;
  const yPos = 0.01;

  const flam = new Flamingo(1, new Vector(xPos, yPos, 1.1));
  const prop = new Prop(new Vector(0, 0, 0), ColliderType.Cylinder, 0.5, 1);

  // Do basic ray trace from inside to outside to make sure that this is not causing collisions
  const ray = new Ray(new Vector(xPos, yPos, 0.9), new Vector(xPos, yPos, 5));
  const result = prop.traceProp(ray, flam.Radius);
  expect(result.collided).toBe(false);

  // Check if real thing matches
  world.registerFighters(flam);
  world.Props.push(prop);

  for (let i = 0; i < 20; i++) {
    world.tick(0.03);
  }

  expect(flam.Position.x).toBeCloseTo(xPos);
  expect(flam.Position.y).toBeCloseTo(yPos);
  expect(flam.Position.z).toBeCloseTo(1);

  flam.Jump();

  for (let i = 0; i < 20; i++) {
    world.tick(0.03);
  }
  expect(flam.Position.x).toBeCloseTo(xPos);
  expect(flam.Position.y).toBeCloseTo(yPos);
});