const Redis = require('ioredis');

/**
 * EventVerse Redis Client
 * Connects to Redis via REDIS_URL or local host.
 * Implements retry backoff and error shielding so server never crashes if Redis is offline.
 */
const redisUrl = process.env.REDIS_URL || process.env.REDIS_URI;

let redisClient = null;
let isRedisConnected = false;

try {
  const options = {
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      if (times > 3) {
        // Stop retrying aggressively if Redis is not running
        return null;
      }
      return Math.min(times * 100, 2000);
    },
    enableOfflineQueue: false,
    connectTimeout: 3000,
  };

  if (redisUrl) {
    redisClient = new Redis(redisUrl, options);
  } else {
    // Attempt local connection if explicitly configured or testable
    redisClient = new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      ...options,
    });
  }

  redisClient.on('connect', () => {
    isRedisConnected = true;
    console.log('🔴 [Redis] Connected successfully to Redis server!');
  });

  redisClient.on('ready', () => {
    isRedisConnected = true;
  });

  redisClient.on('error', (err) => {
    isRedisConnected = false;
    // Suppress unhandled crash - gracefully report state
    if (err.code === 'ECONNREFUSED') {
      // Local Redis not running, fallback to In-Memory
    } else {
      console.warn('⚠️ [Redis] Connection warning:', err.message);
    }
  });

  redisClient.on('close', () => {
    isRedisConnected = false;
  });
} catch (e) {
  isRedisConnected = false;
  console.warn('⚠️ [Redis] Initialization failed, will use in-memory store:', e.message);
}

const getClient = () => redisClient;
const isConnected = () => isRedisConnected;

module.exports = {
  redisClient,
  getClient,
  isConnected,
};
