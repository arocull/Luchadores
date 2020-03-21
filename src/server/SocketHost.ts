import http from 'http';
import socketIo from 'socket.io';

import logger from './Logger';

class SocketHost {
  public ws: socketIo.Server;

  constructor(server: http.Server) {
    this.ws = socketIo(server);

    this.ws.on('connection', (socket) => {
      logger.info(`New websocket connection! ${socket.id}`);
      socket.on('disconnect', () => {
        logger.info(`Disconnected: ${socket.id}`);
      });
    });
  }
}

export { SocketHost as default };
