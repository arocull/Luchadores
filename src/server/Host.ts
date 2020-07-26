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
    this.initializeHeartbeatServers();

    this.socketHost.on('connect', () => this.onConnectionCountChange());
    this.socketHost.on('disconnect', () => this.onConnectionCountChange());
  }

  private initializeHeartbeatServers() {
    // Report to heartbeat server(s).
    // We do this even if the game instance is not running because it *could*
    // be running if someone would just connect.
    const servers = config.get<string[]>('heartbeat.servers') || [];
    if (!Array.isArray(servers)) {
      logger.error('Heartbeat servers is misconfigured as %j', servers);
      return;
    }
    if (servers.length === 0) {
      logger.warn('No heartbeat servers configured - this server will not announce itself');
      return;
    }
    if (typeof servers[0] !== 'string') {
      logger.error('Heartbeat servers is misconfigured as %j', servers);
      return;
    }

    interface HeartbeatData {
      title: string;
      address: string;
      playerCount: number;
      playerCapacity: number;
    }

    const addresses = servers.map((baseUrl) => new URL('/heartbeat', baseUrl).toString());
    const fnHeartbeat = () => {
      const heartbeatData: HeartbeatData = {
        title: config.get<string>('server.title'),
        address: config.get<string>('server.address'),
        playerCount: this.getPlayerCount(),
        playerCapacity: this.getPlayerCapacity(),
      };

      addresses.forEach((address) => {
        axios.post(address, heartbeatData)
          .then(() => {
            logger.silly('Heartbeat reporting to %o was OK', address);
          })
          .catch((err) => {
            logger.error('Heartbeat reporting to %o failed: %j', address, err);
          });
      });
    };

    // Run once now, and then keep running on an interval
    // TODO: Re-evaluate this reporting interval later
    fnHeartbeat();
    setInterval(fnHeartbeat, 10 * 1000);
  }

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
