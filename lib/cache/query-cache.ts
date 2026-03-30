import { Redis } from '@upstash/redis'
import crypto from 'crypto'

const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null

const CACHE_TTL = 60 * 60 // 1 hour
const CACHE_PREFIX = 'buisnessflow:query:'

interface CachedQueryResult {
  response: {
    kind: 'text' | 'table' | 'chart'
    chartSubtype?: 'bar' | 'line' | 'pie'
    summary: string
    chartConfig?: Record<string, unknown>
    data: Record<string, unknown>[]
  }
  meta: {
    rowCount: number
    durationMs: number
    privacyMode: 'standard' | 'strict'
  }
  compiledQuery?: string
  compiledPipeline?: Record<string, unknown>[]
}

function generateCacheKey(
  workspaceId: string,
  connectionId: string,
  question: string,
  schemaVersion: string,
  privacyMode: 'standard' | 'strict'
): string {
  const normalized = question.toLowerCase().trim().replace(/\s+/g, ' ')
  const hash = crypto
    .createHash('sha256')
    .update(`${workspaceId}:${connectionId}:${normalized}:${schemaVersion}:${privacyMode}`)
    .digest('hex')
  return `${CACHE_PREFIX}${hash}`
}

export async function getCachedQuery(
  workspaceId: string,
  connectionId: string,
  question: string,
  schemaVersion: string,
  privacyMode: 'standard' | 'strict' = 'standard'
): Promise<CachedQueryResult | null> {
  if (!redis) return null

  try {
    const key = generateCacheKey(
      workspaceId,
      connectionId,
      question,
      schemaVersion,
      privacyMode
    )
    const cached = await redis.get<CachedQueryResult>(key)
    return cached
  } catch (error) {
    console.error('[Query Cache] Get error:', error)
    return null
  }
}

export async function setCachedQuery(
  workspaceId: string,
  connectionId: string,
  question: string,
  schemaVersion: string,
  privacyMode: 'standard' | 'strict',
  result: CachedQueryResult
): Promise<void> {
  if (!redis) return

  try {
    const key = generateCacheKey(
      workspaceId,
      connectionId,
      question,
      schemaVersion,
      privacyMode
    )
    await redis.setex(key, CACHE_TTL, result)
  } catch (error) {
    console.error('[Query Cache] Set error:', error)
  }
}

export async function invalidateConnectionCache(
  workspaceId: string,
  connectionId: string
): Promise<void> {
  if (!redis) return

  try {
    const pattern = `${CACHE_PREFIX}*${workspaceId}*${connectionId}*`
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } catch (error) {
    console.error('[Query Cache] Invalidate error:', error)
  }
}
