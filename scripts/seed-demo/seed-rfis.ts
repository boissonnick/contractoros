/**
 * Seed RFIs (Requests for Information)
 *
 * Creates 5-10 RFIs per project with realistic construction questions and answers.
 * Uses the named "contractoros" database via shared db.ts module.
 */

import { Timestamp } from 'firebase-admin/firestore';
import { getDb } from './db';
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

// ============================================
// RFI Status and Priority Types (matching types/index.ts)
// ============================================

type RFIStatus = 'draft' | 'open' | 'pending_response' | 'answered' | 'closed';
type RFIPriority = 'low' | 'medium' | 'high' | 'urgent';

// ============================================
// Demo Projects
// ============================================

const DEMO_PROJECTS = [
  { id: 'demo-proj-smith-kitchen', name: 'Smith Kitchen Remodel' },
  { id: 'demo-proj-garcia-bath', name: 'Garcia Master Bath' },
  { id: 'demo-proj-mainst-retail', name: 'Main St. Retail Storefront' },
  { id: 'demo-proj-cafe-ti', name: 'Downtown Cafe TI' },
  { id: 'demo-proj-thompson-deck', name: 'Thompson Deck Build' },
  { id: 'demo-proj-office-park', name: 'Office Park Suite 200' },
  { id: 'demo-proj-garcia-basement', name: 'Garcia Basement Finish' },
];

// ============================================
// RFI Templates by Category
// ============================================

const RFI_TEMPLATES = {
  structural: [
    {
      subject: 'Beam size clarification at kitchen opening',
      question: 'Drawing A-102 shows a beam at the kitchen opening but doesn\'t specify the size. Please confirm the required beam dimensions and connection details.',
      answer: 'Use 2x LVL 1.75 x 9.5 inch with Simpson strong-tie hangers at each end. See revised detail SK-101.',
      drawingRef: 'A-102',
      specSection: '06 10 00 - Rough Carpentry',
      location: 'Kitchen - North wall',
    },
    {
      subject: 'Foundation reinforcement requirements',
      question: 'The soil report indicates expansive clay. Are there additional foundation reinforcement requirements beyond what\'s shown on S-100?',
      answer: 'Add #5 rebar at 12" O.C. both ways in the slab and extend footing depth to 36". See ASI-003.',
      drawingRef: 'S-100',
      specSection: '03 30 00 - Cast-in-Place Concrete',
      location: 'Foundation - All areas',
    },
    {
      subject: 'Load-bearing wall confirmation',
      question: 'Please confirm if the wall between kitchen and dining room is load-bearing. Demo plans are unclear.',
      answer: 'Confirmed load-bearing. Temporary shoring required during work. Install LVL header per SK-102.',
      drawingRef: 'A-105',
      specSection: '06 10 00 - Rough Carpentry',
      location: 'Kitchen/Dining divider wall',
    },
    {
      subject: 'Structural beam sizing for header',
      question: 'Verify load calculations for the proposed 8-foot opening header. Current plans show 4x12 but span tables suggest larger may be needed.',
      answer: 'Upgrade to (2) 1.75" x 11.25" LVL. Engineer has provided revised calculation - see attachment.',
      drawingRef: 'S-102',
      specSection: '06 10 00 - Rough Carpentry',
      location: 'Living room - West wall',
    },
  ],
  electrical: [
    {
      subject: 'Panel upgrade requirements',
      question: 'Existing panel is 100A. New loads appear to exceed capacity. Please confirm if panel upgrade is required.',
      answer: 'Upgrade to 200A panel required. Include new meter base and weather head. Coordinate with utility company.',
      drawingRef: 'E-101',
      specSection: '26 24 00 - Switchboards and Panelboards',
      location: 'Electrical room / Garage',
    },
    {
      subject: 'Outlet spacing in kitchen',
      question: 'Please clarify outlet spacing requirements along the kitchen counter. Code requires outlets every 4 feet but plan shows different spacing.',
      answer: 'Follow NEC 210.52(C) - outlets every 4 feet along counter. Add 2 additional outlets per revised plan E-102.',
      drawingRef: 'E-102',
      specSection: '26 27 00 - Low-Voltage Distribution Equipment',
      location: 'Kitchen counter - all areas',
    },
    {
      subject: 'Dedicated circuit for HVAC',
      question: 'New mini-split requires 240V. Is a dedicated circuit included in scope or is this an add?',
      answer: 'Dedicated 30A 240V circuit is included in base scope. Run from new sub-panel in utility room.',
      drawingRef: 'E-103',
      specSection: '26 05 00 - Common Work Results',
      location: 'HVAC equipment location',
    },
    {
      subject: 'Clarification on electrical panel location per plan sheet E-101',
      question: 'Plan sheet E-101 shows panel location conflicting with architectural plans. Arch shows panel on south wall, E-101 shows east wall. Please clarify.',
      answer: 'Install per architectural plans on south wall. Electrical plans will be revised in next ASI.',
      drawingRef: 'E-101',
      specSection: '26 24 00 - Switchboards and Panelboards',
      location: 'Garage - South wall',
    },
  ],
  plumbing: [
    {
      subject: 'Water heater location change',
      question: 'Architectural plans show water heater in garage but mechanical shows utility closet. Please confirm intended location.',
      answer: 'Install in utility closet as shown on M-100. Ignore garage location on A-103. Ensure proper venting.',
      drawingRef: 'M-100',
      specSection: '22 30 00 - Plumbing Equipment',
      location: 'Utility closet',
    },
    {
      subject: 'Drain line routing',
      question: 'New bathroom drain appears to conflict with existing foundation. Can we route through soffit instead?',
      answer: 'Approved. Route through soffit with proper slope (1/4" per foot min). Provide access panel for cleanout.',
      drawingRef: 'P-102',
      specSection: '22 10 00 - Plumbing Piping',
      location: 'Master bathroom',
    },
    {
      subject: 'Shower valve specification',
      question: 'Plans call for "pressure-balancing valve" but owner requested thermostatic. Which should we install?',
      answer: 'Install thermostatic per owner request. Owner to pay upgrade cost of $450. See CO-002.',
      drawingRef: 'P-103',
      specSection: '22 40 00 - Plumbing Fixtures',
      location: 'Master shower',
    },
    {
      subject: 'Foundation waterproofing detail at grade change',
      question: 'There is a 3-foot grade change at the rear of the foundation. Please provide waterproofing detail for this transition area.',
      answer: 'Apply Bituthene 4000 membrane with protection board. Extend 6" above grade. See detail SK-P01.',
      drawingRef: 'A-401',
      specSection: '07 10 00 - Dampproofing and Waterproofing',
      location: 'Rear foundation wall',
    },
  ],
  finishes: [
    {
      subject: 'Tile pattern at shower niche',
      question: 'Detail shows subway tile but doesn\'t indicate pattern at shower niche. Please provide tile layout.',
      answer: 'Stack bond pattern on niche interior, running bond on main walls. See attached sketch SK-F01.',
      drawingRef: 'ID-201',
      specSection: '09 30 00 - Tiling',
      location: 'Master shower niche',
    },
    {
      subject: 'Cabinet hardware selection',
      question: 'Specs list "brushed nickel hardware" but don\'t specify style. Please confirm if knobs or pulls are required.',
      answer: 'Bar pulls for drawers (5" CC), knobs for doors (1.25" dia). See spec update in addendum 2.',
      drawingRef: 'ID-105',
      specSection: '12 35 00 - Residential Casework',
      location: 'Kitchen and bathrooms',
    },
    {
      subject: 'Paint color clarification',
      question: 'Color schedule shows "SW 7015" for walls but this is a gray that conflicts with trim color. Please confirm.',
      answer: 'Correct. Owner approved SW 7015 Repose Gray for walls. Trim remains SW 7006 Extra White.',
      drawingRef: 'ID-001',
      specSection: '09 91 00 - Painting',
      location: 'All interior walls',
    },
    {
      subject: 'Exterior paint color confirmation - multiple samples provided',
      question: 'Three paint samples were provided for siding. Owner needs to confirm final selection before ordering.',
      answer: 'Owner selected SW 6119 Antique White for siding, SW 6109 Hopsack for trim. Proceed with order.',
      drawingRef: 'A-201',
      specSection: '09 91 00 - Painting',
      location: 'Exterior siding and trim',
    },
    {
      subject: 'Tile pattern clarification for master bathroom',
      question: 'Floor tile pattern not specified. Herringbone shown in rendering but running bond in section. Please clarify.',
      answer: 'Install herringbone pattern per rendering. Running bond was from earlier design. See updated ID-203.',
      drawingRef: 'ID-203',
      specSection: '09 30 00 - Tiling',
      location: 'Master bathroom floor',
    },
  ],
  coordination: [
    {
      subject: 'Appliance rough-in dimensions',
      question: 'Cabinet plans show 30" range but appliance schedule lists 36". Which is correct?',
      answer: '36" range is correct. Revise cabinet plans per ASK-001. Cabinet opening to be 36.5".',
      drawingRef: 'ID-106',
      specSection: '11 31 00 - Residential Appliances',
      location: 'Kitchen range location',
    },
    {
      subject: 'HVAC duct conflict with beam',
      question: 'Proposed duct route conflicts with structural beam at grid B-4. Requesting coordination meeting.',
      answer: 'Reroute duct below beam with offset fittings. Max 6" below ceiling. See RFI response drawing RFI-R01.',
      drawingRef: 'M-201',
      specSection: '23 31 00 - HVAC Ducts and Casings',
      location: 'Great room - Grid B-4',
    },
    {
      subject: 'Window delivery schedule',
      question: 'Windows have 6-week lead time. Please confirm order date to maintain schedule.',
      answer: 'Order immediately. Delivery required by March 15 to maintain schedule. Confirm order receipt to PM.',
      drawingRef: 'A-301',
      specSection: '08 50 00 - Windows',
      location: 'All exterior windows',
    },
    {
      subject: 'Window manufacturer substitution request - Anderson vs Pella',
      question: 'Specified Andersen windows have 12-week lead time. Can we substitute with Pella which is available in 4 weeks?',
      answer: 'Approved. Pella Lifestyle Series acceptable substitute. Match specified U-factor and SHGC values.',
      drawingRef: 'A-301',
      specSection: '08 50 00 - Windows',
      location: 'All exterior windows',
    },
  ],
  site: [
    {
      subject: 'Grading at driveway transition',
      question: 'As-built survey shows existing grade 4" higher than plans at driveway. How should we handle transition?',
      answer: 'Adjust new driveway to meet existing. Taper over 10 feet. Maximum slope 8%. See revised grading plan.',
      drawingRef: 'C-101',
      specSection: '31 20 00 - Earth Moving',
      location: 'Driveway entrance',
    },
    {
      subject: 'Underground utilities conflict',
      question: 'Potholing revealed unmarked gas line in proposed trench path. Requesting direction.',
      answer: 'Offset trench 3 feet west. Maintain 18" clearance from gas line. Call 811 to mark updated location.',
      drawingRef: 'C-201',
      specSection: '31 23 00 - Excavation and Fill',
      location: 'Side yard utility trench',
    },
    {
      subject: 'Retaining wall height clarification',
      question: 'Plans show 4-foot retaining wall but actual grade requires 5.5 feet. Engineering review needed.',
      answer: 'Structural engineer reviewing. Expect ASI with revised design within 5 business days.',
      drawingRef: 'L-201',
      specSection: '32 32 00 - Retaining Walls',
      location: 'Backyard - East property line',
    },
  ],
};

// ============================================
// RFI Submitters
// ============================================

const SUBMITTERS = [
  { id: DEMO_USERS.foreman.uid, name: DEMO_USERS.foreman.displayName },
  { id: DEMO_USERS.pm.uid, name: DEMO_USERS.pm.displayName },
  { id: 'sub-peak-plumbing', name: 'Peak Plumbing Solutions' },
  { id: 'sub-mountain-electric', name: 'Mountain Electric Inc' },
  { id: 'sub-summit-hvac', name: 'Summit HVAC Pros' },
];

// ============================================
// Helper Functions
// ============================================

function createHistoryEntry(
  action: 'created' | 'submitted' | 'assigned' | 'answered' | 'closed',
  userId: string,
  userName: string,
  timestamp: Date,
  details?: string
) {
  return {
    id: generateId('hist'),
    action,
    userId,
    userName,
    details,
    timestamp,
  };
}

// ============================================
// Seed Function
// ============================================

async function seedRFIs(): Promise<number> {
  logSection('Seeding RFIs');

  const db = getDb();
  const rfisRef = db.collection('organizations').doc(DEMO_ORG_ID).collection('rfis');
  const rfis: any[] = [];
  let rfiCounter = 0;

  for (const project of DEMO_PROJECTS) {
    const numRFIs = randomInt(3, 6); // 3-6 RFIs per project
    const categories = Object.keys(RFI_TEMPLATES) as (keyof typeof RFI_TEMPLATES)[];

    for (let i = 0; i < numRFIs; i++) {
      rfiCounter++;
      const category = randomItem(categories);
      const template = randomItem(RFI_TEMPLATES[category]);
      const submitter = randomItem(SUBMITTERS);

      // Determine status and dates
      const createdAt = daysAgo(randomInt(5, 90));
      const submittedAt = new Date(createdAt.getTime() + randomInt(0, 2) * 86400000);

      // Distribution: 15% draft, 25% open, 10% pending, 30% answered, 20% closed
      const statusRoll = Math.random();
      let status: RFIStatus;
      if (statusRoll < 0.15) {
        status = 'draft';
      } else if (statusRoll < 0.40) {
        status = 'open';
      } else if (statusRoll < 0.50) {
        status = 'pending_response';
      } else if (statusRoll < 0.80) {
        status = 'answered';
      } else {
        status = 'closed';
      }

      const hasAnswer = status === 'answered' || status === 'closed';
      const answeredAt = hasAnswer
        ? new Date(submittedAt.getTime() + randomInt(1, 10) * 86400000)
        : undefined;
      const closedAt = status === 'closed' && answeredAt
        ? new Date(answeredAt.getTime() + randomInt(1, 5) * 86400000)
        : undefined;

      // Due date: 7-14 days after submission
      const dueDate = new Date(submittedAt.getTime() + randomInt(7, 14) * 86400000);

      // Build history
      const history = [
        createHistoryEntry('created', submitter.id, submitter.name, createdAt),
      ];

      if (status !== 'draft') {
        history.push(
          createHistoryEntry('submitted', submitter.id, submitter.name, submittedAt)
        );
      }

      if (hasAnswer && answeredAt) {
        history.push(
          createHistoryEntry(
            'answered',
            DEMO_USERS.owner.uid,
            DEMO_USERS.owner.displayName,
            answeredAt,
            'Response provided'
          )
        );
      }

      if (status === 'closed' && closedAt) {
        history.push(
          createHistoryEntry(
            'closed',
            DEMO_USERS.pm.uid,
            DEMO_USERS.pm.displayName,
            closedAt,
            'RFI resolved and closed'
          )
        );
      }

      // Priority distribution: 40% medium, 25% low, 25% high, 10% urgent
      const priorityRoll = Math.random();
      let priority: RFIPriority;
      if (priorityRoll < 0.25) {
        priority = 'low';
      } else if (priorityRoll < 0.65) {
        priority = 'medium';
      } else if (priorityRoll < 0.90) {
        priority = 'high';
      } else {
        priority = 'urgent';
      }

      // Cost and schedule impact (30% chance of having impacts)
      const hasCostImpact = Math.random() < 0.30;
      const hasScheduleImpact = Math.random() < 0.30;

      const rfi = {
        id: generateId('rfi'),
        orgId: DEMO_ORG_ID,
        projectId: project.id,
        number: `RFI-${String(rfiCounter).padStart(3, '0')}`,
        subject: template.subject,
        question: template.question,
        answer: hasAnswer ? template.answer : undefined,
        officialResponse: hasAnswer ? template.answer : undefined,
        status,
        priority,

        // References
        drawingRef: template.drawingRef,
        specSection: template.specSection,
        location: template.location,

        // Routing
        submittedBy: submitter.id,
        submittedByName: submitter.name,
        createdBy: submitter.id,
        createdByName: submitter.name,
        assignedTo: status !== 'draft' ? DEMO_USERS.owner.uid : undefined,
        assignedToName: status !== 'draft' ? DEMO_USERS.owner.displayName : undefined,
        answeredBy: hasAnswer ? DEMO_USERS.owner.uid : undefined,
        answeredByName: hasAnswer ? DEMO_USERS.owner.displayName : undefined,

        // Dates
        dueDate,
        submittedAt: status !== 'draft' ? submittedAt : undefined,
        answeredAt,
        respondedAt: answeredAt,
        closedAt,

        // Attachments (empty for seed data)
        attachments: [],

        // Impact
        costImpact: hasCostImpact ? randomInt(200, 5000) : undefined,
        scheduleImpact: hasScheduleImpact ? randomInt(1, 7) : undefined, // days

        // History
        history,

        // Timestamps
        createdAt,
        updatedAt: closedAt || answeredAt || submittedAt || createdAt,

        // Metadata
        isDemoData: true,
      };

      rfis.push(rfi);
      logProgress(`Created RFI ${rfi.number}: ${rfi.subject.substring(0, 50)}...`);
    }
  }

  // Write to Firestore
  await executeBatchWrites(
    db,
    rfis,
    (batch, rfi) => {
      const ref = rfisRef.doc(rfi.id);
      batch.set(ref, {
        ...rfi,
        // Convert dates to Firestore Timestamps
        dueDate: toTimestamp(rfi.dueDate),
        submittedAt: rfi.submittedAt ? toTimestamp(rfi.submittedAt) : null,
        answeredAt: rfi.answeredAt ? toTimestamp(rfi.answeredAt) : null,
        respondedAt: rfi.respondedAt ? toTimestamp(rfi.respondedAt) : null,
        closedAt: rfi.closedAt ? toTimestamp(rfi.closedAt) : null,
        createdAt: toTimestamp(rfi.createdAt),
        updatedAt: toTimestamp(rfi.updatedAt),
        // Convert history timestamps
        history: rfi.history.map((entry: any) => ({
          ...entry,
          timestamp: toTimestamp(entry.timestamp),
        })),
      });
    },
    'RFIs'
  );

  logSuccess(`Created ${rfis.length} RFIs across ${DEMO_PROJECTS.length} projects`);
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
      console.log(`\nCompleted: Created ${count} RFIs`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error seeding RFIs:', error);
      process.exit(1);
    });
}
