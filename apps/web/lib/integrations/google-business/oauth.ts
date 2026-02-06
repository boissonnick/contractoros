/**
 * Google Business Profile OAuth 2.0 Implementation
 * Sprint 75: Review monitoring integration
 *
 * Follows the same pattern as QuickBooks OAuth implementation.
 */

import { adminDb } from '@/lib/firebase/admin';
import {
  GoogleBusinessOAuthConfig,
  GoogleBusinessAuthState,
  GoogleBusinessTokens,
  GOOGLE_OAUTH_ENDPOINTS,
  GOOGLE_BUSINESS_SCOPES,
} from './types';

// OAuth Configuration
const getOAuthConfig = (): GoogleBusinessOAuthConfig => {
  const clientId = process.env.GOOGLE_BUSINESS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_BUSINESS_CLIENT_SECRET;
  const redirectUri =
    process.env.GOOGLE_BUSINESS_REDIRECT_URI ||
    `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google-business/callback`;

  if (!clientId || !clientSecret) {
    throw new Error(
      'Google Business OAuth configuration is incomplete. Check environment variables.'
    );
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
  };
};

/**
 * Check if Google Business integration is configured
 */
export function isGoogleBusinessConfigured(): boolean {
  try {
    getOAuthConfig();
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate the OAuth authorization URL
 */
export function getAuthorizationUrl(state: GoogleBusinessAuthState): string {
  const config = getOAuthConfig();

  // Encode state as base64 JSON
  const stateString = Buffer.from(JSON.stringify(state)).toString('base64url');

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: GOOGLE_BUSINESS_SCOPES.join(' '),
    state: stateString,
    access_type: 'offline',
    prompt: 'consent', // Force consent to get refresh token
  });

  return `${GOOGLE_OAUTH_ENDPOINTS.authorize}?${params.toString()}`;
}

/**
 * Decode the state parameter from the OAuth callback
 */
export function decodeAuthState(stateString: string): GoogleBusinessAuthState {
  try {
    const decoded = Buffer.from(stateString, 'base64url').toString('utf-8');
    return JSON.parse(decoded) as GoogleBusinessAuthState;
  } catch {
    throw new Error('Invalid OAuth state parameter');
  }
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(
  code: string
): Promise<GoogleBusinessTokens> {
  const config = getOAuthConfig();

  const response = await fetch(GOOGLE_OAUTH_ENDPOINTS.token, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.redirectUri,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Google token exchange failed:', errorText);
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
    scope: data.scope,
  };
}

/**
 * Refresh an expired access token
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<Omit<GoogleBusinessTokens, 'refreshToken'>> {
  const config = getOAuthConfig();

  const response = await fetch(GOOGLE_OAUTH_ENDPOINTS.token, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Google token refresh failed:', errorText);
    throw new Error(`Failed to refresh token: ${response.status}`);
  }

  const data = await response.json();

  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + data.expires_in);

  return {
    accessToken: data.access_token,
    tokenType: data.token_type,
    expiresIn: data.expires_in,
    expiresAt,
    scope: data.scope,
  };
}

/**
 * Revoke tokens (disconnect)
 */
export async function revokeTokens(token: string): Promise<void> {
  const response = await fetch(
    `${GOOGLE_OAUTH_ENDPOINTS.revoke}?token=${token}`,
    {
      method: 'POST',
    }
  );

  if (!response.ok) {
    console.error('Google token revocation failed:', await response.text());
    // Don't throw - we still want to clear local data
  }
}

/**
 * Store connection in Firestore
 */
export async function storeConnection(
  orgId: string,
  tokens: GoogleBusinessTokens,
  accountId: string,
  locationId: string,
  locationName: string,
  connectedBy: string
): Promise<string> {
  const connectionRef = adminDb
    .collection('organizations')
    .doc(orgId)
    .collection('googleBusinessConnections')
    .doc(locationId); // Use locationId as doc ID for easy lookup

  await connectionRef.set({
    orgId,
    accountId,
    locationId,
    locationName,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: tokens.expiresAt,
    connectedAt: new Date(),
    connectedBy,
    lastSyncAt: null,
    lastSyncStatus: null,
    lastSyncError: null,
  });

  return connectionRef.id;
}

/**
 * Get stored connection from Firestore
 */
export async function getConnection(
  orgId: string,
  connectionId?: string
): Promise<{
  isConnected: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  locationId?: string;
  locationName?: string;
} | null> {
  const connectionsRef = adminDb
    .collection('organizations')
    .doc(orgId)
    .collection('googleBusinessConnections');

  let doc;
  if (connectionId) {
    doc = await connectionsRef.doc(connectionId).get();
  } else {
    // Get first connection
    const snapshot = await connectionsRef.limit(1).get();
    if (snapshot.empty) return null;
    doc = snapshot.docs[0];
  }

  if (!doc.exists) {
    return null;
  }

  const data = doc.data();
  return {
    isConnected: true,
    accessToken: data?.accessToken,
    refreshToken: data?.refreshToken,
    expiresAt: data?.expiresAt?.toDate(),
    locationId: data?.locationId,
    locationName: data?.locationName,
  };
}

/**
 * Update tokens after refresh
 */
export async function updateTokens(
  orgId: string,
  connectionId: string,
  tokens: Omit<GoogleBusinessTokens, 'refreshToken' | 'scope'>
): Promise<void> {
  const connectionRef = adminDb
    .collection('organizations')
    .doc(orgId)
    .collection('googleBusinessConnections')
    .doc(connectionId);

  await connectionRef.update({
    accessToken: tokens.accessToken,
    expiresAt: tokens.expiresAt,
  });
}

/**
 * Delete connection (disconnect)
 */
export async function deleteConnection(
  orgId: string,
  connectionId: string
): Promise<void> {
  const connectionRef = adminDb
    .collection('organizations')
    .doc(orgId)
    .collection('googleBusinessConnections')
    .doc(connectionId);

  // Get existing connection to revoke tokens
  const doc = await connectionRef.get();
  if (doc.exists) {
    const data = doc.data();
    if (data?.accessToken) {
      try {
        await revokeTokens(data.accessToken);
      } catch (error) {
        console.error('Failed to revoke Google tokens:', error);
      }
    }
  }

  await connectionRef.delete();
}

/**
 * Get a valid access token, refreshing if necessary
 */
export async function getValidAccessToken(
  orgId: string,
  connectionId?: string
): Promise<{
  accessToken: string;
  locationId: string;
} | null> {
  const connection = await getConnection(orgId, connectionId);

  if (
    !connection ||
    !connection.isConnected ||
    !connection.accessToken ||
    !connection.locationId
  ) {
    return null;
  }

  // Check if token is expired (with 5-minute buffer)
  const now = new Date();
  const bufferTime = 5 * 60 * 1000; // 5 minutes
  const tokenExpiresAt = connection.expiresAt || new Date(0);

  if (now.getTime() > tokenExpiresAt.getTime() - bufferTime) {
    // Token is expired or about to expire, refresh it
    if (!connection.refreshToken) {
      console.error('No refresh token available');
      return null;
    }

    try {
      const newTokens = await refreshAccessToken(connection.refreshToken);
      await updateTokens(orgId, connection.locationId, newTokens);
      return {
        accessToken: newTokens.accessToken,
        locationId: connection.locationId,
      };
    } catch (error) {
      console.error('Failed to refresh Google token:', error);
      return null;
    }
  }

  return {
    accessToken: connection.accessToken,
    locationId: connection.locationId,
  };
}

/**
 * Generate a cryptographically secure nonce
 */
export function generateNonce(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join(
    ''
  );
}
