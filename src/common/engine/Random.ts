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
    this.setSeed(Date.now() + index * seed); // This use of `Date.now()` is fine
  }

  // Returns a random float between 0 and 1
  static getFloat(): number {
    index++;
    return Math.sin(index * seed - index ** Math.PI + seed / index) / 2 + 0.5;
  }

  static getSeed(): number {
    return seed;
  }
  static getIndex(): number {
    return index;
  }
}

export { Random as default };