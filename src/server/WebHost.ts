import * as path from 'path';

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
    this.app.use(express.static(path.join(__dirname, '../../public/')));

    this.app.listen(this.port);
    logger.info(`Server started on port ${this.port}`);
  }
}

export { WebHost as default };
