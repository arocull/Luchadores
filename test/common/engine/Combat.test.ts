import Vector from '../../../src/common/engine/Vector';
import Random from '../../../src/common/engine/Random';
import { Sheep, Deer, Flamingo } from '../../../src/common/engine/fighters/index';
import AOEBlast from '../../../src/common/engine/combat/AOEBlast';
import { FightObserver } from '../../../src/common/engine/combat/FightObserver';
import ProjectileGroup from '../../../src/common/engine/combat/ProjectileGroup';
import World from '../../../src/common/engine/World';
import { MessageBus } from '../../../src/common/messaging/bus';
import { MMap } from '../../../src/common/engine/maps';

test('AOE falloff test', () => {
  Random.setSeed(1);
  const world = new World(new MMap());
  const flam1 = new Flamingo(1, new Vector(20, 20, 0));
  const flam2 = new Flamingo(2, new Vector(21, 20, 0));
  world.registerFighters(flam1, flam2);

  // Generate a new AOE blast
  MessageBus.publish('AOE_Blast', new AOEBlast(
    flam1.Position, 2, 10, flam1, 0, true, true, true,
  ));

  world.tick(1); // Tick once to apply AOE

  expect(flam1.HP).toBeLessThan(flam1.MaxHP); // Flamingo 1 should have taken damage
  expect(flam2.HP).toBeLessThan(flam2.MaxHP); // Flamingo 2 should also have taken some damage
  expect(flam1.HP).toBeLessThan(flam2.HP); // Flamingo 1 should take more damage than Flamingo 2 due to falloff
  expect(flam2.Position.x).toBe(21); // Flamingo 2 should not have been pushed at all by the blast

  // Generate a new AOE blast with negative momentum and falloff
  const center = new Vector(20.7, 20, 0);
  MessageBus.publish('AOE_Blast', new AOEBlast(
    center, 2, 0, flam2, -500, false, true, true,
  ));

  // Flamingo 2 should have been pulled closer to the center than Flamingo 1 due to falloff
  expect(Vector.Distance(flam2.Position, center)).toBeLessThan(Vector.Distance(flam1.Position, center));
  expect(flam2.LastHitBy).toBe(flam1.getOwnerID()); // No damage was dealt as damage is zero, so last hit should still be from Flamingo 1
  expect(flam1.LastHitBy).toBe(flam1.getOwnerID()); // Flamingo 1 hurt himself--last hit was not overriden by Flamingo 2
});
test('FightObserver fighter threat test', () => {
  Random.setSeed(1);
  const world = new World(new MMap());
  const sheep = new Sheep(1, new Vector(5, 20, 0));
  const deer = new Deer(2, new Vector(22, 20, 0));
  const flam = new Flamingo(3, new Vector(20, 20, 0));
  world.registerFighters(sheep, deer, flam);

  const timeConstant = 0.05; // How many seconds to iterate world by

  const observer = new FightObserver(world); // Instance the fight observer

  let prediction = observer.estimatePosition(flam, 0.05); // Predict next-frame pos of flamingo

  // Calculate threats
  let deerThreat = observer.determineFighterThreat(flam, deer, prediction, timeConstant);
  let sheepThreat = observer.determineFighterThreat(flam, sheep, prediction, timeConstant);
  // Find enemy with most threat
  let threats = observer.GetThreateningFighters(flam, world.Fighters, 1, timeConstant);
  // Get total threat level
  const totalThreat1 = observer.GetTotalFighterThreat(flam, world.Fighters, timeConstant);

  // Both entities idle, but deer is a bit close for comfort
  expect(deerThreat).toBeGreaterThan(sheepThreat);
  expect(deerThreat).toBeGreaterThan(0);
  expect(threats[0].object).toBe(deer); // Deer is the threat, once again
  expect(threats[0].threat).toEqual(deerThreat); // Same function should provide consistent results

  // Move sheep towards flamingo, as she builds momentum, she should be considered more of a threat
  sheep.Move(new Vector(1, 0, 0));
  // Distance cap (we don't want sheep to be closer to flamingo than deer)
  for (let i = 0; i < 30 && Vector.DistanceXY(sheep.Position, flam.Position) > 5; i++) {
    world.tick(timeConstant, false);
  }

  prediction = observer.estimatePosition(flam, timeConstant);

  // Recalculate threats
  deerThreat = observer.determineFighterThreat(flam, deer, prediction, timeConstant);
  sheepThreat = observer.determineFighterThreat(flam, sheep, prediction, timeConstant);
  threats = observer.GetThreateningFighters(flam, world.Fighters, 1, timeConstant);
  const totalThreat2 = observer.GetTotalFighterThreat(flam, world.Fighters, timeConstant);

  // 200 kg sheep barreling toward you is a lot more scary than an idle deer
  expect(sheepThreat).toBeGreaterThan(deerThreat);
  expect(threats[0].object).toBe(sheep); // New threat/target
  expect(threats[0].threat > deerThreat).toBe(true); // More threatening than deer

  // Expect total threat to be a bit higher now that more action is happening
  expect(totalThreat2).toBeGreaterThan(totalThreat1);


  // Finally, have deer fire at Flamingo
  deer.aim(new Vector(-1, 0, 0));
  deer.Firing = true;
  deer.Move(new Vector(-1, 0, 0));

  world.tick(timeConstant); // Tick world once just to be safe

  prediction = observer.estimatePosition(flam, timeConstant);

  const newDeerThreat = observer.determineFighterThreat(flam, deer, prediction, timeConstant);
  const totalThreat3 = observer.GetTotalFighterThreat(flam, world.Fighters, timeConstant);

  // Deer might still be less threatening than sheep, but is more threatening than before
  expect(newDeerThreat).toBeGreaterThan(deerThreat);
  expect(totalThreat3).toBeGreaterThan(totalThreat2);
});
test('FightObserver projectile threat test', () => {
  Random.setSeed(1);
  const world = new World(new MMap());
  const sheep = new Sheep(1, new Vector(20, 20, 0));
  const deer1 = new Deer(2, new Vector(30, 20, 0));
  const deer2 = new Deer(3, new Vector(30, 21, 0));
  const deer3 = new Deer(4, new Vector(30, 19, 0));
  world.registerFighters(sheep, deer1, deer2, deer3);

  deer1.aim(new Vector(-1, 0, 0)); // We'll be attacking sheep to determine threat levels
  deer2.aim((new Vector(-1, -0.4, 0)).clamp(1, 1));
  deer3.aim((new Vector(-1, 0.4, 0)).clamp(1, 1));

  const observer = new FightObserver(world);
  const timeConstant = 0.08;

  // Form projectile groups
  let groups = observer.formProjectileGroups(new Vector(0, 40, 0), new Vector(40, 0, 10));
  let threats = observer.GetThreateningProjectileGroups(sheep, groups, 3, timeConstant);

  // Currently there are no projectile groups present
  expect(groups.length).toEqual(0);
  expect(threats.length).toEqual(0);

  deer1.Firing = true;
  deer2.Firing = true;
  deer3.Firing = true;
  for (let i = 0; i < 12; i++) {
    world.tick(timeConstant, true);
    // const newGroups = observer.formProjectileGroups(new Vector(0, 40, 0), new Vector(40, 0, 10));
    // if (newGroups.length > groups.length) groups = newGroups;
  }

  groups = observer.formProjectileGroups(new Vector(0, 0, 0), new Vector(40, 40, 10));
  threats = observer.GetThreateningProjectileGroups(sheep, groups, 3, timeConstant);

  // Some bullet groups should be present now
  expect(world.Bullets.length).toBeGreaterThan(0);
  expect(groups.length).toBeGreaterThan(0);
  expect(threats.length).toBeGreaterThan(0);
  expect(threats[0].threat).toBeGreaterThan(0);

  const groupA = <ProjectileGroup>(threats[0].object);
  const groupANumBullets = groupA.projectiles.length;
  // Bullet group should hit pretty close
  // expect(Vector.DistanceXY(groupA.expectedPosition, sheep.Position)).toBeLessThan(2);

  world.tick(2.9, true); // Long tick to let some projectiles expire or land
  groupA.purge();
  expect(groupA.projectiles.length).toBeLessThan(groupANumBullets); // Some bullets should be gone now
});