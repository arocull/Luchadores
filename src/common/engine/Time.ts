// Level out differences between browser and Node.js
export const performance: Performance = (function getPerformance() {
  if (typeof window === 'undefined' || typeof window.performance === 'undefined') {
    return require('perf_hooks').performance; // eslint-disable-line global-require
  }
  return window.performance;
}());

/** Gets a sample of elapsed milliseconds since origin time */
export function sample(): number {
  // Floors the output to a whole millisecond number
  return Math.floor(performance.now());
}

/** Gets a UTC timestamp for when you really need one. */
export function now(): number {
  // WARNING: `performance.timeOrigin` is a non-standard API
  // return Math.floor(performance.timeOrigin + performance.now());
  return Date.now();
}

export class Timer {
  private startTime: number;
  private endTime: number;

  constructor() {
    this.reset();
  }

  reset(): Timer {
    this.startTime = -1;
    this.endTime = -1;
    return this;
  }

  restart(): Timer {
    this.startTime = sample();
    this.endTime = -1;
    return this;
  }

  startValue(): number {
    return this.startTime;
  }

  endValue(): number {
    return this.endTime;
  }

  start(): number {
    this.startTime = sample();
    this.endTime = -1;
    return this.startTime;
  }

  end(): number {
    this.endTime = sample();
    return this.duration();
  }

  duration(): number {
    if (this.startTime < 0) {
      throw new Error('Timer not started! Cannot get duration.');
    }
    if (this.endTime >= 0) {
      return this.endTime - this.startTime;
    }
    // Rolling duration
    return sample() - this.startTime;
  }
}
