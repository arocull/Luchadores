import { EventEmitter } from 'events';

import logger from './Logger';
import SocketHost from './SocketHost';
import WebHost from './WebHost';
import Clockwork from './Clockwork';

class Host extends EventEmitter {
  private socketHost: SocketHost;
  private webHost: WebHost;
  private instance: Clockwork;

  constructor(port: number) {
    super();

    this.webHost = new WebHost(port);
    this.socketHost = new SocketHost(this.webHost.http);

    this.instance = null;
  }

  initialize() {
    this.webHost.initialize();

    const connectionCountChange = () => {
      if (this.instance && this.socketHost.getClients().length === 0) {
        setTimeout(() => {
          // Wait a moment to receive any residual packets, or maybe a player will
          // fill the spot.
          logger.info('Shutting down game instance ...');
          this.instance.stop();
          this.instance = null;
        }, 5 * 1000);
      } else if (!this.instance && this.socketHost.getClients().length > 0) {
        logger.info('Spinning up game instance ...');
        this.instance = new Clockwork();
        this.instance.start();
      }
    };

    this.socketHost.on('connect', connectionCountChange);
    this.socketHost.on('disconnect', connectionCountChange);
  }
}

export { Host as default };
