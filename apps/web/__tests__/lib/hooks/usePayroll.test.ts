/**
 * @fileoverview Tests for usePayroll hook
 *
 * Tests the payroll management hook including:
 * - Real-time payroll run fetching via onSnapshot with date conversions
 * - State management: loading, error, enabled/disabled
 * - loadPayrollRun: delegates to payroll-service getPayrollRun
 * - updateStatus: delegates to payroll-service updatePayrollRunStatus
 * - deleteRun: delegates to payroll-service deletePayrollRun, clears currentRun
 * - calculateSummary: aggregates from last 3 months of completed runs
 * - Error handling on snapshot errors
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { usePayroll } from '@/lib/hooks/usePayroll';

// ---- Firestore mocks ----
const mockOnSnapshot = jest.fn();
const mockCollection = jest.fn();
const mockQuery = jest.fn();
const mockOrderBy = jest.fn();
const mockLimit = jest.fn();

jest.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  where: (..._args: unknown[]) => jest.fn(),
  orderBy: (...args: unknown[]) => mockOrderBy(...args),
  limit: (...args: unknown[]) => mockLimit(...args),
  onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
  Timestamp: {
    now: jest.fn(() => ({ toDate: () => new Date(), seconds: 1704067200, nanoseconds: 0 })),
    fromDate: jest.fn((date: Date) => ({ toDate: () => date, seconds: date.getTime() / 1000, nanoseconds: 0 })),
  },
}));

jest.mock('@/lib/firebase/config', () => ({ db: {} }));

// ---- Mock @/types (usePayroll imports types from here) ----
jest.mock('@/types', () => ({}));

// ---- Payroll service mocks ----
const mockGetPayrollSettings = jest.fn();
const mockSavePayrollSettings = jest.fn();
const mockCreatePayrollRun = jest.fn();
const mockGetPayrollRun = jest.fn();
const mockUpdatePayrollRunStatus = jest.fn();
const mockUpdatePayrollEntry = jest.fn();
const mockAddPayrollAdjustment = jest.fn();
const mockDeletePayrollRun = jest.fn();
const mockGetPayrollRuns = jest.fn();
const mockExportPayrollToCSV = jest.fn();
const mockGeneratePayPeriod = jest.fn();
const mockCalculatePayrollEntry = jest.fn();
const mockGetEmployeeYTDTotals = jest.fn();

jest.mock('@/lib/payroll/payroll-service', () => ({
  getPayrollSettings: (...args: unknown[]) => mockGetPayrollSettings(...args),
  savePayrollSettings: (...args: unknown[]) => mockSavePayrollSettings(...args),
  createPayrollRun: (...args: unknown[]) => mockCreatePayrollRun(...args),
  getPayrollRun: (...args: unknown[]) => mockGetPayrollRun(...args),
  updatePayrollRunStatus: (...args: unknown[]) => mockUpdatePayrollRunStatus(...args),
  updatePayrollEntry: (...args: unknown[]) => mockUpdatePayrollEntry(...args),
  addPayrollAdjustment: (...args: unknown[]) => mockAddPayrollAdjustment(...args),
  deletePayrollRun: (...args: unknown[]) => mockDeletePayrollRun(...args),
  getPayrollRuns: (...args: unknown[]) => mockGetPayrollRuns(...args),
  exportPayrollToCSV: (...args: unknown[]) => mockExportPayrollToCSV(...args),
  generatePayPeriod: (...args: unknown[]) => mockGeneratePayPeriod(...args),
  calculatePayrollEntry: (...args: unknown[]) => mockCalculatePayrollEntry(...args),
  getEmployeeYTDTotals: (...args: unknown[]) => mockGetEmployeeYTDTotals(...args),
}));

// ---- Toast mock (not used directly by usePayroll but may be needed) ----
jest.mock('@/components/ui/Toast', () => ({
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

// ---- Helpers ----

const now = new Date();
const oneMonthAgo = new Date(now);
oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
const twoMonthsAgo = new Date(now);
twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

/** Build a Firestore-style doc for onSnapshot, mimicking Timestamp .toDate() */
function makePayrollDoc(overrides: Record<string, unknown> = {}) {
  const id = (overrides.id as string) || 'run-1';
  const defaults: Record<string, unknown> = {
    orgId: 'org-1',
    runNumber: 1,
    status: 'completed',
    entries: [],
    employeeCount: 2,
    totalRegularHours: 80,
    totalOvertimeHours: 5,
    totalGrossPay: 5000,
    totalDeductions: 1000,
    totalNetPay: 4000,
    createdBy: 'user-1',
    createdByName: 'Admin',
    payPeriod: {
      id: 'period-1',
      type: 'bi-weekly',
      startDate: { toDate: () => oneMonthAgo },
      endDate: { toDate: () => now },
      payDate: { toDate: () => now },
      label: 'Jan 1-15, 2026',
    },
    createdAt: { toDate: () => oneMonthAgo },
    updatedAt: { toDate: () => now },
    approvedAt: null,
    processedAt: null,
    exportedAt: null,
    ...overrides,
  };

  return {
    id,
    data: () => defaults,
  };
}

/** Simulate onSnapshot returning payroll run docs */
function simulateSnapshot(docs: Array<ReturnType<typeof makePayrollDoc>>) {
  mockOnSnapshot.mockImplementation((_query: unknown, onNext: Function, _onError: Function) => {
    onNext({ docs });
    return jest.fn(); // unsubscribe
  });
}

/** Simulate onSnapshot error */
function simulateSnapshotError(message: string) {
  mockOnSnapshot.mockImplementation((_query: unknown, _onNext: Function, onError: Function) => {
    onError({ message });
    return jest.fn();
  });
}

// ---- Tests ----

describe('usePayroll', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOnSnapshot.mockImplementation(() => jest.fn());
    mockQuery.mockReturnValue('mock-query');
    mockCollection.mockReturnValue('mock-collection');
    mockGetPayrollSettings.mockResolvedValue(null);
  });

  // ---- 1. Loading state ----
  describe('loading state', () => {
    it('returns loading=true initially, then false after snapshot', async () => {
      // Capture the onNext callback so we can fire it manually
      let capturedOnNext: Function | null = null;
      mockOnSnapshot.mockImplementation((_query: unknown, onNext: Function, _onError: Function) => {
        capturedOnNext = onNext;
        return jest.fn(); // unsubscribe
      });

      const { result } = renderHook(() =>
        usePayroll({ orgId: 'org-1', enabled: true })
      );

      // Before snapshot fires, loading should be true
      expect(result.current.loading).toBe(true);

      // Now simulate snapshot arriving
      await act(async () => {
        capturedOnNext!({
          docs: [makePayrollDoc()],
        });
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.payrollRuns).toHaveLength(1);
    });
  });

  // ---- 2. Returns payroll runs from snapshot with date conversions ----
  describe('fetching payroll runs', () => {
    it('returns payroll runs from snapshot with date conversions', async () => {
      const doc1 = makePayrollDoc({ id: 'run-1', runNumber: 1, status: 'completed' });
      const doc2 = makePayrollDoc({ id: 'run-2', runNumber: 2, status: 'draft' });

      simulateSnapshot([doc1, doc2]);

      const { result } = renderHook(() => usePayroll({ orgId: 'org-1' }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.payrollRuns).toHaveLength(2);
      expect(result.current.payrollRuns[0].id).toBe('run-1');
      expect(result.current.payrollRuns[1].id).toBe('run-2');

      // Verify date fields are converted via .toDate()
      const run = result.current.payrollRuns[0];
      expect(run.createdAt).toBeInstanceOf(Date);
      expect(run.payPeriod.startDate).toBeInstanceOf(Date);
      expect(run.payPeriod.endDate).toBeInstanceOf(Date);
      expect(run.payPeriod.payDate).toBeInstanceOf(Date);
    });
  });

  // ---- 3. Disabled state ----
  describe('disabled state', () => {
    it('sets loading=false when disabled (enabled=false)', async () => {
      const { result } = renderHook(() =>
        usePayroll({ orgId: 'org-1', enabled: false })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.payrollRuns).toEqual([]);
      // Should not subscribe
      expect(mockOnSnapshot).not.toHaveBeenCalled();
    });

    it('sets loading=false when orgId is empty', async () => {
      const { result } = renderHook(() =>
        usePayroll({ orgId: '', enabled: true })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.payrollRuns).toEqual([]);
      expect(mockOnSnapshot).not.toHaveBeenCalled();
    });
  });

  // ---- 4. loadPayrollRun ----
  describe('loadPayrollRun', () => {
    it('calls getPayrollRun and sets currentRun', async () => {
      simulateSnapshot([]);

      const mockRun = {
        id: 'run-load',
        orgId: 'org-1',
        status: 'draft',
        entries: [],
        totalGrossPay: 3000,
        totalNetPay: 2500,
        totalDeductions: 500,
        payPeriod: {
          id: 'pp-1',
          type: 'bi-weekly',
          startDate: new Date(),
          endDate: new Date(),
          payDate: new Date(),
          label: 'Test Period',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockGetPayrollRun.mockResolvedValue(mockRun);

      const { result } = renderHook(() => usePayroll({ orgId: 'org-1' }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.loadPayrollRun('run-load');
      });

      expect(mockGetPayrollRun).toHaveBeenCalledWith('org-1', 'run-load');
      expect(result.current.currentRun).toEqual(mockRun);
    });

    it('sets error on failure', async () => {
      simulateSnapshot([]);
      mockGetPayrollRun.mockRejectedValue(new Error('Run not found'));

      const { result } = renderHook(() => usePayroll({ orgId: 'org-1' }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.loadPayrollRun('nonexistent');
      });

      expect(result.current.error).toBe('Run not found');
    });
  });

  // ---- 5. updateStatus ----
  describe('updateStatus', () => {
    it('calls updatePayrollRunStatus with correct args', async () => {
      simulateSnapshot([]);
      mockUpdatePayrollRunStatus.mockResolvedValue(undefined);

      const { result } = renderHook(() => usePayroll({ orgId: 'org-1' }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateStatus('run-1', 'approved', 'user-1', 'Admin');
      });

      expect(mockUpdatePayrollRunStatus).toHaveBeenCalledWith(
        'org-1',
        'run-1',
        'approved',
        'user-1',
        'Admin'
      );
    });
  });

  // ---- 6. deleteRun ----
  describe('deleteRun', () => {
    it('calls deletePayrollRun and clears currentRun if same ID', async () => {
      simulateSnapshot([]);
      mockDeletePayrollRun.mockResolvedValue(undefined);

      const mockRun = {
        id: 'run-to-delete',
        orgId: 'org-1',
        status: 'draft',
        entries: [],
        totalGrossPay: 0,
        totalNetPay: 0,
        totalDeductions: 0,
        payPeriod: {
          id: 'pp-1',
          type: 'bi-weekly',
          startDate: new Date(),
          endDate: new Date(),
          payDate: new Date(),
          label: 'Period',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockGetPayrollRun.mockResolvedValue(mockRun);

      const { result } = renderHook(() => usePayroll({ orgId: 'org-1' }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // First, load the run so currentRun is set
      await act(async () => {
        await result.current.loadPayrollRun('run-to-delete');
      });

      expect(result.current.currentRun).toEqual(mockRun);

      // Now delete it
      await act(async () => {
        await result.current.deleteRun('run-to-delete');
      });

      expect(mockDeletePayrollRun).toHaveBeenCalledWith('org-1', 'run-to-delete');
      expect(result.current.currentRun).toBeNull();
    });

    it('does not clear currentRun if different ID', async () => {
      simulateSnapshot([]);
      mockDeletePayrollRun.mockResolvedValue(undefined);

      const mockRun = {
        id: 'run-keep',
        orgId: 'org-1',
        status: 'draft',
        entries: [],
        totalGrossPay: 0,
        totalNetPay: 0,
        totalDeductions: 0,
        payPeriod: {
          id: 'pp-1',
          type: 'bi-weekly',
          startDate: new Date(),
          endDate: new Date(),
          payDate: new Date(),
          label: 'Period',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockGetPayrollRun.mockResolvedValue(mockRun);

      const { result } = renderHook(() => usePayroll({ orgId: 'org-1' }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Load run-keep as currentRun
      await act(async () => {
        await result.current.loadPayrollRun('run-keep');
      });

      expect(result.current.currentRun?.id).toBe('run-keep');

      // Delete a different run
      await act(async () => {
        await result.current.deleteRun('run-other');
      });

      // currentRun should still be set
      expect(result.current.currentRun?.id).toBe('run-keep');
    });
  });

  // ---- 7. calculateSummary ----
  describe('calculateSummary', () => {
    it('returns null for empty runs', async () => {
      simulateSnapshot([]);

      const { result } = renderHook(() => usePayroll({ orgId: 'org-1' }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.calculateSummary()).toBeNull();
    });

    it('computes totalGrossPay and totalNetPay from completed runs', async () => {
      const completedRun1 = makePayrollDoc({
        id: 'run-c1',
        status: 'completed',
        totalGrossPay: 5000,
        totalDeductions: 1000,
        totalNetPay: 4000,
        entries: [
          {
            employeeId: 'emp-1',
            employeeName: 'Alice',
            grossPay: 2500,
            netPay: 2000,
            regularHours: 40,
            overtimeHours: 2,
            ptoHours: 0,
            sickHours: 0,
          },
          {
            employeeId: 'emp-2',
            employeeName: 'Bob',
            grossPay: 2500,
            netPay: 2000,
            regularHours: 40,
            overtimeHours: 3,
            ptoHours: 0,
            sickHours: 0,
          },
        ],
        employeeCount: 2,
      });

      const completedRun2 = makePayrollDoc({
        id: 'run-c2',
        status: 'completed',
        totalGrossPay: 6000,
        totalDeductions: 1200,
        totalNetPay: 4800,
        entries: [
          {
            employeeId: 'emp-1',
            employeeName: 'Alice',
            grossPay: 3000,
            netPay: 2400,
            regularHours: 40,
            overtimeHours: 5,
            ptoHours: 0,
            sickHours: 0,
          },
          {
            employeeId: 'emp-2',
            employeeName: 'Bob',
            grossPay: 3000,
            netPay: 2400,
            regularHours: 40,
            overtimeHours: 0,
            ptoHours: 8,
            sickHours: 0,
          },
        ],
        employeeCount: 2,
      });

      simulateSnapshot([completedRun1, completedRun2]);

      const { result } = renderHook(() => usePayroll({ orgId: 'org-1' }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const summary = result.current.calculateSummary();

      expect(summary).not.toBeNull();
      // totalGrossPay = 5000 + 6000 = 11000
      expect(summary!.totalGrossPay).toBe(11000);
      // totalNetPay = 4000 + 4800 = 8800
      expect(summary!.totalNetPay).toBe(8800);
      // totalTaxes (totalDeductions) = 1000 + 1200 = 2200
      expect(summary!.totalTaxes).toBe(2200);
      // totalRuns = 2
      expect(summary!.totalRuns).toBe(2);
      // totalEmployees = 2 (Alice and Bob)
      expect(summary!.totalEmployees).toBe(2);

      // byEmployee aggregation
      const alice = summary!.byEmployee.find((e) => e.employeeId === 'emp-1');
      expect(alice).toBeDefined();
      expect(alice!.grossPay).toBe(5500); // 2500 + 3000
      expect(alice!.netPay).toBe(4400); // 2000 + 2400

      const bob = summary!.byEmployee.find((e) => e.employeeId === 'emp-2');
      expect(bob).toBeDefined();
      expect(bob!.grossPay).toBe(5500); // 2500 + 3000
    });

    it('generates alerts for pending_approval runs', async () => {
      const pendingRun = makePayrollDoc({
        id: 'run-pending',
        status: 'pending_approval',
        totalGrossPay: 5000,
        totalDeductions: 1000,
        totalNetPay: 4000,
        entries: [],
        employeeCount: 2,
      });

      simulateSnapshot([pendingRun]);

      const { result } = renderHook(() => usePayroll({ orgId: 'org-1' }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const summary = result.current.calculateSummary();

      expect(summary).not.toBeNull();
      expect(summary!.alerts).toHaveLength(1);
      expect(summary!.alerts[0].type).toBe('pending_approval');
      expect(summary!.alerts[0].severity).toBe('warning');
      expect(summary!.alerts[0].message).toContain('1 payroll run(s) pending approval');
      expect(summary!.alerts[0].payrollRunId).toBe('run-pending');
    });

    it('does not count non-completed runs in totals', async () => {
      const draftRun = makePayrollDoc({
        id: 'run-draft',
        status: 'draft',
        totalGrossPay: 9999,
        totalDeductions: 999,
        totalNetPay: 9000,
        entries: [],
        employeeCount: 1,
        // Set payDate far in the future so no upcoming_deadline alert
        payPeriod: {
          id: 'pp-draft',
          type: 'bi-weekly',
          startDate: { toDate: () => oneMonthAgo },
          endDate: { toDate: () => now },
          payDate: { toDate: () => new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) },
          label: 'Draft Period',
        },
      });

      simulateSnapshot([draftRun]);

      const { result } = renderHook(() => usePayroll({ orgId: 'org-1' }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const summary = result.current.calculateSummary();

      expect(summary).not.toBeNull();
      // Draft runs are not completed, so totals should be 0
      expect(summary!.totalGrossPay).toBe(0);
      expect(summary!.totalNetPay).toBe(0);
      expect(summary!.totalRuns).toBe(0);
    });
  });

  // ---- 8. Error handling ----
  describe('error handling', () => {
    it('sets error on snapshot error', async () => {
      simulateSnapshotError('Firestore subscription failed');

      const { result } = renderHook(() => usePayroll({ orgId: 'org-1' }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Firestore subscription failed');
    });
  });

  // ---- 9. generatePeriod ----
  describe('generatePeriod', () => {
    it('delegates to generatePayPeriod from payroll-service', async () => {
      simulateSnapshot([]);

      const mockPeriod = {
        id: 'pp-gen',
        type: 'bi-weekly',
        startDate: new Date(),
        endDate: new Date(),
        payDate: new Date(),
        label: 'Generated Period',
      };
      mockGeneratePayPeriod.mockReturnValue(mockPeriod);

      const { result } = renderHook(() => usePayroll({ orgId: 'org-1' }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const period = result.current.generatePeriod('bi-weekly');

      expect(mockGeneratePayPeriod).toHaveBeenCalledWith('bi-weekly', undefined);
      expect(period).toEqual(mockPeriod);
    });
  });
});
