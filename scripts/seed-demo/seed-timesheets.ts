/**
 * Seed Weekly Timesheets for ContractorOS
 *
 * Creates 6-8 weekly timesheet records per team member for the last 8 weeks.
 * Each timesheet represents a week (Mon-Fri) with realistic daily hours and
 * a mix of statuses: submitted, approved, pending (draft).
 *
 * Collection: top-level `weeklyTimesheets` (queried by orgId)
 * Type: WeeklyTimesheet from types/index.ts
 *
 * Total: ~48 timesheet records (6 team members x 8 weeks)
 */

import { Timestamp } from 'firebase-admin/firestore';
import { getDb } from './db';
import {
  DEMO_ORG_ID,
  DEMO_USERS,
  generateId,
  randomInt,
  randomItem,
  toTimestamp,
  logSection,
  logProgress,
  logSuccess,
  executeBatchWrites,
} from './utils';

const db = getDb();

// ============================================
// Team members who submit timesheets
// ============================================

const TIMESHEET_TEAM = [
  { uid: DEMO_USERS.foreman.uid, displayName: DEMO_USERS.foreman.displayName, hourlyRate: DEMO_USERS.foreman.hourlyRate },
  { uid: DEMO_USERS.fieldWorker1.uid, displayName: DEMO_USERS.fieldWorker1.displayName, hourlyRate: DEMO_USERS.fieldWorker1.hourlyRate },
  { uid: DEMO_USERS.fieldWorker2.uid, displayName: DEMO_USERS.fieldWorker2.displayName, hourlyRate: DEMO_USERS.fieldWorker2.hourlyRate },
  { uid: DEMO_USERS.fieldWorker3.uid, displayName: DEMO_USERS.fieldWorker3.displayName, hourlyRate: DEMO_USERS.fieldWorker3.hourlyRate },
  { uid: DEMO_USERS.pm.uid, displayName: DEMO_USERS.pm.displayName, hourlyRate: 0 },
  { uid: DEMO_USERS.admin.uid, displayName: DEMO_USERS.admin.displayName, hourlyRate: 0 },
];

// Demo projects to associate time entries with
const DEMO_PROJECTS = [
  { id: 'demo-proj-thompson-deck', name: 'Thompson Deck Build' },
  { id: 'demo-proj-office-park', name: 'Office Park Suite 200' },
  { id: 'demo-proj-garcia-basement', name: 'Garcia Basement Finish' },
  { id: 'demo-proj-brown-kitchen', name: 'Brown Kitchen Update' },
];

// Task names for time entries
const FIELD_TASKS = ['Framing', 'Electrical', 'Plumbing', 'Drywall', 'Painting', 'Trim', 'Demo', 'Flooring', 'Tile Work', 'Cabinet Install'];
const OFFICE_TASKS = ['Project Coordination', 'Scheduling', 'Client Communication', 'Billing', 'Estimating'];
const PM_TASKS = ['Site Visit', 'Client Meeting', 'Project Management', 'Estimating', 'Planning', 'Subcontractor Coordination'];

// ============================================
// Helper: get Monday of a given week (weeks ago)
// ============================================

function getMondayOfWeeksAgo(weeksAgo: number): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find this week's Monday
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ...
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() - daysToMonday);

  // Go back N weeks
  const targetMonday = new Date(thisMonday);
  targetMonday.setDate(thisMonday.getDate() - (weeksAgo * 7));
  return targetMonday;
}

// ============================================
// Helper: generate daily hours for Mon-Fri
// ============================================

interface DailyEntry {
  date: Date;
  hours: number;
  projectId?: string;
  projectName?: string;
  taskName: string;
}

function generateDailyEntries(
  weekStart: Date,
  isFieldWorker: boolean,
): DailyEntry[] {
  const entries: DailyEntry[] = [];

  for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + dayOffset);

    // Most days 8 hours, some variation (7-9.5 hrs for field, 8 for office)
    let hours: number;
    if (isFieldWorker) {
      // Field workers: 7-10 hours with realistic distribution
      const roll = Math.random();
      if (roll < 0.1) {
        hours = 6; // short day (rain, early finish)
      } else if (roll < 0.25) {
        hours = 7;
      } else if (roll < 0.55) {
        hours = 8;
      } else if (roll < 0.75) {
        hours = 8.5;
      } else if (roll < 0.9) {
        hours = 9;
      } else {
        hours = 10; // long day
      }
    } else {
      // Office/PM: 8 hours with occasional 9
      hours = Math.random() < 0.2 ? 9 : 8;
    }

    // Occasionally skip a day (PTO, sick) - ~10% chance per day
    if (Math.random() < 0.1) {
      continue;
    }

    const project = isFieldWorker ? randomItem(DEMO_PROJECTS) : undefined;
    const tasks = isFieldWorker ? FIELD_TASKS : (hours > 8 ? PM_TASKS : OFFICE_TASKS);

    entries.push({
      date,
      hours,
      projectId: project?.id,
      projectName: project?.name,
      taskName: randomItem(tasks),
    });
  }

  return entries;
}

// ============================================
// Helper: build simplified TimeEntry objects
// Matches the TimeEntry interface from types/index.ts
// ============================================

function buildTimeEntryObjects(
  dailyEntries: DailyEntry[],
  userId: string,
  userName: string,
  hourlyRate: number,
): Record<string, unknown>[] {
  return dailyEntries.map(entry => {
    const clockIn = new Date(entry.date);
    clockIn.setHours(7, 0, 0, 0);

    const clockOut = new Date(entry.date);
    clockOut.setHours(7 + entry.hours, 0, 0, 0);

    const totalMinutes = entry.hours * 60 - 30; // 30 min lunch
    const isOvertime = entry.hours > 8;

    return {
      id: generateId('te'),
      orgId: DEMO_ORG_ID,
      userId,
      userName,
      userRole: 'EMPLOYEE',
      projectId: entry.projectId || null,
      projectName: entry.projectName || null,
      taskName: entry.taskName,
      type: 'clock',
      status: 'approved',
      clockIn: Timestamp.fromDate(clockIn),
      clockOut: Timestamp.fromDate(clockOut),
      totalMinutes,
      billableMinutes: entry.projectId ? totalMinutes : 0,
      breaks: [],
      totalBreakMinutes: 30,
      hourlyRate: hourlyRate || null,
      overtimeRate: hourlyRate ? hourlyRate * 1.5 : null,
      isOvertime,
      createdAt: Timestamp.fromDate(clockIn),
      updatedAt: Timestamp.fromDate(clockOut),
    };
  });
}

// ============================================
// Build weekly timesheet record
// ============================================

interface TimesheetRecord {
  id: string;
  orgId: string;
  userId: string;
  userName: string;
  weekStart: Date;
  entries: Record<string, unknown>[];
  totalHours: number;
  overtimeHours: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submittedAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  isDemoData: boolean;
}

function buildTimesheetRecord(
  user: typeof TIMESHEET_TEAM[0],
  weekStart: Date,
  weeksAgo: number,
): TimesheetRecord {
  const isFieldWorker = user.hourlyRate > 0;
  const dailyEntries = generateDailyEntries(weekStart, isFieldWorker);
  const entries = buildTimeEntryObjects(dailyEntries, user.uid, user.displayName, user.hourlyRate);

  const totalHours = dailyEntries.reduce((sum, e) => sum + e.hours, 0);
  const overtimeHours = dailyEntries.reduce((sum, e) => sum + Math.max(0, e.hours - 8), 0);

  // Determine status based on how recent the week is
  let status: TimesheetRecord['status'];
  let submittedAt: Date | undefined;
  let approvedBy: string | undefined;
  let approvedAt: Date | undefined;

  if (weeksAgo === 0) {
    // Current week: draft (still in progress)
    status = 'draft';
  } else if (weeksAgo === 1) {
    // Last week: submitted (pending approval)
    status = 'submitted';
    submittedAt = new Date(weekStart);
    submittedAt.setDate(submittedAt.getDate() + 5); // Submitted on Saturday
    submittedAt.setHours(10, 0, 0, 0);
  } else {
    // Older weeks: mostly approved, some submitted
    const roll = Math.random();
    if (roll < 0.8) {
      status = 'approved';
      submittedAt = new Date(weekStart);
      submittedAt.setDate(submittedAt.getDate() + 5);
      submittedAt.setHours(10, 0, 0, 0);
      approvedBy = DEMO_USERS.owner.uid;
      approvedAt = new Date(submittedAt);
      approvedAt.setDate(approvedAt.getDate() + randomInt(1, 3));
      approvedAt.setHours(14, 0, 0, 0);
    } else {
      status = 'submitted';
      submittedAt = new Date(weekStart);
      submittedAt.setDate(submittedAt.getDate() + 5);
      submittedAt.setHours(10, 0, 0, 0);
    }
  }

  return {
    id: generateId('wts'),
    orgId: DEMO_ORG_ID,
    userId: user.uid,
    userName: user.displayName,
    weekStart,
    entries,
    totalHours,
    overtimeHours,
    status,
    submittedAt,
    approvedBy,
    approvedAt,
    isDemoData: true,
  };
}

// ============================================
// Remove undefined values (Firestore rejects them)
// ============================================

function removeUndefined<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as T;
}

// ============================================
// Main seed function
// ============================================

async function seedTimesheets(): Promise<number> {
  logSection('Seeding Weekly Timesheets');

  const timesheets: TimesheetRecord[] = [];
  const weeksToGenerate = 8;

  for (const user of TIMESHEET_TEAM) {
    logProgress(`Generating timesheets for ${user.displayName}...`);

    for (let weeksAgo = 0; weeksAgo < weeksToGenerate; weeksAgo++) {
      const weekStart = getMondayOfWeeksAgo(weeksAgo);
      const record = buildTimesheetRecord(user, weekStart, weeksAgo);
      timesheets.push(record);
    }
  }

  logProgress(`Generated ${timesheets.length} weekly timesheets`);

  // Write to top-level `weeklyTimesheets` collection
  // (matching the hook: collection(db, 'weeklyTimesheets'))
  await executeBatchWrites(
    db,
    timesheets,
    (batch, ts) => {
      const docRef = db.collection('weeklyTimesheets').doc(ts.id);

      batch.set(docRef, removeUndefined({
        id: ts.id,
        orgId: ts.orgId,
        userId: ts.userId,
        userName: ts.userName,
        weekStart: toTimestamp(ts.weekStart),
        entries: ts.entries, // Already has Timestamps from buildTimeEntryObjects
        totalHours: ts.totalHours,
        overtimeHours: ts.overtimeHours,
        status: ts.status,
        submittedAt: ts.submittedAt ? toTimestamp(ts.submittedAt) : null,
        approvedBy: ts.approvedBy || null,
        approvedAt: ts.approvedAt ? toTimestamp(ts.approvedAt) : null,
        isDemoData: true,
      }));
    },
    'Weekly Timesheets'
  );

  // Print summary
  const byStatus = timesheets.reduce((acc, ts) => {
    acc[ts.status] = (acc[ts.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalHoursAll = timesheets.reduce((sum, ts) => sum + ts.totalHours, 0);
  const totalOTAll = timesheets.reduce((sum, ts) => sum + ts.overtimeHours, 0);

  logSuccess(`Seeded ${timesheets.length} weekly timesheets`);
  logProgress(`By status: ${Object.entries(byStatus).map(([s, c]) => `${s}=${c}`).join(', ')}`);
  logProgress(`Total hours: ${totalHoursAll.toFixed(1)}h (${totalOTAll.toFixed(1)}h overtime)`);
  logProgress(`Team members: ${TIMESHEET_TEAM.length}`);
  logProgress(`Weeks covered: ${weeksToGenerate}`);

  return timesheets.length;
}

export { seedTimesheets };

// Run if executed directly
if (require.main === module) {
  seedTimesheets()
    .then((count) => {
      console.log(`\nDone! Created ${count} weekly timesheets.`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error seeding timesheets:', error);
      process.exit(1);
    });
}
