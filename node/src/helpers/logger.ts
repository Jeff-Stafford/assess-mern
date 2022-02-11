import winston from 'winston';
import { ENVIRONMENT } from '../config/constants';

const { createLogger, transports, format } = winston;
const { splat, combine, timestamp, label, printf } = format;

const customFormat = printf(
  ({ level, message, label, timestamp }) =>
    `${timestamp} [${label}] ${level}: ${message}`
);

const isDevMode = ENVIRONMENT === 'development';

export const getLogger = (entity: string) => {
  const logger = createLogger({
    transports: [
      new transports.Console({
        format: combine(
          label({ label: entity }),
          timestamp(),
          splat(),
          customFormat
        ),
        level: isDevMode ? 'debug' : 'info'
      })
    ]
  });

  return logger;
};
