const Redis = require('ioredis');
const logger = require('./../utils/logger'); // Assuming you have a logger setup

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 5,
  connectTimeout: 10000,
  tls: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return times > 20 ? null : delay; // Limit maximum retry attempts
  }
};

const redis = new Redis(redisConfig);

// Event listeners
redis.on('connect', () => {
  logger.info('Redis: Connection established');
});

redis.on('ready', () => {
  logger.info('Redis: Connection ready');
});

redis.on('error', (error) => {
  logger.error(`Redis error: ${error.message}`, { stack: error.stack });
});

redis.on('end', () => {
  logger.warn('Redis: Connection closed');
});

redis.on('reconnecting', (ms) => {
  logger.info(`Redis: Reconnecting in ${ms}ms`);
});

// Graceful shutdown handling
process.on('SIGINT', async () => {
  await redis.quit();
  process.exit(0);
});

module.exports = redis;