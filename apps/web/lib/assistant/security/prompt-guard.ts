/**
 * Prompt Guard - Security layer for prompt injection prevention
 *
 * Industry-standard protection against:
 * - Prompt injection attacks
 * - Jailbreak attempts
 * - Data exfiltration
 * - PII exposure
 * - System prompt leaks
 */

import { logAuditEvent, type AuditAction } from '@/lib/security/audit-logger';
import { logger } from '@/lib/utils/logger';

export type PromptThreat =
  | 'injection_attempt'
  | 'jailbreak_attempt'
  | 'system_prompt_leak'
  | 'data_exfiltration'
  | 'harmful_content'
  | 'pii_exposure'
  | 'code_execution';

export interface PromptValidationResult {
  isValid: boolean;
  sanitizedPrompt: string;
  threats: PromptThreat[];
  riskScore: number; // 0-100
  details: string[];
}

/**
 * Patterns that indicate prompt injection attempts
 */
const INJECTION_PATTERNS = [
  // Direct instruction override
  /ignore (all )?(previous|prior|above|earlier|initial|original) (instructions|prompts|rules|guidelines|constraints)/i,
  /disregard (all )?(previous|prior|above|earlier|initial|original)/i,
  /forget (everything|all|your) (you|instructions|rules|guidelines)/i,
  /override (your|the|all) (instructions|rules|guidelines|constraints)/i,
  /bypass (your|the|all) (instructions|rules|guidelines|constraints|safety|security)/i,

  // Role manipulation
  /you are now/i,
  /new (instructions|persona|role|identity|character)/i,
  /pretend (you are|to be|you're)/i,
  /act as (if|a |an )/i,
  /roleplay as/i,
  /imagine (you are|you're|being)/i,
  /assume (the role|you are|you're)/i,
  /behave (as|like)/i,

  // System prompt extraction
  /reveal (your|the) (instructions|prompt|system|rules|guidelines)/i,
  /what (are|is|were) your (instructions|prompt|system|rules|guidelines)/i,
  /show (me |us )?(your|the) (instructions|prompt|system|rules)/i,
  /print (your|the) (instructions|prompt|system|rules)/i,
  /output (your|the) (instructions|prompt|system|rules)/i,
  /display (your|the) (instructions|prompt|system|rules)/i,
  /tell me (your|the|about) (instructions|prompt|system|rules)/i,
  /repeat (your|the) (instructions|prompt|system|rules)/i,

  // Format injection
  /\[SYSTEM\]/i,
  /\[INST\]/i,
  /\[\/?INST\]/i,
  /<\|im_start\|>/i,
  /<\|im_end\|>/i,
  /<\|system\|>/i,
  /<\|user\|>/i,
  /<\|assistant\|>/i,
  /<<SYS>>/i,
  /<\/SYS>/i,
  /###\s*(System|Human|Assistant):/i,
];

/**
 * Patterns that indicate jailbreak attempts
 */
const JAILBREAK_PATTERNS = [
  // Known jailbreak names
  /\bDAN\b/,
  /Do Anything Now/i,
  /\bSTAN\b/,
  /\bDUDE\b/,
  /\bJailbreak\b/i,
  /\bAIM\b.*\bMachiavelli/i,

  // Mode manipulation
  /developer mode/i,
  /maintenance mode/i,
  /sudo mode/i,
  /god mode/i,
  /admin mode/i,
  /unrestricted mode/i,
  /unfiltered mode/i,
  /uncensored mode/i,
  /debug mode/i,
  /test mode/i,
  /safe mode (off|disabled)/i,

  // Constraint removal
  /no (rules|restrictions|limits|boundaries|constraints|guidelines)/i,
  /ignore (ethics|guidelines|safety|morals|rules)/i,
  /remove (your|the|all) (filters|restrictions|limits|constraints)/i,
  /disable (your|the|all) (filters|restrictions|limits|safety)/i,
  /turn off (your|the|all) (filters|restrictions|limits|safety)/i,
  /without (any |)(restrictions|limits|constraints|filters|guidelines)/i,

  // False authority claims
  /I('m| am) (a |an |)(developer|admin|administrator|engineer) at (Anthropic|OpenAI|Google)/i,
  /I('m| am) (your|the) (creator|developer|programmer|engineer)/i,
  /this is a (test|authorized test|security test)/i,
  /I have (special |admin |)permission/i,
  /authorized (to |for |by )/i,
];

/**
 * Patterns that indicate data exfiltration attempts
 */
const DATA_EXFILTRATION_PATTERNS = [
  // Network requests
  /send (to|an email|http|https|a request|data)/i,
  /post (to |a |)(request|data)/i,
  /\bcurl\b/i,
  /\bwget\b/i,
  /\bfetch\s*\(/i,
  /webhook/i,
  /api\s*(call|request|endpoint)/i,

  // Encoding for exfiltration
  /base64 (encode|decode)/i,
  /encode (as|to|in) (base64|hex|binary)/i,
  /exfiltrat/i,
  /leak (data|information|secrets)/i,

  // Credential theft
  /what('s| is| are) (your|the|my) (api|API) key/i,
  /show (me |)(your|the|my) (api|API|secret) key/i,
  /reveal (your|the|my) (credentials|secrets|keys|tokens)/i,
];

/**
 * Patterns for PII (Personally Identifiable Information)
 */
const PII_PATTERNS = [
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/, type: 'SSN' },
  { pattern: /\b\d{9}\b/, type: 'SSN (no dashes)' },
  { pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, type: 'Credit card' },
  { pattern: /\b\d{3}[\s-]?\d{3}[\s-]?\d{4}\b/, type: 'Phone number' },
];

/**
 * Patterns for code execution attempts
 */
const CODE_EXECUTION_PATTERNS = [
  /eval\s*\(/i,
  /exec\s*\(/i,
  /system\s*\(/i,
  /os\.system/i,
  /subprocess/i,
  /shell_exec/i,
  /__import__/i,
  /require\s*\(['"`]child_process/i,
  /spawn\s*\(/i,
  /<script[\s>]/i,
  /javascript:/i,
  /on(error|load|click|mouse)\s*=/i,
];

/**
 * Main validation function
 */
export function validatePrompt(
  prompt: string,
  _context?: { orgId?: string; userId?: string }
): PromptValidationResult {
  const threats: PromptThreat[] = [];
  const details: string[] = [];
  let riskScore = 0;
  let sanitizedPrompt = prompt;

  // Check for injection attempts
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(prompt)) {
      if (!threats.includes('injection_attempt')) {
        threats.push('injection_attempt');
        riskScore += 40;
      }
      details.push(`Injection pattern detected: ${pattern.source.slice(0, 50)}...`);
    }
  }

  // Check for jailbreak attempts
  for (const pattern of JAILBREAK_PATTERNS) {
    if (pattern.test(prompt)) {
      if (!threats.includes('jailbreak_attempt')) {
        threats.push('jailbreak_attempt');
        riskScore += 50;
      }
      details.push(`Jailbreak pattern detected: ${pattern.source.slice(0, 50)}...`);
    }
  }

  // Check for data exfiltration
  for (const pattern of DATA_EXFILTRATION_PATTERNS) {
    if (pattern.test(prompt)) {
      if (!threats.includes('data_exfiltration')) {
        threats.push('data_exfiltration');
        riskScore += 30;
      }
      details.push(`Exfiltration pattern detected: ${pattern.source.slice(0, 50)}...`);
    }
  }

  // Check for code execution attempts
  for (const pattern of CODE_EXECUTION_PATTERNS) {
    if (pattern.test(prompt)) {
      if (!threats.includes('code_execution')) {
        threats.push('code_execution');
        riskScore += 35;
      }
      details.push(`Code execution pattern detected: ${pattern.source.slice(0, 50)}...`);
    }
  }

  // Check for and redact PII
  for (const { pattern, type } of PII_PATTERNS) {
    if (pattern.test(prompt)) {
      if (!threats.includes('pii_exposure')) {
        threats.push('pii_exposure');
        riskScore += 20;
      }
      details.push(`PII detected: ${type}`);
      // Redact the PII
      sanitizedPrompt = sanitizedPrompt.replace(pattern, `[REDACTED ${type}]`);
    }
  }

  // Sanitize the prompt
  sanitizedPrompt = sanitizePrompt(sanitizedPrompt);

  // Cap risk score at 100
  riskScore = Math.min(100, riskScore);

  return {
    isValid: riskScore < 50,
    sanitizedPrompt,
    threats,
    riskScore,
    details,
  };
}

/**
 * Sanitize a prompt by removing potentially harmful content
 */
function sanitizePrompt(prompt: string): string {
  let sanitized = prompt;

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Remove Unicode control characters (except newlines and tabs)
  sanitized = sanitized.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');

  // Normalize excessive whitespace (but preserve single newlines)
  sanitized = sanitized.replace(/[ \t]+/g, ' ');
  sanitized = sanitized.replace(/\n{3,}/g, '\n\n');

  // Limit total length (10K chars should be plenty for any legitimate request)
  sanitized = sanitized.slice(0, 10000);

  return sanitized.trim();
}

/**
 * Map prompt threats to audit event types
 */
function mapThreatToAuditType(threats: PromptThreat[]): AuditAction {
  if (threats.includes('injection_attempt')) return 'PROMPT_INJECTION';
  if (threats.includes('jailbreak_attempt')) return 'JAILBREAK_ATTEMPT';
  if (threats.includes('data_exfiltration')) return 'DATA_EXFILTRATION';
  if (threats.includes('pii_exposure')) return 'PII_EXPOSURE';
  return 'SECURITY_THREAT';
}

/**
 * Log security events for analysis
 */
export function logSecurityEvent(
  validation: PromptValidationResult,
  context: { orgId: string; userId: string; promptPreview?: string }
): void {
  if (validation.threats.length > 0) {
    logger.warn('Prompt threat detected', {
      module: 'prompt-guard',
      orgId: context.orgId,
      userId: context.userId,
      threats: validation.threats,
      riskScore: validation.riskScore,
      details: validation.details,
      promptPreview: context.promptPreview?.slice(0, 100),
      timestamp: new Date().toISOString(),
      blocked: !validation.isValid,
    });

    // Write to Firestore security audit log
    logAuditEvent(context.orgId, {
      action: mapThreatToAuditType(validation.threats),
      userId: context.userId,
      userEmail: 'unknown', // Not available in this context
      resource: 'system',
      details: {
        threats: validation.threats,
        riskScore: validation.riskScore,
        detectionDetails: validation.details,
        promptPreview: context.promptPreview?.slice(0, 100),
        blocked: !validation.isValid,
      },
      severity: validation.riskScore >= 80 ? 'critical' : validation.riskScore >= 50 ? 'warning' : 'info',
    }).catch((err) => {
      // Don't let audit logging failures affect the main flow
      logger.error('Failed to write audit log', { error: err, module: 'prompt-guard' });
    });
  }
}

/**
 * Check if a prompt contains attempts to extract system information
 */
export function containsSystemPromptExtraction(prompt: string): boolean {
  const extractionPatterns = [
    /reveal (your|the) (instructions|prompt|system)/i,
    /what (are|is) your (instructions|prompt|system)/i,
    /show (me |)(your|the) (instructions|prompt|system)/i,
    /repeat (your|the) (instructions|prompt|system)/i,
    /print (your|the) (instructions|prompt|system)/i,
    /output (your|the) (instructions|prompt|system)/i,
  ];

  return extractionPatterns.some((pattern) => pattern.test(prompt));
}

/**
 * Generate a safe error message for blocked prompts
 */
export function getBlockedPromptMessage(threats: PromptThreat[]): string {
  if (threats.includes('pii_exposure')) {
    return "I noticed your message contained sensitive personal information (like SSN or credit card numbers). For your security, I can't process messages with this type of data. Please remove the sensitive information and try again.";
  }

  if (threats.includes('injection_attempt') || threats.includes('jailbreak_attempt')) {
    return "I wasn't able to process that request. Let me know how I can help you with your construction projects, estimates, or scheduling!";
  }

  if (threats.includes('data_exfiltration')) {
    return "I can't help with requests that involve sending data to external services. Is there something else I can help you with?";
  }

  return "I wasn't able to process that request. How can I help you with your construction business today?";
}
