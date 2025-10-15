import { Redis } from '@upstash/redis'

function createRedis() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    throw new Error('Upstash KV not configured: set KV_REST_API_URL and KV_REST_API_TOKEN')
  }
  return new Redis({ url, token })
}

export const kv = createRedis()

export async function kvGet<T>(key: string): Promise<T | null> {
  return (await kv.get<T>(key)) ?? null
}

export async function kvSet<T>(key: string, value: T, ttlSeconds?: number): Promise<'OK' | null> {
  if (ttlSeconds && ttlSeconds > 0) {
    return kv.set(key, value as any, { ex: ttlSeconds })
  }
  return kv.set(key, value as any)
}


