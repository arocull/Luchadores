import * as http from 'http';
import * as socketIo from 'socket.io';

// import logger from './Logger';

class SocketHost {
  public ws: socketIo.Server;

  constructor(server: http.Server) {
    this.ws = socketIo(server);
  }
}

export { SocketHost as default };
