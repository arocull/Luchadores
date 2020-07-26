import { EventEmitter } from 'events';
import { URL } from 'url';

import axios from 'axios';
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
    const servers = config.get<string[]>('heartbeat.servers') || [];
    if (!Array.isArray(servers) || typeof servers[0] !== 'string') {
      logger.error('Heartbeat servers is misconfigured as %j', servers);
    } else {
      interface HeartbeatData {
        title: string;
        address: string;
        playerCount: number;
        playerCapacity: number;
      }
      const addresses = servers.map((baseUrl) => new URL('/heartbeat', baseUrl).toString());
      setInterval(() => {
        const heartbeatData: HeartbeatData = {
          title: config.get<string>('server.title'),
          address: config.get<string>('server.address'),
          playerCount: this.getPlayerCount(),
          playerCapacity: this.getPlayerCapacity(),
        };

        addresses.forEach((address) => {
          axios.post(address, heartbeatData)
            .then(() => {
              logger.debug('Reporting to %o was OK', address);
            })
            .catch((err) => {
              logger.error('Failed to report to %o: %j', address, err);
            });
        });
      }, 10 * 1000); // TODO: Re-evaluate this reporting interval later
    }
  }

  private getPlayerCount(): number {
    if (this.clockwork) {
      return this.clockwork.getPlayerCount();
    }
    return 0; // No server instance running
  }

  private getPlayerCapacity(): number {
    // TODO: Implement an actual capacity.
    //       See issue #75 in Gitlab
    return 20;
  }
}

export { Host as default };
