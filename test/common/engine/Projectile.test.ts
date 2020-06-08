import Vector from '../../../src/common/engine/Vector';
import Random from '../../../src/common/engine/Random';
import { Sheep, Deer, Flamingo } from '../../../src/common/engine/fighters/index';
import BBullet from '../../../src/common/engine/projectiles/Bullet';
import Map from '../../../src/common/engine/Map';
import World from '../../../src/common/engine/World';

test('bullet damage test', () => {
  const world = new World();
  world.Map = new Map(20, 20, 0);

  const sheep = new Sheep(1, new Vector(0, 10, 0));
  const sheep2 = new Sheep(2, new Vector(0, 20, 0));

  const bullet = new BBullet(new Vector(10, 10, 0), new Vector(-1, 0, 0), sheep2);

  world.Fighters.push(sheep, sheep2);
  world.Bullets.push(bullet);

  // Tests bullet in a high-latency setting to make sure they still collide even at fast velocities
  for (let i = 0; i < 10; i++) {
    world.TickPhysics(0.1);
  }

  expect(sheep.HP).toBe(sheep.MaxHP - 5); // Bullet damage
  expect(sheep.LastHitBy).toBe(sheep2.getOwnerID());
});

test('bullet miss owner test', () => {
  const world = new World();
  world.Map = new Map(20, 20, 0);
  const sheep2 = new Sheep(2, new Vector(0, 20, 0));
  const bullet2 = new BBullet(new Vector(10, 20, 0), new Vector(-1, 0, 0), sheep2);

  world.Fighters.push(sheep2);
  world.Bullets.push(bullet2);

  for (let i = 0; i < 50; i++) {
    world.TickPhysics(0.05);
  }

  expect(sheep2.HP).toBe(sheep2.MaxHP); // Bullet passing over owner

  bullet2.Hit(sheep2);
  expect(sheep2.HP).toBe(sheep2.MaxHP); // Bullet refuses to damage owner
});

test('bullet timeout test', () => {
  const world = new World();
  world.Map = new Map(20, 20, 0);
  const bullet3 = new BBullet(new Vector(0, 0, 0), new Vector(1, 0, 0), null);

  world.Bullets.push(bullet3);

  expect(bullet3.getOwnerID()).toBe(-1);

  for (let i = 0; i < 31; i++) {
    world.TickPhysics(0.1);
    if (i === 14) expect(bullet3.getLifePercentage()).toBeCloseTo(0.5);
  }

  expect(world.Bullets.indexOf(bullet3)).toBe(-1); // Bullet timing out
});

test('bullet jump-dodge test', () => {
  Random.setSeed(1); // Set the random seed so it is always the same for this unit test
  const world = new World();
  world.Map = new Map(20, 20, 10);

  const deer = new Deer(1, new Vector(5, 0, 0));
  deer.aim(new Vector(1, 0, 0));
  deer.Firing = true;
  const flam = new Flamingo(2, new Vector(8.5, 0, 0));

  world.Fighters.push(deer, flam);

  for (let i = 0; i < 40; i++) {
    world.tick(0.1);

    if (i === 10) deer.Firing = false;
  }

  expect(flam.HP).toBeLessThan(flam.MaxHP - 5); // Gets hit when no action is taken
  const hp = flam.HP;

  flam.Jump();
  deer.Position = new Vector(5, 0, 0);
  deer.Firing = true;
  for (let i = 0; i < 50; i++) {
    world.tick(0.05);

    if (i === 5) {
      deer.Firing = false;
      expect(world.Bullets.length).toBeGreaterThan(0); // There should at least be some fire to dodge
    }
  }

  expect(flam.HP).toBe(hp); // Not hit when bullets are leaped over
});

test('bullet shock latency test', () => {
  Random.setSeed(1); // Set the random seed so it is always the same for this unit test
  const world = new World();
  world.Map = new Map(10, 10, 0);
  const flam = new Flamingo(1, new Vector(5, 5, 0));
  world.Fighters.push(flam);

  expect(flam.BulletShock).toBe(0);

  flam.Firing = true;
  for (let i = 0; i < 40; i++) {
    world.tick(0.1);
    flam.setBreath(50, false); // Make sure they don't run out of breath, lol
  }
  expect(flam.BulletShock).toBeGreaterThan(0); // There should be some value to add to screen shake

  flam.BulletShock = 0;

  world.tick(1); // Tick world in high-latency setting; in this case, client has low frame rate
  // Flamingo gets ~0.6 bullet shock per bullet (as of May 16th 2020), so they should have a lot stored up here
  expect(flam.BulletShock).toBeGreaterThan(3);
  flam.BulletShock = 0;

  flam.setBreath(50, false); // Reset breath
  world.tick(1, true); // Pretend client recieved a world state packet that took way too long to send
  expect(flam.BulletShock).toBeGreaterThan(0); // Racking up a single extra bullet shock is not bad
  expect(flam.BulletShock).toBeLessThan(1); // But we don't want a large amount stacked up, because the client has not had any time for it to dissipate
});