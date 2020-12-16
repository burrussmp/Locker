import winston from 'winston';
import expressWinston from 'express-winston';

const logger = expressWinston.logger({
  transports: [
    new winston.transports.Console(),
  ],
  format: winston.format.combine(
      winston.format.colorize(),
      winston.format.json(),
  ),
});

export default logger;
