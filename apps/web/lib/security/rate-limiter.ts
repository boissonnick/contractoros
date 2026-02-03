/**
 * Rate Limiting Middleware and Utilities
 *
 * Provides in-memory rate limiting for API routes to prevent abuse
 * and brute force attacks. Supports configurable time windows,
 * request limits, and custom key generation.
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Configuration for rate limiting
 */
export interface RateLimitConfig {
  /** Time window in milliseconds */
  windowMs: number;
  /** Maximum requests allowed per window */
  maxRequests: number;
  /** Custom function to generate rate limit key from request */
  keyGenerator?: (req: NextRequest) => string;
  /** Skip counting failed requests (4xx/5xx responses) */
  skipFailedRequests?: boolean;
  /** Skip counting successful requests (2xx responses) */
  skipSuccessfulRequests?: boolean;
  /** Custom message when rate limit is exceeded */
  message?: string;
  /** Whether to include rate limit headers in response */
  headers?: boolean;
}

/**
 * Result of a rate limit check
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  success: boolean;
  /** Total limit for the window */
  limit: number;
  /** Remaining requests in current window */
  remaining: number;
  /** When the rate limit window resets */
  resetTime: Date;
  /** Current count of requests */
  current: number;
}

/**
 * Internal tracking data for a rate limit key
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/**
 * Preset rate limit configurations for common use cases
 */
export const RATE_LIMITS = {
  /** Authentication endpoints: 5 requests per 15 minutes */
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 5 },
  /** General API endpoints: 100 requests per minute */
  api: { windowMs: 60 * 1000, maxRequests: 100 },
  /** File upload endpoints: 10 requests per minute */
  upload: { windowMs: 60 * 1000, maxRequests: 10 },
  /** Export endpoints: 5 requests per hour */
  export: { windowMs: 60 * 60 * 1000, maxRequests: 5 },
  /** SMS endpoints: 20 requests per minute */
  sms: { windowMs: 60 * 1000, maxRequests: 20 },
  /** AI/Assistant endpoints: 30 requests per minute */
  assistant: { windowMs: 60 * 1000, maxRequests: 30 },
  /** Public endpoints: 60 requests per minute */
  public: { windowMs: 60 * 1000, maxRequests: 60 },
  /** Password reset: 3 requests per hour */
  passwordReset: { windowMs: 60 * 60 * 1000, maxRequests: 3 },
  /** Magic link requests: 5 requests per 15 minutes */
  magicLink: { windowMs: 15 * 60 * 1000, maxRequests: 5 },
} as const;

/**
 * In-memory rate limiter for API routes
 * Note: This is suitable for single-server deployments.
 * For distributed systems, use the Firestore-backed rate limiter.
 */
export class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private config: Required<RateLimitConfig>;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config: RateLimitConfig) {
    this.config = {
      windowMs: config.windowMs,
      maxRequests: config.maxRequests,
      keyGenerator: config.keyGenerator || defaultKeyGenerator,
      skipFailedRequests: config.skipFailedRequests ?? false,
      skipSuccessfulRequests: config.skipSuccessfulRequests ?? false,
      message: config.message ?? 'Too many requests, please try again later.',
      headers: config.headers ?? true,
    };

    // Clean up expired entries periodically
    this.startCleanup();
  }

  /**
   * Check if a request is allowed under the rate limit
   * @param key - The rate limit key (e.g., IP address, user ID)
   * @returns Rate limit check result
   */
  check(key: string): RateLimitResult {
    const now = Date.now();
    const entry = this.store.get(key);

    // If no entry or expired, create new window
    if (!entry || now >= entry.resetTime) {
      const resetTime = now + this.config.windowMs;
      this.store.set(key, { count: 1, resetTime });
      return {
        success: true,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests - 1,
        resetTime: new Date(resetTime),
        current: 1,
      };
    }

    // Increment count
    entry.count++;
    const remaining = Math.max(0, this.config.maxRequests - entry.count);
    const success = entry.count <= this.config.maxRequests;

    return {
      success,
      limit: this.config.maxRequests,
      remaining,
      resetTime: new Date(entry.resetTime),
      current: entry.count,
    };
  }

  /**
   * Decrement the count for a key (for skipFailedRequests/skipSuccessfulRequests)
   * @param key - The rate limit key
   */
  decrement(key: string): void {
    const entry = this.store.get(key);
    if (entry && entry.count > 0) {
      entry.count--;
    }
  }

  /**
   * Reset the rate limit for a specific key
   * @param key - The rate limit key to reset
   */
  reset(key: string): void {
    this.store.delete(key);
  }

  /**
   * Get current status for a key without incrementing
   * @param key - The rate limit key
   * @returns Current rate limit status
   */
  getStatus(key: string): RateLimitResult {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now >= entry.resetTime) {
      return {
        success: true,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests,
        resetTime: new Date(now + this.config.windowMs),
        current: 0,
      };
    }

    const remaining = Math.max(0, this.config.maxRequests - entry.count);
    return {
      success: entry.count < this.config.maxRequests,
      limit: this.config.maxRequests,
      remaining,
      resetTime: new Date(entry.resetTime),
      current: entry.count,
    };
  }

  /**
   * Get the configuration
   */
  getConfig(): Readonly<Required<RateLimitConfig>> {
    return this.config;
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanup(): void {
    // Clean up every minute
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const keysToDelete: string[] = [];
      this.store.forEach((entry, key) => {
        if (now >= entry.resetTime) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach((key) => this.store.delete(key));
    }, 60 * 1000);

    // Prevent interval from keeping process alive
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Stop the cleanup interval (for testing)
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Clear all entries (for testing)
   */
  clear(): void {
    this.store.clear();
  }
}

/**
 * Default key generator using IP address
 * Falls back to 'unknown' if IP cannot be determined
 */
function defaultKeyGenerator(req: NextRequest): string {
  return getClientIdentifier(req);
}

/**
 * Extract client identifier from request
 * Uses various headers to determine the real client IP
 * @param req - The incoming request
 * @returns Client identifier string
 */
export function getClientIdentifier(req: NextRequest): string {
  // Try common headers for real IP (in order of preference)
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, use the first one (original client)
    const firstIp = forwardedFor.split(',')[0].trim();
    if (firstIp) return firstIp;
  }

  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp;

  // Cloud Run specific header
  const cloudRunClientIp = req.headers.get('x-cloud-trace-context');
  if (cloudRunClientIp) {
    // Use the trace context as a fallback identifier
    return `trace:${cloudRunClientIp.split('/')[0]}`;
  }

  // Firebase hosting header
  const firebaseClientIp = req.headers.get('fastly-client-ip');
  if (firebaseClientIp) return firebaseClientIp;

  // Try to use the request URL host as last resort
  try {
    const url = new URL(req.url);
    if (url.hostname) return `host:${url.hostname}`;
  } catch {
    // Ignore URL parsing errors
  }

  return 'unknown';
}

/**
 * Create a rate limit key combining IP and user ID (if available)
 * @param req - The incoming request
 * @param userId - Optional user ID
 * @returns Combined rate limit key
 */
export function createRateLimitKey(
  req: NextRequest,
  userId?: string | null
): string {
  const ip = getClientIdentifier(req);
  return userId ? `${ip}:user:${userId}` : ip;
}

/**
 * Rate limit headers to include in response
 */
export type RateLimitHeaders = Record<string, string>;

/**
 * Generate rate limit headers for response
 * @param result - Rate limit check result
 * @returns Headers object
 */
export function getRateLimitHeaders(result: RateLimitResult): RateLimitHeaders {
  const headers: RateLimitHeaders = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime.getTime() / 1000).toString(),
  };

  if (!result.success) {
    const retryAfter = Math.ceil(
      (result.resetTime.getTime() - Date.now()) / 1000
    );
    headers['Retry-After'] = Math.max(1, retryAfter).toString();
  }

  return headers;
}

/**
 * Convert rate limit headers to a plain object for NextResponse
 * @param headers - Rate limit headers
 * @returns Headers as plain record
 */
export function headersToRecord(headers: RateLimitHeaders): Record<string, string> {
  return { ...headers };
}

/**
 * Higher-order function to wrap an API route handler with rate limiting
 * @param handler - The original route handler
 * @param config - Rate limit configuration
 * @returns Wrapped handler with rate limiting
 */
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config: RateLimitConfig
): (req: NextRequest) => Promise<NextResponse> {
  const limiter = new RateLimiter(config);
  const keyGenerator = config.keyGenerator || defaultKeyGenerator;
  const message = config.message ?? 'Too many requests, please try again later.';

  return async (req: NextRequest): Promise<NextResponse> => {
    const key = keyGenerator(req);
    const result = limiter.check(key);

    // Build headers if enabled
    const headers = config.headers !== false ? getRateLimitHeaders(result) : {};

    // If rate limit exceeded, return 429
    if (!result.success) {
      return NextResponse.json(
        {
          error: message,
          retryAfter: Math.ceil(
            (result.resetTime.getTime() - Date.now()) / 1000
          ),
        },
        {
          status: 429,
          headers,
        }
      );
    }

    // Execute the handler
    try {
      const response = await handler(req);

      // Skip counting based on config
      const status = response.status;
      if (config.skipFailedRequests && status >= 400) {
        limiter.decrement(key);
      }
      if (config.skipSuccessfulRequests && status >= 200 && status < 300) {
        limiter.decrement(key);
      }

      // Add rate limit headers to successful response
      if (config.headers !== false) {
        const newHeaders = new Headers(response.headers);
        Object.entries(headers).forEach(([k, v]) => {
          if (v) newHeaders.set(k, v);
        });
        return new NextResponse(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders,
        });
      }

      return response;
    } catch (error) {
      // On error, optionally don't count the request
      if (config.skipFailedRequests) {
        limiter.decrement(key);
      }
      throw error;
    }
  };
}

/**
 * Create a rate limiter middleware for use in middleware.ts
 * Returns a function that can be used to check rate limits
 */
export function createRateLimitMiddleware(config: RateLimitConfig) {
  const limiter = new RateLimiter(config);

  return {
    /**
     * Check if request is allowed
     * @param req - The request to check
     * @returns Rate limit result and headers
     */
    check: (req: NextRequest) => {
      const keyGenerator = config.keyGenerator || defaultKeyGenerator;
      const key = keyGenerator(req);
      const result = limiter.check(key);
      const headers = getRateLimitHeaders(result);
      return { result, headers, key };
    },

    /**
     * Create a 429 response
     */
    createRateLimitResponse: (result: RateLimitResult) => {
      const message =
        config.message ?? 'Too many requests, please try again later.';
      return NextResponse.json(
        {
          error: message,
          retryAfter: Math.ceil(
            (result.resetTime.getTime() - Date.now()) / 1000
          ),
        },
        {
          status: 429,
          headers: getRateLimitHeaders(result),
        }
      );
    },

    /**
     * Get the underlying limiter instance
     */
    getLimiter: () => limiter,
  };
}

/**
 * Global rate limiter instances for reuse across routes
 * This ensures rate limit state is shared across requests
 */
const globalLimiters: Map<string, RateLimiter> = new Map();

/**
 * Get or create a shared rate limiter instance
 * @param name - Unique name for this limiter
 * @param config - Configuration (only used on first call)
 * @returns Shared rate limiter instance
 */
export function getSharedRateLimiter(
  name: keyof typeof RATE_LIMITS | string,
  config?: RateLimitConfig
): RateLimiter {
  if (globalLimiters.has(name)) {
    return globalLimiters.get(name)!;
  }

  // Use preset config if available
  const presetConfig =
    name in RATE_LIMITS
      ? RATE_LIMITS[name as keyof typeof RATE_LIMITS]
      : undefined;

  const finalConfig = config || presetConfig;
  if (!finalConfig) {
    throw new Error(
      `No configuration provided for rate limiter "${name}" and no preset found`
    );
  }

  const limiter = new RateLimiter(finalConfig);
  globalLimiters.set(name, limiter);
  return limiter;
}

/**
 * Clear all global rate limiter instances (for testing)
 */
export function clearAllRateLimiters(): void {
  globalLimiters.forEach((limiter) => {
    limiter.stopCleanup();
    limiter.clear();
  });
  globalLimiters.clear();
}
