let seed = 1; // Seed used by random number generator
let index = 0; // Number of times a random number has been generated on this seed

// Random Class - Used in random number generation to allow seeding, helps keep tests consistent
class Random {
  // Sets seed of random number generator
  static setSeed(newSeed: number) {
    seed = newSeed;
    index = 0;
  }
  static setIndex(newIndex: number) {
    index = newIndex;
  }

  // Creates a random seed based off of current time (randomized as well by previous use if there was any)
  static randomSeed() {
    // Use Date.now here instead of Timer.now to be sure that we don't always supply `0` on application start.
    // We do this because the Timer's clock is based on an origin time, which might always begin at zero,
    // depending on when the application starts and selects an origin time.
    this.setSeed(Date.now() + index * seed);
  }

  // Returns a random float between 0 and 1
  static getFloat(): number {
    index++;
    return Math.sin(index * seed - index ** Math.PI + seed / index) / 2 + 0.5;
    // return (Math.sin(Math.sqrt(seed) * index + (seed2 / (Math.cos(index) ** 2))) + 1) / 2;
  }
  static getInteger(min: number, max: number): number {
    return Math.floor(this.getFloat() * (max - min) + min + 0.5);
  }
  static getBoolean(): boolean {
    return (this.getFloat() > 0.5);
  }

  static getSeed(): number {
    return seed;
  }
  static getIndex(): number {
    return index;
  }

  /**
   * @function pickIndexFromWeights
   * @summary Takes an array of weights and converts them into probabilities,
   * before generating a random number to select the index from
   *
   * Note: This method assumes the random number was generated using a uniform distribution
   *
   * @param {number[]} weights Input weights to select from
   * @param {number} generated Random number input between 0 and 1 that is used in selecting an index from the given weights--defaults using getFloat()
   * @returns {number} Random index from the array
   */
  static pickIndexFromWeights(weights: number[], generated: number = this.getFloat()): number {
    let sum = 0; // First total out weights
    for (let i = 0; i < weights.length; i++) {
      sum += weights[i];
    }

    let sum2 = 0; // Stacks probabilities together (total sum should be 1)
    for (let i = 0; i < weights.length; i++) {
      sum2 += weights[i] / sum; // Find true weight on scale of 0 to 1 and add it to the sum/range
      if (generated <= sum2) return i; // If the generated number fell into this range, return this index and be done
    }
    return weights.length - 1; // This should never be called (random number must be found in weights), but return highest index if so
  }
}

export { Random as default };