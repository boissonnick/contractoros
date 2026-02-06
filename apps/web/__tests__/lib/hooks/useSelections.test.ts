/**
 * @fileoverview Unit tests for useSelections hook
 * Sprint 80: Unit Test Coverage
 *
 * Tests cover:
 * - useSelections: Selection CRUD, option selection, approval workflow
 * - addSelection, selectOption, approveSelection, markOrdered, markInstalled
 * - updateSelection, deleteSelection, addClientNote
 * - State-dependent operations (selectOption reads from selections state)
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useSelections } from '@/lib/hooks/useSelections';
import { Selection, SelectionOption } from '@/types';

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
  Timestamp: {
    now: jest.fn(() => ({ toDate: () => new Date('2024-06-15T12:00:00Z') })),
    fromDate: jest.fn((d: Date) => ({ toDate: () => d })),
  },
}));

jest.mock('@/lib/firebase/config', () => ({
  db: {},
}));

// Import mocked modules
import { useAuth } from '@/lib/auth';
import { onSnapshot, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const mockUseAuth = useAuth as jest.Mock;

// =============================================================================
// TEST DATA
// =============================================================================

const mockProjectId = 'project-123';
const mockOrgId = 'org-123';

const createMockOption = (overrides: Partial<SelectionOption> = {}): SelectionOption => ({
  id: `opt-${Math.random().toString(36).slice(2)}`,
  categoryId: 'cat-1',
  name: 'Brushed Nickel Faucet',
  description: 'Standard brushed nickel faucet',
  price: 250,
  isRecommended: false,
  order: 0,
  ...overrides,
});

const createMockSelection = (overrides: Partial<Selection> = {}): Selection => ({
  id: `sel-${Math.random().toString(36).slice(2)}`,
  orgId: mockOrgId,
  projectId: mockProjectId,
  categoryId: 'cat-kitchen-faucet',
  categoryName: 'Kitchen Faucet',
  status: 'pending',
  budgetAmount: 500,
  budgetVariance: 0,
  options: [
    createMockOption({ id: 'opt-1', name: 'Basic Faucet', price: 200 }),
    createMockOption({ id: 'opt-2', name: 'Premium Faucet', price: 450 }),
  ],
  room: 'Kitchen',
  notes: 'Choose before framing',
  createdBy: 'user-123',
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
  ...overrides,
});

const createMockDocSnapshot = (sel: Selection) => ({
  id: sel.id,
  data: () => ({
    orgId: sel.orgId,
    projectId: sel.projectId,
    categoryId: sel.categoryId,
    categoryName: sel.categoryName,
    status: sel.status,
    selectedOptionId: sel.selectedOptionId,
    selectedOptionName: sel.selectedOptionName,
    selectedPrice: sel.selectedPrice,
    budgetAmount: sel.budgetAmount,
    budgetVariance: sel.budgetVariance,
    options: sel.options,
    room: sel.room,
    notes: sel.notes,
    clientNote: sel.clientNote,
    selectedBy: sel.selectedBy,
    selectedByName: sel.selectedByName,
    selectedAt: sel.selectedAt
      ? { toDate: () => sel.selectedAt }
      : undefined,
    approvedBy: sel.approvedBy,
    approvedAt: sel.approvedAt
      ? { toDate: () => sel.approvedAt }
      : undefined,
    orderedAt: sel.orderedAt
      ? { toDate: () => sel.orderedAt }
      : undefined,
    installedAt: sel.installedAt
      ? { toDate: () => sel.installedAt }
      : undefined,
    createdBy: sel.createdBy,
    createdAt: sel.createdAt
      ? { toDate: () => sel.createdAt }
      : undefined,
    updatedAt: sel.updatedAt
      ? { toDate: () => sel.updatedAt }
      : undefined,
  }),
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

  (onSnapshot as jest.Mock).mockImplementation((_query, onNext) => {
    setTimeout(() => {
      onNext({ docs: [] });
    }, 0);
    return jest.fn();
  });

  (addDoc as jest.Mock).mockResolvedValue({ id: 'new-selection-id' });
  (updateDoc as jest.Mock).mockResolvedValue(undefined);
  (deleteDoc as jest.Mock).mockResolvedValue(undefined);
});

// =============================================================================
// useSelections TESTS
// =============================================================================

describe('useSelections', () => {
  describe('initial state and loading', () => {
    it('should return loading=true initially', () => {
      (onSnapshot as jest.Mock).mockImplementation(() => {
        return jest.fn();
      });

      const { result } = renderHook(() => useSelections({ projectId: mockProjectId }));

      expect(result.current.loading).toBe(true);
      expect(result.current.selections).toEqual([]);
    });

    it('should return empty selections with no data', async () => {
      const { result } = renderHook(() => useSelections({ projectId: mockProjectId }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.selections).toEqual([]);
    });

    it('should set loading=false when projectId is missing', async () => {
      const { result } = renderHook(() => useSelections({ projectId: '' }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(onSnapshot).not.toHaveBeenCalled();
    });
  });

  describe('fetching selections', () => {
    it('should fetch and return selections sorted by categoryName', async () => {
      const mockSelections = [
        createMockSelection({ id: 'sel-1', categoryName: 'Tile' }),
        createMockSelection({ id: 'sel-2', categoryName: 'Countertop' }),
        createMockSelection({ id: 'sel-3', categoryName: 'Faucet' }),
      ];

      (onSnapshot as jest.Mock).mockImplementation((_query, onNext) => {
        setTimeout(() => {
          onNext({
            docs: mockSelections.map(createMockDocSnapshot),
          });
        }, 0);
        return jest.fn();
      });

      const { result } = renderHook(() => useSelections({ projectId: mockProjectId }));

      await waitFor(() => {
        expect(result.current.selections).toHaveLength(3);
      });

      expect(result.current.selections[0].categoryName).toBe('Countertop');
      expect(result.current.selections[1].categoryName).toBe('Faucet');
      expect(result.current.selections[2].categoryName).toBe('Tile');
    });

    it('should parse Firestore timestamps correctly', async () => {
      const sel = createMockSelection({
        id: 'sel-with-dates',
        selectedAt: new Date('2024-02-01'),
        approvedAt: new Date('2024-02-05'),
        orderedAt: new Date('2024-02-10'),
        installedAt: new Date('2024-03-01'),
      });

      (onSnapshot as jest.Mock).mockImplementation((_query, onNext) => {
        setTimeout(() => {
          onNext({
            docs: [createMockDocSnapshot(sel)],
          });
        }, 0);
        return jest.fn();
      });

      const { result } = renderHook(() => useSelections({ projectId: mockProjectId }));

      await waitFor(() => {
        expect(result.current.selections).toHaveLength(1);
      });

      const fetched = result.current.selections[0];
      expect(fetched.selectedAt).toEqual(new Date('2024-02-01'));
      expect(fetched.approvedAt).toEqual(new Date('2024-02-05'));
      expect(fetched.orderedAt).toEqual(new Date('2024-02-10'));
      expect(fetched.installedAt).toEqual(new Date('2024-03-01'));
    });
  });

  describe('addSelection', () => {
    it('should call addDoc with correct structure', async () => {
      const { result } = renderHook(() => useSelections({ projectId: mockProjectId }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addSelection({
          categoryName: 'Floor Tile',
          room: 'Bathroom',
          budgetAmount: 3000,
          options: [
            { categoryId: 'cat-1', name: 'Porcelain', price: 2500, isRecommended: true, order: 0 },
            { categoryId: 'cat-1', name: 'Marble', price: 4000, isRecommended: false, order: 1 },
          ],
          notes: 'Client prefers neutral tones',
        });
      });

      expect(addDoc).toHaveBeenCalledTimes(1);
      const callArgs = (addDoc as jest.Mock).mock.calls[0];
      const data = callArgs[1];

      expect(data.orgId).toBe(mockOrgId);
      expect(data.projectId).toBe(mockProjectId);
      expect(data.categoryName).toBe('Floor Tile');
      expect(data.status).toBe('pending');
      expect(data.budgetAmount).toBe(3000);
      expect(data.budgetVariance).toBe(0);
      expect(data.room).toBe('Bathroom');
      expect(data.notes).toBe('Client prefers neutral tones');
      expect(data.createdBy).toBe('user-123');
      expect(data.options).toHaveLength(2);
    });

    it('should generate option IDs', async () => {
      const { result } = renderHook(() => useSelections({ projectId: mockProjectId }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addSelection({
          categoryName: 'Countertop',
          budgetAmount: 5000,
          options: [
            { categoryId: 'cat-1', name: 'Granite', price: 4000, isRecommended: false, order: 0 },
          ],
        });
      });

      const callArgs = (addDoc as jest.Mock).mock.calls[0];
      const options = callArgs[1].options;

      expect(options[0].id).toMatch(/^opt-/);
    });

    it('should throw if no profile/user', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        profile: null,
      });

      const { result } = renderHook(() => useSelections({ projectId: mockProjectId }));

      await expect(
        result.current.addSelection({
          categoryName: 'Test',
          budgetAmount: 100,
          options: [],
        })
      ).rejects.toThrow('No organization');
    });

    it('should set default empty string for optional room and notes', async () => {
      const { result } = renderHook(() => useSelections({ projectId: mockProjectId }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addSelection({
          categoryName: 'Lighting',
          budgetAmount: 1000,
          options: [],
        });
      });

      const callArgs = (addDoc as jest.Mock).mock.calls[0];
      expect(callArgs[1].room).toBe('');
      expect(callArgs[1].notes).toBe('');
    });
  });

  describe('selectOption', () => {
    it('should update with correct status, price, and variance', async () => {
      const mockSel = createMockSelection({
        id: 'sel-1',
        budgetAmount: 500,
        options: [
          createMockOption({ id: 'opt-1', name: 'Basic', price: 200 }),
          createMockOption({ id: 'opt-2', name: 'Premium', price: 450 }),
        ],
      });

      (onSnapshot as jest.Mock).mockImplementation((_query, onNext) => {
        setTimeout(() => {
          onNext({ docs: [createMockDocSnapshot(mockSel)] });
        }, 0);
        return jest.fn();
      });

      const { result } = renderHook(() => useSelections({ projectId: mockProjectId }));

      await waitFor(() => {
        expect(result.current.selections).toHaveLength(1);
      });

      await act(async () => {
        await result.current.selectOption('sel-1', 'opt-2');
      });

      expect(updateDoc).toHaveBeenCalledTimes(1);
      const callArgs = (updateDoc as jest.Mock).mock.calls[0];
      const data = callArgs[1];

      expect(data.status).toBe('selected');
      expect(data.selectedOptionId).toBe('opt-2');
      expect(data.selectedOptionName).toBe('Premium');
      expect(data.selectedPrice).toBe(450);
      expect(data.budgetVariance).toBe(50);
      expect(data.selectedBy).toBe('user-123');
      expect(data.selectedByName).toBe('Test User');
    });

    it('should calculate negative variance when over budget', async () => {
      const mockSel = createMockSelection({
        id: 'sel-1',
        budgetAmount: 300,
        options: [
          createMockOption({ id: 'opt-1', name: 'Expensive', price: 500 }),
        ],
      });

      (onSnapshot as jest.Mock).mockImplementation((_query, onNext) => {
        setTimeout(() => {
          onNext({ docs: [createMockDocSnapshot(mockSel)] });
        }, 0);
        return jest.fn();
      });

      const { result } = renderHook(() => useSelections({ projectId: mockProjectId }));

      await waitFor(() => {
        expect(result.current.selections).toHaveLength(1);
      });

      await act(async () => {
        await result.current.selectOption('sel-1', 'opt-1');
      });

      const callArgs = (updateDoc as jest.Mock).mock.calls[0];
      expect(callArgs[1].budgetVariance).toBe(-200);
    });

    it('should do nothing if selection not found', async () => {
      const { result } = renderHook(() => useSelections({ projectId: mockProjectId }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.selectOption('nonexistent', 'opt-1');
      });

      expect(updateDoc).not.toHaveBeenCalled();
    });

    it('should do nothing if option not found', async () => {
      const mockSel = createMockSelection({
        id: 'sel-1',
        options: [createMockOption({ id: 'opt-1', name: 'Only Option', price: 100 })],
      });

      (onSnapshot as jest.Mock).mockImplementation((_query, onNext) => {
        setTimeout(() => {
          onNext({ docs: [createMockDocSnapshot(mockSel)] });
        }, 0);
        return jest.fn();
      });

      const { result } = renderHook(() => useSelections({ projectId: mockProjectId }));

      await waitFor(() => {
        expect(result.current.selections).toHaveLength(1);
      });

      await act(async () => {
        await result.current.selectOption('sel-1', 'nonexistent-option');
      });

      expect(updateDoc).not.toHaveBeenCalled();
    });

    it('should do nothing if no user', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        profile: mockProfile,
      });

      const mockSel = createMockSelection({ id: 'sel-1' });

      (onSnapshot as jest.Mock).mockImplementation((_query, onNext) => {
        setTimeout(() => {
          onNext({ docs: [createMockDocSnapshot(mockSel)] });
        }, 0);
        return jest.fn();
      });

      const { result } = renderHook(() => useSelections({ projectId: mockProjectId }));

      await waitFor(() => {
        expect(result.current.selections).toHaveLength(1);
      });

      await act(async () => {
        await result.current.selectOption('sel-1', 'opt-1');
      });

      expect(updateDoc).not.toHaveBeenCalled();
    });
  });

  describe('approveSelection', () => {
    it('should set approved status and approvedBy', async () => {
      const { result } = renderHook(() => useSelections({ projectId: mockProjectId }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.approveSelection('sel-1');
      });

      expect(updateDoc).toHaveBeenCalledTimes(1);
      const callArgs = (updateDoc as jest.Mock).mock.calls[0];
      expect(callArgs[1].status).toBe('approved');
      expect(callArgs[1].approvedBy).toBe('user-123');
      expect(callArgs[1]).toHaveProperty('approvedAt');
      expect(callArgs[1]).toHaveProperty('updatedAt');
    });

    it('should do nothing if no user', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        profile: mockProfile,
      });

      const { result } = renderHook(() => useSelections({ projectId: mockProjectId }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.approveSelection('sel-1');
      });

      expect(updateDoc).not.toHaveBeenCalled();
    });
  });

  describe('markOrdered', () => {
    it('should set ordered status and orderedAt', async () => {
      const { result } = renderHook(() => useSelections({ projectId: mockProjectId }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.markOrdered('sel-1');
      });

      expect(updateDoc).toHaveBeenCalledTimes(1);
      const callArgs = (updateDoc as jest.Mock).mock.calls[0];
      expect(callArgs[1].status).toBe('ordered');
      expect(callArgs[1]).toHaveProperty('orderedAt');
      expect(callArgs[1]).toHaveProperty('updatedAt');
    });
  });

  describe('markInstalled', () => {
    it('should set installed status and installedAt', async () => {
      const { result } = renderHook(() => useSelections({ projectId: mockProjectId }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.markInstalled('sel-1');
      });

      expect(updateDoc).toHaveBeenCalledTimes(1);
      const callArgs = (updateDoc as jest.Mock).mock.calls[0];
      expect(callArgs[1].status).toBe('installed');
      expect(callArgs[1]).toHaveProperty('installedAt');
      expect(callArgs[1]).toHaveProperty('updatedAt');
    });
  });

  describe('updateSelection', () => {
    it('should strip protected fields before update', async () => {
      const { result } = renderHook(() => useSelections({ projectId: mockProjectId }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateSelection('sel-1', {
          id: 'sel-1',
          orgId: 'org-123',
          createdAt: new Date(),
          createdBy: 'user-123',
          categoryName: 'Updated Category',
          budgetAmount: 1000,
        } as Partial<Selection>);
      });

      expect(updateDoc).toHaveBeenCalledTimes(1);
      const callArgs = (updateDoc as jest.Mock).mock.calls[0];
      const data = callArgs[1];

      expect(data.id).toBeUndefined();
      expect(data.orgId).toBeUndefined();
      expect(data.createdAt).toBeUndefined();
      expect(data.createdBy).toBeUndefined();

      expect(data.categoryName).toBe('Updated Category');
      expect(data.budgetAmount).toBe(1000);
      expect(data).toHaveProperty('updatedAt');
    });
  });

  describe('deleteSelection', () => {
    it('should call deleteDoc', async () => {
      const { result } = renderHook(() => useSelections({ projectId: mockProjectId }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteSelection('sel-1');
      });

      expect(deleteDoc).toHaveBeenCalledTimes(1);
    });
  });

  describe('addClientNote', () => {
    it('should update clientNote field', async () => {
      const { result } = renderHook(() => useSelections({ projectId: mockProjectId }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addClientNote('sel-1', 'We prefer the marble option');
      });

      expect(updateDoc).toHaveBeenCalledTimes(1);
      const callArgs = (updateDoc as jest.Mock).mock.calls[0];
      expect(callArgs[1].clientNote).toBe('We prefer the marble option');
      expect(callArgs[1]).toHaveProperty('updatedAt');
    });
  });

  describe('cleanup', () => {
    it('should unsubscribe from Firestore on unmount', async () => {
      const mockUnsubscribe = jest.fn();

      (onSnapshot as jest.Mock).mockImplementation((_query, onNext) => {
        setTimeout(() => {
          onNext({ docs: [] });
        }, 0);
        return mockUnsubscribe;
      });

      const { unmount } = renderHook(() => useSelections({ projectId: mockProjectId }));

      await waitFor(() => {
        expect(onSnapshot).toHaveBeenCalled();
      });

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });

    it('should not subscribe when projectId is empty', async () => {
      const { result } = renderHook(() => useSelections({ projectId: '' }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(onSnapshot).not.toHaveBeenCalled();
    });
  });

  describe('return value shape', () => {
    it('should return all expected properties', async () => {
      const { result } = renderHook(() => useSelections({ projectId: mockProjectId }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current).toHaveProperty('selections');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('addSelection');
      expect(result.current).toHaveProperty('selectOption');
      expect(result.current).toHaveProperty('approveSelection');
      expect(result.current).toHaveProperty('markOrdered');
      expect(result.current).toHaveProperty('markInstalled');
      expect(result.current).toHaveProperty('updateSelection');
      expect(result.current).toHaveProperty('deleteSelection');
      expect(result.current).toHaveProperty('addClientNote');
    });
  });
});
