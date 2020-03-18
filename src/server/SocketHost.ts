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

        const envelope = events.Envelope.decode(data as Buffer);
        console.log(envelope);
        console.log(events.Envelope.TypeEnum);
        logger.info('Got envelope %j vs %j', envelope.type, events.Envelope.TypeEnum.LobbyRequest);

        let request: events.LobbyRequest;
        switch (envelope.type) {
          case events.Envelope.TypeEnum.LobbyRequest:
            request = events.LobbyRequest.decode(envelope.data as Buffer);
            break;
          // TODO: Add missing types
          default:
            throw new Error(`Unexpected Envelope.TypeEnum: ${envelope.type}`);
        }
        logger.info('Lobby request %j', request);

        const response = events.Envelope.encode({
          type: events.Envelope.TypeEnum.LobbyResponse,
          data: events.LobbyResponse
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
