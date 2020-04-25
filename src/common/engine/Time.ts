// Level out differences between browser and Node.js
export const performance: Performance = (function getPerformance() {
  if (typeof window === 'undefined' || typeof window.performance === 'undefined') {
    return require('perf_hooks').performance; // eslint-disable-line global-require
  }
  return window.performance;
}());

export class Timer {
  private startTime: number;
  private endTime: number;

  constructor() {
    this.startTime = Timer.sample();
    this.endTime = 0;
  }

  /** Gets a sample of elapsed milliseconds since origin time */
  static sample() {
    // Floors the output to a whole millisecond number
    return Math.floor(performance.now());
  }

  /** DEPRECATED: Gets a UTC timestamp for when you really need one. */
  static now() {
    return Date.now();
  }

  startValue(): number {
    return this.startTime;
  }

  endValue(): number {
    return this.endTime;
  }

  start(): number {
    this.startTime = Timer.sample();
    return this.startTime;
  }

  end(): number {
    this.endTime = Timer.sample();
    return this.duration();
  }

  duration(): number {
    return this.endTime - this.startTime;
  }
}
