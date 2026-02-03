/**
 * Seed Milestones for Demo Projects
 * Adds milestone data to project phases for ProgressDashboard
 *
 * Run: npx ts-node seed-milestones.ts
 */

import { getDb } from './db';
import {
  DEMO_ORG_ID,
  daysAgo,
  monthsAgo,
  toTimestamp,
  generateId,
  logSection,
  logProgress,
  logSuccess,
  logWarning,
} from './utils';

interface Milestone {
  id: string;
  title: string;
  date: Date;
  completed: boolean;
  completedAt?: Date;
  description?: string;
}

interface ProjectMilestones {
  projectId: string;
  milestones: Milestone[];
}

// Project milestone definitions based on project timelines from seed-projects.ts
const PROJECT_MILESTONES: ProjectMilestones[] = [
  // ============================================
  // COMPLETED PROJECTS
  // ============================================
  {
    projectId: 'demo-proj-smith-kitchen',
    milestones: [
      { id: generateId('ms'), title: 'Permit Approved', date: monthsAgo(9), completed: true, completedAt: monthsAgo(9), description: 'Building permit issued by city' },
      { id: generateId('ms'), title: 'Demo Complete', date: daysAgo(270 - 4), completed: true, completedAt: daysAgo(270 - 4), description: 'All demolition and prep work finished' },
      { id: generateId('ms'), title: 'Rough Inspection Passed', date: daysAgo(270 - 10), completed: true, completedAt: daysAgo(270 - 10), description: 'Electrical and plumbing rough-in approved' },
      { id: generateId('ms'), title: 'Cabinets Installed', date: daysAgo(270 - 18), completed: true, completedAt: daysAgo(270 - 18), description: 'All cabinets installed and leveled' },
      { id: generateId('ms'), title: 'Countertops Installed', date: daysAgo(270 - 24), completed: true, completedAt: daysAgo(270 - 24), description: 'Quartz countertops templated and installed' },
      { id: generateId('ms'), title: 'Final Inspection', date: daysAgo(270 - 40), completed: true, completedAt: daysAgo(270 - 40), description: 'City final inspection passed' },
      { id: generateId('ms'), title: 'Client Walkthrough', date: daysAgo(270 - 42), completed: true, completedAt: daysAgo(270 - 42), description: 'Final walkthrough with client - project accepted' },
    ],
  },
  {
    projectId: 'demo-proj-wilson-fence',
    milestones: [
      { id: generateId('ms'), title: 'Materials Delivered', date: monthsAgo(6), completed: true, completedAt: monthsAgo(6), description: 'Cedar posts, rails, and pickets delivered' },
      { id: generateId('ms'), title: 'Posts Set', date: daysAgo(180 - 2), completed: true, completedAt: daysAgo(180 - 2), description: 'All fence posts set in concrete' },
      { id: generateId('ms'), title: 'Fence Complete', date: daysAgo(180 - 5), completed: true, completedAt: daysAgo(180 - 5), description: 'Rails and pickets installed' },
      { id: generateId('ms'), title: 'Stain Applied', date: daysAgo(180 - 6), completed: true, completedAt: daysAgo(180 - 6), description: 'Fence stained and sealed' },
    ],
  },
  {
    projectId: 'demo-proj-mainst-retail',
    milestones: [
      { id: generateId('ms'), title: 'Lease Signed', date: monthsAgo(7.5), completed: true, completedAt: monthsAgo(7.5), description: 'Retail lease executed' },
      { id: generateId('ms'), title: 'Permits Issued', date: monthsAgo(7), completed: true, completedAt: monthsAgo(7), description: 'Commercial TI permit approved' },
      { id: generateId('ms'), title: 'Demo Complete', date: daysAgo(210 - 10), completed: true, completedAt: daysAgo(210 - 10), description: 'Existing interior removed' },
      { id: generateId('ms'), title: 'Storefront Glazing', date: daysAgo(210 - 25), completed: true, completedAt: daysAgo(210 - 25), description: 'New storefront system installed' },
      { id: generateId('ms'), title: 'MEP Inspection', date: daysAgo(210 - 45), completed: true, completedAt: daysAgo(210 - 45), description: 'Mechanical, electrical, plumbing inspection passed' },
      { id: generateId('ms'), title: 'TCO Received', date: daysAgo(210 - 68), completed: true, completedAt: daysAgo(210 - 68), description: 'Temporary Certificate of Occupancy issued' },
      { id: generateId('ms'), title: 'Grand Opening', date: daysAgo(210 - 75), completed: true, completedAt: daysAgo(210 - 75), description: 'Store opened for business' },
    ],
  },
  {
    projectId: 'demo-proj-garcia-bath',
    milestones: [
      { id: generateId('ms'), title: 'Design Finalized', date: monthsAgo(3.5), completed: true, completedAt: monthsAgo(3.5), description: 'Tile selections and layout approved' },
      { id: generateId('ms'), title: 'Permit Approved', date: monthsAgo(3), completed: true, completedAt: monthsAgo(3), description: 'Bathroom remodel permit issued' },
      { id: generateId('ms'), title: 'Demo Complete', date: daysAgo(90 - 5), completed: true, completedAt: daysAgo(90 - 5), description: 'Old fixtures and tile removed' },
      { id: generateId('ms'), title: 'Plumbing Rough', date: daysAgo(90 - 9), completed: true, completedAt: daysAgo(90 - 9), description: 'New plumbing rough-in complete' },
      { id: generateId('ms'), title: 'Waterproofing', date: daysAgo(90 - 14), completed: true, completedAt: daysAgo(90 - 14), description: 'Shower waterproofing membrane installed' },
      { id: generateId('ms'), title: 'Tile Complete', date: daysAgo(90 - 22), completed: true, completedAt: daysAgo(90 - 22), description: 'All tile work finished and grouted' },
      { id: generateId('ms'), title: 'Final Walkthrough', date: daysAgo(58), completed: true, completedAt: daysAgo(58), description: 'Client accepted project' },
    ],
  },
  {
    projectId: 'demo-proj-cafe-ti',
    milestones: [
      { id: generateId('ms'), title: 'Permit Set Approved', date: monthsAgo(2.5), completed: true, completedAt: monthsAgo(2.5), description: 'Commercial kitchen permit approved' },
      { id: generateId('ms'), title: 'Demo Complete', date: daysAgo(75 - 8), completed: true, completedAt: daysAgo(75 - 8), description: 'Previous tenant improvements removed' },
      { id: generateId('ms'), title: 'Framing Inspection', date: daysAgo(75 - 15), completed: true, completedAt: daysAgo(75 - 15), description: 'Wall framing approved' },
      { id: generateId('ms'), title: 'Rough MEP', date: daysAgo(75 - 22), completed: true, completedAt: daysAgo(75 - 22), description: 'All rough-in inspections passed' },
      { id: generateId('ms'), title: 'Health Dept Approval', date: daysAgo(75 - 38), completed: true, completedAt: daysAgo(75 - 38), description: 'Commercial kitchen approved by health department' },
      { id: generateId('ms'), title: 'Final CO', date: daysAgo(28), completed: true, completedAt: daysAgo(28), description: 'Certificate of Occupancy issued' },
    ],
  },

  // ============================================
  // ACTIVE PROJECTS
  // ============================================
  {
    projectId: 'demo-proj-thompson-deck',
    milestones: [
      { id: generateId('ms'), title: 'Permit Approved', date: daysAgo(16), completed: true, completedAt: daysAgo(16), description: 'Deck permit issued' },
      { id: generateId('ms'), title: 'Footings Poured', date: daysAgo(12), completed: true, completedAt: daysAgo(12), description: 'Concrete footings cured' },
      { id: generateId('ms'), title: 'Framing Complete', date: daysAgo(5), completed: true, completedAt: daysAgo(5), description: 'Deck frame built and attached' },
      { id: generateId('ms'), title: 'Framing Inspection', date: daysAgo(4), completed: true, completedAt: daysAgo(4), description: 'Structural inspection passed' },
      { id: generateId('ms'), title: 'Decking Installed', date: daysAgo(-3), completed: false, description: 'Composite decking boards installed' },
      { id: generateId('ms'), title: 'Railing Complete', date: daysAgo(-7), completed: false, description: 'Railing system and stairs finished' },
      { id: generateId('ms'), title: 'Final Inspection', date: daysAgo(-10), completed: false, description: 'City final inspection' },
    ],
  },
  {
    projectId: 'demo-proj-office-park',
    milestones: [
      { id: generateId('ms'), title: 'Lease Executed', date: monthsAgo(1.5), completed: true, completedAt: monthsAgo(1.5), description: 'Office lease signed' },
      { id: generateId('ms'), title: 'Permits Issued', date: monthsAgo(1), completed: true, completedAt: monthsAgo(1), description: 'TI permit approved' },
      { id: generateId('ms'), title: 'Demo Complete', date: daysAgo(25), completed: true, completedAt: daysAgo(25), description: 'Previous tenant walls removed' },
      { id: generateId('ms'), title: 'Framing Complete', date: daysAgo(-5), completed: false, description: 'New office walls framed' },
      { id: generateId('ms'), title: 'MEP Rough-In', date: daysAgo(-15), completed: false, description: 'HVAC zones and electrical rough-in' },
      { id: generateId('ms'), title: 'Drywall Complete', date: daysAgo(-25), completed: false, description: 'All drywall hung and finished' },
      { id: generateId('ms'), title: 'Move-In Ready', date: daysAgo(-35), completed: false, description: 'Space ready for occupancy' },
    ],
  },
  {
    projectId: 'demo-proj-garcia-basement',
    milestones: [
      { id: generateId('ms'), title: 'Permit Approved', date: daysAgo(24), completed: true, completedAt: daysAgo(24), description: 'Basement finish permit issued' },
      { id: generateId('ms'), title: 'Egress Window Cut', date: daysAgo(18), completed: true, completedAt: daysAgo(18), description: 'Egress window well installed' },
      { id: generateId('ms'), title: 'Framing Complete', date: daysAgo(14), completed: true, completedAt: daysAgo(14), description: 'All walls framed' },
      { id: generateId('ms'), title: 'Rough MEP', date: daysAgo(-5), completed: false, description: 'Plumbing, electrical, HVAC rough-in' },
      { id: generateId('ms'), title: 'Insulation & Drywall', date: daysAgo(-15), completed: false, description: 'Insulation and drywall complete' },
      { id: generateId('ms'), title: 'Flooring Complete', date: daysAgo(-25), completed: false, description: 'LVP flooring installed' },
      { id: generateId('ms'), title: 'Final Inspection', date: daysAgo(-30), completed: false, description: 'City final inspection' },
    ],
  },
  {
    projectId: 'demo-proj-brown-kitchen',
    milestones: [
      { id: generateId('ms'), title: 'Materials Ordered', date: daysAgo(14), completed: true, completedAt: daysAgo(14), description: 'Cabinet refacing materials ordered' },
      { id: generateId('ms'), title: 'Prep Started', date: daysAgo(7), completed: true, completedAt: daysAgo(7), description: 'Counter removal and prep begun' },
      { id: generateId('ms'), title: 'Cabinet Refacing', date: daysAgo(-7), completed: false, description: 'Cabinet doors and drawer fronts replaced' },
      { id: generateId('ms'), title: 'Countertop Template', date: daysAgo(-10), completed: false, description: 'New countertops templated' },
      { id: generateId('ms'), title: 'Countertops Installed', date: daysAgo(-17), completed: false, description: 'New countertops installed' },
      { id: generateId('ms'), title: 'Backsplash & Floor', date: daysAgo(-24), completed: false, description: 'Tile backsplash and new flooring' },
      { id: generateId('ms'), title: 'Client Walkthrough', date: daysAgo(-28), completed: false, description: 'Final walkthrough and sign-off' },
    ],
  },

  // ============================================
  // PLANNING / ON HOLD PROJECTS
  // ============================================
  {
    projectId: 'demo-proj-thompson-garage',
    milestones: [
      { id: generateId('ms'), title: 'Design Approved', date: daysAgo(30), completed: true, completedAt: daysAgo(30), description: 'Architectural plans approved by client' },
      { id: generateId('ms'), title: 'Permit Submitted', date: daysAgo(21), completed: true, completedAt: daysAgo(21), description: 'Building permit application submitted' },
      { id: generateId('ms'), title: 'Permit Approved', date: daysAgo(-14), completed: false, description: 'Waiting for permit approval' },
      { id: generateId('ms'), title: 'Foundation Pour', date: daysAgo(-28), completed: false, description: 'Concrete slab pour' },
      { id: generateId('ms'), title: 'Framing Complete', date: daysAgo(-42), completed: false, description: 'Walls and roof framed' },
      { id: generateId('ms'), title: 'Final Inspection', date: daysAgo(-70), completed: false, description: 'City final inspection' },
    ],
  },
  {
    projectId: 'demo-proj-smith-bathroom',
    milestones: [
      { id: generateId('ms'), title: 'Scope Defined', date: daysAgo(45), completed: true, completedAt: daysAgo(45), description: 'Bathroom scope finalized with client' },
      { id: generateId('ms'), title: 'Materials Selected', date: daysAgo(30), completed: true, completedAt: daysAgo(30), description: 'Tile, vanity, fixtures selected' },
      { id: generateId('ms'), title: 'Permit Submitted', date: daysAgo(-7), completed: false, description: 'Submit permit application' },
      { id: generateId('ms'), title: 'Start Demo', date: daysAgo(-21), completed: false, description: 'Begin demolition work' },
      { id: generateId('ms'), title: 'Tile Complete', date: daysAgo(-45), completed: false, description: 'All tile work finished' },
      { id: generateId('ms'), title: 'Final Walkthrough', date: daysAgo(-56), completed: false, description: 'Client accepts project' },
    ],
  },
  {
    projectId: 'demo-proj-wilson-pool',
    milestones: [
      { id: generateId('ms'), title: 'Design Complete', date: daysAgo(60), completed: true, completedAt: daysAgo(60), description: 'Pool house design finalized' },
      { id: generateId('ms'), title: 'Permit Submitted', date: daysAgo(45), completed: true, completedAt: daysAgo(45), description: 'Initial permit application' },
      { id: generateId('ms'), title: 'Permit Rejected', date: daysAgo(30), completed: true, completedAt: daysAgo(30), description: 'Rejected due to setback issue' },
      { id: generateId('ms'), title: 'Variance Submitted', date: daysAgo(14), completed: true, completedAt: daysAgo(14), description: 'Setback variance application filed' },
      { id: generateId('ms'), title: 'Variance Hearing', date: daysAgo(-21), completed: false, description: 'Planning board hearing for variance' },
      { id: generateId('ms'), title: 'Permit Approved', date: daysAgo(-35), completed: false, description: 'Building permit issued' },
      { id: generateId('ms'), title: 'Construction Start', date: daysAgo(-42), completed: false, description: 'Break ground on pool house' },
    ],
  },
];

async function seedMilestones() {
  const db = getDb();

  logSection('Seeding Project Milestones');

  let totalMilestones = 0;
  let projectsUpdated = 0;

  for (const projectData of PROJECT_MILESTONES) {
    const projectRef = db.collection('projects').doc(projectData.projectId);
    const projectDoc = await projectRef.get();

    if (!projectDoc.exists) {
      logWarning(`Project ${projectData.projectId} not found, skipping`);
      continue;
    }

    // Get all phases for this project
    const phasesSnapshot = await projectRef.collection('phases').orderBy('order').get();

    if (phasesSnapshot.empty) {
      logWarning(`No phases found for ${projectData.projectId}`);
      continue;
    }

    // Distribute milestones across phases based on timeline
    const phases = phasesSnapshot.docs;
    const milestonesPerPhase = Math.ceil(projectData.milestones.length / phases.length);

    let milestoneIndex = 0;

    for (const phaseDoc of phases) {
      const phaseMilestones: Milestone[] = [];

      // Assign milestones to this phase
      for (let i = 0; i < milestonesPerPhase && milestoneIndex < projectData.milestones.length; i++) {
        phaseMilestones.push(projectData.milestones[milestoneIndex]);
        milestoneIndex++;
      }

      if (phaseMilestones.length > 0) {
        // Convert milestones to Firestore format
        const firestoreMilestones = phaseMilestones.map(ms => ({
          id: ms.id,
          title: ms.title,
          date: toTimestamp(ms.date),
          completed: ms.completed,
          completedAt: ms.completedAt ? toTimestamp(ms.completedAt) : null,
          description: ms.description || '',
        }));

        // Update the phase with milestones
        await phaseDoc.ref.update({
          milestones: firestoreMilestones,
          updatedAt: toTimestamp(new Date()),
        });

        totalMilestones += phaseMilestones.length;
      }
    }

    projectsUpdated++;
    logProgress(`${projectData.projectId}: ${projectData.milestones.length} milestones`);
  }

  logSuccess(`Seeded ${totalMilestones} milestones across ${projectsUpdated} projects`);
}

// Run if called directly
seedMilestones()
  .then(() => {
    console.log('\n✅ Milestones seeded successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error seeding milestones:', error);
    process.exit(1);
  });
