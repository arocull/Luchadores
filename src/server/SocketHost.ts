import * as http from 'http';
import * as socketIo from 'socket.io';

import logger from './Logger';
import * as events from '../common/events/events';

class SocketHost {
  public ws: socketIo.Server;

  constructor(server: http.Server) {
    this.ws = socketIo(server);

    this.ws.on('connection', (socket) => {
      logger.info(`New websocket connection! ${socket.id}`);

      socket.on('lobby-request', (from, msg) => {
        // TODO: Decoding here is not working.
        //       Issues with binary type handling and no type defs for `from`, `msg`
        //       Conflicting with EventEmitter?
        console.log(from, msg);
        const out = events.LobbyRequest.decode(msg);
        logger.info(`Lobby request: ${from.id}, ${out.toJSON()}`);
        logger.info(`Lobby search: ${out.search}`);

        socket.emit('lobby-response', events.LobbyResponse.encode({ lobbyNames: ['one', 'two', 'three'] }).finish());
      });

      socket.on('disconnect', () => {
        logger.info(`Disconnected: ${socket.id}`);
      });
    });
  }
}

export { SocketHost as default };
