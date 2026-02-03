/**
 * AI Provider Configuration and Management
 * Handles OAuth flow initiation, connection status, and provider validation
 *
 * Feature: F2, #90 - AI Model OAuth Connection
 *
 * ============================================================================
 * BACKEND API ENDPOINTS REQUIRED
 * ============================================================================
 *
 * The following API endpoints are needed to complete the AI provider OAuth flow
 * and securely store API keys. These should be implemented as Cloud Functions
 * or Next.js API routes.
 *
 * 1. POST /api/ai/providers/connect
 *    Purpose: Store an encrypted API key for a provider
 *    Request Body:
 *      {
 *        provider: 'openai' | 'anthropic' | 'google',
 *        apiKey: string,  // Will be encrypted and stored in GCP Secret Manager
 *        orgId: string
 *      }
 *    Response:
 *      { success: boolean, message: string }
 *    Security:
 *      - Requires authenticated user with admin permissions
 *      - API key should be encrypted before storage
 *      - Store in GCP Secret Manager, not Firestore
 *      - Only store last 4 digits in Firestore for display
 *
 * 2. POST /api/ai/providers/disconnect
 *    Purpose: Remove a stored API key
 *    Request Body:
 *      { provider: 'openai' | 'anthropic' | 'google' | 'ollama', orgId: string }
 *    Response:
 *      { success: boolean }
 *    Security:
 *      - Requires authenticated user with admin permissions
 *      - Revoke any OAuth tokens if applicable
 *      - Delete from Secret Manager
 *
 * 3. POST /api/ai/providers/validate
 *    Purpose: Server-side API key validation (more secure than client-side)
 *    Request Body:
 *      { provider: AIProviderType, apiKey: string }
 *    Response:
 *      { valid: boolean, models?: string[], error?: string }
 *    Security:
 *      - Rate limited to prevent abuse
 *      - API key not stored during validation
 *
 * 4. GET /api/ai/providers/status
 *    Purpose: Get connection status for all providers
 *    Query Params: orgId
 *    Response:
 *      {
 *        providers: {
 *          openai: { connected: boolean, lastUsed?: Date },
 *          anthropic: { connected: boolean, lastUsed?: Date },
 *          google: { connected: boolean, lastUsed?: Date },
 *          ollama: { connected: boolean, localUrl?: string }
 *        }
 *      }
 *
 * 5. POST /api/ai/providers/oauth/google/callback
 *    Purpose: Handle Google OAuth callback (if using OAuth instead of API key)
 *    Query Params: code, state
 *    Actions:
 *      - Validate state parameter against stored OAuth state
 *      - Exchange code for access token
 *      - Store refresh token in Secret Manager
 *      - Update Firestore with connection status
 *
 * ============================================================================
 * ENVIRONMENT VARIABLES REQUIRED
 * ============================================================================
 *
 * For API Key Storage:
 *   GCP_PROJECT_ID - Google Cloud project for Secret Manager
 *
 * For OAuth (if implementing Google OAuth):
 *   GOOGLE_AI_CLIENT_ID - OAuth client ID
 *   GOOGLE_AI_CLIENT_SECRET - OAuth client secret
 *   GOOGLE_AI_REDIRECT_URI - OAuth redirect URI
 *
 * ============================================================================
 */

import {
  AIProviderType,
  AIProviderConfig,
  AIProviderConnectionStatus,
  AIProviderValidationResult,
  AI_PROVIDER_INFO,
} from '@/types';
import { db } from '@/lib/firebase/config';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  deleteDoc,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';

// ============================================================================
// OAuth Configuration
// ============================================================================

/**
 * OAuth configuration for each provider
 * Note: These would typically come from environment variables in production
 */
export const OAUTH_CONFIGS: Record<AIProviderType, {
  authUrl?: string;
  tokenUrl?: string;
  scopes?: string[];
  supportsOAuth: boolean;
}> = {
  openai: {
    // OpenAI uses API keys, not OAuth
    supportsOAuth: false,
  },
  anthropic: {
    // Anthropic uses API keys, not OAuth
    supportsOAuth: false,
  },
  google: {
    // Google AI could use OAuth but typically uses API keys for Gemini
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['https://www.googleapis.com/auth/generative-language'],
    supportsOAuth: true,
  },
  ollama: {
    // Ollama is local, no OAuth
    supportsOAuth: false,
  },
};

/**
 * Default Ollama URL for local installations
 */
export const DEFAULT_OLLAMA_URL = 'http://localhost:11434';

// ============================================================================
// OAuth URL Generators
// ============================================================================

/**
 * Generate OAuth authorization URL for Google Gemini
 * Note: Requires backend callback endpoint to complete the flow
 */
export function generateGoogleOAuthUrl(
  clientId: string,
  redirectUri: string,
  state: string,
): string {
  const config = OAUTH_CONFIGS.google;
  if (!config.authUrl || !config.scopes) {
    throw new Error('Google OAuth not configured');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: config.scopes.join(' '),
    state,
    access_type: 'offline',
    prompt: 'consent',
  });

  return `${config.authUrl}?${params.toString()}`;
}

/**
 * Generate a secure state parameter for OAuth flows
 * This prevents CSRF attacks
 */
export function generateOAuthState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate PKCE code verifier and challenge
 * Used for enhanced OAuth security
 */
export async function generatePKCE(): Promise<{
  codeVerifier: string;
  codeChallenge: string;
}> {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const codeVerifier = Array.from(array as unknown as number[], (byte: number) =>
    byte.toString(16).padStart(2, '0')
  ).join('');

  // SHA-256 hash of the verifier
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const codeChallenge = btoa(String.fromCharCode.apply(null, hashArray))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return { codeVerifier, codeChallenge };
}

// ============================================================================
// Provider Validation
// ============================================================================

/**
 * Validate an OpenAI API key
 */
export async function validateOpenAIKey(apiKey: string): Promise<AIProviderValidationResult> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      const models = data.data?.map((m: { id: string }) => m.id) || [];
      return {
        valid: true,
        provider: 'openai',
        message: 'API key is valid',
        models: models.filter((m: string) => m.includes('gpt')),
      };
    } else {
      const error = await response.json();
      return {
        valid: false,
        provider: 'openai',
        message: 'Invalid API key',
        error: error.error?.message || 'Authentication failed',
      };
    }
  } catch (error) {
    return {
      valid: false,
      provider: 'openai',
      message: 'Failed to validate API key',
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Validate an Anthropic API key
 */
export async function validateAnthropicKey(apiKey: string): Promise<AIProviderValidationResult> {
  try {
    // Anthropic doesn't have a simple models endpoint, so we make a minimal completion request
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
        messages: [{ role: 'user', content: 'hi' }],
      }),
    });

    if (response.ok || response.status === 400) {
      // 400 might be for rate limiting but still indicates valid key
      return {
        valid: true,
        provider: 'anthropic',
        message: 'API key is valid',
        models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
      };
    } else if (response.status === 401) {
      return {
        valid: false,
        provider: 'anthropic',
        message: 'Invalid API key',
        error: 'Authentication failed',
      };
    } else {
      const error = await response.json().catch(() => ({}));
      return {
        valid: response.status !== 401,
        provider: 'anthropic',
        message: response.status === 401 ? 'Invalid API key' : 'API key may be valid',
        error: error.error?.message,
      };
    }
  } catch (error) {
    return {
      valid: false,
      provider: 'anthropic',
      message: 'Failed to validate API key',
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Validate a Google Gemini API key
 */
export async function validateGoogleKey(apiKey: string): Promise<AIProviderValidationResult> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
    );

    if (response.ok) {
      const data = await response.json();
      const models = data.models?.map((m: { name: string }) => m.name.replace('models/', '')) || [];
      return {
        valid: true,
        provider: 'google',
        message: 'API key is valid',
        models: models.filter((m: string) => m.includes('gemini')),
      };
    } else {
      const error = await response.json();
      return {
        valid: false,
        provider: 'google',
        message: 'Invalid API key',
        error: error.error?.message || 'Authentication failed',
      };
    }
  } catch (error) {
    return {
      valid: false,
      provider: 'google',
      message: 'Failed to validate API key',
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Validate an Ollama local installation
 */
export async function validateOllamaConnection(url: string): Promise<AIProviderValidationResult> {
  try {
    const normalizedUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    const response = await fetch(`${normalizedUrl}/api/tags`, {
      method: 'GET',
    });

    if (response.ok) {
      const data = await response.json();
      const models = data.models?.map((m: { name: string }) => m.name) || [];
      return {
        valid: true,
        provider: 'ollama',
        message: `Connected to Ollama at ${url}`,
        models,
      };
    } else {
      return {
        valid: false,
        provider: 'ollama',
        message: 'Failed to connect to Ollama',
        error: `Server returned status ${response.status}`,
      };
    }
  } catch (error) {
    return {
      valid: false,
      provider: 'ollama',
      message: 'Cannot connect to Ollama',
      error: error instanceof Error ? error.message : 'Connection failed. Is Ollama running?',
    };
  }
}

/**
 * Validate any provider's credentials
 */
export async function validateProviderCredentials(
  provider: AIProviderType,
  credential: string,
): Promise<AIProviderValidationResult> {
  switch (provider) {
    case 'openai':
      return validateOpenAIKey(credential);
    case 'anthropic':
      return validateAnthropicKey(credential);
    case 'google':
      return validateGoogleKey(credential);
    case 'ollama':
      return validateOllamaConnection(credential);
    default:
      return {
        valid: false,
        provider,
        message: 'Unknown provider',
        error: `Provider ${provider} is not supported`,
      };
  }
}

// ============================================================================
// Firestore Operations
// ============================================================================

/**
 * Get the Firestore path for provider configs
 */
function getProviderPath(orgId: string, provider?: AIProviderType): string {
  const basePath = `organizations/${orgId}/aiProviders`;
  return provider ? `${basePath}/${provider}` : basePath;
}

/**
 * Load all provider configurations for an organization
 */
export async function loadProviderConfigs(orgId: string): Promise<AIProviderConfig[]> {
  const colRef = collection(db, getProviderPath(orgId));
  const snapshot = await getDocs(colRef);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      connectionDate: data.connectionDate?.toDate?.(),
      lastUsedAt: data.lastUsedAt?.toDate?.(),
      lastErrorAt: data.lastErrorAt?.toDate?.(),
      createdAt: data.createdAt?.toDate?.() || new Date(),
      updatedAt: data.updatedAt?.toDate?.() || new Date(),
    } as AIProviderConfig;
  });
}

/**
 * Load a single provider configuration
 */
export async function loadProviderConfig(
  orgId: string,
  provider: AIProviderType,
): Promise<AIProviderConfig | null> {
  const docRef = doc(db, getProviderPath(orgId, provider));
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    ...data,
    id: docSnap.id,
    connectionDate: data.connectionDate?.toDate?.(),
    lastUsedAt: data.lastUsedAt?.toDate?.(),
    lastErrorAt: data.lastErrorAt?.toDate?.(),
    createdAt: data.createdAt?.toDate?.() || new Date(),
    updatedAt: data.updatedAt?.toDate?.() || new Date(),
  } as AIProviderConfig;
}

/**
 * Save or update a provider configuration
 */
export async function saveProviderConfig(
  orgId: string,
  provider: AIProviderType,
  config: Partial<AIProviderConfig>,
  userId: string,
): Promise<void> {
  const docRef = doc(db, getProviderPath(orgId, provider));
  const existing = await getDoc(docRef);

  const now = Timestamp.now();

  if (existing.exists()) {
    await updateDoc(docRef, {
      ...config,
      updatedAt: now,
      updatedBy: userId,
    });
  } else {
    await setDoc(docRef, {
      id: provider,
      orgId,
      provider,
      connected: false,
      connectionStatus: 'disconnected',
      hasApiKey: false,
      isLocalProvider: provider === 'ollama',
      totalRequests: 0,
      totalTokens: 0,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      updatedBy: userId,
      ...config,
    });
  }
}

/**
 * Disconnect a provider (remove credentials, keep config)
 */
export async function disconnectProvider(
  orgId: string,
  provider: AIProviderType,
  userId: string,
): Promise<void> {
  const docRef = doc(db, getProviderPath(orgId, provider));

  await updateDoc(docRef, {
    connected: false,
    connectionStatus: 'disconnected',
    hasApiKey: false,
    apiKeyLastFour: null,
    localUrl: provider === 'ollama' ? DEFAULT_OLLAMA_URL : null,
    availableModels: null,
    defaultModelId: null,
    updatedAt: Timestamp.now(),
    updatedBy: userId,
  });
}

/**
 * Delete a provider configuration entirely
 */
export async function deleteProviderConfig(
  orgId: string,
  provider: AIProviderType,
): Promise<void> {
  const docRef = doc(db, getProviderPath(orgId, provider));
  await deleteDoc(docRef);
}

/**
 * Subscribe to provider configuration changes
 */
export function subscribeToProviderConfigs(
  orgId: string,
  onUpdate: (configs: AIProviderConfig[]) => void,
  onError: (error: Error) => void,
): () => void {
  const colRef = collection(db, getProviderPath(orgId));

  return onSnapshot(
    colRef,
    (snapshot) => {
      const configs = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          connectionDate: data.connectionDate?.toDate?.(),
          lastUsedAt: data.lastUsedAt?.toDate?.(),
          lastErrorAt: data.lastErrorAt?.toDate?.(),
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
        } as AIProviderConfig;
      });
      onUpdate(configs);
    },
    onError,
  );
}

// ============================================================================
// Connection Status Helpers
// ============================================================================

/**
 * Get a human-readable status message
 */
export function getStatusMessage(status: AIProviderConnectionStatus): string {
  switch (status) {
    case 'connected':
      return 'Connected and ready';
    case 'disconnected':
      return 'Not connected';
    case 'pending':
      return 'Connection pending...';
    case 'error':
      return 'Connection error';
    default:
      return 'Unknown status';
  }
}

/**
 * Get status badge colors for UI display
 */
export function getStatusColors(status: AIProviderConnectionStatus): {
  bg: string;
  text: string;
  dot: string;
} {
  switch (status) {
    case 'connected':
      return { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' };
    case 'disconnected':
      return { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' };
    case 'pending':
      return { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' };
    case 'error':
      return { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' };
  }
}

/**
 * Check if any provider is connected
 */
export function hasAnyProviderConnected(configs: AIProviderConfig[]): boolean {
  return configs.some((c) => c.connected && c.connectionStatus === 'connected');
}

/**
 * Get the list of all supported providers
 */
export function getSupportedProviders(): AIProviderType[] {
  return ['openai', 'anthropic', 'google', 'ollama'];
}

/**
 * Get provider display info
 */
export function getProviderInfo(provider: AIProviderType) {
  return AI_PROVIDER_INFO[provider];
}

// ============================================================================
// API Key Utilities
// ============================================================================

/**
 * Mask an API key for display (show only last 4 characters)
 */
export function maskApiKey(key: string): string {
  if (!key || key.length < 8) return '****';
  return '****' + key.slice(-4);
}

/**
 * Extract last 4 characters of an API key for storage
 */
export function getApiKeyLastFour(key: string): string {
  if (!key || key.length < 4) return '';
  return key.slice(-4);
}

/**
 * Check if a string looks like an API key for a specific provider
 */
export function isValidKeyFormat(provider: AIProviderType, key: string): boolean {
  switch (provider) {
    case 'openai':
      return key.startsWith('sk-') && key.length > 20;
    case 'anthropic':
      return key.startsWith('sk-ant-') && key.length > 20;
    case 'google':
      return key.length > 20;
    case 'ollama':
      // Ollama uses URLs, not API keys
      try {
        new URL(key);
        return true;
      } catch {
        return false;
      }
    default:
      return false;
  }
}
