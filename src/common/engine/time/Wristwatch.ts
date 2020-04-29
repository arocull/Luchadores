import { Timer } from './Time';
import { PingPongHandler, PingInfo } from '../../network/pingpong';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class Wristwatch {
  /**
   * The number of milliseconds to add to the local clock to correct time.
   * May be a negative number.
  */
  private clockDriftToRemote: number;

  constructor() {
    // By default, our watch is set to our local time (uncorrected)
    this.clockDriftToRemote = 0;
  }

  /**
   * Get the amount of calculated clock drift to the remote in milliseconds.
  */
  getClockDriftToRemote(): number {
    return this.clockDriftToRemote;
  }

  /**
   * Reset any calculated clock drifts back to our local time.
   */
  reset(): void {
    this.clockDriftToRemote = 0;
  }

  /**
   * Get the current synchronized time between local and remote sources.
   */
  getSyncedNow(): number {
    return Timer.now() + this.clockDriftToRemote;
  }

  /**
   * Synchronize this time source with a pingable remote source.
   */
  async syncWith(pingPongHandler: PingPongHandler): Promise<void> {
    const pingInfos: PingInfo[] = [];
    const failures: Error[] = [];
    let sleepTime = 100;
    while (pingInfos.length < 20) {
      try {
        console.log('Awaiting ping...');
        const info = await pingPongHandler.ping(); // eslint-disable-line no-await-in-loop
        console.log('Got ping:', info, 'Count:', pingInfos.length);
        pingInfos.push(info);
      } catch (err) {
        console.error('Error during wristwatch sync:', err);
        failures.push(err);
        if (failures.length > 3) {
          throw err;
        }
        await sleep(sleepTime); // eslint-disable-line no-await-in-loop
        sleepTime *= 2; // Back off on next attempt
      }
    }
    if (pingInfos.length <= 0) {
      throw new Error('No samples were collected - average clock drift calculation impossible!');
    }

    // TODO: I think this could be better still. Removing outliers, trying to get more consistent
    const clockDrifts = pingInfos.map((x) => x.clockDriftMilliseconds);
    console.log('Finding best of clock samples: ', clockDrifts);
    clockDrifts.sort((a, b) => a - b);
    const avgDrift = Math.round(clockDrifts.reduce((acc, x) => acc + x, 0) / clockDrifts.length);
    const medianDrift = clockDrifts[Math.floor(clockDrifts.length / 2)];
    const min = clockDrifts[0];
    const max = clockDrifts[clockDrifts.length - 1];
    console.log('Average:', avgDrift,
      'Median:', medianDrift,
      'Min:', min,
      'Max:', max,
      'Spread:', max - min);
    this.clockDriftToRemote = medianDrift;
  }
}

const Global = new Wristwatch();
export { Global as default };
