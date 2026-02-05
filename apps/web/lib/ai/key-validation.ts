/**
 * AI Provider API Key Validation Utilities
 *
 * This module provides client-side functions to validate API keys for various AI providers.
 *
 * SECURITY NOTE: These functions are for client-side validation ONLY.
 * - API keys should NEVER be stored in Firestore or local storage
 * - In production, keys should be sent to a Cloud Function for validation and storage in Secret Manager
 * - The validation endpoints used here are the same ones the providers recommend for key verification
 *
 * ============================================================================
 * BACKEND REQUIREMENTS FOR PRODUCTION
 * ============================================================================
 *
 * For production deployment, the following Cloud Functions are required:
 *
 * 1. setAIProviderKey (HTTPS Callable)
 *    - Receives: { provider: AIModelProvider, apiKey: string, orgId: string }
 *    - Actions:
 *      a. Validates the API key with the provider's API
 *      b. Stores the key in GCP Secret Manager with name: `ai-key-{orgId}-{provider}`
 *      c. Updates Firestore metadata at: organizations/{orgId}/aiKeyConfigs/{provider}
 *    - Returns: { success: boolean, keyLastFour?: string, availableModels?: string[], error?: string }
 *
 * 2. clearAIProviderKey (HTTPS Callable)
 *    - Receives: { provider: AIModelProvider, orgId: string }
 *    - Actions:
 *      a. Deletes the secret from GCP Secret Manager
 *      b. Updates Firestore metadata to mark key as not set
 *    - Returns: { success: boolean, error?: string }
 *
 * 3. validateAIProviderKey (HTTPS Callable)
 *    - Receives: { provider: AIModelProvider, orgId: string }
 *    - Actions:
 *      a. Retrieves the key from Secret Manager
 *      b. Validates it with the provider's API
 *      c. Updates the validatedAt timestamp in Firestore
 *    - Returns: { valid: boolean, models?: string[], error?: string }
 *
 * 4. getAIProviderKey (Internal only - for AI service usage)
 *    - Receives: { provider: AIModelProvider, orgId: string }
 *    - Actions:
 *      a. Retrieves the key from Secret Manager
 *      b. Returns the key (ONLY for server-side AI requests, never exposed to client)
 *    - Returns: { key: string } or throws error
 *
 * FIRESTORE DATA MODEL:
 * ---------------------
 * Path: organizations/{orgId}/aiKeyConfigs/{provider}
 * Document: {
 *   provider: string,           // 'openai' | 'claude' | 'gemini'
 *   keySet: boolean,            // Whether a key is stored in Secret Manager
 *   keyLastFour: string,        // Last 4 chars for display (e.g., '7x9Z')
 *   validatedAt: Timestamp,     // When the key was last validated
 *   validationStatus: string,   // 'valid' | 'invalid' | 'not_set' | 'expired'
 *   availableModels: string[],  // Models accessible with this key
 *   authMethod: string,         // 'oauth' | 'api_key'
 *   errorMessage?: string,      // Last error message if validation failed
 *   createdAt: Timestamp,
 *   updatedAt: Timestamp
 * }
 *
 * SECRET MANAGER NAMING:
 * ----------------------
 * Secret names should follow this pattern:
 *   ai-key-{orgId}-{provider}
 *
 * Example:
 *   ai-key-abc123-openai
 *   ai-key-abc123-claude
 *   ai-key-abc123-gemini
 *
 * IAM REQUIREMENTS:
 * -----------------
 * The Cloud Functions service account needs:
 *   - roles/secretmanager.secretVersionManager (to create/delete secrets)
 *   - roles/datastore.user (to update Firestore)
 *
 * SECURITY CONSIDERATIONS:
 * ------------------------
 * 1. Never log API keys in Cloud Functions
 * 2. Use short-lived tokens where possible
 * 3. Implement rate limiting on the setAIProviderKey function
 * 4. Validate orgId ownership before allowing key operations
 * 5. Consider key rotation policies for long-lived keys
 * ============================================================================
 */

import { AIModelProvider, AIKeyValidationResult } from '@/types';

/**
 * OpenAI model information returned from the API
 */
interface OpenAIModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

/**
 * Anthropic model information
 */
interface _AnthropicModel {
  id: string;
  name: string;
  description?: string;
}

/**
 * Validate an OpenAI API key by testing the models endpoint
 *
 * @param apiKey - The OpenAI API key to validate
 * @returns Validation result with available models if valid
 */
export async function validateOpenAIKey(apiKey: string): Promise<AIKeyValidationResult> {
  if (!apiKey || !apiKey.startsWith('sk-')) {
    return {
      valid: false,
      provider: 'openai',
      error: 'Invalid key format. OpenAI keys should start with "sk-"',
    };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      if (response.status === 401) {
        return {
          valid: false,
          provider: 'openai',
          error: 'Invalid API key. Please check your key and try again.',
        };
      }

      if (response.status === 429) {
        return {
          valid: false,
          provider: 'openai',
          error: 'Rate limited. Please wait a moment and try again.',
        };
      }

      return {
        valid: false,
        provider: 'openai',
        error: errorData.error?.message || `Validation failed with status ${response.status}`,
      };
    }

    const data = await response.json();
    const models: OpenAIModel[] = data.data || [];

    // Filter to relevant chat/completion models
    const chatModels = models
      .filter((m) =>
        m.id.includes('gpt-4') ||
        m.id.includes('gpt-3.5') ||
        m.id.includes('o1') ||
        m.id.includes('o3')
      )
      .map((m) => m.id)
      .sort();

    return {
      valid: true,
      provider: 'openai',
      models: chatModels.length > 0 ? chatModels : ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'],
    };
  } catch (error) {
    console.error('[validateOpenAIKey] Network error:', error);
    return {
      valid: false,
      provider: 'openai',
      error: 'Network error. Please check your connection and try again.',
    };
  }
}

/**
 * Validate an Anthropic API key by testing the messages endpoint
 *
 * Note: Anthropic doesn't have a dedicated "list models" endpoint,
 * so we send a minimal messages request to validate the key.
 *
 * @param apiKey - The Anthropic API key to validate
 * @returns Validation result with available models if valid
 */
export async function validateAnthropicKey(apiKey: string): Promise<AIKeyValidationResult> {
  if (!apiKey || !apiKey.startsWith('sk-ant-')) {
    return {
      valid: false,
      provider: 'claude',
      error: 'Invalid key format. Anthropic keys should start with "sk-ant-"',
    };
  }

  try {
    // Use a minimal messages request to validate the key
    // This costs a tiny amount but is the only reliable way to validate
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'Hi' }],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      if (response.status === 401) {
        return {
          valid: false,
          provider: 'claude',
          error: 'Invalid API key. Please check your key and try again.',
        };
      }

      if (response.status === 429) {
        // Rate limited but key is valid
        return {
          valid: true,
          provider: 'claude',
          models: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
          rateLimit: {
            requestsPerMinute: 0, // Temporarily exhausted
          },
        };
      }

      if (response.status === 400 && errorData.error?.type === 'invalid_request_error') {
        // Invalid request but key is valid
        return {
          valid: true,
          provider: 'claude',
          models: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
        };
      }

      return {
        valid: false,
        provider: 'claude',
        error: errorData.error?.message || `Validation failed with status ${response.status}`,
      };
    }

    // Successful response means key is valid
    return {
      valid: true,
      provider: 'claude',
      models: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
    };
  } catch (error) {
    console.error('[validateAnthropicKey] Network error:', error);
    return {
      valid: false,
      provider: 'claude',
      error: 'Network error. Please check your connection and try again.',
    };
  }
}

/**
 * Validate a Google AI (Gemini) API key
 *
 * @param apiKey - The Google AI API key to validate
 * @returns Validation result with available models if valid
 */
export async function validateGeminiKey(apiKey: string): Promise<AIKeyValidationResult> {
  if (!apiKey || apiKey.length < 30) {
    return {
      valid: false,
      provider: 'gemini',
      error: 'Invalid key format. Please enter a valid Google AI API key.',
    };
  }

  try {
    // Use the list models endpoint to validate
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      if (response.status === 400 || response.status === 403) {
        return {
          valid: false,
          provider: 'gemini',
          error: 'Invalid API key. Please check your key and try again.',
        };
      }

      if (response.status === 429) {
        return {
          valid: false,
          provider: 'gemini',
          error: 'Rate limited. Please wait a moment and try again.',
        };
      }

      return {
        valid: false,
        provider: 'gemini',
        error: errorData.error?.message || `Validation failed with status ${response.status}`,
      };
    }

    const data = await response.json();
    const models = (data.models || [])
      .filter((m: { name: string }) =>
        m.name.includes('gemini') &&
        (m.name.includes('flash') || m.name.includes('pro'))
      )
      .map((m: { name: string }) => m.name.replace('models/', ''));

    return {
      valid: true,
      provider: 'gemini',
      models: models.length > 0 ? models : ['gemini-2.0-flash', 'gemini-1.5-pro'],
    };
  } catch (error) {
    console.error('[validateGeminiKey] Network error:', error);
    return {
      valid: false,
      provider: 'gemini',
      error: 'Network error. Please check your connection and try again.',
    };
  }
}

/**
 * Validate an API key for any supported provider
 *
 * @param provider - The AI provider (openai, claude, gemini)
 * @param apiKey - The API key to validate
 * @returns Validation result with available models if valid
 */
export async function validateAPIKey(
  provider: AIModelProvider,
  apiKey: string
): Promise<AIKeyValidationResult> {
  switch (provider) {
    case 'openai':
      return validateOpenAIKey(apiKey);
    case 'claude':
      return validateAnthropicKey(apiKey);
    case 'gemini':
      return validateGeminiKey(apiKey);
    default:
      return {
        valid: false,
        provider,
        error: `Unsupported provider: ${provider}`,
      };
  }
}

/**
 * Get the last 4 characters of an API key for display purposes
 *
 * @param apiKey - The full API key
 * @returns The last 4 characters, or empty string if key is too short
 */
export function getKeyLastFour(apiKey: string): string {
  if (!apiKey || apiKey.length < 4) {
    return '';
  }
  return apiKey.slice(-4);
}

/**
 * Mask an API key for display, showing only the prefix and last 4 characters
 *
 * @param apiKey - The full API key
 * @returns Masked key like "sk-...7x9Z"
 */
export function maskAPIKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 8) {
    return '••••••••';
  }

  // Find the prefix (sk-, sk-ant-, etc.)
  const prefixMatch = apiKey.match(/^(sk-ant-|sk-|AIza)/);
  const prefix = prefixMatch ? prefixMatch[0] : '';
  const lastFour = apiKey.slice(-4);

  return `${prefix}...${lastFour}`;
}

/**
 * Provider display names and colors for UI
 */
export const PROVIDER_CONFIG: Record<AIModelProvider, {
  name: string;
  displayName: string;
  color: string;
  bgColor: string;
  keyPrefix: string;
  keyPlaceholder: string;
  docsUrl: string;
}> = {
  openai: {
    name: 'openai',
    displayName: 'OpenAI',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    keyPrefix: 'sk-',
    keyPlaceholder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    docsUrl: 'https://platform.openai.com/api-keys',
  },
  claude: {
    name: 'claude',
    displayName: 'Anthropic Claude',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    keyPrefix: 'sk-ant-',
    keyPlaceholder: 'sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    docsUrl: 'https://console.anthropic.com/settings/keys',
  },
  gemini: {
    name: 'gemini',
    displayName: 'Google Gemini',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    keyPrefix: 'AIza',
    keyPlaceholder: 'AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    docsUrl: 'https://aistudio.google.com/app/apikey',
  },
};
