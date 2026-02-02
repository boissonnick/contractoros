#!/usr/bin/env ts-node
/**
 * Seed demo projects for ContractorOS
 *
 * Creates 12 projects with realistic timelines:
 * - 5 Completed projects
 * - 4 Active projects
 * - 2 Upcoming projects
 * - 1 On Hold project
 *
 * Usage:
 *   npx ts-node scripts/seed-demo/seed-projects.ts
 *   # or
 *   npm run seed:projects
 */

import * as admin from 'firebase-admin';
import {
  DEMO_ORG_ID,
  DEMO_CLIENTS,
  DEMO_USERS,
  daysAgo,
  daysFromNow,
  monthsAgo,
  toTimestamp,
  logSection,
  logProgress,
  logSuccess,
  generateId,
} from './utils';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'contractoros-483812',
  });
}

const db = admin.firestore();

// ============================================
// Project Definitions
// ============================================

interface DemoProject {
  id: string;
  name: string;
  client: typeof DEMO_CLIENTS[keyof typeof DEMO_CLIENTS];
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  status: 'completed' | 'active' | 'planning' | 'on_hold';
  category: 'residential' | 'commercial' | 'renovation' | 'addition';
  budget: number;
  actualSpend?: number;
  startDate: Date;
  estimatedEndDate: Date;
  actualEndDate?: Date;
  progressPercent: number;
  description: string;
  phases: DemoPhase[];
  notes?: string;
}

interface DemoPhase {
  name: string;
  order: number;
  status: 'completed' | 'active' | 'upcoming' | 'skipped';
  progressPercent: number;
  startDate?: Date;
  endDate?: Date;
}

// ============================================
// COMPLETED PROJECTS (5)
// ============================================

const completedProjects: DemoProject[] = [
  // 1. Smith Kitchen Remodel - Completed 8 months ago, $45,000, 6 weeks
  {
    id: 'demo-proj-smith-kitchen',
    name: 'Smith Kitchen Remodel',
    client: DEMO_CLIENTS.smith,
    address: {
      street: '1234 Maple Street',
      city: 'Denver',
      state: 'CO',
      zip: '80202',
    },
    status: 'completed',
    category: 'renovation',
    budget: 45000,
    actualSpend: 43250,
    startDate: monthsAgo(9),
    estimatedEndDate: monthsAgo(8),
    actualEndDate: monthsAgo(8),
    progressPercent: 100,
    description: 'Complete kitchen remodel including new cabinets, quartz countertops, tile backsplash, and LVP flooring. Updated electrical for under-cabinet lighting.',
    phases: [
      { name: 'Demo & Prep', order: 1, status: 'completed', progressPercent: 100, startDate: monthsAgo(9), endDate: daysAgo(270 - 4) },
      { name: 'Rough-In', order: 2, status: 'completed', progressPercent: 100, startDate: daysAgo(270 - 4), endDate: daysAgo(270 - 10) },
      { name: 'Cabinets & Countertops', order: 3, status: 'completed', progressPercent: 100, startDate: daysAgo(270 - 10), endDate: daysAgo(270 - 24) },
      { name: 'Tile & Flooring', order: 4, status: 'completed', progressPercent: 100, startDate: daysAgo(270 - 24), endDate: daysAgo(270 - 35) },
      { name: 'Paint & Finish', order: 5, status: 'completed', progressPercent: 100, startDate: daysAgo(270 - 35), endDate: daysAgo(270 - 42) },
    ],
    notes: 'Client was very pleased with the results. Added to portfolio.',
  },

  // 2. Wilson Fence Installation - Completed 6 months ago, $8,500, 1 week
  {
    id: 'demo-proj-wilson-fence',
    name: 'Wilson Fence Installation',
    client: DEMO_CLIENTS.wilson,
    address: {
      street: '234 Birch Lane',
      city: 'Centennial',
      state: 'CO',
      zip: '80112',
    },
    status: 'completed',
    category: 'residential',
    budget: 8500,
    actualSpend: 8320,
    startDate: monthsAgo(6),
    estimatedEndDate: daysAgo(180 - 7),
    actualEndDate: daysAgo(180 - 6),
    progressPercent: 100,
    description: '140 linear feet of 6\' cedar privacy fence with one 4\' gate. Includes stain/seal application.',
    phases: [
      { name: 'Layout & Posts', order: 1, status: 'completed', progressPercent: 100, startDate: monthsAgo(6), endDate: daysAgo(180 - 2) },
      { name: 'Rails & Pickets', order: 2, status: 'completed', progressPercent: 100, startDate: daysAgo(180 - 2), endDate: daysAgo(180 - 4) },
      { name: 'Gate & Finish', order: 3, status: 'completed', progressPercent: 100, startDate: daysAgo(180 - 4), endDate: daysAgo(180 - 6) },
    ],
    notes: 'Completed one day ahead of schedule.',
  },

  // 3. Main St. Retail Storefront - Completed 4 months ago, $125,000, 3 months
  {
    id: 'demo-proj-mainst-retail',
    name: 'Main St. Retail Storefront',
    client: DEMO_CLIENTS.mainStRetail,
    address: {
      street: '250 Main Street',
      city: 'Denver',
      state: 'CO',
      zip: '80202',
    },
    status: 'completed',
    category: 'commercial',
    budget: 125000,
    actualSpend: 128750,
    startDate: monthsAgo(7),
    estimatedEndDate: monthsAgo(4),
    actualEndDate: monthsAgo(4),
    progressPercent: 100,
    description: 'Complete retail buildout including new storefront system, custom millwork, track lighting, and polished concrete floors. 2,400 SF retail space.',
    phases: [
      { name: 'Demo', order: 1, status: 'completed', progressPercent: 100, startDate: monthsAgo(7), endDate: daysAgo(210 - 10) },
      { name: 'Storefront Install', order: 2, status: 'completed', progressPercent: 100, startDate: daysAgo(210 - 10), endDate: daysAgo(210 - 25) },
      { name: 'MEP Rough-In', order: 3, status: 'completed', progressPercent: 100, startDate: daysAgo(210 - 25), endDate: daysAgo(210 - 45) },
      { name: 'Drywall & Paint', order: 4, status: 'completed', progressPercent: 100, startDate: daysAgo(210 - 45), endDate: daysAgo(210 - 60) },
      { name: 'Flooring', order: 5, status: 'completed', progressPercent: 100, startDate: daysAgo(210 - 60), endDate: daysAgo(210 - 70) },
      { name: 'Millwork & Fixtures', order: 6, status: 'completed', progressPercent: 100, startDate: daysAgo(210 - 70), endDate: daysAgo(210 - 85) },
      { name: 'Final Punch', order: 7, status: 'completed', progressPercent: 100, startDate: daysAgo(210 - 85), endDate: daysAgo(120) },
    ],
    notes: 'Change order for upgraded lighting added $3,750 to budget. Client opened on schedule.',
  },

  // 4. Garcia Master Bath - Completed 2 months ago, $32,000, 4 weeks
  {
    id: 'demo-proj-garcia-bath',
    name: 'Garcia Master Bath',
    client: DEMO_CLIENTS.garcia,
    address: {
      street: '567 Oak Avenue',
      city: 'Lakewood',
      state: 'CO',
      zip: '80226',
    },
    status: 'completed',
    category: 'renovation',
    budget: 32000,
    actualSpend: 31450,
    startDate: monthsAgo(3),
    estimatedEndDate: monthsAgo(2),
    actualEndDate: daysAgo(58),
    progressPercent: 100,
    description: 'Master bathroom remodel with walk-in tile shower, double vanity, and heated floor. New fixtures throughout.',
    phases: [
      { name: 'Demo', order: 1, status: 'completed', progressPercent: 100, startDate: monthsAgo(3), endDate: daysAgo(90 - 5) },
      { name: 'Plumbing & Electrical', order: 2, status: 'completed', progressPercent: 100, startDate: daysAgo(90 - 5), endDate: daysAgo(90 - 12) },
      { name: 'Tile Work', order: 3, status: 'completed', progressPercent: 100, startDate: daysAgo(90 - 12), endDate: daysAgo(90 - 22) },
      { name: 'Vanity & Fixtures', order: 4, status: 'completed', progressPercent: 100, startDate: daysAgo(90 - 22), endDate: daysAgo(90 - 28) },
      { name: 'Final Details', order: 5, status: 'completed', progressPercent: 100, startDate: daysAgo(90 - 28), endDate: daysAgo(58) },
    ],
    notes: 'Client referred us to their neighbor for basement project.',
  },

  // 5. Downtown Cafe TI - Completed 1 month ago, $78,000, 6 weeks
  {
    id: 'demo-proj-cafe-ti',
    name: 'Downtown Cafe TI',
    client: DEMO_CLIENTS.downtownCafe,
    address: {
      street: '100 Main Street',
      city: 'Denver',
      state: 'CO',
      zip: '80202',
    },
    status: 'completed',
    category: 'commercial',
    budget: 78000,
    actualSpend: 76250,
    startDate: monthsAgo(2.5),
    estimatedEndDate: monthsAgo(1),
    actualEndDate: daysAgo(28),
    progressPercent: 100,
    description: 'Tenant improvement for new cafe location. Includes commercial kitchen rough-in, seating area, restrooms, and ADA compliance upgrades.',
    phases: [
      { name: 'Demo & Site Prep', order: 1, status: 'completed', progressPercent: 100, startDate: monthsAgo(2.5), endDate: daysAgo(75 - 8) },
      { name: 'Framing & MEP', order: 2, status: 'completed', progressPercent: 100, startDate: daysAgo(75 - 8), endDate: daysAgo(75 - 22) },
      { name: 'Drywall & Ceiling', order: 3, status: 'completed', progressPercent: 100, startDate: daysAgo(75 - 22), endDate: daysAgo(75 - 32) },
      { name: 'Flooring & Paint', order: 4, status: 'completed', progressPercent: 100, startDate: daysAgo(75 - 32), endDate: daysAgo(75 - 40) },
      { name: 'Final & Inspection', order: 5, status: 'completed', progressPercent: 100, startDate: daysAgo(75 - 40), endDate: daysAgo(28) },
    ],
    notes: 'Owner plans to open next month. Great working relationship.',
  },
];

// ============================================
// ACTIVE PROJECTS (4)
// ============================================

const activeProjects: DemoProject[] = [
  // 6. Thompson Deck Build - Started 2 weeks ago, $18,000, 40% complete
  {
    id: 'demo-proj-thompson-deck',
    name: 'Thompson Deck Build',
    client: DEMO_CLIENTS.thompson,
    address: {
      street: '890 Pine Road',
      city: 'Aurora',
      state: 'CO',
      zip: '80012',
    },
    status: 'active',
    category: 'residential',
    budget: 18000,
    actualSpend: 7200,
    startDate: daysAgo(14),
    estimatedEndDate: daysFromNow(10),
    progressPercent: 40,
    description: '320 SF composite deck with railing, stairs, and low-voltage lighting. Permit obtained.',
    phases: [
      { name: 'Permits & Footings', order: 1, status: 'completed', progressPercent: 100, startDate: daysAgo(14), endDate: daysAgo(10) },
      { name: 'Framing', order: 2, status: 'completed', progressPercent: 100, startDate: daysAgo(10), endDate: daysAgo(5) },
      { name: 'Decking', order: 3, status: 'active', progressPercent: 50, startDate: daysAgo(5) },
      { name: 'Railing & Stairs', order: 4, status: 'upcoming', progressPercent: 0 },
      { name: 'Lighting & Punch', order: 5, status: 'upcoming', progressPercent: 0 },
    ],
    notes: 'Weather delayed concrete by 2 days. On track to finish on time.',
  },

  // 7. Office Park Suite 200 - Started 1 month ago, $95,000, 25% complete
  {
    id: 'demo-proj-office-park',
    name: 'Office Park Suite 200',
    client: DEMO_CLIENTS.officePark,
    address: {
      street: '500 Business Parkway',
      city: 'Englewood',
      state: 'CO',
      zip: '80111',
    },
    status: 'active',
    category: 'commercial',
    budget: 95000,
    actualSpend: 23750,
    startDate: monthsAgo(1),
    estimatedEndDate: monthsAgo(-1.5), // 6 weeks from now
    progressPercent: 25,
    description: '1,800 SF office TI with 4 private offices, conference room, and open workspace. New HVAC zones required.',
    phases: [
      { name: 'Demo', order: 1, status: 'completed', progressPercent: 100, startDate: monthsAgo(1), endDate: daysAgo(25) },
      { name: 'Framing', order: 2, status: 'active', progressPercent: 60, startDate: daysAgo(25) },
      { name: 'MEP Rough-In', order: 3, status: 'upcoming', progressPercent: 0 },
      { name: 'Drywall', order: 4, status: 'upcoming', progressPercent: 0 },
      { name: 'Flooring & Paint', order: 5, status: 'upcoming', progressPercent: 0 },
      { name: 'Final Trim', order: 6, status: 'upcoming', progressPercent: 0 },
    ],
    notes: 'Waiting on electrical plans approval from landlord.',
  },

  // 8. Garcia Basement Finish - Started 3 weeks ago, $55,000, 35% complete
  {
    id: 'demo-proj-garcia-basement',
    name: 'Garcia Basement Finish',
    client: DEMO_CLIENTS.garcia,
    address: {
      street: '567 Oak Avenue',
      city: 'Lakewood',
      state: 'CO',
      zip: '80226',
    },
    status: 'active',
    category: 'residential',
    budget: 55000,
    actualSpend: 19250,
    startDate: daysAgo(21),
    estimatedEndDate: daysFromNow(35),
    progressPercent: 35,
    description: '800 SF basement finish with bedroom, bathroom, and rec room. Egress window installation included.',
    phases: [
      { name: 'Framing & Egress', order: 1, status: 'completed', progressPercent: 100, startDate: daysAgo(21), endDate: daysAgo(14) },
      { name: 'Rough MEP', order: 2, status: 'active', progressPercent: 70, startDate: daysAgo(14) },
      { name: 'Insulation & Drywall', order: 3, status: 'upcoming', progressPercent: 0 },
      { name: 'Flooring', order: 4, status: 'upcoming', progressPercent: 0 },
      { name: 'Bathroom Tile', order: 5, status: 'upcoming', progressPercent: 0 },
      { name: 'Paint & Trim', order: 6, status: 'upcoming', progressPercent: 0 },
    ],
    notes: 'Same client as Garcia Master Bath. Referral discount applied.',
  },

  // 9. Brown Kitchen Update - Started 1 week ago, $28,000, 15% complete
  {
    id: 'demo-proj-brown-kitchen',
    name: 'Brown Kitchen Update',
    client: DEMO_CLIENTS.brown,
    address: {
      street: '678 Cedar Court',
      city: 'Littleton',
      state: 'CO',
      zip: '80120',
    },
    status: 'active',
    category: 'renovation',
    budget: 28000,
    actualSpend: 4200,
    startDate: daysAgo(7),
    estimatedEndDate: daysFromNow(21),
    progressPercent: 15,
    description: 'Cabinet refacing, new countertops, backsplash update, and new flooring. Keeping existing layout.',
    phases: [
      { name: 'Prep & Demo', order: 1, status: 'active', progressPercent: 60, startDate: daysAgo(7) },
      { name: 'Cabinet Refacing', order: 2, status: 'upcoming', progressPercent: 0 },
      { name: 'Countertops', order: 3, status: 'upcoming', progressPercent: 0 },
      { name: 'Backsplash & Floor', order: 4, status: 'upcoming', progressPercent: 0 },
      { name: 'Final Details', order: 5, status: 'upcoming', progressPercent: 0 },
    ],
    notes: 'Client living in home during renovation. Working around their schedule.',
  },
];

// ============================================
// UPCOMING PROJECTS (2)
// ============================================

const upcomingProjects: DemoProject[] = [
  // 10. Thompson Garage Addition - Scheduled to start in 2 weeks, $65,000
  {
    id: 'demo-proj-thompson-garage',
    name: 'Thompson Garage Addition',
    client: DEMO_CLIENTS.thompson,
    address: {
      street: '890 Pine Road',
      city: 'Aurora',
      state: 'CO',
      zip: '80012',
    },
    status: 'planning',
    category: 'addition',
    budget: 65000,
    startDate: daysFromNow(14),
    estimatedEndDate: daysFromNow(84), // 10 weeks duration
    progressPercent: 0,
    description: '576 SF attached 2-car garage with insulated door, entry to house, and electrical. Permit in review.',
    phases: [
      { name: 'Site Prep & Foundation', order: 1, status: 'upcoming', progressPercent: 0 },
      { name: 'Framing', order: 2, status: 'upcoming', progressPercent: 0 },
      { name: 'Roofing & Exterior', order: 3, status: 'upcoming', progressPercent: 0 },
      { name: 'Electrical & Drywall', order: 4, status: 'upcoming', progressPercent: 0 },
      { name: 'Garage Door & Finish', order: 5, status: 'upcoming', progressPercent: 0 },
    ],
    notes: 'Same client as Thompson Deck. Will start after deck completes. Permit expected next week.',
  },

  // 11. Smith Bathroom Remodel - Scheduled to start in 1 month, $22,000
  {
    id: 'demo-proj-smith-bathroom',
    name: 'Smith Bathroom Remodel',
    client: DEMO_CLIENTS.smith,
    address: {
      street: '1234 Maple Street',
      city: 'Denver',
      state: 'CO',
      zip: '80202',
    },
    status: 'planning',
    category: 'renovation',
    budget: 22000,
    startDate: daysFromNow(30),
    estimatedEndDate: daysFromNow(51), // 3 weeks duration
    progressPercent: 0,
    description: 'Guest bathroom remodel. New tile shower, vanity, toilet, and flooring. Same client as kitchen remodel.',
    phases: [
      { name: 'Demo', order: 1, status: 'upcoming', progressPercent: 0 },
      { name: 'Plumbing & Electrical', order: 2, status: 'upcoming', progressPercent: 0 },
      { name: 'Tile Work', order: 3, status: 'upcoming', progressPercent: 0 },
      { name: 'Fixtures & Finish', order: 4, status: 'upcoming', progressPercent: 0 },
    ],
    notes: 'Return customer from kitchen remodel. Finishes selected.',
  },
];

// ============================================
// ON HOLD PROJECT (1)
// ============================================

const onHoldProjects: DemoProject[] = [
  // 12. Wilson Pool House - On hold pending permits, $48,000
  {
    id: 'demo-proj-wilson-pool',
    name: 'Wilson Pool House',
    client: DEMO_CLIENTS.wilson,
    address: {
      street: '234 Birch Lane',
      city: 'Centennial',
      state: 'CO',
      zip: '80112',
    },
    status: 'on_hold',
    category: 'addition',
    budget: 48000,
    startDate: daysAgo(45), // Original planned start
    estimatedEndDate: daysFromNow(75), // Will be revised when permits approved
    progressPercent: 0,
    description: '400 SF pool house with bathroom, outdoor shower, and kitchenette. Permit rejected, resubmitting with setback variance.',
    phases: [
      { name: 'Foundation', order: 1, status: 'upcoming', progressPercent: 0 },
      { name: 'Framing', order: 2, status: 'upcoming', progressPercent: 0 },
      { name: 'Roofing & Exterior', order: 3, status: 'upcoming', progressPercent: 0 },
      { name: 'MEP', order: 4, status: 'upcoming', progressPercent: 0 },
      { name: 'Interior Finish', order: 5, status: 'upcoming', progressPercent: 0 },
    ],
    notes: 'Permit rejected due to setback issue. Architect revising plans. Variance hearing scheduled for next month.',
  },
];

// ============================================
// Combine All Projects
// ============================================

const allProjects: DemoProject[] = [
  ...completedProjects,
  ...activeProjects,
  ...upcomingProjects,
  ...onHoldProjects,
];

// ============================================
// Seed Function
// ============================================

async function seedProjects(): Promise<void> {
  logSection('Seeding Demo Projects');
  logProgress(`Creating ${allProjects.length} projects...`);

  const batch = db.batch();
  // NOTE: Projects are stored in top-level 'projects' collection with orgId field
  // NOT in organizations/{orgId}/projects subcollection
  const projectsRef = db.collection('projects');
  const phasesCreated: { projectId: string; phaseCount: number }[] = [];

  for (const project of allProjects) {
    // Create project document
    const projectRef = projectsRef.doc(project.id);
    const projectData = {
      id: project.id,
      orgId: DEMO_ORG_ID,
      name: project.name,
      description: project.description,
      address: project.address,
      status: project.status,
      category: project.category,
      clientId: project.client.id,
      clientName: `${project.client.firstName} ${project.client.lastName}`,
      pmId: DEMO_USERS.pm.uid,
      budget: project.budget,
      currentSpend: project.actualSpend || 0,
      startDate: toTimestamp(project.startDate),
      estimatedEndDate: toTimestamp(project.estimatedEndDate),
      actualEndDate: project.actualEndDate ? toTimestamp(project.actualEndDate) : null,
      progressPercent: project.progressPercent,
      currentPhase: project.phases.find(p => p.status === 'active')?.name || project.phases[0].name,
      notes: project.notes || '',
      isDemoData: true,
      createdAt: toTimestamp(project.startDate),
      updatedAt: toTimestamp(new Date()),
    };

    batch.set(projectRef, projectData);

    // Create phases subcollection
    const phasesRef = projectRef.collection('phases');
    for (const phase of project.phases) {
      const phaseId = generateId('phase');
      const phaseRef = phasesRef.doc(phaseId);
      const phaseData = {
        id: phaseId,
        projectId: project.id,
        name: phase.name,
        order: phase.order,
        status: phase.status,
        progressPercent: phase.progressPercent,
        startDate: phase.startDate ? toTimestamp(phase.startDate) : null,
        endDate: phase.endDate ? toTimestamp(phase.endDate) : null,
        assignedTeamMembers: [DEMO_USERS.foreman.uid, DEMO_USERS.fieldWorker1.uid],
        assignedSubcontractors: [],
        tasksTotal: 0,
        tasksCompleted: 0,
        dependencies: [],
        documents: [],
        milestones: [],
        createdAt: toTimestamp(project.startDate),
        updatedAt: toTimestamp(new Date()),
      };
      batch.set(phaseRef, phaseData);
    }

    phasesCreated.push({ projectId: project.id, phaseCount: project.phases.length });
  }

  await batch.commit();

  logSuccess(`Created ${allProjects.length} projects`);
  for (const { projectId, phaseCount } of phasesCreated) {
    logProgress(`  → ${projectId}: ${phaseCount} phases`);
  }

  // Summary
  logSection('Projects Summary');
  console.log(`  Completed: ${completedProjects.length}`);
  console.log(`  Active:    ${activeProjects.length}`);
  console.log(`  Upcoming:  ${upcomingProjects.length}`);
  console.log(`  On Hold:   ${onHoldProjects.length}`);
  console.log(`  ─────────────────────`);
  console.log(`  Total:     ${allProjects.length}`);
}

// ============================================
// Export for use by other seed scripts
// ============================================

export { allProjects, completedProjects, activeProjects, upcomingProjects, onHoldProjects };

// ============================================
// Run if executed directly
// ============================================

if (require.main === module) {
  seedProjects()
    .then(() => {
      console.log('\n✅ Projects seeded successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error seeding projects:', error);
      process.exit(1);
    });
}
