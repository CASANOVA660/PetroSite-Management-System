const winston = require('winston');
const { combine, timestamp, printf, colorize, errors } = winston.format;
const fs = require('fs');
const path = require('path');

// Determine if file logging is enabled (default to true if not specified)
const isFileLoggingEnabled = process.env.LOG_FILE_ENABLED !== 'false';

// Ensure logs directory exists if file logging is enabled
const logDir = process.env.LOG_DIRECTORY || './logs';
if (isFileLoggingEnabled) {
  try {
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  } catch (error) {
    console.error(`Warning: Could not create log directory: ${error.message}`);
    // Continue execution even if we can't create the directory
  }
}

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

// Create a logger configuration based on available options
const loggerConfig = {
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: combine(
    errors({ stack: true }), // Show error stacks
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    process.env.NODE_ENV === 'production' ? prodFormat : combine(colorize(), devFormat)
  ),
  transports: [
    new winston.transports.Console({
      handleExceptions: true,
      handleRejections: true
    })
  ],
  exitOnError: false
};

// Only add file transports if file logging is enabled and the logs directory is writable
if (isFileLoggingEnabled) {
  try {
    const testFile = path.join(logDir, 'test.log');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);

    // If we get here, we can write to the logs directory
    loggerConfig.transports.push(
      new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
        maxsize: 5 * 1024 * 1024, // 5MB
        maxFiles: 3
      }),
      new winston.transports.File({
        filename: path.join(logDir, 'combined.log'),
        maxsize: 20 * 1024 * 1024, // 20MB
        maxFiles: 5
      })
    );

    loggerConfig.exceptionHandlers = [
      new winston.transports.File({ filename: path.join(logDir, 'exceptions.log') })
    ];

    loggerConfig.rejectionHandlers = [
      new winston.transports.File({ filename: path.join(logDir, 'rejections.log') })
    ];

    console.log('File logging enabled');
  } catch (error) {
    console.warn(`Warning: File logging disabled due to permissions issue: ${error.message}`);
    // We'll continue with just console logging
  }
} else {
  console.log('File logging disabled via environment variable');
}

const logger = winston.createLogger(loggerConfig);

// For Morgan HTTP logging integration
logger.stream = {
  write: (message) => logger.info(message.trim())
};

module.exports = logger;