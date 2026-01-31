/**
 * QuickBooks Online OAuth 2.0 Implementation
 *
 * Handles OAuth flow, token management, and token refresh for QBO integration.
 */

import { adminDb } from '@/lib/firebase/admin';
import {
  QBOAuthConfig,
  QBOAuthState,
  QBOTokens,
  QBO_AUTH_ENDPOINTS,
  QBO_SCOPES,
} from './types';

// OAuth Configuration
const getOAuthConfig = (): QBOAuthConfig => {
  const clientId = process.env.QUICKBOOKS_CLIENT_ID;
  const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET;
  const redirectUri = process.env.QUICKBOOKS_REDIRECT_URI;
  const environment = (process.env.QUICKBOOKS_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox';

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('QuickBooks OAuth configuration is incomplete. Check environment variables.');
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
    environment,
  };
};

/**
 * Check if QuickBooks integration is configured
 */
export function isQuickBooksConfigured(): boolean {
  try {
    getOAuthConfig();
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate the OAuth authorization URL
 * Returns the URL to redirect the user to for authorization
 */
export function getAuthorizationUrl(state: QBOAuthState): string {
  const config = getOAuthConfig();

  // Encode state as base64 JSON
  const stateString = Buffer.from(JSON.stringify(state)).toString('base64url');

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: QBO_SCOPES.join(' '),
    state: stateString,
  });

  return `${QBO_AUTH_ENDPOINTS.authorize}?${params.toString()}`;
}

/**
 * Decode the state parameter from the OAuth callback
 */
export function decodeAuthState(stateString: string): QBOAuthState {
  try {
    const decoded = Buffer.from(stateString, 'base64url').toString('utf-8');
    return JSON.parse(decoded) as QBOAuthState;
  } catch (error) {
    throw new Error('Invalid OAuth state parameter');
  }
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(
  code: string,
  realmId: string
): Promise<QBOTokens> {
  const config = getOAuthConfig();

  const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');

  const response = await fetch(QBO_AUTH_ENDPOINTS.token, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.redirectUri,
    }).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('QBO token exchange failed:', errorText);
    throw new Error(`Failed to exchange code for tokens: ${response.status}`);
  }

  const data = await response.json();

  // Calculate token expiration time
  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + data.expires_in);

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    tokenType: data.token_type,
    expiresIn: data.expires_in,
    expiresAt,
    realmId,
  };
}

/**
 * Refresh an expired access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<QBOTokens & { realmId: string }> {
  const config = getOAuthConfig();

  const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');

  const response = await fetch(QBO_AUTH_ENDPOINTS.token, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('QBO token refresh failed:', errorText);
    throw new Error(`Failed to refresh token: ${response.status}`);
  }

  const data = await response.json();

  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + data.expires_in);

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    tokenType: data.token_type,
    expiresIn: data.expires_in,
    expiresAt,
    realmId: '', // Will be set by caller
  };
}

/**
 * Revoke tokens (disconnect)
 */
export async function revokeTokens(refreshToken: string): Promise<void> {
  const config = getOAuthConfig();

  const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');

  const response = await fetch(QBO_AUTH_ENDPOINTS.revoke, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      token: refreshToken,
    }).toString(),
  });

  if (!response.ok) {
    console.error('QBO token revocation failed:', await response.text());
    // Don't throw - we still want to clear local data
  }
}

/**
 * Store connection in Firestore
 */
export async function storeConnection(
  orgId: string,
  tokens: QBOTokens,
  companyName?: string
): Promise<string> {
  const connectionRef = adminDb
    .collection('organizations')
    .doc(orgId)
    .collection('accountingConnections')
    .doc('quickbooks');

  await connectionRef.set({
    provider: 'quickbooks',
    isConnected: true,
    companyId: tokens.realmId,
    companyName: companyName || 'Unknown Company',
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    tokenExpiresAt: tokens.expiresAt,
    lastSyncAt: null,
    lastSyncStatus: 'idle',
    syncSettings: {
      autoSyncInvoices: true,
      autoSyncExpenses: false,
      autoSyncPayments: true,
      syncFrequency: 'manual',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return connectionRef.id;
}

/**
 * Get stored connection from Firestore
 */
export async function getConnection(orgId: string): Promise<{
  isConnected: boolean;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  realmId?: string;
  companyName?: string;
} | null> {
  const connectionRef = adminDb
    .collection('organizations')
    .doc(orgId)
    .collection('accountingConnections')
    .doc('quickbooks');

  const doc = await connectionRef.get();

  if (!doc.exists) {
    return null;
  }

  const data = doc.data();
  return {
    isConnected: data?.isConnected ?? false,
    accessToken: data?.accessToken,
    refreshToken: data?.refreshToken,
    tokenExpiresAt: data?.tokenExpiresAt?.toDate(),
    realmId: data?.companyId,
    companyName: data?.companyName,
  };
}

/**
 * Update tokens after refresh
 */
export async function updateTokens(
  orgId: string,
  tokens: Omit<QBOTokens, 'realmId'>
): Promise<void> {
  const connectionRef = adminDb
    .collection('organizations')
    .doc(orgId)
    .collection('accountingConnections')
    .doc('quickbooks');

  await connectionRef.update({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    tokenExpiresAt: tokens.expiresAt,
    updatedAt: new Date(),
  });
}

/**
 * Delete connection (disconnect)
 */
export async function deleteConnection(orgId: string): Promise<void> {
  const connectionRef = adminDb
    .collection('organizations')
    .doc(orgId)
    .collection('accountingConnections')
    .doc('quickbooks');

  // Get existing connection to revoke tokens
  const doc = await connectionRef.get();
  if (doc.exists) {
    const data = doc.data();
    if (data?.refreshToken) {
      try {
        await revokeTokens(data.refreshToken);
      } catch (error) {
        console.error('Failed to revoke QBO tokens:', error);
      }
    }
  }

  await connectionRef.delete();
}

/**
 * Get a valid access token, refreshing if necessary
 */
export async function getValidAccessToken(orgId: string): Promise<{
  accessToken: string;
  realmId: string;
} | null> {
  const connection = await getConnection(orgId);

  if (!connection || !connection.isConnected || !connection.accessToken || !connection.realmId) {
    return null;
  }

  // Check if token is expired (with 5-minute buffer)
  const now = new Date();
  const bufferTime = 5 * 60 * 1000; // 5 minutes
  const tokenExpiresAt = connection.tokenExpiresAt || new Date(0);

  if (now.getTime() > tokenExpiresAt.getTime() - bufferTime) {
    // Token is expired or about to expire, refresh it
    if (!connection.refreshToken) {
      console.error('No refresh token available');
      return null;
    }

    try {
      const newTokens = await refreshAccessToken(connection.refreshToken);
      await updateTokens(orgId, newTokens);
      return {
        accessToken: newTokens.accessToken,
        realmId: connection.realmId,
      };
    } catch (error) {
      console.error('Failed to refresh QBO token:', error);
      return null;
    }
  }

  return {
    accessToken: connection.accessToken,
    realmId: connection.realmId,
  };
}

/**
 * Generate a cryptographically secure nonce
 */
export function generateNonce(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
