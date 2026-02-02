/**
 * Seed RFIs (Requests for Information)
 * Sprint 37C - Task 5
 *
 * Creates 5-10 RFIs per project with realistic questions and answers
 */

import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import {
  DEMO_ORG_ID,
  DEMO_USERS,
  daysAgo,
  monthsAgo,
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

const db = admin.firestore();

// ============================================
// RFI Templates by Category
// ============================================

const RFI_TEMPLATES = {
  structural: [
    {
      subject: 'Beam size clarification at kitchen opening',
      question: 'Drawing A-102 shows a beam at the kitchen opening but doesn\'t specify the size. Please confirm the required beam dimensions and connection details.',
      answer: 'Use 2x LVL 1.75" x 9.5" with Simpson?"
    },
    {
      subject: 'Foundation reinforcement requirements',
      question: 'The soil report indicates expansive clay. Are there additional foundation reinforcement requirements beyond what\'s shown on S-100?',
      answer: 'Add #5 rebar at 12" O.C. both ways in the slab and extend footing depth to 36".',
    },
    {
      subject: 'Load-bearing wall confirmation',
      question: 'Please confirm if the wall between kitchen and dining room is load-bearing. Demo plans are unclear.',
      answer: 'Confirmed load-bearing. Temporary shoring required during work. See revised drawing SK-1.',
    },
  ],
  electrical: [
    {
      subject: 'Panel upgrade requirements',
      question: 'Existing panel is 100A. New loads appear to exceed capacity. Please confirm if panel upgrade is required.',
      answer: 'Upgrade to 200A panel required. Include new meter base and weather head.',
    },
    {
      subject: 'Outlet spacing in kitchen',
      question: 'Please clarify outlet spacing requirements along the kitchen counter. Code requires outlets every 4 feet but plan shows different spacing.',
      answer: 'Follow NEC 210.52(C) - outlets every 4 feet along counter. Add 2 additional outlets per revised plan.',
    },
    {
      subject: 'Dedicated circuit for HVAC',
      question: 'New mini-split requires 240V. Is a dedicated circuit included in scope or is this an add?',
      answer: 'Dedicated 30A 240V circuit is included. Run from new sub-panel in utility room.',
    },
  ],
  plumbing: [
    {
      subject: 'Water heater location change',
      question: 'Architectural plans show water heater in garage but mechanical shows utility closet. Please confirm intended location.',
      answer: 'Install in utility closet as shown on M-100. Ignore garage location on A-103.',
    },
    {
      subject: 'Drain line routing',
      question: 'New bathroom drain appears to conflict with existing foundation. Can we route through soffit instead?',
      answer: 'Approved. Route through soffit with proper slope. Provide access panel for cleanout.',
    },
    {
      subject: 'Shower valve specification',
      question: 'Plans call for "pressure-balancing valve" but owner requested thermostatic. Which should we install?',
      answer: 'Install thermostatic per owner request. Owner to pay upgrade cost of $450.',
    },
  ],
  finishes: [
    {
      subject: 'Tile pattern at shower niche',
      question: 'Detail shows subway tile but doesn\'t indicate pattern at shower niche. Please provide tile layout.',
      answer: 'Stack bond pattern on niche interior. See attached sketch SK-2.',
    },
    {
      subject: 'Cabinet hardware selection',
      question: 'Specs list "brushed nickel hardware" but don\'t specify style. Please confirm if knobs or pulls are required.',
      answer: 'Bar pulls for drawers, knobs for doors. See spec update in addendum 2.',
    },
    {
      subject: 'Paint color clarification',
      question: 'Color schedule shows "SW 7015" for walls but this is a gray that conflicts with trim color. Please confirm.',
      answer: 'Correct. Owner approved SW 7015 Repose Gray for walls. Trim remains SW 7006 Extra White.',
    },
  ],
  coordination: [
    {
      subject: 'Appliance rough-in dimensions',
      question: 'Cabinet plans show 30" range but appliance schedule lists 36". Which is correct?',
      answer: '36" range is correct. Revise cabinet plans per ASK-001. Cabinet opening to be 36.5".',
    },
    {
      subject: 'HVAC duct conflict with beam',
      question: 'Proposed duct route conflicts with structural beam at grid B-4. Requesting coordination meeting.',
      answer: 'Reroute duct below beam with offset fittings. Max 6" below ceiling. See RFI response drawing.',
    },
    {
      subject: 'Window delivery schedule',
      question: 'Windows have 6-week lead time. Please confirm order date to maintain schedule.',
      answer: 'Order immediately. Delivery required by March 15 to maintain schedule. Confirm order receipt.',
    },
  ],
};

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

// RFI submitters
const SUBMITTERS = [
  { id: DEMO_USERS.foreman.uid, name: DEMO_USERS.foreman.displayName },
  { id: DEMO_USERS.pm.uid, name: DEMO_USERS.pm.displayName },
  { id: 'sub-peak-plumbing', name: 'Peak Plumbing Solutions' },
  { id: 'sub-mountain-electric', name: 'Mountain Electric Inc' },
];

// ============================================
// Seed Function
// ============================================

async function seedRFIs(): Promise<number> {
  logSection('Seeding RFIs');

  const rfisRef = db.collection('organizations').doc(DEMO_ORG_ID).collection('rfis');
  const rfis: any[] = [];
  let rfiCounter = 0;

  for (const project of DEMO_PROJECTS) {
    const numRFIs = randomInt(5, 10);
    const categories = Object.keys(RFI_TEMPLATES);

    for (let i = 0; i < numRFIs; i++) {
      rfiCounter++;
      const category = randomItem(categories) as keyof typeof RFI_TEMPLATES;
      const template = randomItem(RFI_TEMPLATES[category]);
      const submitter = randomItem(SUBMITTERS);

      // Determine status and dates
      const submittedAt = daysAgo(randomInt(3, 60));
      const statuses = ['open', 'open', 'answered', 'answered', 'answered', 'closed'];
      const status = randomItem(statuses);

      const hasAnswer = status === 'answered' || status === 'closed';
      const answeredAt = hasAnswer ? new Date(submittedAt.getTime() + randomInt(1, 7) * 86400000) : null;

      const rfi = {
        id: generateId('rfi'),
        orgId: DEMO_ORG_ID,
        projectId: project.id,
        projectName: project.name,
        number: `RFI-${String(rfiCounter).padStart(3, '0')}`,
        subject: template.subject,
        question: template.question,
        answer: hasAnswer ? template.answer : null,
        status: status,
        priority: randomItem(['low', 'medium', 'medium', 'high', 'urgent']),
        category: category,
        submittedBy: submitter.id,
        submittedByName: submitter.name,
        submittedAt: submittedAt,
        answeredBy: hasAnswer ? DEMO_USERS.owner.uid : null,
        answeredByName: hasAnswer ? DEMO_USERS.owner.displayName : null,
        answeredAt: answeredAt,
        dueDate: new Date(submittedAt.getTime() + 7 * 86400000), // 7 days after submission
        closedAt: status === 'closed' ? new Date(answeredAt!.getTime() + randomInt(1, 3) * 86400000) : null,
        attachments: [],
        costImpact: randomItem([null, null, null, randomInt(100, 2000)]),
        scheduleImpact: randomItem([null, null, null, randomInt(1, 5)]),
        relatedRFIs: [],
        createdAt: submittedAt,
        isDemoData: true,
      };

      rfis.push(rfi);
      logProgress(`Created RFI ${rfi.number}: ${rfi.subject.substring(0, 40)}...`);
    }
  }

  await executeBatchWrites(
    db,
    rfis,
    (batch, rfi) => {
      const ref = rfisRef.doc(rfi.id);
      batch.set(ref, {
        ...rfi,
        submittedAt: toTimestamp(rfi.submittedAt),
        answeredAt: rfi.answeredAt ? toTimestamp(rfi.answeredAt) : null,
        dueDate: toTimestamp(rfi.dueDate),
        closedAt: rfi.closedAt ? toTimestamp(rfi.closedAt) : null,
        createdAt: toTimestamp(rfi.createdAt),
        updatedAt: Timestamp.now(),
      });
    },
    'RFIs'
  );

  logSuccess(`Created ${rfis.length} RFIs`);
  return rfis.length;
}

// ============================================
// Main Export
// ============================================

export { seedRFIs };

// Run if executed directly
if (require.main === module) {
  seedRFIs()
    .then((count) => {
      console.log(`\n✅ Created ${count} RFIs`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error seeding RFIs:', error);
      process.exit(1);
    });
}
