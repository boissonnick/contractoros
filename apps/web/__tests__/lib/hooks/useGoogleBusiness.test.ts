/**
 * @fileoverview Unit tests for useGoogleBusiness hooks
 * Sprint 77: Unit Test Coverage
 *
 * Tests cover:
 * - useGoogleBusiness: OAuth connection management
 * - useGoogleBusinessLocations: Fetch available locations
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import {
  useGoogleBusiness,
  useGoogleBusinessLocations,
  GoogleBusinessLocation,
} from '@/lib/hooks/useGoogleBusiness';
import { GoogleBusinessConnection } from '@/types/review';

// =============================================================================
// MOCKS
// =============================================================================

// Mock Firestore
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn((field, dir) => ({ field, dir, _type: 'orderBy' })),
  onSnapshot: jest.fn(),
}));

jest.mock('@/lib/firebase/config', () => ({
  db: {},
}));

// Mock useFirestoreCollection
const mockRefetch = jest.fn();
jest.mock('@/lib/hooks/useFirestoreCollection', () => ({
  useFirestoreCollection: jest.fn(),
  createConverter: jest.fn((fn) => fn),
}));

// Mock useFirestoreCrud
const mockRemove = jest.fn();
jest.mock('@/lib/hooks/useFirestoreCrud', () => ({
  useFirestoreCrud: jest.fn(() => ({
    create: jest.fn(),
    update: jest.fn(),
    remove: mockRemove,
  })),
}));

// Mock fetch for API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Import mocked modules for assertions
import { useFirestoreCollection } from '@/lib/hooks/useFirestoreCollection';
import { useFirestoreCrud } from '@/lib/hooks/useFirestoreCrud';

const mockUseFirestoreCollection = useFirestoreCollection as jest.Mock;

// =============================================================================
// TEST DATA
// =============================================================================

const mockOrgId = 'test-org-123';

const createMockConnection = (overrides: Partial<GoogleBusinessConnection> = {}): GoogleBusinessConnection => ({
  id: `conn-${Math.random().toString(36).slice(2)}`,
  orgId: mockOrgId,
  accountId: 'account-123',
  locationId: 'location-456',
  locationName: 'Test Business Location',
  accessToken: 'test-access-token',
  refreshToken: 'test-refresh-token',
  expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
  connectedAt: new Date(),
  ...overrides,
});

const createMockLocation = (overrides: Partial<GoogleBusinessLocation> = {}): GoogleBusinessLocation => ({
  name: 'accounts/123/locations/456',
  locationId: '456',
  title: 'Test Business',
  address: '123 Main St, City, State 12345',
  ...overrides,
});

// =============================================================================
// SETUP AND TEARDOWN
// =============================================================================

beforeEach(() => {
  jest.clearAllMocks();

  // Default mock for useFirestoreCollection
  mockUseFirestoreCollection.mockReturnValue({
    items: [],
    loading: false,
    error: null,
    refetch: mockRefetch,
  });

  // Default mock implementations
  mockRemove.mockResolvedValue(undefined);
  mockFetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({}),
  });
});

// =============================================================================
// useGoogleBusiness TESTS
// =============================================================================

describe('useGoogleBusiness', () => {
  describe('basic functionality', () => {
    it('should return empty connections when no data', () => {
      const { result } = renderHook(() => useGoogleBusiness(mockOrgId));

      expect(result.current.connections).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.isConnected).toBe(false);
      expect(result.current.primaryConnection).toBe(null);
    });

    it('should return connections from Firestore', () => {
      const mockConnections = [
        createMockConnection({ id: 'conn-1' }),
        createMockConnection({ id: 'conn-2' }),
      ];

      mockUseFirestoreCollection.mockReturnValue({
        items: mockConnections,
        loading: false,
        error: null,
        refetch: mockRefetch,
      });

      const { result } = renderHook(() => useGoogleBusiness(mockOrgId));

      expect(result.current.connections).toHaveLength(2);
      expect(result.current.isConnected).toBe(true);
      expect(result.current.primaryConnection?.id).toBe('conn-1');
    });

    it('should show loading state', () => {
      mockUseFirestoreCollection.mockReturnValue({
        items: [],
        loading: true,
        error: null,
        refetch: mockRefetch,
      });

      const { result } = renderHook(() => useGoogleBusiness(mockOrgId));

      expect(result.current.loading).toBe(true);
    });

    it('should show error state', () => {
      const error = new Error('Firestore error');
      mockUseFirestoreCollection.mockReturnValue({
        items: [],
        loading: false,
        error,
        refetch: mockRefetch,
      });

      const { result } = renderHook(() => useGoogleBusiness(mockOrgId));

      expect(result.current.error).toBe(error);
    });

    it('should not fetch without orgId', () => {
      renderHook(() => useGoogleBusiness(''));

      expect(mockUseFirestoreCollection).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: false,
        })
      );
    });

    it('should order connections by connectedAt desc', () => {
      renderHook(() => useGoogleBusiness(mockOrgId));

      expect(mockUseFirestoreCollection).toHaveBeenCalledWith(
        expect.objectContaining({
          constraints: expect.arrayContaining([
            expect.objectContaining({ field: 'connectedAt', dir: 'desc' }),
          ]),
        })
      );
    });
  });

  describe('isConnected and primaryConnection', () => {
    it('should return isConnected=true when connections exist', () => {
      mockUseFirestoreCollection.mockReturnValue({
        items: [createMockConnection()],
        loading: false,
        error: null,
        refetch: mockRefetch,
      });

      const { result } = renderHook(() => useGoogleBusiness(mockOrgId));

      expect(result.current.isConnected).toBe(true);
    });

    it('should return isConnected=false when no connections', () => {
      mockUseFirestoreCollection.mockReturnValue({
        items: [],
        loading: false,
        error: null,
        refetch: mockRefetch,
      });

      const { result } = renderHook(() => useGoogleBusiness(mockOrgId));

      expect(result.current.isConnected).toBe(false);
    });

    it('should return first connection as primaryConnection', () => {
      const connections = [
        createMockConnection({ id: 'conn-first', locationName: 'First Location' }),
        createMockConnection({ id: 'conn-second', locationName: 'Second Location' }),
      ];

      mockUseFirestoreCollection.mockReturnValue({
        items: connections,
        loading: false,
        error: null,
        refetch: mockRefetch,
      });

      const { result } = renderHook(() => useGoogleBusiness(mockOrgId));

      expect(result.current.primaryConnection?.id).toBe('conn-first');
      expect(result.current.primaryConnection?.locationName).toBe('First Location');
    });

    it('should return null primaryConnection when no connections', () => {
      mockUseFirestoreCollection.mockReturnValue({
        items: [],
        loading: false,
        error: null,
        refetch: mockRefetch,
      });

      const { result } = renderHook(() => useGoogleBusiness(mockOrgId));

      expect(result.current.primaryConnection).toBe(null);
    });
  });

  describe('initiateOAuth', () => {
    it('should return a function that can be called', () => {
      const { result } = renderHook(() => useGoogleBusiness(mockOrgId));

      expect(typeof result.current.initiateOAuth).toBe('function');
    });

    it('should log error when called without orgId', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const { result } = renderHook(() => useGoogleBusiness(''));

      act(() => {
        result.current.initiateOAuth();
      });

      expect(consoleSpy).toHaveBeenCalledWith('Cannot initiate OAuth without organization ID');
      consoleSpy.mockRestore();
    });

    it('should not log error when orgId is provided', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const { result } = renderHook(() => useGoogleBusiness(mockOrgId));

      // Note: This will attempt to set window.location.href which may fail in test environment
      // We're primarily testing that no error is logged when orgId is present
      try {
        act(() => {
          result.current.initiateOAuth();
        });
      } catch {
        // Expected in test environment
      }

      expect(consoleSpy).not.toHaveBeenCalledWith('Cannot initiate OAuth without organization ID');
      consoleSpy.mockRestore();
    });
  });

  describe('disconnect', () => {
    it('should call disconnect API and remove connection', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const { result } = renderHook(() => useGoogleBusiness(mockOrgId));

      await act(async () => {
        await result.current.disconnect('conn-1');
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/integrations/google-business/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId: mockOrgId, connectionId: 'conn-1' }),
      });

      expect(mockRemove).toHaveBeenCalledWith('conn-1');
    });

    it('should still remove connection when API fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'API error' }),
      });

      const { result } = renderHook(() => useGoogleBusiness(mockOrgId));

      await act(async () => {
        await result.current.disconnect('conn-1');
      });

      expect(consoleSpy).toHaveBeenCalledWith('Failed to revoke Google OAuth tokens');
      expect(mockRemove).toHaveBeenCalledWith('conn-1');
      consoleSpy.mockRestore();
    });

    it('should still remove connection when fetch throws', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockFetch.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useGoogleBusiness(mockOrgId));

      await act(async () => {
        await result.current.disconnect('conn-1');
      });

      expect(consoleSpy).toHaveBeenCalledWith('Error calling disconnect API:', expect.any(Error));
      expect(mockRemove).toHaveBeenCalledWith('conn-1');
      consoleSpy.mockRestore();
    });

    it('should throw error without orgId', async () => {
      const { result } = renderHook(() => useGoogleBusiness(''));

      await expect(result.current.disconnect('conn-1')).rejects.toThrow('Organization ID required');
    });
  });

  describe('refresh', () => {
    it('should call refetch', () => {
      const { result } = renderHook(() => useGoogleBusiness(mockOrgId));

      result.current.refresh();

      expect(mockRefetch).toHaveBeenCalled();
    });
  });
});

// =============================================================================
// useGoogleBusinessLocations TESTS
// =============================================================================

describe('useGoogleBusinessLocations', () => {
  describe('initial state', () => {
    it('should return empty locations initially', () => {
      const { result } = renderHook(() => useGoogleBusinessLocations(mockOrgId));

      expect(result.current.locations).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe('fetchLocations', () => {
    it('should fetch locations from API', async () => {
      const mockLocations = [
        createMockLocation({ locationId: '1', title: 'Location 1' }),
        createMockLocation({ locationId: '2', title: 'Location 2' }),
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ locations: mockLocations }),
      });

      const { result } = renderHook(() => useGoogleBusinessLocations(mockOrgId));

      await act(async () => {
        await result.current.fetchLocations();
      });

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/integrations/google-business/locations?orgId=${encodeURIComponent(mockOrgId)}`
      );
      expect(result.current.locations).toHaveLength(2);
      expect(result.current.locations[0].title).toBe('Location 1');
    });

    it('should set loading state during fetch', async () => {
      let resolvePromise: (value: unknown) => void;
      const fetchPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValue(fetchPromise);

      const { result } = renderHook(() => useGoogleBusinessLocations(mockOrgId));

      // Start fetch
      act(() => {
        result.current.fetchLocations();
      });

      // Check loading state
      expect(result.current.loading).toBe(true);

      // Complete fetch
      await act(async () => {
        resolvePromise!({
          ok: true,
          json: () => Promise.resolve({ locations: [] }),
        });
        await fetchPromise;
      });

      expect(result.current.loading).toBe(false);
    });

    it('should handle API error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ message: 'Authentication required' }),
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const { result } = renderHook(() => useGoogleBusinessLocations(mockOrgId));

      await act(async () => {
        await result.current.fetchLocations();
      });

      expect(result.current.error?.message).toBe('Authentication required');
      expect(result.current.locations).toEqual([]);
      consoleSpy.mockRestore();
    });

    it('should handle fetch error with default message', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const { result } = renderHook(() => useGoogleBusinessLocations(mockOrgId));

      await act(async () => {
        await result.current.fetchLocations();
      });

      expect(result.current.error?.message).toBe('Failed to fetch locations');
      consoleSpy.mockRestore();
    });

    it('should handle network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const { result } = renderHook(() => useGoogleBusinessLocations(mockOrgId));

      await act(async () => {
        await result.current.fetchLocations();
      });

      expect(result.current.error?.message).toBe('Network error');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error fetching Google Business locations:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });

    it('should set error without orgId', async () => {
      const { result } = renderHook(() => useGoogleBusinessLocations(''));

      await act(async () => {
        await result.current.fetchLocations();
      });

      expect(result.current.error?.message).toBe('Organization ID required');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should clear error on successful fetch', async () => {
      // First, trigger an error
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const { result } = renderHook(() => useGoogleBusinessLocations(mockOrgId));

      await act(async () => {
        await result.current.fetchLocations();
      });

      expect(result.current.error).not.toBeNull();

      // Then, successful fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ locations: [createMockLocation()] }),
      });

      await act(async () => {
        await result.current.fetchLocations();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.locations).toHaveLength(1);
      consoleSpy.mockRestore();
    });

    it('should handle empty locations array', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ locations: [] }),
      });

      const { result } = renderHook(() => useGoogleBusinessLocations(mockOrgId));

      await act(async () => {
        await result.current.fetchLocations();
      });

      expect(result.current.locations).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should handle response without locations field', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const { result } = renderHook(() => useGoogleBusinessLocations(mockOrgId));

      await act(async () => {
        await result.current.fetchLocations();
      });

      expect(result.current.locations).toEqual([]);
    });
  });

  describe('URL encoding', () => {
    it('should properly encode special characters in orgId', async () => {
      const orgIdWithSpecialChars = 'org with spaces & special=chars';

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ locations: [] }),
      });

      const { result } = renderHook(() => useGoogleBusinessLocations(orgIdWithSpecialChars));

      await act(async () => {
        await result.current.fetchLocations();
      });

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/integrations/google-business/locations?orgId=${encodeURIComponent(orgIdWithSpecialChars)}`
      );
    });
  });
});
