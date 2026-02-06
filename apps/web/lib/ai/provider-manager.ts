/**
 * AI Provider Manager - Sprint 37
 *
 * Manages multi-provider AI support with automatic fallback:
 * - Provider priority/fallback chain
 * - Per-feature model assignment
 * - Cost tracking per provider
 * - Automatic fallback on provider failures
 */

import { AVAILABLE_MODELS, ModelConfig } from '@/lib/assistant/models/types';
import { logger } from '@/lib/utils/logger';
import type {
  AIProviderPriority,
  AIFeatureType,
  AIFeatureModelAssignment,
  OrganizationAIProviderSettings,
  AIOperationResult,
} from '@/types';

// ============================================================================
// Provider Configuration
// ============================================================================

/**
 * Provider display configuration
 */
export interface ProviderConfig {
  id: string;
  name: string;
  description: string;
  logoUrl?: string;
  defaultCostPer1kTokens: number;
  models: string[];
  color: {
    bg: string;
    text: string;
    icon: string;
  };
}

/**
 * Available AI providers
 */
export const PROVIDERS: Record<string, ProviderConfig> = {
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Google\'s AI model with large context window. Free tier available.',
    defaultCostPer1kTokens: 0,
    models: ['gemini-2.0-flash', 'gemini-1.5-pro'],
    color: {
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      icon: 'text-blue-600',
    },
  },
  claude: {
    id: 'claude',
    name: 'Anthropic Claude',
    description: 'Advanced reasoning and analysis capabilities.',
    defaultCostPer1kTokens: 0.009,
    models: ['claude-sonnet'],
    color: {
      bg: 'bg-orange-100',
      text: 'text-orange-700',
      icon: 'text-orange-600',
    },
  },
  openai: {
    id: 'openai',
    name: 'OpenAI GPT',
    description: 'Industry-leading language models.',
    defaultCostPer1kTokens: 0.01,
    models: ['gpt-4o', 'gpt-4o-mini'],
    color: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      icon: 'text-green-600',
    },
  },
};

/**
 * Get provider by ID
 */
export function getProvider(providerId: string): ProviderConfig | null {
  return PROVIDERS[providerId] || null;
}

/**
 * Get all available providers
 */
export function getAllProviders(): ProviderConfig[] {
  return Object.values(PROVIDERS);
}

// ============================================================================
// Provider Priority Management
// ============================================================================

/**
 * Get the active (primary or first available fallback) provider
 */
export function getActiveProvider(
  settings: OrganizationAIProviderSettings
): AIProviderPriority | null {
  // First try to get the primary provider if enabled and has API key
  const primaryProvider = settings.providerPriorities.find(
    (p) => p.isPrimary && p.enabled && p.hasApiKey
  );

  if (primaryProvider) {
    return primaryProvider;
  }

  // Fall back to the first enabled provider with API key, sorted by priority
  const sortedProviders = [...settings.providerPriorities]
    .filter((p) => p.enabled && p.hasApiKey)
    .sort((a, b) => a.priority - b.priority);

  return sortedProviders[0] || null;
}

/**
 * Get the fallback chain for a provider
 * Returns providers in priority order, excluding the given provider
 */
export function getFallbackChain(
  settings: OrganizationAIProviderSettings,
  excludeProviderId?: string,
  maxAttempts?: number
): AIProviderPriority[] {
  const limit = maxAttempts ?? settings.maxFallbackAttempts;

  return [...settings.providerPriorities]
    .filter((p) => p.enabled && p.hasApiKey && p.providerId !== excludeProviderId)
    .sort((a, b) => a.priority - b.priority)
    .slice(0, limit);
}

/**
 * Get the model key to use for a specific feature
 */
export function getModelForFeature(
  settings: OrganizationAIProviderSettings,
  feature: AIFeatureType
): string {
  const assignment = settings.featureAssignments.find((a) => a.feature === feature);
  return assignment?.modelKey || 'gemini-2.0-flash';
}

/**
 * Get the fallback model for a specific feature
 */
export function getFallbackModelForFeature(
  settings: OrganizationAIProviderSettings,
  feature: AIFeatureType
): string | undefined {
  const assignment = settings.featureAssignments.find((a) => a.feature === feature);
  return assignment?.fallbackModelKey;
}

/**
 * Get the provider ID for a given model key
 */
export function getProviderForModel(modelKey: string): string | null {
  const modelConfig = AVAILABLE_MODELS[modelKey];
  return modelConfig?.provider || null;
}

// ============================================================================
// Cost Estimation
// ============================================================================

/**
 * Estimate cost for a given model and token count
 */
export function estimateCost(
  modelKey: string,
  inputTokens: number,
  outputTokens: number
): number {
  const modelConfig = AVAILABLE_MODELS[modelKey];
  if (!modelConfig) return 0;

  const inputCost = (inputTokens / 1000) * modelConfig.costPer1kInputTokens;
  const outputCost = (outputTokens / 1000) * modelConfig.costPer1kOutputTokens;

  return inputCost + outputCost;
}

/**
 * Get the blended cost per 1K tokens for a provider
 * Uses average of input and output costs across all provider models
 */
export function getProviderBlendedCost(providerId: string): number {
  const providerModels = Object.values(AVAILABLE_MODELS).filter(
    (m) => m.provider === providerId
  );

  if (providerModels.length === 0) return 0;

  const totalCost = providerModels.reduce(
    (sum, m) => sum + m.costPer1kInputTokens + m.costPer1kOutputTokens,
    0
  );

  return totalCost / (providerModels.length * 2); // Divide by 2 for input/output average
}

/**
 * Get cost display for a model
 */
export function getModelCostDisplay(modelKey: string): string {
  const modelConfig = AVAILABLE_MODELS[modelKey];
  if (!modelConfig) return 'Unknown';

  if (modelConfig.costPer1kInputTokens === 0 && modelConfig.costPer1kOutputTokens === 0) {
    return 'Free';
  }

  return `$${modelConfig.costPer1kInputTokens.toFixed(4)}/1K in, $${modelConfig.costPer1kOutputTokens.toFixed(4)}/1K out`;
}

// ============================================================================
// Execution with Fallback
// ============================================================================

/**
 * Options for executeWithFallback
 */
export interface ExecuteOptions<T> {
  settings: OrganizationAIProviderSettings;
  feature: AIFeatureType;
  operation: (modelKey: string, providerId: string) => Promise<T>;
  onFallback?: (fromProvider: string, toProvider: string, error: Error) => void;
  modelOverride?: string;
}

/**
 * Execute an AI operation with automatic fallback
 * Tries the primary provider first, then falls back to other providers on failure
 */
export async function executeWithFallback<T>(
  options: ExecuteOptions<T>
): Promise<AIOperationResult<T>> {
  const { settings, feature, operation, onFallback, modelOverride } = options;
  const startTime = Date.now();

  // Determine which model to use
  let modelKey = modelOverride || getModelForFeature(settings, feature);
  let providerId = getProviderForModel(modelKey);

  if (!providerId) {
    return {
      success: false,
      error: `Invalid model: ${modelKey}`,
      providerId: 'unknown',
      modelKey,
      wasFallback: false,
      fallbackAttempts: 0,
      inputTokens: 0,
      outputTokens: 0,
      estimatedCost: 0,
      latencyMs: Date.now() - startTime,
    };
  }

  // Get the active provider to start
  const activeProvider = getActiveProvider(settings);
  if (!activeProvider) {
    return {
      success: false,
      error: 'No AI provider configured. Please configure at least one provider.',
      providerId: 'none',
      modelKey,
      wasFallback: false,
      fallbackAttempts: 0,
      inputTokens: 0,
      outputTokens: 0,
      estimatedCost: 0,
      latencyMs: Date.now() - startTime,
    };
  }

  // If the active provider is different from the model's provider,
  // try to find a suitable model from the active provider
  if (activeProvider.providerId !== providerId && !modelOverride) {
    const activeProviderModels = PROVIDERS[activeProvider.providerId]?.models || [];
    if (activeProviderModels.length > 0) {
      modelKey = activeProviderModels[0];
      providerId = activeProvider.providerId;
    }
  }

  // Build the list of providers to try
  const providersToTry: AIProviderPriority[] = [activeProvider];

  if (settings.enableAutomaticFallback) {
    const fallbacks = getFallbackChain(settings, activeProvider.providerId);
    providersToTry.push(...fallbacks);
  }

  let lastError: Error | null = null;
  let fallbackAttempts = 0;

  for (const provider of providersToTry) {
    // Find a suitable model for this provider
    const providerModels = PROVIDERS[provider.providerId]?.models || [];
    const currentModelKey = providerModels[0] || modelKey;

    try {
      // Add delay before fallback attempts (if configured)
      if (fallbackAttempts > 0 && settings.fallbackDelayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, settings.fallbackDelayMs));
      }

      const result = await operation(currentModelKey, provider.providerId);

      return {
        success: true,
        data: result,
        providerId: provider.providerId,
        modelKey: currentModelKey,
        wasFallback: fallbackAttempts > 0,
        fallbackAttempts,
        inputTokens: 0, // Would be filled by the operation
        outputTokens: 0,
        estimatedCost: 0,
        latencyMs: Date.now() - startTime,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      fallbackAttempts++;

      // Notify about fallback
      const nextProvider = providersToTry[fallbackAttempts];
      if (nextProvider && onFallback) {
        onFallback(provider.providerId, nextProvider.providerId, lastError);
      }

      logger.warn(`Provider ${provider.providerId} failed: ${lastError.message}`, { module: 'provider-manager' });
    }
  }

  // All providers failed
  return {
    success: false,
    error: lastError?.message || 'All AI providers failed',
    providerId: activeProvider.providerId,
    modelKey,
    wasFallback: fallbackAttempts > 0,
    fallbackAttempts,
    inputTokens: 0,
    outputTokens: 0,
    estimatedCost: 0,
    latencyMs: Date.now() - startTime,
  };
}

// ============================================================================
// Priority Management Utilities
// ============================================================================

/**
 * Move a provider up in priority (lower priority number = higher priority)
 */
export function moveProviderUp(
  priorities: AIProviderPriority[],
  providerId: string
): AIProviderPriority[] {
  const sorted = [...priorities].sort((a, b) => a.priority - b.priority);
  const index = sorted.findIndex((p) => p.providerId === providerId);

  if (index <= 0) return priorities; // Already at top

  // Swap priorities with the one above
  const current = sorted[index];
  const above = sorted[index - 1];

  return priorities.map((p) => {
    if (p.providerId === current.providerId) {
      return { ...p, priority: above.priority };
    }
    if (p.providerId === above.providerId) {
      return { ...p, priority: current.priority };
    }
    return p;
  });
}

/**
 * Move a provider down in priority
 */
export function moveProviderDown(
  priorities: AIProviderPriority[],
  providerId: string
): AIProviderPriority[] {
  const sorted = [...priorities].sort((a, b) => a.priority - b.priority);
  const index = sorted.findIndex((p) => p.providerId === providerId);

  if (index < 0 || index >= sorted.length - 1) return priorities; // Already at bottom

  // Swap priorities with the one below
  const current = sorted[index];
  const below = sorted[index + 1];

  return priorities.map((p) => {
    if (p.providerId === current.providerId) {
      return { ...p, priority: below.priority };
    }
    if (p.providerId === below.providerId) {
      return { ...p, priority: current.priority };
    }
    return p;
  });
}

/**
 * Set a provider as primary
 * Also ensures it has the highest priority (1)
 */
export function setProviderAsPrimary(
  priorities: AIProviderPriority[],
  providerId: string
): AIProviderPriority[] {
  const minPriority = Math.min(...priorities.map((p) => p.priority));

  return priorities.map((p) => ({
    ...p,
    isPrimary: p.providerId === providerId,
    priority: p.providerId === providerId ? minPriority : p.priority,
  }));
}

/**
 * Toggle a provider's enabled status
 */
export function toggleProviderEnabled(
  priorities: AIProviderPriority[],
  providerId: string
): AIProviderPriority[] {
  return priorities.map((p) =>
    p.providerId === providerId ? { ...p, enabled: !p.enabled } : p
  );
}

/**
 * Reorder providers based on a new order array
 */
export function reorderProviders(
  priorities: AIProviderPriority[],
  newOrder: string[]
): AIProviderPriority[] {
  return priorities.map((p) => {
    const newIndex = newOrder.indexOf(p.providerId);
    return {
      ...p,
      priority: newIndex >= 0 ? newIndex + 1 : p.priority,
    };
  });
}

// ============================================================================
// Feature Assignment Utilities
// ============================================================================

/**
 * Update the model assignment for a feature
 */
export function updateFeatureAssignment(
  assignments: AIFeatureModelAssignment[],
  feature: AIFeatureType,
  modelKey: string,
  fallbackModelKey?: string
): AIFeatureModelAssignment[] {
  const existingIndex = assignments.findIndex((a) => a.feature === feature);

  if (existingIndex >= 0) {
    return assignments.map((a, i) =>
      i === existingIndex ? { ...a, modelKey, fallbackModelKey } : a
    );
  }

  return [...assignments, { feature, modelKey, fallbackModelKey }];
}

/**
 * Get models available for a specific provider
 */
export function getModelsForProvider(providerId: string): ModelConfig[] {
  return Object.entries(AVAILABLE_MODELS)
    .filter(([, config]) => config.provider === providerId)
    .map(([key, config]) => ({ ...config, modelId: key }));
}

/**
 * Get all available models across all configured providers
 */
export function getAvailableModels(
  settings: OrganizationAIProviderSettings
): ModelConfig[] {
  const enabledProviders = settings.providerPriorities
    .filter((p) => p.enabled && p.hasApiKey)
    .map((p) => p.providerId);

  return Object.entries(AVAILABLE_MODELS)
    .filter(([, config]) => enabledProviders.includes(config.provider))
    .map(([key, config]) => ({ ...config, modelId: key }));
}
