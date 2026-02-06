#!/usr/bin/env ts-node
/**
 * Seed Demo Project Phases
 *
 * Creates 4-6 construction phases per project as subcollections:
 *   organizations/{orgId}/projects/{projectId}/phases/{phaseId}
 *
 * Phase statuses vary by project state:
 * - Completed projects (wilson-fence): all phases completed
 * - Active projects (smith-kitchen, garcia-bath): mix of completed and in_progress
 * - Newer projects (mainst-retail, cafe-ti): mostly pending with 1-2 in_progress
 *
 * Usage:
 *   cd scripts/seed-demo && npx ts-node seed-phases.ts
 */

import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import {
  DEMO_ORG_ID,
  DEMO_USERS,
  daysAgo,
  daysFromNow,
  monthsAgo,
  toTimestamp,
  generateId,
  logSection,
  logProgress,
  logSuccess,
} from './utils';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'contractoros-483812',
  });
}

import { getDb } from './db';
const db = getDb();

// ============================================
// Types
// ============================================

interface PhaseMilestone {
  id: string;
  name: string;
  dueDate: Date;
  completedAt?: Date;
}

interface PhaseDocument {
  id: string;
  name: string;
  url: string;
  uploadedAt: Date;
}

interface PhaseData {
  id: string;
  projectId: string;
  name: string;
  description: string;
  order: number;
  status: 'pending' | 'in_progress' | 'completed' | 'on_hold';
  startDate?: Date;
  endDate?: Date;
  estimatedDuration: number;
  budgetAmount: number;
  actualCost: number;
  assignedTeamMembers: string[];
  assignedSubcontractors: string[];
  progressPercent: number;
  tasksTotal: number;
  tasksCompleted: number;
  dependencies: string[];
  documents: PhaseDocument[];
  milestones: PhaseMilestone[];
  trades: string[];
  createdAt: Date;
  updatedAt?: Date;
  isDemoData: boolean;
}

// ============================================
// Project Phase Definitions
// ============================================

interface ProjectPhasePlan {
  projectId: string;
  projectName: string;
  totalBudget: number;
  phases: Omit<PhaseData, 'id' | 'projectId' | 'createdAt' | 'updatedAt' | 'isDemoData'>[];
}

// Helper for phase IDs (deterministic for dependencies)
function phaseId(projectShort: string, order: number): string {
  return `phase-${projectShort}-${order}`;
}

// ============================================
// 1. Wilson Fence Installation (COMPLETED)
//    Budget: $8,500 — All phases completed
// ============================================

const wilsonFencePhases: ProjectPhasePlan = {
  projectId: 'demo-proj-wilson-fence',
  projectName: 'Wilson Fence Installation',
  totalBudget: 8500,
  phases: [
    {
      name: 'Pre-Construction',
      description: 'Property survey, utility locate, permit application, material ordering.',
      order: 1,
      status: 'completed',
      startDate: monthsAgo(6),
      endDate: daysAgo(180 - 3),
      estimatedDuration: 3,
      budgetAmount: 800,
      actualCost: 750,
      assignedTeamMembers: [DEMO_USERS.pm.uid],
      assignedSubcontractors: [],
      progressPercent: 100,
      tasksTotal: 4,
      tasksCompleted: 4,
      dependencies: [],
      documents: [
        { id: generateId('doc'), name: 'Fence Permit Application.pdf', url: '/docs/fence-permit.pdf', uploadedAt: monthsAgo(6) },
        { id: generateId('doc'), name: 'Property Survey.pdf', url: '/docs/property-survey.pdf', uploadedAt: monthsAgo(6) },
      ],
      milestones: [
        { id: generateId('ms'), name: 'Permit Approved', dueDate: daysAgo(180 - 2), completedAt: daysAgo(180 - 2) },
      ],
      trades: ['General Contractor'],
    },
    {
      name: 'Post Installation',
      description: 'Dig post holes, set posts in concrete, verify alignment and level.',
      order: 2,
      status: 'completed',
      startDate: daysAgo(180 - 3),
      endDate: daysAgo(180 - 4),
      estimatedDuration: 2,
      budgetAmount: 2200,
      actualCost: 2100,
      assignedTeamMembers: [DEMO_USERS.foreman.uid, DEMO_USERS.fieldWorker1.uid],
      assignedSubcontractors: [],
      progressPercent: 100,
      tasksTotal: 3,
      tasksCompleted: 3,
      dependencies: [phaseId('wilson', 1)],
      documents: [],
      milestones: [
        { id: generateId('ms'), name: 'All Posts Set & Cured', dueDate: daysAgo(180 - 4), completedAt: daysAgo(180 - 4) },
      ],
      trades: ['General Contractor', 'Carpenter'],
    },
    {
      name: 'Rails & Pickets',
      description: 'Install horizontal rails and cedar pickets. Verify spacing and level.',
      order: 3,
      status: 'completed',
      startDate: daysAgo(180 - 4),
      endDate: daysAgo(180 - 5),
      estimatedDuration: 2,
      budgetAmount: 3000,
      actualCost: 3050,
      assignedTeamMembers: [DEMO_USERS.foreman.uid, DEMO_USERS.fieldWorker1.uid, DEMO_USERS.fieldWorker2.uid],
      assignedSubcontractors: [],
      progressPercent: 100,
      tasksTotal: 3,
      tasksCompleted: 3,
      dependencies: [phaseId('wilson', 2)],
      documents: [],
      milestones: [],
      trades: ['Carpenter'],
    },
    {
      name: 'Gate & Finish',
      description: 'Install gate with hardware, apply stain/sealant, final cleanup and walkthrough.',
      order: 4,
      status: 'completed',
      startDate: daysAgo(180 - 5),
      endDate: daysAgo(180 - 6),
      estimatedDuration: 1,
      budgetAmount: 2500,
      actualCost: 2420,
      assignedTeamMembers: [DEMO_USERS.fieldWorker1.uid, DEMO_USERS.fieldWorker2.uid],
      assignedSubcontractors: [],
      progressPercent: 100,
      tasksTotal: 4,
      tasksCompleted: 4,
      dependencies: [phaseId('wilson', 3)],
      documents: [
        { id: generateId('doc'), name: 'Final Inspection Report.pdf', url: '/docs/fence-inspection.pdf', uploadedAt: daysAgo(180 - 6) },
      ],
      milestones: [
        { id: generateId('ms'), name: 'Client Walkthrough & Signoff', dueDate: daysAgo(180 - 6), completedAt: daysAgo(180 - 6) },
      ],
      trades: ['Carpenter', 'General Contractor'],
    },
  ],
};

// ============================================
// 2. Smith Kitchen Remodel (ACTIVE — mix completed/in_progress)
//    Budget: $45,000
// ============================================

const smithKitchenPhases: ProjectPhasePlan = {
  projectId: 'demo-proj-smith-kitchen',
  projectName: 'Smith Kitchen Remodel',
  totalBudget: 45000,
  phases: [
    {
      name: 'Pre-Construction',
      description: 'Design review, permit application, material selections, lead time ordering.',
      order: 1,
      status: 'completed',
      startDate: daysAgo(60),
      endDate: daysAgo(52),
      estimatedDuration: 8,
      budgetAmount: 2500,
      actualCost: 2350,
      assignedTeamMembers: [DEMO_USERS.pm.uid, DEMO_USERS.owner.uid],
      assignedSubcontractors: [],
      progressPercent: 100,
      tasksTotal: 6,
      tasksCompleted: 6,
      dependencies: [],
      documents: [
        { id: generateId('doc'), name: 'Kitchen Design Plans.pdf', url: '/docs/smith-kitchen-plans.pdf', uploadedAt: daysAgo(58) },
        { id: generateId('doc'), name: 'Building Permit.pdf', url: '/docs/smith-permit.pdf', uploadedAt: daysAgo(54) },
      ],
      milestones: [
        { id: generateId('ms'), name: 'Design Approved by Client', dueDate: daysAgo(56), completedAt: daysAgo(57) },
        { id: generateId('ms'), name: 'Permit Issued', dueDate: daysAgo(52), completedAt: daysAgo(53) },
      ],
      trades: ['General Contractor'],
    },
    {
      name: 'Demolition',
      description: 'Remove existing cabinets, countertops, flooring, and backsplash. Protect adjacent rooms.',
      order: 2,
      status: 'completed',
      startDate: daysAgo(50),
      endDate: daysAgo(46),
      estimatedDuration: 4,
      budgetAmount: 3000,
      actualCost: 2800,
      assignedTeamMembers: [DEMO_USERS.foreman.uid, DEMO_USERS.fieldWorker1.uid, DEMO_USERS.fieldWorker3.uid],
      assignedSubcontractors: [],
      progressPercent: 100,
      tasksTotal: 5,
      tasksCompleted: 5,
      dependencies: [phaseId('smith', 1)],
      documents: [],
      milestones: [
        { id: generateId('ms'), name: 'Demo Complete — Ready for Rough-In', dueDate: daysAgo(46), completedAt: daysAgo(46) },
      ],
      trades: ['General Contractor'],
    },
    {
      name: 'Rough-In',
      description: 'Plumbing relocation for island sink, electrical for under-cabinet lighting, HVAC ductwork adjustment.',
      order: 3,
      status: 'completed',
      startDate: daysAgo(45),
      endDate: daysAgo(35),
      estimatedDuration: 10,
      budgetAmount: 8500,
      actualCost: 8900,
      assignedTeamMembers: [DEMO_USERS.foreman.uid],
      assignedSubcontractors: ['demo-sub-plumber', 'demo-sub-electrician'],
      progressPercent: 100,
      tasksTotal: 8,
      tasksCompleted: 8,
      dependencies: [phaseId('smith', 2)],
      documents: [
        { id: generateId('doc'), name: 'Rough-In Inspection Pass.pdf', url: '/docs/smith-roughin-inspect.pdf', uploadedAt: daysAgo(35) },
      ],
      milestones: [
        { id: generateId('ms'), name: 'Rough-In Inspection Passed', dueDate: daysAgo(36), completedAt: daysAgo(35) },
      ],
      trades: ['Plumber', 'Electrician', 'HVAC'],
    },
    {
      name: 'Drywall & Paint',
      description: 'Patch and repair drywall, texture matching, prime and paint walls and ceiling.',
      order: 4,
      status: 'in_progress',
      startDate: daysAgo(34),
      endDate: undefined,
      estimatedDuration: 7,
      budgetAmount: 4000,
      actualCost: 2100,
      assignedTeamMembers: [DEMO_USERS.fieldWorker2.uid, DEMO_USERS.fieldWorker3.uid],
      assignedSubcontractors: [],
      progressPercent: 65,
      tasksTotal: 5,
      tasksCompleted: 3,
      dependencies: [phaseId('smith', 3)],
      documents: [],
      milestones: [
        { id: generateId('ms'), name: 'Paint Color Approved', dueDate: daysAgo(32), completedAt: daysAgo(33) },
      ],
      trades: ['Painter', 'Drywall'],
    },
    {
      name: 'Finish Work',
      description: 'Cabinet installation, countertop templating and install, backsplash tile, flooring, trim, fixtures.',
      order: 5,
      status: 'pending',
      startDate: undefined,
      endDate: undefined,
      estimatedDuration: 14,
      budgetAmount: 22000,
      actualCost: 0,
      assignedTeamMembers: [DEMO_USERS.foreman.uid, DEMO_USERS.fieldWorker1.uid, DEMO_USERS.fieldWorker2.uid],
      assignedSubcontractors: ['demo-sub-tile'],
      progressPercent: 0,
      tasksTotal: 12,
      tasksCompleted: 0,
      dependencies: [phaseId('smith', 4)],
      documents: [],
      milestones: [
        { id: generateId('ms'), name: 'Cabinets Installed', dueDate: daysFromNow(5) },
        { id: generateId('ms'), name: 'Countertops Installed', dueDate: daysFromNow(12) },
      ],
      trades: ['Carpenter', 'Tile Setter', 'Flooring'],
    },
    {
      name: 'Final Inspection & Closeout',
      description: 'Final building inspection, punch list walkthrough, client signoff, warranty documentation.',
      order: 6,
      status: 'pending',
      startDate: undefined,
      endDate: undefined,
      estimatedDuration: 3,
      budgetAmount: 5000,
      actualCost: 0,
      assignedTeamMembers: [DEMO_USERS.pm.uid, DEMO_USERS.foreman.uid],
      assignedSubcontractors: [],
      progressPercent: 0,
      tasksTotal: 6,
      tasksCompleted: 0,
      dependencies: [phaseId('smith', 5)],
      documents: [],
      milestones: [
        { id: generateId('ms'), name: 'Final Inspection Passed', dueDate: daysFromNow(20) },
        { id: generateId('ms'), name: 'Client Signoff', dueDate: daysFromNow(22) },
      ],
      trades: ['General Contractor'],
    },
  ],
};

// ============================================
// 3. Garcia Master Bath (ACTIVE — mix completed/in_progress)
//    Budget: $32,000
// ============================================

const garciaBathPhases: ProjectPhasePlan = {
  projectId: 'demo-proj-garcia-bath',
  projectName: 'Garcia Master Bath',
  totalBudget: 32000,
  phases: [
    {
      name: 'Pre-Construction',
      description: 'Design finalization, selections, permits, material ordering.',
      order: 1,
      status: 'completed',
      startDate: daysAgo(55),
      endDate: daysAgo(48),
      estimatedDuration: 7,
      budgetAmount: 1800,
      actualCost: 1750,
      assignedTeamMembers: [DEMO_USERS.pm.uid],
      assignedSubcontractors: [],
      progressPercent: 100,
      tasksTotal: 5,
      tasksCompleted: 5,
      dependencies: [],
      documents: [
        { id: generateId('doc'), name: 'Bath Design Layout.pdf', url: '/docs/garcia-bath-design.pdf', uploadedAt: daysAgo(53) },
        { id: generateId('doc'), name: 'Plumbing Permit.pdf', url: '/docs/garcia-plumb-permit.pdf', uploadedAt: daysAgo(49) },
      ],
      milestones: [
        { id: generateId('ms'), name: 'All Selections Finalized', dueDate: daysAgo(50), completedAt: daysAgo(51) },
      ],
      trades: ['General Contractor'],
    },
    {
      name: 'Demolition',
      description: 'Remove existing shower, vanity, toilet, flooring. Check subfloor condition.',
      order: 2,
      status: 'completed',
      startDate: daysAgo(47),
      endDate: daysAgo(43),
      estimatedDuration: 4,
      budgetAmount: 2200,
      actualCost: 2400,
      assignedTeamMembers: [DEMO_USERS.foreman.uid, DEMO_USERS.fieldWorker1.uid],
      assignedSubcontractors: [],
      progressPercent: 100,
      tasksTotal: 4,
      tasksCompleted: 4,
      dependencies: [phaseId('garcia', 1)],
      documents: [],
      milestones: [
        { id: generateId('ms'), name: 'Demo Complete', dueDate: daysAgo(44), completedAt: daysAgo(43) },
      ],
      trades: ['General Contractor'],
    },
    {
      name: 'Rough-In',
      description: 'Plumbing for walk-in shower and double vanity, electrical for heated floors and lighting, waterproofing.',
      order: 3,
      status: 'completed',
      startDate: daysAgo(42),
      endDate: daysAgo(32),
      estimatedDuration: 10,
      budgetAmount: 6500,
      actualCost: 6200,
      assignedTeamMembers: [DEMO_USERS.foreman.uid],
      assignedSubcontractors: ['demo-sub-plumber', 'demo-sub-electrician'],
      progressPercent: 100,
      tasksTotal: 7,
      tasksCompleted: 7,
      dependencies: [phaseId('garcia', 2)],
      documents: [
        { id: generateId('doc'), name: 'Waterproofing Test Report.pdf', url: '/docs/garcia-waterproof.pdf', uploadedAt: daysAgo(33) },
      ],
      milestones: [
        { id: generateId('ms'), name: 'Plumbing Inspection Passed', dueDate: daysAgo(34), completedAt: daysAgo(34) },
        { id: generateId('ms'), name: 'Waterproof Test Passed', dueDate: daysAgo(32), completedAt: daysAgo(32) },
      ],
      trades: ['Plumber', 'Electrician'],
    },
    {
      name: 'Tile Work',
      description: 'Shower walls and floor tile, bathroom floor tile with heated mat, niche installation.',
      order: 4,
      status: 'in_progress',
      startDate: daysAgo(30),
      endDate: undefined,
      estimatedDuration: 10,
      budgetAmount: 8000,
      actualCost: 4500,
      assignedTeamMembers: [DEMO_USERS.fieldWorker2.uid],
      assignedSubcontractors: ['demo-sub-tile'],
      progressPercent: 55,
      tasksTotal: 6,
      tasksCompleted: 3,
      dependencies: [phaseId('garcia', 3)],
      documents: [],
      milestones: [
        { id: generateId('ms'), name: 'Shower Tile Complete', dueDate: daysAgo(22), completedAt: daysAgo(23) },
        { id: generateId('ms'), name: 'Floor Tile Complete', dueDate: daysFromNow(3) },
      ],
      trades: ['Tile Setter'],
    },
    {
      name: 'Vanity, Fixtures & Paint',
      description: 'Install double vanity, countertop, faucets, toilet, mirrors, accessories. Paint walls.',
      order: 5,
      status: 'pending',
      startDate: undefined,
      endDate: undefined,
      estimatedDuration: 7,
      budgetAmount: 10500,
      actualCost: 0,
      assignedTeamMembers: [DEMO_USERS.foreman.uid, DEMO_USERS.fieldWorker1.uid],
      assignedSubcontractors: ['demo-sub-plumber'],
      progressPercent: 0,
      tasksTotal: 8,
      tasksCompleted: 0,
      dependencies: [phaseId('garcia', 4)],
      documents: [],
      milestones: [
        { id: generateId('ms'), name: 'Vanity & Fixtures Installed', dueDate: daysFromNow(14) },
      ],
      trades: ['Plumber', 'Carpenter', 'Painter'],
    },
    {
      name: 'Final Inspection & Closeout',
      description: 'Final plumbing inspection, punch list, client walkthrough, warranty documentation.',
      order: 6,
      status: 'pending',
      startDate: undefined,
      endDate: undefined,
      estimatedDuration: 2,
      budgetAmount: 3000,
      actualCost: 0,
      assignedTeamMembers: [DEMO_USERS.pm.uid],
      assignedSubcontractors: [],
      progressPercent: 0,
      tasksTotal: 5,
      tasksCompleted: 0,
      dependencies: [phaseId('garcia', 5)],
      documents: [],
      milestones: [
        { id: generateId('ms'), name: 'Final Inspection', dueDate: daysFromNow(18) },
        { id: generateId('ms'), name: 'Client Signoff', dueDate: daysFromNow(20) },
      ],
      trades: ['General Contractor'],
    },
  ],
};

// ============================================
// 4. Main St. Retail Storefront (NEWER — mostly pending)
//    Budget: $125,000
// ============================================

const mainstRetailPhases: ProjectPhasePlan = {
  projectId: 'demo-proj-mainst-retail',
  projectName: 'Main St. Retail Storefront',
  totalBudget: 125000,
  phases: [
    {
      name: 'Pre-Construction',
      description: 'Landlord approvals, permit applications, ADA compliance review, storefront system engineering.',
      order: 1,
      status: 'completed',
      startDate: daysAgo(28),
      endDate: daysAgo(18),
      estimatedDuration: 10,
      budgetAmount: 8000,
      actualCost: 7800,
      assignedTeamMembers: [DEMO_USERS.pm.uid, DEMO_USERS.owner.uid],
      assignedSubcontractors: [],
      progressPercent: 100,
      tasksTotal: 8,
      tasksCompleted: 8,
      dependencies: [],
      documents: [
        { id: generateId('doc'), name: 'Commercial Permit.pdf', url: '/docs/mainst-permit.pdf', uploadedAt: daysAgo(20) },
        { id: generateId('doc'), name: 'ADA Compliance Report.pdf', url: '/docs/mainst-ada.pdf', uploadedAt: daysAgo(22) },
        { id: generateId('doc'), name: 'Storefront Engineering.pdf', url: '/docs/mainst-engineering.pdf', uploadedAt: daysAgo(19) },
      ],
      milestones: [
        { id: generateId('ms'), name: 'Landlord Approval', dueDate: daysAgo(24), completedAt: daysAgo(25) },
        { id: generateId('ms'), name: 'Building Permit Issued', dueDate: daysAgo(18), completedAt: daysAgo(18) },
      ],
      trades: ['General Contractor'],
    },
    {
      name: 'Demolition',
      description: 'Strip existing tenant improvements, remove old storefront, prepare for new build.',
      order: 2,
      status: 'in_progress',
      startDate: daysAgo(16),
      endDate: undefined,
      estimatedDuration: 8,
      budgetAmount: 12000,
      actualCost: 5400,
      assignedTeamMembers: [DEMO_USERS.foreman.uid, DEMO_USERS.fieldWorker1.uid, DEMO_USERS.fieldWorker3.uid],
      assignedSubcontractors: [],
      progressPercent: 45,
      tasksTotal: 6,
      tasksCompleted: 3,
      dependencies: [phaseId('mainst', 1)],
      documents: [],
      milestones: [
        { id: generateId('ms'), name: 'Interior Demo Complete', dueDate: daysAgo(10), completedAt: daysAgo(11) },
        { id: generateId('ms'), name: 'Storefront Removal Complete', dueDate: daysFromNow(2) },
      ],
      trades: ['General Contractor'],
    },
    {
      name: 'Storefront & Framing',
      description: 'New aluminum storefront system, interior partition framing, ceiling grid layout.',
      order: 3,
      status: 'pending',
      startDate: undefined,
      endDate: undefined,
      estimatedDuration: 14,
      budgetAmount: 28000,
      actualCost: 0,
      assignedTeamMembers: [DEMO_USERS.foreman.uid, DEMO_USERS.fieldWorker1.uid],
      assignedSubcontractors: ['demo-sub-glass'],
      progressPercent: 0,
      tasksTotal: 8,
      tasksCompleted: 0,
      dependencies: [phaseId('mainst', 2)],
      documents: [],
      milestones: [
        { id: generateId('ms'), name: 'Storefront Glazing Complete', dueDate: daysFromNow(18) },
        { id: generateId('ms'), name: 'Framing Inspection', dueDate: daysFromNow(22) },
      ],
      trades: ['Glass & Glazing', 'Carpenter'],
    },
    {
      name: 'MEP Rough-In',
      description: 'Electrical for display lighting, plumbing for restroom, HVAC new zones, fire sprinkler modifications.',
      order: 4,
      status: 'pending',
      startDate: undefined,
      endDate: undefined,
      estimatedDuration: 14,
      budgetAmount: 32000,
      actualCost: 0,
      assignedTeamMembers: [DEMO_USERS.foreman.uid],
      assignedSubcontractors: ['demo-sub-plumber', 'demo-sub-electrician', 'demo-sub-hvac'],
      progressPercent: 0,
      tasksTotal: 10,
      tasksCompleted: 0,
      dependencies: [phaseId('mainst', 3)],
      documents: [],
      milestones: [
        { id: generateId('ms'), name: 'MEP Rough-In Inspection', dueDate: daysFromNow(40) },
      ],
      trades: ['Electrician', 'Plumber', 'HVAC', 'Fire Protection'],
    },
    {
      name: 'Drywall, Paint & Flooring',
      description: 'Drywall, tape, and texture. Paint throughout. Polished concrete or flooring install.',
      order: 5,
      status: 'pending',
      startDate: undefined,
      endDate: undefined,
      estimatedDuration: 12,
      budgetAmount: 24000,
      actualCost: 0,
      assignedTeamMembers: [DEMO_USERS.fieldWorker2.uid, DEMO_USERS.fieldWorker3.uid],
      assignedSubcontractors: [],
      progressPercent: 0,
      tasksTotal: 7,
      tasksCompleted: 0,
      dependencies: [phaseId('mainst', 4)],
      documents: [],
      milestones: [
        { id: generateId('ms'), name: 'Drywall Complete', dueDate: daysFromNow(48) },
        { id: generateId('ms'), name: 'Flooring Complete', dueDate: daysFromNow(55) },
      ],
      trades: ['Drywall', 'Painter', 'Flooring'],
    },
    {
      name: 'Final Trim & Inspection',
      description: 'Custom millwork, display fixtures, lighting trim, final inspections, CO issuance.',
      order: 6,
      status: 'pending',
      startDate: undefined,
      endDate: undefined,
      estimatedDuration: 10,
      budgetAmount: 21000,
      actualCost: 0,
      assignedTeamMembers: [DEMO_USERS.pm.uid, DEMO_USERS.foreman.uid, DEMO_USERS.fieldWorker1.uid],
      assignedSubcontractors: [],
      progressPercent: 0,
      tasksTotal: 9,
      tasksCompleted: 0,
      dependencies: [phaseId('mainst', 5)],
      documents: [],
      milestones: [
        { id: generateId('ms'), name: 'Final Building Inspection', dueDate: daysFromNow(65) },
        { id: generateId('ms'), name: 'Certificate of Occupancy', dueDate: daysFromNow(68) },
        { id: generateId('ms'), name: 'Client Walkthrough & Handover', dueDate: daysFromNow(70) },
      ],
      trades: ['Carpenter', 'Electrician', 'General Contractor'],
    },
  ],
};

// ============================================
// 5. Downtown Cafe TI (NEWER — mostly pending)
//    Budget: $78,000
// ============================================

const cafeTiPhases: ProjectPhasePlan = {
  projectId: 'demo-proj-cafe-ti',
  projectName: 'Downtown Cafe TI',
  totalBudget: 78000,
  phases: [
    {
      name: 'Pre-Construction',
      description: 'Health department review, grease trap engineering, permit applications, hood system design.',
      order: 1,
      status: 'completed',
      startDate: daysAgo(25),
      endDate: daysAgo(16),
      estimatedDuration: 9,
      budgetAmount: 5500,
      actualCost: 5200,
      assignedTeamMembers: [DEMO_USERS.pm.uid, DEMO_USERS.owner.uid],
      assignedSubcontractors: [],
      progressPercent: 100,
      tasksTotal: 7,
      tasksCompleted: 7,
      dependencies: [],
      documents: [
        { id: generateId('doc'), name: 'Health Dept Approval.pdf', url: '/docs/cafe-health.pdf', uploadedAt: daysAgo(18) },
        { id: generateId('doc'), name: 'Hood System Design.pdf', url: '/docs/cafe-hood.pdf', uploadedAt: daysAgo(20) },
        { id: generateId('doc'), name: 'Building Permit.pdf', url: '/docs/cafe-permit.pdf', uploadedAt: daysAgo(16) },
      ],
      milestones: [
        { id: generateId('ms'), name: 'Health Dept Pre-Approval', dueDate: daysAgo(19), completedAt: daysAgo(18) },
        { id: generateId('ms'), name: 'All Permits Issued', dueDate: daysAgo(16), completedAt: daysAgo(16) },
      ],
      trades: ['General Contractor'],
    },
    {
      name: 'Demolition & Site Prep',
      description: 'Remove existing improvements, saw-cut slab for plumbing, prep for grease trap.',
      order: 2,
      status: 'in_progress',
      startDate: daysAgo(14),
      endDate: undefined,
      estimatedDuration: 7,
      budgetAmount: 8000,
      actualCost: 4200,
      assignedTeamMembers: [DEMO_USERS.foreman.uid, DEMO_USERS.fieldWorker1.uid, DEMO_USERS.fieldWorker3.uid],
      assignedSubcontractors: [],
      progressPercent: 60,
      tasksTotal: 5,
      tasksCompleted: 3,
      dependencies: [phaseId('cafe', 1)],
      documents: [],
      milestones: [
        { id: generateId('ms'), name: 'Interior Demo Complete', dueDate: daysAgo(8), completedAt: daysAgo(9) },
        { id: generateId('ms'), name: 'Slab Cutting Complete', dueDate: daysFromNow(1) },
      ],
      trades: ['General Contractor'],
    },
    {
      name: 'Framing & MEP Rough-In',
      description: 'Wall framing for kitchen, restrooms, and service areas. All rough plumbing, electrical, HVAC, and hood duct.',
      order: 3,
      status: 'pending',
      startDate: undefined,
      endDate: undefined,
      estimatedDuration: 16,
      budgetAmount: 24000,
      actualCost: 0,
      assignedTeamMembers: [DEMO_USERS.foreman.uid, DEMO_USERS.fieldWorker1.uid],
      assignedSubcontractors: ['demo-sub-plumber', 'demo-sub-electrician', 'demo-sub-hvac'],
      progressPercent: 0,
      tasksTotal: 12,
      tasksCompleted: 0,
      dependencies: [phaseId('cafe', 2)],
      documents: [],
      milestones: [
        { id: generateId('ms'), name: 'Grease Trap Installed', dueDate: daysFromNow(10) },
        { id: generateId('ms'), name: 'Hood System Duct Installed', dueDate: daysFromNow(18) },
        { id: generateId('ms'), name: 'Rough-In Inspection', dueDate: daysFromNow(22) },
      ],
      trades: ['Carpenter', 'Plumber', 'Electrician', 'HVAC', 'Sheet Metal'],
    },
    {
      name: 'Drywall & Ceiling',
      description: 'Drywall throughout, acoustical ceiling in dining area, FRP in kitchen areas.',
      order: 4,
      status: 'pending',
      startDate: undefined,
      endDate: undefined,
      estimatedDuration: 8,
      budgetAmount: 12000,
      actualCost: 0,
      assignedTeamMembers: [DEMO_USERS.fieldWorker2.uid, DEMO_USERS.fieldWorker3.uid],
      assignedSubcontractors: [],
      progressPercent: 0,
      tasksTotal: 5,
      tasksCompleted: 0,
      dependencies: [phaseId('cafe', 3)],
      documents: [],
      milestones: [
        { id: generateId('ms'), name: 'Drywall Hung & Taped', dueDate: daysFromNow(30) },
      ],
      trades: ['Drywall', 'Acoustical Ceiling'],
    },
    {
      name: 'Flooring, Paint & Tile',
      description: 'Polished concrete in dining, tile in restrooms, epoxy in kitchen, paint throughout.',
      order: 5,
      status: 'pending',
      startDate: undefined,
      endDate: undefined,
      estimatedDuration: 10,
      budgetAmount: 16000,
      actualCost: 0,
      assignedTeamMembers: [DEMO_USERS.fieldWorker2.uid],
      assignedSubcontractors: ['demo-sub-tile'],
      progressPercent: 0,
      tasksTotal: 6,
      tasksCompleted: 0,
      dependencies: [phaseId('cafe', 4)],
      documents: [],
      milestones: [
        { id: generateId('ms'), name: 'Kitchen Epoxy Complete', dueDate: daysFromNow(38) },
        { id: generateId('ms'), name: 'All Flooring Complete', dueDate: daysFromNow(42) },
      ],
      trades: ['Flooring', 'Tile Setter', 'Painter'],
    },
    {
      name: 'Final Inspection & Closeout',
      description: 'Health department final, building final, fire inspection, ADA verification, CO issuance.',
      order: 6,
      status: 'pending',
      startDate: undefined,
      endDate: undefined,
      estimatedDuration: 5,
      budgetAmount: 12500,
      actualCost: 0,
      assignedTeamMembers: [DEMO_USERS.pm.uid, DEMO_USERS.owner.uid, DEMO_USERS.foreman.uid],
      assignedSubcontractors: [],
      progressPercent: 0,
      tasksTotal: 8,
      tasksCompleted: 0,
      dependencies: [phaseId('cafe', 5)],
      documents: [],
      milestones: [
        { id: generateId('ms'), name: 'Health Department Final Inspection', dueDate: daysFromNow(50) },
        { id: generateId('ms'), name: 'Building Final Inspection', dueDate: daysFromNow(52) },
        { id: generateId('ms'), name: 'Certificate of Occupancy Issued', dueDate: daysFromNow(55) },
      ],
      trades: ['General Contractor'],
    },
  ],
};

// ============================================
// All Project Plans
// ============================================

const ALL_PROJECT_PLANS: ProjectPhasePlan[] = [
  wilsonFencePhases,
  smithKitchenPhases,
  garciaBathPhases,
  mainstRetailPhases,
  cafeTiPhases,
];

// ============================================
// Main Seeding Function
// ============================================

async function seedPhases(): Promise<number> {
  logSection('Seeding Demo Project Phases');

  const orgRef = db.collection('organizations').doc(DEMO_ORG_ID);
  let totalPhases = 0;

  for (const plan of ALL_PROJECT_PLANS) {
    logProgress(`\n  Project: ${plan.projectName} (${plan.phases.length} phases)`);

    const projectRef = orgRef.collection('projects').doc(plan.projectId);
    const phasesRef = projectRef.collection('phases');

    // Determine phase ID prefix from project ID
    const projectShort = plan.projectId
      .replace('demo-proj-', '')
      .split('-')[0]; // wilson, smith, garcia, mainst, cafe

    const batch = db.batch();

    for (const phase of plan.phases) {
      const id = phaseId(projectShort, phase.order);

      // Resolve dependency IDs
      const resolvedDeps = phase.dependencies;

      // Convert documents and milestones with timestamps
      const documents = phase.documents.map((doc) => ({
        ...doc,
        uploadedAt: toTimestamp(doc.uploadedAt),
      }));

      const milestones = phase.milestones.map((ms) => ({
        ...ms,
        dueDate: toTimestamp(ms.dueDate),
        completedAt: ms.completedAt ? toTimestamp(ms.completedAt) : null,
      }));

      const phaseDoc = {
        id,
        projectId: plan.projectId,
        name: phase.name,
        description: phase.description,
        order: phase.order,
        status: phase.status,
        startDate: phase.startDate ? toTimestamp(phase.startDate) : null,
        endDate: phase.endDate ? toTimestamp(phase.endDate) : null,
        estimatedDuration: phase.estimatedDuration,
        budgetAmount: phase.budgetAmount,
        actualCost: phase.actualCost,
        assignedTeamMembers: phase.assignedTeamMembers,
        assignedSubcontractors: phase.assignedSubcontractors,
        progressPercent: phase.progressPercent,
        tasksTotal: phase.tasksTotal,
        tasksCompleted: phase.tasksCompleted,
        dependencies: resolvedDeps,
        documents,
        milestones,
        trades: phase.trades,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        isDemoData: true,
      };

      batch.set(phasesRef.doc(id), phaseDoc);

      const statusEmoji =
        phase.status === 'completed'
          ? 'DONE'
          : phase.status === 'in_progress'
            ? 'ACTIVE'
            : phase.status === 'on_hold'
              ? 'HOLD'
              : 'PEND';

      logProgress(
        `  [${statusEmoji.padEnd(6)}] Phase ${phase.order}: ${phase.name} — $${phase.budgetAmount.toLocaleString()} (${phase.progressPercent}%)`
      );

      totalPhases++;
    }

    await batch.commit();
    logSuccess(`Committed ${plan.phases.length} phases for ${plan.projectName}`);
  }

  // Summary
  logSection('Phase Seeding Summary');

  const allPhases = ALL_PROJECT_PLANS.flatMap((p) => p.phases);
  const statusCounts = allPhases.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalBudget = allPhases.reduce((sum, p) => sum + p.budgetAmount, 0);
  const totalActual = allPhases.reduce((sum, p) => sum + p.actualCost, 0);

  logSuccess(`Created ${totalPhases} phases across ${ALL_PROJECT_PLANS.length} projects`);
  logProgress(`Status distribution: ${JSON.stringify(statusCounts)}`);
  logProgress(`Total budget: $${totalBudget.toLocaleString()}`);
  logProgress(`Total actual cost: $${totalActual.toLocaleString()}`);

  return totalPhases;
}

// Run if executed directly
if (require.main === module) {
  seedPhases()
    .then((count) => {
      console.log(`\nCreated ${count} project phases`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error seeding phases:', error);
      process.exit(1);
    });
}

export { seedPhases };
