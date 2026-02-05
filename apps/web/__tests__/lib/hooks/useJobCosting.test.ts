/**
 * @fileoverview Tests for useJobCosting hook
 *
 * Tests the job costing hooks including:
 * - useJobCosts: CRUD operations, aggregations, filtering
 * - useProjectProfitability: Single project profitability data
 * - useJobCostAlerts: Alert management for admin users
 * - useOrgJobCosting: Org-wide profitability summary
 * - formatPercent: Percentage formatting utility
 * - getCategoryColor: Category-to-hex color mapping
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import {
  useJobCosts,
  useProjectProfitability,
  useJobCostAlerts,
  useOrgJobCosting,
  formatPercent,
  getCategoryColor,
} from '@/lib/hooks/useJobCosting';

// ============================================
// Mocks
// ============================================

const mockOnSnapshot = jest.fn();
const mockAddDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockDeleteDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockGetDoc = jest.fn();
const mockSetDoc = jest.fn();
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
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  Timestamp: {
    now: jest.fn(() => ({ toDate: () => new Date(), seconds: 1704067200, nanoseconds: 0 })),
    fromDate: jest.fn((date: Date) => ({ toDate: () => date, seconds: date.getTime() / 1000, nanoseconds: 0 })),
  },
}));

jest.mock('@/lib/firebase/config', () => ({ db: {} }));

const mockProfile = {
  uid: 'user-1',
  orgId: 'org-1',
  displayName: 'Test User',
  role: 'OWNER' as const,
};

const mockUseAuth = jest.fn(() => ({
  user: { uid: 'user-1', email: 'test@test.com' },
  profile: mockProfile,
}));

jest.mock('@/lib/auth', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('@/lib/firebase/timestamp-converter', () => ({
  convertTimestamps: jest.fn((data) => data),
  convertTimestampsDeep: jest.fn((data) => data),
}));

jest.mock('@/types', () => ({
  COST_CATEGORY_LABELS: {
    labor_internal: { label: 'Internal Labor', color: 'blue' },
    labor_subcontractor: { label: 'Subcontractor Labor', color: 'purple' },
    materials: { label: 'Materials', color: 'amber' },
    equipment_rental: { label: 'Equipment Rental', color: 'orange' },
    permits_fees: { label: 'Permits & Fees', color: 'green' },
    overhead: { label: 'Overhead', color: 'gray' },
    other: { label: 'Other', color: 'slate' },
  },
}));

jest.mock('@/lib/utils/formatters', () => ({
  formatCurrencyCompact: jest.fn((amount: number) => `$${amount}`),
}));

// ============================================
// Helpers
// ============================================

function simulateSnapshot(docs: Array<{ id: string; data: Record<string, unknown> }>) {
  mockOnSnapshot.mockImplementation((_query: unknown, onNext: Function, _onError?: Function) => {
    onNext({
      docs: docs.map((d) => ({ id: d.id, data: () => d.data })),
    });
    return jest.fn(); // unsubscribe
  });
}

function simulateDocSnapshot(exists: boolean, id: string, data: Record<string, unknown> | null) {
  mockOnSnapshot.mockImplementation((_ref: unknown, onNext: Function) => {
    onNext({
      exists: () => exists,
      id,
      data: () => data,
    });
    return jest.fn();
  });
}

function _simulateSnapshotError(errorMessage: string) {
  mockOnSnapshot.mockImplementation((_query: unknown, _onNext: Function, onError?: Function) => {
    if (onError) onError(new Error(errorMessage));
    return jest.fn();
  });
}

// ============================================
// Mock data
// ============================================

const mockCost1 = {
  id: 'cost-1',
  data: {
    projectId: 'project-1',
    category: 'labor_internal',
    amount: 5000,
    description: 'Internal labor week 1',
    source: 'manual',
    date: new Date('2024-06-01'),
    isApproved: false,
  },
};

const mockCost2 = {
  id: 'cost-2',
  data: {
    projectId: 'project-1',
    category: 'materials',
    amount: 3000,
    description: 'Lumber delivery',
    source: 'manual',
    date: new Date('2024-06-02'),
    isApproved: true,
  },
};

const mockCost3 = {
  id: 'cost-3',
  data: {
    projectId: 'project-1',
    category: 'labor_internal',
    amount: 2000,
    description: 'Internal labor week 2',
    source: 'manual',
    date: new Date('2024-06-08'),
    isApproved: false,
  },
};

// ============================================
// Tests
// ============================================

describe('useJobCosts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { uid: 'user-1', email: 'test@test.com' },
      profile: { ...mockProfile },
    });
  });

  it('returns loading=true initially then costs from snapshot', async () => {
    simulateSnapshot([mockCost1, mockCost2]);

    const { result } = renderHook(() =>
      useJobCosts({ projectId: 'project-1' })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.costs).toHaveLength(2);
    expect(result.current.costs[0].id).toBe('cost-1');
    expect(result.current.costs[1].id).toBe('cost-2');
    expect(result.current.error).toBeNull();
  });

  it('returns empty when no orgId', async () => {
    mockUseAuth.mockReturnValue({
      user: { uid: 'user-1', email: 'test@test.com' },
      profile: null,
    });

    const { result } = renderHook(() =>
      useJobCosts({ projectId: 'project-1' })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.costs).toEqual([]);
    expect(mockOnSnapshot).not.toHaveBeenCalled();
  });

  it('createCost calls addDoc with correct org path', async () => {
    simulateSnapshot([]);
    mockAddDoc.mockResolvedValue({ id: 'new-cost-id' });

    const { result } = renderHook(() =>
      useJobCosts({ projectId: 'project-1' })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let costId: string;
    await act(async () => {
      costId = await result.current.createCost({
        projectId: 'project-1',
        category: 'materials',
        amount: 1500,
        description: 'Concrete',
        source: 'manual',
        date: new Date('2024-06-10'),
        isApproved: false,
      } as any);
    });

    expect(mockAddDoc).toHaveBeenCalledTimes(1);
    // Verify collection path includes org
    expect(mockCollection).toHaveBeenCalledWith(
      expect.anything(),
      'organizations/org-1/jobCosts'
    );
    expect(costId!).toBe('new-cost-id');
  });

  it('createCost throws if not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      profile: null,
    });

    // With no profile, onSnapshot won't be called, so no need to simulate
    const { result } = renderHook(() =>
      useJobCosts({ projectId: 'project-1' })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await expect(
      result.current.createCost({
        projectId: 'project-1',
        category: 'materials',
        amount: 500,
      } as any)
    ).rejects.toThrow('Not authenticated');
  });

  it('updateCost calls updateDoc', async () => {
    simulateSnapshot([mockCost1]);
    mockUpdateDoc.mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useJobCosts({ projectId: 'project-1' })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.updateCost('cost-1', { amount: 6000 });
    });

    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    const updateArgs = mockUpdateDoc.mock.calls[0][1];
    expect(updateArgs).toMatchObject({ amount: 6000 });
    expect(updateArgs.updatedBy).toBe('user-1');
  });

  it('updateCost throws if not admin', async () => {
    mockUseAuth.mockReturnValue({
      user: { uid: 'user-2', email: 'worker@test.com' },
      profile: { uid: 'user-2', orgId: 'org-1', displayName: 'Worker', role: 'EMPLOYEE' as const },
    });
    simulateSnapshot([mockCost1]);

    const { result } = renderHook(() =>
      useJobCosts({ projectId: 'project-1' })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await expect(
      result.current.updateCost('cost-1', { amount: 6000 })
    ).rejects.toThrow('Not authorized');
  });

  it('deleteCost calls deleteDoc', async () => {
    simulateSnapshot([mockCost1]);
    mockDeleteDoc.mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useJobCosts({ projectId: 'project-1' })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteCost('cost-1');
    });

    expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
  });

  it('approveCost sets isApproved=true with approvedBy', async () => {
    simulateSnapshot([mockCost1]);
    mockUpdateDoc.mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useJobCosts({ projectId: 'project-1' })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.approveCost('cost-1');
    });

    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    const approveArgs = mockUpdateDoc.mock.calls[0][1];
    expect(approveArgs).toMatchObject({
      isApproved: true,
      approvedBy: 'user-1',
    });
    expect(approveArgs.approvedAt).toBeDefined();
  });

  it('totalCosts computes sum of cost amounts', async () => {
    simulateSnapshot([mockCost1, mockCost2, mockCost3]);

    const { result } = renderHook(() =>
      useJobCosts({ projectId: 'project-1' })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // 5000 + 3000 + 2000 = 10000
    expect(result.current.totalCosts).toBe(10000);
  });

  it('costsByCategory aggregates by category correctly', async () => {
    simulateSnapshot([mockCost1, mockCost2, mockCost3]);

    const { result } = renderHook(() =>
      useJobCosts({ projectId: 'project-1' })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // labor_internal: 5000 + 2000 = 7000
    // materials: 3000
    expect(result.current.costsByCategory.labor_internal).toBe(7000);
    expect(result.current.costsByCategory.materials).toBe(3000);
    expect(result.current.costsByCategory.equipment_rental).toBe(0);
    expect(result.current.costsByCategory.labor_subcontractor).toBe(0);
    expect(result.current.costsByCategory.permits_fees).toBe(0);
    expect(result.current.costsByCategory.overhead).toBe(0);
    expect(result.current.costsByCategory.other).toBe(0);
  });
});

describe('useProjectProfitability', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { uid: 'user-1', email: 'test@test.com' },
      profile: { ...mockProfile },
    });
  });

  it('returns profitability data from doc snapshot', async () => {
    const profitData = {
      originalBudget: 100000,
      totalCosts: 80000,
      budgetVariance: 20000,
      grossMargin: 20,
      isAtRisk: false,
      isOverBudget: false,
    };

    simulateDocSnapshot(true, 'project-1', profitData);

    const { result } = renderHook(() =>
      useProjectProfitability('project-1')
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.profitability).not.toBeNull();
    expect(result.current.profitability?.projectId).toBe('project-1');
    expect(result.current.profitability?.originalBudget).toBe(100000);
    expect(result.current.profitability?.totalCosts).toBe(80000);
    expect(result.current.error).toBeNull();
  });

  it('returns null when document does not exist', async () => {
    simulateDocSnapshot(false, 'project-missing', null);

    const { result } = renderHook(() =>
      useProjectProfitability('project-missing')
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.profitability).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('returns loading=false with null when no orgId', async () => {
    mockUseAuth.mockReturnValue({
      user: { uid: 'user-1', email: 'test@test.com' },
      profile: null,
    });

    const { result } = renderHook(() =>
      useProjectProfitability('project-1')
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.profitability).toBeNull();
    expect(mockOnSnapshot).not.toHaveBeenCalled();
  });
});

describe('useJobCostAlerts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { uid: 'user-1', email: 'test@test.com' },
      profile: { ...mockProfile },
    });
  });

  it('returns alerts for admin users', async () => {
    const mockAlert1 = {
      id: 'alert-1',
      data: {
        projectId: 'project-1',
        type: 'over_budget',
        message: 'Project exceeds budget by 10%',
        isAcknowledged: false,
        createdAt: new Date('2024-06-10'),
      },
    };
    const mockAlert2 = {
      id: 'alert-2',
      data: {
        projectId: 'project-1',
        type: 'at_risk',
        message: 'Project budget utilization at 85%',
        isAcknowledged: true,
        createdAt: new Date('2024-06-08'),
      },
    };

    simulateSnapshot([mockAlert1, mockAlert2]);

    const { result } = renderHook(() => useJobCostAlerts('project-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.alerts).toHaveLength(2);
    expect(result.current.alerts[0].id).toBe('alert-1');
    expect(result.current.error).toBeNull();
  });

  it('returns empty for non-admin users', async () => {
    mockUseAuth.mockReturnValue({
      user: { uid: 'user-2', email: 'worker@test.com' },
      profile: { uid: 'user-2', orgId: 'org-1', displayName: 'Worker', role: 'EMPLOYEE' as const },
    });

    const { result } = renderHook(() => useJobCostAlerts('project-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.alerts).toEqual([]);
    expect(mockOnSnapshot).not.toHaveBeenCalled();
  });

  it('acknowledgeAlert updates the alert doc', async () => {
    simulateSnapshot([
      {
        id: 'alert-1',
        data: {
          projectId: 'project-1',
          type: 'over_budget',
          isAcknowledged: false,
        },
      },
    ]);
    mockUpdateDoc.mockResolvedValue(undefined);

    const { result } = renderHook(() => useJobCostAlerts('project-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.acknowledgeAlert('alert-1');
    });

    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    const ackArgs = mockUpdateDoc.mock.calls[0][1];
    expect(ackArgs).toMatchObject({
      isAcknowledged: true,
      acknowledgedBy: 'user-1',
    });
    expect(ackArgs.acknowledgedAt).toBeDefined();
  });

  it('unacknowledgedCount counts correctly', async () => {
    simulateSnapshot([
      {
        id: 'alert-1',
        data: { projectId: 'project-1', type: 'over_budget', isAcknowledged: false },
      },
      {
        id: 'alert-2',
        data: { projectId: 'project-1', type: 'at_risk', isAcknowledged: true },
      },
      {
        id: 'alert-3',
        data: { projectId: 'project-1', type: 'variance', isAcknowledged: false },
      },
    ]);

    const { result } = renderHook(() => useJobCostAlerts('project-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.unacknowledgedCount).toBe(2);
  });
});

describe('formatPercent', () => {
  it('positive value returns "+5.0%"', () => {
    expect(formatPercent(5)).toBe('+5.0%');
  });

  it('negative value returns "-3.0%"', () => {
    expect(formatPercent(-3)).toBe('-3.0%');
  });

  it('zero returns "+0.0%"', () => {
    expect(formatPercent(0)).toBe('+0.0%');
  });

  it('handles decimal values', () => {
    expect(formatPercent(12.345)).toBe('+12.3%');
    expect(formatPercent(-0.5)).toBe('-0.5%');
  });
});

describe('getCategoryColor', () => {
  it('returns correct hex for known categories', () => {
    expect(getCategoryColor('labor_internal' as any)).toBe('#3B82F6'); // blue
    expect(getCategoryColor('labor_subcontractor' as any)).toBe('#8B5CF6'); // purple
    expect(getCategoryColor('materials' as any)).toBe('#F59E0B'); // amber
    expect(getCategoryColor('equipment_rental' as any)).toBe('#F97316'); // orange
    expect(getCategoryColor('permits_fees' as any)).toBe('#10B981'); // green
    expect(getCategoryColor('overhead' as any)).toBe('#6B7280'); // gray
    expect(getCategoryColor('other' as any)).toBe('#64748B'); // slate
  });

  it('returns gray for unknown category', () => {
    expect(getCategoryColor('nonexistent_category' as any)).toBe('#6B7280');
  });
});

describe('useOrgJobCosting', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { uid: 'user-1', email: 'test@test.com' },
      profile: { ...mockProfile },
    });
  });

  it('returns profitability data from collection', async () => {
    const mockProfitDoc1 = {
      id: 'project-1',
      data: {
        originalBudget: 100000,
        totalCosts: 80000,
        budgetVariance: 20000,
        grossMargin: 20,
        isAtRisk: false,
        isOverBudget: false,
        costsByCategory: { labor_internal: 50000, materials: 30000 },
      },
    };
    const mockProfitDoc2 = {
      id: 'project-2',
      data: {
        originalBudget: 50000,
        totalCosts: 55000,
        budgetVariance: -5000,
        grossMargin: -10,
        isAtRisk: true,
        isOverBudget: true,
        costsByCategory: { labor_internal: 30000, equipment_rental: 25000 },
      },
    };

    simulateSnapshot([mockProfitDoc1, mockProfitDoc2]);

    const { result } = renderHook(() => useOrgJobCosting());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.profitabilityData).toHaveLength(2);
    expect(result.current.profitabilityData[0].projectId).toBe('project-1');
    expect(result.current.profitabilityData[1].projectId).toBe('project-2');
    expect(result.current.error).toBeNull();
  });

  it('summary aggregates budget, costs, variances', async () => {
    const mockProfitDoc1 = {
      id: 'project-1',
      data: {
        originalBudget: 100000,
        totalCosts: 80000,
        budgetVariance: 20000,
        grossMargin: 20,
        isAtRisk: false,
        isOverBudget: false,
        costsByCategory: { labor_internal: 50000, materials: 30000 },
      },
    };
    const mockProfitDoc2 = {
      id: 'project-2',
      data: {
        originalBudget: 50000,
        totalCosts: 55000,
        budgetVariance: -5000,
        grossMargin: -10,
        isAtRisk: true,
        isOverBudget: true,
        costsByCategory: { labor_internal: 30000, equipment_rental: 25000 },
      },
    };

    simulateSnapshot([mockProfitDoc1, mockProfitDoc2]);

    const { result } = renderHook(() => useOrgJobCosting());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const summary = result.current.summary;
    expect(summary).not.toBeNull();
    // 100000 + 50000
    expect(summary!.totalBudget).toBe(150000);
    // 80000 + 55000
    expect(summary!.totalActualCosts).toBe(135000);
    // 150000 - 135000
    expect(summary!.totalVariance).toBe(15000);
    // (15000 / 150000) * 100 = 10
    expect(summary!.variancePercent).toBe(10);
    // project-2 is at risk
    expect(summary!.projectsAtRisk).toBe(1);
    // project-2 is over budget
    expect(summary!.projectsOverBudget).toBe(1);
    // project-1 has positive variance (budgetVariance > 0)
    expect(summary!.projectsUnderBudget).toBe(1);
    // labor_internal: 50000 + 30000 = 80000
    expect(summary!.costsByCategory.labor_internal).toBe(80000);
    // materials: 30000
    expect(summary!.costsByCategory.materials).toBe(30000);
    // equipment_rental: 25000
    expect(summary!.costsByCategory.equipment_rental).toBe(25000);
    // top over-budget: project-2 only (variance < 0)
    expect(summary!.topOverBudgetProjects).toHaveLength(1);
    expect(summary!.topOverBudgetProjects[0].projectId).toBe('project-2');
    expect(summary!.topOverBudgetProjects[0].variance).toBe(-5000);
  });

  it('summary returns null for empty data', async () => {
    simulateSnapshot([]);

    const { result } = renderHook(() => useOrgJobCosting());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.summary).toBeNull();
    expect(result.current.profitabilityData).toEqual([]);
  });
});
