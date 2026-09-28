import Redis, { RedisOptions } from 'ioredis';

export function redisOptions(): RedisOptions {
  if (process.env.REDIS_URL) {
    return { lazyConnect: true, maxRetriesPerRequest: null };
  }
  return {
    host: process.env.REDIS_HOST?.trim() || 'redis',
    port: Number(process.env.REDIS_PORT?.trim() || '6379'),
    password: process.env.REDIS_PASSWORD?.trim() || undefined,
    lazyConnect: true,
    maxRetriesPerRequest: null,
  };
}

export function createRedisConnection() {
  const url = process.env.REDIS_URL?.trim();
  return url ? new Redis(url, redisOptions()) : new Redis(redisOptions());
}
