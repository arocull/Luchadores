import { Timer } from './Time';
import { PingPongHandler, PingInfo } from '../../network/pingpong';

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
  async syncWith(pingPongHandler: PingPongHandler, targetSyncMillis: number): Promise<void> {
    const t = new Timer();
    const pingInfos: PingInfo[] = [];
    while (t.duration() < targetSyncMillis) {
      console.log('Awaiting ping...');
      const info = await pingPongHandler.ping(); // eslint-disable-line no-await-in-loop
      console.log('Got ping:', info, 'Duration:', t.duration());
      pingInfos.push(info);
    }
    if (pingInfos.length <= 0) {
      throw new Error('No samples were collected - average clock drift calculation impossible!');
    }

    const clockDrifts = pingInfos.map((x) => x.clockDriftMilliseconds);
    console.log('Averaging clock samples: ', clockDrifts);
    const avgDrift = Math.round(clockDrifts.reduce((acc, x) => acc + x, 0) / clockDrifts.length);
    console.log('Averaged to ', avgDrift);
    this.clockDriftToRemote = avgDrift;
  }
}

const Global = new Wristwatch();
export { Global as default };
