import { EventEmitter } from 'events';
import * as http from 'http';

import * as WebSocket from 'ws';

import logger from './Logger';
import SocketClient from './SocketClient';

class SocketHost extends EventEmitter {
  private ws: WebSocket.Server;
  private clients: SocketClient[]; // TODO: Remove clients that disconnect

  constructor(server: http.Server) {
    super();
    this.clients = [];
    this.ws = new WebSocket.Server({ server, path: '/socket' });
    this.ws.on('connection', (socket, req) => this.onConnection(socket as any, req));
  }

  onConnection(socket: WebSocket, req: http.IncomingMessage) {
    // https://www.npmjs.com/package/ws#how-to-get-the-ip-address-of-the-client
    const info = {
      remoteFamily: req.connection.remoteFamily,
      remoteAddress: req.connection.remoteAddress,
      remotePort: req.connection.remotePort,
    };

    const client = new SocketClient(socket, info);
    this.clients.push(client);
    logger.info('New websocket connection (total now: %o) %j', this.clients.length, info);

    this.emit('connect');

    socket.on('close', (code, reason) => {
      this.clients = this.clients.filter((x) => x !== client);
      logger.info('Closed websocket connection (total now: %o) %j due to %o, %o', this.clients.length, info, code, reason);
      this.emit('disconnect');
    });
  }

  getClients() : SocketClient[] {
    return this.clients;
  }
}

export { SocketHost as default };
