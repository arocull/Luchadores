import encodeWorldState from '../../../src/server/WorldStateEncoder';
import decodeWorldState from '../../../src/client/network/WorldStateDecoder';
import Random from '../../../src/common/engine/Random';
import Vector from '../../../src/common/engine/Vector';
import World from '../../../src/common/engine/World';
import Map from '../../../src/common/engine/Map';
import { Sheep, Flamingo } from '../../../src/common/engine/fighters/index';
import { BBullet } from '../../../src/common/engine/projectiles/index';
import { FighterType, ProjectileType } from '../../../src/common/engine/Enums';

test('world state encode / decode', () => {
  const start = new World();
  start.Map = new Map(100, 50, 0.5, '', 10);
  start.Fighters.push(new Sheep(1, new Vector(25, 25, 10)));
  start.Fighters.push(new Flamingo(2, new Vector(30, 25, 0)));
  start.Bullets.push(new BBullet(new Vector(0, 0, 0), new Vector(1, 0, 0), start.Fighters[0]));

  start.tick(0.1);

  Random.setSeed(10);
  Random.setIndex(5);

  const end = new World();
  const encodedState = encodeWorldState(start);

  Random.setSeed(3);
  Random.setIndex(0);

  decodeWorldState(encodedState, end);

  expect(Random.getSeed()).toBe(10);
  expect(Random.getIndex()).toBe(5);

  expect(end.Map.Width).toBe(100);
  expect(end.Map.Height).toBe(50);
  expect(end.Map.Friction).toBe(0.5);

  expect(start.Fighters.length).toBe(2);
  expect(start.Bullets.length).toBe(1);
  expect(end.Fighters.length).toBe(2);
  expect(end.Bullets.length).toBe(1);

  let indexF1 = -1;
  let indexF2 = -1;
  for (let i = 0; i < end.Fighters.length; i++) {
    if (end.Fighters[i].getOwnerID() === 1) {
      indexF1 = i;
    } else if (end.Fighters[i].getOwnerID() === 2) {
      indexF2 = i;
    }
  }

  expect(indexF1).toBeGreaterThanOrEqual(0); // Fighter should exist in the array
  expect(end.Fighters[indexF1].getCharacter()).toBe(FighterType.Sheep);
  expect(end.Fighters[indexF2].Velocity.z).toBeCloseTo(0);

  expect(indexF2).toBeGreaterThanOrEqual(0); // Fighter should exist in the array
  expect(end.Fighters[indexF2].getCharacter()).toBe(FighterType.Flamingo);
  expect(end.Fighters[indexF2].Position.equals(new Vector(30, 25, 0))).toBe(true);

  expect(end.Bullets[0].projectileType).toBe(ProjectileType.Bullet);
  expect(end.Bullets[0].Owner).toBe(end.Fighters[indexF1]);
});