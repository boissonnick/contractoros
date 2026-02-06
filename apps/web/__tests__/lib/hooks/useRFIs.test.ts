/**
 * @fileoverview Unit tests for useRFIs hook
 * Sprint 78: Unit Test Coverage Continuation
 *
 * Tests cover:
 * - useRFIs: RFI CRUD, status filtering, respond, close, stats
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useRFIs } from '@/lib/hooks/useRFIs';
import { RFI } from '@/types';

// =============================================================================
// MOCKS
// =============================================================================

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// =============================================================================
// TEST DATA
// =============================================================================

const mockProjectId = 'project-123';

const createMockRFI = (overrides: Partial<RFI> = {}): RFI => ({
  id: `rfi-${Math.random().toString(36).slice(2)}`,
  projectId: mockProjectId,
  orgId: 'org-123',
  number: 1,
  subject: 'Clarification on foundation depth',
  description: 'Need clarification on the specified foundation depth',
  status: 'open',
  priority: 'medium',
  assignedTo: 'user-456',
  createdBy: 'user-123',
  createdAt: new Date('2024-01-15'),
  ...overrides,
});

// =============================================================================
// SETUP AND TEARDOWN
// =============================================================================

beforeEach(() => {
  jest.clearAllMocks();

  // Default successful response
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ items: [] }),
  });
});

// =============================================================================
// useRFIs TESTS
// =============================================================================

describe('useRFIs', () => {
  describe('fetching RFIs', () => {
    it('should return empty RFIs initially', async () => {
      const { result } = renderHook(() => useRFIs({ projectId: mockProjectId }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.rfis).toEqual([]);
    });

    it('should fetch RFIs from API', async () => {
      const mockRFIs = [
        createMockRFI({ id: 'rfi-1', subject: 'RFI 1' }),
        createMockRFI({ id: 'rfi-2', subject: 'RFI 2' }),
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ items: mockRFIs }),
      });

      const { result } = renderHook(() => useRFIs({ projectId: mockProjectId }));

      await waitFor(() => {
        expect(result.current.rfis).toHaveLength(2);
      });

      expect(result.current.rfis[0].subject).toBe('RFI 1');
      expect(result.current.rfis[1].subject).toBe('RFI 2');
    });

    it('should include status filter in query params', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ items: [] }),
      });

      renderHook(() => useRFIs({ projectId: mockProjectId, status: 'open' }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          `/api/projects/${mockProjectId}/rfis?status=open`
        );
      });
    });

    it('should not fetch without projectId', async () => {
      renderHook(() => useRFIs({ projectId: '' }));

      // Wait a bit to ensure fetch wasn't called
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should set error on fetch failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
      });

      const { result } = renderHook(() => useRFIs({ projectId: mockProjectId }));

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to fetch RFIs');
      });
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useRFIs({ projectId: mockProjectId }));

      await waitFor(() => {
        expect(result.current.error).toBe('Network error');
      });
    });
  });

  describe('stats calculation', () => {
    it('should calculate RFI stats correctly', async () => {
      const mockRFIs = [
        createMockRFI({ id: 'rfi-1', status: 'draft' }),
        createMockRFI({ id: 'rfi-2', status: 'open' }),
        createMockRFI({ id: 'rfi-3', status: 'open' }),
        createMockRFI({ id: 'rfi-4', status: 'pending_response' }),
        createMockRFI({ id: 'rfi-5', status: 'answered' }),
        createMockRFI({ id: 'rfi-6', status: 'closed' }),
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ items: mockRFIs }),
      });

      const { result } = renderHook(() => useRFIs({ projectId: mockProjectId }));

      await waitFor(() => {
        expect(result.current.stats.total).toBe(6);
      });

      expect(result.current.stats.draft).toBe(1);
      expect(result.current.stats.open).toBe(2);
      expect(result.current.stats.pendingResponse).toBe(1);
      expect(result.current.stats.answered).toBe(1);
      expect(result.current.stats.closed).toBe(1);
    });

    it('should calculate overdue count correctly', async () => {
      const pastDate = new Date('2020-01-01');
      const futureDate = new Date('2099-01-01');

      const mockRFIs = [
        createMockRFI({ id: 'rfi-1', status: 'open', dueDate: pastDate }), // Overdue
        createMockRFI({ id: 'rfi-2', status: 'open', dueDate: futureDate }), // Not overdue
        createMockRFI({ id: 'rfi-3', status: 'closed', dueDate: pastDate }), // Closed, not counted
        createMockRFI({ id: 'rfi-4', status: 'pending_response', dueDate: pastDate }), // Overdue
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ items: mockRFIs }),
      });

      const { result } = renderHook(() => useRFIs({ projectId: mockProjectId }));

      await waitFor(() => {
        expect(result.current.stats.overdue).toBe(2);
      });
    });

    it('should return zero stats when no RFIs', async () => {
      const { result } = renderHook(() => useRFIs({ projectId: mockProjectId }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats).toEqual({
        total: 0,
        draft: 0,
        open: 0,
        pendingResponse: 0,
        answered: 0,
        closed: 0,
        overdue: 0,
      });
    });
  });

  describe('createRFI', () => {
    it('should create new RFI', async () => {
      const newRFI = createMockRFI({ id: 'new-rfi-1' });

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) })
        .mockResolvedValueOnce({ ok: true, json: async () => newRFI });

      const { result } = renderHook(() => useRFIs({ projectId: mockProjectId }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let created: RFI;
      await act(async () => {
        created = await result.current.createRFI({
          subject: 'New RFI',
          description: 'Test description',
        });
      });

      expect(mockFetch).toHaveBeenCalledWith(`/api/projects/${mockProjectId}/rfis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: 'New RFI', description: 'Test description' }),
      });

      expect(created!.id).toBe('new-rfi-1');
    });

    it('should add created RFI to local state', async () => {
      const newRFI = createMockRFI({ id: 'new-rfi-1', subject: 'Created RFI' });

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) })
        .mockResolvedValueOnce({ ok: true, json: async () => newRFI });

      const { result } = renderHook(() => useRFIs({ projectId: mockProjectId }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.createRFI({ subject: 'Created RFI' });
      });

      expect(result.current.rfis).toHaveLength(1);
      expect(result.current.rfis[0].subject).toBe('Created RFI');
    });

    it('should throw error on create failure', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) })
        .mockResolvedValueOnce({ ok: false });

      const { result } = renderHook(() => useRFIs({ projectId: mockProjectId }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(result.current.createRFI({ subject: 'Test' })).rejects.toThrow(
        'Failed to create RFI'
      );
    });
  });

  describe('updateRFI', () => {
    it('should update RFI', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ items: [createMockRFI({ id: 'rfi-1' })] }),
        })
        .mockResolvedValueOnce({ ok: true }) // PATCH response
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ items: [createMockRFI({ id: 'rfi-1', subject: 'Updated' })] }),
        });

      const { result } = renderHook(() => useRFIs({ projectId: mockProjectId }));

      await waitFor(() => {
        expect(result.current.rfis).toHaveLength(1);
      });

      await act(async () => {
        await result.current.updateRFI('rfi-1', { subject: 'Updated Subject' });
      });

      expect(mockFetch).toHaveBeenCalledWith(`/api/projects/${mockProjectId}/rfis/rfi-1`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: 'Updated Subject' }),
      });
    });

    it('should throw error on update failure', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) })
        .mockResolvedValueOnce({ ok: false });

      const { result } = renderHook(() => useRFIs({ projectId: mockProjectId }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(result.current.updateRFI('rfi-1', { subject: 'Test' })).rejects.toThrow(
        'Failed to update RFI'
      );
    });
  });

  describe('respondToRFI', () => {
    it('should respond to RFI and set status to answered', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ items: [createMockRFI({ id: 'rfi-1', status: 'open' })] }),
        })
        .mockResolvedValueOnce({ ok: true }) // PATCH response
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ items: [createMockRFI({ id: 'rfi-1', status: 'answered' })] }),
        });

      const { result } = renderHook(() => useRFIs({ projectId: mockProjectId }));

      await waitFor(() => {
        expect(result.current.rfis).toHaveLength(1);
      });

      await act(async () => {
        await result.current.respondToRFI('rfi-1', 'This is the response');
      });

      expect(mockFetch).toHaveBeenCalledWith(`/api/projects/${mockProjectId}/rfis/rfi-1`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'answered' }),
      });
    });
  });

  describe('closeRFI', () => {
    it('should close RFI', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ items: [createMockRFI({ id: 'rfi-1', status: 'answered' })] }),
        })
        .mockResolvedValueOnce({ ok: true }) // PATCH response
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ items: [createMockRFI({ id: 'rfi-1', status: 'closed' })] }),
        });

      const { result } = renderHook(() => useRFIs({ projectId: mockProjectId }));

      await waitFor(() => {
        expect(result.current.rfis).toHaveLength(1);
      });

      await act(async () => {
        await result.current.closeRFI('rfi-1');
      });

      expect(mockFetch).toHaveBeenCalledWith(`/api/projects/${mockProjectId}/rfis/rfi-1`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed' }),
      });
    });
  });

  describe('refresh', () => {
    it('should refresh RFI list', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ items: [createMockRFI({ subject: 'Refreshed RFI' })] }),
        });

      const { result } = renderHook(() => useRFIs({ projectId: mockProjectId }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.rfis).toHaveLength(0);

      await act(async () => {
        await result.current.refresh();
      });

      await waitFor(() => {
        expect(result.current.rfis).toHaveLength(1);
      });

      expect(result.current.rfis[0].subject).toBe('Refreshed RFI');
    });
  });
});
