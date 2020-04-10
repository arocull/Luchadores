import { EventEmitter } from 'events';

// import logger from './Logger';
import SocketHost from './SocketHost';
import WebHost from './WebHost';
import Clockwork from './Clockwork';

class Host extends EventEmitter {
  private socketHost: SocketHost;
  private webHost: WebHost;
  private instance: Clockwork;

  constructor(port: number) {
    super();

    this.webHost = new WebHost(port);
    this.socketHost = new SocketHost(this.webHost.http);

    this.instance = new Clockwork();
  }

  initialize() {
    this.webHost.initialize();

    this.instance.start();
  }
}

export { Host as default };
