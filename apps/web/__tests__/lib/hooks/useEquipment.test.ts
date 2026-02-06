/**
 * @fileoverview Unit tests for useEquipment hook
 * Sprint 78: Unit Test Coverage Continuation
 *
 * Tests cover:
 * - useEquipment: Equipment CRUD, checkout/return operations, stats
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useEquipment } from '@/lib/hooks/useEquipment';
import { EquipmentItem } from '@/types';

// =============================================================================
// MOCKS
// =============================================================================

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// =============================================================================
// TEST DATA
// =============================================================================

const mockOrgId = 'org-123';

const createMockEquipment = (overrides: Partial<EquipmentItem> = {}): EquipmentItem => ({
  id: `equip-${Math.random().toString(36).slice(2)}`,
  orgId: mockOrgId,
  name: 'Power Drill',
  category: 'tools',
  status: 'available',
  serialNumber: 'SN-12345',
  purchaseDate: new Date('2023-06-15'),
  purchasePrice: 299.99,
  currentValue: 250.0,
  condition: 'good',
  createdAt: new Date('2023-06-15'),
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
// useEquipment TESTS
// =============================================================================

describe('useEquipment', () => {
  describe('fetching equipment', () => {
    it('should return empty equipment initially', async () => {
      const { result } = renderHook(() => useEquipment({ orgId: mockOrgId }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.equipment).toEqual([]);
    });

    it('should fetch equipment from API', async () => {
      const mockEquipment = [
        createMockEquipment({ id: 'equip-1', name: 'Drill' }),
        createMockEquipment({ id: 'equip-2', name: 'Saw' }),
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ items: mockEquipment }),
      });

      const { result } = renderHook(() => useEquipment({ orgId: mockOrgId }));

      await waitFor(() => {
        expect(result.current.equipment).toHaveLength(2);
      });

      expect(result.current.equipment[0].name).toBe('Drill');
      expect(result.current.equipment[1].name).toBe('Saw');
    });

    it('should include projectId filter in query params', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ items: [] }),
      });

      renderHook(() => useEquipment({ orgId: mockOrgId, projectId: 'project-123' }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/equipment?projectId=project-123');
      });
    });

    it('should include status filter in query params', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ items: [] }),
      });

      renderHook(() => useEquipment({ orgId: mockOrgId, status: 'checked_out' }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/equipment?status=checked_out');
      });
    });

    it('should handle multiple filters', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ items: [] }),
      });

      renderHook(() =>
        useEquipment({ orgId: mockOrgId, projectId: 'project-123', status: 'available' })
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/equipment?projectId=project-123&status=available'
        );
      });
    });

    it('should not fetch without orgId', async () => {
      renderHook(() => useEquipment({ orgId: '' }));

      // Wait a bit to ensure fetch wasn't called
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should set error on fetch failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
      });

      const { result } = renderHook(() => useEquipment({ orgId: mockOrgId }));

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to fetch equipment');
      });
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useEquipment({ orgId: mockOrgId }));

      await waitFor(() => {
        expect(result.current.error).toBe('Network error');
      });
    });
  });

  describe('stats calculation', () => {
    it('should calculate equipment stats correctly', async () => {
      const mockEquipment = [
        createMockEquipment({ id: 'equip-1', status: 'available' }),
        createMockEquipment({ id: 'equip-2', status: 'available' }),
        createMockEquipment({ id: 'equip-3', status: 'checked_out' }),
        createMockEquipment({ id: 'equip-4', status: 'maintenance' }),
        createMockEquipment({ id: 'equip-5', status: 'retired' }),
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ items: mockEquipment }),
      });

      const { result } = renderHook(() => useEquipment({ orgId: mockOrgId }));

      await waitFor(() => {
        expect(result.current.stats.total).toBe(5);
      });

      expect(result.current.stats.available).toBe(2);
      expect(result.current.stats.checkedOut).toBe(1);
      expect(result.current.stats.maintenance).toBe(1);
      expect(result.current.stats.retired).toBe(1);
    });

    it('should return zero stats when no equipment', async () => {
      const { result } = renderHook(() => useEquipment({ orgId: mockOrgId }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats).toEqual({
        total: 0,
        available: 0,
        checkedOut: 0,
        maintenance: 0,
        retired: 0,
      });
    });
  });

  describe('createEquipment', () => {
    it('should create new equipment', async () => {
      const newEquipment = createMockEquipment({ id: 'new-equip-1' });

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) })
        .mockResolvedValueOnce({ ok: true, json: async () => newEquipment });

      const { result } = renderHook(() => useEquipment({ orgId: mockOrgId }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let created: EquipmentItem;
      await act(async () => {
        created = await result.current.createEquipment({
          name: 'New Drill',
          category: 'tools',
          status: 'available',
        });
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Drill', category: 'tools', status: 'available' }),
      });

      expect(created!.id).toBe('new-equip-1');
    });

    it('should add created equipment to local state', async () => {
      const newEquipment = createMockEquipment({ id: 'new-equip-1', name: 'Created Item' });

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) })
        .mockResolvedValueOnce({ ok: true, json: async () => newEquipment });

      const { result } = renderHook(() => useEquipment({ orgId: mockOrgId }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.createEquipment({ name: 'Created Item' });
      });

      expect(result.current.equipment).toHaveLength(1);
      expect(result.current.equipment[0].name).toBe('Created Item');
    });

    it('should throw error on create failure', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) })
        .mockResolvedValueOnce({ ok: false });

      const { result } = renderHook(() => useEquipment({ orgId: mockOrgId }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(result.current.createEquipment({ name: 'Test' })).rejects.toThrow(
        'Failed to create equipment'
      );
    });
  });

  describe('updateEquipment', () => {
    it('should update equipment', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ items: [createMockEquipment({ id: 'equip-1' })] }),
        })
        .mockResolvedValueOnce({ ok: true }) // PATCH response
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ items: [createMockEquipment({ id: 'equip-1', name: 'Updated' })] }),
        });

      const { result } = renderHook(() => useEquipment({ orgId: mockOrgId }));

      await waitFor(() => {
        expect(result.current.equipment).toHaveLength(1);
      });

      await act(async () => {
        await result.current.updateEquipment('equip-1', { name: 'Updated Name' });
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/equipment/equip-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated Name' }),
      });
    });

    it('should throw error on update failure', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) })
        .mockResolvedValueOnce({ ok: false });

      const { result } = renderHook(() => useEquipment({ orgId: mockOrgId }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(result.current.updateEquipment('equip-1', { name: 'Test' })).rejects.toThrow(
        'Failed to update equipment'
      );
    });
  });

  describe('deleteEquipment', () => {
    it('should delete equipment', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ items: [createMockEquipment({ id: 'equip-1' })] }),
        })
        .mockResolvedValueOnce({ ok: true });

      const { result } = renderHook(() => useEquipment({ orgId: mockOrgId }));

      await waitFor(() => {
        expect(result.current.equipment).toHaveLength(1);
      });

      await act(async () => {
        await result.current.deleteEquipment('equip-1');
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/equipment/equip-1', {
        method: 'DELETE',
      });

      // Should be removed from local state
      expect(result.current.equipment).toHaveLength(0);
    });

    it('should throw error on delete failure', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) })
        .mockResolvedValueOnce({ ok: false });

      const { result } = renderHook(() => useEquipment({ orgId: mockOrgId }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(result.current.deleteEquipment('equip-1')).rejects.toThrow(
        'Failed to delete equipment'
      );
    });
  });

  describe('checkOut', () => {
    it('should check out equipment', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) })
        .mockResolvedValueOnce({ ok: true })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) });

      const { result } = renderHook(() => useEquipment({ orgId: mockOrgId }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.checkOut('equip-1', {
          userId: 'user-123',
          userName: 'John Doe',
          projectId: 'project-123',
          projectName: 'Main Project',
          notes: 'Needed for drilling',
        });
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/equipment/equip-1/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'user-123',
          userName: 'John Doe',
          projectId: 'project-123',
          projectName: 'Main Project',
          notes: 'Needed for drilling',
        }),
      });
    });

    it('should throw error on checkout failure', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) })
        .mockResolvedValueOnce({ ok: false });

      const { result } = renderHook(() => useEquipment({ orgId: mockOrgId }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        result.current.checkOut('equip-1', {
          userId: 'user-123',
          userName: 'John Doe',
        })
      ).rejects.toThrow('Failed to check out equipment');
    });
  });

  describe('returnEquipment', () => {
    it('should return equipment', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) })
        .mockResolvedValueOnce({ ok: true })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) });

      const { result } = renderHook(() => useEquipment({ orgId: mockOrgId }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.returnEquipment('equip-1', {
          condition: 'good',
          notes: 'Returned in good condition',
        });
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/equipment/equip-1/return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          condition: 'good',
          notes: 'Returned in good condition',
        }),
      });
    });

    it('should throw error on return failure', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) })
        .mockResolvedValueOnce({ ok: false });

      const { result } = renderHook(() => useEquipment({ orgId: mockOrgId }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        result.current.returnEquipment('equip-1', { condition: 'good' })
      ).rejects.toThrow('Failed to return equipment');
    });
  });

  describe('refresh', () => {
    it('should refresh equipment list', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ items: [createMockEquipment({ name: 'Refreshed' })] }),
        });

      const { result } = renderHook(() => useEquipment({ orgId: mockOrgId }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.equipment).toHaveLength(0);

      await act(async () => {
        await result.current.refresh();
      });

      await waitFor(() => {
        expect(result.current.equipment).toHaveLength(1);
      });

      expect(result.current.equipment[0].name).toBe('Refreshed');
    });
  });
});
