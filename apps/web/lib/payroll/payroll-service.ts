/**
 * Payroll Service
 *
 * Handles payroll run creation, calculation, and management.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  PayrollRun,
  PayrollEntry,
  PayPeriod,
  PaySchedule,
  PayrollSettings,
  PayrollAdjustment,
  TimeEntry,
  UserProfile,
  EmployeeType,
} from '@/types';
import { calculateTaxes } from './tax-calculator';
import { TaxCalculationInput } from '@/types';

// Collection paths
const getPayrollRunsPath = (orgId: string) => `organizations/${orgId}/payrollRuns`;
const getPayrollSettingsPath = (orgId: string) => `organizations/${orgId}/payrollSettings`;

/**
 * Generate a pay period based on schedule type and date
 */
export function generatePayPeriod(
  type: PaySchedule,
  referenceDate: Date = new Date()
): PayPeriod {
  const id = `period_${Date.now()}`;
  let startDate: Date;
  let endDate: Date;
  let payDate: Date;

  switch (type) {
    case 'weekly': {
      // Find the most recent Sunday (start of week)
      const dayOfWeek = referenceDate.getDay();
      startDate = new Date(referenceDate);
      startDate.setDate(referenceDate.getDate() - dayOfWeek - 7); // Previous week
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);

      // Pay date is typically Friday of the following week
      payDate = new Date(endDate);
      payDate.setDate(endDate.getDate() + 5);
      break;
    }
    case 'bi-weekly': {
      // Two-week pay period
      const dayOfWeek = referenceDate.getDay();
      startDate = new Date(referenceDate);
      startDate.setDate(referenceDate.getDate() - dayOfWeek - 14); // Two weeks ago Sunday
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 13);
      endDate.setHours(23, 59, 59, 999);

      // Pay date is typically Friday of the following week
      payDate = new Date(endDate);
      payDate.setDate(endDate.getDate() + 5);
      break;
    }
    case 'semi-monthly': {
      // 1st-15th or 16th-end of month
      const day = referenceDate.getDate();
      startDate = new Date(referenceDate);

      if (day <= 15) {
        // Use previous period (16th to end of last month)
        startDate.setMonth(startDate.getMonth() - 1);
        startDate.setDate(16);
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0); // Last day of the month
        endDate.setHours(23, 59, 59, 999);

        payDate = new Date(referenceDate);
        payDate.setDate(5); // Typically 5th of the month
      } else {
        // Use 1st-15th of current month
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(startDate);
        endDate.setDate(15);
        endDate.setHours(23, 59, 59, 999);

        payDate = new Date(referenceDate);
        payDate.setDate(20); // Typically 20th of the month
      }
      break;
    }
    case 'monthly': {
      // Previous full month
      startDate = new Date(referenceDate);
      startDate.setMonth(startDate.getMonth() - 1);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(referenceDate);
      endDate.setDate(0); // Last day of previous month
      endDate.setHours(23, 59, 59, 999);

      // Pay date is typically 5th of current month
      payDate = new Date(referenceDate);
      payDate.setDate(5);
      break;
    }
  }

  // Format label
  const formatDate = (d: Date) => {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  const label = `${formatDate(startDate)} - ${formatDate(endDate)}, ${endDate.getFullYear()}`;

  return {
    id,
    type,
    startDate,
    endDate,
    payDate,
    label,
  };
}

/**
 * Calculate payroll entry for a single employee
 */
export function calculatePayrollEntry(
  employee: UserProfile,
  timeEntries: TimeEntry[],
  payPeriod: PayPeriod,
  payrollRunId: string,
  settings: PayrollSettings,
  ytdData: { grossPay: number; federal: number; state: number; ss: number; medicare: number }
): PayrollEntry {
  const id = `entry_${employee.uid}_${Date.now()}`;

  // Default rates
  const regularRate = employee.hourlyRate ?? 0;
  const overtimeMultiplier = employee.overtimeRate ?? settings.overtimeMultiplier ?? 1.5;
  const doubleTimeMultiplier = employee.doubleTimeRate ?? settings.doubleTimeMultiplier ?? 2.0;

  // Calculate hours from time entries
  let regularHours = 0;
  let overtimeHours = 0;
  let doubleTimeHours = 0;
  let ptoHours = 0;
  let sickHours = 0;
  let holidayHours = 0;

  const timeEntryIds: string[] = [];

  // Group entries by day for daily overtime calculation
  const entriesByDay = new Map<string, TimeEntry[]>();

  for (const entry of timeEntries) {
    if (entry.userId !== employee.uid) continue;

    // Use clockIn for date (TimeEntry uses clockIn, not date)
    const entryClockIn = entry.clockIn instanceof Date ? entry.clockIn : new Date(entry.clockIn);
    const entryDate = entryClockIn.toISOString().split('T')[0];

    if (!entriesByDay.has(entryDate)) {
      entriesByDay.set(entryDate, []);
    }
    entriesByDay.get(entryDate)!.push(entry);
    timeEntryIds.push(entry.id);
  }

  // Calculate hours with overtime rules
  let weeklyHours = 0;

  entriesByDay.forEach((dayEntries) => {
    let dailyHours = 0;

    for (const entry of dayEntries) {
      // TimeEntry uses totalMinutes (convert to hours)
      const hours = entry.totalMinutes ? entry.totalMinutes / 60 : 0;

      // Note: PTO, sick, holiday are handled via TimeOffRequest system, not TimeEntry
      // TimeEntry.type is 'clock' | 'manual' | 'imported' (regular work time)
      // Future enhancement: integrate TimeOffRequest for PTO/sick calculations

      dailyHours += hours;
    }

    // Daily overtime (if enabled)
    if (settings.enableDailyOvertime && dailyHours > settings.dailyOvertimeThreshold) {
      const dailyOT = dailyHours - settings.dailyOvertimeThreshold;
      overtimeHours += dailyOT;
      regularHours += settings.dailyOvertimeThreshold;
    } else {
      regularHours += dailyHours;
    }

    weeklyHours += dailyHours;
  });

  // Weekly overtime (40 hours)
  if (!settings.enableDailyOvertime && weeklyHours > settings.weeklyOvertimeThreshold) {
    const weeklyOT = weeklyHours - settings.weeklyOvertimeThreshold;
    overtimeHours = weeklyOT;
    regularHours = settings.weeklyOvertimeThreshold;
  }

  // Calculate earnings
  const regularPay = regularHours * regularRate;
  const overtimePay = overtimeHours * regularRate * overtimeMultiplier;
  const doubleTimePay = doubleTimeHours * regularRate * doubleTimeMultiplier;
  const ptoPay = ptoHours * regularRate;
  const sickPay = sickHours * regularRate;
  const holidayPay = holidayHours * regularRate * 1.5; // Holiday premium

  // For salaried employees, use salary / periods per year
  let salaryPay = 0;
  if (employee.employeeType === 'salaried' && employee.salary) {
    const periodsPerYear = payPeriod.type === 'weekly' ? 52
      : payPeriod.type === 'bi-weekly' ? 26
      : payPeriod.type === 'semi-monthly' ? 24
      : 12;
    salaryPay = employee.salary / periodsPerYear;
  }

  const basePay = employee.employeeType === 'salaried' ? salaryPay : regularPay;
  const grossPay = basePay + overtimePay + doubleTimePay + ptoPay + sickPay + holidayPay;

  // Calculate taxes
  const taxInput: TaxCalculationInput = {
    grossPay,
    payPeriodType: payPeriod.type,
    filingStatus: employee.w4Info?.filingStatus ?? 'single',
    allowances: employee.w4Info?.allowances ?? 0,
    additionalWithholding: employee.w4Info?.additionalWithholding ?? 0,
    isExempt: employee.w4Info?.isExempt ?? false,
    stateCode: settings.stateCode ?? 'NC',
    ytdGrossPay: ytdData.grossPay,
  };

  const taxes = calculateTaxes(taxInput);

  // Other deductions (defaults)
  const retirement401k = (settings.defaultRetirementPercent ?? 0) * grossPay / 100;
  const healthInsurance = settings.healthInsuranceAmount ?? 0;

  const totalDeductions =
    taxes.federalWithholding +
    taxes.stateWithholding +
    taxes.socialSecurity +
    taxes.medicare +
    retirement401k +
    healthInsurance;

  const netPay = grossPay - totalDeductions;

  return {
    id,
    payrollRunId,
    employeeId: employee.uid,
    employeeName: employee.displayName,
    employeeType: employee.employeeType ?? 'hourly',

    regularHours,
    overtimeHours,
    doubleTimeHours,
    ptoHours,
    sickHours,
    holidayHours,

    regularRate,
    overtimeRate: overtimeMultiplier,
    doubleTimeRate: doubleTimeMultiplier,

    regularPay: employee.employeeType === 'salaried' ? salaryPay : regularPay,
    overtimePay,
    doubleTimePay,
    ptoPay,
    sickPay,
    holidayPay,
    bonuses: 0,
    commissions: 0,
    reimbursements: 0,
    grossPay,

    federalWithholding: taxes.federalWithholding,
    stateWithholding: taxes.stateWithholding,
    socialSecurity: taxes.socialSecurity,
    medicare: taxes.medicare,
    localTax: 0,
    retirement401k,
    healthInsurance,
    otherDeductions: 0,
    totalDeductions,

    netPay,

    timeEntryIds,
    adjustments: [],

    ytdGrossPay: ytdData.grossPay + grossPay,
    ytdFederalWithholding: ytdData.federal + taxes.federalWithholding,
    ytdStateWithholding: ytdData.state + taxes.stateWithholding,
    ytdSocialSecurity: ytdData.ss + taxes.socialSecurity,
    ytdMedicare: ytdData.medicare + taxes.medicare,

    hasManualOverrides: false,
  };
}

/**
 * Get payroll settings for an organization
 */
export async function getPayrollSettings(orgId: string): Promise<PayrollSettings | null> {
  const docRef = doc(db, getPayrollSettingsPath(orgId), 'default');
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    ...data,
    id: docSnap.id,
    createdAt: data.createdAt?.toDate() ?? new Date(),
    updatedAt: data.updatedAt?.toDate() ?? new Date(),
  } as PayrollSettings;
}

/**
 * Save payroll settings
 */
export async function savePayrollSettings(
  orgId: string,
  settings: Partial<PayrollSettings>
): Promise<void> {
  const docRef = doc(db, getPayrollSettingsPath(orgId), 'default');
  const existing = await getDoc(docRef);

  if (existing.exists()) {
    await updateDoc(docRef, {
      ...settings,
      updatedAt: Timestamp.now(),
    });
  } else {
    await setDoc(docRef, {
      ...settings,
      id: 'default',
      orgId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }
}

/**
 * Create a new payroll run
 */
export async function createPayrollRun(
  orgId: string,
  payPeriod: PayPeriod,
  entries: PayrollEntry[],
  createdBy: string,
  createdByName: string
): Promise<string> {
  const runId = `run_${Date.now()}`;
  const collectionRef = collection(db, getPayrollRunsPath(orgId));

  // Get next run number for the year
  const year = new Date().getFullYear();
  const existingRunsQuery = query(
    collectionRef,
    where('createdAt', '>=', Timestamp.fromDate(new Date(year, 0, 1))),
    orderBy('createdAt', 'desc'),
    limit(1)
  );
  const existingRuns = await getDocs(existingRunsQuery);
  const lastRunNumber = existingRuns.empty ? 0 : (existingRuns.docs[0].data().runNumber ?? 0);

  // Calculate totals
  const totalRegularHours = entries.reduce((sum, e) => sum + e.regularHours, 0);
  const totalOvertimeHours = entries.reduce((sum, e) => sum + e.overtimeHours, 0);
  const totalGrossPay = entries.reduce((sum, e) => sum + e.grossPay, 0);
  const totalDeductions = entries.reduce((sum, e) => sum + e.totalDeductions, 0);
  const totalNetPay = entries.reduce((sum, e) => sum + e.netPay, 0);

  const payrollRun: Omit<PayrollRun, 'id'> = {
    orgId,
    runNumber: lastRunNumber + 1,
    payPeriod: {
      ...payPeriod,
      startDate: payPeriod.startDate,
      endDate: payPeriod.endDate,
      payDate: payPeriod.payDate,
    },
    status: 'draft',
    entries,
    employeeCount: entries.length,
    totalRegularHours,
    totalOvertimeHours,
    totalGrossPay,
    totalDeductions,
    totalNetPay,
    createdBy,
    createdByName,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await setDoc(doc(collectionRef, runId), {
    ...payrollRun,
    id: runId,
    payPeriod: {
      ...payPeriod,
      startDate: Timestamp.fromDate(payPeriod.startDate),
      endDate: Timestamp.fromDate(payPeriod.endDate),
      payDate: Timestamp.fromDate(payPeriod.payDate),
    },
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  return runId;
}

/**
 * Get a payroll run by ID
 */
export async function getPayrollRun(orgId: string, runId: string): Promise<PayrollRun | null> {
  const docRef = doc(db, getPayrollRunsPath(orgId), runId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    ...data,
    id: docSnap.id,
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
}

/**
 * Update payroll run status
 */
export async function updatePayrollRunStatus(
  orgId: string,
  runId: string,
  status: PayrollRun['status'],
  userId?: string,
  userName?: string
): Promise<void> {
  const docRef = doc(db, getPayrollRunsPath(orgId), runId);

  const updates: Record<string, unknown> = {
    status,
    updatedAt: Timestamp.now(),
  };

  if (status === 'approved' && userId) {
    updates.approvedBy = userId;
    updates.approvedByName = userName;
    updates.approvedAt = Timestamp.now();
  }

  if (status === 'completed' && userId) {
    updates.processedBy = userId;
    updates.processedAt = Timestamp.now();
  }

  await updateDoc(docRef, updates);
}

/**
 * Update a payroll entry within a run
 */
export async function updatePayrollEntry(
  orgId: string,
  runId: string,
  entryId: string,
  updates: Partial<PayrollEntry>
): Promise<void> {
  const docRef = doc(db, getPayrollRunsPath(orgId), runId);
  const runSnap = await getDoc(docRef);

  if (!runSnap.exists()) {
    throw new Error('Payroll run not found');
  }

  const runData = runSnap.data();
  const entries = runData.entries as PayrollEntry[];
  const entryIndex = entries.findIndex(e => e.id === entryId);

  if (entryIndex === -1) {
    throw new Error('Payroll entry not found');
  }

  // Update the entry
  entries[entryIndex] = {
    ...entries[entryIndex],
    ...updates,
    hasManualOverrides: true,
  };

  // Recalculate totals
  const totalRegularHours = entries.reduce((sum, e) => sum + e.regularHours, 0);
  const totalOvertimeHours = entries.reduce((sum, e) => sum + e.overtimeHours, 0);
  const totalGrossPay = entries.reduce((sum, e) => sum + e.grossPay, 0);
  const totalDeductions = entries.reduce((sum, e) => sum + e.totalDeductions, 0);
  const totalNetPay = entries.reduce((sum, e) => sum + e.netPay, 0);

  await updateDoc(docRef, {
    entries,
    totalRegularHours,
    totalOvertimeHours,
    totalGrossPay,
    totalDeductions,
    totalNetPay,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Add adjustment to a payroll entry
 */
export async function addPayrollAdjustment(
  orgId: string,
  runId: string,
  entryId: string,
  adjustment: Omit<PayrollAdjustment, 'id'>
): Promise<void> {
  const docRef = doc(db, getPayrollRunsPath(orgId), runId);
  const runSnap = await getDoc(docRef);

  if (!runSnap.exists()) {
    throw new Error('Payroll run not found');
  }

  const runData = runSnap.data();
  const entries = runData.entries as PayrollEntry[];
  const entryIndex = entries.findIndex(e => e.id === entryId);

  if (entryIndex === -1) {
    throw new Error('Payroll entry not found');
  }

  const entry = entries[entryIndex];
  const adjustmentId = `adj_${Date.now()}`;
  const newAdjustment: PayrollAdjustment = {
    ...adjustment,
    id: adjustmentId,
  };

  entry.adjustments = [...(entry.adjustments || []), newAdjustment];

  // Recalculate entry totals based on adjustment
  if (adjustment.taxable) {
    entry.grossPay += adjustment.amount;
    // Recalculate taxes (simplified - would need full recalc in production)
  } else {
    // Non-taxable reimbursement
    entry.reimbursements += adjustment.amount;
    entry.grossPay += adjustment.amount;
  }
  entry.netPay = entry.grossPay - entry.totalDeductions;

  entries[entryIndex] = entry;

  // Recalculate run totals
  const totalGrossPay = entries.reduce((sum, e) => sum + e.grossPay, 0);
  const totalDeductions = entries.reduce((sum, e) => sum + e.totalDeductions, 0);
  const totalNetPay = entries.reduce((sum, e) => sum + e.netPay, 0);

  await updateDoc(docRef, {
    entries,
    totalGrossPay,
    totalDeductions,
    totalNetPay,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Delete a payroll run (only if draft)
 */
export async function deletePayrollRun(orgId: string, runId: string): Promise<void> {
  const docRef = doc(db, getPayrollRunsPath(orgId), runId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error('Payroll run not found');
  }

  const data = docSnap.data();
  if (data.status !== 'draft') {
    throw new Error('Can only delete draft payroll runs');
  }

  await deleteDoc(docRef);
}

/**
 * Get payroll runs for an organization
 */
export async function getPayrollRuns(
  orgId: string,
  options?: {
    status?: PayrollRun['status'];
    year?: number;
    limitCount?: number;
  }
): Promise<PayrollRun[]> {
  const collectionRef = collection(db, getPayrollRunsPath(orgId));

  let q = query(collectionRef, orderBy('createdAt', 'desc'));

  if (options?.status) {
    q = query(q, where('status', '==', options.status));
  }

  if (options?.year) {
    const startOfYear = new Date(options.year, 0, 1);
    const endOfYear = new Date(options.year, 11, 31, 23, 59, 59);
    q = query(
      q,
      where('createdAt', '>=', Timestamp.fromDate(startOfYear)),
      where('createdAt', '<=', Timestamp.fromDate(endOfYear))
    );
  }

  if (options?.limitCount) {
    q = query(q, limit(options.limitCount));
  }

  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => {
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
}

/**
 * Export payroll run to CSV format
 */
export function exportPayrollToCSV(payrollRun: PayrollRun): string {
  const headers = [
    'Employee ID',
    'Employee Name',
    'Regular Hours',
    'Overtime Hours',
    'PTO Hours',
    'Sick Hours',
    'Regular Pay',
    'Overtime Pay',
    'PTO Pay',
    'Sick Pay',
    'Bonuses',
    'Gross Pay',
    'Federal Tax',
    'State Tax',
    'Social Security',
    'Medicare',
    '401k',
    'Health Insurance',
    'Total Deductions',
    'Net Pay',
  ];

  const rows = payrollRun.entries.map(entry => [
    entry.employeeId,
    entry.employeeName,
    entry.regularHours.toFixed(2),
    entry.overtimeHours.toFixed(2),
    entry.ptoHours.toFixed(2),
    entry.sickHours.toFixed(2),
    entry.regularPay.toFixed(2),
    entry.overtimePay.toFixed(2),
    entry.ptoPay.toFixed(2),
    entry.sickPay.toFixed(2),
    entry.bonuses.toFixed(2),
    entry.grossPay.toFixed(2),
    entry.federalWithholding.toFixed(2),
    entry.stateWithholding.toFixed(2),
    entry.socialSecurity.toFixed(2),
    entry.medicare.toFixed(2),
    entry.retirement401k.toFixed(2),
    entry.healthInsurance.toFixed(2),
    entry.totalDeductions.toFixed(2),
    entry.netPay.toFixed(2),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
    '', // Empty line
    `Pay Period: ${payrollRun.payPeriod.label}`,
    `Pay Date: ${payrollRun.payPeriod.payDate.toLocaleDateString()}`,
    `Total Gross: $${payrollRun.totalGrossPay.toFixed(2)}`,
    `Total Net: $${payrollRun.totalNetPay.toFixed(2)}`,
  ].join('\n');

  return csvContent;
}

/**
 * Get YTD totals for an employee
 */
export async function getEmployeeYTDTotals(
  orgId: string,
  employeeId: string,
  year: number = new Date().getFullYear()
): Promise<{
  grossPay: number;
  federal: number;
  state: number;
  ss: number;
  medicare: number;
}> {
  const runs = await getPayrollRuns(orgId, { year, status: 'completed' });

  const totals = {
    grossPay: 0,
    federal: 0,
    state: 0,
    ss: 0,
    medicare: 0,
  };

  for (const run of runs) {
    const entry = run.entries.find(e => e.employeeId === employeeId);
    if (entry) {
      totals.grossPay += entry.grossPay;
      totals.federal += entry.federalWithholding;
      totals.state += entry.stateWithholding;
      totals.ss += entry.socialSecurity;
      totals.medicare += entry.medicare;
    }
  }

  return totals;
}
