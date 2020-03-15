import Vector from '../../src/common/engine/Vector';
import Sheep from '../../src/common/engine/fighters/Sheep';
import Map from '../../src/common/engine/Map';
import Physics from '../../src/common/engine/Physics';

test('physics collision test', () => {
  const map = new Map(200, 200, 0, '');
  const a = new Sheep(1, new Vector(100, 99, 0));
  const b = new Sheep(2, new Vector(100, 101, 0));

  a.Velocity = new Vector(0, 5, 0);
  b.Velocity = new Vector(0, -5, 0);

  for (let i = 0; i < 50; i++) {
    Physics.Tick(0.01, [a, b], map);
  }

  // Velocity of 5 with bounceback added as well
  expect(a.Velocity.y).toBe(-5 - 30 / a.Mass);
  expect(b.Velocity.y).toBe(5 + 30 / b.Mass);
});