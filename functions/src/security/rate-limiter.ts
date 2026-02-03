/**
 * Firestore-backed Rate Limiter for Cloud Functions
 *
 * Provides distributed rate limiting using Firestore for state storage.
 * Suitable for multi-instance deployments where rate limit state
 * must be shared across all function instances.
 */

import * as admin from "firebase-admin";
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";

/**
 * Configuration for rate limiting
 */
export interface RateLimitConfig {
  /** Time window in milliseconds */
  windowMs: number;
  /** Maximum requests allowed per window */
  maxRequests: number;
  /** Collection name for storing rate limit data */
  collectionName?: string;
  /** Prefix for document IDs */
  keyPrefix?: string;
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
  /** Email endpoints: 50 requests per minute */
  email: { windowMs: 60 * 1000, maxRequests: 50 },
  /** Webhook endpoints: 1000 requests per minute */
  webhook: { windowMs: 60 * 1000, maxRequests: 1000 },
  /** Scheduled functions: 10 requests per minute (prevent runaway) */
  scheduled: { windowMs: 60 * 1000, maxRequests: 10 },
} as const;

/**
 * Firestore-backed rate limiter for Cloud Functions
 * Stores rate limit state in Firestore for distributed rate limiting
 */
export class FirestoreRateLimiter {
  private db: FirebaseFirestore.Firestore;
  private config: Required<RateLimitConfig>;

  constructor(config: RateLimitConfig, app?: admin.app.App) {
    // Use named database 'contractoros'
    this.db = app
      ? getFirestore(app, "contractoros")
      : getFirestore(admin.app(), "contractoros");

    this.config = {
      windowMs: config.windowMs,
      maxRequests: config.maxRequests,
      collectionName: config.collectionName ?? "_rateLimits",
      keyPrefix: config.keyPrefix ?? "rl",
    };
  }

  /**
   * Generate document ID for a rate limit key
   */
  private getDocId(key: string): string {
    // Sanitize key for Firestore document ID
    const sanitized = key.replace(/[/\\#$[\]]/g, "_");
    return `${this.config.keyPrefix}:${sanitized}`;
  }

  /**
   * Check if a request is allowed under the rate limit
   * Uses Firestore transaction for atomic updates
   * @param key - The rate limit key (e.g., IP address, user ID)
   * @returns Rate limit check result
   */
  async check(key: string): Promise<RateLimitResult> {
    const docId = this.getDocId(key);
    const docRef = this.db.collection(this.config.collectionName).doc(docId);

    try {
      const result = await this.db.runTransaction(async (transaction) => {
        const doc = await transaction.get(docRef);
        const now = Date.now();

        if (!doc.exists) {
          // First request, create new window
          const resetTime = now + this.config.windowMs;
          const expireAt = Timestamp.fromMillis(resetTime + 60000); // Extra minute for cleanup

          transaction.set(docRef, {
            count: 1,
            resetTime,
            expireAt,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });

          return {
            success: true,
            limit: this.config.maxRequests,
            remaining: this.config.maxRequests - 1,
            resetTime: new Date(resetTime),
            current: 1,
          };
        }

        const data = doc.data()!;
        const resetTime = data.resetTime as number;

        // Window expired, start new window
        if (now >= resetTime) {
          const newResetTime = now + this.config.windowMs;
          const expireAt = Timestamp.fromMillis(newResetTime + 60000);

          transaction.set(docRef, {
            count: 1,
            resetTime: newResetTime,
            expireAt,
            createdAt: data.createdAt || Timestamp.now(),
            updatedAt: Timestamp.now(),
          });

          return {
            success: true,
            limit: this.config.maxRequests,
            remaining: this.config.maxRequests - 1,
            resetTime: new Date(newResetTime),
            current: 1,
          };
        }

        // Within window, increment count
        const newCount = (data.count as number) + 1;
        const remaining = Math.max(0, this.config.maxRequests - newCount);
        const success = newCount <= this.config.maxRequests;

        transaction.update(docRef, {
          count: FieldValue.increment(1),
          updatedAt: Timestamp.now(),
        });

        return {
          success,
          limit: this.config.maxRequests,
          remaining,
          resetTime: new Date(resetTime),
          current: newCount,
        };
      });

      return result;
    } catch (error) {
      console.error("[FirestoreRateLimiter] Transaction error:", error);
      // On error, allow the request (fail open)
      // This prevents rate limiting from breaking functionality on Firestore issues
      return {
        success: true,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests,
        resetTime: new Date(Date.now() + this.config.windowMs),
        current: 0,
      };
    }
  }

  /**
   * Reset the rate limit for a specific key
   * @param key - The rate limit key to reset
   */
  async reset(key: string): Promise<void> {
    const docId = this.getDocId(key);
    const docRef = this.db.collection(this.config.collectionName).doc(docId);

    try {
      await docRef.delete();
    } catch (error) {
      console.error("[FirestoreRateLimiter] Reset error:", error);
    }
  }

  /**
   * Get current status for a key without incrementing
   * @param key - The rate limit key
   * @returns Current rate limit status
   */
  async getStatus(key: string): Promise<RateLimitResult> {
    const docId = this.getDocId(key);
    const docRef = this.db.collection(this.config.collectionName).doc(docId);

    try {
      const doc = await docRef.get();
      const now = Date.now();

      if (!doc.exists) {
        return {
          success: true,
          limit: this.config.maxRequests,
          remaining: this.config.maxRequests,
          resetTime: new Date(now + this.config.windowMs),
          current: 0,
        };
      }

      const data = doc.data()!;
      const resetTime = data.resetTime as number;

      // Window expired
      if (now >= resetTime) {
        return {
          success: true,
          limit: this.config.maxRequests,
          remaining: this.config.maxRequests,
          resetTime: new Date(now + this.config.windowMs),
          current: 0,
        };
      }

      const count = data.count as number;
      const remaining = Math.max(0, this.config.maxRequests - count);

      return {
        success: count < this.config.maxRequests,
        limit: this.config.maxRequests,
        remaining,
        resetTime: new Date(resetTime),
        current: count,
      };
    } catch (error) {
      console.error("[FirestoreRateLimiter] Get status error:", error);
      return {
        success: true,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests,
        resetTime: new Date(Date.now() + this.config.windowMs),
        current: 0,
      };
    }
  }

  /**
   * Clean up expired rate limit documents
   * Should be run periodically via a scheduled function
   */
  async cleanup(): Promise<number> {
    const now = Timestamp.now();
    let deletedCount = 0;

    try {
      const expiredDocs = await this.db
        .collection(this.config.collectionName)
        .where("expireAt", "<", now)
        .limit(500) // Process in batches
        .get();

      if (expiredDocs.empty) {
        return 0;
      }

      const batch = this.db.batch();
      expiredDocs.docs.forEach((doc) => {
        batch.delete(doc.ref);
        deletedCount++;
      });

      await batch.commit();
      console.log(
        `[FirestoreRateLimiter] Cleaned up ${deletedCount} expired entries`
      );
    } catch (error) {
      console.error("[FirestoreRateLimiter] Cleanup error:", error);
    }

    return deletedCount;
  }
}

/**
 * Extract client identifier from Cloud Function request
 * @param request - The incoming request object
 * @returns Client identifier string
 */
export function getClientIdentifier(
  request: { ip?: string; headers?: Record<string, string | string[] | undefined> }
): string {
  // Direct IP if available
  if (request.ip) {
    return request.ip;
  }

  const headers = request.headers || {};

  // Try common headers for real IP
  const forwardedFor = headers["x-forwarded-for"];
  if (forwardedFor) {
    const value = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    const firstIp = value.split(",")[0].trim();
    if (firstIp) return firstIp;
  }

  const realIp = headers["x-real-ip"];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  // Cloud Run specific
  const traceContext = headers["x-cloud-trace-context"];
  if (traceContext) {
    const value = Array.isArray(traceContext) ? traceContext[0] : traceContext;
    return `trace:${value.split("/")[0]}`;
  }

  return "unknown";
}

/**
 * Create a rate limit key combining IP and identifier
 */
export function createRateLimitKey(
  request: { ip?: string; headers?: Record<string, string | string[] | undefined> },
  identifier?: string | null
): string {
  const ip = getClientIdentifier(request);
  return identifier ? `${ip}:${identifier}` : ip;
}

/**
 * HTTP response helper for rate limit exceeded
 */
export function createRateLimitResponse(
  result: RateLimitResult,
  message = "Too many requests, please try again later."
): {
  status: number;
  body: object;
  headers: Record<string, string>;
} {
  const retryAfter = Math.ceil(
    (result.resetTime.getTime() - Date.now()) / 1000
  );

  return {
    status: 429,
    body: {
      error: message,
      retryAfter: Math.max(1, retryAfter),
    },
    headers: {
      "X-RateLimit-Limit": result.limit.toString(),
      "X-RateLimit-Remaining": result.remaining.toString(),
      "X-RateLimit-Reset": Math.ceil(
        result.resetTime.getTime() / 1000
      ).toString(),
      "Retry-After": Math.max(1, retryAfter).toString(),
    },
  };
}

/**
 * Rate limit headers for successful responses
 */
export function getRateLimitHeaders(
  result: RateLimitResult
): Record<string, string> {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": Math.ceil(
      result.resetTime.getTime() / 1000
    ).toString(),
  };
}

/**
 * Global rate limiter instances for reuse
 */
const globalLimiters: Map<string, FirestoreRateLimiter> = new Map();

/**
 * Get or create a shared rate limiter instance
 * @param name - Unique name for this limiter
 * @param config - Configuration (only used on first call)
 * @returns Shared rate limiter instance
 */
export function getSharedRateLimiter(
  name: keyof typeof RATE_LIMITS | string,
  config?: RateLimitConfig,
  app?: admin.app.App
): FirestoreRateLimiter {
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

  const limiter = new FirestoreRateLimiter(finalConfig, app);
  globalLimiters.set(name, limiter);
  return limiter;
}

/**
 * Firebase HTTP request interface
 */
interface FirebaseRequest {
  ip?: string;
  headers?: Record<string, string | string[] | undefined>;
}

/**
 * Firebase HTTP response interface
 */
interface FirebaseResponse {
  status(code: number): FirebaseResponse;
  json(body: object): FirebaseResponse;
  set(headers: Record<string, string>): FirebaseResponse;
}

/**
 * Higher-order function to wrap a Cloud Function with rate limiting
 */
export function withRateLimit(
  handler: (
    request: FirebaseRequest,
    response: FirebaseResponse
  ) => Promise<void>,
  config: RateLimitConfig
): (request: FirebaseRequest, response: FirebaseResponse) => Promise<void> {
  const limiter = new FirestoreRateLimiter(config);

  return async (
    request: FirebaseRequest,
    response: FirebaseResponse
  ): Promise<void> => {
    const key = getClientIdentifier(request);
    const result = await limiter.check(key);

    // Add rate limit headers
    response.set(getRateLimitHeaders(result));

    if (!result.success) {
      const rateLimitResponse = createRateLimitResponse(result);
      response.set(rateLimitResponse.headers);
      response.status(429).json(rateLimitResponse.body);
      return;
    }

    await handler(request, response);
  };
}
