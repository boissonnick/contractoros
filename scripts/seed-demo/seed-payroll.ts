/**
 * Seed Payroll Data
 * Creates payroll runs and entries for demo employees
 */

import { Timestamp } from 'firebase-admin/firestore';
import { getDb } from './db';
import {
  DEMO_ORG_ID,
  DEMO_USERS,
  daysAgo,
  generateId,
  randomInt,
  toTimestamp,
  logSection,
  logProgress,
  logSuccess,
  executeBatchWrites,
} from './utils';

const db = getDb();

// Employees with payroll info
const PAYROLL_EMPLOYEES = [
  {
    id: DEMO_USERS.foreman.uid,
    name: DEMO_USERS.foreman.displayName,
    type: 'FOREMAN',
    hourlyRate: 45,
  },
  {
    id: DEMO_USERS.fieldWorker1.uid,
    name: DEMO_USERS.fieldWorker1.displayName,
    type: 'FIELD',
    hourlyRate: 32,
  },
  {
    id: DEMO_USERS.fieldWorker2.uid,
    name: DEMO_USERS.fieldWorker2.displayName,
    type: 'FIELD',
    hourlyRate: 35,
  },
  {
    id: DEMO_USERS.fieldWorker3.uid,
    name: DEMO_USERS.fieldWorker3.displayName,
    type: 'FIELD',
    hourlyRate: 30,
  },
];

// Helper to get pay period dates (bi-weekly)
function getPayPeriod(weeksAgo: number): { startDate: Date; endDate: Date; payDate: Date } {
  const endDate = daysAgo(weeksAgo * 7);
  const startDate = daysAgo((weeksAgo * 7) + 13);
  const payDate = daysAgo((weeksAgo * 7) - 5); // Pay 5 days after period ends

  return { startDate, endDate, payDate };
}

// Create payroll entry for an employee
function createPayrollEntry(
  employee: typeof PAYROLL_EMPLOYEES[0],
  payrollRunId: string,
  periodStart: Date,
  periodEnd: Date
): any {
  // Random hours with some overtime
  const regularHours = 80 - randomInt(0, 8); // 72-80 regular hours
  const overtimeHours = randomInt(0, 12); // 0-12 OT hours
  const ptoHours = randomInt(0, 8); // Occasional PTO

  const regularPay = regularHours * employee.hourlyRate;
  const overtimePay = overtimeHours * employee.hourlyRate * 1.5;
  const ptoPay = ptoHours * employee.hourlyRate;

  const grossPay = regularPay + overtimePay + ptoPay;

  // Deductions (simplified)
  const federalTax = grossPay * 0.12;
  const stateTax = grossPay * 0.0463; // Colorado flat rate
  const socialSecurity = grossPay * 0.062;
  const medicare = grossPay * 0.0145;
  const totalDeductions = federalTax + stateTax + socialSecurity + medicare;

  const netPay = grossPay - totalDeductions;

  return {
    id: generateId('pe'),
    payrollRunId,
    employeeId: employee.id,
    employeeName: employee.name,
    employeeType: employee.type,

    // Hours
    regularHours,
    overtimeHours,
    doubleTimeHours: 0,
    ptoHours,
    sickHours: 0,
    holidayHours: 0,

    // Rates
    regularRate: employee.hourlyRate,
    overtimeRate: 1.5,
    doubleTimeRate: 2.0,

    // Earnings
    regularPay: Math.round(regularPay * 100) / 100,
    overtimePay: Math.round(overtimePay * 100) / 100,
    doubleTimePay: 0,
    ptoPay: Math.round(ptoPay * 100) / 100,
    sickPay: 0,
    holidayPay: 0,
    bonuses: 0,
    commissions: 0,
    reimbursements: 0,
    grossPay: Math.round(grossPay * 100) / 100,

    // Deductions
    federalTax: Math.round(federalTax * 100) / 100,
    stateTax: Math.round(stateTax * 100) / 100,
    localTax: 0,
    socialSecurity: Math.round(socialSecurity * 100) / 100,
    medicare: Math.round(medicare * 100) / 100,
    healthInsurance: 0,
    retirement401k: 0,
    otherDeductions: 0,
    totalDeductions: Math.round(totalDeductions * 100) / 100,

    // Net
    netPay: Math.round(netPay * 100) / 100,

    // Adjustments
    adjustments: [],

    isDemoData: true,
  };
}

async function seedPayroll(): Promise<number> {
  logSection('Seeding Payroll Data');

  const payrollRunsRef = db.collection('organizations').doc(DEMO_ORG_ID).collection('payrollRuns');
  const payrollRuns: any[] = [];

  // Create payroll runs for the past 6 pay periods (12 weeks)
  for (let periodNum = 0; periodNum < 6; periodNum++) {
    const weeksAgo = periodNum * 2; // Bi-weekly
    const { startDate, endDate, payDate } = getPayPeriod(weeksAgo);
    const runNumber = 2026 * 100 + (6 - periodNum); // e.g., 202606, 202605, etc.

    const payrollRunId = generateId('pr');

    // Create entries for each employee
    const entries = PAYROLL_EMPLOYEES.map((emp) =>
      createPayrollEntry(emp, payrollRunId, startDate, endDate)
    );

    // Calculate totals
    const totalRegularHours = entries.reduce((sum, e) => sum + e.regularHours, 0);
    const totalOvertimeHours = entries.reduce((sum, e) => sum + e.overtimeHours, 0);
    const totalGrossPay = entries.reduce((sum, e) => sum + e.grossPay, 0);
    const totalDeductions = entries.reduce((sum, e) => sum + e.totalDeductions, 0);
    const totalNetPay = entries.reduce((sum, e) => sum + e.netPay, 0);

    // Determine status based on age
    let status: string;
    if (periodNum === 0) {
      status = 'pending_approval'; // Current period
    } else if (periodNum === 1) {
      status = 'approved'; // Ready to process
    } else {
      status = 'completed'; // Historical
    }

    const payrollRun = {
      id: payrollRunId,
      orgId: DEMO_ORG_ID,
      runNumber,

      // Pay period
      payPeriod: {
        id: generateId('pp'),
        type: 'bi_weekly',
        startDate,
        endDate,
        payDate,
        label: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
      },

      // Status
      status,

      // Entries
      entries,
      employeeCount: entries.length,

      // Totals
      totalRegularHours,
      totalOvertimeHours,
      totalGrossPay: Math.round(totalGrossPay * 100) / 100,
      totalDeductions: Math.round(totalDeductions * 100) / 100,
      totalNetPay: Math.round(totalNetPay * 100) / 100,

      // Approval workflow
      createdBy: DEMO_USERS.admin.uid,
      createdByName: DEMO_USERS.admin.displayName,
      approvedBy: status !== 'pending_approval' ? DEMO_USERS.owner.uid : null,
      approvedByName: status !== 'pending_approval' ? DEMO_USERS.owner.displayName : null,
      approvedAt: status !== 'pending_approval' ? daysAgo(weeksAgo * 7 - 3) : null,

      // Processing
      processedAt: status === 'completed' ? daysAgo(weeksAgo * 7 - 4) : null,
      processedBy: status === 'completed' ? DEMO_USERS.owner.uid : null,

      // Timestamps
      createdAt: daysAgo(weeksAgo * 7 + 1),
      isDemoData: true,
    };

    payrollRuns.push(payrollRun);
    logProgress(`Created payroll run ${runNumber}: ${status}`);
  }

  await executeBatchWrites(
    db,
    payrollRuns,
    (batch, run) => {
      const ref = payrollRunsRef.doc(run.id);
      batch.set(ref, {
        ...run,
        payPeriod: {
          ...run.payPeriod,
          startDate: toTimestamp(run.payPeriod.startDate),
          endDate: toTimestamp(run.payPeriod.endDate),
          payDate: toTimestamp(run.payPeriod.payDate),
        },
        approvedAt: run.approvedAt ? toTimestamp(run.approvedAt) : null,
        processedAt: run.processedAt ? toTimestamp(run.processedAt) : null,
        createdAt: toTimestamp(run.createdAt),
        updatedAt: Timestamp.now(),
      });
    },
    'Payroll Runs'
  );

  logSuccess(`Created ${payrollRuns.length} payroll runs with ${payrollRuns.length * PAYROLL_EMPLOYEES.length} entries`);
  return payrollRuns.length;
}

export { seedPayroll };

// Run if executed directly
if (require.main === module) {
  seedPayroll()
    .then((count) => {
      console.log(`\n✅ Created ${count} payroll runs`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error seeding payroll:', error);
      process.exit(1);
    });
}
