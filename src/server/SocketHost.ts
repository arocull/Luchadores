import * as http from 'http';

import * as WebSocket from 'ws';

import logger from './Logger';
import * as events from '../common/events/events';

class SocketHost {
  public ws: WebSocket.Server;

  constructor(server: http.Server) {
    this.ws = new WebSocket.Server({ server, path: '/socket' });

    this.ws.on('connection', (socket, req) => {
      logger.info('New websocket connection: %j',
        [socket.readyState, socket.binaryType, socket.protocol, req]);

      socket.on('message', ((data) => {
        logger.info('Incoming data %j', data);

        const request = events.LobbyRequest.decode(data as Buffer);
        logger.info('Lobby request %j', request);

        const response = events.LobbyResponse
          .encode({ lobbyNames: ['one', 'two', 'three'] })
          .finish();

        logger.info('Sending new data %j', response);
        socket.send(response);
      }));

      socket.on('close', (code, reason) => {
        logger.info('Connection closed %j, %j', code, reason);
      });
    });
  }
}

export { SocketHost as default };
