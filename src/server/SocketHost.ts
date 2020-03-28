import * as http from 'http';

import * as WebSocket from 'ws';

import logger from './Logger';
import SocketClient from './SocketClient';
// import { MessageBus, Topics } from '../common/messaging/bus';
// import { decoder } from '../common/messaging/serde';

class SocketHost {
  private ws: WebSocket.Server;
  private clients: SocketClient[]; // TODO: Remove clients that disconnect

  constructor(server: http.Server) {
    this.clients = [];
    this.ws = new WebSocket.Server({ server, path: '/socket' });
    this.ws.on('connection', (socket, req) => this.onConnection(socket, req));
  }

  onConnection(socket: WebSocket, req: http.IncomingMessage) {
    // https://www.npmjs.com/package/ws#how-to-get-the-ip-address-of-the-client
    const info = {
      remoteFamily: req.connection.remoteFamily,
      remoteAddress: req.connection.remoteAddress,
      remotePort: req.connection.remotePort,
    };
    logger.info('New websocket connection %j', info);

    const client = new SocketClient(socket, info);
    client.subscribe(); // Connect to message bus

    this.clients.push(client);
    logger.info('Updated client connection count: %o', this.clients.length);

    socket.on('close', (code, reason) => {
      logger.info('Closing websocket connection %j due to %o, %o', info, code, reason);
      client.unsubscribe(); // Remove from message bus
      this.clients = this.clients.filter((x) => x !== client);
      logger.info('Updated client connection count: %o', this.clients.length);
    });
  }
}

export { SocketHost as default };
