import winston, { transport } from 'winston';
import dotenv from 'dotenv';

dotenv.config();

function createLogger() {
  const transports: transport[] = [
    new winston.transports.Console()
  ];

  if (process.env.FILE_LOGGING === 'true') {
    transports.push(
      new winston.transports.File({ filename: 'error.log', level: 'error' }),
      new winston.transports.File({ filename: 'combined.log' })
    );
  }

  return winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports
  });
}

export const logger = createLogger(); 