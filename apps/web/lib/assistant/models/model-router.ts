/**
 * Model Router
 * Routes requests to the appropriate model adapter based on configuration
 */

import { GeminiAdapter } from './gemini-adapter';
import { ClaudeAdapter } from './claude-adapter';
import {
  ModelAdapter,
  ChatRequest,
  ChatResponse,
  StreamChunk,
  AVAILABLE_MODELS,
  getDefaultModelKey,
  ModelProvider,
} from './types';

/**
 * Environment variable names for API keys
 */
const API_KEY_ENV_VARS: Record<ModelProvider, string> = {
  gemini: 'GEMINI_API_KEY',
  claude: 'ANTHROPIC_API_KEY',
  openai: 'OPENAI_API_KEY',
};

/**
 * Cache of adapter instances to avoid recreating them
 */
const adapterCache = new Map<string, ModelAdapter>();

/**
 * Get the API key for a provider from environment
 */
function getApiKey(provider: ModelProvider): string | undefined {
  const envVar = API_KEY_ENV_VARS[provider];
  return process.env[envVar];
}

/**
 * Create an adapter instance for a given model key
 */
function createAdapter(modelKey: string): ModelAdapter {
  const config = AVAILABLE_MODELS[modelKey];
  if (!config) {
    throw new Error(`Unknown model: ${modelKey}`);
  }

  const apiKey = getApiKey(config.provider);
  if (!apiKey) {
    throw new Error(
      `API key not configured for ${config.provider}. Set ${API_KEY_ENV_VARS[config.provider]} environment variable.`
    );
  }

  switch (config.provider) {
    case 'gemini':
      return new GeminiAdapter(apiKey, config.modelId);
    case 'claude':
      return new ClaudeAdapter(apiKey, config.modelId);
    case 'openai':
      throw new Error('OpenAI adapter not yet implemented');
    default:
      throw new Error(`Unsupported provider: ${config.provider}`);
  }
}

/**
 * Get an adapter instance, using cache when possible
 */
function getAdapter(modelKey: string): ModelAdapter {
  if (!adapterCache.has(modelKey)) {
    adapterCache.set(modelKey, createAdapter(modelKey));
  }
  return adapterCache.get(modelKey)!;
}

/**
 * Clear the adapter cache (useful for testing or when keys change)
 */
export function clearAdapterCache(): void {
  adapterCache.clear();
}

/**
 * Model Router - main interface for sending requests
 */
export class ModelRouter {
  /**
   * Send a chat request to the appropriate model
   */
  async chat(
    request: ChatRequest & { modelKey?: string }
  ): Promise<ChatResponse> {
    const modelKey = request.modelKey || getDefaultModelKey();

    // Check if model exists
    if (!AVAILABLE_MODELS[modelKey]) {
      throw new Error(`Unknown model: ${modelKey}`);
    }

    // Check if API key is available for this model
    const config = AVAILABLE_MODELS[modelKey];
    const apiKey = getApiKey(config.provider);

    if (!apiKey) {
      // Fallback to default model if specified model's key isn't available
      const defaultKey = getDefaultModelKey();
      if (modelKey !== defaultKey) {
        console.warn(
          `[ModelRouter] ${config.provider} API key not configured, falling back to default model`
        );
        const defaultApiKey = getApiKey(AVAILABLE_MODELS[defaultKey].provider);
        if (!defaultApiKey) {
          throw new Error('No AI model API keys configured');
        }
        return this.chat({ ...request, modelKey: defaultKey });
      }
      throw new Error(
        `API key not configured. Set ${API_KEY_ENV_VARS[config.provider]} environment variable.`
      );
    }

    const adapter = getAdapter(modelKey);
    return adapter.chat(request);
  }

  /**
   * Stream a chat request to the appropriate model
   */
  async *stream(
    request: ChatRequest & { modelKey?: string }
  ): AsyncGenerator<StreamChunk, void, unknown> {
    const modelKey = request.modelKey || getDefaultModelKey();

    // Check if model exists
    if (!AVAILABLE_MODELS[modelKey]) {
      yield { type: 'error', error: `Unknown model: ${modelKey}` };
      return;
    }

    // Check if API key is available for this model
    const config = AVAILABLE_MODELS[modelKey];
    const apiKey = getApiKey(config.provider);

    if (!apiKey) {
      // Fallback to default model if specified model's key isn't available
      const defaultKey = getDefaultModelKey();
      if (modelKey !== defaultKey) {
        console.warn(
          `[ModelRouter] ${config.provider} API key not configured, falling back to default model`
        );
        const defaultApiKey = getApiKey(AVAILABLE_MODELS[defaultKey].provider);
        if (!defaultApiKey) {
          yield { type: 'error', error: 'No AI model API keys configured' };
          return;
        }
        yield* this.stream({ ...request, modelKey: defaultKey });
        return;
      }
      yield {
        type: 'error',
        error: `API key not configured. Set ${API_KEY_ENV_VARS[config.provider]} environment variable.`,
      };
      return;
    }

    const adapter = getAdapter(modelKey);
    yield* adapter.stream(request);
  }

  /**
   * Check which models are currently available (have API keys configured)
   */
  getAvailableModels(): string[] {
    return Object.entries(AVAILABLE_MODELS)
      .filter(([, config]) => !!getApiKey(config.provider))
      .map(([key]) => key);
  }

  /**
   * Check if a specific model is available
   */
  isModelAvailable(modelKey: string): boolean {
    const config = AVAILABLE_MODELS[modelKey];
    if (!config) return false;
    return !!getApiKey(config.provider);
  }

  /**
   * Get the default model (first available, preferring the configured default)
   */
  getDefaultModel(): string {
    const defaultKey = getDefaultModelKey();
    if (this.isModelAvailable(defaultKey)) {
      return defaultKey;
    }

    // Fall back to first available model
    const available = this.getAvailableModels();
    if (available.length === 0) {
      throw new Error('No AI models are configured');
    }
    return available[0];
  }

  /**
   * Validate that at least one model is available
   */
  async validateConfiguration(): Promise<{
    isValid: boolean;
    availableModels: string[];
    errors: string[];
  }> {
    const errors: string[] = [];
    const availableModels: string[] = [];

    for (const [modelKey, config] of Object.entries(AVAILABLE_MODELS)) {
      const apiKey = getApiKey(config.provider);
      if (apiKey) {
        try {
          const adapter = createAdapter(modelKey);
          const isValid = await adapter.validateApiKey();
          if (isValid) {
            availableModels.push(modelKey);
          } else {
            errors.push(`${config.displayName}: API key invalid`);
          }
        } catch (error) {
          errors.push(
            `${config.displayName}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }
    }

    return {
      isValid: availableModels.length > 0,
      availableModels,
      errors,
    };
  }
}

/**
 * Singleton instance for convenience
 */
export const modelRouter = new ModelRouter();
