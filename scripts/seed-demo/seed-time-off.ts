/**
 * Seed Time Off Requests
 * Creates time off requests for demo employees
 */

import { Timestamp } from 'firebase-admin/firestore';
import { getDb } from './db';
import {
  DEMO_ORG_ID,
  DEMO_USERS,
  daysAgo,
  daysFromNow,
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

// Employees who can request time off
const EMPLOYEES = [
  { id: DEMO_USERS.foreman.uid, name: DEMO_USERS.foreman.displayName },
  { id: DEMO_USERS.fieldWorker1.uid, name: DEMO_USERS.fieldWorker1.displayName },
  { id: DEMO_USERS.fieldWorker2.uid, name: DEMO_USERS.fieldWorker2.displayName },
  { id: DEMO_USERS.fieldWorker3.uid, name: DEMO_USERS.fieldWorker3.displayName },
  { id: DEMO_USERS.admin.uid, name: DEMO_USERS.admin.displayName },
];

// Time off request types and reasons
type TimeOffType = 'vacation' | 'sick' | 'personal' | 'bereavement' | 'jury_duty' | 'other';

const TIME_OFF_TEMPLATES: { type: TimeOffType; reason: string; durationDays: number }[] = [
  { type: 'vacation', reason: 'Family vacation', durationDays: 5 },
  { type: 'vacation', reason: 'Personal travel', durationDays: 3 },
  { type: 'vacation', reason: 'Long weekend trip', durationDays: 2 },
  { type: 'sick', reason: 'Not feeling well', durationDays: 1 },
  { type: 'sick', reason: 'Medical appointment', durationDays: 1 },
  { type: 'sick', reason: 'Doctor follow-up', durationDays: 1 },
  { type: 'personal', reason: 'Personal matter', durationDays: 1 },
  { type: 'personal', reason: 'Moving day', durationDays: 2 },
  { type: 'personal', reason: 'Family event', durationDays: 1 },
  { type: 'bereavement', reason: 'Family bereavement', durationDays: 3 },
  { type: 'jury_duty', reason: 'Jury duty summons', durationDays: 5 },
  { type: 'other', reason: 'Training course', durationDays: 2 },
];

async function seedTimeOff(): Promise<number> {
  logSection('Seeding Time Off Requests');

  const timeOffRef = db.collection('organizations').doc(DEMO_ORG_ID).collection('timeOffRequests');
  const requests: any[] = [];

  // Create past approved requests
  for (const employee of EMPLOYEES) {
    const numPastRequests = randomInt(1, 4);

    for (let i = 0; i < numPastRequests; i++) {
      const template = randomItem(TIME_OFF_TEMPLATES);
      const startDaysAgo = randomInt(14, 90);
      const startDate = daysAgo(startDaysAgo);
      const endDate = daysAgo(startDaysAgo - template.durationDays + 1);

      requests.push({
        id: generateId('pto'),
        orgId: DEMO_ORG_ID,
        userId: employee.id,
        userName: employee.name,
        type: template.type,
        startDate,
        endDate,
        reason: template.reason,
        status: 'approved',
        approvedBy: DEMO_USERS.owner.uid,
        approvedByName: DEMO_USERS.owner.displayName,
        approvedAt: daysAgo(startDaysAgo + randomInt(1, 5)),
        createdAt: daysAgo(startDaysAgo + randomInt(5, 14)),
        isDemoData: true,
      });
    }
  }

  // Create some pending future requests
  const pendingEmployees = EMPLOYEES.slice(0, 3);
  for (const employee of pendingEmployees) {
    const template = randomItem(TIME_OFF_TEMPLATES.filter(t => t.type === 'vacation' || t.type === 'personal'));
    const startDaysFromNow = randomInt(14, 45);
    const startDate = daysFromNow(startDaysFromNow);
    const endDate = daysFromNow(startDaysFromNow + template.durationDays - 1);

    requests.push({
      id: generateId('pto'),
      orgId: DEMO_ORG_ID,
      userId: employee.id,
      userName: employee.name,
      type: template.type,
      startDate,
      endDate,
      reason: template.reason,
      status: 'pending',
      createdAt: daysAgo(randomInt(1, 7)),
      isDemoData: true,
    });

    logProgress(`Created pending request for ${employee.name}`);
  }

  // Create an upcoming approved vacation
  const upcomingEmployee = EMPLOYEES[0];
  const upcomingStart = daysFromNow(randomInt(7, 14));
  const upcomingEnd = daysFromNow(randomInt(10, 18));

  requests.push({
    id: generateId('pto'),
    orgId: DEMO_ORG_ID,
    userId: upcomingEmployee.id,
    userName: upcomingEmployee.name,
    type: 'vacation',
    startDate: upcomingStart,
    endDate: upcomingEnd,
    reason: 'Pre-planned vacation',
    status: 'approved',
    approvedBy: DEMO_USERS.owner.uid,
    approvedByName: DEMO_USERS.owner.displayName,
    approvedAt: daysAgo(14),
    createdAt: daysAgo(21),
    isDemoData: true,
  });

  // Create a denied request for realism
  const deniedEmployee = EMPLOYEES[2];
  requests.push({
    id: generateId('pto'),
    orgId: DEMO_ORG_ID,
    userId: deniedEmployee.id,
    userName: deniedEmployee.name,
    type: 'vacation',
    startDate: daysAgo(20),
    endDate: daysAgo(15),
    reason: 'Short notice vacation request',
    status: 'denied',
    approvedBy: DEMO_USERS.owner.uid,
    approvedByName: DEMO_USERS.owner.displayName,
    approvedAt: daysAgo(25),
    denialReason: 'Insufficient notice - project deadline conflict. Please resubmit with at least 2 weeks notice.',
    createdAt: daysAgo(27),
    isDemoData: true,
  });

  // Create a half-day request
  const halfDayEmployee = EMPLOYEES[1];
  requests.push({
    id: generateId('pto'),
    orgId: DEMO_ORG_ID,
    userId: halfDayEmployee.id,
    userName: halfDayEmployee.name,
    type: 'personal',
    startDate: daysFromNow(5),
    endDate: daysFromNow(5),
    halfDay: 'morning',
    reason: 'Doctor appointment',
    status: 'approved',
    approvedBy: DEMO_USERS.pm.uid,
    approvedByName: DEMO_USERS.pm.displayName,
    approvedAt: daysAgo(2),
    createdAt: daysAgo(5),
    isDemoData: true,
  });

  await executeBatchWrites(
    db,
    requests,
    (batch, request) => {
      const ref = timeOffRef.doc(request.id);
      batch.set(ref, {
        ...request,
        startDate: toTimestamp(request.startDate),
        endDate: toTimestamp(request.endDate),
        approvedAt: request.approvedAt ? toTimestamp(request.approvedAt) : null,
        createdAt: toTimestamp(request.createdAt),
        updatedAt: Timestamp.now(),
      });
    },
    'Time Off Requests'
  );

  logSuccess(`Created ${requests.length} time off requests`);
  return requests.length;
}

export { seedTimeOff };

// Run if executed directly
if (require.main === module) {
  seedTimeOff()
    .then((count) => {
      console.log(`\n✅ Created ${count} time off requests`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error seeding time off requests:', error);
      process.exit(1);
    });
}
