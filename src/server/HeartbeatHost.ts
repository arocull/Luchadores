import { URL } from 'url';

import axios from 'axios';
import config from 'config';
import { Express } from 'express';

import Clockwork from './Clockwork';
import logger from './Logger';

interface HeartbeatData {
  title: string;
  address: string;
  playerCount: number;
  playerCapacity: number;
}

class HeartbeatHost {
  constructor(
    private app: Express,
    private fnGetClockwork: () => Clockwork,
  ) {
  }

  initialize() {
    this.initializeHeartbeatServers();
  }

  private getPlayerCount(): number {
    const clockwork = this.fnGetClockwork();
    if (clockwork) {
      return clockwork.getPlayerCount();
    }
    return 0; // No server instance running
  }

  private getPlayerCapacity(): number {
    // TODO: Implement an actual capacity.
    //       See issue #75 in Gitlab
    return 20;
  }

  private getHeartbeatData(): HeartbeatData {
    return {
      title: config.get<string>('server.title'),
      address: config.get<string>('server.address'),
      playerCount: this.getPlayerCount(),
      playerCapacity: this.getPlayerCapacity(),
    };
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

    const addresses = servers.map((baseUrl) => new URL('/heartbeat', baseUrl).toString());
    const fnHeartbeat = () => {
      const heartbeatData = this.getHeartbeatData();

      addresses.forEach((address) => {
        axios.post(address, heartbeatData)
          .then(() => {
            logger.silly('Heartbeat reporting to %s was OK', address);
          })
          .catch((err) => {
            logger.error('Heartbeat reporting to %s failed: %j', address, err);
          });
      });
    };

    // Run once now, and then keep running on an interval
    // TODO: Re-evaluate this reporting interval later
    fnHeartbeat();
    setInterval(() => fnHeartbeat(), 10 * 1000);
  }
}

export { HeartbeatHost as default };
