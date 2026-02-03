#!/usr/bin/env ts-node
/**
 * Seed SubAssignment payment records for P&L reports
 *
 * Creates SubAssignment records with payment data:
 * - Links existing subcontractors to projects
 * - Sets agreedAmount: $5,000 - $20,000 based on project size
 * - Sets paidAmount: 80-100% of agreedAmount for completed projects
 * - Includes paymentSchedule with realistic dates
 *
 * Usage:
 *   npx ts-node scripts/seed-demo/seed-sub-payments.ts
 */

import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import {
  DEMO_ORG_ID,
  daysAgo,
  daysFromNow,
  monthsAgo,
  generateId,
  randomAmount,
  randomInt,
  randomItem,
  toTimestamp,
  logSection,
  logProgress,
  logSuccess,
  logWarning,
  executeBatchWrites,
  randomDateBetween,
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

interface SubPaymentScheduleItem {
  id: string;
  description: string;
  amount: number;
  dueDate: Date;
  paidAt?: Date;
  status: 'pending' | 'paid' | 'overdue';
}

interface SubAssignment {
  id: string;
  subId: string;
  projectId: string;
  projectName: string;
  subName: string;
  type: 'phase' | 'task';
  phaseId?: string;
  taskId?: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  agreedAmount: number;
  paidAmount: number;
  paymentSchedule: SubPaymentScheduleItem[];
  rating?: number;
  ratingComment?: string;
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  isDemoData: boolean;
}

// ============================================
// Sub assignment configuration by trade
// ============================================

const TRADE_COST_RANGES: Record<string, { min: number; max: number }> = {
  plumbing: { min: 6000, max: 15000 },
  electrical: { min: 5000, max: 18000 },
  hvac: { min: 8000, max: 20000 },
  drywall: { min: 4000, max: 12000 },
  tile: { min: 5000, max: 14000 },
  painting: { min: 3000, max: 10000 },
  concrete: { min: 5000, max: 15000 },
  roofing: { min: 6000, max: 18000 },
  cabinets: { min: 7000, max: 20000 },
  flooring: { min: 4000, max: 12000 },
};

const PAYMENT_MILESTONES = [
  { description: 'Mobilization / Material Deposit', percent: 30 },
  { description: 'Rough-In Complete', percent: 40 },
  { description: 'Final Completion', percent: 30 },
];

const COMPLETION_RATINGS = [
  { rating: 5, comment: 'Excellent work, highly recommend!' },
  { rating: 5, comment: 'Outstanding quality and professionalism.' },
  { rating: 4.5, comment: 'Great job, would hire again.' },
  { rating: 4.5, comment: 'Very reliable and skilled.' },
  { rating: 4, comment: 'Good work overall.' },
  { rating: 4, comment: 'Solid performance, completed on time.' },
];

// ============================================
// Fetch existing data from Firestore
// ============================================

async function fetchSubcontractors(): Promise<
  Array<{ id: string; companyName: string; trade: string }>
> {
  logProgress('Fetching existing subcontractors...');
  const subsSnapshot = await db
    .collection('organizations')
    .doc(DEMO_ORG_ID)
    .collection('subcontractors')
    .get();

  const subs = subsSnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      companyName: data.companyName || 'Unknown Subcontractor',
      trade: data.trade || 'general',
    };
  });

  logSuccess(`Found ${subs.length} subcontractors`);
  return subs;
}

async function fetchProjects(): Promise<
  Array<{
    id: string;
    name: string;
    status: string;
    budget: number;
    startDate: Date;
    actualEndDate?: Date;
    estimatedEndDate: Date;
  }>
> {
  logProgress('Fetching existing projects...');
  const projectsSnapshot = await db
    .collection('projects')
    .where('orgId', '==', DEMO_ORG_ID)
    .get();

  const projects = projectsSnapshot.docs.map((doc) => {
    const data = doc.data();

    // Handle both Timestamp and raw date formats
    const parseDate = (val: any, fallback: Date): Date => {
      if (!val) return fallback;
      if (typeof val.toDate === 'function') return val.toDate();
      if (val instanceof Date) return val;
      if (typeof val === 'string' || typeof val === 'number') return new Date(val);
      return fallback;
    };

    return {
      id: doc.id,
      name: data.name || 'Unknown Project',
      status: data.status || 'active',
      budget: data.budget || 50000,
      startDate: parseDate(data.startDate, monthsAgo(3)),
      actualEndDate: data.actualEndDate ? parseDate(data.actualEndDate, undefined as any) : undefined,
      estimatedEndDate: parseDate(data.estimatedEndDate, daysFromNow(30)),
    };
  });

  logSuccess(`Found ${projects.length} projects`);
  return projects;
}

// ============================================
// Generate payment schedule
// ============================================

function generatePaymentSchedule(
  agreedAmount: number,
  projectStartDate: Date,
  projectEndDate: Date,
  isCompleted: boolean
): SubPaymentScheduleItem[] {
  const schedule: SubPaymentScheduleItem[] = [];
  let cumulativePercent = 0;

  for (let i = 0; i < PAYMENT_MILESTONES.length; i++) {
    const milestone = PAYMENT_MILESTONES[i];
    cumulativePercent += milestone.percent;

    // Calculate due date based on project timeline
    const projectDuration = projectEndDate.getTime() - projectStartDate.getTime();
    const milestoneOffset = (cumulativePercent / 100) * projectDuration;
    const dueDate = new Date(projectStartDate.getTime() + milestoneOffset);

    const amount = Math.round((agreedAmount * milestone.percent) / 100);

    let status: 'pending' | 'paid' | 'overdue' = 'pending';
    let paidAt: Date | undefined;

    if (isCompleted) {
      // All payments are paid for completed projects
      status = 'paid';
      paidAt = new Date(dueDate.getTime() + randomInt(-3, 5) * 24 * 60 * 60 * 1000);
    } else {
      // For active projects, first 1-2 payments may be paid
      if (i === 0) {
        status = 'paid';
        paidAt = new Date(dueDate.getTime() + randomInt(0, 3) * 24 * 60 * 60 * 1000);
      } else if (i === 1 && Math.random() > 0.3) {
        status = 'paid';
        paidAt = new Date(dueDate.getTime() + randomInt(0, 5) * 24 * 60 * 60 * 1000);
      } else if (dueDate < new Date()) {
        status = 'overdue';
      }
    }

    schedule.push({
      id: generateId('pmt'),
      description: milestone.description,
      amount,
      dueDate,
      paidAt,
      status,
    });
  }

  return schedule;
}

// ============================================
// Create SubAssignments
// ============================================

async function seedSubPayments(): Promise<number> {
  logSection('Seeding SubAssignment Payment Records');

  // Fetch existing data
  const subcontractors = await fetchSubcontractors();
  const projects = await fetchProjects();

  if (subcontractors.length === 0) {
    logWarning('No subcontractors found. Run seed-subcontractors.ts first.');
    return 0;
  }

  if (projects.length === 0) {
    logWarning('No projects found. Run seed-projects.ts first.');
    return 0;
  }

  // Clear existing subAssignments with payment data
  logProgress('Clearing existing SubAssignment payment records...');
  const existingAssignments = await db
    .collection('organizations')
    .doc(DEMO_ORG_ID)
    .collection('subAssignments')
    .where('isDemoData', '==', true)
    .get();

  if (existingAssignments.size > 0) {
    const deleteBatch = db.batch();
    existingAssignments.docs.forEach((doc) => deleteBatch.delete(doc.ref));
    await deleteBatch.commit();
    logProgress(`Deleted ${existingAssignments.size} existing records`);
  }

  // Create new SubAssignments
  const assignments: SubAssignment[] = [];

  for (const project of projects) {
    // Determine number of subs based on project budget
    const numSubs = project.budget > 80000 ? 3 : project.budget > 40000 ? 2 : 1;

    // Get unique trades for this project
    const availableTrades = [...new Set(subcontractors.map((s) => s.trade))];
    const selectedTrades = availableTrades
      .sort(() => Math.random() - 0.5)
      .slice(0, numSubs);

    for (const trade of selectedTrades) {
      // Find a sub for this trade
      const matchingSubs = subcontractors.filter((s) => s.trade === trade);
      if (matchingSubs.length === 0) continue;

      const sub = randomItem(matchingSubs);
      const costRange = TRADE_COST_RANGES[trade] || { min: 5000, max: 15000 };

      // Scale cost by project budget
      const budgetMultiplier = Math.min(project.budget / 50000, 2);
      const agreedAmount = Math.round(
        randomAmount(costRange.min, costRange.max) * budgetMultiplier
      );

      // Determine project completion status
      const isCompleted = project.status === 'completed';
      const isActive = project.status === 'active';

      // Calculate end date
      const projectEndDate = project.actualEndDate || project.estimatedEndDate;
      const assignmentStartDate = new Date(
        project.startDate.getTime() + randomInt(3, 14) * 24 * 60 * 60 * 1000
      );
      const assignmentEndDate = isCompleted
        ? new Date(projectEndDate.getTime() - randomInt(1, 7) * 24 * 60 * 60 * 1000)
        : undefined;

      // Generate payment schedule
      const paymentSchedule = generatePaymentSchedule(
        agreedAmount,
        assignmentStartDate,
        projectEndDate,
        isCompleted
      );

      // Calculate paid amount from schedule
      const paidAmount = paymentSchedule
        .filter((p) => p.status === 'paid')
        .reduce((sum, p) => sum + p.amount, 0);

      // Determine status
      let status: SubAssignment['status'];
      if (isCompleted) {
        status = 'completed';
      } else if (isActive) {
        status = paidAmount > 0 ? 'in_progress' : 'accepted';
      } else {
        status = 'pending';
      }

      // Add rating for completed assignments
      let rating: number | undefined;
      let ratingComment: string | undefined;
      if (isCompleted) {
        const ratingData = randomItem(COMPLETION_RATINGS);
        rating = ratingData.rating;
        ratingComment = ratingData.comment;
      }

      const assignment: SubAssignment = {
        id: generateId('subasgn'),
        subId: sub.id,
        projectId: project.id,
        projectName: project.name,
        subName: sub.companyName,
        type: 'phase',
        status,
        agreedAmount,
        paidAmount,
        paymentSchedule,
        startDate: assignmentStartDate,
        endDate: assignmentEndDate,
        createdAt: assignmentStartDate,
        updatedAt: new Date(),
        isDemoData: true,
      };

      // Only add rating fields if they exist (for completed assignments)
      if (rating !== undefined) {
        assignment.rating = rating;
        assignment.ratingComment = ratingComment;
      }

      assignments.push(assignment);
      logProgress(
        `${sub.companyName} -> ${project.name}: $${agreedAmount.toLocaleString()} (paid: $${paidAmount.toLocaleString()})`
      );
    }
  }

  // Write to Firestore
  const assignmentsRef = db
    .collection('organizations')
    .doc(DEMO_ORG_ID)
    .collection('subAssignments');

  await executeBatchWrites(
    db,
    assignments,
    (batch, assignment) => {
      const ref = assignmentsRef.doc(assignment.id);
      batch.set(ref, {
        ...assignment,
        startDate: toTimestamp(assignment.startDate),
        endDate: assignment.endDate ? toTimestamp(assignment.endDate) : null,
        paymentSchedule: assignment.paymentSchedule.map((p) => ({
          ...p,
          dueDate: toTimestamp(p.dueDate),
          paidAt: p.paidAt ? toTimestamp(p.paidAt) : null,
        })),
        createdAt: toTimestamp(assignment.createdAt),
        updatedAt: Timestamp.now(),
      });
    },
    'SubAssignment Payments'
  );

  logSuccess(`Created ${assignments.length} SubAssignment payment records`);

  // Summary statistics
  logSection('Payment Summary');
  const totalAgreed = assignments.reduce((sum, a) => sum + a.agreedAmount, 0);
  const totalPaid = assignments.reduce((sum, a) => sum + a.paidAmount, 0);
  const completedCount = assignments.filter((a) => a.status === 'completed').length;
  const activeCount = assignments.filter((a) => a.status === 'in_progress').length;

  console.log(`  Total Agreed Amount: $${totalAgreed.toLocaleString()}`);
  console.log(`  Total Paid Amount:   $${totalPaid.toLocaleString()}`);
  console.log(`  Payment Ratio:       ${((totalPaid / totalAgreed) * 100).toFixed(1)}%`);
  console.log(`  Completed:           ${completedCount}`);
  console.log(`  In Progress:         ${activeCount}`);
  console.log(`  Pending/Other:       ${assignments.length - completedCount - activeCount}`);

  return assignments.length;
}

// ============================================
// Run if executed directly
// ============================================

if (require.main === module) {
  seedSubPayments()
    .then((count) => {
      console.log(`\n[OK] Successfully created ${count} SubAssignment payment records!`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n[ERROR] Failed to seed SubAssignment payments:', error);
      process.exit(1);
    });
}

export { seedSubPayments };
