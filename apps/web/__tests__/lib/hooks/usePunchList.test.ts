/**
 * @fileoverview Unit tests for usePunchList hook
 * Sprint 80: Unit Test Coverage
 *
 * Tests cover:
 * - usePunchList: Punch item CRUD, status updates, delete, stats calculation
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { usePunchList } from '@/lib/hooks/usePunchList';
import type { PunchItem, PunchItemStatus } from '@/types';

// =============================================================================
// MOCKS
// =============================================================================

const mockFetch = jest.fn();
global.fetch = mockFetch;

jest.mock('@/lib/auth', () => ({
  useAuth: jest.fn(() => ({
    user: { uid: 'user-123', email: 'test@example.com' },
    profile: { uid: 'user-123', orgId: 'org-123', displayName: 'Test User', role: 'OWNER' },
  })),
}));

// =============================================================================
// TEST DATA
// =============================================================================

const mockProjectId = 'project-123';
const mockOrgId = 'org-123';

const createMockPunchItem = (overrides: Partial<PunchItem> = {}): PunchItem => ({
  id: `pi-${Math.random().toString(36).slice(2)}`,
  projectId: mockProjectId,
  orgId: mockOrgId,
  number: 'PI-001',
  title: 'Touch up paint in hallway',
  description: 'Wall paint scuffed near entrance door',
  status: 'open' as PunchItemStatus,
  priority: 'medium',
  assignedTo: 'user-456',
  assignedToName: 'Assigned User',
  location: 'Building A - Floor 2',
  createdBy: 'user-123',
  createdByName: 'Test User',
  createdAt: new Date('2024-01-15'),
  ...overrides,
});

// =============================================================================
// SETUP AND TEARDOWN
// =============================================================================

beforeEach(() => {
  jest.clearAllMocks();
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ items: [] }),
  });
});

// =============================================================================
// usePunchList TESTS
// =============================================================================

describe('usePunchList', () => {
  describe('fetching items', () => {
    it('should return loading=true initially then false after fetch', async () => {
      const { result } = renderHook(() => usePunchList({ projectId: mockProjectId }));
      expect(result.current.loading).toBe(true);
      await waitFor(() => { expect(result.current.loading).toBe(false); });
    });

    it('should return empty items by default', async () => {
      const { result } = renderHook(() => usePunchList({ projectId: mockProjectId }));
      await waitFor(() => { expect(result.current.loading).toBe(false); });
      expect(result.current.items).toEqual([]);
    });

    it('should fetch items from correct API URL', async () => {
      renderHook(() => usePunchList({ projectId: mockProjectId }));
      await waitFor(() => { expect(mockFetch).toHaveBeenCalledWith(`/api/projects/${mockProjectId}/punch-list?`); });
    });

    it('should pass status filter as query param', async () => {
      renderHook(() => usePunchList({ projectId: mockProjectId, status: 'in_progress' }));
      await waitFor(() => { expect(mockFetch).toHaveBeenCalledWith(`/api/projects/${mockProjectId}/punch-list?status=in_progress`); });
    });

    it('should populate items from API response', async () => {
      const mockItems = [
        createMockPunchItem({ id: 'pi-1', title: 'Fix drywall crack' }),
        createMockPunchItem({ id: 'pi-2', title: 'Replace outlet cover' }),
      ];
      mockFetch.mockResolvedValue({ ok: true, json: async () => ({ items: mockItems }) });
      const { result } = renderHook(() => usePunchList({ projectId: mockProjectId }));
      await waitFor(() => { expect(result.current.items).toHaveLength(2); });
      expect(result.current.items[0].title).toBe('Fix drywall crack');
      expect(result.current.items[1].title).toBe('Replace outlet cover');
    });

    it('should handle fetch error', async () => {
      mockFetch.mockResolvedValue({ ok: false });
      const { result } = renderHook(() => usePunchList({ projectId: mockProjectId }));
      await waitFor(() => { expect(result.current.error).toBe('Failed to fetch punch items'); });
      expect(result.current.loading).toBe(false);
    });

    it('should handle network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      const { result } = renderHook(() => usePunchList({ projectId: mockProjectId }));
      await waitFor(() => { expect(result.current.error).toBe('Network error'); });
      expect(result.current.loading).toBe(false);
    });

    it('should clear error on successful fetch', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: false })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) });
      const { result } = renderHook(() => usePunchList({ projectId: mockProjectId }));
      await waitFor(() => { expect(result.current.error).toBe('Failed to fetch punch items'); });
      await act(async () => { await result.current.refresh(); });
      await waitFor(() => { expect(result.current.error).toBeNull(); });
    });

    it('should not fetch without projectId', async () => {
      renderHook(() => usePunchList({ projectId: '' }));
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('createItem', () => {
    it('should POST to correct URL', async () => {
      const newItem = createMockPunchItem({ id: 'new-pi-1' });
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) })
        .mockResolvedValueOnce({ ok: true, json: async () => newItem });
      const { result } = renderHook(() => usePunchList({ projectId: mockProjectId }));
      await waitFor(() => { expect(result.current.loading).toBe(false); });
      const createData = { title: 'New Punch Item', priority: 'high' as const };
      await act(async () => { await result.current.createItem(createData); });
      expect(mockFetch).toHaveBeenCalledWith(`/api/projects/${mockProjectId}/punch-list`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(createData),
      });
    });

    it('should add new item to state', async () => {
      const newItem = createMockPunchItem({ id: 'new-pi-1', title: 'Created Item' });
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) })
        .mockResolvedValueOnce({ ok: true, json: async () => newItem });
      const { result } = renderHook(() => usePunchList({ projectId: mockProjectId }));
      await waitFor(() => { expect(result.current.loading).toBe(false); });
      await act(async () => { await result.current.createItem({ title: 'Created Item' }); });
      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].title).toBe('Created Item');
    });

    it('should prepend new item to existing list', async () => {
      const existing = [createMockPunchItem({ id: 'existing-1', title: 'Existing' })];
      const newItem = createMockPunchItem({ id: 'new-pi-1', title: 'New' });
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ items: existing }) })
        .mockResolvedValueOnce({ ok: true, json: async () => newItem });
      const { result } = renderHook(() => usePunchList({ projectId: mockProjectId }));
      await waitFor(() => { expect(result.current.items).toHaveLength(1); });
      await act(async () => { await result.current.createItem({ title: 'New' }); });
      expect(result.current.items).toHaveLength(2);
      expect(result.current.items[0].title).toBe('New');
    });

    it('should return created item', async () => {
      const newItem = createMockPunchItem({ id: 'new-pi-1' });
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) })
        .mockResolvedValueOnce({ ok: true, json: async () => newItem });
      const { result } = renderHook(() => usePunchList({ projectId: mockProjectId }));
      await waitFor(() => { expect(result.current.loading).toBe(false); });
      let created: PunchItem;
      await act(async () => { created = await result.current.createItem({ title: 'Test' }); });
      expect(created!.id).toBe('new-pi-1');
    });

    it('should throw on failure', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) })
        .mockResolvedValueOnce({ ok: false });
      const { result } = renderHook(() => usePunchList({ projectId: mockProjectId }));
      await waitFor(() => { expect(result.current.loading).toBe(false); });
      await expect(result.current.createItem({ title: 'Test' })).rejects.toThrow('Failed to create item');
    });
  });

  describe('updateItem', () => {
    it('should PATCH correct URL', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [createMockPunchItem({ id: 'pi-1' })] }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [createMockPunchItem({ id: 'pi-1', title: 'Updated' })] }) });
      const { result } = renderHook(() => usePunchList({ projectId: mockProjectId }));
      await waitFor(() => { expect(result.current.items).toHaveLength(1); });
      const updateData = { title: 'Updated Title' };
      await act(async () => { await result.current.updateItem('pi-1', updateData); });
      expect(mockFetch).toHaveBeenCalledWith(`/api/projects/${mockProjectId}/punch-list/pi-1`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updateData),
      });
    });

    it('should refetch after update', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [createMockPunchItem({ id: 'pi-1', title: 'Original' })] }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [createMockPunchItem({ id: 'pi-1', title: 'Updated' })] }) });
      const { result } = renderHook(() => usePunchList({ projectId: mockProjectId }));
      await waitFor(() => { expect(result.current.items[0].title).toBe('Original'); });
      await act(async () => { await result.current.updateItem('pi-1', { title: 'Updated' }); });
      await waitFor(() => { expect(result.current.items[0].title).toBe('Updated'); });
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should throw on failure', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) })
        .mockResolvedValueOnce({ ok: false });
      const { result } = renderHook(() => usePunchList({ projectId: mockProjectId }));
      await waitFor(() => { expect(result.current.loading).toBe(false); });
      await expect(result.current.updateItem('pi-1', { title: 'Test' })).rejects.toThrow('Failed to update item');
    });
  });

  describe('deleteItem', () => {
    it('should DELETE correct URL', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [createMockPunchItem({ id: 'pi-1' })] }) })
        .mockResolvedValueOnce({ ok: true });
      const { result } = renderHook(() => usePunchList({ projectId: mockProjectId }));
      await waitFor(() => { expect(result.current.items).toHaveLength(1); });
      await act(async () => { await result.current.deleteItem('pi-1'); });
      expect(mockFetch).toHaveBeenCalledWith(`/api/projects/${mockProjectId}/punch-list/pi-1`, { method: 'DELETE' });
    });

    it('should remove item from state', async () => {
      const items = [
        createMockPunchItem({ id: 'pi-1', title: 'Keep' }),
        createMockPunchItem({ id: 'pi-2', title: 'Delete' }),
      ];
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ items }) })
        .mockResolvedValueOnce({ ok: true });
      const { result } = renderHook(() => usePunchList({ projectId: mockProjectId }));
      await waitFor(() => { expect(result.current.items).toHaveLength(2); });
      await act(async () => { await result.current.deleteItem('pi-2'); });
      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].title).toBe('Keep');
    });

    it('should throw on failure', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) })
        .mockResolvedValueOnce({ ok: false });
      const { result } = renderHook(() => usePunchList({ projectId: mockProjectId }));
      await waitFor(() => { expect(result.current.loading).toBe(false); });
      await expect(result.current.deleteItem('pi-1')).rejects.toThrow('Failed to delete item');
    });
  });

  describe('updateStatus', () => {
    it('should delegate to updateItem with new status', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [createMockPunchItem({ id: 'pi-1', status: 'open' })] }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [createMockPunchItem({ id: 'pi-1', status: 'in_progress' })] }) });
      const { result } = renderHook(() => usePunchList({ projectId: mockProjectId }));
      await waitFor(() => { expect(result.current.items).toHaveLength(1); });
      await act(async () => { await result.current.updateStatus('pi-1', 'in_progress'); });
      expect(mockFetch).toHaveBeenCalledWith(`/api/projects/${mockProjectId}/punch-list/pi-1`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'in_progress' }),
      });
    });
  });

  describe('stats calculation', () => {
    it('should calculate correct counts', async () => {
      const mockItems = [
        createMockPunchItem({ id: 'pi-1', status: 'open' }),
        createMockPunchItem({ id: 'pi-2', status: 'open' }),
        createMockPunchItem({ id: 'pi-3', status: 'in_progress' }),
        createMockPunchItem({ id: 'pi-4', status: 'in_progress' }),
        createMockPunchItem({ id: 'pi-5', status: 'in_progress' }),
        createMockPunchItem({ id: 'pi-6', status: 'ready_for_review' }),
        createMockPunchItem({ id: 'pi-7', status: 'approved' }),
        createMockPunchItem({ id: 'pi-8', status: 'approved' }),
        createMockPunchItem({ id: 'pi-9', status: 'approved' }),
        createMockPunchItem({ id: 'pi-10', status: 'rejected' }),
      ];
      mockFetch.mockResolvedValue({ ok: true, json: async () => ({ items: mockItems }) });
      const { result } = renderHook(() => usePunchList({ projectId: mockProjectId }));
      await waitFor(() => { expect(result.current.stats.total).toBe(10); });
      expect(result.current.stats.open).toBe(2);
      expect(result.current.stats.inProgress).toBe(3);
      expect(result.current.stats.readyForReview).toBe(1);
      expect(result.current.stats.approved).toBe(3);
      expect(result.current.stats.rejected).toBe(1);
    });

    it('should calculate percentComplete correctly', async () => {
      const mockItems = [
        createMockPunchItem({ id: 'pi-1', status: 'approved' }),
        createMockPunchItem({ id: 'pi-2', status: 'approved' }),
        createMockPunchItem({ id: 'pi-3', status: 'open' }),
        createMockPunchItem({ id: 'pi-4', status: 'in_progress' }),
      ];
      mockFetch.mockResolvedValue({ ok: true, json: async () => ({ items: mockItems }) });
      const { result } = renderHook(() => usePunchList({ projectId: mockProjectId }));
      await waitFor(() => { expect(result.current.stats.total).toBe(4); });
      expect(result.current.stats.percentComplete).toBe(50);
    });

    it('should return 0 percentComplete for empty list', async () => {
      const { result } = renderHook(() => usePunchList({ projectId: mockProjectId }));
      await waitFor(() => { expect(result.current.loading).toBe(false); });
      expect(result.current.stats.percentComplete).toBe(0);
      expect(result.current.stats).toEqual({
        total: 0, open: 0, inProgress: 0, readyForReview: 0,
        approved: 0, rejected: 0, percentComplete: 0,
      });
    });

    it('should round percentComplete correctly', async () => {
      const mockItems = [
        createMockPunchItem({ id: 'pi-1', status: 'approved' }),
        createMockPunchItem({ id: 'pi-2', status: 'open' }),
        createMockPunchItem({ id: 'pi-3', status: 'open' }),
      ];
      mockFetch.mockResolvedValue({ ok: true, json: async () => ({ items: mockItems }) });
      const { result } = renderHook(() => usePunchList({ projectId: mockProjectId }));
      await waitFor(() => { expect(result.current.stats.total).toBe(3); });
      // 1/3 = 33.33... rounds to 33
      expect(result.current.stats.percentComplete).toBe(33);
    });
  });

  describe('refresh', () => {
    it('should re-fetch data when called', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [createMockPunchItem({ id: 'pi-1', title: 'Refreshed' })] }) });
      const { result } = renderHook(() => usePunchList({ projectId: mockProjectId }));
      await waitFor(() => { expect(result.current.loading).toBe(false); });
      expect(result.current.items).toHaveLength(0);
      await act(async () => { await result.current.refresh(); });
      await waitFor(() => { expect(result.current.items).toHaveLength(1); });
      expect(result.current.items[0].title).toBe('Refreshed');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
