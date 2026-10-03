import Redis from 'ioredis'

function createRedis() {
  const url = process.env.REDIS_URL
  if (!url) {
    if (process.env.NODE_ENV === 'production') console.error('[Factor Escape] Falta REDIS_URL.')
    return null
  }
  return new Redis(url, {
    maxRetriesPerRequest: null,
    retryStrategy: attempts => Math.min(attempts * 200, 5000),
  })
}

export const redis = createRedis()
