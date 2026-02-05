/**
 * Claude API Client
 *
 * Wrapper for the AI model API to handle chat requests,
 * streaming responses, and error handling.
 *
 * Now supports authentication to enable server-side context loading.
 */

import {
  AssistantRequest,
  AssistantResponse,
  AssistantContext,
  StreamingChunk,
  MAX_CONTEXT_TOKENS,
} from './types';
import { buildContextSummary } from './prompts';
import { getAuth } from 'firebase/auth';

/**
 * Configuration for the Claude client
 */
interface ClaudeClientConfig {
  apiKey?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

const _DEFAULT_CONFIG: Required<ClaudeClientConfig> = {
  apiKey: '',
  model: 'claude-sonnet-4-20250514',
  maxTokens: 1024,
  temperature: 0.7,
};

/**
 * Get Firebase ID token for authenticated requests
 * This enables server-side context loading with user verification
 */
async function getIdToken(): Promise<string | null> {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
    return null;
  } catch (error) {
    console.warn('[Assistant] Failed to get ID token:', error);
    return null;
  }
}

/**
 * Send a message to the AI API via our backend route
 * Includes authentication token for server-side context loading
 */
export async function sendMessage(
  request: AssistantRequest
): Promise<AssistantResponse> {
  // Get ID token for authenticated requests
  const idToken = await getIdToken();

  const response = await fetch('/api/assistant', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: request.message,
      context: request.context,
      conversationHistory: request.conversationHistory,
      options: request.options,
      idToken, // Include for server-side auth verification
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API request failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Send a message with streaming response
 * Includes authentication token for server-side context loading
 */
export async function* sendMessageStreaming(
  request: AssistantRequest
): AsyncGenerator<StreamingChunk> {
  // Get ID token for authenticated requests
  const idToken = await getIdToken();

  const response = await fetch('/api/assistant/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: request.message,
      context: request.context,
      conversationHistory: request.conversationHistory,
      options: request.options,
      idToken, // Include for server-side auth verification
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    yield {
      type: 'error',
      content: errorData.error || `API request failed: ${response.status}`,
    };
    return;
  }

  if (!response.body) {
    yield { type: 'error', content: 'No response body' };
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            yield { type: 'done' };
            return;
          }
          try {
            const chunk = JSON.parse(data) as StreamingChunk;
            yield chunk;
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  yield { type: 'done' };
}

/**
 * Build the messages array for the Claude API
 */
export function buildMessages(
  message: string,
  context: AssistantContext,
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
): Array<{ role: 'user' | 'assistant'; content: string }> {
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  // Add context as the first user message if not in history
  const contextSummary = buildContextSummary(context);
  if (contextSummary && (!conversationHistory || conversationHistory.length === 0)) {
    messages.push({
      role: 'user',
      content: `[Context: ${contextSummary}]\n\n${message}`,
    });
  } else {
    // Add conversation history
    if (conversationHistory) {
      messages.push(...conversationHistory);
    }
    messages.push({ role: 'user', content: message });
  }

  return messages;
}

/**
 * Estimate token count for a string (rough approximation)
 */
export function estimateTokens(text: string): number {
  // Rough estimate: ~4 characters per token for English
  return Math.ceil(text.length / 4);
}

/**
 * Truncate context to fit within token limits
 */
export function truncateContext(
  context: AssistantContext,
  maxTokens: number = MAX_CONTEXT_TOKENS
): AssistantContext {
  const contextString = JSON.stringify(context);
  const estimatedTokens = estimateTokens(contextString);

  if (estimatedTokens <= maxTokens) {
    return context;
  }

  // Create a reduced context by removing less important fields
  const reducedContext: AssistantContext = {
    organization: context.organization,
    user: {
      userId: context.user.userId,
      displayName: context.user.displayName,
      role: context.user.role,
    },
    currentPage: context.currentPage,
  };

  // Add project context if viewing a project, but minimal
  if (context.activeProject) {
    reducedContext.activeProject = {
      projectId: context.activeProject.projectId,
      name: context.activeProject.name,
      type: context.activeProject.type,
      status: context.activeProject.status,
    };
  }

  // Add estimate context if editing, but minimal
  if (context.activeEstimate) {
    reducedContext.activeEstimate = {
      estimateId: context.activeEstimate.estimateId,
      name: context.activeEstimate.name,
      totalAmount: context.activeEstimate.totalAmount,
      lineItemCount: context.activeEstimate.lineItemCount,
      status: context.activeEstimate.status,
    };
  }

  return reducedContext;
}

/**
 * Format a price value for display
 */
export function formatPrice(amount: number, showCents: boolean = true): string {
  if (showCents) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Extract mentioned prices from assistant response
 */
export function extractPricesFromResponse(
  response: string
): Array<{ value: number; context: string }> {
  const prices: Array<{ value: number; context: string }> = [];

  // Match currency patterns like $1,234.56 or $1234
  const priceRegex = /\$[\d,]+(?:\.\d{2})?/g;
  let match;

  while ((match = priceRegex.exec(response)) !== null) {
    const priceString = match[0].replace(/[$,]/g, '');
    const value = parseFloat(priceString);

    if (!isNaN(value)) {
      // Get surrounding context (20 chars before and after)
      const start = Math.max(0, match.index - 20);
      const end = Math.min(response.length, match.index + match[0].length + 20);
      const context = response.substring(start, end);

      prices.push({ value, context });
    }
  }

  return prices;
}

/**
 * Check if a message is asking about pricing
 */
export function isPricingQuery(message: string): boolean {
  const pricingKeywords = [
    'price',
    'cost',
    'charge',
    'rate',
    'estimate',
    'quote',
    'bid',
    'how much',
    'what should i charge',
    'what to charge',
    'pricing',
    'per square',
    'per foot',
    'per hour',
    'labor rate',
    'material cost',
  ];

  const lowerMessage = message.toLowerCase();
  return pricingKeywords.some(keyword => lowerMessage.includes(keyword));
}

/**
 * Check if a message is asking about scheduling
 */
export function isSchedulingQuery(message: string): boolean {
  const schedulingKeywords = [
    'schedule',
    'calendar',
    'appointment',
    'meeting',
    'when',
    'tomorrow',
    'next week',
    'this week',
    'available',
    'availability',
    'book',
    'reschedule',
  ];

  const lowerMessage = message.toLowerCase();
  return schedulingKeywords.some(keyword => lowerMessage.includes(keyword));
}

/**
 * Check if a message is asking about a project
 */
export function isProjectQuery(message: string): boolean {
  const projectKeywords = [
    'project',
    'job',
    'status',
    'progress',
    'phase',
    'task',
    'deadline',
    'budget',
    'client',
    'team',
    'crew',
  ];

  const lowerMessage = message.toLowerCase();
  return projectKeywords.some(keyword => lowerMessage.includes(keyword));
}
