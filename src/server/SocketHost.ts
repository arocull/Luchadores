import * as http from 'http';

import * as WebSocket from 'ws';

import logger from './Logger';
// import * as events from '../common/events/events';
import { decoder } from '../common/messaging/serde';

class SocketHost {
  public ws: WebSocket.Server;

  constructor(server: http.Server) {
    this.ws = new WebSocket.Server({ server, path: '/socket' });

    this.ws.on('connection', (socket, req) => {
      // https://www.npmjs.com/package/ws#how-to-get-the-ip-address-of-the-client
      logger.info('New websocket connection %j', [
        req.connection.remoteFamily,
        req.connection.remoteAddress,
        req.connection.remotePort,
      ]);

      socket.on('message', ((data: Buffer) => {
        logger.info('Receiving data %j', data);

        const decoded = decoder(data);
        logger.info('Message decoded %j', decoded);
      }));

      socket.on('close', (code, reason) => {
        logger.info('Connection closed %j, %j', code, reason);
      });
    });
  }
}

export { SocketHost as default };
