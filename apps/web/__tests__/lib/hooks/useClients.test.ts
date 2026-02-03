/**
 * @fileoverview Tests for useClients hook
 *
 * Tests the client management hooks including:
 * - useClients: List and filter clients
 * - useClient: Single client with CRUD operations
 * - useClientStats: Aggregate client statistics
 * - createClient: Create new client
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import {
  useClients,
  useClient,
  useClientStats,
  useClientProjects,
  useClientCommunicationLog,
  createClient,
  CLIENT_STATUS_LABELS,
  CLIENT_SOURCE_LABELS,
} from '@/lib/hooks/useClients';

// Mock data
const mockClientData = {
  displayName: 'Test Client',
  firstName: 'Test',
  lastName: 'Client',
  email: 'test@example.com',
  phone: '555-1234',
  companyName: 'Test Company',
  status: 'active' as const,
  orgId: 'test-org',
  notes: [],
  projectIds: [],
  financials: {
    lifetimeValue: 10000,
    totalProjects: 2,
    completedProjects: 1,
    activeProjects: 1,
    outstandingBalance: 500,
    averageProjectValue: 5000,
  },
  createdAt: new Date('2024-01-01'),
};

const mockClient1 = { id: 'client-1', ...mockClientData };
const mockClient2 = {
  id: 'client-2',
  ...mockClientData,
  displayName: 'Another Client',
  firstName: 'Another',
  email: 'another@example.com',
  status: 'inactive' as const,
};
const mockClient3 = {
  id: 'client-3',
  ...mockClientData,
  displayName: 'Potential Lead',
  firstName: 'Potential',
  email: 'potential@example.com',
  status: 'potential' as const,
};

// Mock Firestore
const mockOnSnapshot = jest.fn();
const mockAddDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockDeleteDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockCollection = jest.fn();
const mockQuery = jest.fn();
const mockDoc = jest.fn();
const mockWhere = jest.fn();
const mockOrderBy = jest.fn();

jest.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  where: (...args: unknown[]) => mockWhere(...args),
  orderBy: (...args: unknown[]) => mockOrderBy(...args),
  onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  deleteDoc: (...args: unknown[]) => mockDeleteDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  serverTimestamp: jest.fn(() => ({ _serverTimestamp: true })),
  Timestamp: {
    now: jest.fn(() => ({ toDate: () => new Date(), seconds: 1704067200, nanoseconds: 0 })),
    fromDate: jest.fn((date: Date) => ({ toDate: () => date, seconds: date.getTime() / 1000, nanoseconds: 0 })),
  },
}));

// Mock Firebase config
jest.mock('@/lib/firebase/config', () => ({
  db: {},
}));

// Mock useFirestoreCollection
const mockRefetch = jest.fn();
jest.mock('@/lib/hooks/useFirestoreCollection', () => ({
  useFirestoreCollection: jest.fn(() => ({
    items: [],
    loading: false,
    error: null,
    refetch: mockRefetch,
    initialized: true,
    count: 0,
  })),
  createConverter: jest.fn((converter) => converter),
}));

// Mock useFirestoreCrud
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockRemove = jest.fn();
jest.mock('@/lib/hooks/useFirestoreCrud', () => ({
  useFirestoreCrud: jest.fn(() => ({
    create: mockCreate,
    update: mockUpdate,
    remove: mockRemove,
    loading: false,
    error: null,
  })),
}));

// Mock timestamp converter
jest.mock('@/lib/firebase/timestamp-converter', () => ({
  convertTimestamps: jest.fn((data) => data),
  DATE_FIELDS: {
    client: ['createdAt', 'updatedAt', 'firstContactDate', 'lastContactDate'],
    project: ['createdAt', 'updatedAt', 'startDate', 'endDate'],
  },
}));

// Get the mocked useFirestoreCollection
import { useFirestoreCollection } from '@/lib/hooks/useFirestoreCollection';
const mockedUseFirestoreCollection = useFirestoreCollection as jest.Mock;

describe('useClients', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseFirestoreCollection.mockReturnValue({
      items: [],
      loading: false,
      error: null,
      refetch: mockRefetch,
      initialized: true,
      count: 0,
    });
  });

  describe('basic functionality', () => {
    it('returns empty array when no orgId is provided', () => {
      mockedUseFirestoreCollection.mockReturnValue({
        items: [],
        loading: false,
        error: null,
        refetch: mockRefetch,
        initialized: true,
        count: 0,
      });

      const { result } = renderHook(() => useClients({ orgId: '' }));

      expect(result.current.clients).toEqual([]);
      expect(result.current.loading).toBe(false);
    });

    it('returns clients for organization after onSnapshot', () => {
      const mockClients = [mockClient1, mockClient2, mockClient3];
      mockedUseFirestoreCollection.mockReturnValue({
        items: mockClients,
        loading: false,
        error: null,
        refetch: mockRefetch,
        initialized: true,
        count: 3,
      });

      const { result } = renderHook(() => useClients({ orgId: 'test-org' }));

      expect(result.current.clients).toHaveLength(3);
      expect(result.current.clients).toEqual(mockClients);
    });

    it('handles loading state correctly', () => {
      mockedUseFirestoreCollection.mockReturnValue({
        items: [],
        loading: true,
        error: null,
        refetch: mockRefetch,
        initialized: false,
        count: 0,
      });

      const { result } = renderHook(() => useClients({ orgId: 'test-org' }));

      expect(result.current.loading).toBe(true);
      expect(result.current.clients).toEqual([]);
    });

    it('returns error state on Firestore error', () => {
      const mockError = new Error('Firestore permission denied');
      mockedUseFirestoreCollection.mockReturnValue({
        items: [],
        loading: false,
        error: mockError,
        refetch: mockRefetch,
        initialized: true,
        count: 0,
      });

      const { result } = renderHook(() => useClients({ orgId: 'test-org' }));

      expect(result.current.error).toEqual(mockError);
      expect(result.current.clients).toEqual([]);
    });
  });

  describe('filtering', () => {
    it('filters by status (active)', () => {
      const allClients = [mockClient1, mockClient2, mockClient3];
      // When status filter is applied, useFirestoreCollection should return filtered results
      mockedUseFirestoreCollection.mockReturnValue({
        items: [mockClient1], // Only active client
        loading: false,
        error: null,
        refetch: mockRefetch,
        initialized: true,
        count: 1,
      });

      const { result } = renderHook(() =>
        useClients({ orgId: 'test-org', status: 'active' })
      );

      expect(result.current.clients).toHaveLength(1);
      expect(result.current.clients[0].status).toBe('active');
    });

    it('filters by status (inactive)', () => {
      mockedUseFirestoreCollection.mockReturnValue({
        items: [mockClient2], // Only inactive client
        loading: false,
        error: null,
        refetch: mockRefetch,
        initialized: true,
        count: 1,
      });

      const { result } = renderHook(() =>
        useClients({ orgId: 'test-org', status: 'inactive' })
      );

      expect(result.current.clients).toHaveLength(1);
      expect(result.current.clients[0].status).toBe('inactive');
    });

    it('filters by status (potential)', () => {
      mockedUseFirestoreCollection.mockReturnValue({
        items: [mockClient3],
        loading: false,
        error: null,
        refetch: mockRefetch,
        initialized: true,
        count: 1,
      });

      const { result } = renderHook(() =>
        useClients({ orgId: 'test-org', status: 'potential' })
      );

      expect(result.current.clients).toHaveLength(1);
      expect(result.current.clients[0].status).toBe('potential');
    });

    it('search by name works (displayName)', () => {
      const allClients = [mockClient1, mockClient2, mockClient3];
      mockedUseFirestoreCollection.mockReturnValue({
        items: allClients,
        loading: false,
        error: null,
        refetch: mockRefetch,
        initialized: true,
        count: 3,
      });

      const { result } = renderHook(() =>
        useClients({ orgId: 'test-org', search: 'Test Client' })
      );

      // Client-side search should filter
      expect(result.current.clients).toHaveLength(1);
      expect(result.current.clients[0].displayName).toBe('Test Client');
    });

    it('search by email works', () => {
      const allClients = [mockClient1, mockClient2, mockClient3];
      mockedUseFirestoreCollection.mockReturnValue({
        items: allClients,
        loading: false,
        error: null,
        refetch: mockRefetch,
        initialized: true,
        count: 3,
      });

      const { result } = renderHook(() =>
        useClients({ orgId: 'test-org', search: 'another@example.com' })
      );

      expect(result.current.clients).toHaveLength(1);
      expect(result.current.clients[0].email).toBe('another@example.com');
    });

    it('search by phone works', () => {
      const allClients = [mockClient1, mockClient2, mockClient3];
      mockedUseFirestoreCollection.mockReturnValue({
        items: allClients,
        loading: false,
        error: null,
        refetch: mockRefetch,
        initialized: true,
        count: 3,
      });

      const { result } = renderHook(() =>
        useClients({ orgId: 'test-org', search: '555-1234' })
      );

      // All have same phone in mock data
      expect(result.current.clients).toHaveLength(3);
    });

    it('search by company name works', () => {
      const clientWithDifferentCompany = {
        ...mockClient2,
        companyName: 'Different Corp',
      };
      const allClients = [mockClient1, clientWithDifferentCompany, mockClient3];
      mockedUseFirestoreCollection.mockReturnValue({
        items: allClients,
        loading: false,
        error: null,
        refetch: mockRefetch,
        initialized: true,
        count: 3,
      });

      const { result } = renderHook(() =>
        useClients({ orgId: 'test-org', search: 'Different Corp' })
      );

      expect(result.current.clients).toHaveLength(1);
      expect(result.current.clients[0].companyName).toBe('Different Corp');
    });

    it('search is case-insensitive', () => {
      const allClients = [mockClient1, mockClient2, mockClient3];
      mockedUseFirestoreCollection.mockReturnValue({
        items: allClients,
        loading: false,
        error: null,
        refetch: mockRefetch,
        initialized: true,
        count: 3,
      });

      const { result } = renderHook(() =>
        useClients({ orgId: 'test-org', search: 'test client' })
      );

      expect(result.current.clients).toHaveLength(1);
      expect(result.current.clients[0].displayName).toBe('Test Client');
    });

    it('returns empty array when search matches nothing', () => {
      const allClients = [mockClient1, mockClient2, mockClient3];
      mockedUseFirestoreCollection.mockReturnValue({
        items: allClients,
        loading: false,
        error: null,
        refetch: mockRefetch,
        initialized: true,
        count: 3,
      });

      const { result } = renderHook(() =>
        useClients({ orgId: 'test-org', search: 'nonexistent' })
      );

      expect(result.current.clients).toHaveLength(0);
    });
  });

  describe('refresh functionality', () => {
    it('refresh calls refetch from useFirestoreCollection', () => {
      mockedUseFirestoreCollection.mockReturnValue({
        items: [mockClient1],
        loading: false,
        error: null,
        refetch: mockRefetch,
        initialized: true,
        count: 1,
      });

      const { result } = renderHook(() => useClients({ orgId: 'test-org' }));

      act(() => {
        result.current.refresh();
      });

      expect(mockRefetch).toHaveBeenCalled();
    });
  });
});

describe('useClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOnSnapshot.mockImplementation((_, onSuccess) => {
      // Simulate immediate callback with client data
      const mockDocSnapshot = {
        exists: () => true,
        id: 'client-1',
        data: () => mockClientData,
      };
      onSuccess(mockDocSnapshot);
      return () => {}; // Unsubscribe function
    });
  });

  it('returns null when no clientId provided', () => {
    const { result } = renderHook(() => useClient(undefined, 'test-org'));

    expect(result.current.client).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('returns null when no orgId provided', () => {
    const { result } = renderHook(() => useClient('client-1', ''));

    expect(result.current.client).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('returns client data after snapshot', async () => {
    const { result } = renderHook(() => useClient('client-1', 'test-org'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.client).toBeDefined();
    expect(result.current.client?.id).toBe('client-1');
  });

  it('handles non-existent client', async () => {
    mockOnSnapshot.mockImplementation((_, onSuccess) => {
      const mockDocSnapshot = {
        exists: () => false,
        id: 'nonexistent',
        data: () => null,
      };
      onSuccess(mockDocSnapshot);
      return () => {};
    });

    const { result } = renderHook(() => useClient('nonexistent', 'test-org'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.client).toBeNull();
  });

  it('handles Firestore error', async () => {
    const testError = new Error('Permission denied');
    mockOnSnapshot.mockImplementation((_, __, onError) => {
      onError(testError);
      return () => {};
    });

    const { result } = renderHook(() => useClient('client-1', 'test-org'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toEqual(testError);
  });

  it('updateClient calls update with correct parameters', async () => {
    const { result } = renderHook(() => useClient('client-1', 'test-org'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.updateClient({ status: 'inactive' });
    });

    expect(mockUpdate).toHaveBeenCalledWith('client-1', { status: 'inactive' });
  });

  it('deleteClient calls remove with correct clientId', async () => {
    const { result } = renderHook(() => useClient('client-1', 'test-org'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteClient();
    });

    expect(mockRemove).toHaveBeenCalledWith('client-1');
  });

  it('updateClient throws error when no clientId', async () => {
    const { result } = renderHook(() => useClient(undefined, 'test-org'));

    await expect(result.current.updateClient({ status: 'inactive' })).rejects.toThrow(
      'Client ID and Org ID required'
    );
  });

  it('deleteClient throws error when no orgId', async () => {
    const { result } = renderHook(() => useClient('client-1', ''));

    await expect(result.current.deleteClient()).rejects.toThrow(
      'Client ID and Org ID required'
    );
  });
});

describe('useClientStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns zero stats when no clients', () => {
    mockedUseFirestoreCollection.mockReturnValue({
      items: [],
      loading: false,
      error: null,
      refetch: mockRefetch,
      initialized: true,
      count: 0,
    });

    const { result } = renderHook(() => useClientStats('test-org'));

    expect(result.current.stats).toEqual({
      total: 0,
      active: 0,
      past: 0,
      potential: 0,
      totalLifetimeValue: 0,
      averageProjectValue: 0,
      totalOutstanding: 0,
    });
  });

  it('calculates stats correctly with clients', () => {
    const pastClient = {
      ...mockClient1,
      id: 'client-past',
      status: 'past' as const,
      financials: {
        lifetimeValue: 5000,
        totalProjects: 1,
        completedProjects: 1,
        activeProjects: 0,
        outstandingBalance: 0,
        averageProjectValue: 5000,
      },
    };

    const allClients = [mockClient1, mockClient3, pastClient];
    mockedUseFirestoreCollection.mockReturnValue({
      items: allClients,
      loading: false,
      error: null,
      refetch: mockRefetch,
      initialized: true,
      count: 3,
    });

    const { result } = renderHook(() => useClientStats('test-org'));

    expect(result.current.stats.total).toBe(3);
    expect(result.current.stats.active).toBe(1);
    expect(result.current.stats.past).toBe(1);
    expect(result.current.stats.potential).toBe(1);
    expect(result.current.stats.totalLifetimeValue).toBe(25000); // 10000 + 10000 + 5000
    expect(result.current.stats.totalOutstanding).toBe(1000); // 500 + 500
  });

  it('handles loading state', () => {
    mockedUseFirestoreCollection.mockReturnValue({
      items: [],
      loading: true,
      error: null,
      refetch: mockRefetch,
      initialized: false,
      count: 0,
    });

    const { result } = renderHook(() => useClientStats('test-org'));

    expect(result.current.loading).toBe(true);
  });
});

describe('createClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAddDoc.mockResolvedValue({ id: 'new-client-id' });
  });

  // Helper to create minimal valid client data for tests
  // Using type assertion since we're testing the function behavior, not the full Client type
  const createValidClientData = (overrides: Record<string, unknown> = {}) => ({
    firstName: 'New',
    lastName: 'Client',
    displayName: 'New Client',
    email: 'new@example.com',
    status: 'potential' as const,
    companyName: 'New Company',
    phone: '555-0000',
    source: 'website' as const,
    isCommercial: false,
    preferredCommunication: 'email' as const,
    contacts: [],
    addresses: [],
    ...overrides,
  } as unknown as Parameters<typeof createClient>[0]);

  it('creates client with required fields', async () => {
    const newClientData = createValidClientData();

    const result = await createClient(newClientData, 'test-org');

    expect(result).toBe('new-client-id');
    expect(mockAddDoc).toHaveBeenCalled();
  });

  it('throws error when no orgId provided', async () => {
    const newClientData = createValidClientData();

    await expect(createClient(newClientData, '')).rejects.toThrow(
      'Organization ID required'
    );
  });

  it('sets displayName from companyName when provided', async () => {
    const newClientData = createValidClientData({
      firstName: 'First',
      lastName: 'Last',
      companyName: 'Test Corp',
      status: 'active' as const,
      source: 'referral' as const,
    });

    await createClient(newClientData, 'test-org');

    const addDocCall = mockAddDoc.mock.calls[0];
    const savedData = addDocCall[1];
    expect(savedData.displayName).toBe('Test Corp');
  });

  it('sets displayName from firstName lastName when no companyName', async () => {
    const newClientData = createValidClientData({
      firstName: 'First',
      lastName: 'Last',
      companyName: undefined,
      status: 'active' as const,
      source: 'referral' as const,
    });

    await createClient(newClientData, 'test-org');

    const addDocCall = mockAddDoc.mock.calls[0];
    const savedData = addDocCall[1];
    expect(savedData.displayName).toBe('First Last');
  });

  it('initializes financials to zero values', async () => {
    const newClientData = createValidClientData();

    await createClient(newClientData, 'test-org');

    const addDocCall = mockAddDoc.mock.calls[0];
    const savedData = addDocCall[1];
    expect(savedData.financials).toEqual({
      lifetimeValue: 0,
      totalProjects: 0,
      completedProjects: 0,
      activeProjects: 0,
      outstandingBalance: 0,
      averageProjectValue: 0,
    });
  });

  it('initializes notes and projectIds as empty arrays', async () => {
    const newClientData = createValidClientData();

    await createClient(newClientData, 'test-org');

    const addDocCall = mockAddDoc.mock.calls[0];
    const savedData = addDocCall[1];
    expect(savedData.notes).toEqual([]);
    expect(savedData.projectIds).toEqual([]);
  });
});

describe('useClient note operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateDoc.mockResolvedValue(undefined);
  });

  it('addNote adds a note to the client', async () => {
    const clientWithNotes = {
      ...mockClientData,
      notes: [
        {
          id: 'note_existing',
          content: 'Existing note',
          createdAt: new Date('2024-01-01'),
          createdBy: 'user-1',
          createdByName: 'Test User',
        },
      ],
    };

    mockOnSnapshot.mockImplementation((_, onSuccess) => {
      const mockDocSnapshot = {
        exists: () => true,
        id: 'client-1',
        data: () => clientWithNotes,
      };
      onSuccess(mockDocSnapshot);
      return () => {};
    });

    const { result } = renderHook(() => useClient('client-1', 'test-org'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.addNote({
        content: 'New note content',
        createdBy: 'user-1',
        createdByName: 'Test User',
      });
    });

    expect(mockUpdateDoc).toHaveBeenCalled();
    const updateDocCall = mockUpdateDoc.mock.calls[0];
    const updates = updateDocCall[1];

    expect(updates.notes).toHaveLength(2);
    expect(updates.notes[1].content).toBe('New note content');
    expect(updates.notes[1].id).toMatch(/^note_/);
  });

  it('addNote throws error when no client', async () => {
    mockOnSnapshot.mockImplementation((_, onSuccess) => {
      const mockDocSnapshot = {
        exists: () => false,
        id: 'nonexistent',
        data: () => null,
      };
      onSuccess(mockDocSnapshot);
      return () => {};
    });

    const { result } = renderHook(() => useClient('nonexistent', 'test-org'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await expect(
      result.current.addNote({
        content: 'Test note',
        createdBy: 'user-1',
        createdByName: 'Test User',
      })
    ).rejects.toThrow('Client and Org required');
  });

  it('deleteNote removes a note from the client', async () => {
    const clientWithNotes = {
      ...mockClientData,
      notes: [
        {
          id: 'note_1',
          content: 'Note to keep',
          createdAt: new Date('2024-01-01'),
          createdBy: 'user-1',
          createdByName: 'Test User',
        },
        {
          id: 'note_2',
          content: 'Note to delete',
          createdAt: new Date('2024-01-02'),
          createdBy: 'user-1',
          createdByName: 'Test User',
        },
      ],
    };

    mockOnSnapshot.mockImplementation((_, onSuccess) => {
      const mockDocSnapshot = {
        exists: () => true,
        id: 'client-1',
        data: () => clientWithNotes,
      };
      onSuccess(mockDocSnapshot);
      return () => {};
    });

    const { result } = renderHook(() => useClient('client-1', 'test-org'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteNote('note_2');
    });

    expect(mockUpdateDoc).toHaveBeenCalled();
    const updateDocCall = mockUpdateDoc.mock.calls[0];
    const updates = updateDocCall[1];

    expect(updates.notes).toHaveLength(1);
    expect(updates.notes[0].id).toBe('note_1');
  });

  it('deleteNote throws error when no client', async () => {
    const { result } = renderHook(() => useClient(undefined, 'test-org'));

    await expect(result.current.deleteNote('note_1')).rejects.toThrow(
      'Client and Org required'
    );
  });
});

describe('useClientProjects', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty array when no clientId', () => {
    mockedUseFirestoreCollection.mockReturnValue({
      items: [],
      loading: false,
      error: null,
      refetch: mockRefetch,
      initialized: true,
      count: 0,
    });

    const { result } = renderHook(() => useClientProjects(undefined, 'test-org'));

    expect(result.current.projects).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('returns projects for client', () => {
    const mockProjects = [
      {
        id: 'project-1',
        name: 'Kitchen Remodel',
        clientId: 'client-1',
        orgId: 'test-org',
        status: 'active',
        createdAt: new Date('2024-01-01'),
      },
      {
        id: 'project-2',
        name: 'Bathroom Renovation',
        clientId: 'client-1',
        orgId: 'test-org',
        status: 'completed',
        createdAt: new Date('2024-02-01'),
      },
    ];

    mockedUseFirestoreCollection.mockReturnValue({
      items: mockProjects,
      loading: false,
      error: null,
      refetch: mockRefetch,
      initialized: true,
      count: 2,
    });

    const { result } = renderHook(() => useClientProjects('client-1', 'test-org'));

    expect(result.current.projects).toHaveLength(2);
    expect(result.current.projects[0].name).toBe('Kitchen Remodel');
  });

  it('handles loading state', () => {
    mockedUseFirestoreCollection.mockReturnValue({
      items: [],
      loading: true,
      error: null,
      refetch: mockRefetch,
      initialized: false,
      count: 0,
    });

    const { result } = renderHook(() => useClientProjects('client-1', 'test-org'));

    expect(result.current.loading).toBe(true);
  });
});

describe('useClientCommunicationLog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty array when no clientId', () => {
    mockedUseFirestoreCollection.mockReturnValue({
      items: [],
      loading: false,
      error: null,
      refetch: mockRefetch,
      initialized: true,
      count: 0,
    });

    const { result } = renderHook(() => useClientCommunicationLog(undefined, 'test-org'));

    expect(result.current.logs).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('returns communication logs for client', () => {
    const mockLogs = [
      {
        id: 'log-1',
        clientId: 'client-1',
        orgId: 'test-org',
        type: 'email',
        subject: 'Project Update',
        content: 'Sent project update email',
        createdAt: new Date('2024-01-15'),
        createdBy: 'user-1',
        createdByName: 'Test User',
      },
      {
        id: 'log-2',
        clientId: 'client-1',
        orgId: 'test-org',
        type: 'call',
        subject: 'Follow-up Call',
        content: 'Discussed project timeline',
        createdAt: new Date('2024-01-20'),
        createdBy: 'user-1',
        createdByName: 'Test User',
      },
    ];

    mockedUseFirestoreCollection.mockReturnValue({
      items: mockLogs,
      loading: false,
      error: null,
      refetch: mockRefetch,
      initialized: true,
      count: 2,
    });

    const { result } = renderHook(() => useClientCommunicationLog('client-1', 'test-org'));

    expect(result.current.logs).toHaveLength(2);
    expect(result.current.logs[0].type).toBe('email');
  });

  it('addLog creates a new communication log', async () => {
    mockedUseFirestoreCollection.mockReturnValue({
      items: [],
      loading: false,
      error: null,
      refetch: mockRefetch,
      initialized: true,
      count: 0,
    });

    const { result } = renderHook(() => useClientCommunicationLog('client-1', 'test-org'));

    await act(async () => {
      await result.current.addLog({
        clientId: 'client-1',
        orgId: 'test-org',
        type: 'meeting',
        subject: 'Site Visit',
        content: 'Met with client on-site',
        direction: 'outbound',
        createdBy: 'user-1',
        createdByName: 'Test User',
      });
    });

    expect(mockCreate).toHaveBeenCalled();
  });
});

describe('Label constants', () => {
  it('CLIENT_STATUS_LABELS has all required statuses', () => {
    expect(CLIENT_STATUS_LABELS).toEqual({
      active: 'Active',
      past: 'Past',
      potential: 'Potential',
      inactive: 'Inactive',
    });
  });

  it('CLIENT_SOURCE_LABELS has all required sources', () => {
    expect(CLIENT_SOURCE_LABELS).toEqual({
      referral: 'Referral',
      google: 'Google Search',
      social_media: 'Social Media',
      yard_sign: 'Yard Sign',
      vehicle_wrap: 'Vehicle Wrap',
      website: 'Website',
      repeat: 'Repeat Customer',
      other: 'Other',
    });
  });
});
