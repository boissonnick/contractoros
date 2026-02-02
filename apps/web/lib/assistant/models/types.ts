/**
 * AI Model Types and Interfaces
 * Multi-model support for ContractorOS AI Assistant
 */

export type ModelProvider = 'gemini' | 'claude' | 'openai';

export type ModelTier = 'free' | 'pro' | 'enterprise';

export interface ModelConfig {
  provider: ModelProvider;
  modelId: string;
  displayName: string;
  description: string;
  tier: ModelTier;
  maxTokens: number;
  contextWindow: number;
  costPer1kInputTokens: number;
  costPer1kOutputTokens: number;
  supportsStreaming: boolean;
  supportsVision: boolean;
  isDefault?: boolean;
}

/**
 * Available models configuration
 * Gemini 2.0 Flash is the default (free tier)
 */
export const AVAILABLE_MODELS: Record<string, ModelConfig> = {
  'gemini-2.0-flash': {
    provider: 'gemini',
    modelId: 'gemini-2.0-flash',
    displayName: 'Gemini 2.0 Flash',
    description: 'Fast, capable model with 1M context. Free tier default.',
    tier: 'free',
    maxTokens: 8192,
    contextWindow: 1000000,
    costPer1kInputTokens: 0.0,
    costPer1kOutputTokens: 0.0,
    supportsStreaming: true,
    supportsVision: true,
    isDefault: true,
  },
  'gemini-1.5-pro': {
    provider: 'gemini',
    modelId: 'gemini-1.5-pro',
    displayName: 'Gemini 1.5 Pro',
    description: 'Most capable Gemini model for complex tasks.',
    tier: 'pro',
    maxTokens: 8192,
    contextWindow: 2000000,
    costPer1kInputTokens: 0.00125,
    costPer1kOutputTokens: 0.005,
    supportsStreaming: true,
    supportsVision: true,
  },
  'claude-sonnet': {
    provider: 'claude',
    modelId: 'claude-sonnet-4-20250514',
    displayName: 'Claude Sonnet',
    description: 'Anthropic\'s balanced model for most tasks.',
    tier: 'pro',
    maxTokens: 4096,
    contextWindow: 200000,
    costPer1kInputTokens: 0.003,
    costPer1kOutputTokens: 0.015,
    supportsStreaming: true,
    supportsVision: true,
  },
  'gpt-4o': {
    provider: 'openai',
    modelId: 'gpt-4o',
    displayName: 'GPT-4o',
    description: 'OpenAI\'s multimodal flagship model.',
    tier: 'pro',
    maxTokens: 4096,
    contextWindow: 128000,
    costPer1kInputTokens: 0.005,
    costPer1kOutputTokens: 0.015,
    supportsStreaming: true,
    supportsVision: true,
  },
};

/**
 * Get the default model key
 */
export function getDefaultModelKey(): string {
  const defaultModel = Object.entries(AVAILABLE_MODELS).find(
    ([, config]) => config.isDefault
  );
  return defaultModel ? defaultModel[0] : 'gemini-2.0-flash';
}

/**
 * Get models available for a given tier
 */
export function getModelsForTier(tier: ModelTier): Record<string, ModelConfig> {
  const tierPriority: Record<ModelTier, number> = {
    free: 0,
    pro: 1,
    enterprise: 2,
  };

  return Object.fromEntries(
    Object.entries(AVAILABLE_MODELS).filter(
      ([, config]) => tierPriority[config.tier] <= tierPriority[tier]
    )
  );
}

/**
 * Chat message format (unified across providers)
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Request to send to a model adapter
 */
export interface ChatRequest {
  messages: ChatMessage[];
  systemPrompt: string;
  maxTokens?: number;
  temperature?: number;
  orgId: string;
  userId: string;
}

/**
 * Response from a model adapter
 */
export interface ChatResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
  modelId: string;
  finishReason: 'stop' | 'length' | 'error' | 'content_filter';
  estimatedCost: number;
}

/**
 * Streaming chunk from a model adapter
 */
export interface StreamChunk {
  type: 'delta' | 'usage' | 'done' | 'error';
  text?: string;
  inputTokens?: number;
  outputTokens?: number;
  error?: string;
}

/**
 * Model adapter interface - all providers implement this
 */
export interface ModelAdapter {
  provider: ModelProvider;
  modelId: string;

  /**
   * Send a chat request and get a complete response
   */
  chat(request: ChatRequest): Promise<ChatResponse>;

  /**
   * Send a chat request and stream the response
   */
  stream(request: ChatRequest): AsyncGenerator<StreamChunk, void, unknown>;

  /**
   * Validate that the API key is configured and working
   */
  validateApiKey(): Promise<boolean>;

  /**
   * Estimate cost for a given number of tokens
   */
  estimateCost(inputTokens: number, outputTokens: number): number;
}

/**
 * Configuration for rate limiting
 */
export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  tokensPerDay: number;
  maxCostPerDay: number;
}

/**
 * Rate limits by tier
 */
export const RATE_LIMITS: Record<ModelTier, RateLimitConfig> = {
  free: {
    requestsPerMinute: 10,
    requestsPerHour: 60,
    requestsPerDay: 200,
    tokensPerDay: 100000,
    maxCostPerDay: 0,
  },
  pro: {
    requestsPerMinute: 30,
    requestsPerHour: 300,
    requestsPerDay: 1000,
    tokensPerDay: 500000,
    maxCostPerDay: 10,
  },
  enterprise: {
    requestsPerMinute: 100,
    requestsPerHour: 1000,
    requestsPerDay: 10000,
    tokensPerDay: 2000000,
    maxCostPerDay: 100,
  },
};
