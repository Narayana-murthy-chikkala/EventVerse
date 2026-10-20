const Redis = require('ioredis');
require('dotenv').config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = new Redis(redisUrl, { connectTimeout: 3000, maxRetriesPerRequest: 1 });

async function inspectRedis() {
  console.log(`\n🔍 Inspecting Redis at: ${redisUrl}\n`);

  try {
    const keys = await redis.keys('*');
    
    if (keys.length === 0) {
      console.log('ℹ️  Redis is currently EMPTY (or all keys have reached their TTL and expired).');
      console.log('👉 Tip: Open http://localhost:5173 or hit http://localhost:5000/api/v1/events to populate the cache!\n');
      process.exit(0);
    }

    console.log(`📊 Found ${keys.length} key(s) in Redis:\n`);

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const type = await redis.type(key);
      const ttl = await redis.ttl(key);
      let value = await redis.get(key);

      try {
        value = JSON.parse(value);
      } catch (e) {}

      console.log(`=======================================================`);
      console.log(`🔑 Key [${i + 1}]: "${key}"`);
      console.log(`📌 Type: ${type}`);
      console.log(`⏳ TTL (Time-To-Live): ${ttl === -1 ? 'Persistent (No TTL)' : `${ttl} seconds remaining`}`);
      console.log(`📦 Data Preview:`);
      console.log(JSON.stringify(value, null, 2).slice(0, 600) + '...\n');
    }
  } catch (err) {
    console.error('❌ Failed to connect to Redis:', err.message);
  } finally {
    await redis.quit();
  }
}

inspectRedis();
