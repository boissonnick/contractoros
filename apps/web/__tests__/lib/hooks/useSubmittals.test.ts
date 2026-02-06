/**
 * @fileoverview Unit tests for useSubmittals hook
 * Sprint 80: Unit Test Coverage
 *
 * Tests cover:
 * - useSubmittals: Submittal CRUD, approval workflow, stats calculation
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useSubmittals } from '@/lib/hooks/useSubmittals';
import type { Submittal, SubmittalStatus } from '@/types';

// =============================================================================
// MOCKS
// =============================================================================

const mockFetch = jest.fn();
global.fetch = mockFetch;

// =============================================================================
// TEST DATA
// =============================================================================

const mockProjectId = 'project-123';
const mockOrgId = 'org-123';

const createMockSubmittal = (overrides: Partial<Submittal> = {}): Submittal => ({
  id: `sub-${Math.random().toString(36).slice(2)}`,
  projectId: mockProjectId,
  orgId: mockOrgId,
  number: 'SUB-001',
  title: 'Shop Drawing - Steel Beams',
  description: 'Structural steel shop drawings for review',
  status: 'draft' as SubmittalStatus,
  priority: 'medium',
  specSection: '05 12 00',
  type: 'shop_drawing',
  submittedBy: 'user-123',
  submittedByName: 'Test User',
  assignedTo: 'user-456',
  assignedToName: 'Reviewer User',
  revisionNumber: 1,
  dueDate: new Date('2024-03-15'),
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
// useSubmittals TESTS
// =============================================================================

describe('useSubmittals', () => {
  describe('fetching submittals', () => {
    it('should return loading=true initially then false after fetch', async () => {
      const { result } = renderHook(() => useSubmittals({ projectId: mockProjectId }));
      expect(result.current.loading).toBe(true);
      await waitFor(() => { expect(result.current.loading).toBe(false); });
    });

    it('should return empty submittals by default', async () => {
      const { result } = renderHook(() => useSubmittals({ projectId: mockProjectId }));
      await waitFor(() => { expect(result.current.loading).toBe(false); });
      expect(result.current.submittals).toEqual([]);
    });

    it('should fetch submittals from correct API URL', async () => {
      renderHook(() => useSubmittals({ projectId: mockProjectId }));
      await waitFor(() => { expect(mockFetch).toHaveBeenCalledWith(`/api/projects/${mockProjectId}/submittals?`); });
    });

    it('should pass status filter as query param', async () => {
      renderHook(() => useSubmittals({ projectId: mockProjectId, status: 'pending_review' }));
      await waitFor(() => { expect(mockFetch).toHaveBeenCalledWith(`/api/projects/${mockProjectId}/submittals?status=pending_review`); });
    });

    it('should populate submittals from API response', async () => {
      const mockSubmittals = [
        createMockSubmittal({ id: 'sub-1', title: 'Shop Drawing A' }),
        createMockSubmittal({ id: 'sub-2', title: 'Product Data B' }),
      ];
      mockFetch.mockResolvedValue({ ok: true, json: async () => ({ items: mockSubmittals }) });
      const { result } = renderHook(() => useSubmittals({ projectId: mockProjectId }));
      await waitFor(() => { expect(result.current.submittals).toHaveLength(2); });
      expect(result.current.submittals[0].title).toBe('Shop Drawing A');
      expect(result.current.submittals[1].title).toBe('Product Data B');
    });

    it('should handle fetch error (non-ok response)', async () => {
      mockFetch.mockResolvedValue({ ok: false });
      const { result } = renderHook(() => useSubmittals({ projectId: mockProjectId }));
      await waitFor(() => { expect(result.current.error).toBe('Failed to fetch submittals'); });
      expect(result.current.loading).toBe(false);
    });

    it('should handle network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      const { result } = renderHook(() => useSubmittals({ projectId: mockProjectId }));
      await waitFor(() => { expect(result.current.error).toBe('Network error'); });
      expect(result.current.loading).toBe(false);
    });

    it('should return error string on failure with non-Error thrown', async () => {
      mockFetch.mockRejectedValue('string error');
      const { result } = renderHook(() => useSubmittals({ projectId: mockProjectId }));
      await waitFor(() => { expect(result.current.error).toBe('Unknown error'); });
    });

    it('should not fetch without projectId', async () => {
      renderHook(() => useSubmittals({ projectId: '' }));
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle response with missing items field gracefully', async () => {
      mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
      const { result } = renderHook(() => useSubmittals({ projectId: mockProjectId }));
      await waitFor(() => { expect(result.current.loading).toBe(false); });
      expect(result.current.submittals).toEqual([]);
    });
  });

  describe('createSubmittal', () => {
    it('should POST to correct URL with JSON body', async () => {
      const newSubmittal = createMockSubmittal({ id: 'new-sub-1' });
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) })
        .mockResolvedValueOnce({ ok: true, json: async () => newSubmittal });
      const { result } = renderHook(() => useSubmittals({ projectId: mockProjectId }));
      await waitFor(() => { expect(result.current.loading).toBe(false); });
      const createData = { title: 'New Submittal', status: 'draft' as SubmittalStatus };
      await act(async () => { await result.current.createSubmittal(createData); });
      expect(mockFetch).toHaveBeenCalledWith(`/api/projects/${mockProjectId}/submittals`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(createData),
      });
    });

    it('should add new submittal to state', async () => {
      const newSubmittal = createMockSubmittal({ id: 'new-sub-1', title: 'Created Submittal' });
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) })
        .mockResolvedValueOnce({ ok: true, json: async () => newSubmittal });
      const { result } = renderHook(() => useSubmittals({ projectId: mockProjectId }));
      await waitFor(() => { expect(result.current.loading).toBe(false); });
      await act(async () => { await result.current.createSubmittal({ title: 'Created Submittal' }); });
      expect(result.current.submittals).toHaveLength(1);
      expect(result.current.submittals[0].title).toBe('Created Submittal');
    });

    it('should prepend new submittal to existing list', async () => {
      const existing = [createMockSubmittal({ id: 'existing-1', title: 'Existing' })];
      const newSubmittal = createMockSubmittal({ id: 'new-sub-1', title: 'New' });
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ items: existing }) })
        .mockResolvedValueOnce({ ok: true, json: async () => newSubmittal });
      const { result } = renderHook(() => useSubmittals({ projectId: mockProjectId }));
      await waitFor(() => { expect(result.current.submittals).toHaveLength(1); });
      await act(async () => { await result.current.createSubmittal({ title: 'New' }); });
      expect(result.current.submittals).toHaveLength(2);
      expect(result.current.submittals[0].title).toBe('New');
      expect(result.current.submittals[1].title).toBe('Existing');
    });

    it('should return created submittal', async () => {
      const newSubmittal = createMockSubmittal({ id: 'new-sub-1' });
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) })
        .mockResolvedValueOnce({ ok: true, json: async () => newSubmittal });
      const { result } = renderHook(() => useSubmittals({ projectId: mockProjectId }));
      await waitFor(() => { expect(result.current.loading).toBe(false); });
      let created: Submittal;
      await act(async () => { created = await result.current.createSubmittal({ title: 'Test' }); });
      expect(created!.id).toBe('new-sub-1');
    });

    it('should throw on failure', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) })
        .mockResolvedValueOnce({ ok: false });
      const { result } = renderHook(() => useSubmittals({ projectId: mockProjectId }));
      await waitFor(() => { expect(result.current.loading).toBe(false); });
      await expect(result.current.createSubmittal({ title: 'Test' })).rejects.toThrow('Failed to create submittal');
    });
  });

  describe('updateSubmittal', () => {
    it('should PATCH correct URL with JSON body', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [createMockSubmittal({ id: 'sub-1' })] }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [createMockSubmittal({ id: 'sub-1', title: 'Updated' })] }) });
      const { result } = renderHook(() => useSubmittals({ projectId: mockProjectId }));
      await waitFor(() => { expect(result.current.submittals).toHaveLength(1); });
      const updateData = { title: 'Updated Title' };
      await act(async () => { await result.current.updateSubmittal('sub-1', updateData); });
      expect(mockFetch).toHaveBeenCalledWith(`/api/projects/${mockProjectId}/submittals/sub-1`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updateData),
      });
    });

    it('should refetch submittals after update', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [createMockSubmittal({ id: 'sub-1', title: 'Original' })] }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [createMockSubmittal({ id: 'sub-1', title: 'Updated' })] }) });
      const { result } = renderHook(() => useSubmittals({ projectId: mockProjectId }));
      await waitFor(() => { expect(result.current.submittals[0].title).toBe('Original'); });
      await act(async () => { await result.current.updateSubmittal('sub-1', { title: 'Updated' }); });
      await waitFor(() => { expect(result.current.submittals[0].title).toBe('Updated'); });
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should throw on failure', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) })
        .mockResolvedValueOnce({ ok: false });
      const { result } = renderHook(() => useSubmittals({ projectId: mockProjectId }));
      await waitFor(() => { expect(result.current.loading).toBe(false); });
      await expect(result.current.updateSubmittal('sub-1', { title: 'Test' })).rejects.toThrow('Failed to update submittal');
    });
  });

  describe('approveSubmittal', () => {
    it('should call updateSubmittal with approved status', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) });
      const { result } = renderHook(() => useSubmittals({ projectId: mockProjectId }));
      await waitFor(() => { expect(result.current.loading).toBe(false); });
      await act(async () => { await result.current.approveSubmittal('sub-1', 'Looks good'); });
      const patchCall = mockFetch.mock.calls[1];
      expect(patchCall[0]).toBe(`/api/projects/${mockProjectId}/submittals/sub-1`);
      expect(patchCall[1].method).toBe('PATCH');
      const body = JSON.parse(patchCall[1].body);
      expect(body.status).toBe('approved');
      expect(body.reviewComments).toBe('Looks good');
      expect(body.reviewedAt).toBeDefined();
    });

    it('should approve without comments', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) });
      const { result } = renderHook(() => useSubmittals({ projectId: mockProjectId }));
      await waitFor(() => { expect(result.current.loading).toBe(false); });
      await act(async () => { await result.current.approveSubmittal('sub-1'); });
      const body = JSON.parse(mockFetch.mock.calls[1][1].body);
      expect(body.status).toBe('approved');
      expect(body.reviewComments).toBeUndefined();
    });
  });

  describe('rejectSubmittal', () => {
    it('should call updateSubmittal with rejected status and reason', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) });
      const { result } = renderHook(() => useSubmittals({ projectId: mockProjectId }));
      await waitFor(() => { expect(result.current.loading).toBe(false); });
      await act(async () => { await result.current.rejectSubmittal('sub-1', 'Does not meet spec'); });
      const body = JSON.parse(mockFetch.mock.calls[1][1].body);
      expect(body.status).toBe('rejected');
      expect(body.reviewComments).toBe('Does not meet spec');
      expect(body.reviewedAt).toBeDefined();
    });
  });

  describe('requestRevision', () => {
    it('should call updateSubmittal with revise_resubmit status', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) });
      const { result } = renderHook(() => useSubmittals({ projectId: mockProjectId }));
      await waitFor(() => { expect(result.current.loading).toBe(false); });
      await act(async () => { await result.current.requestRevision('sub-1', 'Please revise section 3'); });
      const body = JSON.parse(mockFetch.mock.calls[1][1].body);
      expect(body.status).toBe('revise_resubmit');
      expect(body.reviewComments).toBe('Please revise section 3');
      expect(body.reviewedAt).toBeDefined();
    });
  });

  describe('stats calculation', () => {
    it('should calculate correct counts by status', async () => {
      const mockSubmittals = [
        createMockSubmittal({ id: 'sub-1', status: 'draft' }),
        createMockSubmittal({ id: 'sub-2', status: 'draft' }),
        createMockSubmittal({ id: 'sub-3', status: 'pending_review' }),
        createMockSubmittal({ id: 'sub-4', status: 'pending_review' }),
        createMockSubmittal({ id: 'sub-5', status: 'pending_review' }),
        createMockSubmittal({ id: 'sub-6', status: 'approved' }),
        createMockSubmittal({ id: 'sub-7', status: 'approved_as_noted' }),
        createMockSubmittal({ id: 'sub-8', status: 'revise_resubmit' }),
        createMockSubmittal({ id: 'sub-9', status: 'rejected' }),
        createMockSubmittal({ id: 'sub-10', status: 'rejected' }),
      ];
      mockFetch.mockResolvedValue({ ok: true, json: async () => ({ items: mockSubmittals }) });
      const { result } = renderHook(() => useSubmittals({ projectId: mockProjectId }));
      await waitFor(() => { expect(result.current.stats.total).toBe(10); });
      expect(result.current.stats.draft).toBe(2);
      expect(result.current.stats.pendingReview).toBe(3);
      expect(result.current.stats.approved).toBe(1);
      expect(result.current.stats.approvedAsNoted).toBe(1);
      expect(result.current.stats.reviseResubmit).toBe(1);
      expect(result.current.stats.rejected).toBe(2);
    });

    it('should handle empty submittals', async () => {
      const { result } = renderHook(() => useSubmittals({ projectId: mockProjectId }));
      await waitFor(() => { expect(result.current.loading).toBe(false); });
      expect(result.current.stats).toEqual({
        total: 0, draft: 0, pendingReview: 0, approved: 0,
        approvedAsNoted: 0, reviseResubmit: 0, rejected: 0,
      });
    });
  });

  describe('refresh', () => {
    it('should re-fetch data when called', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [createMockSubmittal({ id: 'sub-1', title: 'Refreshed' })] }) });
      const { result } = renderHook(() => useSubmittals({ projectId: mockProjectId }));
      await waitFor(() => { expect(result.current.loading).toBe(false); });
      expect(result.current.submittals).toHaveLength(0);
      await act(async () => { await result.current.refresh(); });
      await waitFor(() => { expect(result.current.submittals).toHaveLength(1); });
      expect(result.current.submittals[0].title).toBe('Refreshed');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
