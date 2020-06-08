import Map from '../../../src/common/engine/Map';
import World from '../../../src/common/engine/World';
import { MapPreset } from '../../../src/common/engine/Enums';

test('map preset test', () => {
  const world = new World(MapPreset.Sandy, true, true);
  const map: Map = world.Map;

  expect(world.Props.length).toBeGreaterThan(0); // Did the world load in props?
  expect(world.Props[0].texture).toBeTruthy(); // Did the props get textures?
  expect(map.Texture).toBeTruthy(); // Did the map get a texture?
});