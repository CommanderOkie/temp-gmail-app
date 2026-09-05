import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;

if (!redisUrl) {
  console.warn("Missing Redis Environment Variables! Please connect RedisLabs or Upstash Redis.");
}

// @ts-ignore
export const kv = new Redis(redisUrl || 'redis://localhost:6379');
