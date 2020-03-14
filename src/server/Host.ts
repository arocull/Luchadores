import { EventEmitter } from 'events';

// import logger from './Logger';
import SocketHost from './SocketHost';
import WebHost from './WebHost';

class Host extends EventEmitter {
  private socketHost: SocketHost;
  private webHost: WebHost;

  constructor(port: number) {
    super();

    this.webHost = new WebHost(port);
    this.socketHost = new SocketHost(this.webHost.http);
  }

  initialize() {
    this.webHost.initialize();
  }
}

export { Host as default };
