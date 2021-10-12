import World from '../../../src/common/engine/World';
import { MapPreset } from '../../../src/common/engine/Enums';
import { MapSandy } from '../../../src/common/engine/maps';

test('map preset test', () => {
  const world = new World(new MapSandy());

  expect(world.map); // Expect map to exist
  expect(world.map.id).toBe(MapPreset.Sandy); // Use corresponding map ID
  expect(world.Props.length).toEqual(0); // Did the world load in props?
});