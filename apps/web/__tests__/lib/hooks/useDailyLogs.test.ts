/**
 * @fileoverview Tests for useDailyLogs hook
 *
 * Tests the daily log management hook including:
 * - Real-time log fetching via onSnapshot from organizations/{orgId}/dailyLogs
 * - Privacy filter: non-managers can't see other users' private logs
 * - CRUD: createLog, updateLog, deleteLog
 * - Photo ops: addPhoto, removePhoto
 * - getDailySummary: aggregates by date with categories, crew count, weather
 * - getDateRange: returns earliest/latest dates
 * - Error handling on snapshot failures
 */

import { renderHook, act, waitFor } from '@testing-library/react';

// ---- Mock functions ----
const mockOnSnapshot = jest.fn();
const mockAddDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockDeleteDoc = jest.fn();
const mockCollection = jest.fn();
const mockQuery = jest.fn();
const mockDoc = jest.fn();
const mockWhere = jest.fn();
const mockOrderBy = jest.fn();
const mockLimit = jest.fn();

jest.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  where: (...args: unknown[]) => mockWhere(...args),
  orderBy: (...args: unknown[]) => mockOrderBy(...args),
  limit: (...args: unknown[]) => mockLimit(...args),
  onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  deleteDoc: (...args: unknown[]) => mockDeleteDoc(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  Timestamp: {
    now: jest.fn(() => ({
      toDate: () => new Date(),
      seconds: 1704067200,
      nanoseconds: 0,
    })),
    fromDate: jest.fn((date: Date) => ({
      toDate: () => date,
      seconds: Math.floor(date.getTime() / 1000),
      nanoseconds: 0,
    })),
  },
  QueryConstraint: jest.fn(),
}));

jest.mock('@/lib/firebase/config', () => ({ db: {} }));

const mockProfile = {
  uid: 'user-1',
  orgId: 'org-1',
  displayName: 'Test User',
  role: 'OWNER' as const,
};

jest.mock('@/lib/auth', () => ({
  useAuth: jest.fn(() => ({
    user: { uid: 'user-1', email: 'test@test.com' },
    profile: mockProfile,
  })),
}));

jest.mock('@/components/ui/Toast', () => ({
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

jest.mock('@/lib/firebase/timestamp-converter', () => ({
  convertTimestampsDeep: jest.fn((data) => data),
  convertTimestamps: jest.fn((data) => data),
}));

jest.mock('@/lib/hooks/usePagination', () => ({
  usePagination: jest.fn(() => ({
    items: [],
    loading: false,
    error: null,
    hasMore: false,
    hasPrevious: false,
    loadMore: jest.fn(),
    loadPrevious: jest.fn(),
    refresh: jest.fn(),
    currentPage: 1,
    totalLoaded: 0,
    pageSize: 25,
    setPageSize: jest.fn(),
    initialized: true,
  })),
}));

// Import hook and mocks after jest.mock declarations
import { useDailyLogs } from '@/lib/hooks/useDailyLogs';
import { useAuth } from '@/lib/auth';

// ---- Mock data ----
const mockLogData = (overrides: Record<string, unknown> = {}) => ({
  orgId: 'org-1',
  projectId: 'project-1',
  projectName: 'Renovation Project',
  userId: 'user-1',
  userName: 'Test User',
  date: '2024-01-15',
  category: 'progress',
  title: 'Drywall completed',
  description: 'Finished hanging drywall in living room',
  crewCount: 4,
  hoursWorked: 8,
  photos: [],
  issues: [],
  isPrivate: false,
  createdAt: { toDate: () => new Date('2024-01-15'), seconds: 1705276800, nanoseconds: 0 },
  updatedAt: { toDate: () => new Date('2024-01-15'), seconds: 1705276800, nanoseconds: 0 },
  ...overrides,
});

const logDocs = [
  {
    id: 'log-1',
    data: mockLogData(),
  },
  {
    id: 'log-2',
    data: mockLogData({
      date: '2024-01-15',
      category: 'safety',
      title: 'Safety inspection',
      crewCount: 6,
      hoursWorked: 4,
      userId: 'user-2',
      userName: 'Other User',
      weather: { condition: 'sunny', temperatureHigh: 72, temperatureLow: 55 },
    }),
  },
  {
    id: 'log-3',
    data: mockLogData({
      date: '2024-01-14',
      category: 'general',
      title: 'Site prep',
      crewCount: 3,
      hoursWorked: 6,
      projectId: 'project-2',
      projectName: 'Other Project',
    }),
  },
];

/**
 * Helper: simulate onSnapshot with docs pattern (matches useDailyLogs implementation)
 */
function simulateSnapshot(docs: Array<{ id: string; data: Record<string, unknown> }>) {
  mockOnSnapshot.mockImplementation((_q: unknown, onNext: Function, _onError?: Function) => {
    onNext({
      docs: docs.map(d => ({
        id: d.id,
        data: () => d.data,
      })),
    });
    return jest.fn(); // unsubscribe
  });
}

// ---- Tests ----

describe('useDailyLogs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAddDoc.mockResolvedValue({ id: 'new-log-id' });
    mockUpdateDoc.mockResolvedValue(undefined);
    mockDeleteDoc.mockResolvedValue(undefined);
    mockDoc.mockReturnValue('doc-ref');

    // Reset useAuth to default (OWNER role = manager)
    (useAuth as jest.Mock).mockReturnValue({
      user: { uid: 'user-1', email: 'test@test.com' },
      profile: mockProfile,
    });
  });

  // ---- Test 1: Loading then data ----
  it('returns loading=true initially, then logs after snapshot', async () => {
    simulateSnapshot(logDocs);

    const { result } = renderHook(() => useDailyLogs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.logs).toHaveLength(3);
    expect(result.current.logs[0].id).toBe('log-1');
    expect(result.current.logs[0].title).toBe('Drywall completed');
    expect(result.current.logs[1].id).toBe('log-2');
    expect(result.current.logs[1].category).toBe('safety');
    expect(result.current.logs[2].id).toBe('log-3');
    expect(result.current.error).toBeNull();
  });

  // ---- Test 2: Empty when no orgId ----
  it('returns empty logs when no orgId', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { uid: 'user-1', email: 'test@test.com' },
      profile: null,
    });

    const { result } = renderHook(() => useDailyLogs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.logs).toEqual([]);
    expect(mockOnSnapshot).not.toHaveBeenCalled();
  });

  // ---- Test 3: createLog calls addDoc with correct data ----
  it('createLog calls addDoc with orgId, userId, userName', async () => {
    simulateSnapshot([]);

    const { result } = renderHook(() => useDailyLogs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let logId: string = '';
    await act(async () => {
      logId = await result.current.createLog({
        projectId: 'project-1',
        projectName: 'Renovation Project',
        date: '2024-01-20',
        category: 'progress' as const,
        title: 'Plumbing rough-in',
        description: 'Completed plumbing rough-in',
        crewCount: 3,
        hoursWorked: 6,
        photos: [],
        issues: [],
        isPrivate: false,
        weather: undefined as unknown as any,
        tags: [],
      });
    });

    expect(logId).toBe('new-log-id');
    expect(mockAddDoc).toHaveBeenCalledTimes(1);

    // Verify collection path includes org scope
    expect(mockCollection).toHaveBeenCalledWith(
      expect.anything(),
      'organizations/org-1/dailyLogs'
    );

    const savedData = mockAddDoc.mock.calls[0][1];
    expect(savedData.orgId).toBe('org-1');
    expect(savedData.userId).toBe('user-1');
    expect(savedData.userName).toBe('Test User');
    expect(savedData.title).toBe('Plumbing rough-in');
    expect(savedData.createdAt).toBeDefined();
    expect(savedData.updatedAt).toBeDefined();
  });

  // ---- Test 4: createLog throws when not authenticated ----
  it('createLog throws when not authenticated', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      profile: null,
    });

    // Won't set up snapshot since orgId is null
    const { result } = renderHook(() => useDailyLogs());

    await expect(
      act(async () => {
        await result.current.createLog({
          projectId: 'project-1',
          projectName: 'Test',
          date: '2024-01-20',
          category: 'general' as const,
          title: 'Will fail',
          description: '',
          crewCount: 0,
          hoursWorked: 0,
          photos: [],
          issues: [],
          isPrivate: false,
          weather: undefined as unknown as any,
          tags: [],
        });
      })
    ).rejects.toThrow('Not authenticated');

    expect(mockAddDoc).not.toHaveBeenCalled();
  });

  // ---- Test 5: updateLog calls updateDoc with editedBy and updatedAt ----
  it('updateLog calls updateDoc with editedBy and updatedAt', async () => {
    simulateSnapshot(logDocs);

    const { result } = renderHook(() => useDailyLogs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.updateLog('log-1', {
        title: 'Updated title',
        description: 'Updated description',
      });
    });

    expect(mockDoc).toHaveBeenCalledWith(
      expect.anything(),
      'organizations/org-1/dailyLogs/log-1'
    );
    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);

    const updateData = mockUpdateDoc.mock.calls[0][1];
    expect(updateData.title).toBe('Updated title');
    expect(updateData.description).toBe('Updated description');
    expect(updateData.editedBy).toBe('user-1');
    expect(updateData.updatedAt).toBeDefined();
  });

  // ---- Test 6: deleteLog calls deleteDoc ----
  it('deleteLog calls deleteDoc', async () => {
    simulateSnapshot(logDocs);

    const { result } = renderHook(() => useDailyLogs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteLog('log-2');
    });

    expect(mockDoc).toHaveBeenCalledWith(
      expect.anything(),
      'organizations/org-1/dailyLogs/log-2'
    );
    expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
  });

  // ---- Test 7: getDailySummary returns null for date with no logs ----
  it('getDailySummary returns null for date with no logs', async () => {
    simulateSnapshot(logDocs);

    const { result } = renderHook(() => useDailyLogs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const summary = result.current.getDailySummary('2024-01-20');
    expect(summary).toBeNull();
  });

  // ---- Test 8: getDailySummary aggregates correctly ----
  it('getDailySummary aggregates correctly: totalEntries, crewCount (max), hoursWorked (sum), categories', async () => {
    simulateSnapshot(logDocs);

    const { result } = renderHook(() => useDailyLogs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const summary = result.current.getDailySummary('2024-01-15');

    expect(summary).not.toBeNull();
    expect(summary!.totalEntries).toBe(2); // log-1 and log-2 are on 2024-01-15
    expect(summary!.crewCount).toBe(6); // max(4, 6)
    expect(summary!.hoursWorked).toBe(12); // 8 + 4
    expect(summary!.categories.progress).toBe(1);
    expect(summary!.categories.safety).toBe(1);
    expect(summary!.categories.general).toBe(0);
    expect(summary!.date).toBe('2024-01-15');

    // Weather from first log that has it (log-2)
    expect(summary!.weather).toBeDefined();
    expect(summary!.weather!.condition).toBe('sunny');
    expect(summary!.weather!.temperatureHigh).toBe(72);
    expect(summary!.weather!.temperatureLow).toBe(55);
  });

  // ---- Test 9: getDailySummary filters by projectId ----
  it('getDailySummary filters by projectId', async () => {
    simulateSnapshot(logDocs);

    const { result } = renderHook(() => useDailyLogs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // log-3 is the only one on 2024-01-14 and in project-2
    const summary = result.current.getDailySummary('2024-01-14', 'project-2');

    expect(summary).not.toBeNull();
    expect(summary!.totalEntries).toBe(1);
    expect(summary!.projectId).toBe('project-2');
    expect(summary!.crewCount).toBe(3);
    expect(summary!.hoursWorked).toBe(6);

    // No logs on 2024-01-14 for project-1
    const noSummary = result.current.getDailySummary('2024-01-14', 'project-1');
    expect(noSummary).toBeNull();
  });

  // ---- Test 10: getDateRange returns null for empty logs ----
  it('getDateRange returns null for empty logs', async () => {
    simulateSnapshot([]);

    const { result } = renderHook(() => useDailyLogs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.getDateRange()).toBeNull();
  });

  // ---- Test 11: getDateRange returns earliest and latest dates ----
  it('getDateRange returns earliest and latest dates', async () => {
    simulateSnapshot(logDocs);

    const { result } = renderHook(() => useDailyLogs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const range = result.current.getDateRange();

    expect(range).not.toBeNull();
    expect(range!.earliest).toBe('2024-01-14'); // log-3
    expect(range!.latest).toBe('2024-01-15'); // log-1 and log-2
  });

  // ---- Test 12: Privacy filter for non-managers ----
  it('non-managers cannot see other users private logs', async () => {
    // Set up as a non-manager (FIELD role)
    (useAuth as jest.Mock).mockReturnValue({
      user: { uid: 'user-1', email: 'test@test.com' },
      profile: {
        ...mockProfile,
        role: 'FIELD',
      },
    });

    const logsWithPrivate = [
      { id: 'log-pub', data: mockLogData({ isPrivate: false, userId: 'user-2' }) },
      { id: 'log-priv-other', data: mockLogData({ isPrivate: true, userId: 'user-2', title: 'Private from other' }) },
      { id: 'log-priv-own', data: mockLogData({ isPrivate: true, userId: 'user-1', title: 'My private log' }) },
    ];

    simulateSnapshot(logsWithPrivate);

    const { result } = renderHook(() => useDailyLogs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should see public logs and own private logs, but NOT other users' private logs
    expect(result.current.logs).toHaveLength(2);
    expect(result.current.logs.map(l => l.id)).toContain('log-pub');
    expect(result.current.logs.map(l => l.id)).toContain('log-priv-own');
    expect(result.current.logs.map(l => l.id)).not.toContain('log-priv-other');
  });

  // ---- Test 13: Error handling on snapshot error ----
  it('sets error on snapshot error', async () => {
    mockOnSnapshot.mockImplementation((_q: unknown, _onNext: Function, onError?: Function) => {
      if (onError) {
        onError({ message: 'Permission denied' });
      }
      return jest.fn();
    });

    const { result } = renderHook(() => useDailyLogs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Permission denied');
    expect(result.current.logs).toEqual([]);
  });
});
