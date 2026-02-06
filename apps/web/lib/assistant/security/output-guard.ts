/**
 * Output Guard - Sanitizes AI model outputs
 *
 * Protects against:
 * - XSS attacks in rendered output
 * - System prompt leakage
 * - Malicious content injection
 * - Markdown/HTML injection
 */

import { logger } from '@/lib/utils/logger';

/**
 * Sanitize model output for safe rendering
 */
export function sanitizeOutput(output: string): string {
  let sanitized = output;

  // Remove any script tags
  sanitized = sanitized.replace(/<script[\s\S]*?<\/script>/gi, '');
  sanitized = sanitized.replace(/<script[^>]*>/gi, '');

  // Remove event handlers
  sanitized = sanitized.replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\bon\w+\s*=\s*[^\s>]+/gi, '');

  // Remove javascript: URLs
  sanitized = sanitized.replace(/javascript\s*:/gi, '');
  sanitized = sanitized.replace(/data\s*:\s*text\/html/gi, '');

  // Remove potentially dangerous HTML elements (keep safe markdown)
  sanitized = sanitized.replace(/<iframe[\s\S]*?<\/iframe>/gi, '');
  sanitized = sanitized.replace(/<iframe[^>]*>/gi, '');
  sanitized = sanitized.replace(/<object[\s\S]*?<\/object>/gi, '');
  sanitized = sanitized.replace(/<object[^>]*>/gi, '');
  sanitized = sanitized.replace(/<embed[^>]*>/gi, '');
  sanitized = sanitized.replace(/<form[\s\S]*?<\/form>/gi, '');
  sanitized = sanitized.replace(/<form[^>]*>/gi, '');
  sanitized = sanitized.replace(/<input[^>]*>/gi, '');
  sanitized = sanitized.replace(/<button[\s\S]*?<\/button>/gi, '');
  sanitized = sanitized.replace(/<textarea[\s\S]*?<\/textarea>/gi, '');
  sanitized = sanitized.replace(/<style[\s\S]*?<\/style>/gi, '');
  sanitized = sanitized.replace(/<link[^>]*>/gi, '');
  sanitized = sanitized.replace(/<meta[^>]*>/gi, '');
  sanitized = sanitized.replace(/<base[^>]*>/gi, '');

  // Remove SVG (can contain scripts)
  sanitized = sanitized.replace(/<svg[\s\S]*?<\/svg>/gi, '[SVG removed]');

  // Remove any accidental system prompt markers
  sanitized = sanitized.replace(/\[SYSTEM[^\]]*\]/gi, '');
  sanitized = sanitized.replace(/<<SYS>>[\s\S]*?<<\/SYS>>/gi, '');
  sanitized = sanitized.replace(/<\|im_start\|>[\s\S]*?<\|im_end\|>/gi, '');
  sanitized = sanitized.replace(/###\s*(System|Human|Assistant):/gi, '');

  // Clean up any resulting empty lines
  sanitized = sanitized.replace(/\n{3,}/g, '\n\n');

  return sanitized.trim();
}

/**
 * Check if output contains potential system prompt leakage
 *
 * @param output - The model's output
 * @param systemPrompt - The system prompt that should not be leaked
 * @returns true if leakage is detected
 */
export function checkForSystemPromptLeakage(
  output: string,
  systemPrompt: string
): boolean {
  // Normalize both strings for comparison
  const normalizedOutput = output.toLowerCase();
  const normalizedPrompt = systemPrompt.toLowerCase();

  // Extract significant words from system prompt (5+ chars, not common words)
  const commonWords = new Set([
    'about', 'above', 'after', 'again', 'being', 'below', 'between',
    'could', 'during', 'every', 'first', 'from', 'have', 'into', 'just',
    'like', 'make', 'more', 'most', 'only', 'other', 'over', 'same',
    'should', 'some', 'such', 'than', 'that', 'their', 'them', 'then',
    'there', 'these', 'they', 'this', 'through', 'under', 'very', 'well',
    'were', 'what', 'when', 'where', 'which', 'while', 'will', 'with',
    'would', 'your', 'please', 'always', 'never', 'before',
  ]);

  const promptWords = normalizedPrompt
    .split(/\s+/)
    .filter((w) => w.length >= 5 && !commonWords.has(w))
    .map((w) => w.replace(/[^a-z]/g, ''));

  // Remove duplicates
  const uniqueWords = Array.from(new Set(promptWords));

  // Count how many unique prompt words appear in the output
  let matchCount = 0;
  for (const word of uniqueWords) {
    if (word && normalizedOutput.includes(word)) {
      matchCount++;
    }
  }

  // If more than 30% of unique system prompt words appear, flag as potential leak
  const leakageThreshold = 0.3;
  return uniqueWords.length > 0 && matchCount / uniqueWords.length > leakageThreshold;
}

/**
 * Check if output contains sensitive patterns that shouldn't be exposed
 */
export function checkForSensitiveContent(output: string): {
  hasSensitive: boolean;
  types: string[];
} {
  const types: string[] = [];

  // Check for API keys patterns
  if (/[a-zA-Z0-9_-]{20,}/.test(output) && /key|token|secret|api/i.test(output)) {
    // More specific check - looks like an API key being shared
    if (
      /sk-[a-zA-Z0-9]{20,}/.test(output) || // OpenAI/Anthropic style
      /AIza[a-zA-Z0-9_-]{35}/.test(output) || // Google API key
      /ghp_[a-zA-Z0-9]{36}/.test(output) // GitHub PAT
    ) {
      types.push('api_key');
    }
  }

  // Check for credentials being exposed
  if (/password\s*[:=]\s*["']?[^"'\s]{8,}/i.test(output)) {
    types.push('password');
  }

  // Check for internal URLs that shouldn't be shared
  if (/https?:\/\/localhost|https?:\/\/127\.0\.0\.1|https?:\/\/192\.168\./i.test(output)) {
    types.push('internal_url');
  }

  // Check for environment variable exposure
  if (/process\.env\.[A-Z_]+\s*=/.test(output)) {
    types.push('env_variable');
  }

  return {
    hasSensitive: types.length > 0,
    types,
  };
}

/**
 * Redact sensitive content from output
 */
export function redactSensitiveContent(output: string): string {
  let redacted = output;

  // Redact API key patterns
  redacted = redacted.replace(/sk-[a-zA-Z0-9]{20,}/g, '[REDACTED API KEY]');
  redacted = redacted.replace(/AIza[a-zA-Z0-9_-]{35}/g, '[REDACTED API KEY]');
  redacted = redacted.replace(/ghp_[a-zA-Z0-9]{36}/g, '[REDACTED TOKEN]');

  // Redact password patterns
  redacted = redacted.replace(
    /(password\s*[:=]\s*["']?)[^"'\s]{8,}(["']?)/gi,
    '$1[REDACTED]$2'
  );

  // Redact internal URLs
  redacted = redacted.replace(
    /https?:\/\/localhost[^\s]*/gi,
    '[INTERNAL URL REDACTED]'
  );
  redacted = redacted.replace(
    /https?:\/\/127\.0\.0\.1[^\s]*/gi,
    '[INTERNAL URL REDACTED]'
  );
  redacted = redacted.replace(
    /https?:\/\/192\.168\.[^\s]*/gi,
    '[INTERNAL URL REDACTED]'
  );

  return redacted;
}

/**
 * Full output processing pipeline
 */
export function processOutput(
  output: string,
  systemPrompt: string
): {
  content: string;
  wasModified: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  let wasModified = false;

  // Step 1: Basic sanitization
  let content = sanitizeOutput(output);
  if (content !== output) {
    wasModified = true;
    warnings.push('HTML/script content was sanitized');
  }

  // Step 2: Check for system prompt leakage
  if (checkForSystemPromptLeakage(content, systemPrompt)) {
    warnings.push('Potential system prompt leakage detected');
    // Log but don't necessarily block - could be false positive
    logger.warn('Potential system prompt leakage in response', { module: 'output-guard' });
  }

  // Step 3: Check and redact sensitive content
  const sensitiveCheck = checkForSensitiveContent(content);
  if (sensitiveCheck.hasSensitive) {
    content = redactSensitiveContent(content);
    wasModified = true;
    warnings.push(`Sensitive content redacted: ${sensitiveCheck.types.join(', ')}`);
  }

  return {
    content,
    wasModified,
    warnings,
  };
}
