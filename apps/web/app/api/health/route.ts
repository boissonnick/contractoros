import { NextRequest, NextResponse } from 'next/server';
import {
  getSharedRateLimiter,
  getClientIdentifier,
  getRateLimitHeaders,
  RATE_LIMITS,
} from '@/lib/security/rate-limiter';

// Get a shared rate limiter for health checks using the 'public' preset
const healthLimiter = getSharedRateLimiter('health', {
  ...RATE_LIMITS.public,
  // 60 requests per minute for health checks
});

/**
 * GET /api/health
 *
 * Health check endpoint with rate limiting demonstration.
 * Returns server status and rate limit information.
 */
export async function GET(request: NextRequest) {
  const clientId = getClientIdentifier(request);
  const result = healthLimiter.check(clientId);
  const headers = getRateLimitHeaders(result);

  // If rate limit exceeded, return 429
  if (!result.success) {
    return NextResponse.json(
      {
        status: 'rate_limited',
        error: 'Too many requests, please try again later.',
        retryAfter: Math.ceil(
          (result.resetTime.getTime() - Date.now()) / 1000
        ),
      },
      {
        status: 429,
        headers: {
          ...headers,
          'Retry-After': Math.max(
            1,
            Math.ceil((result.resetTime.getTime() - Date.now()) / 1000)
          ).toString(),
        },
      }
    );
  }

  // Return health status with rate limit info
  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      rateLimit: {
        limit: result.limit,
        remaining: result.remaining,
        resetAt: result.resetTime.toISOString(),
      },
    },
    {
      status: 200,
      headers,
    }
  );
}
