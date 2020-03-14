import { EventEmitter } from 'events';
import * as util from 'util';
import * as _ from 'lodash';
import * as winston from 'winston';

class Host extends EventEmitter {
  public Logger: winston.Logger;

  constructor(public Port: number) {
    super();

    this.Logger = winston.createLogger({
      level: 'debug',
      format: winston.format.combine(
        winston.format.label({ label: 'Luchadores' }),
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
      ),
      transports: [
        new winston.transports.Console({
          level: 'debug',
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf((info) => `${info.timestamp} ${info.label} ${info.level}:\t${util.format(info.message)}`),
          ),
        }),
        new winston.transports.File({
          filename: 'luchadores.log',
          level: 'silly',
          format: winston.format.logstash(),
        }),
      ],
      exitOnError: false,
    });
  }

  Initialize() {
    this.Logger.info(`Server started on port ${this.Port} @ ${_.now()}`);
  }
}

export { Host as default };
