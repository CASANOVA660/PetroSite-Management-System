const Redis = require('ioredis');
const logger = require('./../utils/logger');
const dotenv = require('dotenv');

// Log the Redis URL being used (without exposing credentials)
const redisUrl = process.env.REDIS_URL || '';
logger.info(`Connecting to Redis at: ${redisUrl.split('@')[1] || 'localhost:6379'}`);

const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 5,
  connectTimeout: 10000,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return times > 20 ? null : delay;
  }
});
// Event listener
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

// Graceful shutdown
process.on('SIGINT', async () => {
  await redis.quit();
  process.exit(0);
});

module.exports = redis;
