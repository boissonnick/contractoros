/**
 * @fileoverview Google Business Profile Connection Hook
 * Sprint 75: OAuth connection management for review monitoring
 *
 * This module exports hooks for managing Google Business Profile integrations:
 * - useGoogleBusiness: Connection management and OAuth
 * - useGoogleBusinessLocations: Fetch available locations for selection
 *
 * Uses shared utilities:
 * - convertTimestamps from lib/firebase/timestamp-converter.ts
 * - useFirestoreCollection from lib/hooks/useFirestoreCollection.ts
 * - useFirestoreCrud from lib/hooks/useFirestoreCrud.ts
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { orderBy } from 'firebase/firestore';
import { convertTimestamps } from '@/lib/firebase/timestamp-converter';
import { useFirestoreCollection, createConverter } from '@/lib/hooks/useFirestoreCollection';
import { useFirestoreCrud } from '@/lib/hooks/useFirestoreCrud';
import { GoogleBusinessConnection } from '@/types/review';
import { logger } from '@/lib/utils/logger';

// =============================================================================
// COLLECTION PATH
// =============================================================================

const getConnectionsPath = (orgId: string) => `organizations/${orgId}/googleBusinessConnections`;

// =============================================================================
// DATE FIELDS FOR CONVERSION
// =============================================================================

const CONNECTION_DATE_FIELDS = ['expiresAt', 'connectedAt', 'lastSyncAt'] as const;

// =============================================================================
// CONVERTER
// =============================================================================

const connectionConverter = createConverter<GoogleBusinessConnection>((id, data) => ({
  id,
  ...convertTimestamps(data as Record<string, unknown>, CONNECTION_DATE_FIELDS),
} as GoogleBusinessConnection));

// =============================================================================
// useGoogleBusiness - Connection management
// =============================================================================

interface UseGoogleBusinessReturn {
  connections: GoogleBusinessConnection[];
  loading: boolean;
  error: Error | null;
  isConnected: boolean;
  primaryConnection: GoogleBusinessConnection | null;
  initiateOAuth: () => void;
  disconnect: (connectionId: string) => Promise<void>;
  refresh: () => void;
}

/**
 * Hook for managing Google Business Profile OAuth connections.
 *
 * @param {string} orgId - Organization ID
 * @returns {UseGoogleBusinessReturn} Connections data and OAuth operations
 *
 * @example
 * const { isConnected, primaryConnection, initiateOAuth, disconnect } = useGoogleBusiness(orgId);
 *
 * if (!isConnected) {
 *   return <Button onClick={initiateOAuth}>Connect Google Business</Button>;
 * }
 *
 * return (
 *   <div>
 *     Connected: {primaryConnection?.locationName}
 *     <Button onClick={() => disconnect(primaryConnection.id)}>Disconnect</Button>
 *   </div>
 * );
 */
export function useGoogleBusiness(orgId: string): UseGoogleBusinessReturn {
  const constraints = useMemo(() => [orderBy('connectedAt', 'desc')], []);

  // Use shared collection hook
  const { items: connections, loading, error, refetch } = useFirestoreCollection<GoogleBusinessConnection>({
    path: getConnectionsPath(orgId),
    constraints,
    converter: connectionConverter,
    enabled: !!orgId,
  });

  // Use shared CRUD hook for delete operations
  const { remove } = useFirestoreCrud<GoogleBusinessConnection>(
    getConnectionsPath(orgId),
    { entityName: 'Google Business connection', showToast: true }
  );

  const isConnected = connections.length > 0;
  const primaryConnection = connections[0] || null;

  const initiateOAuth = useCallback(() => {
    if (!orgId) {
      logger.error('Cannot initiate OAuth without organization ID', { hook: 'useGoogleBusiness' });
      return;
    }
    // Redirect to OAuth initiation endpoint
    window.location.href = `/api/integrations/google-business/authorize?orgId=${encodeURIComponent(orgId)}`;
  }, [orgId]);

  const disconnect = useCallback(
    async (connectionId: string) => {
      if (!orgId) throw new Error('Organization ID required');

      // Call disconnect API to revoke tokens
      try {
        const response = await fetch('/api/integrations/google-business/disconnect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orgId, connectionId }),
        });

        if (!response.ok) {
          logger.error('Failed to revoke Google OAuth tokens', { hook: 'useGoogleBusiness' });
        }
      } catch (err) {
        // Log but continue - still delete the connection document
        logger.error('Error calling disconnect API', { error: err, hook: 'useGoogleBusiness' });
      }

      // Delete connection document from Firestore
      await remove(connectionId);
    },
    [orgId, remove]
  );

  return {
    connections,
    loading,
    error,
    isConnected,
    primaryConnection,
    initiateOAuth,
    disconnect,
    refresh: refetch,
  };
}

// =============================================================================
// useGoogleBusinessLocations - Fetch available locations
// =============================================================================

/**
 * Google Business location for selection
 */
export interface GoogleBusinessLocation {
  /** Full resource name from Google API */
  name: string;
  /** Location ID extracted from resource name */
  locationId: string;
  /** Display title/name of the location */
  title: string;
  /** Formatted address */
  address: string;
}

interface UseGoogleBusinessLocationsReturn {
  locations: GoogleBusinessLocation[];
  loading: boolean;
  error: Error | null;
  fetchLocations: () => Promise<void>;
}

/**
 * Hook for fetching available Google Business locations.
 * Locations are fetched on-demand via fetchLocations(), not automatically.
 *
 * @param {string} orgId - Organization ID
 * @returns {UseGoogleBusinessLocationsReturn} Locations data and fetch operation
 *
 * @example
 * const { locations, loading, fetchLocations } = useGoogleBusinessLocations(orgId);
 *
 * useEffect(() => {
 *   fetchLocations();
 * }, [fetchLocations]);
 *
 * return (
 *   <select>
 *     {locations.map(loc => (
 *       <option key={loc.locationId} value={loc.locationId}>
 *         {loc.title} - {loc.address}
 *       </option>
 *     ))}
 *   </select>
 * );
 */
export function useGoogleBusinessLocations(orgId: string): UseGoogleBusinessLocationsReturn {
  const [locations, setLocations] = useState<GoogleBusinessLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchLocations = useCallback(async () => {
    if (!orgId) {
      setError(new Error('Organization ID required'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/integrations/google-business/locations?orgId=${encodeURIComponent(orgId)}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch locations');
      }

      const data = await response.json();
      setLocations(data.locations || []);
    } catch (err) {
      logger.error('Error fetching Google Business locations', { error: err, hook: 'useGoogleBusiness' });
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  return { locations, loading, error, fetchLocations };
}

// =============================================================================
// SYNC STATUS TYPES
// =============================================================================

export type GoogleBusinessSyncStatus = 'success' | 'error';

export const GOOGLE_BUSINESS_SYNC_STATUS_LABELS: Record<GoogleBusinessSyncStatus, string> = {
  success: 'Synced',
  error: 'Sync Error',
};
