import Vector from '../../../src/common/engine/Vector';
import Random from '../../../src/common/engine/Random';
import { Flamingo } from '../../../src/common/engine/fighters/index';
import AOEBlast from '../../../src/common/engine/combat/AOEBlast';
import World from '../../../src/common/engine/World';
import { MessageBus } from '../../../src/common/messaging/bus';
import { Map } from '../../../src/common/engine/maps';

test('AOE falloff test', () => {
  Random.setSeed(1);
  const world = new World(new Map());
  const flam1 = new Flamingo(1, new Vector(20, 20, 0));
  const flam2 = new Flamingo(2, new Vector(21, 20, 0));
  world.Fighters.push(flam1, flam2);

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