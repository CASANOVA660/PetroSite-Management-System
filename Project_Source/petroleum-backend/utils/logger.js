const winston = require('winston');
const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom format for development
const devFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}] ${stack || message}`;
});

// Custom format for production
const prodFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}] ${message}`;
  if (metadata && Object.keys(metadata).length) {
    msg += JSON.stringify(metadata);
  }
  return msg;
});

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    errors({ stack: true }), // Show error stacks
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    process.env.NODE_ENV === 'production' ? prodFormat : combine(colorize(), devFormat)
  ),
  transports: [
    new winston.transports.Console({
      handleExceptions: true,
      handleRejections: true
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 3
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 20 * 1024 * 1024, // 20MB
      maxFiles: 5
    })
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: './logs/exceptions.log' })
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: './logs/rejections.log' })
  ],
  exitOnError: false
});

// For Morgan HTTP logging integration
logger.stream = {
  write: (message) => logger.info(message.trim())
};

module.exports = logger;