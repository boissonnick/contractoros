/**
 * Demo Time Entry Seeder for ContractorOS
 *
 * Creates 500+ time entries:
 * - Spread across 12 months
 * - All team members logging time
 * - 6-10 hour days typical
 * - Various task types: Framing, Electrical, Plumbing, Finish Work, etc.
 * - Include notes on some entries
 *
 * Patterns:
 * - Completed projects: Full time history
 * - Active projects: Time up to "today"
 * - Realistic work patterns (M-F, some Saturdays)
 */

import { Timestamp } from 'firebase-admin/firestore';
import {
  DEMO_ORG_ID,
  DEMO_USERS,
  daysAgo,
  generateId,
  randomInt,
  randomItem,
  toTimestamp,
  logSection,
  logSuccess,
  executeBatchWrites,
} from './utils';

// Type definitions
type TimeEntryType = 'clock' | 'manual' | 'imported';
type TimeEntryStatus = 'active' | 'paused' | 'completed' | 'pending_approval' | 'approved' | 'rejected';
type UserRole = 'OWNER' | 'PM' | 'EMPLOYEE' | 'CONTRACTOR' | 'SUB' | 'CLIENT';

interface TimeEntryBreak {
  startTime: Date;
  endTime: Date;
  type: 'lunch' | 'break' | 'other';
  paid: boolean;
}

interface TimeEntry {
  id: string;
  orgId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  projectId?: string;
  projectName?: string;
  taskName?: string;
  type: TimeEntryType;
  status: TimeEntryStatus;
  clockIn: Date;
  clockOut?: Date;
  totalMinutes?: number;
  billableMinutes?: number;
  breaks: TimeEntryBreak[];
  totalBreakMinutes?: number;
  hourlyRate?: number;
  overtimeRate?: number;
  isOvertime?: boolean;
  notes?: string;
  submittedAt?: Date;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  isDemoData: boolean;
}

// Demo team with their roles and hourly rates
const DEMO_TEAM = [
  { ...DEMO_USERS.owner, role: 'OWNER' as UserRole },
  { ...DEMO_USERS.pm, role: 'PM' as UserRole },
  { ...DEMO_USERS.foreman, role: 'EMPLOYEE' as UserRole },
  { ...DEMO_USERS.fieldWorker1, role: 'EMPLOYEE' as UserRole },
  { ...DEMO_USERS.fieldWorker2, role: 'EMPLOYEE' as UserRole },
  { ...DEMO_USERS.fieldWorker3, role: 'EMPLOYEE' as UserRole },
  { ...DEMO_USERS.admin, role: 'EMPLOYEE' as UserRole },
];

// Field workers for project time entries
const FIELD_WORKERS = [
  DEMO_TEAM[2], // foreman
  DEMO_TEAM[3], // fieldWorker1
  DEMO_TEAM[4], // fieldWorker2
  DEMO_TEAM[5], // fieldWorker3
];

// Demo projects with their time ranges
const DEMO_PROJECTS = [
  {
    id: 'demo-proj-smith-kitchen',
    name: 'Smith Kitchen Remodel',
    startDaysAgo: 270,
    endDaysAgo: 240,
    status: 'completed',
    tasks: ['Demo', 'Rough-In Electrical', 'Rough-In Plumbing', 'Cabinet Install', 'Countertops', 'Tile', 'Flooring', 'Paint'],
  },
  {
    id: 'demo-proj-wilson-fence',
    name: 'Wilson Fence Installation',
    startDaysAgo: 185,
    endDaysAgo: 174,
    status: 'completed',
    tasks: ['Layout', 'Post Setting', 'Rails & Pickets', 'Gate', 'Stain'],
  },
  {
    id: 'demo-proj-mainst-retail',
    name: 'Main St. Retail Storefront',
    startDaysAgo: 210,
    endDaysAgo: 120,
    status: 'completed',
    tasks: ['Demo', 'Storefront Install', 'Framing', 'Electrical', 'Plumbing', 'HVAC', 'Drywall', 'Paint', 'Flooring', 'Millwork', 'Punch List'],
  },
  {
    id: 'demo-proj-garcia-bath',
    name: 'Garcia Master Bath',
    startDaysAgo: 90,
    endDaysAgo: 58,
    status: 'completed',
    tasks: ['Demo', 'Plumbing Rough', 'Electrical Rough', 'Tile Work', 'Vanity Install', 'Fixtures', 'Final Details'],
  },
  {
    id: 'demo-proj-cafe-ti',
    name: 'Downtown Cafe TI',
    startDaysAgo: 75,
    endDaysAgo: 28,
    status: 'completed',
    tasks: ['Demo', 'Framing', 'MEP Rough', 'Drywall', 'Ceiling', 'Flooring', 'Paint', 'Final Inspection'],
  },
  {
    id: 'demo-proj-thompson-deck',
    name: 'Thompson Deck Build',
    startDaysAgo: 14,
    endDaysAgo: 0,
    status: 'active',
    tasks: ['Footings', 'Framing', 'Decking', 'Railing'],
  },
  {
    id: 'demo-proj-office-park',
    name: 'Office Park Suite 200',
    startDaysAgo: 30,
    endDaysAgo: 0,
    status: 'active',
    tasks: ['Demo', 'Framing', 'Electrical Rough', 'Data Cabling'],
  },
  {
    id: 'demo-proj-garcia-basement',
    name: 'Garcia Basement Finish',
    startDaysAgo: 21,
    endDaysAgo: 0,
    status: 'active',
    tasks: ['Egress Window', 'Framing', 'Electrical Rough', 'Plumbing Rough'],
  },
  {
    id: 'demo-proj-brown-kitchen',
    name: 'Brown Kitchen Update',
    startDaysAgo: 7,
    endDaysAgo: 0,
    status: 'active',
    tasks: ['Prep', 'Demo', 'Protection'],
  },
];

// Task notes for variety
const TASK_NOTES = [
  'Completed ahead of schedule',
  'Minor issue resolved on site',
  'Waiting for material delivery',
  'Client approved changes',
  'Coordinated with sub',
  'Weather delay - started late',
  'Extra help needed tomorrow',
  'Inspection passed',
  'Good progress today',
  undefined,
  undefined,
  undefined,
  undefined, // Many entries have no notes
];

// Helper functions
const isWeekday = (date: Date): boolean => {
  const day = date.getDay();
  return day !== 0 && day !== 6;
};

const isSaturday = (date: Date): boolean => {
  return date.getDay() === 6;
};

// Get work days in a range (M-F, with occasional Saturdays)
const getWorkDays = (startDaysAgo: number, endDaysAgo: number): Date[] => {
  const workDays: Date[] = [];
  const today = new Date();

  for (let daysBack = startDaysAgo; daysBack >= endDaysAgo; daysBack--) {
    const date = new Date(today);
    date.setDate(date.getDate() - daysBack);
    date.setHours(0, 0, 0, 0);

    if (isWeekday(date)) {
      workDays.push(date);
    } else if (isSaturday(date) && Math.random() < 0.25) {
      // 25% chance of Saturday work
      workDays.push(date);
    }
  }

  return workDays;
};

// Create clock in/out times for a work day
const createWorkTimes = (date: Date, hoursWorked: number): { clockIn: Date; clockOut: Date } => {
  // Start time between 6:00 and 8:00 AM
  const startHour = randomInt(6, 8);
  const startMinute = randomInt(0, 3) * 15; // 0, 15, 30, or 45

  const clockIn = new Date(date);
  clockIn.setHours(startHour, startMinute, 0, 0);

  const clockOut = new Date(clockIn);
  clockOut.setMinutes(clockOut.getMinutes() + hoursWorked * 60);

  return { clockIn, clockOut };
};

// Create a lunch break
const createLunchBreak = (clockIn: Date): TimeEntryBreak => {
  const breakStart = new Date(clockIn);
  // Lunch around 11:30-12:30
  breakStart.setHours(11 + (Math.random() < 0.5 ? 0 : 1), randomInt(0, 30), 0, 0);

  const breakEnd = new Date(breakStart);
  breakEnd.setMinutes(breakEnd.getMinutes() + 30); // 30 min lunch

  return {
    startTime: breakStart,
    endTime: breakEnd,
    type: 'lunch' as const,
    paid: false,
  };
};

// ============================================================================
// TIME ENTRY FACTORY
// ============================================================================

interface TimeEntryParams {
  user: typeof DEMO_TEAM[0];
  project: typeof DEMO_PROJECTS[0];
  date: Date;
  hoursWorked: number;
  taskName: string;
  notes?: string;
}

const createTimeEntry = (params: TimeEntryParams): TimeEntry => {
  const { clockIn, clockOut } = createWorkTimes(params.date, params.hoursWorked);
  const lunchBreak = createLunchBreak(clockIn);
  const totalBreakMinutes = 30; // 30 min lunch
  const totalMinutes = params.hoursWorked * 60 - totalBreakMinutes;
  const billableMinutes = totalMinutes;

  return {
    id: generateId('time'),
    orgId: DEMO_ORG_ID,
    userId: params.user.uid,
    userName: params.user.displayName,
    userRole: params.user.role,
    projectId: params.project.id,
    projectName: params.project.name,
    taskName: params.taskName,
    type: 'clock' as TimeEntryType,
    status: 'approved' as TimeEntryStatus,
    clockIn,
    clockOut,
    totalMinutes,
    billableMinutes,
    breaks: [lunchBreak],
    totalBreakMinutes,
    hourlyRate: params.user.hourlyRate,
    overtimeRate: params.user.hourlyRate * 1.5,
    isOvertime: params.hoursWorked > 8,
    notes: params.notes,
    submittedAt: clockOut,
    approvedBy: DEMO_USERS.owner.uid,
    approvedByName: DEMO_USERS.owner.displayName,
    approvedAt: new Date(clockOut.getTime() + 86400000), // Approved next day
    createdAt: clockIn,
    updatedAt: clockOut,
    isDemoData: true,
  };
};

// ============================================================================
// GENERATE TIME ENTRIES
// ============================================================================

export const generateDemoTimeEntries = (): TimeEntry[] => {
  const entries: TimeEntry[] = [];

  DEMO_PROJECTS.forEach(project => {
    const workDays = getWorkDays(project.startDaysAgo, project.endDaysAgo);

    workDays.forEach(date => {
      // Assign 2-4 workers per project per day
      const workersToday = FIELD_WORKERS
        .sort(() => Math.random() - 0.5)
        .slice(0, randomInt(2, 4));

      workersToday.forEach(worker => {
        // 6-10 hour days
        const hoursWorked = randomInt(6, 10);

        // Pick a relevant task
        const taskName = randomItem(project.tasks);

        // Sometimes add notes
        const notes = randomItem(TASK_NOTES);

        entries.push(createTimeEntry({
          user: worker,
          project,
          date,
          hoursWorked,
          taskName,
          notes,
        }));
      });
    });
  });

  // Add admin time entries (office work)
  const adminDays = getWorkDays(300, 0).filter(() => Math.random() > 0.6);

  adminDays.forEach(date => {
    const { clockIn, clockOut } = createWorkTimes(date, 8);

    entries.push({
      id: generateId('time'),
      orgId: DEMO_ORG_ID,
      userId: DEMO_USERS.admin.uid,
      userName: DEMO_USERS.admin.displayName,
      userRole: 'EMPLOYEE',
      type: 'clock' as TimeEntryType,
      status: 'approved' as TimeEntryStatus,
      taskName: randomItem(['Project Coordination', 'Scheduling', 'Client Communication', 'Billing', 'Estimating']),
      clockIn,
      clockOut,
      totalMinutes: 450,
      billableMinutes: 0, // Admin not billable
      breaks: [],
      totalBreakMinutes: 30,
      hourlyRate: DEMO_USERS.admin.salary ? DEMO_USERS.admin.salary / 2080 : 26,
      notes: Math.random() > 0.7 ? 'Office day' : undefined,
      submittedAt: clockOut,
      approvedBy: DEMO_USERS.owner.uid,
      approvedByName: DEMO_USERS.owner.displayName,
      approvedAt: new Date(clockOut.getTime() + 86400000),
      createdAt: clockIn,
      updatedAt: clockOut,
      isDemoData: true,
    });
  });

  // Add PM/owner time entries (management, site visits)
  const pmDays = getWorkDays(300, 0).filter(() => Math.random() > 0.5);

  pmDays.forEach(date => {
    const { clockIn, clockOut } = createWorkTimes(date, randomInt(8, 10));
    const project = randomItem(DEMO_PROJECTS);

    entries.push({
      id: generateId('time'),
      orgId: DEMO_ORG_ID,
      userId: DEMO_USERS.pm.uid,
      userName: DEMO_USERS.pm.displayName,
      userRole: 'PM',
      projectId: project.id,
      projectName: project.name,
      type: 'clock' as TimeEntryType,
      status: 'approved' as TimeEntryStatus,
      taskName: randomItem(['Site Visit', 'Client Meeting', 'Project Management', 'Estimating', 'Planning']),
      clockIn,
      clockOut,
      totalMinutes: 480,
      billableMinutes: 0,
      breaks: [],
      totalBreakMinutes: 30,
      hourlyRate: DEMO_USERS.pm.salary ? DEMO_USERS.pm.salary / 2080 : 41,
      submittedAt: clockOut,
      approvedBy: DEMO_USERS.owner.uid,
      approvedByName: DEMO_USERS.owner.displayName,
      approvedAt: new Date(clockOut.getTime() + 86400000),
      createdAt: clockIn,
      updatedAt: clockOut,
      isDemoData: true,
    });
  });

  return entries;
};

// Export for use in seeding scripts
export const DEMO_TIME_ENTRIES = generateDemoTimeEntries();

// Summary for verification
export const getTimeEntrySummary = () => {
  const entries = DEMO_TIME_ENTRIES;
  const totalHours = entries.reduce((sum, e) => sum + (e.totalMinutes || 0) / 60, 0);
  const billableHours = entries.reduce((sum, e) => sum + (e.billableMinutes || 0) / 60, 0);

  const byUser = new Map<string, { name: string; entries: number; hours: number }>();
  entries.forEach(e => {
    const existing = byUser.get(e.userId) || { name: e.userName, entries: 0, hours: 0 };
    existing.entries++;
    existing.hours += (e.totalMinutes || 0) / 60;
    byUser.set(e.userId, existing);
  });

  const byProject = new Map<string, { name: string; entries: number; hours: number }>();
  entries.forEach(e => {
    if (e.projectId) {
      const existing = byProject.get(e.projectId) || { name: e.projectName || 'Unknown', entries: 0, hours: 0 };
      existing.entries++;
      existing.hours += (e.totalMinutes || 0) / 60;
      byProject.set(e.projectId, existing);
    }
  });

  return {
    total: entries.length,
    totalHours: Math.round(totalHours),
    billableHours: Math.round(billableHours),
    byUser: Object.fromEntries(byUser),
    byProject: Object.fromEntries(byProject),
    averageHoursPerEntry: Math.round(totalHours / entries.length * 10) / 10,
  };
};

// Helper to remove undefined values (Firestore doesn't accept undefined)
const removeUndefined = <T extends Record<string, unknown>>(obj: T): T => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined)
  ) as T;
};

// Firestore seeding function
export async function seedTimeEntries(
  db: FirebaseFirestore.Firestore,
  orgId: string
): Promise<{ count: number }> {
  logSection('Seeding Time Entries');

  const entries = generateDemoTimeEntries();

  await executeBatchWrites(
    db,
    entries,
    (batch, entry) => {
      const docRef = db
        .collection('organizations')
        .doc(orgId)
        .collection('timeEntries')
        .doc(entry.id);

      batch.set(docRef, removeUndefined({
        ...entry,
        orgId,
        clockIn: toTimestamp(entry.clockIn),
        clockOut: entry.clockOut ? toTimestamp(entry.clockOut) : null,
        submittedAt: entry.submittedAt ? toTimestamp(entry.submittedAt) : null,
        approvedAt: entry.approvedAt ? toTimestamp(entry.approvedAt) : null,
        createdAt: toTimestamp(entry.createdAt),
        updatedAt: toTimestamp(entry.updatedAt),
        breaks: entry.breaks.map(b => ({
          ...b,
          startTime: toTimestamp(b.startTime),
          endTime: toTimestamp(b.endTime),
        })),
      }));
    },
    'Time Entries'
  );

  logSuccess(`Seeded ${entries.length} time entries`);
  return { count: entries.length };
}
