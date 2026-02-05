import { renderHook, act, waitFor } from '@testing-library/react';

// ── Mocks ───────────────────────────────────────────────────────────────────

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
const mockLimit = jest.fn();
const mockStartAfter = jest.fn();
const mockEndBefore = jest.fn();
const mockLimitToLast = jest.fn();

jest.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  where: (...args: unknown[]) => mockWhere(...args),
  orderBy: (...args: unknown[]) => mockOrderBy(...args),
  limit: (...args: unknown[]) => mockLimit(...args),
  startAfter: (...args: unknown[]) => mockStartAfter(...args),
  endBefore: (...args: unknown[]) => mockEndBefore(...args),
  limitToLast: (...args: unknown[]) => mockLimitToLast(...args),
  onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  deleteDoc: (...args: unknown[]) => mockDeleteDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  Timestamp: {
    now: jest.fn(() => ({ toDate: () => new Date(), seconds: 1704067200, nanoseconds: 0 })),
    fromDate: jest.fn((date: Date) => ({ toDate: () => date, seconds: date.getTime() / 1000, nanoseconds: 0 })),
  },
  QueryConstraint: jest.fn(),
  DocumentSnapshot: jest.fn(),
  DocumentData: jest.fn(),
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
  convertTimestamps: jest.fn((data) => data),
  convertTimestampsDeep: jest.fn((data) => data),
}));

// ── Imports (after mocks) ───────────────────────────────────────────────────

import { usePagination } from '@/lib/hooks/usePagination';
import { convertTimestamps } from '@/lib/firebase/timestamp-converter';

// ── Helpers ─────────────────────────────────────────────────────────────────

interface TestItem {
  id: string;
  name: string;
  createdAt: Date;
}

function makeDocs(count: number, offset = 0) {
  const docs = [];
  for (let i = 0; i < count; i++) {
    const idx = offset + i;
    const docObj = {
      id: `item-${idx}`,
      data: () => ({ name: `Item ${idx}`, createdAt: new Date() }),
    };
    docs.push(docObj);
  }
  return { docs };
}

/**
 * Configures mockGetDocs to resolve with a set of docs.
 * Optionally accepts a function to generate docs dynamically based on call count.
 */
function setupGetDocs(docsOrFn: ReturnType<typeof makeDocs> | (() => ReturnType<typeof makeDocs>)) {
  if (typeof docsOrFn === 'function') {
    mockGetDocs.mockImplementation(async () => docsOrFn());
  } else {
    mockGetDocs.mockResolvedValue(docsOrFn);
  }
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('usePagination', () => {
  const DEFAULT_PAGE_SIZE = 25;

  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockReturnValue('mock-query');
    mockCollection.mockReturnValue('mock-collection');
    mockOrderBy.mockReturnValue('mock-orderBy');
    mockLimit.mockReturnValue('mock-limit');
    mockStartAfter.mockReturnValue('mock-startAfter');
    mockEndBefore.mockReturnValue('mock-endBefore');
    mockLimitToLast.mockReturnValue('mock-limitToLast');
    mockGetDocs.mockResolvedValue({ docs: [] });
  });

  // ── 1. No orgId returns empty ─────────────────────────────────────────

  it('returns loading=false and empty items initially when no orgId', async () => {
    const { result } = renderHook(() =>
      usePagination<TestItem>(undefined, 'clients')
    );

    // When no orgId, should not fetch and items should be empty
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.items).toEqual([]);
    expect(mockGetDocs).not.toHaveBeenCalled();
  });

  // ── 2. Fetches first page on mount ────────────────────────────────────

  it('fetches first page on mount with correct collection path', async () => {
    setupGetDocs(makeDocs(3));

    const { result } = renderHook(() =>
      usePagination<TestItem>('org-1', 'clients', { pageSize: 10 })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockCollection).toHaveBeenCalledWith({}, 'organizations/org-1/clients');
    expect(mockOrderBy).toHaveBeenCalledWith('createdAt', 'desc');
    expect(mockLimit).toHaveBeenCalledWith(11); // pageSize(10) + 1
    expect(mockGetDocs).toHaveBeenCalledTimes(1);
  });

  // ── 3. Returns items from getDocs ─────────────────────────────────────

  it('returns items from getDocs response', async () => {
    setupGetDocs(makeDocs(3));

    const { result } = renderHook(() =>
      usePagination<TestItem>('org-1', 'clients', { pageSize: 10 })
    );

    await waitFor(() => {
      expect(result.current.items).toHaveLength(3);
    });
    expect(result.current.items[0].id).toBe('item-0');
    expect(result.current.items[1].id).toBe('item-1');
    expect(result.current.items[2].id).toBe('item-2');
  });

  // ── 4. hasMore=true when getDocs returns pageSize+1 items ─────────────

  it('sets hasMore=true when getDocs returns pageSize+1 items (trims to pageSize)', async () => {
    const pageSize = 5;
    // Return pageSize+1 = 6 docs to indicate there are more
    setupGetDocs(makeDocs(pageSize + 1));

    const { result } = renderHook(() =>
      usePagination<TestItem>('org-1', 'clients', { pageSize })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.hasMore).toBe(true);
    // Items should be trimmed to pageSize
    expect(result.current.items).toHaveLength(pageSize);
  });

  // ── 5. hasMore=false when fewer than pageSize+1 ───────────────────────

  it('sets hasMore=false when getDocs returns fewer than pageSize+1 items', async () => {
    const pageSize = 10;
    // Return only 7 docs (less than pageSize+1=11)
    setupGetDocs(makeDocs(7));

    const { result } = renderHook(() =>
      usePagination<TestItem>('org-1', 'clients', { pageSize })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.hasMore).toBe(false);
    expect(result.current.items).toHaveLength(7);
  });

  // ── 6. loadMore fetches next page with startAfter cursor ──────────────

  it('loadMore fetches next page with startAfter cursor', async () => {
    const pageSize = 3;
    // First call: return pageSize+1 = 4 docs (hasMore=true)
    let callCount = 0;
    mockGetDocs.mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        return makeDocs(pageSize + 1, 0); // 4 docs, hasMore=true
      }
      return makeDocs(2, pageSize); // 2 docs, hasMore=false
    });

    const { result } = renderHook(() =>
      usePagination<TestItem>('org-1', 'clients', { pageSize })
    );

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.hasMore).toBe(true);
    });
    expect(result.current.currentPage).toBe(1);

    // Load more
    await act(async () => {
      await result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.currentPage).toBe(2);
    });
    expect(mockStartAfter).toHaveBeenCalled();
    expect(mockGetDocs).toHaveBeenCalledTimes(2);
  });

  // ── 7. loadMore does nothing when hasMore=false ───────────────────────

  it('loadMore does nothing when hasMore=false', async () => {
    const pageSize = 10;
    setupGetDocs(makeDocs(3)); // fewer than pageSize+1 => hasMore=false

    const { result } = renderHook(() =>
      usePagination<TestItem>('org-1', 'clients', { pageSize })
    );

    await waitFor(() => {
      expect(result.current.hasMore).toBe(false);
    });

    const callsBefore = mockGetDocs.mock.calls.length;

    await act(async () => {
      await result.current.loadMore();
    });

    // No additional getDocs call
    expect(mockGetDocs).toHaveBeenCalledTimes(callsBefore);
  });

  // ── 8. loadMore does nothing when loading=true ────────────────────────

  it('loadMore does nothing when loading=true', async () => {
    // Make getDocs hang indefinitely to keep loading=true
    let resolveGetDocs: Function;
    mockGetDocs.mockImplementation(
      () => new Promise((resolve) => { resolveGetDocs = resolve; })
    );

    const { result } = renderHook(() =>
      usePagination<TestItem>('org-1', 'clients', { pageSize: 5 })
    );

    // Should be loading
    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });

    // Attempt loadMore while loading
    await act(async () => {
      await result.current.loadMore();
    });

    // Only the initial getDocs call
    expect(mockGetDocs).toHaveBeenCalledTimes(1);

    // Cleanup: resolve the pending promise
    resolveGetDocs!({ docs: [] });
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  // ── 9. loadPrevious goes back a page ──────────────────────────────────

  it('loadPrevious goes back a page', async () => {
    const pageSize = 3;
    let callCount = 0;
    mockGetDocs.mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        return makeDocs(pageSize + 1, 0); // page 1: 4 docs (hasMore=true)
      }
      if (callCount === 2) {
        return makeDocs(2, pageSize); // page 2: 2 docs
      }
      // page 1 again (backward fetch)
      return makeDocs(pageSize, 0);
    });

    const { result } = renderHook(() =>
      usePagination<TestItem>('org-1', 'clients', { pageSize })
    );

    // Wait for page 1
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.currentPage).toBe(1);
    });

    // Go to page 2
    await act(async () => {
      await result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.currentPage).toBe(2);
    });

    // Go back to page 1
    await act(async () => {
      await result.current.loadPrevious();
    });

    await waitFor(() => {
      expect(result.current.currentPage).toBe(1);
    });
  });

  // ── 10. loadPrevious does nothing on page 1 ───────────────────────────

  it('loadPrevious does nothing on page 1', async () => {
    setupGetDocs(makeDocs(3));

    const { result } = renderHook(() =>
      usePagination<TestItem>('org-1', 'clients', { pageSize: 10 })
    );

    await waitFor(() => {
      expect(result.current.currentPage).toBe(1);
      expect(result.current.loading).toBe(false);
    });

    const callsBefore = mockGetDocs.mock.calls.length;

    await act(async () => {
      await result.current.loadPrevious();
    });

    // No additional fetch
    expect(mockGetDocs).toHaveBeenCalledTimes(callsBefore);
    expect(result.current.currentPage).toBe(1);
  });

  // ── 11. refresh clears cache and resets to page 1 ─────────────────────

  it('refresh clears cache and resets to page 1', async () => {
    const pageSize = 3;
    let callCount = 0;
    mockGetDocs.mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        return makeDocs(pageSize + 1, 0);
      }
      if (callCount === 2) {
        return makeDocs(2, pageSize);
      }
      // After refresh - new data
      return makeDocs(pageSize + 1, 100);
    });

    const { result } = renderHook(() =>
      usePagination<TestItem>('org-1', 'clients', { pageSize })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Go to page 2
    await act(async () => {
      await result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.currentPage).toBe(2);
    });

    // Refresh
    await act(async () => {
      await result.current.refresh();
    });

    await waitFor(() => {
      expect(result.current.currentPage).toBe(1);
    });

    // Verify that getDocs was called again (refresh triggers a fresh fetch)
    expect(mockGetDocs.mock.calls.length).toBeGreaterThanOrEqual(3);
  });

  // ── 12. setPageSize resets to page 1 and clears cache ─────────────────

  it('setPageSize resets to page 1 and clears cache', async () => {
    setupGetDocs(makeDocs(5));

    const { result } = renderHook(() =>
      usePagination<TestItem>('org-1', 'clients', { pageSize: 10 })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Change page size
    act(() => {
      result.current.setPageSize(50);
    });

    await waitFor(() => {
      expect(result.current.pageSize).toBe(50);
      expect(result.current.currentPage).toBe(1);
    });

    // New limit should be 51 (50+1)
    const lastLimitCall = mockLimit.mock.calls[mockLimit.mock.calls.length - 1];
    expect(lastLimitCall[0]).toBe(51);
  });

  // ── 13. setPageSize rejects invalid values ────────────────────────────

  it('setPageSize rejects invalid values (0, negative, over 100)', async () => {
    setupGetDocs(makeDocs(3));

    const { result } = renderHook(() =>
      usePagination<TestItem>('org-1', 'clients', { pageSize: 25 })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Try 0
    act(() => {
      result.current.setPageSize(0);
    });
    expect(result.current.pageSize).toBe(25);

    // Try negative
    act(() => {
      result.current.setPageSize(-5);
    });
    expect(result.current.pageSize).toBe(25);

    // Try over 100
    act(() => {
      result.current.setPageSize(101);
    });
    expect(result.current.pageSize).toBe(25);

    // Boundary: 100 should be accepted
    act(() => {
      result.current.setPageSize(100);
    });
    await waitFor(() => {
      expect(result.current.pageSize).toBe(100);
    });

    // Boundary: 1 should be accepted
    act(() => {
      result.current.setPageSize(1);
    });
    await waitFor(() => {
      expect(result.current.pageSize).toBe(1);
    });
  });

  // ── 14. Error handling: sets error on getDocs failure ─────────────────

  it('sets error on getDocs failure', async () => {
    mockGetDocs.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() =>
      usePagination<TestItem>('org-1', 'clients')
    );

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
    expect(result.current.error?.message).toBe('Network error');
    expect(result.current.loading).toBe(false);
  });

  // ── 15. Disabled: doesn't fetch when enabled=false ────────────────────

  it("doesn't fetch when enabled=false", async () => {
    const { result } = renderHook(() =>
      usePagination<TestItem>('org-1', 'clients', { enabled: false })
    );

    // Wait a tick to ensure no async calls are pending
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.items).toEqual([]);
    expect(mockGetDocs).not.toHaveBeenCalled();
  });

  // ── 16. hasPrevious: false on page 1, true on page 2+ ────────────────

  it('hasPrevious is false on page 1, true on page 2+', async () => {
    const pageSize = 3;
    let callCount = 0;
    mockGetDocs.mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        return makeDocs(pageSize + 1, 0); // hasMore=true
      }
      return makeDocs(2, pageSize);
    });

    const { result } = renderHook(() =>
      usePagination<TestItem>('org-1', 'clients', { pageSize })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Page 1: hasPrevious=false
    expect(result.current.hasPrevious).toBe(false);
    expect(result.current.currentPage).toBe(1);

    // Go to page 2
    await act(async () => {
      await result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.currentPage).toBe(2);
    });

    // Page 2: hasPrevious=true
    expect(result.current.hasPrevious).toBe(true);
  });

  // ── 17. Uses default converter when none provided ─────────────────────

  it('uses default converter when none provided', async () => {
    setupGetDocs(makeDocs(2));

    const { result } = renderHook(() =>
      usePagination<TestItem>('org-1', 'clients', { pageSize: 10 })
    );

    await waitFor(() => {
      expect(result.current.items).toHaveLength(2);
    });

    // Default converter calls convertTimestamps
    expect(convertTimestamps).toHaveBeenCalled();
    expect(result.current.items[0].id).toBe('item-0');
  });

  // ── 18. Uses custom converter when provided ───────────────────────────

  it('uses custom converter when provided', async () => {
    setupGetDocs(makeDocs(2));
    const customConverter = jest.fn((id: string, data: Record<string, unknown>) => ({
      id,
      name: `Custom-${data.name}`,
      createdAt: new Date(),
    }));

    const { result } = renderHook(() =>
      usePagination<TestItem>('org-1', 'clients', {
        pageSize: 10,
        converter: customConverter,
      })
    );

    await waitFor(() => {
      expect(result.current.items).toHaveLength(2);
    });

    expect(customConverter).toHaveBeenCalledTimes(2);
    expect(result.current.items[0].name).toBe('Custom-Item 0');
    expect(result.current.items[1].name).toBe('Custom-Item 1');
  });

  // ── 19. currentPage starts at 1 ──────────────────────────────────────

  it('currentPage starts at 1', async () => {
    setupGetDocs(makeDocs(3));

    const { result } = renderHook(() =>
      usePagination<TestItem>('org-1', 'clients', { pageSize: 10 })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.currentPage).toBe(1);
  });
});
