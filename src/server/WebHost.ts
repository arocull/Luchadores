import * as express from 'express';
import * as http from 'http';

import logger from './Logger';

class WebHost {
  public app: express.Express;
  public http: http.Server;

  constructor(public port: number) {
    this.app = express();
    this.http = http.createServer(this.app);
  }

  initialize() {
    // Serve files
    const webRoot = './dist/public';
    logger.info(`Web root is ${webRoot}`);
    this.app.use(express.static(webRoot));

    this.http.listen(this.port);
    logger.info(`Server started on port ${this.port}`);
  }
}

export { WebHost as default };
