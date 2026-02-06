/**
 * @fileoverview Unit tests for useMaterials/useMaterialsCore hook
 * Sprint 78: Unit Test Coverage Continuation
 *
 * Tests cover:
 * - useMaterialsCore: Material CRUD, filtering, quantity adjustments, stats
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useMaterialsCore } from '@/lib/hooks/materials/useMaterialsCore';
import { MaterialItem, MaterialStatus } from '@/types';

// =============================================================================
// MOCKS
// =============================================================================

const mockUser = { uid: 'user-123', email: 'test@example.com' };
const mockProfile = {
  uid: 'user-123',
  orgId: 'org-123',
  displayName: 'Test User',
  role: 'OWNER' as const,
};

jest.mock('@/lib/auth', () => ({
  useAuth: jest.fn(() => ({
    user: mockUser,
    profile: mockProfile,
  })),
}));

// Mock the utils module to handle timestamp conversion
jest.mock('@/lib/hooks/materials/utils', () => ({
  convertTimestamp: jest.fn((timestamp) => {
    if (!timestamp) return undefined;
    if (typeof timestamp?.toDate === 'function') return timestamp.toDate();
    return timestamp;
  }),
}));

// Mock Firestore
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  query: jest.fn(),
  where: jest.fn((field, op, value) => ({ field, op, value, _type: 'where' })),
  orderBy: jest.fn((field, dir) => ({ field, dir, _type: 'orderBy' })),
  onSnapshot: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  getDoc: jest.fn(),
  serverTimestamp: jest.fn(() => ({ _serverTimestamp: true })),
  writeBatch: jest.fn(() => ({
    update: jest.fn(),
    set: jest.fn(),
    commit: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('@/lib/firebase/config', () => ({
  db: {},
}));

// Import mocked modules
import { useAuth } from '@/lib/auth';
import { onSnapshot, addDoc, updateDoc, deleteDoc, getDoc, writeBatch } from 'firebase/firestore';

const mockUseAuth = useAuth as jest.Mock;

// =============================================================================
// TEST DATA
// =============================================================================

const mockOrgId = 'org-123';

const createMockMaterial = (overrides: Partial<MaterialItem> = {}): MaterialItem => ({
  id: `mat-${Math.random().toString(36).slice(2)}`,
  orgId: mockOrgId,
  name: '2x4 Lumber',
  sku: 'LUM-2x4-8',
  category: 'lumber',
  status: 'in_stock' as MaterialStatus,
  unit: 'piece',
  unitCost: 5.99,
  quantityOnHand: 100,
  quantityReserved: 10,
  quantityAvailable: 90,
  reorderPoint: 20,
  createdAt: new Date('2024-01-15'),
  createdBy: 'user-123',
  ...overrides,
});

// =============================================================================
// SETUP AND TEARDOWN
// =============================================================================

beforeEach(() => {
  jest.clearAllMocks();

  mockUseAuth.mockReturnValue({
    user: mockUser,
    profile: mockProfile,
  });

  // Default mock for onSnapshot
  (onSnapshot as jest.Mock).mockImplementation((_query, onNext, _onError) => {
    setTimeout(() => {
      onNext({ docs: [] });
    }, 0);
    return jest.fn(); // Unsubscribe function
  });

  // Default mock implementations
  (addDoc as jest.Mock).mockResolvedValue({ id: 'new-doc-id' });
  (updateDoc as jest.Mock).mockResolvedValue(undefined);
  (deleteDoc as jest.Mock).mockResolvedValue(undefined);
  (getDoc as jest.Mock).mockResolvedValue({
    exists: () => true,
    data: () => createMockMaterial(),
  });
});

// =============================================================================
// useMaterialsCore TESTS
// =============================================================================

describe('useMaterialsCore', () => {
  describe('basic functionality', () => {
    it('should return empty materials when no data', async () => {
      const { result } = renderHook(() => useMaterialsCore());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.materials).toEqual([]);
    });

    it('should return materials from Firestore', async () => {
      const mockMaterials = [
        createMockMaterial({ id: 'mat-1', name: 'Lumber' }),
        createMockMaterial({ id: 'mat-2', name: 'Nails' }),
      ];

      (onSnapshot as jest.Mock).mockImplementation((query, onNext) => {
        setTimeout(() => {
          onNext({
            docs: mockMaterials.map((mat) => ({
              id: mat.id,
              data: () => ({
                ...mat,
                createdAt: { toDate: () => mat.createdAt },
                updatedAt: mat.updatedAt ? { toDate: () => mat.updatedAt } : undefined,
              }),
            })),
          });
        }, 0);
        return jest.fn();
      });

      const { result } = renderHook(() => useMaterialsCore());

      await waitFor(() => {
        expect(result.current.materials).toHaveLength(2);
      });

      expect(result.current.materials[0].name).toBe('Lumber');
      expect(result.current.materials[1].name).toBe('Nails');
    });

    it('should not fetch without orgId', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        profile: null,
      });

      const { result } = renderHook(() => useMaterialsCore());

      expect(result.current.loading).toBe(false);
      expect(result.current.materials).toEqual([]);
    });

    it('should handle errors from Firestore', async () => {
      const mockError = new Error('Firestore error');

      (onSnapshot as jest.Mock).mockImplementation((query, onNext, onError) => {
        setTimeout(() => {
          onError(mockError);
        }, 0);
        return jest.fn();
      });

      const { result } = renderHook(() => useMaterialsCore());

      await waitFor(() => {
        expect(result.current.error).toBe(mockError);
      });
    });
  });

  describe('filtering', () => {
    it('should filter by category', async () => {
      const { where } = require('firebase/firestore');

      renderHook(() => useMaterialsCore({ category: 'lumber' }));

      await waitFor(() => {
        expect(where).toHaveBeenCalledWith('category', '==', 'lumber');
      });
    });

    it('should filter by status', async () => {
      const { where } = require('firebase/firestore');

      renderHook(() => useMaterialsCore({ status: 'low_stock' }));

      await waitFor(() => {
        expect(where).toHaveBeenCalledWith('status', '==', 'low_stock');
      });
    });

    it('should filter by search term (client-side)', async () => {
      const mockMaterials = [
        createMockMaterial({ id: 'mat-1', name: 'Lumber', sku: 'LUM-001' }),
        createMockMaterial({ id: 'mat-2', name: 'Nails', sku: 'NAIL-001' }),
        createMockMaterial({ id: 'mat-3', name: 'Paint', description: 'Contains lumber dust' }),
      ];

      (onSnapshot as jest.Mock).mockImplementation((query, onNext) => {
        setTimeout(() => {
          onNext({
            docs: mockMaterials.map((mat) => ({
              id: mat.id,
              data: () => ({
                ...mat,
                createdAt: { toDate: () => mat.createdAt },
              }),
            })),
          });
        }, 0);
        return jest.fn();
      });

      const { result } = renderHook(() => useMaterialsCore({ searchTerm: 'lumber' }));

      await waitFor(() => {
        expect(result.current.materials).toHaveLength(2);
      });

      // Should match name 'Lumber' and description 'Contains lumber dust'
      expect(result.current.materials.map((m) => m.id)).toContain('mat-1');
      expect(result.current.materials.map((m) => m.id)).toContain('mat-3');
    });

    it('should filter by low stock only', async () => {
      const mockMaterials = [
        createMockMaterial({ id: 'mat-1', quantityOnHand: 100, reorderPoint: 20 }), // Not low
        createMockMaterial({ id: 'mat-2', quantityOnHand: 15, reorderPoint: 20 }), // Low
        createMockMaterial({ id: 'mat-3', quantityOnHand: 20, reorderPoint: 20 }), // At reorder point (low)
      ];

      (onSnapshot as jest.Mock).mockImplementation((query, onNext) => {
        setTimeout(() => {
          onNext({
            docs: mockMaterials.map((mat) => ({
              id: mat.id,
              data: () => ({
                ...mat,
                createdAt: { toDate: () => mat.createdAt },
              }),
            })),
          });
        }, 0);
        return jest.fn();
      });

      const { result } = renderHook(() => useMaterialsCore({ lowStockOnly: true }));

      await waitFor(() => {
        expect(result.current.materials).toHaveLength(2);
      });

      expect(result.current.materials.map((m) => m.id)).toContain('mat-2');
      expect(result.current.materials.map((m) => m.id)).toContain('mat-3');
    });
  });

  describe('stats calculation', () => {
    it('should calculate material stats correctly', async () => {
      const mockMaterials = [
        createMockMaterial({
          id: 'mat-1',
          status: 'in_stock',
          quantityOnHand: 50,
          unitCost: 10,
        }),
        createMockMaterial({
          id: 'mat-2',
          status: 'low_stock',
          quantityOnHand: 10,
          unitCost: 20,
        }),
        createMockMaterial({
          id: 'mat-3',
          status: 'out_of_stock',
          quantityOnHand: 0,
          unitCost: 5,
        }),
      ];

      (onSnapshot as jest.Mock).mockImplementation((query, onNext) => {
        setTimeout(() => {
          onNext({
            docs: mockMaterials.map((mat) => ({
              id: mat.id,
              data: () => ({
                ...mat,
                createdAt: { toDate: () => mat.createdAt },
              }),
            })),
          });
        }, 0);
        return jest.fn();
      });

      const { result } = renderHook(() => useMaterialsCore());

      await waitFor(() => {
        expect(result.current.stats.totalItems).toBe(3);
      });

      expect(result.current.stats.lowStockItems).toBe(1);
      expect(result.current.stats.outOfStockItems).toBe(1);
      // Total value: (50*10) + (10*20) + (0*5) = 500 + 200 + 0 = 700
      expect(result.current.stats.totalValue).toBe(700);
    });
  });

  describe('createMaterial', () => {
    it('should create a new material', async () => {
      const { result } = renderHook(() => useMaterialsCore());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let materialId: string;
      await act(async () => {
        materialId = await result.current.createMaterial({
          name: 'New Material',
          sku: 'NEW-001',
          category: 'hardware',
          status: 'in_stock',
          unit: 'piece',
          unitCost: 9.99,
          quantityOnHand: 50,
          quantityReserved: 0,
          reorderPoint: 10,
        });
      });

      expect(addDoc).toHaveBeenCalled();
      expect(materialId!).toBe('new-doc-id');

      const callArg = (addDoc as jest.Mock).mock.calls[0][1];
      expect(callArg).toMatchObject({
        name: 'New Material',
        orgId: mockOrgId,
        quantityAvailable: 50, // onHand - reserved
        createdBy: mockProfile.uid,
      });
    });

    it('should calculate quantityAvailable on create', async () => {
      const { result } = renderHook(() => useMaterialsCore());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.createMaterial({
          name: 'Test',
          sku: 'TEST',
          category: 'hardware',
          status: 'in_stock',
          unit: 'piece',
          unitCost: 5,
          quantityOnHand: 100,
          quantityReserved: 25,
          reorderPoint: 10,
        });
      });

      const callArg = (addDoc as jest.Mock).mock.calls[0][1];
      expect(callArg.quantityAvailable).toBe(75); // 100 - 25
    });

    it('should throw error without authentication', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        profile: null,
      });

      const { result } = renderHook(() => useMaterialsCore());

      await expect(
        result.current.createMaterial({
          name: 'Test',
          sku: 'TEST',
          category: 'hardware',
          status: 'in_stock',
          unit: 'piece',
          unitCost: 5,
          quantityOnHand: 10,
          quantityReserved: 0,
          reorderPoint: 5,
        })
      ).rejects.toThrow('Not authenticated');
    });
  });

  describe('updateMaterial', () => {
    it('should update a material', async () => {
      const { result } = renderHook(() => useMaterialsCore());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateMaterial('mat-1', {
          name: 'Updated Name',
          unitCost: 12.99,
        });
      });

      expect(updateDoc).toHaveBeenCalled();
      const callArg = (updateDoc as jest.Mock).mock.calls[0][1];
      expect(callArg).toMatchObject({
        name: 'Updated Name',
        unitCost: 12.99,
        updatedBy: mockProfile.uid,
      });
    });

    it('should recalculate quantityAvailable when quantities change', async () => {
      const existingMaterial = createMockMaterial({
        quantityOnHand: 100,
        quantityReserved: 20,
        status: 'in_stock',
      });

      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => existingMaterial,
      });

      const { result } = renderHook(() => useMaterialsCore());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateMaterial('mat-1', {
          quantityOnHand: 50,
        });
      });

      const callArg = (updateDoc as jest.Mock).mock.calls[0][1];
      expect(callArg.quantityAvailable).toBe(30); // 50 - 20
    });

    it('should update status to out_of_stock when quantity is 0', async () => {
      const existingMaterial = createMockMaterial({
        quantityOnHand: 10,
        quantityReserved: 0,
        status: 'in_stock',
      });

      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => existingMaterial,
      });

      const { result } = renderHook(() => useMaterialsCore());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateMaterial('mat-1', {
          quantityOnHand: 0,
        });
      });

      const callArg = (updateDoc as jest.Mock).mock.calls[0][1];
      expect(callArg.status).toBe('out_of_stock');
    });

    it('should update status to low_stock when at reorder point', async () => {
      const existingMaterial = createMockMaterial({
        quantityOnHand: 100,
        quantityReserved: 0,
        reorderPoint: 20,
        status: 'in_stock',
      });

      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => existingMaterial,
      });

      const { result } = renderHook(() => useMaterialsCore());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateMaterial('mat-1', {
          quantityOnHand: 15,
        });
      });

      const callArg = (updateDoc as jest.Mock).mock.calls[0][1];
      expect(callArg.status).toBe('low_stock');
    });

    it('should throw error without authentication', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        profile: null,
      });

      const { result } = renderHook(() => useMaterialsCore());

      await expect(result.current.updateMaterial('mat-1', { name: 'Test' })).rejects.toThrow(
        'Not authenticated'
      );
    });
  });

  describe('deleteMaterial', () => {
    it('should delete a material', async () => {
      const { result } = renderHook(() => useMaterialsCore());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteMaterial('mat-1');
      });

      expect(deleteDoc).toHaveBeenCalled();
    });

    it('should throw error without authentication', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        profile: null,
      });

      const { result } = renderHook(() => useMaterialsCore());

      await expect(result.current.deleteMaterial('mat-1')).rejects.toThrow('Not authenticated');
    });
  });

  describe('adjustQuantity', () => {
    it('should adjust quantity and create transaction', async () => {
      const existingMaterial = createMockMaterial({
        id: 'mat-1',
        name: 'Test Material',
        quantityOnHand: 100,
        quantityReserved: 10,
        reorderPoint: 20,
        unit: 'piece',
        status: 'in_stock',
      });

      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => existingMaterial,
      });

      const mockBatch = {
        update: jest.fn(),
        set: jest.fn(),
        commit: jest.fn().mockResolvedValue(undefined),
      };
      (writeBatch as jest.Mock).mockReturnValue(mockBatch);

      const { result } = renderHook(() => useMaterialsCore());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.adjustQuantity('mat-1', -20, 'usage', 'Used on project');
      });

      expect(writeBatch).toHaveBeenCalled();
      expect(mockBatch.update).toHaveBeenCalled();
      expect(mockBatch.set).toHaveBeenCalled();
      expect(mockBatch.commit).toHaveBeenCalled();
    });

    it('should update status based on new quantity', async () => {
      const existingMaterial = createMockMaterial({
        quantityOnHand: 25,
        quantityReserved: 0,
        reorderPoint: 20,
        status: 'in_stock',
      });

      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => existingMaterial,
      });

      const mockBatch = {
        update: jest.fn(),
        set: jest.fn(),
        commit: jest.fn().mockResolvedValue(undefined),
      };
      (writeBatch as jest.Mock).mockReturnValue(mockBatch);

      const { result } = renderHook(() => useMaterialsCore());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.adjustQuantity('mat-1', -10, 'usage');
      });

      // New quantity: 25 - 10 = 15, which is below reorderPoint of 20
      const updateCall = mockBatch.update.mock.calls[0][1];
      expect(updateCall.quantityOnHand).toBe(15);
      expect(updateCall.status).toBe('low_stock');
    });

    it('should throw error if material not found', async () => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => false,
      });

      const { result } = renderHook(() => useMaterialsCore());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(result.current.adjustQuantity('mat-1', 10, 'restock')).rejects.toThrow(
        'Material not found'
      );
    });

    it('should throw error without authentication', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        profile: null,
      });

      const { result } = renderHook(() => useMaterialsCore());

      await expect(result.current.adjustQuantity('mat-1', 10, 'restock')).rejects.toThrow(
        'Not authenticated'
      );
    });
  });
});
