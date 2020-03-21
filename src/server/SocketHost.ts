import * as http from 'http';

import * as WebSocket from 'ws';

import logger from './Logger';
import * as events from '../common/events/events';
import decoder from '../common/messaging/decoder';

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

      socket.on('message', ((data) => {
        logger.info('Receiving Envelope %j', data);
        const envelope = events.core.Envelope.decode(data as Buffer);
        logger.info('Envelope decoded %j', envelope);

        const decoded = decoder(envelope);
        logger.info('Message decoded %j', decoded);
      }));

      socket.on('close', (code, reason) => {
        logger.info('Connection closed %j, %j', code, reason);
      });
    });
  }
}

export { SocketHost as default };
