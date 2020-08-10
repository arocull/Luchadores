import { EventEmitter } from 'events';

import HeartbeatHost from './HeartbeatHost';
import logger from './Logger';
import SocketHost from './SocketHost';
import WebHost from './WebHost';
import Clockwork from './Clockwork';

class Host extends EventEmitter {
  private heartbeatHost: HeartbeatHost;
  private socketHost: SocketHost;
  private webHost: WebHost;
  private clockwork: Clockwork;

  constructor(port: number) {
    super();

    this.webHost = new WebHost(port);
    this.socketHost = new SocketHost(this.webHost.http);
    this.heartbeatHost = new HeartbeatHost(this.webHost.app, () => this.getClockwork());
  }

  initialize() {
    this.webHost.initialize();
    this.heartbeatHost.initialize();

    // TODO: Move to using message bus
    this.socketHost.on('connect', () => this.onConnectionCountChange());
    this.socketHost.on('disconnect', () => this.onConnectionCountChange());
  }

  getClockwork(): Clockwork {
    return this.clockwork;
  }

  // TODO: Move this to a wrapper class.
  // Provide functionality for getting information from Clockwork
  // with safe defaults for when the server instance is not running.
  // Then pass that wrapper class around to the places that need it.
  private onConnectionCountChange() {
    if (this.clockwork && this.socketHost.getClients().length === 0) {
      // Wait a moment to receive any residual packets, or maybe a player will
      // refill the spot.
      setTimeout(() => {
        // Make sure our conditions still hold.
        if (this.clockwork && this.socketHost.getClients().length === 0) {
          logger.info('Shutting down game instance ...');
          this.clockwork.stop();
          this.clockwork = null;
        }
      }, 5 * 1000);
    } else if (!this.clockwork && this.socketHost.getClients().length > 0) {
      logger.info('Spinning up game instance ...');
      this.clockwork = new Clockwork();
      this.clockwork.start();
    }
  }
}

export { Host as default };
