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
}

export { Random as default };