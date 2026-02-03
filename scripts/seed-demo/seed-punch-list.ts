/**
 * Seed Demo Punch List Items
 * Sprint 38 - CLI 1, Task 5
 *
 * Creates 8-15 punch list items per project
 */

import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
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

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'contractoros-483812',
  });
}

import { getDb } from "./db";
const db = getDb();

// Demo projects
const DEMO_PROJECTS = [
  { id: 'demo-proj-smith-kitchen', name: 'Smith Kitchen Remodel' },
  { id: 'demo-proj-garcia-bath', name: 'Garcia Master Bath' },
  { id: 'demo-proj-mainst-retail', name: 'Main St. Retail Storefront' },
  { id: 'demo-proj-cafe-ti', name: 'Downtown Cafe TI' },
  { id: 'demo-proj-thompson-deck', name: 'Thompson Deck Build' },
  { id: 'demo-proj-office-park', name: 'Office Park Suite 200' },
  { id: 'demo-proj-garcia-basement', name: 'Garcia Basement Finish' },
];

// Punch list item templates by category
const PUNCH_TEMPLATES = {
  paint: [
    { description: 'Touch up paint on door frame', location: 'Kitchen' },
    { description: 'Paint drip on baseboard needs correction', location: 'Hallway' },
    { description: 'Missed spot on ceiling corner', location: 'Living Room' },
    { description: 'Color mismatch on accent wall', location: 'Bedroom' },
  ],
  drywall: [
    { description: 'Small drywall crack near window', location: 'Master Bedroom' },
    { description: 'Nail pop visible in ceiling', location: 'Dining Room' },
    { description: 'Drywall texture inconsistent', location: 'Garage' },
  ],
  trim: [
    { description: 'Crown molding gap at corner', location: 'Living Room' },
    { description: 'Baseboard not flush with wall', location: 'Office' },
    { description: 'Door casing needs caulk', location: 'Bathroom' },
    { description: 'Window trim has visible nail holes', location: 'Kitchen' },
  ],
  flooring: [
    { description: 'Transition strip loose at doorway', location: 'Kitchen/Hallway' },
    { description: 'Scratches on hardwood near entry', location: 'Entryway' },
    { description: 'Tile grout missing in corner', location: 'Bathroom' },
    { description: 'Carpet seam visible', location: 'Bedroom' },
  ],
  plumbing: [
    { description: 'Faucet handle loose', location: 'Bathroom' },
    { description: 'Slow drain in sink', location: 'Kitchen' },
    { description: 'Toilet running intermittently', location: 'Powder Room' },
    { description: 'Water pressure low at shower', location: 'Master Bath' },
  ],
  electrical: [
    { description: 'Light switch plate crooked', location: 'Bedroom' },
    { description: 'Outlet cover missing screw', location: 'Kitchen' },
    { description: 'Dimmer switch not working properly', location: 'Dining Room' },
    { description: 'GFCI outlet not resetting', location: 'Bathroom' },
  ],
  cabinets: [
    { description: 'Cabinet door alignment off', location: 'Kitchen' },
    { description: 'Drawer slide sticking', location: 'Kitchen' },
    { description: 'Hardware loose on cabinet', location: 'Bathroom' },
    { description: 'Soft close not engaging', location: 'Kitchen' },
  ],
  general: [
    { description: 'Window screen has small tear', location: 'Bedroom' },
    { description: 'Door not closing properly', location: 'Office' },
    { description: 'Closet rod bracket loose', location: 'Master Closet' },
    { description: 'Weather stripping gap at exterior door', location: 'Entry' },
  ],
};

async function seedPunchList(): Promise<number> {
  logSection('Seeding Demo Punch List Items');

  const punchListRef = db.collection('organizations').doc(DEMO_ORG_ID).collection('punchList');
  const punchItems: any[] = [];
  let itemNumber = 1;

  for (const project of DEMO_PROJECTS) {
    const numItems = randomInt(8, 15);
    const categories = Object.keys(PUNCH_TEMPLATES) as (keyof typeof PUNCH_TEMPLATES)[];

    for (let i = 0; i < numItems; i++) {
      const category = randomItem(categories);
      const template = randomItem(PUNCH_TEMPLATES[category]);
      const createdAt = daysAgo(randomInt(1, 30));

      // Determine status with realistic distribution
      const statusRoll = Math.random();
      let status: string;
      let completedAt: Date | null = null;
      let completedBy: string | null = null;

      if (statusRoll < 0.25) {
        status = 'open';
      } else if (statusRoll < 0.45) {
        status = 'in_progress';
      } else if (statusRoll < 0.60) {
        status = 'ready_for_review';
      } else if (statusRoll < 0.90) {
        status = 'approved';
        completedAt = new Date(createdAt.getTime() + randomInt(1, 14) * 86400000);
        completedBy = DEMO_USERS.foreman.uid;
      } else {
        status = 'rejected';
      }

      const punchItem = {
        id: generateId('punch'),
        orgId: DEMO_ORG_ID,
        projectId: project.id,
        projectName: project.name,
        number: `PL-${String(itemNumber++).padStart(3, '0')}`,
        description: template.description,
        location: template.location,
        category: category,
        priority: randomItem(['low', 'medium', 'medium', 'high']),
        status: status,
        assignedTo: randomItem([DEMO_USERS.foreman.uid, DEMO_USERS.pm.uid, null]),
        assignedToName: randomItem([DEMO_USERS.foreman.displayName, DEMO_USERS.pm.displayName, null]),
        dueDate: daysFromNow(randomInt(1, 14)),
        createdBy: DEMO_USERS.owner.uid,
        createdByName: DEMO_USERS.owner.displayName,
        createdAt: createdAt,
        completedAt: completedAt,
        completedBy: completedBy,
        photos: [],
        notes: status === 'rejected' ? 'Needs rework - does not meet standards' : null,
        isDemoData: true,
      };

      punchItems.push(punchItem);
      logProgress(`Created punch item ${punchItem.number}: ${punchItem.description.substring(0, 40)}...`);
    }
  }

  await executeBatchWrites(
    db,
    punchItems,
    (batch, item) => {
      const ref = punchListRef.doc(item.id);
      batch.set(ref, {
        ...item,
        dueDate: toTimestamp(item.dueDate),
        createdAt: toTimestamp(item.createdAt),
        completedAt: item.completedAt ? toTimestamp(item.completedAt) : null,
        updatedAt: Timestamp.now(),
      });
    },
    'Punch List Items'
  );

  logSuccess(`Created ${punchItems.length} punch list items`);
  return punchItems.length;
}

// Run if executed directly
if (require.main === module) {
  seedPunchList()
    .then((count) => {
      console.log(`\n✅ Created ${count} punch list items`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error seeding punch list:', error);
      process.exit(1);
    });
}

export { seedPunchList };
