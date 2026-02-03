/**
 * Seed Schedule Events
 * Creates calendar/schedule events for demo projects
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

// Demo projects with their active state
const DEMO_PROJECTS = [
  { id: 'demo-proj-smith-kitchen', name: 'Smith Kitchen Remodel', active: false },
  { id: 'demo-proj-garcia-bath', name: 'Garcia Master Bath', active: false },
  { id: 'demo-proj-mainst-retail', name: 'Main St. Retail Storefront', active: false },
  { id: 'demo-proj-cafe-ti', name: 'Downtown Cafe TI', active: false },
  { id: 'demo-proj-thompson-deck', name: 'Thompson Deck Build', active: true },
  { id: 'demo-proj-office-park', name: 'Office Park Suite 200', active: true },
  { id: 'demo-proj-garcia-basement', name: 'Garcia Basement Finish', active: true },
];

// Event types
type ScheduleEventType = 'work' | 'meeting' | 'inspection' | 'delivery' | 'milestone' | 'deadline' | 'other';

// Event templates
const EVENT_TEMPLATES = {
  work: [
    { title: 'Framing Work', duration: 8 },
    { title: 'Electrical Rough-In', duration: 8 },
    { title: 'Plumbing Work', duration: 6 },
    { title: 'Drywall Installation', duration: 8 },
    { title: 'Flooring Installation', duration: 6 },
    { title: 'Painting', duration: 8 },
    { title: 'Trim Installation', duration: 4 },
    { title: 'Cabinet Installation', duration: 8 },
    { title: 'Tile Work', duration: 8 },
  ],
  meeting: [
    { title: 'Client Walk-Through', duration: 1 },
    { title: 'Subcontractor Coordination', duration: 1 },
    { title: 'Weekly Progress Meeting', duration: 1 },
    { title: 'Design Review Meeting', duration: 2 },
  ],
  inspection: [
    { title: 'Rough Electrical Inspection', duration: 1 },
    { title: 'Rough Plumbing Inspection', duration: 1 },
    { title: 'Framing Inspection', duration: 1 },
    { title: 'Final Inspection', duration: 2 },
    { title: 'City Building Inspection', duration: 1 },
  ],
  delivery: [
    { title: 'Material Delivery - Lumber', duration: 2 },
    { title: 'Appliance Delivery', duration: 3 },
    { title: 'Cabinet Delivery', duration: 2 },
    { title: 'Fixture Delivery', duration: 1 },
    { title: 'Flooring Materials Delivery', duration: 2 },
  ],
  milestone: [
    { title: 'Project Kickoff', duration: 2 },
    { title: 'Demo Complete', duration: 1 },
    { title: 'Rough-In Complete', duration: 1 },
    { title: 'Drywall Complete', duration: 1 },
    { title: 'Substantial Completion', duration: 2 },
  ],
};

const EVENT_COLORS: Record<ScheduleEventType, string> = {
  work: '#3b82f6',      // blue
  meeting: '#8b5cf6',   // purple
  inspection: '#f59e0b', // amber
  delivery: '#10b981',  // emerald
  milestone: '#ec4899', // pink
  deadline: '#ef4444',  // red
  other: '#6b7280',     // gray
};

// Get demo crew members
const CREW_MEMBERS = [
  { id: DEMO_USERS.foreman.uid, name: DEMO_USERS.foreman.displayName },
  { id: DEMO_USERS.fieldWorker1.uid, name: DEMO_USERS.fieldWorker1.displayName },
  { id: DEMO_USERS.fieldWorker2.uid, name: DEMO_USERS.fieldWorker2.displayName },
  { id: DEMO_USERS.fieldWorker3.uid, name: DEMO_USERS.fieldWorker3.displayName },
];

async function seedScheduleEvents(): Promise<number> {
  logSection('Seeding Schedule Events');

  const eventsRef = db.collection('organizations').doc(DEMO_ORG_ID).collection('scheduleEvents');
  const events: any[] = [];

  // Past events for all projects
  for (const project of DEMO_PROJECTS) {
    const numPastEvents = randomInt(5, 10);

    for (let i = 0; i < numPastEvents; i++) {
      const eventType = randomItem(['work', 'meeting', 'inspection', 'delivery', 'milestone']) as ScheduleEventType;
      const templates = EVENT_TEMPLATES[eventType] || EVENT_TEMPLATES.work;
      const template = randomItem(templates);
      const daysBack = randomInt(7, 60);
      const startDate = daysAgo(daysBack);
      startDate.setHours(8 + randomInt(0, 2), 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setHours(startDate.getHours() + template.duration);

      const assignedCrew = eventType === 'work'
        ? CREW_MEMBERS.slice(0, randomInt(1, 3))
        : [];

      events.push({
        id: generateId('evt'),
        orgId: DEMO_ORG_ID,
        title: `${template.title} - ${project.name}`,
        description: `${eventType.charAt(0).toUpperCase() + eventType.slice(1)} event for ${project.name}`,
        type: eventType,
        status: 'completed',
        color: EVENT_COLORS[eventType],
        startDate,
        endDate,
        allDay: false,
        estimatedHours: template.duration,
        recurrence: 'none',
        projectId: project.id,
        projectName: project.name,
        assignedTo: assignedCrew.map(c => c.id),
        assignedToNames: assignedCrew.map(c => c.name),
        createdBy: DEMO_USERS.pm.uid,
        createdByName: DEMO_USERS.pm.displayName,
        createdAt: daysAgo(daysBack + 3),
        isDemoData: true,
      });
    }
  }

  // Future events for active projects only
  const activeProjects = DEMO_PROJECTS.filter(p => p.active);

  for (const project of activeProjects) {
    const numFutureEvents = randomInt(8, 15);

    for (let i = 0; i < numFutureEvents; i++) {
      const eventType = randomItem(['work', 'work', 'work', 'meeting', 'inspection', 'delivery']) as ScheduleEventType;
      const templates = EVENT_TEMPLATES[eventType] || EVENT_TEMPLATES.work;
      const template = randomItem(templates);
      const daysForward = randomInt(1, 30);
      const startDate = daysFromNow(daysForward);
      startDate.setHours(7 + randomInt(0, 2), 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setHours(startDate.getHours() + template.duration);

      const assignedCrew = eventType === 'work'
        ? CREW_MEMBERS.slice(0, randomInt(1, 4))
        : [];

      events.push({
        id: generateId('evt'),
        orgId: DEMO_ORG_ID,
        title: `${template.title} - ${project.name}`,
        description: `${eventType.charAt(0).toUpperCase() + eventType.slice(1)} event for ${project.name}`,
        type: eventType,
        status: 'scheduled',
        color: EVENT_COLORS[eventType],
        startDate,
        endDate,
        allDay: false,
        estimatedHours: template.duration,
        recurrence: 'none',
        projectId: project.id,
        projectName: project.name,
        assignedTo: assignedCrew.map(c => c.id),
        assignedToNames: assignedCrew.map(c => c.name),
        createdBy: DEMO_USERS.pm.uid,
        createdByName: DEMO_USERS.pm.displayName,
        createdAt: daysAgo(randomInt(1, 7)),
        isDemoData: true,
      });

      logProgress(`Created event: ${template.title} for ${project.name}`);
    }
  }

  // Add some company-wide events
  const companyEvents = [
    { title: 'Safety Training', type: 'meeting' as ScheduleEventType, daysForward: 14, duration: 4 },
    { title: 'Team Meeting', type: 'meeting' as ScheduleEventType, daysForward: 7, duration: 1 },
    { title: 'Equipment Maintenance', type: 'other' as ScheduleEventType, daysForward: 21, duration: 8 },
  ];

  for (const evt of companyEvents) {
    const startDate = daysFromNow(evt.daysForward);
    startDate.setHours(8, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setHours(startDate.getHours() + evt.duration);

    events.push({
      id: generateId('evt'),
      orgId: DEMO_ORG_ID,
      title: evt.title,
      description: `Company-wide ${evt.title.toLowerCase()}`,
      type: evt.type,
      status: 'scheduled',
      color: EVENT_COLORS[evt.type],
      startDate,
      endDate,
      allDay: evt.duration >= 8,
      estimatedHours: evt.duration,
      recurrence: 'none',
      assignedTo: CREW_MEMBERS.map(c => c.id),
      assignedToNames: CREW_MEMBERS.map(c => c.name),
      createdBy: DEMO_USERS.owner.uid,
      createdByName: DEMO_USERS.owner.displayName,
      createdAt: daysAgo(5),
      isDemoData: true,
    });
  }

  await executeBatchWrites(
    db,
    events,
    (batch, event) => {
      const ref = eventsRef.doc(event.id);
      batch.set(ref, {
        ...event,
        startDate: toTimestamp(event.startDate),
        endDate: toTimestamp(event.endDate),
        createdAt: toTimestamp(event.createdAt),
        updatedAt: Timestamp.now(),
      });
    },
    'Schedule Events'
  );

  logSuccess(`Created ${events.length} schedule events`);
  return events.length;
}

export { seedScheduleEvents };

// Run if executed directly
if (require.main === module) {
  seedScheduleEvents()
    .then((count) => {
      console.log(`\n✅ Created ${count} schedule events`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error seeding schedule events:', error);
      process.exit(1);
    });
}
