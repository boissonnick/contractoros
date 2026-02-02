/**
 * Rate Limiter for AI Assistant
 *
 * Implements per-organization rate limiting to:
 * - Prevent abuse and cost overruns
 * - Ensure fair usage across organizations
 * - Support different limits by tier
 */

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  increment,
  Timestamp,
} from 'firebase/firestore';
import { RATE_LIMITS, ModelTier, RateLimitConfig } from '../models/types';

export interface RateLimitCheck {
  allowed: boolean;
  remaining: {
    requests: number;
    tokens: number;
  };
  resetAt: Date;
  reason?: string;
  retryAfter?: number; // seconds
}

export interface UsageRecord {
  requests: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  lastRequestAt: Timestamp;
  modelBreakdown: Record<
    string,
    {
      requests: number;
      tokens: number;
      cost: number;
    }
  >;
}

/**
 * In-memory cache for rate limiting (reduces Firestore reads)
 * Cache entries expire after 1 minute
 */
const rateLimitCache = new Map<
  string,
  {
    data: UsageRecord;
    timestamp: number;
  }
>();

const CACHE_TTL_MS = 60 * 1000; // 1 minute

/**
 * Get the date key for today (YYYY-MM-DD in UTC)
 */
function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get the minute key for rate limiting (YYYY-MM-DDTHH:MM in UTC)
 */
function getMinuteKey(): string {
  const now = new Date();
  return `${now.toISOString().split(':')[0]}:${now.getUTCMinutes().toString().padStart(2, '0')}`;
}

/**
 * Get next day midnight (UTC)
 */
function getNextDayMidnight(): Date {
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  return tomorrow;
}

/**
 * Check rate limits for an organization
 */
export async function checkRateLimit(
  db: ReturnType<typeof getFirestore>,
  orgId: string,
  tier: ModelTier = 'free'
): Promise<RateLimitCheck> {
  const config = RATE_LIMITS[tier];
  const todayKey = getTodayKey();
  const cacheKey = `${orgId}:${todayKey}`;

  // Check cache first
  const cached = rateLimitCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return evaluateLimits(cached.data, config);
  }

  // Fetch from Firestore
  const usageRef = doc(db, `organizations/${orgId}/aiUsage/${todayKey}`);

  try {
    const usageSnap = await getDoc(usageRef);
    const usage: UsageRecord = usageSnap.exists()
      ? (usageSnap.data() as UsageRecord)
      : {
          requests: 0,
          inputTokens: 0,
          outputTokens: 0,
          estimatedCost: 0,
          lastRequestAt: Timestamp.now(),
          modelBreakdown: {},
        };

    // Update cache
    rateLimitCache.set(cacheKey, {
      data: usage,
      timestamp: Date.now(),
    });

    return evaluateLimits(usage, config);
  } catch (error) {
    console.error('[RateLimiter] Error checking rate limit:', error);
    // On error, allow the request but log it
    return {
      allowed: true,
      remaining: {
        requests: config.requestsPerDay,
        tokens: config.tokensPerDay,
      },
      resetAt: getNextDayMidnight(),
    };
  }
}

/**
 * Evaluate usage against limits
 */
function evaluateLimits(
  usage: UsageRecord,
  config: RateLimitConfig
): RateLimitCheck {
  const totalTokens = usage.inputTokens + usage.outputTokens;

  // Check daily request limit
  if (usage.requests >= config.requestsPerDay) {
    return {
      allowed: false,
      remaining: {
        requests: 0,
        tokens: Math.max(0, config.tokensPerDay - totalTokens),
      },
      resetAt: getNextDayMidnight(),
      reason: 'Daily request limit reached',
      retryAfter: getSecondsUntilMidnight(),
    };
  }

  // Check daily token limit
  if (totalTokens >= config.tokensPerDay) {
    return {
      allowed: false,
      remaining: {
        requests: Math.max(0, config.requestsPerDay - usage.requests),
        tokens: 0,
      },
      resetAt: getNextDayMidnight(),
      reason: 'Daily token limit reached',
      retryAfter: getSecondsUntilMidnight(),
    };
  }

  // Check daily cost limit
  if (usage.estimatedCost >= config.maxCostPerDay && config.maxCostPerDay > 0) {
    return {
      allowed: false,
      remaining: {
        requests: Math.max(0, config.requestsPerDay - usage.requests),
        tokens: Math.max(0, config.tokensPerDay - totalTokens),
      },
      resetAt: getNextDayMidnight(),
      reason: 'Daily cost limit reached',
      retryAfter: getSecondsUntilMidnight(),
    };
  }

  // All checks passed
  return {
    allowed: true,
    remaining: {
      requests: config.requestsPerDay - usage.requests,
      tokens: config.tokensPerDay - totalTokens,
    },
    resetAt: getNextDayMidnight(),
  };
}

/**
 * Get seconds until next midnight UTC
 */
function getSecondsUntilMidnight(): number {
  const now = new Date();
  const midnight = getNextDayMidnight();
  return Math.ceil((midnight.getTime() - now.getTime()) / 1000);
}

/**
 * Record usage after a successful request
 */
export async function recordUsage(
  db: ReturnType<typeof getFirestore>,
  orgId: string,
  usage: {
    inputTokens: number;
    outputTokens: number;
    estimatedCost: number;
    modelKey: string;
  }
): Promise<void> {
  const todayKey = getTodayKey();
  const usageRef = doc(db, `organizations/${orgId}/aiUsage/${todayKey}`);

  try {
    await setDoc(
      usageRef,
      {
        requests: increment(1),
        inputTokens: increment(usage.inputTokens),
        outputTokens: increment(usage.outputTokens),
        estimatedCost: increment(usage.estimatedCost),
        lastRequestAt: Timestamp.now(),
        [`modelBreakdown.${usage.modelKey}.requests`]: increment(1),
        [`modelBreakdown.${usage.modelKey}.tokens`]: increment(
          usage.inputTokens + usage.outputTokens
        ),
        [`modelBreakdown.${usage.modelKey}.cost`]: increment(usage.estimatedCost),
      },
      { merge: true }
    );

    // Invalidate cache
    const cacheKey = `${orgId}:${todayKey}`;
    rateLimitCache.delete(cacheKey);
  } catch (error) {
    console.error('[RateLimiter] Error recording usage:', error);
    // Don't throw - recording failure shouldn't break the response
  }
}

/**
 * Get usage statistics for an organization
 */
export async function getUsageStats(
  db: ReturnType<typeof getFirestore>,
  orgId: string,
  daysBack: number = 7
): Promise<
  Array<{
    date: string;
    requests: number;
    tokens: number;
    cost: number;
  }>
> {
  const stats: Array<{
    date: string;
    requests: number;
    tokens: number;
    cost: number;
  }> = [];

  const today = new Date();

  for (let i = 0; i < daysBack; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];

    const usageRef = doc(db, `organizations/${orgId}/aiUsage/${dateKey}`);
    const usageSnap = await getDoc(usageRef);

    if (usageSnap.exists()) {
      const data = usageSnap.data() as UsageRecord;
      stats.push({
        date: dateKey,
        requests: data.requests,
        tokens: data.inputTokens + data.outputTokens,
        cost: data.estimatedCost,
      });
    } else {
      stats.push({
        date: dateKey,
        requests: 0,
        tokens: 0,
        cost: 0,
      });
    }
  }

  return stats.reverse(); // Return in chronological order
}

/**
 * Clear rate limit cache (useful for testing)
 */
export function clearRateLimitCache(): void {
  rateLimitCache.clear();
}

/**
 * Format rate limit info for API response headers
 */
export function getRateLimitHeaders(check: RateLimitCheck): Record<string, string> {
  return {
    'X-RateLimit-Remaining-Requests': check.remaining.requests.toString(),
    'X-RateLimit-Remaining-Tokens': check.remaining.tokens.toString(),
    'X-RateLimit-Reset': check.resetAt.toISOString(),
    ...(check.retryAfter && { 'Retry-After': check.retryAfter.toString() }),
  };
}
