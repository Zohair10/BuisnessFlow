import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null

export const queryRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 m'),
      prefix: 'buisnessflow:ratelimit:query',
    })
  : null

export async function checkRateLimit(workspaceId: string): Promise<{
  success: boolean
  limit: number
  remaining: number
  reset: number
}> {
  if (!queryRateLimit) {
    return { success: true, limit: 10, remaining: 10, reset: Date.now() + 60000 }
  }

  const result = await queryRateLimit.limit(`workspace:${workspaceId}`)
  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  }
}
