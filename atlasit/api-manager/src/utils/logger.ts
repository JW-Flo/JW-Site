import winston from 'winston';
import { config } from '../config/environment';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: { service: 'atlasit-api-manager' },
  transports: [
    new winston.transports.File({ 
      filename: config.logging.file.replace('.log', '-error.log'),
      level: 'error'
    }),
    new winston.transports.File({ 
      filename: config.logging.file 
    })
  ]
});

// Add console logging in development
if (config.server.environment !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

export default logger;
