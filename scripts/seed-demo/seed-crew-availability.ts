/**
 * Seed Crew Availability
 * Creates availability records for demo crew members
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

// Get demo crew members
const CREW_MEMBERS = [
  { id: DEMO_USERS.foreman.uid, name: DEMO_USERS.foreman.displayName },
  { id: DEMO_USERS.fieldWorker1.uid, name: DEMO_USERS.fieldWorker1.displayName },
  { id: DEMO_USERS.fieldWorker2.uid, name: DEMO_USERS.fieldWorker2.displayName },
  { id: DEMO_USERS.fieldWorker3.uid, name: DEMO_USERS.fieldWorker3.displayName },
];

// Availability statuses and reasons
const UNAVAILABLE_REASONS = [
  { reason: 'time_off', notes: 'Vacation' },
  { reason: 'sick', notes: 'Called in sick' },
  { reason: 'training', notes: 'Attending safety training' },
  { reason: 'personal', notes: 'Personal day' },
  { reason: 'other_job', notes: 'Scheduled on other project' },
];

async function seedCrewAvailability(): Promise<number> {
  logSection('Seeding Crew Availability');

  const availabilityRef = db.collection('organizations').doc(DEMO_ORG_ID).collection('crewAvailability');
  const records: any[] = [];

  // Generate availability for the next 30 days for each crew member
  for (const crew of CREW_MEMBERS) {
    for (let dayOffset = -7; dayOffset <= 30; dayOffset++) {
      const date = dayOffset < 0 ? daysAgo(Math.abs(dayOffset)) : daysFromNow(dayOffset);
      const dayOfWeek = date.getDay();

      // Skip weekends - mark as unavailable
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        records.push({
          id: generateId('avail'),
          orgId: DEMO_ORG_ID,
          userId: crew.id,
          userName: crew.name,
          date,
          allDay: true,
          status: 'unavailable',
          reason: 'other',
          notes: dayOfWeek === 0 ? 'Sunday - Off' : 'Saturday - Off',
          isRecurring: true,
          recurrencePattern: 'weekly',
          createdAt: daysAgo(30),
          isDemoData: true,
        });
        continue;
      }

      // Random unavailability (10% chance on weekdays)
      if (Math.random() < 0.10) {
        const unavailReason = randomItem(UNAVAILABLE_REASONS);
        records.push({
          id: generateId('avail'),
          orgId: DEMO_ORG_ID,
          userId: crew.id,
          userName: crew.name,
          date,
          allDay: true,
          status: 'unavailable',
          reason: unavailReason.reason,
          notes: unavailReason.notes,
          isRecurring: false,
          createdAt: daysAgo(randomInt(1, 14)),
          isDemoData: true,
        });
        continue;
      }

      // Limited availability (5% chance)
      if (Math.random() < 0.05) {
        const isAfternoon = Math.random() > 0.5;
        records.push({
          id: generateId('avail'),
          orgId: DEMO_ORG_ID,
          userId: crew.id,
          userName: crew.name,
          date,
          startTime: isAfternoon ? '12:00' : '07:00',
          endTime: isAfternoon ? '17:00' : '12:00',
          allDay: false,
          status: 'limited',
          reason: 'personal',
          notes: isAfternoon ? 'Morning appointment - available afternoon' : 'Afternoon appointment - available morning only',
          isRecurring: false,
          createdAt: daysAgo(randomInt(1, 7)),
          isDemoData: true,
        });
        continue;
      }

      // Otherwise available - standard work hours
      records.push({
        id: generateId('avail'),
        orgId: DEMO_ORG_ID,
        userId: crew.id,
        userName: crew.name,
        date,
        startTime: '07:00',
        endTime: '16:00',
        allDay: false,
        status: 'available',
        isRecurring: false,
        createdAt: daysAgo(30),
        isDemoData: true,
      });
    }

    logProgress(`Created availability for ${crew.name}`);
  }

  await executeBatchWrites(
    db,
    records,
    (batch, record) => {
      const ref = availabilityRef.doc(record.id);
      batch.set(ref, {
        ...record,
        date: toTimestamp(record.date),
        recurrenceEndDate: record.recurrenceEndDate ? toTimestamp(record.recurrenceEndDate) : null,
        createdAt: toTimestamp(record.createdAt),
        updatedAt: Timestamp.now(),
      });
    },
    'Crew Availability'
  );

  logSuccess(`Created ${records.length} availability records`);
  return records.length;
}

export { seedCrewAvailability };

// Run if executed directly
if (require.main === module) {
  seedCrewAvailability()
    .then((count) => {
      console.log(`\n✅ Created ${count} availability records`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error seeding crew availability:', error);
      process.exit(1);
    });
}
