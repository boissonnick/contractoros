/**
 * Seed Demo Submittals
 * Sprint 38 - CLI 1, Task 4
 *
 * Creates 5-10 submittals per project
 */

import * as admin from 'firebase-admin';
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

// Submittal templates by category
const SUBMITTAL_TEMPLATES = {
  flooring: [
    { item: 'LVP Flooring Sample - Oak Natural', vendor: 'Shaw Floors' },
    { item: 'Carpet Tile Sample - Commercial Gray', vendor: 'Mohawk Group' },
    { item: 'Hardwood Flooring Sample - Walnut', vendor: 'Armstrong' },
    { item: 'Tile Sample - Porcelain 12x24', vendor: 'Daltile' },
  ],
  cabinets: [
    { item: 'Cabinet Door Sample - Shaker White', vendor: 'KraftMaid' },
    { item: 'Cabinet Hardware - Brushed Nickel Pulls', vendor: 'Amerock' },
    { item: 'Cabinet Finish Sample - Espresso', vendor: 'Thomasville' },
  ],
  fixtures: [
    { item: 'Faucet - Kitchen Single Handle', vendor: 'Delta' },
    { item: 'Sink - Undermount Stainless', vendor: 'Kohler' },
    { item: 'Toilet - Low Flow White', vendor: 'American Standard' },
    { item: 'Shower Head - Rain Style Chrome', vendor: 'Moen' },
  ],
  lighting: [
    { item: 'Pendant Light - Kitchen Island', vendor: 'Kichler' },
    { item: 'Recessed LED Trim - 4 inch', vendor: 'Halo' },
    { item: 'Under Cabinet Lighting - LED Strip', vendor: 'WAC Lighting' },
    { item: 'Vanity Light - 3-Light Chrome', vendor: 'Progress Lighting' },
  ],
  paint: [
    { item: 'Interior Paint Sample - Agreeable Gray', vendor: 'Sherwin-Williams' },
    { item: 'Trim Paint Sample - Extra White', vendor: 'Sherwin-Williams' },
    { item: 'Exterior Paint Sample - Iron Ore', vendor: 'Benjamin Moore' },
  ],
  countertops: [
    { item: 'Quartz Sample - Calacatta White', vendor: 'Cambria' },
    { item: 'Granite Sample - Black Galaxy', vendor: 'MSI Surfaces' },
    { item: 'Butcher Block Sample - Maple', vendor: 'John Boos' },
  ],
  windows: [
    { item: 'Window Sample - Double Hung Vinyl', vendor: 'Pella' },
    { item: 'Sliding Door Sample - Aluminum Frame', vendor: 'Milgard' },
  ],
};

async function seedSubmittals(): Promise<number> {
  logSection('Seeding Demo Submittals');

  const submittalsRef = db.collection('organizations').doc(DEMO_ORG_ID).collection('submittals');
  const submittals: any[] = [];
  let submittalNumber = 1;

  for (const project of DEMO_PROJECTS) {
    const numSubmittals = randomInt(5, 10);
    const categories = Object.keys(SUBMITTAL_TEMPLATES) as (keyof typeof SUBMITTAL_TEMPLATES)[];

    for (let i = 0; i < numSubmittals; i++) {
      const category = randomItem(categories);
      const template = randomItem(SUBMITTAL_TEMPLATES[category]);
      const submittedAt = daysAgo(randomInt(7, 60));

      // Determine status with realistic distribution
      const statusRoll = Math.random();
      let status: string;
      let reviewedAt: Date | null = null;
      let reviewedBy: string | null = null;
      let reviewedByName: string | null = null;
      let comments: string | null = null;

      if (statusRoll < 0.2) {
        status = 'pending';
      } else if (statusRoll < 0.7) {
        status = 'approved';
        reviewedAt = new Date(submittedAt.getTime() + randomInt(1, 7) * 86400000);
        reviewedBy = DEMO_USERS.owner.uid;
        reviewedByName = DEMO_USERS.owner.displayName;
        comments = randomItem(['Approved as submitted', 'Approved - matches specifications', 'Approved for installation']);
      } else if (statusRoll < 0.9) {
        status = 'needs_revision';
        reviewedAt = new Date(submittedAt.getTime() + randomInt(1, 5) * 86400000);
        reviewedBy = DEMO_USERS.owner.uid;
        reviewedByName = DEMO_USERS.owner.displayName;
        comments = randomItem([
          'Please provide alternate color option',
          'Need spec sheet with dimensions',
          'Resubmit with warranty information',
        ]);
      } else {
        status = 'rejected';
        reviewedAt = new Date(submittedAt.getTime() + randomInt(1, 3) * 86400000);
        reviewedBy = DEMO_USERS.owner.uid;
        reviewedByName = DEMO_USERS.owner.displayName;
        comments = randomItem([
          'Does not meet project specifications',
          'Budget constraint - find alternative',
          'Lead time too long for schedule',
        ]);
      }

      const submittal = {
        id: generateId('sub'),
        orgId: DEMO_ORG_ID,
        projectId: project.id,
        projectName: project.name,
        number: `SUB-${String(submittalNumber++).padStart(3, '0')}`,
        item: template.item,
        category: category,
        vendor: template.vendor,
        status: status,
        submittedBy: DEMO_USERS.pm.uid,
        submittedByName: DEMO_USERS.pm.displayName,
        submittedAt: submittedAt,
        reviewedBy: reviewedBy,
        reviewedByName: reviewedByName,
        reviewedAt: reviewedAt,
        comments: comments,
        attachments: [],
        createdAt: submittedAt,
        isDemoData: true,
      };

      submittals.push(submittal);
      logProgress(`Created submittal ${submittal.number}: ${submittal.item.substring(0, 40)}...`);
    }
  }

  await executeBatchWrites(
    db,
    submittals,
    (batch, submittal) => {
      const ref = submittalsRef.doc(submittal.id);
      batch.set(ref, {
        ...submittal,
        submittedAt: toTimestamp(submittal.submittedAt),
        reviewedAt: submittal.reviewedAt ? toTimestamp(submittal.reviewedAt) : null,
        createdAt: toTimestamp(submittal.createdAt),
        updatedAt: Timestamp.now(),
      });
    },
    'Submittals'
  );

  logSuccess(`Created ${submittals.length} submittals`);
  return submittals.length;
}

// Run if executed directly
if (require.main === module) {
  seedSubmittals()
    .then((count) => {
      console.log(`\n✅ Created ${count} submittals`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error seeding submittals:', error);
      process.exit(1);
    });
}

export { seedSubmittals };
