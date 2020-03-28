import * as util from 'util';

import * as winston from 'winston';

const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.label({ label: 'Luchadores' }),
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(), // See https://stackoverflow.com/a/46973676/97964
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

export { logger as default };
