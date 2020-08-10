import Random from '../../../src/common/engine/Random';

test('random weighted list test', () => {
  Random.setSeed(1);

  const weights = [3, 2, 1];

  const num1 = Random.pickIndexFromWeights(weights, 0.1);
  const num2 = Random.pickIndexFromWeights(weights, 0.4794);
  const num3 = Random.pickIndexFromWeights(weights, 0.6);
  const num4 = Random.pickIndexFromWeights(weights, 0.9);

  expect(num1).toEqual(0); // Weight of index 0 should be 1/2
  expect(num2).toEqual(0); // Same here
  expect(num3).toEqual(1); // Weight of index 1 should be be 1/3, numbers between 3/6 and 5/6 should hit it
  expect(num4).toEqual(2); // Index 2 is top 1/6
});