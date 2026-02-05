/**
 * Rate Limiter Tests
 *
 * Tests for the AI Assistant rate limiting logic to prevent abuse
 * and ensure fair usage across organizations.
 */

import {
  checkRateLimit,
  recordUsage,
  getUsageStats,
  clearRateLimitCache,
  cleanupStaleCache,
  getRateLimitHeaders,
  RateLimitCheck,
} from '@/lib/assistant/security/rate-limiter';
import { RATE_LIMITS } from '@/lib/assistant/models/types';

// Mock firebase/firestore
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  doc: jest.fn((db, path) => ({ path })),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  increment: jest.fn((value) => ({ _increment: value })),
  Timestamp: {
    now: jest.fn(() => ({
      toDate: () => new Date(),
      seconds: Math.floor(Date.now() / 1000),
      nanoseconds: 0,
    })),
  },
}));

// Import mocked modules
import { getDoc, setDoc, doc, Timestamp, increment } from 'firebase/firestore';

const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;
const mockSetDoc = setDoc as jest.MockedFunction<typeof setDoc>;
const mockDoc = doc as jest.MockedFunction<typeof doc>;
const _mockIncrement = increment as jest.MockedFunction<typeof increment>;

describe('Rate Limiter', () => {
  const mockDb = {} as ReturnType<typeof import('firebase/firestore').getFirestore>;
  const testOrgId = 'test-org-123';

  beforeEach(() => {
    jest.clearAllMocks();
    clearRateLimitCache();
    // Reset system time
    jest.useRealTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe('checkRateLimit', () => {
    it('should return allowed: true when under all limits', async () => {
      // Mock Firestore response with low usage
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          requests: 10,
          inputTokens: 1000,
          outputTokens: 500,
          estimatedCost: 0.01,
          lastRequestAt: Timestamp.now(),
          modelBreakdown: {},
        }),
      } as any);

      const result = await checkRateLimit(mockDb, testOrgId, 'free');

      expect(result.allowed).toBe(true);
      expect(result.remaining.requests).toBe(RATE_LIMITS.free.requestsPerDay - 10);
      expect(result.remaining.tokens).toBe(RATE_LIMITS.free.tokensPerDay - 1500);
      expect(result.reason).toBeUndefined();
      expect(result.retryAfter).toBeUndefined();
    });

    it('should return allowed: false when requests exceed daily limit', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          requests: RATE_LIMITS.free.requestsPerDay, // At limit
          inputTokens: 1000,
          outputTokens: 500,
          estimatedCost: 0,
          lastRequestAt: Timestamp.now(),
          modelBreakdown: {},
        }),
      } as any);

      const result = await checkRateLimit(mockDb, testOrgId, 'free');

      expect(result.allowed).toBe(false);
      expect(result.remaining.requests).toBe(0);
      expect(result.reason).toBe('Daily request limit reached');
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should return allowed: false when tokens exceed daily limit', async () => {
      const tokenLimit = RATE_LIMITS.free.tokensPerDay;
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          requests: 10,
          inputTokens: tokenLimit, // At token limit
          outputTokens: 0,
          estimatedCost: 0,
          lastRequestAt: Timestamp.now(),
          modelBreakdown: {},
        }),
      } as any);

      const result = await checkRateLimit(mockDb, testOrgId, 'free');

      expect(result.allowed).toBe(false);
      expect(result.remaining.tokens).toBe(0);
      expect(result.reason).toBe('Daily token limit reached');
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should return allowed: false when cost exceeds daily limit (pro tier)', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          requests: 10,
          inputTokens: 1000,
          outputTokens: 500,
          estimatedCost: RATE_LIMITS.pro.maxCostPerDay, // At cost limit
          lastRequestAt: Timestamp.now(),
          modelBreakdown: {},
        }),
      } as any);

      const result = await checkRateLimit(mockDb, testOrgId, 'pro');

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Daily cost limit reached');
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should return correct remaining counts', async () => {
      const usedRequests = 50;
      const usedInputTokens = 10000;
      const usedOutputTokens = 5000;

      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          requests: usedRequests,
          inputTokens: usedInputTokens,
          outputTokens: usedOutputTokens,
          estimatedCost: 0,
          lastRequestAt: Timestamp.now(),
          modelBreakdown: {},
        }),
      } as any);

      const result = await checkRateLimit(mockDb, testOrgId, 'free');

      expect(result.remaining.requests).toBe(RATE_LIMITS.free.requestsPerDay - usedRequests);
      expect(result.remaining.tokens).toBe(
        RATE_LIMITS.free.tokensPerDay - (usedInputTokens + usedOutputTokens)
      );
    });

    it('should return correct resetAt date (next midnight UTC)', async () => {
      // Set a specific time for testing
      jest.useFakeTimers();
      const testDate = new Date('2024-01-15T12:00:00Z');
      jest.setSystemTime(testDate);

      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          requests: 10,
          inputTokens: 1000,
          outputTokens: 500,
          estimatedCost: 0,
          lastRequestAt: Timestamp.now(),
          modelBreakdown: {},
        }),
      } as any);

      const result = await checkRateLimit(mockDb, testOrgId, 'free');

      // Should be midnight of the next day
      const expectedReset = new Date('2024-01-16T00:00:00.000Z');
      expect(result.resetAt.getTime()).toBe(expectedReset.getTime());
    });

    it('should return retryAfter in seconds when blocked', async () => {
      jest.useFakeTimers();
      // Set time to 11 PM (1 hour before midnight)
      const testDate = new Date('2024-01-15T23:00:00Z');
      jest.setSystemTime(testDate);

      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          requests: RATE_LIMITS.free.requestsPerDay,
          inputTokens: 0,
          outputTokens: 0,
          estimatedCost: 0,
          lastRequestAt: Timestamp.now(),
          modelBreakdown: {},
        }),
      } as any);

      const result = await checkRateLimit(mockDb, testOrgId, 'free');

      expect(result.allowed).toBe(false);
      // Should be approximately 1 hour (3600 seconds)
      expect(result.retryAfter).toBeGreaterThanOrEqual(3599);
      expect(result.retryAfter).toBeLessThanOrEqual(3601);
    });

    it('should use cached data within TTL', async () => {
      // First call - should hit Firestore
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          requests: 10,
          inputTokens: 1000,
          outputTokens: 500,
          estimatedCost: 0,
          lastRequestAt: Timestamp.now(),
          modelBreakdown: {},
        }),
      } as any);

      await checkRateLimit(mockDb, testOrgId, 'free');
      expect(mockGetDoc).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      await checkRateLimit(mockDb, testOrgId, 'free');
      expect(mockGetDoc).toHaveBeenCalledTimes(1); // Still 1 - cache was used
    });

    it('should create default usage record when document does not exist', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false,
        data: () => null,
      } as any);

      const result = await checkRateLimit(mockDb, testOrgId, 'free');

      expect(result.allowed).toBe(true);
      expect(result.remaining.requests).toBe(RATE_LIMITS.free.requestsPerDay);
      expect(result.remaining.tokens).toBe(RATE_LIMITS.free.tokensPerDay);
    });

    it('should allow request on Firestore error (fail-open)', async () => {
      mockGetDoc.mockRejectedValueOnce(new Error('Firestore unavailable'));

      const result = await checkRateLimit(mockDb, testOrgId, 'free');

      expect(result.allowed).toBe(true);
      expect(result.remaining.requests).toBe(RATE_LIMITS.free.requestsPerDay);
    });

    it('should respect different tier limits', async () => {
      // Test with enterprise tier which has higher limits
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          requests: 500, // More than free limit, less than enterprise limit
          inputTokens: 200000, // More than free limit, less than enterprise limit
          outputTokens: 0,
          estimatedCost: 5, // Over pro cost limit, but under enterprise
          lastRequestAt: Timestamp.now(),
          modelBreakdown: {},
        }),
      } as any);

      const result = await checkRateLimit(mockDb, testOrgId, 'enterprise');

      expect(result.allowed).toBe(true);
      expect(result.remaining.requests).toBe(RATE_LIMITS.enterprise.requestsPerDay - 500);
    });
  });

  describe('recordUsage', () => {
    it('should record usage to Firestore with correct increments', async () => {
      mockSetDoc.mockResolvedValueOnce(undefined);

      await recordUsage(mockDb, testOrgId, {
        inputTokens: 100,
        outputTokens: 50,
        estimatedCost: 0.001,
        modelKey: 'gemini-2.0-flash',
      });

      expect(mockSetDoc).toHaveBeenCalledTimes(1);
      const [, updateData, options] = mockSetDoc.mock.calls[0];

      expect(updateData.requests).toEqual({ _increment: 1 });
      expect(updateData.inputTokens).toEqual({ _increment: 100 });
      expect(updateData.outputTokens).toEqual({ _increment: 50 });
      expect(updateData.estimatedCost).toEqual({ _increment: 0.001 });
      expect(options).toEqual({ merge: true });
    });

    it('should record model breakdown', async () => {
      mockSetDoc.mockResolvedValueOnce(undefined);

      await recordUsage(mockDb, testOrgId, {
        inputTokens: 100,
        outputTokens: 50,
        estimatedCost: 0.001,
        modelKey: 'gemini-2.0-flash',
      });

      const [, updateData] = mockSetDoc.mock.calls[0];
      expect(updateData['modelBreakdown.gemini-2.0-flash.requests']).toEqual({ _increment: 1 });
      expect(updateData['modelBreakdown.gemini-2.0-flash.tokens']).toEqual({ _increment: 150 });
      expect(updateData['modelBreakdown.gemini-2.0-flash.cost']).toEqual({ _increment: 0.001 });
    });

    it('should invalidate cache after recording usage', async () => {
      // Pre-populate cache by making a check
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          requests: 10,
          inputTokens: 1000,
          outputTokens: 500,
          estimatedCost: 0,
          lastRequestAt: Timestamp.now(),
          modelBreakdown: {},
        }),
      } as any);

      await checkRateLimit(mockDb, testOrgId, 'free');
      expect(mockGetDoc).toHaveBeenCalledTimes(1);

      // Record usage (should invalidate cache)
      mockSetDoc.mockResolvedValueOnce(undefined);
      await recordUsage(mockDb, testOrgId, {
        inputTokens: 100,
        outputTokens: 50,
        estimatedCost: 0.001,
        modelKey: 'gemini-2.0-flash',
      });

      // Next check should hit Firestore again (cache was invalidated)
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          requests: 11, // Updated
          inputTokens: 1100,
          outputTokens: 550,
          estimatedCost: 0.001,
          lastRequestAt: Timestamp.now(),
          modelBreakdown: {},
        }),
      } as any);

      await checkRateLimit(mockDb, testOrgId, 'free');
      expect(mockGetDoc).toHaveBeenCalledTimes(2);
    });

    it('should not throw on Firestore error', async () => {
      mockSetDoc.mockRejectedValueOnce(new Error('Firestore unavailable'));

      // Should not throw
      await expect(
        recordUsage(mockDb, testOrgId, {
          inputTokens: 100,
          outputTokens: 50,
          estimatedCost: 0.001,
          modelKey: 'gemini-2.0-flash',
        })
      ).resolves.not.toThrow();
    });
  });

  describe('getUsageStats', () => {
    it('should return usage stats for the specified days', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));

      // Mock 7 days of data
      for (let i = 0; i < 7; i++) {
        mockGetDoc.mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            requests: 10 + i,
            inputTokens: 1000 + i * 100,
            outputTokens: 500 + i * 50,
            estimatedCost: 0.01 * (i + 1),
            lastRequestAt: Timestamp.now(),
            modelBreakdown: {},
          }),
        } as any);
      }

      const stats = await getUsageStats(mockDb, testOrgId, 7);

      expect(stats).toHaveLength(7);
      // Stats should be in chronological order (oldest first)
      expect(stats[0].date).toBe('2024-01-09');
      expect(stats[6].date).toBe('2024-01-15');
    });

    it('should return zero values for days with no usage', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));

      // First day has data
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          requests: 10,
          inputTokens: 1000,
          outputTokens: 500,
          estimatedCost: 0.01,
          lastRequestAt: Timestamp.now(),
          modelBreakdown: {},
        }),
      } as any);

      // Second day has no data
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false,
        data: () => null,
      } as any);

      const stats = await getUsageStats(mockDb, testOrgId, 2);

      expect(stats).toHaveLength(2);
      // First entry (chronologically) - no data
      expect(stats[0].requests).toBe(0);
      expect(stats[0].tokens).toBe(0);
      expect(stats[0].cost).toBe(0);
      // Second entry - has data
      expect(stats[1].requests).toBe(10);
    });

    it('should default to 7 days when daysBack not specified', async () => {
      for (let i = 0; i < 7; i++) {
        mockGetDoc.mockResolvedValueOnce({
          exists: () => false,
          data: () => null,
        } as any);
      }

      const stats = await getUsageStats(mockDb, testOrgId);

      expect(stats).toHaveLength(7);
      expect(mockGetDoc).toHaveBeenCalledTimes(7);
    });
  });

  describe('clearRateLimitCache', () => {
    it('should clear the cache', async () => {
      // Populate cache
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          requests: 10,
          inputTokens: 1000,
          outputTokens: 500,
          estimatedCost: 0,
          lastRequestAt: Timestamp.now(),
          modelBreakdown: {},
        }),
      } as any);

      await checkRateLimit(mockDb, testOrgId, 'free');
      expect(mockGetDoc).toHaveBeenCalledTimes(1);

      // Clear cache
      clearRateLimitCache();

      // Next call should hit Firestore
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          requests: 10,
          inputTokens: 1000,
          outputTokens: 500,
          estimatedCost: 0,
          lastRequestAt: Timestamp.now(),
          modelBreakdown: {},
        }),
      } as any);

      await checkRateLimit(mockDb, testOrgId, 'free');
      expect(mockGetDoc).toHaveBeenCalledTimes(2);
    });
  });

  describe('cleanupStaleCache', () => {
    it('should remove entries older than maxAge', async () => {
      jest.useFakeTimers();
      const startTime = new Date('2024-01-15T12:00:00Z');
      jest.setSystemTime(startTime);

      // Populate cache with first org
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          requests: 10,
          inputTokens: 1000,
          outputTokens: 500,
          estimatedCost: 0,
          lastRequestAt: Timestamp.now(),
          modelBreakdown: {},
        }),
      } as any);

      await checkRateLimit(mockDb, 'org-1', 'free');
      expect(mockGetDoc).toHaveBeenCalledTimes(1);

      // Advance time past max age (1 hour)
      jest.setSystemTime(new Date('2024-01-15T14:00:00Z'));

      // Add new cache entry
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          requests: 5,
          inputTokens: 500,
          outputTokens: 250,
          estimatedCost: 0,
          lastRequestAt: Timestamp.now(),
          modelBreakdown: {},
        }),
      } as any);

      await checkRateLimit(mockDb, 'org-2', 'free');
      expect(mockGetDoc).toHaveBeenCalledTimes(2);

      // Cleanup with 1 hour max age
      const cleaned = cleanupStaleCache(60 * 60 * 1000);

      // Should have cleaned 1 entry (org-1)
      expect(cleaned).toBe(1);

      // org-2 should still be cached
      await checkRateLimit(mockDb, 'org-2', 'free');
      expect(mockGetDoc).toHaveBeenCalledTimes(2); // No new call

      // org-1 should need to fetch again
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          requests: 10,
          inputTokens: 1000,
          outputTokens: 500,
          estimatedCost: 0,
          lastRequestAt: Timestamp.now(),
          modelBreakdown: {},
        }),
      } as any);

      await checkRateLimit(mockDb, 'org-1', 'free');
      expect(mockGetDoc).toHaveBeenCalledTimes(3); // New call needed
    });
  });

  describe('getRateLimitHeaders', () => {
    it('should return correct header object when not blocked', () => {
      const check: RateLimitCheck = {
        allowed: true,
        remaining: {
          requests: 100,
          tokens: 50000,
        },
        resetAt: new Date('2024-01-16T00:00:00.000Z'),
      };

      const headers = getRateLimitHeaders(check);

      expect(headers['X-RateLimit-Remaining-Requests']).toBe('100');
      expect(headers['X-RateLimit-Remaining-Tokens']).toBe('50000');
      expect(headers['X-RateLimit-Reset']).toBe('2024-01-16T00:00:00.000Z');
      expect(headers['Retry-After']).toBeUndefined();
    });

    it('should include Retry-After header when blocked', () => {
      const check: RateLimitCheck = {
        allowed: false,
        remaining: {
          requests: 0,
          tokens: 0,
        },
        resetAt: new Date('2024-01-16T00:00:00.000Z'),
        reason: 'Daily request limit reached',
        retryAfter: 3600,
      };

      const headers = getRateLimitHeaders(check);

      expect(headers['X-RateLimit-Remaining-Requests']).toBe('0');
      expect(headers['X-RateLimit-Remaining-Tokens']).toBe('0');
      expect(headers['X-RateLimit-Reset']).toBe('2024-01-16T00:00:00.000Z');
      expect(headers['Retry-After']).toBe('3600');
    });

    it('should not include Retry-After when retryAfter is 0', () => {
      const check: RateLimitCheck = {
        allowed: true,
        remaining: {
          requests: 50,
          tokens: 25000,
        },
        resetAt: new Date('2024-01-16T00:00:00.000Z'),
        retryAfter: 0,
      };

      const headers = getRateLimitHeaders(check);

      // retryAfter: 0 is falsy, so should not be included
      expect(headers['Retry-After']).toBeUndefined();
    });
  });

  describe('Helper function behavior (via checkRateLimit)', () => {
    it('should use YYYY-MM-DD format for date keys', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));

      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          requests: 10,
          inputTokens: 1000,
          outputTokens: 500,
          estimatedCost: 0,
          lastRequestAt: Timestamp.now(),
          modelBreakdown: {},
        }),
      } as any);

      await checkRateLimit(mockDb, testOrgId, 'free');

      // Check that doc was called with the correct path including date
      expect(mockDoc).toHaveBeenCalledWith(
        mockDb,
        `organizations/${testOrgId}/aiUsage/2024-01-15`
      );
    });

    it('should handle end of month date boundaries', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-31T23:59:59Z'));

      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          requests: 10,
          inputTokens: 1000,
          outputTokens: 500,
          estimatedCost: 0,
          lastRequestAt: Timestamp.now(),
          modelBreakdown: {},
        }),
      } as any);

      const result = await checkRateLimit(mockDb, testOrgId, 'free');

      // Reset should be February 1st
      expect(result.resetAt.toISOString()).toBe('2024-02-01T00:00:00.000Z');
    });

    it('should handle year boundary', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-12-31T23:00:00Z'));

      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          requests: 10,
          inputTokens: 1000,
          outputTokens: 500,
          estimatedCost: 0,
          lastRequestAt: Timestamp.now(),
          modelBreakdown: {},
        }),
      } as any);

      const result = await checkRateLimit(mockDb, testOrgId, 'free');

      // Reset should be January 1st of next year
      expect(result.resetAt.toISOString()).toBe('2025-01-01T00:00:00.000Z');
    });
  });

  describe('Edge cases', () => {
    it('should handle exactly at the limit (boundary condition)', async () => {
      // At exactly the limit (should be blocked)
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          requests: RATE_LIMITS.free.requestsPerDay,
          inputTokens: 0,
          outputTokens: 0,
          estimatedCost: 0,
          lastRequestAt: Timestamp.now(),
          modelBreakdown: {},
        }),
      } as any);

      const result = await checkRateLimit(mockDb, testOrgId, 'free');
      expect(result.allowed).toBe(false);
    });

    it('should handle one under the limit (boundary condition)', async () => {
      // One under the limit (should be allowed)
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          requests: RATE_LIMITS.free.requestsPerDay - 1,
          inputTokens: 0,
          outputTokens: 0,
          estimatedCost: 0,
          lastRequestAt: Timestamp.now(),
          modelBreakdown: {},
        }),
      } as any);

      const result = await checkRateLimit(mockDb, testOrgId, 'free');
      expect(result.allowed).toBe(true);
      expect(result.remaining.requests).toBe(1);
    });

    it('should handle very large token counts without overflow', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          requests: 10,
          inputTokens: Number.MAX_SAFE_INTEGER,
          outputTokens: 0,
          estimatedCost: 0,
          lastRequestAt: Timestamp.now(),
          modelBreakdown: {},
        }),
      } as any);

      const result = await checkRateLimit(mockDb, testOrgId, 'free');

      expect(result.allowed).toBe(false);
      expect(result.remaining.tokens).toBe(0); // Math.max(0, negative) = 0
    });

    it('should handle zero cost limit for free tier', async () => {
      // Free tier has maxCostPerDay = 0, which should be ignored
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          requests: 10,
          inputTokens: 1000,
          outputTokens: 500,
          estimatedCost: 0.5, // Has some cost
          lastRequestAt: Timestamp.now(),
          modelBreakdown: {},
        }),
      } as any);

      const result = await checkRateLimit(mockDb, testOrgId, 'free');

      // Should still be allowed because free tier cost limit is 0 (disabled)
      expect(result.allowed).toBe(true);
    });

    it('should handle concurrent requests to different orgs', async () => {
      // Setup mocks for two different orgs
      mockGetDoc
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            requests: 10,
            inputTokens: 1000,
            outputTokens: 500,
            estimatedCost: 0,
            lastRequestAt: Timestamp.now(),
            modelBreakdown: {},
          }),
        } as any)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            requests: 50,
            inputTokens: 5000,
            outputTokens: 2500,
            estimatedCost: 0,
            lastRequestAt: Timestamp.now(),
            modelBreakdown: {},
          }),
        } as any);

      const [result1, result2] = await Promise.all([
        checkRateLimit(mockDb, 'org-1', 'free'),
        checkRateLimit(mockDb, 'org-2', 'free'),
      ]);

      expect(result1.remaining.requests).toBe(RATE_LIMITS.free.requestsPerDay - 10);
      expect(result2.remaining.requests).toBe(RATE_LIMITS.free.requestsPerDay - 50);
    });
  });
});
