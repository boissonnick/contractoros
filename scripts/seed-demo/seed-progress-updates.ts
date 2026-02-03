/**
 * Seed Progress Updates / Reports for Demo Projects
 * Creates client-facing progress updates with photos, completion percentages, and narratives
 *
 * Run: npx ts-node seed-progress-updates.ts
 */

import { getDb } from './db';
import {
  DEMO_ORG_ID,
  DEMO_USERS,
  daysAgo,
  monthsAgo,
  toTimestamp,
  generateId,
  randomInt,
  randomItem,
  logSection,
  logProgress,
  logSuccess,
} from './utils';

interface ProgressUpdate {
  projectId: string;
  date: Date;
  title: string;
  summary: string;
  progressPercent: number;
  phaseName: string;
  highlights: string[];
  nextSteps: string[];
  issues?: string[];
  photoCount: number;
  sentToClient: boolean;
  sentAt?: Date;
}

// Progress update templates by project type
const PROGRESS_TEMPLATES = {
  kitchen: {
    phases: ['Demo & Prep', 'Rough-In', 'Cabinets', 'Countertops', 'Tile & Backsplash', 'Final Details'],
    highlights: [
      'Removed existing cabinets and appliances safely',
      'New plumbing rough-in complete and inspected',
      'Electrical circuits updated to code',
      'Cabinet boxes installed and leveled',
      'Countertop template completed',
      'Quartz countertops installed beautifully',
      'Backsplash tile pattern approved and started',
      'Under-cabinet lighting wired and tested',
      'New flooring installed throughout',
      'Appliances delivered and installed',
      'Final touch-ups and cleaning complete',
    ],
    nextSteps: [
      'Begin electrical rough-in tomorrow',
      'Cabinet delivery scheduled for next week',
      'Countertop template appointment set',
      'Tile installation begins Monday',
      'Final city inspection scheduled',
      'Appliance installation this week',
      'Final walkthrough to be scheduled',
    ],
  },
  bathroom: {
    phases: ['Demo', 'Plumbing & Electrical', 'Waterproofing', 'Tile Work', 'Fixtures', 'Final Details'],
    highlights: [
      'Old fixtures and tile removed',
      'Subfloor inspected and repaired where needed',
      'New plumbing lines installed',
      'Electrical updated for heated floors',
      'Waterproofing membrane applied and tested',
      'Shower pan complete - flood test passed',
      'Wall tile installation in progress',
      'Floor tile complete and grouted',
      'Vanity and mirrors installed',
      'Fixtures installed and tested',
      'Final grout sealing complete',
    ],
    nextSteps: [
      'Plumbing rough-in inspection tomorrow',
      'Waterproofing to begin after inspection',
      'Tile delivery arriving Thursday',
      'Grout color to be confirmed',
      'Vanity installation next week',
      'Final inspection to be scheduled',
    ],
  },
  commercial: {
    phases: ['Demo', 'Framing', 'MEP Rough-In', 'Drywall', 'Finishes', 'Punch List'],
    highlights: [
      'Demolition complete - space cleared',
      'New wall layout marked and framing started',
      'All walls framed per approved plans',
      'HVAC ductwork installation complete',
      'Electrical rough-in passed inspection',
      'Fire sprinkler modifications approved',
      'Drywall hung throughout',
      'Taping and mudding in progress',
      'Paint applied - colors approved',
      'Flooring installation complete',
      'Light fixtures installed and tested',
      'Final punch list items being addressed',
    ],
    nextSteps: [
      'Framing inspection scheduled',
      'MEP rough-in to begin',
      'Fire marshal inspection next week',
      'Drywall delivery arriving tomorrow',
      'Paint colors to be confirmed',
      'Flooring materials on order',
      'TCO inspection to be scheduled',
    ],
  },
  deck: {
    phases: ['Permits & Layout', 'Footings', 'Framing', 'Decking', 'Railing', 'Final'],
    highlights: [
      'Permit approved by city',
      'Deck layout marked and confirmed',
      'Footing holes dug to proper depth',
      'Concrete footings poured and curing',
      'Ledger board attached securely',
      'Main beam and joists installed',
      'Framing inspection passed',
      'Composite decking installation started',
      'Decking boards installed and spaced',
      'Railing posts installed',
      'Railing and balusters complete',
      'Stairs built and secured',
    ],
    nextSteps: [
      'Footings need 48 hours to cure',
      'Framing to begin tomorrow',
      'Decking material delivery scheduled',
      'Railing materials on order',
      'Final inspection to be scheduled',
      'Stair lighting to be installed',
    ],
  },
  basement: {
    phases: ['Framing', 'Egress Window', 'Rough MEP', 'Insulation', 'Drywall', 'Flooring', 'Final'],
    highlights: [
      'Wall layout approved and framing started',
      'All interior walls framed',
      'Egress window opening cut',
      'Window well installed',
      'Egress window passed inspection',
      'Bathroom plumbing rough-in complete',
      'Electrical circuits added per plan',
      'HVAC supply and returns installed',
      'Insulation installed in all exterior walls',
      'Vapor barrier complete',
      'Drywall hung throughout',
      'Ceiling completed with can lights',
      'LVP flooring installed',
      'Bathroom tile complete',
    ],
    nextSteps: [
      'Egress inspection scheduled',
      'Plumbing rough-in to begin',
      'Electrical inspection next week',
      'Insulation delivery arriving',
      'Drywall installation begins Monday',
      'Flooring selections needed',
      'Final inspection to be scheduled',
    ],
  },
};

// Project configurations matching seed-projects.ts
const PROJECT_PROGRESS_CONFIG = [
  // COMPLETED PROJECTS - Full history of updates
  {
    projectId: 'demo-proj-smith-kitchen',
    type: 'kitchen' as const,
    updates: [
      { daysAgo: 270, percent: 5, phase: 0 },
      { daysAgo: 266, percent: 15, phase: 0 },
      { daysAgo: 260, percent: 25, phase: 1 },
      { daysAgo: 252, percent: 40, phase: 2 },
      { daysAgo: 245, percent: 55, phase: 2 },
      { daysAgo: 238, percent: 70, phase: 3 },
      { daysAgo: 232, percent: 80, phase: 4 },
      { daysAgo: 225, percent: 90, phase: 5 },
      { daysAgo: 240, percent: 100, phase: 5 },
    ],
  },
  {
    projectId: 'demo-proj-garcia-bath',
    type: 'bathroom' as const,
    updates: [
      { daysAgo: 90, percent: 5, phase: 0 },
      { daysAgo: 85, percent: 20, phase: 1 },
      { daysAgo: 78, percent: 35, phase: 2 },
      { daysAgo: 70, percent: 55, phase: 3 },
      { daysAgo: 65, percent: 75, phase: 4 },
      { daysAgo: 60, percent: 90, phase: 5 },
      { daysAgo: 58, percent: 100, phase: 5 },
    ],
  },
  {
    projectId: 'demo-proj-mainst-retail',
    type: 'commercial' as const,
    updates: [
      { daysAgo: 210, percent: 5, phase: 0 },
      { daysAgo: 200, percent: 15, phase: 1 },
      { daysAgo: 185, percent: 30, phase: 2 },
      { daysAgo: 165, percent: 50, phase: 3 },
      { daysAgo: 145, percent: 70, phase: 4 },
      { daysAgo: 125, percent: 85, phase: 4 },
      { daysAgo: 115, percent: 95, phase: 5 },
      { daysAgo: 105, percent: 100, phase: 5 },
    ],
  },
  {
    projectId: 'demo-proj-cafe-ti',
    type: 'commercial' as const,
    updates: [
      { daysAgo: 75, percent: 5, phase: 0 },
      { daysAgo: 67, percent: 20, phase: 1 },
      { daysAgo: 55, percent: 40, phase: 2 },
      { daysAgo: 45, percent: 60, phase: 3 },
      { daysAgo: 38, percent: 80, phase: 4 },
      { daysAgo: 32, percent: 95, phase: 5 },
      { daysAgo: 28, percent: 100, phase: 5 },
    ],
  },
  {
    projectId: 'demo-proj-wilson-fence',
    type: 'deck' as const, // Using deck templates for fence
    updates: [
      { daysAgo: 180, percent: 10, phase: 0 },
      { daysAgo: 178, percent: 40, phase: 1 },
      { daysAgo: 176, percent: 75, phase: 2 },
      { daysAgo: 174, percent: 100, phase: 3 },
    ],
  },

  // ACTIVE PROJECTS - Recent updates
  {
    projectId: 'demo-proj-thompson-deck',
    type: 'deck' as const,
    updates: [
      { daysAgo: 14, percent: 10, phase: 0 },
      { daysAgo: 10, percent: 25, phase: 1 },
      { daysAgo: 5, percent: 45, phase: 2 },
      { daysAgo: 2, percent: 50, phase: 3 },
    ],
  },
  {
    projectId: 'demo-proj-garcia-basement',
    type: 'basement' as const,
    updates: [
      { daysAgo: 21, percent: 10, phase: 0 },
      { daysAgo: 14, percent: 25, phase: 1 },
      { daysAgo: 7, percent: 35, phase: 2 },
      { daysAgo: 3, percent: 40, phase: 2 },
    ],
  },
  {
    projectId: 'demo-proj-office-park',
    type: 'commercial' as const,
    updates: [
      { daysAgo: 30, percent: 5, phase: 0 },
      { daysAgo: 25, percent: 15, phase: 0 },
      { daysAgo: 18, percent: 25, phase: 1 },
      { daysAgo: 10, percent: 30, phase: 1 },
    ],
  },
  {
    projectId: 'demo-proj-brown-kitchen',
    type: 'kitchen' as const,
    updates: [
      { daysAgo: 7, percent: 10, phase: 0 },
      { daysAgo: 3, percent: 15, phase: 0 },
    ],
  },
];

async function seedProgressUpdates() {
  const db = getDb();

  logSection('Seeding Progress Updates');

  const batch = db.batch();
  let totalUpdates = 0;

  for (const config of PROJECT_PROGRESS_CONFIG) {
    const templates = PROGRESS_TEMPLATES[config.type];

    for (const update of config.updates) {
      const updateId = generateId('progress');
      const updateDate = daysAgo(update.daysAgo);
      const phaseName = templates.phases[Math.min(update.phase, templates.phases.length - 1)];

      // Select random highlights and next steps
      const highlightCount = randomInt(2, 4);
      const nextStepCount = randomInt(2, 3);

      const highlights = [];
      const usedHighlightIndices = new Set<number>();
      while (highlights.length < highlightCount && highlights.length < templates.highlights.length) {
        const idx = randomInt(0, templates.highlights.length - 1);
        if (!usedHighlightIndices.has(idx)) {
          usedHighlightIndices.add(idx);
          highlights.push(templates.highlights[idx]);
        }
      }

      const nextSteps = [];
      const usedNextStepIndices = new Set<number>();
      while (nextSteps.length < nextStepCount && nextSteps.length < templates.nextSteps.length) {
        const idx = randomInt(0, templates.nextSteps.length - 1);
        if (!usedNextStepIndices.has(idx)) {
          usedNextStepIndices.add(idx);
          nextSteps.push(templates.nextSteps[idx]);
        }
      }

      // Generate title based on progress
      let title: string;
      if (update.percent === 100) {
        title = 'Project Complete! 🎉';
      } else if (update.percent >= 90) {
        title = 'Final Touches Underway';
      } else if (update.percent >= 75) {
        title = 'Approaching Completion';
      } else if (update.percent >= 50) {
        title = `${phaseName} Progress Update`;
      } else if (update.percent >= 25) {
        title = `${phaseName} Well Underway`;
      } else {
        title = `${phaseName} Getting Started`;
      }

      // Generate summary
      const summaryOptions = [
        `Great progress this week on your ${config.type} project. We've completed several key milestones and are on track with the schedule.`,
        `Your project is moving along nicely. The team has been working hard and we're pleased with the quality of work.`,
        `Here's your weekly update. Everything is proceeding according to plan with no significant issues to report.`,
        `We've made excellent progress since the last update. The ${phaseName.toLowerCase()} phase is going smoothly.`,
        `The team continues to make steady progress. Quality remains our top priority throughout the project.`,
      ];

      const progressData = {
        id: updateId,
        orgId: DEMO_ORG_ID,
        projectId: config.projectId,
        title,
        summary: randomItem(summaryOptions),
        progressPercent: update.percent,
        phaseName,
        highlights,
        nextSteps,
        issues: update.percent < 50 && Math.random() > 0.7 ? ['Minor material delay - no impact to schedule'] : [],
        photoCount: randomInt(2, 6),
        weather: randomItem(['Sunny', 'Partly Cloudy', 'Clear', 'Overcast']),
        crewOnSite: randomInt(2, 5),
        hoursWorkedToday: randomInt(6, 10),
        sentToClient: true,
        sentAt: toTimestamp(updateDate),
        createdBy: randomItem([DEMO_USERS.pm.uid, DEMO_USERS.foreman.uid]),
        createdByName: randomItem([DEMO_USERS.pm.displayName, DEMO_USERS.foreman.displayName]),
        createdAt: toTimestamp(updateDate),
        updatedAt: toTimestamp(updateDate),
        isDemoData: true,
      };

      const docRef = db.collection('organizations').doc(DEMO_ORG_ID).collection('progressUpdates').doc(updateId);
      batch.set(docRef, progressData);
      totalUpdates++;
    }

    logProgress(`${config.projectId}: ${config.updates.length} updates`);
  }

  await batch.commit();
  logSuccess(`Created ${totalUpdates} progress updates across ${PROJECT_PROGRESS_CONFIG.length} projects`);
}

// Run if called directly
seedProgressUpdates()
  .then(() => {
    console.log('\n✅ Progress updates seeded successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error seeding progress updates:', error);
    process.exit(1);
  });
