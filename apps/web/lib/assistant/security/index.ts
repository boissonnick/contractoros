/**
 * Security module exports
 */

export {
  validatePrompt,
  logSecurityEvent,
  containsSystemPromptExtraction,
  getBlockedPromptMessage,
  type PromptThreat,
  type PromptValidationResult,
} from './prompt-guard';

export {
  checkRateLimit,
  recordUsage,
  getUsageStats,
  clearRateLimitCache,
  getRateLimitHeaders,
  type RateLimitCheck,
  type UsageRecord,
} from './rate-limiter';

export {
  sanitizeOutput,
  checkForSystemPromptLeakage,
  checkForSensitiveContent,
  redactSensitiveContent,
  processOutput,
} from './output-guard';
