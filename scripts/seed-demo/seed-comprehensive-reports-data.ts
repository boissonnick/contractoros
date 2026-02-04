/**
 * Comprehensive Reports Demo Data for ContractorOS
 *
 * Creates rich demo data specifically for reports:
 * 1. Historical time entries (6 months) with detailed labor costs
 * 2. Task completion data for productivity reports
 * 3. Budget vs actual tracking data
 * 4. Diverse expense categories
 * 5. Enhanced project financials
 *
 * This script supplements the existing seed scripts with data
 * optimized for report visualizations and trend analysis.
 */

import { Timestamp } from 'firebase-admin/firestore';
import {
  DEMO_ORG_ID,
  DEMO_USERS,
  daysAgo,
  monthsAgo,
  generateId,
  randomAmount,
  randomInt,
  randomItem,
  toTimestamp,
  logSection,
  logProgress,
  logSuccess,
  executeBatchWrites,
  randomDateBetween,
} from './utils';

// ============================================
// Constants
// ============================================

// Projects with budget data for P&L reports
const PROJECTS_WITH_BUDGETS = [
  {
    id: 'demo-proj-smith-kitchen',
    name: 'Smith Kitchen Remodel',
    budget: 45000,
    startMonthsAgo: 9,
    endMonthsAgo: 8,
    status: 'completed',
    category: 'Residential Remodel',
    laborBudget: 15000,
    materialBudget: 22000,
    subBudget: 8000,
  },
  {
    id: 'demo-proj-wilson-fence',
    name: 'Wilson Fence Installation',
    budget: 8500,
    startMonthsAgo: 6,
    endMonthsAgo: 5.8,
    status: 'completed',
    category: 'Residential New',
    laborBudget: 3500,
    materialBudget: 4000,
    subBudget: 1000,
  },
  {
    id: 'demo-proj-mainst-retail',
    name: 'Main St. Retail Storefront',
    budget: 125000,
    startMonthsAgo: 7,
    endMonthsAgo: 4,
    status: 'completed',
    category: 'Commercial TI',
    laborBudget: 35000,
    materialBudget: 50000,
    subBudget: 40000,
  },
  {
    id: 'demo-proj-garcia-bath',
    name: 'Garcia Master Bath',
    budget: 35000,
    startMonthsAgo: 3,
    endMonthsAgo: 2,
    status: 'completed',
    category: 'Residential Remodel',
    laborBudget: 12000,
    materialBudget: 16000,
    subBudget: 7000,
  },
  {
    id: 'demo-proj-cafe-ti',
    name: 'Downtown Cafe TI',
    budget: 65000,
    startMonthsAgo: 2.5,
    endMonthsAgo: 1,
    status: 'completed',
    category: 'Commercial TI',
    laborBudget: 18000,
    materialBudget: 28000,
    subBudget: 19000,
  },
  {
    id: 'demo-proj-thompson-deck',
    name: 'Thompson Deck Build',
    budget: 22000,
    startMonthsAgo: 0.5,
    endMonthsAgo: 0,
    status: 'active',
    category: 'Residential New',
    laborBudget: 8000,
    materialBudget: 11000,
    subBudget: 3000,
    percentComplete: 40,
  },
  {
    id: 'demo-proj-office-park',
    name: 'Office Park Suite 200',
    budget: 95000,
    startMonthsAgo: 1,
    endMonthsAgo: 0,
    status: 'active',
    category: 'Commercial TI',
    laborBudget: 28000,
    materialBudget: 40000,
    subBudget: 27000,
    percentComplete: 25,
  },
  {
    id: 'demo-proj-garcia-basement',
    name: 'Garcia Basement Finish',
    budget: 55000,
    startMonthsAgo: 0.7,
    endMonthsAgo: 0,
    status: 'active',
    category: 'Residential Remodel',
    laborBudget: 18000,
    materialBudget: 25000,
    subBudget: 12000,
    percentComplete: 35,
  },
  {
    id: 'demo-proj-brown-kitchen',
    name: 'Brown Kitchen Update',
    budget: 28000,
    startMonthsAgo: 0.25,
    endMonthsAgo: 0,
    status: 'active',
    category: 'Residential Remodel',
    laborBudget: 9000,
    materialBudget: 14000,
    subBudget: 5000,
    percentComplete: 15,
  },
];

// Team members with hourly rates
const TEAM_WITH_RATES = [
  { ...DEMO_USERS.foreman, hourlyRate: 45 },
  { ...DEMO_USERS.fieldWorker1, hourlyRate: 32 },
  { ...DEMO_USERS.fieldWorker2, hourlyRate: 35 },
  { ...DEMO_USERS.fieldWorker3, hourlyRate: 30 },
];

// Task templates for productivity tracking
const TASK_TEMPLATES = [
  { title: 'Demo existing structure', hours: 8, category: 'demolition' },
  { title: 'Install framing', hours: 16, category: 'framing' },
  { title: 'Run electrical rough-in', hours: 12, category: 'electrical' },
  { title: 'Install plumbing rough-in', hours: 10, category: 'plumbing' },
  { title: 'Hang drywall', hours: 16, category: 'drywall' },
  { title: 'Tape and mud', hours: 8, category: 'drywall' },
  { title: 'Install flooring', hours: 12, category: 'flooring' },
  { title: 'Paint walls', hours: 10, category: 'paint' },
  { title: 'Install trim', hours: 8, category: 'trim' },
  { title: 'Install fixtures', hours: 6, category: 'finish' },
  { title: 'Final inspection prep', hours: 4, category: 'inspection' },
  { title: 'Punch list items', hours: 6, category: 'punch' },
];

// Expense categories for diverse expense data
const EXPENSE_CATEGORIES = [
  { category: 'materials', vendors: ['Home Depot', 'Lowes', '84 Lumber', 'ABC Supply', 'ProSource'] },
  { category: 'tools', vendors: ['Milwaukee Tool', 'DeWalt', 'Grainger', 'Northern Tool'] },
  { category: 'equipment_rental', vendors: ['United Rentals', 'Sunbelt Rentals', 'Herc Rentals'] },
  { category: 'subcontractor', vendors: ['Rocky Mountain Electric', 'Front Range Plumbing', 'Mile High HVAC', 'Colorado Tile Co'] },
  { category: 'permits', vendors: ['City of Denver', 'City of Lakewood', 'City of Aurora', 'City of Englewood'] },
  { category: 'fuel', vendors: ['Shell', 'Conoco', 'Sinclair', 'Costco Gas'] },
  { category: 'vehicle', vendors: ['Front Range Auto', 'Brakes Plus', 'Discount Tire'] },
  { category: 'office', vendors: ['Office Depot', 'Staples', 'Amazon'] },
  { category: 'insurance', vendors: ['State Farm Business', 'Travelers', 'Hartford'] },
  { category: 'travel', vendors: ['Various', 'Enterprise', 'Hilton'] },
];

// ============================================
// Helper Functions
// ============================================

function getWorkDaysInRange(startDate: Date, endDate: Date): Date[] {
  const days: Date[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    // Weekdays + occasional Saturday (20% chance)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      days.push(new Date(current));
    } else if (dayOfWeek === 6 && Math.random() < 0.2) {
      days.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }

  return days;
}

function createTimeEntry(params: {
  userId: string;
  userName: string;
  hourlyRate: number;
  projectId: string;
  projectName: string;
  taskName: string;
  date: Date;
  hoursWorked: number;
}) {
  const { userId, userName, hourlyRate, projectId, projectName, taskName, date, hoursWorked } = params;

  const clockIn = new Date(date);
  clockIn.setHours(7 + randomInt(0, 1), randomInt(0, 3) * 15, 0, 0);

  const clockOut = new Date(clockIn);
  clockOut.setMinutes(clockOut.getMinutes() + hoursWorked * 60);

  const totalMinutes = (hoursWorked * 60) - 30; // Subtract 30 min lunch
  const laborCost = (totalMinutes / 60) * hourlyRate;

  return {
    id: generateId('rpt-time'),
    orgId: DEMO_ORG_ID,
    userId,
    userName,
    userRole: 'EMPLOYEE',
    projectId,
    projectName,
    taskName,
    type: 'clock',
    status: 'approved',
    clockIn,
    clockOut,
    totalMinutes,
    billableMinutes: totalMinutes,
    breaks: [{
      startTime: new Date(clockIn.getTime() + 4 * 60 * 60 * 1000),
      endTime: new Date(clockIn.getTime() + 4.5 * 60 * 60 * 1000),
      type: 'lunch',
      paid: false,
    }],
    totalBreakMinutes: 30,
    hourlyRate,
    laborCost,
    overtimeRate: hourlyRate * 1.5,
    isOvertime: hoursWorked > 8,
    submittedAt: clockOut,
    approvedBy: DEMO_USERS.owner.uid,
    approvedByName: DEMO_USERS.owner.displayName,
    approvedAt: new Date(clockOut.getTime() + 86400000),
    createdAt: clockIn,
    updatedAt: clockOut,
    isDemoData: true,
    isReportData: true,
  };
}

// ============================================
// Seed Functions
// ============================================

/**
 * Seed comprehensive time entries for labor cost reports
 * Creates 6 months of detailed time entries
 */
export async function seedLaborTimeEntries(db: FirebaseFirestore.Firestore): Promise<number> {
  logSection('Seeding Labor Time Entries (6 months)');

  const timeEntries: ReturnType<typeof createTimeEntry>[] = [];

  for (const project of PROJECTS_WITH_BUDGETS) {
    const startDate = monthsAgo(project.startMonthsAgo);
    const endDate = project.endMonthsAgo > 0 ? monthsAgo(project.endMonthsAgo) : new Date();
    const workDays = getWorkDaysInRange(startDate, endDate);

    // Limit work days to reasonable amount per project
    const daysToProcess = workDays.slice(0, Math.min(workDays.length, 60));

    for (const workDay of daysToProcess) {
      // 2-4 workers per day
      const workersToday = TEAM_WITH_RATES
        .sort(() => Math.random() - 0.5)
        .slice(0, randomInt(2, 4));

      for (const worker of workersToday) {
        const hoursWorked = randomInt(6, 10);
        const task = randomItem(TASK_TEMPLATES);

        timeEntries.push(createTimeEntry({
          userId: worker.uid,
          userName: worker.displayName,
          hourlyRate: worker.hourlyRate,
          projectId: project.id,
          projectName: project.name,
          taskName: task.title,
          date: workDay,
          hoursWorked,
        }));
      }
    }

    logProgress(`Generated ${daysToProcess.length} work days for ${project.name}`);
  }

  // Write to Firestore
  await executeBatchWrites(
    db,
    timeEntries,
    (batch, entry) => {
      const ref = db.collection('organizations').doc(DEMO_ORG_ID).collection('timeEntries').doc(entry.id);
      batch.set(ref, {
        ...entry,
        clockIn: toTimestamp(entry.clockIn),
        clockOut: toTimestamp(entry.clockOut),
        submittedAt: toTimestamp(entry.submittedAt),
        approvedAt: toTimestamp(entry.approvedAt),
        createdAt: toTimestamp(entry.createdAt),
        updatedAt: toTimestamp(entry.updatedAt),
        breaks: entry.breaks.map(b => ({
          ...b,
          startTime: toTimestamp(b.startTime),
          endTime: toTimestamp(b.endTime),
        })),
      });
    },
    'Labor Time Entries'
  );

  logSuccess(`Created ${timeEntries.length} time entries for labor reports`);
  return timeEntries.length;
}

/**
 * Seed task completion data for productivity reports
 */
export async function seedProductivityTasks(db: FirebaseFirestore.Firestore): Promise<number> {
  logSection('Seeding Productivity Tasks (6 months)');

  interface Task {
    id: string;
    orgId: string;
    projectId: string;
    projectName: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    assignedTo: string[];
    assignedToNames: string[];
    estimatedHours: number;
    actualHours: number | null;
    dueDate: Date;
    completedAt: Date | null;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    isDemoData: boolean;
    isReportData: boolean;
  }

  const tasks: Task[] = [];
  let taskCounter = 5000;

  for (const project of PROJECTS_WITH_BUDGETS) {
    const isCompleted = project.status === 'completed';
    const percentComplete = (project as { percentComplete?: number }).percentComplete || (isCompleted ? 100 : 50);

    // Generate 12-20 tasks per project
    const taskCount = randomInt(12, 20);

    for (let i = 0; i < taskCount; i++) {
      const template = randomItem(TASK_TEMPLATES);
      const assignee = randomItem(TEAM_WITH_RATES);

      // Determine status based on project completion
      let status: string;
      let completedAt: Date | null = null;
      let actualHours: number | null = null;

      const taskProgress = (i / taskCount) * 100;

      if (isCompleted || taskProgress < percentComplete - 10) {
        status = 'completed';
        completedAt = randomDateBetween(
          monthsAgo(project.startMonthsAgo),
          project.endMonthsAgo > 0 ? monthsAgo(project.endMonthsAgo) : new Date()
        );
        actualHours = template.hours + randomInt(-2, 3);
      } else if (taskProgress < percentComplete) {
        status = 'in_progress';
      } else if (taskProgress < percentComplete + 15) {
        status = 'assigned';
      } else {
        status = 'pending';
      }

      const dueDate = randomDateBetween(
        monthsAgo(project.startMonthsAgo),
        project.endMonthsAgo > 0 ? monthsAgo(project.endMonthsAgo - 0.5) : daysAgo(-14)
      );

      tasks.push({
        id: `rpt-task-${taskCounter++}`,
        orgId: DEMO_ORG_ID,
        projectId: project.id,
        projectName: project.name,
        title: `${template.title} - ${project.name.split(' ')[0]}`,
        description: `${template.title} work for ${project.name}`,
        status,
        priority: randomItem(['low', 'medium', 'high', 'medium', 'medium']),
        assignedTo: status !== 'pending' ? [assignee.uid] : [],
        assignedToNames: status !== 'pending' ? [assignee.displayName] : [],
        estimatedHours: template.hours,
        actualHours,
        dueDate,
        completedAt,
        createdBy: DEMO_USERS.owner.uid,
        createdAt: monthsAgo(project.startMonthsAgo),
        updatedAt: completedAt || new Date(),
        isDemoData: true,
        isReportData: true,
      });
    }

    logProgress(`Generated ${taskCount} tasks for ${project.name}`);
  }

  // Write to Firestore
  await executeBatchWrites(
    db,
    tasks,
    (batch, task) => {
      const ref = db.collection('tasks').doc(task.id);
      batch.set(ref, {
        ...task,
        dueDate: toTimestamp(task.dueDate),
        completedAt: task.completedAt ? toTimestamp(task.completedAt) : null,
        createdAt: toTimestamp(task.createdAt),
        updatedAt: toTimestamp(task.updatedAt),
      });
    },
    'Productivity Tasks'
  );

  logSuccess(`Created ${tasks.length} tasks for productivity reports`);
  return tasks.length;
}

/**
 * Seed diverse expense data for financial reports
 */
export async function seedDiverseExpenses(db: FirebaseFirestore.Firestore): Promise<number> {
  logSection('Seeding Diverse Expenses (6 months)');

  interface Expense {
    id: string;
    orgId: string;
    userId: string;
    userName: string;
    description: string;
    amount: number;
    category: string;
    date: string;
    projectId: string | null;
    projectName: string | null;
    vendorName: string;
    paymentMethod: string;
    reimbursable: boolean;
    billable: boolean;
    receipts: Array<{
      id: string;
      url: string;
      fileName: string;
      fileSize: number;
      mimeType: string;
      uploadedAt: Date;
    }>;
    status: string;
    approvedBy: string | null;
    approvedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    isDemoData: boolean;
    isReportData: boolean;
  }

  const expenses: Expense[] = [];

  // Project-specific expenses
  for (const project of PROJECTS_WITH_BUDGETS) {
    const isCompleted = project.status === 'completed';
    const percentComplete = (project as { percentComplete?: number }).percentComplete || (isCompleted ? 100 : 50);

    // Calculate target spend based on budget and completion
    const targetMaterialSpend = (project.materialBudget * percentComplete / 100) * randomAmount(0.85, 1.15);
    const targetSubSpend = (project.subBudget * percentComplete / 100) * randomAmount(0.9, 1.1);

    // Material expenses (4-8 per project)
    const materialCount = randomInt(4, 8);
    const materialPerExpense = targetMaterialSpend / materialCount;

    for (let i = 0; i < materialCount; i++) {
      const catInfo = randomItem(EXPENSE_CATEGORIES.filter(c => c.category === 'materials'));
      const expenseDate = randomDateBetween(
        monthsAgo(project.startMonthsAgo),
        project.endMonthsAgo > 0 ? monthsAgo(project.endMonthsAgo) : new Date()
      );

      expenses.push({
        id: generateId('rpt-exp'),
        orgId: DEMO_ORG_ID,
        userId: randomItem(TEAM_WITH_RATES).uid,
        userName: randomItem(TEAM_WITH_RATES).displayName,
        description: `Materials for ${project.name} - Phase ${i + 1}`,
        amount: materialPerExpense * randomAmount(0.8, 1.2),
        category: 'materials',
        date: expenseDate.toISOString().split('T')[0],
        projectId: project.id,
        projectName: project.name,
        vendorName: randomItem(catInfo.vendors),
        paymentMethod: randomItem(['company_card', 'credit_card', 'check']),
        reimbursable: false,
        billable: true,
        receipts: [{
          id: generateId('rcpt'),
          url: `/receipts/rpt-${generateId('r')}.pdf`,
          fileName: `receipt-${generateId('r')}.pdf`,
          fileSize: randomInt(100000, 500000),
          mimeType: 'application/pdf',
          uploadedAt: expenseDate,
        }],
        status: 'approved',
        approvedBy: DEMO_USERS.owner.uid,
        approvedAt: expenseDate,
        createdAt: expenseDate,
        updatedAt: expenseDate,
        isDemoData: true,
        isReportData: true,
      });
    }

    // Subcontractor expenses (2-4 per project)
    const subCount = randomInt(2, 4);
    const subPerExpense = targetSubSpend / subCount;

    for (let i = 0; i < subCount; i++) {
      const catInfo = randomItem(EXPENSE_CATEGORIES.filter(c => c.category === 'subcontractor'));
      const expenseDate = randomDateBetween(
        monthsAgo(project.startMonthsAgo),
        project.endMonthsAgo > 0 ? monthsAgo(project.endMonthsAgo) : new Date()
      );

      expenses.push({
        id: generateId('rpt-exp'),
        orgId: DEMO_ORG_ID,
        userId: DEMO_USERS.owner.uid,
        userName: DEMO_USERS.owner.displayName,
        description: `${randomItem(catInfo.vendors)} - ${project.name}`,
        amount: subPerExpense * randomAmount(0.85, 1.15),
        category: 'subcontractor',
        date: expenseDate.toISOString().split('T')[0],
        projectId: project.id,
        projectName: project.name,
        vendorName: randomItem(catInfo.vendors),
        paymentMethod: 'check',
        reimbursable: false,
        billable: true,
        receipts: [{
          id: generateId('rcpt'),
          url: `/receipts/rpt-${generateId('r')}.pdf`,
          fileName: `invoice-${generateId('r')}.pdf`,
          fileSize: randomInt(100000, 500000),
          mimeType: 'application/pdf',
          uploadedAt: expenseDate,
        }],
        status: 'approved',
        approvedBy: DEMO_USERS.owner.uid,
        approvedAt: expenseDate,
        createdAt: expenseDate,
        updatedAt: expenseDate,
        isDemoData: true,
        isReportData: true,
      });
    }

    logProgress(`Generated expenses for ${project.name}`);
  }

  // General overhead expenses (spread across 6 months)
  for (let monthBack = 0; monthBack < 6; monthBack++) {
    const monthDate = monthsAgo(monthBack);

    // Equipment rentals (1-2 per month)
    for (let i = 0; i < randomInt(1, 2); i++) {
      const catInfo = randomItem(EXPENSE_CATEGORIES.filter(c => c.category === 'equipment_rental'));
      const expenseDate = randomDateBetween(
        new Date(monthDate.getFullYear(), monthDate.getMonth(), 1),
        new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
      );

      expenses.push({
        id: generateId('rpt-exp'),
        orgId: DEMO_ORG_ID,
        userId: DEMO_USERS.foreman.uid,
        userName: DEMO_USERS.foreman.displayName,
        description: randomItem(['Scissor lift rental', 'Dumpster rental', 'Concrete mixer rental', 'Generator rental']),
        amount: randomAmount(350, 1500),
        category: 'equipment_rental',
        date: expenseDate.toISOString().split('T')[0],
        projectId: null,
        projectName: null,
        vendorName: randomItem(catInfo.vendors),
        paymentMethod: 'company_card',
        reimbursable: false,
        billable: false,
        receipts: [{
          id: generateId('rcpt'),
          url: `/receipts/rpt-${generateId('r')}.pdf`,
          fileName: `rental-${generateId('r')}.pdf`,
          fileSize: randomInt(100000, 500000),
          mimeType: 'application/pdf',
          uploadedAt: expenseDate,
        }],
        status: 'approved',
        approvedBy: DEMO_USERS.owner.uid,
        approvedAt: expenseDate,
        createdAt: expenseDate,
        updatedAt: expenseDate,
        isDemoData: true,
        isReportData: true,
      });
    }

    // Fuel expenses (4-6 per month)
    for (let i = 0; i < randomInt(4, 6); i++) {
      const catInfo = randomItem(EXPENSE_CATEGORIES.filter(c => c.category === 'fuel'));
      const worker = randomItem(TEAM_WITH_RATES);
      const expenseDate = randomDateBetween(
        new Date(monthDate.getFullYear(), monthDate.getMonth(), 1),
        new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
      );

      expenses.push({
        id: generateId('rpt-exp'),
        orgId: DEMO_ORG_ID,
        userId: worker.uid,
        userName: worker.displayName,
        description: 'Fuel for work truck',
        amount: randomAmount(65, 180),
        category: 'fuel',
        date: expenseDate.toISOString().split('T')[0],
        projectId: null,
        projectName: null,
        vendorName: randomItem(catInfo.vendors),
        paymentMethod: 'company_card',
        reimbursable: false,
        billable: false,
        receipts: [{
          id: generateId('rcpt'),
          url: `/receipts/rpt-${generateId('r')}.pdf`,
          fileName: `fuel-${generateId('r')}.pdf`,
          fileSize: randomInt(50000, 150000),
          mimeType: 'application/pdf',
          uploadedAt: expenseDate,
        }],
        status: 'approved',
        approvedBy: DEMO_USERS.owner.uid,
        approvedAt: expenseDate,
        createdAt: expenseDate,
        updatedAt: expenseDate,
        isDemoData: true,
        isReportData: true,
      });
    }

    // Office supplies (1 per month)
    {
      const catInfo = randomItem(EXPENSE_CATEGORIES.filter(c => c.category === 'office'));
      const expenseDate = randomDateBetween(
        new Date(monthDate.getFullYear(), monthDate.getMonth(), 1),
        new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
      );

      expenses.push({
        id: generateId('rpt-exp'),
        orgId: DEMO_ORG_ID,
        userId: DEMO_USERS.admin.uid,
        userName: DEMO_USERS.admin.displayName,
        description: randomItem(['Office supplies', 'Printer ink', 'Paper and envelopes', 'Printer paper']),
        amount: randomAmount(45, 180),
        category: 'office',
        date: expenseDate.toISOString().split('T')[0],
        projectId: null,
        projectName: null,
        vendorName: randomItem(catInfo.vendors),
        paymentMethod: 'company_card',
        reimbursable: false,
        billable: false,
        receipts: [{
          id: generateId('rcpt'),
          url: `/receipts/rpt-${generateId('r')}.pdf`,
          fileName: `office-${generateId('r')}.pdf`,
          fileSize: randomInt(50000, 150000),
          mimeType: 'application/pdf',
          uploadedAt: expenseDate,
        }],
        status: 'approved',
        approvedBy: DEMO_USERS.owner.uid,
        approvedAt: expenseDate,
        createdAt: expenseDate,
        updatedAt: expenseDate,
        isDemoData: true,
        isReportData: true,
      });
    }

    // Tools (occasional)
    if (Math.random() > 0.6) {
      const catInfo = randomItem(EXPENSE_CATEGORIES.filter(c => c.category === 'tools'));
      const expenseDate = randomDateBetween(
        new Date(monthDate.getFullYear(), monthDate.getMonth(), 1),
        new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
      );

      expenses.push({
        id: generateId('rpt-exp'),
        orgId: DEMO_ORG_ID,
        userId: DEMO_USERS.foreman.uid,
        userName: DEMO_USERS.foreman.displayName,
        description: randomItem(['Drill bits', 'Saw blades', 'Hand tools', 'Safety equipment', 'Measuring tools']),
        amount: randomAmount(85, 450),
        category: 'tools',
        date: expenseDate.toISOString().split('T')[0],
        projectId: null,
        projectName: null,
        vendorName: randomItem(catInfo.vendors),
        paymentMethod: 'company_card',
        reimbursable: false,
        billable: false,
        receipts: [{
          id: generateId('rcpt'),
          url: `/receipts/rpt-${generateId('r')}.pdf`,
          fileName: `tools-${generateId('r')}.pdf`,
          fileSize: randomInt(50000, 150000),
          mimeType: 'application/pdf',
          uploadedAt: expenseDate,
        }],
        status: 'approved',
        approvedBy: DEMO_USERS.owner.uid,
        approvedAt: expenseDate,
        createdAt: expenseDate,
        updatedAt: expenseDate,
        isDemoData: true,
        isReportData: true,
      });
    }
  }

  // Quarterly insurance
  for (let quarter = 0; quarter < 2; quarter++) {
    const expenseDate = monthsAgo(quarter * 3 + 1);

    expenses.push({
      id: generateId('rpt-exp'),
      orgId: DEMO_ORG_ID,
      userId: DEMO_USERS.owner.uid,
      userName: DEMO_USERS.owner.displayName,
      description: 'Quarterly liability insurance premium',
      amount: 2450,
      category: 'insurance',
      date: expenseDate.toISOString().split('T')[0],
      projectId: null,
      projectName: null,
      vendorName: 'State Farm Business',
      paymentMethod: 'check',
      reimbursable: false,
      billable: false,
      receipts: [{
        id: generateId('rcpt'),
        url: `/receipts/rpt-${generateId('r')}.pdf`,
        fileName: `insurance-${generateId('r')}.pdf`,
        fileSize: randomInt(100000, 300000),
        mimeType: 'application/pdf',
        uploadedAt: expenseDate,
      }],
      status: 'approved',
      approvedBy: DEMO_USERS.owner.uid,
      approvedAt: expenseDate,
      createdAt: expenseDate,
      updatedAt: expenseDate,
      isDemoData: true,
      isReportData: true,
    });
  }

  // Write to Firestore
  await executeBatchWrites(
    db,
    expenses,
    (batch, expense) => {
      const ref = db.collection('organizations').doc(DEMO_ORG_ID).collection('expenses').doc(expense.id);
      batch.set(ref, {
        ...expense,
        approvedAt: expense.approvedAt ? toTimestamp(expense.approvedAt) : null,
        createdAt: toTimestamp(expense.createdAt),
        updatedAt: toTimestamp(expense.updatedAt),
        receipts: expense.receipts.map(r => ({
          ...r,
          uploadedAt: toTimestamp(r.uploadedAt),
        })),
      });
    },
    'Diverse Expenses'
  );

  logSuccess(`Created ${expenses.length} diverse expenses for financial reports`);
  return expenses.length;
}

/**
 * Update project budgets and financials
 * NOTE: Projects are stored in top-level 'projects' collection with orgId field
 */
export async function updateProjectFinancials(db: FirebaseFirestore.Firestore): Promise<number> {
  logSection('Updating Project Financials');

  let updatedCount = 0;

  for (const project of PROJECTS_WITH_BUDGETS) {
    // Projects are in top-level 'projects' collection, NOT under organizations/{orgId}
    const projectRef = db.collection('projects').doc(project.id);

    const projectDoc = await projectRef.get();
    if (!projectDoc.exists) {
      logProgress(`Project ${project.id} not found, skipping`);
      continue;
    }

    // Calculate spent amounts based on completion
    const isCompleted = project.status === 'completed';
    const percentComplete = (project as { percentComplete?: number }).percentComplete || (isCompleted ? 100 : 50);

    const laborSpent = Math.round(project.laborBudget * (percentComplete / 100) * randomAmount(0.9, 1.1));
    const materialSpent = Math.round(project.materialBudget * (percentComplete / 100) * randomAmount(0.85, 1.15));
    const subSpent = Math.round(project.subBudget * (percentComplete / 100) * randomAmount(0.9, 1.1));
    const totalSpent = laborSpent + materialSpent + subSpent;

    await projectRef.update({
      budget: project.budget,
      laborBudget: project.laborBudget,
      materialBudget: project.materialBudget,
      subcontractorBudget: project.subBudget,
      laborSpent,
      materialSpent,
      subcontractorSpent: subSpent,
      totalSpent,
      percentComplete,
      category: project.category,
      updatedAt: Timestamp.now(),
    });

    updatedCount++;
    logProgress(`Updated financials for ${project.name}: Budget $${project.budget}, Spent $${totalSpent}`);
  }

  logSuccess(`Updated ${updatedCount} project financials`);
  return updatedCount;
}

/**
 * Create benchmarking comparison data
 */
export async function seedBenchmarkingData(db: FirebaseFirestore.Firestore): Promise<number> {
  logSection('Seeding Benchmarking Data');

  interface BenchmarkData {
    id: string;
    orgId: string;
    category: string;
    projectCount: number;
    avgBudget: number;
    avgDuration: number;
    avgLaborPercent: number;
    avgMaterialPercent: number;
    avgProfitMargin: number;
    period: string;
    createdAt: Date;
    isDemoData: boolean;
  }

  const benchmarks: BenchmarkData[] = [];

  // Group projects by category
  const categories = [...new Set(PROJECTS_WITH_BUDGETS.map(p => p.category))];

  for (const category of categories) {
    const categoryProjects = PROJECTS_WITH_BUDGETS.filter(p => p.category === category);

    const avgBudget = categoryProjects.reduce((sum, p) => sum + p.budget, 0) / categoryProjects.length;
    const avgDuration = categoryProjects.reduce((sum, p) => sum + (p.startMonthsAgo - (p.endMonthsAgo || 0)) * 30, 0) / categoryProjects.length;
    const avgLaborPercent = categoryProjects.reduce((sum, p) => sum + (p.laborBudget / p.budget) * 100, 0) / categoryProjects.length;
    const avgMaterialPercent = categoryProjects.reduce((sum, p) => sum + (p.materialBudget / p.budget) * 100, 0) / categoryProjects.length;

    benchmarks.push({
      id: generateId('bench'),
      orgId: DEMO_ORG_ID,
      category,
      projectCount: categoryProjects.length,
      avgBudget: Math.round(avgBudget),
      avgDuration: Math.round(avgDuration),
      avgLaborPercent: Math.round(avgLaborPercent * 10) / 10,
      avgMaterialPercent: Math.round(avgMaterialPercent * 10) / 10,
      avgProfitMargin: randomAmount(12, 22),
      period: 'Last 6 Months',
      createdAt: new Date(),
      isDemoData: true,
    });
  }

  // Write to Firestore
  await executeBatchWrites(
    db,
    benchmarks,
    (batch, benchmark) => {
      const ref = db.collection('organizations').doc(DEMO_ORG_ID).collection('benchmarks').doc(benchmark.id);
      batch.set(ref, {
        ...benchmark,
        createdAt: toTimestamp(benchmark.createdAt),
      });
    },
    'Benchmarking Data'
  );

  logSuccess(`Created ${benchmarks.length} benchmark entries`);
  return benchmarks.length;
}

// ============================================
// Main Export
// ============================================

export async function seedComprehensiveReportsData(db: FirebaseFirestore.Firestore): Promise<{
  timeEntries: number;
  tasks: number;
  expenses: number;
  projectUpdates: number;
  benchmarks: number;
}> {
  logSection('Starting Comprehensive Reports Data Seeding');

  const timeEntries = await seedLaborTimeEntries(db);
  const tasks = await seedProductivityTasks(db);
  const expenses = await seedDiverseExpenses(db);
  const projectUpdates = await updateProjectFinancials(db);
  const benchmarks = await seedBenchmarkingData(db);

  logSection('Comprehensive Reports Data Seeding Complete');
  logSuccess(`Time Entries: ${timeEntries}`);
  logSuccess(`Tasks: ${tasks}`);
  logSuccess(`Expenses: ${expenses}`);
  logSuccess(`Project Updates: ${projectUpdates}`);
  logSuccess(`Benchmarks: ${benchmarks}`);

  return {
    timeEntries,
    tasks,
    expenses,
    projectUpdates,
    benchmarks,
  };
}

// CLI execution
if (require.main === module) {
  const { getDb } = require('./db');
  const db = getDb();

  seedComprehensiveReportsData(db)
    .then((result) => {
      console.log('\n--- Reports Data Seeding Complete! ---');
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n--- Error seeding reports data:', error);
      process.exit(1);
    });
}
