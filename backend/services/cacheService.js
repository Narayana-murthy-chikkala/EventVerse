const { redisClient, isConnected } = require('../config/redis');

/**
 * EventVerse Hybrid Cache Service
 * Primary: Redis (High-speed, distributed cache)
 * Fallback: In-Memory Map (Thread-safe, self-healing, zero downtime if Redis is offline)
 */
class CacheService {
  constructor() {
    this.memoryStore = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletions: 0,
    };

    // Auto-eviction job for in-memory fallback
    setInterval(() => {
      this.evictMemoryExpired();
    }, 2 * 60 * 1000);
  }

  /**
   * Get cached item by key
   * @param {string} key
   * @returns {Promise<any|null>}
   */
  async get(key) {
    if (isConnected() && redisClient) {
      try {
        const raw = await redisClient.get(key);
        if (raw) {
          this.stats.hits++;
          return JSON.parse(raw);
        }
        this.stats.misses++;
        return null;
      } catch (err) {
        // Fallback to memory on Redis command error
      }
    }

    // In-memory fallback
    const entry = this.memoryStore.get(key);
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.memoryStore.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.value;
  }

  /**
   * Set cached item with TTL in seconds
   * @param {string} key
   * @param {any} value
   * @param {number} ttlSeconds - Default 300 seconds (5 mins)
   */
  async set(key, value, ttlSeconds = 300) {
    if (isConnected() && redisClient) {
      try {
        const serialized = JSON.stringify(value);
        if (ttlSeconds) {
          await redisClient.set(key, serialized, 'EX', ttlSeconds);
        } else {
          await redisClient.set(key, serialized);
        }
        this.stats.sets++;
        return true;
      } catch (err) {
        // Fallback to memory
      }
    }

    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.memoryStore.set(key, { value, expiresAt });
    this.stats.sets++;
    return true;
  }

  /**
   * Delete specific key
   * @param {string} key
   */
  async del(key) {
    if (isConnected() && redisClient) {
      try {
        const res = await redisClient.del(key);
        if (res > 0) this.stats.deletions++;
        return res > 0;
      } catch (err) {
        // Fallback
      }
    }

    const existed = this.memoryStore.delete(key);
    if (existed) this.stats.deletions++;
    return existed;
  }

  /**
   * Invalidate keys matching a pattern (e.g. 'events:*')
   * @param {string} pattern - Prefix with wildcard like 'events:*'
   */
  async delPattern(pattern) {
    if (!pattern) return 0;
    let deletedCount = 0;

    if (isConnected() && redisClient) {
      try {
        const keys = await redisClient.keys(pattern);
        if (keys && keys.length > 0) {
          deletedCount = await redisClient.del(...keys);
          this.stats.deletions += deletedCount;
          return deletedCount;
        }
        return 0;
      } catch (err) {
        // Fallback
      }
    }

    const regexPattern = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const key of this.memoryStore.keys()) {
      if (regexPattern.test(key)) {
        this.memoryStore.delete(key);
        deletedCount++;
      }
    }
    this.stats.deletions += deletedCount;
    return deletedCount;
  }

  /**
   * Clear entire cache
   */
  async flush() {
    if (isConnected() && redisClient) {
      try {
        await redisClient.flushdb();
      } catch (err) {}
    }
    const count = this.memoryStore.size;
    this.memoryStore.clear();
    return count;
  }

  /**
   * Evict all expired in-memory items
   */
  evictMemoryExpired() {
    const now = Date.now();
    for (const [key, entry] of this.memoryStore.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.memoryStore.delete(key);
      }
    }
  }

  /**
   * Get cache metrics
   */
  getMetrics() {
    const provider = isConnected() ? 'redis' : 'in-memory (fallback)';
    return {
      provider,
      connected: isConnected(),
      inMemoryKeys: this.memoryStore.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate:
        this.stats.hits + this.stats.misses === 0
          ? '0%'
          : `${Math.round((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100)}%`,
    };
  }
}

module.exports = new CacheService();
