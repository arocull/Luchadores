import World from '../../../src/common/engine/World';
import { MapPreset } from '../../../src/common/engine/Enums';

test('map preset test', () => {
  const world = new World(MapPreset.Sandy, true, false);

  expect(world.Props.length).toBeGreaterThan(0); // Did the world load in props?
  expect(world.Map); // Expect map to exist
});