import { EventEmitter } from 'events';

import config from 'config';

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

    // Report to heartbeat server(s).
    // We do this even if the game instance is not running because it *could*
    // be running if someone would just connect.
    setInterval(() => {
      const servers = config.get<string[]>('heartbeatServers') || [];
      if (!Array.isArray(servers) || typeof servers[0] !== 'string') {
        console.error('Heartbeat servers is misconfigured as %j', servers);
        return;
      }
      console.log('Reporting with heartbeat servers:', servers);
    }, 10 * 1000); // TODO: Re-evaluate this reporting interval later
  }
}

export { Host as default };
