// Level out differences between browser and Node.js
export const performance: Performance = (function getPerformance() {
  if (typeof window === 'undefined' || typeof window.performance === 'undefined') {
    return require('perf_hooks').performance; // eslint-disable-line global-require
  }
  return window.performance;
}());

export class Timer {
  private startTime: number;

  constructor() {
    this.startTime = Timer.now();
  }

  /** Gets a sample of elapsed milliseconds since origin time */
  static now() {
    return Math.floor(performance.now());
  }

  duration(): number {
    return Timer.now() - this.startTime;
  }
}
