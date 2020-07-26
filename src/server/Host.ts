import { EventEmitter } from 'events';

import logger from './Logger';
import SocketHost from './SocketHost';
import WebHost from './WebHost';
import Clockwork from './Clockwork';

class Host extends EventEmitter {
  private socketHost: SocketHost;
  private webHost: WebHost;
  private clockwork: Clockwork;

  constructor(port: number) {
    super();

    this.webHost = new WebHost(port);
    this.socketHost = new SocketHost(this.webHost.http);
  }

  initialize() {
    this.webHost.initialize();

    const connectionCountChange = () => {
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
    };

    this.socketHost.on('connect', connectionCountChange);
    this.socketHost.on('disconnect', connectionCountChange);
  }
}

export { Host as default };
