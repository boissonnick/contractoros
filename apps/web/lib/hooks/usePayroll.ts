'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  PayrollRun,
  PayrollEntry,
  PayPeriod,
  PayrollSettings,
  PayrollSummary,
  PaySchedule,
  UserProfile,
  TimeEntry,
} from '@/types';
import {
  getPayrollSettings,
  savePayrollSettings,
  createPayrollRun,
  getPayrollRun,
  updatePayrollRunStatus,
  updatePayrollEntry,
  addPayrollAdjustment,
  deletePayrollRun,
  exportPayrollToCSV,
  generatePayPeriod,
  calculatePayrollEntry,
  getEmployeeYTDTotals,
} from '@/lib/payroll/payroll-service';

const getPayrollRunsPath = (orgId: string) => `organizations/${orgId}/payrollRuns`;

interface UsePayrollOptions {
  orgId: string;
  enabled?: boolean;
}

interface UsePayrollReturn {
  // State
  payrollRuns: PayrollRun[];
  currentRun: PayrollRun | null;
  settings: PayrollSettings | null;
  loading: boolean;
  error: string | null;

  // Actions
  loadPayrollRun: (runId: string) => Promise<void>;
  createRun: (
    payPeriod: PayPeriod,
    employees: UserProfile[],
    timeEntries: TimeEntry[],
    createdBy: string,
    createdByName: string
  ) => Promise<string>;
  updateStatus: (runId: string, status: PayrollRun['status'], userId?: string, userName?: string) => Promise<void>;
  updateEntry: (runId: string, entryId: string, updates: Partial<PayrollEntry>) => Promise<void>;
  addAdjustment: (runId: string, entryId: string, adjustment: Parameters<typeof addPayrollAdjustment>[3]) => Promise<void>;
  deleteRun: (runId: string) => Promise<void>;
  exportToCSV: (runId: string) => Promise<string>;

  // Settings
  loadSettings: () => Promise<void>;
  updateSettings: (settings: Partial<PayrollSettings>) => Promise<void>;

  // Helpers
  generatePeriod: (type: PaySchedule, referenceDate?: Date) => PayPeriod;
  calculateSummary: () => PayrollSummary | null;
}

export function usePayroll({ orgId, enabled = true }: UsePayrollOptions): UsePayrollReturn {
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [currentRun, setCurrentRun] = useState<PayrollRun | null>(null);
  const [settings, setSettings] = useState<PayrollSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to payroll runs
  useEffect(() => {
    if (!enabled || !orgId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const collectionRef = collection(db, getPayrollRunsPath(orgId));
    const q = query(
      collectionRef,
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const runs = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            payPeriod: {
              ...data.payPeriod,
              startDate: data.payPeriod.startDate?.toDate() ?? new Date(),
              endDate: data.payPeriod.endDate?.toDate() ?? new Date(),
              payDate: data.payPeriod.payDate?.toDate() ?? new Date(),
            },
            createdAt: data.createdAt?.toDate() ?? new Date(),
            updatedAt: data.updatedAt?.toDate() ?? new Date(),
            approvedAt: data.approvedAt?.toDate(),
            processedAt: data.processedAt?.toDate(),
            exportedAt: data.exportedAt?.toDate(),
          } as PayrollRun;
        });
        setPayrollRuns(runs);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching payroll runs:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orgId, enabled]);

  const loadSettings = useCallback(async () => {
    try {
      const loadedSettings = await getPayrollSettings(orgId);
      setSettings(loadedSettings);
    } catch (err) {
      console.error('Error loading payroll settings:', err);
    }
  }, [orgId]);

  // Load settings on mount
  useEffect(() => {
    if (!enabled || !orgId) return;

    loadSettings();
  }, [orgId, enabled, loadSettings]);

  const loadPayrollRun = useCallback(async (runId: string) => {
    try {
      setLoading(true);
      const run = await getPayrollRun(orgId, runId);
      setCurrentRun(run);
    } catch (err) {
      console.error('Error loading payroll run:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  const createRun = useCallback(async (
    payPeriod: PayPeriod,
    employees: UserProfile[],
    timeEntries: TimeEntry[],
    createdBy: string,
    createdByName: string
  ): Promise<string> => {
    if (!settings) {
      // Use default settings
      const defaultSettings: PayrollSettings = {
        id: 'default',
        orgId,
        defaultPaySchedule: 'bi-weekly',
        dailyOvertimeThreshold: 8,
        weeklyOvertimeThreshold: 40,
        overtimeMultiplier: 1.5,
        doubleTimeMultiplier: 2.0,
        enableDailyOvertime: false,
        enableSeventhDayOvertime: false,
        stateCode: 'NC',
        employerSocialSecurityRate: 0.062,
        employerMedicareRate: 0.0145,
        employerFutaRate: 0.006,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Calculate entries for each employee
      const entries: PayrollEntry[] = [];

      for (const employee of employees) {
        if (employee.role !== 'EMPLOYEE' && employee.role !== 'PM') continue;

        // Get YTD totals
        const ytdData = await getEmployeeYTDTotals(orgId, employee.uid);

        // Filter time entries for this pay period (TimeEntry uses clockIn, not date)
        const employeeEntries = timeEntries.filter(entry => {
          const entryDate = entry.clockIn instanceof Date ? entry.clockIn : new Date(entry.clockIn);
          return entryDate >= payPeriod.startDate && entryDate <= payPeriod.endDate;
        });

        const payrollEntry = calculatePayrollEntry(
          employee,
          employeeEntries,
          payPeriod,
          '', // Will be set after run creation
          defaultSettings,
          ytdData
        );

        entries.push(payrollEntry);
      }

      return createPayrollRun(orgId, payPeriod, entries, createdBy, createdByName);
    }

    // Calculate entries using actual settings
    const entries: PayrollEntry[] = [];

    for (const employee of employees) {
      if (employee.role !== 'EMPLOYEE' && employee.role !== 'PM') continue;

      const ytdData = await getEmployeeYTDTotals(orgId, employee.uid);

      const employeeEntries = timeEntries.filter(entry => {
        const entryDate = entry.clockIn instanceof Date ? entry.clockIn : new Date(entry.clockIn);
        return entryDate >= payPeriod.startDate && entryDate <= payPeriod.endDate;
      });

      const payrollEntry = calculatePayrollEntry(
        employee,
        employeeEntries,
        payPeriod,
        '',
        settings,
        ytdData
      );

      entries.push(payrollEntry);
    }

    return createPayrollRun(orgId, payPeriod, entries, createdBy, createdByName);
  }, [orgId, settings]);

  const updateStatus = useCallback(async (
    runId: string,
    status: PayrollRun['status'],
    userId?: string,
    userName?: string
  ) => {
    await updatePayrollRunStatus(orgId, runId, status, userId, userName);
  }, [orgId]);

  const updateEntry = useCallback(async (
    runId: string,
    entryId: string,
    updates: Partial<PayrollEntry>
  ) => {
    await updatePayrollEntry(orgId, runId, entryId, updates);
  }, [orgId]);

  const addAdjustmentFn = useCallback(async (
    runId: string,
    entryId: string,
    adjustment: Parameters<typeof addPayrollAdjustment>[3]
  ) => {
    await addPayrollAdjustment(orgId, runId, entryId, adjustment);
  }, [orgId]);

  const deleteRun = useCallback(async (runId: string) => {
    await deletePayrollRun(orgId, runId);
    if (currentRun?.id === runId) {
      setCurrentRun(null);
    }
  }, [orgId, currentRun]);

  const exportToCSV = useCallback(async (runId: string): Promise<string> => {
    const run = await getPayrollRun(orgId, runId);
    if (!run) {
      throw new Error('Payroll run not found');
    }
    return exportPayrollToCSV(run);
  }, [orgId]);

  const updateSettingsFn = useCallback(async (updates: Partial<PayrollSettings>) => {
    await savePayrollSettings(orgId, updates);
    await loadSettings();
  }, [orgId, loadSettings]);

  const generatePeriod = useCallback((type: PaySchedule, referenceDate?: Date): PayPeriod => {
    return generatePayPeriod(type, referenceDate);
  }, []);

  const calculateSummary = useCallback((): PayrollSummary | null => {
    if (payrollRuns.length === 0) return null;

    const now = new Date();
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const recentRuns = payrollRuns.filter(
      run => run.createdAt >= threeMonthsAgo
    );

    const completedRuns = recentRuns.filter(run => run.status === 'completed');

    const totalGrossPay = completedRuns.reduce((sum, run) => sum + run.totalGrossPay, 0);
    const totalNetPay = completedRuns.reduce((sum, run) => sum + run.totalNetPay, 0);
    const totalTaxes = completedRuns.reduce((sum, run) => sum + run.totalDeductions, 0);

    // Employee breakdown
    const employeeMap = new Map<string, {
      employeeId: string;
      employeeName: string;
      grossPay: number;
      netPay: number;
      hoursWorked: number;
      overtimeHours: number;
    }>();

    for (const run of completedRuns) {
      for (const entry of run.entries) {
        const existing = employeeMap.get(entry.employeeId) ?? {
          employeeId: entry.employeeId,
          employeeName: entry.employeeName,
          grossPay: 0,
          netPay: 0,
          hoursWorked: 0,
          overtimeHours: 0,
        };

        existing.grossPay += entry.grossPay;
        existing.netPay += entry.netPay;
        existing.hoursWorked += entry.regularHours + entry.overtimeHours + entry.ptoHours + entry.sickHours;
        existing.overtimeHours += entry.overtimeHours;

        employeeMap.set(entry.employeeId, existing);
      }
    }

    // Alerts
    const alerts: PayrollSummary['alerts'] = [];

    // Check for pending approval
    const pendingRuns = recentRuns.filter(run => run.status === 'pending_approval');
    if (pendingRuns.length > 0) {
      alerts.push({
        type: 'pending_approval',
        message: `${pendingRuns.length} payroll run(s) pending approval`,
        severity: 'warning',
        payrollRunId: pendingRuns[0].id,
      });
    }

    // Check for upcoming deadline
    const draftRuns = recentRuns.filter(run => run.status === 'draft');
    for (const run of draftRuns) {
      const daysUntilPayDate = Math.ceil(
        (run.payPeriod.payDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntilPayDate <= 3 && daysUntilPayDate > 0) {
        alerts.push({
          type: 'upcoming_deadline',
          message: `Payroll due in ${daysUntilPayDate} day(s) for ${run.payPeriod.label}`,
          severity: 'warning',
          payrollRunId: run.id,
        });
      }
    }

    return {
      orgId,
      period: { start: threeMonthsAgo, end: now },
      totalRuns: completedRuns.length,
      totalEmployees: employeeMap.size,
      totalGrossPay,
      totalNetPay,
      totalTaxes,
      byPeriod: recentRuns.map(run => ({
        periodLabel: run.payPeriod.label,
        runId: run.id,
        status: run.status,
        employeeCount: run.employeeCount,
        grossPay: run.totalGrossPay,
        netPay: run.totalNetPay,
        payDate: run.payPeriod.payDate,
      })),
      byEmployee: Array.from(employeeMap.values()),
      alerts,
    };
  }, [payrollRuns, orgId]);

  return {
    payrollRuns,
    currentRun,
    settings,
    loading,
    error,
    loadPayrollRun,
    createRun,
    updateStatus,
    updateEntry,
    addAdjustment: addAdjustmentFn,
    deleteRun,
    exportToCSV,
    loadSettings,
    updateSettings: updateSettingsFn,
    generatePeriod,
    calculateSummary,
  };
}

export default usePayroll;
