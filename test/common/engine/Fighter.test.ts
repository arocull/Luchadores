import Vector from '../../../src/common/engine/Vector';
import Random from '../../../src/common/engine/Random';
import { Sheep, Deer, Flamingo } from '../../../src/common/engine/fighters/index';
import Map from '../../../src/common/engine/maps/Map';
import World from '../../../src/common/engine/World';
import { MapPreset } from '../../../src/common/engine/Enums';

test('fighter collision test', () => {
  Random.setSeed(1); // Set the random seed so it is always the same for this unit test
  const world = new World(new Map(MapPreset.None, 500, 40, 23, 0));

  const a = new Sheep(1, new Vector(0, 1, 0));
  const b = new Deer(2, new Vector(50, 1, 5));
  world.registerFighters(a, b);

  let hasHit = false;

  a.Move(new Vector(1, 0, 0));
  for (let i = 0; i < 180; i++) {
    world.tick(0.03);

    if (b.HP < b.MaxHP && !hasHit) {
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
  const world = new World(new Map(MapPreset.None, 100, 20, 0, 0));

  const a = new Sheep(1, new Vector(10, 10, 0));
  const b = new Deer(2, new Vector(10, 10, a.Height + 2));
  const c = new Flamingo(3, new Vector(10, 10, a.Height + b.Height + 4));
  world.registerFighters(c, a, b); // Order should not matter (was an issue before)

  for (let i = 0; i < 30; i++) {
    world.tick(0.05);
  }

  expect(b.riding).toBe(a);
  expect(c.riding).toBe(b);

  expect(a.getBottomOfStack()).toBe(null);
  expect(b.getBottomOfStack()).toBe(a);
  expect(c.getBottomOfStack()).toBe(a);

  a.Move(new Vector(1, 0, 0));

  for (let i = 0; i < 20; i++) {
    world.tick(0.05);
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
  for (let i = 0; i < 20; i++) {
    world.tick(0.05);

    if (i === 0) {
      a.Move(new Vector(-1, 0, 0));
    }
  }

  // expect(b.Position.x).toBeGreaterThan(a.Position.x);
  expect(b.riding).toBeFalsy();

  // Stacks make attempts to maintain order when dissassembled, but are not as accurate as before
  // expect(c.Position.x).toBeCloseTo(b.Position.x);
  // expect(c.riding).toBeTruthy();
});

test('sheep landing-shockwave test', () => {
  Random.setSeed(1); // Set random seed for consistency
  const world = new World(new Map());
  const sheep = new Sheep(1, new Vector(20, 20, 0));
  const flam = new Flamingo(2, new Vector(30, 30, 0));
  world.registerFighters(sheep, flam);


  expect(world.aoeAttacks.length).toBe(0); // There should be no AOE attacks in existence currently

  sheep.Land(10); // Sheep lands with a downward velocity of 10 units
  expect(world.aoeAttacks.length).toBe(1); // Should expect only 1 AOE attack here
  world.tick(0.01);

  expect(world.aoeAttacks.length).toBe(0); // AOE attack should have been applied and removed
  expect(sheep.HP).toBe(sheep.MaxHP); // Sheep should not have taken any damage (no friendly-fire enabled on shockwave)

  const flamX = sheep.Position.x + sheep.Radius + flam.Radius;
  flam.Position.x = flamX; // Put flamingo immeadiately to the right of sheep
  flam.Position.y = sheep.Position.y;


  // Make sure jump cooldown is disabled, let physics settle
  for (let i = 0; i < 5; i++) {
    world.tick(0.2);
  }
  sheep.Jump(); // Have sheep jump
  for (let i = 0; i < 90; i++) { // Process for about 90 frames
    world.tick(0.03);
  }
  expect(flam.HP).toBeLessThan(flam.MaxHP); // Flamingo should have taken damage
  expect(flam.Position.x).toBeGreaterThan(flamX); // Flamingo should have gotten pushed rightward by the AOE attack
  expect(flam.HP).toBeGreaterThan(0); // Flamingo shouldn't have died though (make sure AOE didn't stack excessively)
  expect(world.aoeAttacks.length).toBe(0); // Should not have anymore AOE attacks
});

test('flamingo jetpack test', () => {
  Random.setSeed(1); // Set the random seed so it is always the same for this unit test
  const world = new World(new Map());
  const flam = new Flamingo(1, new Vector(20, 20, 0));
  world.registerFighters(flam);

  let maxHeightA = 0;
  let maxHeightB = 0;

  flam.Jump();
  for (let i = 0; i < 25; i++) {
    world.tick(0.03);
    maxHeightA = Math.max(flam.Position.z, maxHeightA); // Sample max height
    if (flam.Position.z < maxHeightA) break; // Stop when they start descending
  }

  // Reset physics
  flam.Position.z = 0;
  flam.Velocity.z = 0;
  world.tick(1); // Reset jump cooldown

  flam.Firing = true; // Should be breathing while this happens
  flam.Jump();
  for (let i = 0; i < 50; i++) {
    world.tick(0.03);
    maxHeightB = Math.max(flam.Position.z, maxHeightB); // Sample max height
    if (flam.Position.z < maxHeightB) break; // Stop when they start descending
  }

  expect(maxHeightA).toBeGreaterThan(0);
  expect(maxHeightB).toBeGreaterThanOrEqual(maxHeightA); // Flamingo should have used jump boost to maintain height
});

test('deer suplex test', () => {
  Random.setSeed(1);
  // Make sure world is extremely wide so sheep doesn't bounce off the wall and hit deer, interfering with our test
  const world = new World(new Map(MapPreset.None, 1000, 20, 0, 0));
  const deer = new Deer(1, new Vector(0, 0, 0));
  const sheep = new Sheep(2, new Vector(1, 0, 0));
  sheep.Position.x = deer.Radius + sheep.Radius + 0.05;
  world.registerFighters(deer, sheep);

  for (let i = 0; i < 10; i++) {
    world.tick(0.1);
  }
  // Nothing happens if neither fighter does anything
  expect(sheep.HP).toEqual(sheep.MaxHP);
  expect(sheep.constraints.length).toEqual(0);

  deer.Jump(false, world.Fighters); // Deer jumps
  expect(sheep.constraints.length).toEqual(1); // Sheep gets exactly one constraint
  expect(sheep.HP).toEqual(sheep.MaxHP); // Sheep takes no damage until she lands
  expect(deer.Velocity.z).toBeGreaterThan(17); // Deer should jump higher than normal
  expect(sheep.Position.x).toBeGreaterThan(0); // Sheep should still be on right side of character

  for (let i = 0; i < 30; i++) {
    world.tick(0.05);
  }

  expect(sheep.HP).toBeLessThan(sheep.MaxHP); // Sheep took damage from the fall
  expect(deer.HP).toEqual(deer.MaxHP); // Sheep's AOE attack was disabled, however
  expect(sheep.Position.x).toBeLessThan(0); // Sheep was placed on other side of deer
  expect(sheep.constraints.length).toEqual(0); // Sheep should no longer have suplex constraint
});

// Kill effect tests
test('sheep kill-effect test', () => {
  Random.setSeed(1); // Set the random seed so it is always the same for this unit test
  const world = new World(new Map());
  world.Map = new Map(MapPreset.None, 500, 50, 23, 0);
  const sheep1 = new Sheep(1, new Vector(1, 20, 0));
  const sheep2 = new Sheep(2, new Vector(1, 40, 0));
  world.registerFighters(sheep1, sheep2);

  // Race sheep
  sheep1.Move(new Vector(1, 0, 0));
  sheep2.Move(new Vector(1, 0, 0));

  sheep2.TakeDamage(100, sheep1);
  expect(sheep2.HP).toBe(90); // 190 HP - 100 HP
  sheep2.EarnKill(); // Apply kill effect after move direction has already been set to test updating
  expect(sheep2.HP).toBe(137.5); // 90 HP + 25% of max HP (190 * 0.25)

  world.tick(0.1);
  expect(sheep2.Velocity.x).toBeGreaterThan(sheep1.Velocity.x); // Sheep 2 should accelerate faster

  for (let i = 0; i < 40; i++) { // 2 seconds, combined with 0.1 seconds before
    world.tick(0.05);
  }

  // Sheep 2's speed boost allowed them to accelerate to max speed faster
  expect(sheep2.Position.x).toBeGreaterThan(sheep1.Position.x);
});

test('deer kill-effect test', () => {
  Random.setSeed(1); // Set the random seed so it is always the same for this unit test
  const world = new World(new Map(MapPreset.None, 500, 50, 23, 0));
  const deer1 = new Deer(1, new Vector(1, 20, 0));
  const deer2 = new Deer(2, new Vector(1, 40, 3));
  const sheep = new Sheep(3, new Vector(1, 40, 0));
  world.registerFighters(deer1, deer2, sheep);

  // Race sheep
  deer1.aim(new Vector(-1, 0, 0));
  deer2.aim(new Vector(-1, 0, 0));

  // Let deer land on sheep for ridership purposes
  for (let i = 0; i < 10; i++) {
    world.tick(0.05);
  }
  expect(deer2.riding).toBe(sheep);

  deer1.Firing = true;
  deer2.Firing = true;

  for (let i = 0; i < 10; i++) {
    world.tick(0.05);
  }
  expect(deer1.Position.x).toBeCloseTo(1);
  expect(sheep.Position.x).toBeCloseTo(1);
  expect(deer2.Position.x).toBeCloseTo(sheep.Position.x);

  // Enable kill effects
  deer1.EarnKill();
  deer2.EarnKill();

  for (let i = 0; i < 40; i++) {
    world.tick(0.05);
  }

  // Test recoil
  expect(deer1.Position.x).toBeGreaterThan(1);
  expect(sheep.Position.x).toBeGreaterThan(1);
  expect(deer2.Position.x).toBeGreaterThan(1);

  expect(deer1.Velocity.x).toBeGreaterThan(0);
  expect(deer2.Velocity.x).toBeCloseTo(0);
  expect(sheep.Velocity.x).toBeGreaterThan(0);
});

test('flamingo kill-effect test', () => {
  Random.setSeed(1); // Set the random seed so it is always the same for this unit test
  const world = new World(new Map(MapPreset.None, 500, 50, 23, 0));
  const flam = new Flamingo(1, new Vector(1, 20, 0));
  world.registerFighters(flam);

  flam.aim(new Vector(-1, 0, 0));
  flam.Firing = true;

  for (let i = 0; i < 25; i++) {
    world.tick(0.1);
  }
  expect(flam.getSpecialNumber()).toBeLessThan(50); // Flamingo running low on breath
  const numBullets: number = world.Bullets.length;

  world.Bullets = []; // Reset bullet objects

  flam.EarnKill();

  expect(flam.getSpecialNumber()).toBe(50); // Earning a kill refills breath meter
  for (let i = 0; i < 25; i++) {
    world.tick(0.1);
  }
  // Flamingo should fire more bullets while in kill-effect
  expect(world.Bullets.length).toBeGreaterThan(numBullets);
});