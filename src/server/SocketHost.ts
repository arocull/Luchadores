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
        logger.info('Receiving Envelope %j', data);
        const envelope = events.core.Envelope.decode(data as Buffer);
        logger.info('Envelope decoded %j', envelope);

        let request: events.lobby.LobbyRequest;
        switch (envelope.type) {
          case events.core.TypeEnum.LobbyRequest:
            request = events.lobby.LobbyRequest.decode(envelope.data as Buffer);
            break;
          // TODO: Add missing types
          default:
            throw new Error(`Unexpected Envelope.TypeEnum: ${envelope.type}`);
        }
        logger.info('LobbyRequest decoded %j', request);

        const response = events.core.Envelope.encode({
          type: events.core.TypeEnum.LobbyResponse,
          data: events.lobby.LobbyResponse
            .encode({ lobbyNames: ['one', 'two', 'three'] }).finish(),
        }).finish();
        logger.info('Sending Envelope->LobbyResponse %j', response);
        socket.send(response);
      }));

      socket.on('close', (code, reason) => {
        logger.info('Connection closed %j, %j', code, reason);
      });
    });
  }
}

export { SocketHost as default };
