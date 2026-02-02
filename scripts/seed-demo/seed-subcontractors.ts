/**
 * Seed Subcontractors, Assignments, Bids, and Solicitations
 * Sprint 37C - Task 4
 *
 * Creates:
 * - 10 Subcontractor companies
 * - 3-5 Sub assignments per project
 * - 2-3 Bids per assignment
 * - 2-3 Solicitations per project
 */

import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import {
  DEMO_ORG_ID,
  DEMO_USERS,
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
// Subcontractor Definitions
// ============================================

const SUBCONTRACTORS = [
  {
    id: 'sub-peak-plumbing',
    companyName: 'Peak Plumbing Solutions',
    contactName: 'David Martinez',
    email: 'david@peakplumbing.demo',
    phone: '(303) 555-3001',
    trade: 'plumbing',
    licenseNumber: 'PL-12345',
    insuranceExpiry: daysFromNow(180),
    rating: 4.8,
    hourlyRate: 85,
  },
  {
    id: 'sub-mountain-electric',
    companyName: 'Mountain Electric Inc',
    contactName: 'Jennifer Kim',
    email: 'jen@mountainelectric.demo',
    phone: '(303) 555-3002',
    trade: 'electrical',
    licenseNumber: 'EL-67890',
    insuranceExpiry: daysFromNow(240),
    rating: 4.9,
    hourlyRate: 95,
  },
  {
    id: 'sub-alpine-hvac',
    companyName: 'Alpine HVAC Services',
    contactName: 'Robert Chen',
    email: 'rob@alpinehvac.demo',
    phone: '(303) 555-3003',
    trade: 'hvac',
    licenseNumber: 'HV-11111',
    insuranceExpiry: daysFromNow(120),
    rating: 4.6,
    hourlyRate: 90,
  },
  {
    id: 'sub-rocky-drywall',
    companyName: 'Rocky Mountain Drywall',
    contactName: 'Carlos Rodriguez',
    email: 'carlos@rockydrywall.demo',
    phone: '(303) 555-3004',
    trade: 'drywall',
    licenseNumber: 'DW-22222',
    insuranceExpiry: daysFromNow(300),
    rating: 4.7,
    hourlyRate: 65,
  },
  {
    id: 'sub-denver-tile',
    companyName: 'Denver Tile & Stone',
    contactName: 'Maria Santos',
    email: 'maria@denvertile.demo',
    phone: '(303) 555-3005',
    trade: 'tile',
    licenseNumber: 'TL-33333',
    insuranceExpiry: daysFromNow(200),
    rating: 4.8,
    hourlyRate: 75,
  },
  {
    id: 'sub-front-range-paint',
    companyName: 'Front Range Painting',
    contactName: 'Jake Thompson',
    email: 'jake@frpainting.demo',
    phone: '(303) 555-3006',
    trade: 'painting',
    licenseNumber: 'PT-44444',
    insuranceExpiry: daysFromNow(150),
    rating: 4.5,
    hourlyRate: 55,
  },
  {
    id: 'sub-summit-concrete',
    companyName: 'Summit Concrete Works',
    contactName: 'Steve Johnson',
    email: 'steve@summitconcrete.demo',
    phone: '(303) 555-3007',
    trade: 'concrete',
    licenseNumber: 'CO-55555',
    insuranceExpiry: daysFromNow(270),
    rating: 4.4,
    hourlyRate: 80,
  },
  {
    id: 'sub-mile-high-roofing',
    companyName: 'Mile High Roofing',
    contactName: 'Tom Wilson',
    email: 'tom@milehighroofing.demo',
    phone: '(303) 555-3008',
    trade: 'roofing',
    licenseNumber: 'RF-66666',
    insuranceExpiry: daysFromNow(190),
    rating: 4.7,
    hourlyRate: 70,
  },
  {
    id: 'sub-colorado-cabinets',
    companyName: 'Colorado Custom Cabinets',
    contactName: 'Lisa Park',
    email: 'lisa@cocabinets.demo',
    phone: '(303) 555-3009',
    trade: 'cabinets',
    licenseNumber: 'CB-77777',
    insuranceExpiry: daysFromNow(220),
    rating: 4.9,
    hourlyRate: 85,
  },
  {
    id: 'sub-centennial-flooring',
    companyName: 'Centennial Flooring',
    contactName: 'Mike Brown',
    email: 'mike@centennialflooring.demo',
    phone: '(303) 555-3010',
    trade: 'flooring',
    licenseNumber: 'FL-88888',
    insuranceExpiry: daysFromNow(160),
    rating: 4.6,
    hourlyRate: 60,
  },
];

// Demo projects for assignments
const DEMO_PROJECTS = [
  { id: 'demo-proj-smith-kitchen', name: 'Smith Kitchen Remodel', budget: 45000, trades: ['plumbing', 'electrical', 'cabinets', 'tile', 'flooring'] },
  { id: 'demo-proj-garcia-bath', name: 'Garcia Master Bath', budget: 32000, trades: ['plumbing', 'electrical', 'tile', 'drywall'] },
  { id: 'demo-proj-mainst-retail', name: 'Main St. Retail Storefront', budget: 125000, trades: ['electrical', 'hvac', 'drywall', 'painting', 'flooring'] },
  { id: 'demo-proj-cafe-ti', name: 'Downtown Cafe TI', budget: 78000, trades: ['plumbing', 'electrical', 'hvac', 'drywall', 'painting'] },
  { id: 'demo-proj-thompson-deck', name: 'Thompson Deck Build', budget: 22000, trades: ['concrete'] },
  { id: 'demo-proj-office-park', name: 'Office Park Suite 200', budget: 95000, trades: ['electrical', 'hvac', 'drywall', 'painting', 'flooring'] },
  { id: 'demo-proj-garcia-basement', name: 'Garcia Basement Finish', budget: 55000, trades: ['plumbing', 'electrical', 'drywall', 'flooring'] },
];

// ============================================
// Seed Functions
// ============================================

async function seedSubcontractors(): Promise<number> {
  logSection('Seeding Subcontractors');

  const subsRef = db.collection('organizations').doc(DEMO_ORG_ID).collection('subcontractors');
  const batch = db.batch();

  for (const sub of SUBCONTRACTORS) {
    logProgress(`Creating subcontractor: ${sub.companyName}`);

    const docRef = subsRef.doc(sub.id);
    batch.set(docRef, {
      ...sub,
      insuranceExpiry: toTimestamp(sub.insuranceExpiry),
      status: 'active',
      totalProjects: randomInt(5, 20),
      completedProjects: randomInt(3, 15),
      averageRating: sub.rating,
      address: {
        street: `${randomInt(100, 999)} ${randomItem(['Main', 'Oak', 'Pine', 'Cedar', 'Maple'])} St`,
        city: randomItem(['Denver', 'Aurora', 'Lakewood', 'Littleton', 'Englewood']),
        state: 'CO',
        zip: `80${randomInt(100, 299)}`,
      },
      createdAt: toTimestamp(monthsAgo(randomInt(6, 24))),
      updatedAt: Timestamp.now(),
      isDemoData: true,
    });
  }

  await batch.commit();
  logSuccess(`Created ${SUBCONTRACTORS.length} subcontractors`);
  return SUBCONTRACTORS.length;
}

async function seedSubAssignments(): Promise<number> {
  logSection('Seeding Sub Assignments');

  const assignmentsRef = db.collection('organizations').doc(DEMO_ORG_ID).collection('subAssignments');
  const assignments: any[] = [];

  for (const project of DEMO_PROJECTS) {
    const numAssignments = Math.min(project.trades.length, randomInt(3, 5));
    const selectedTrades = project.trades.slice(0, numAssignments);

    for (const trade of selectedTrades) {
      const sub = SUBCONTRACTORS.find(s => s.trade === trade) || randomItem(SUBCONTRACTORS);
      const budgetPercent = randomInt(8, 25) / 100;
      const budgetAmount = Math.round(project.budget * budgetPercent);

      const assignment = {
        id: generateId('asgn'),
        orgId: DEMO_ORG_ID,
        projectId: project.id,
        projectName: project.name,
        subcontractorId: sub.id,
        subcontractorName: sub.companyName,
        contactName: sub.contactName,
        contactEmail: sub.email,
        contactPhone: sub.phone,
        trade: trade,
        scopeDescription: `${trade.charAt(0).toUpperCase() + trade.slice(1)} work for ${project.name}`,
        budgetAmount: budgetAmount,
        actualSpend: Math.round(budgetAmount * randomInt(85, 105) / 100),
        status: randomItem(['pending', 'active', 'active', 'completed']),
        startDate: daysAgo(randomInt(30, 90)),
        endDate: project.id.includes('completed') ? daysAgo(randomInt(1, 30)) : null,
        notes: randomItem(['', 'Good progress so far', 'On schedule', 'Waiting for materials']),
        createdBy: DEMO_USERS.pm.uid,
        createdByName: DEMO_USERS.pm.displayName,
        createdAt: monthsAgo(randomInt(1, 3)),
        isDemoData: true,
      };

      assignments.push(assignment);
      logProgress(`Created assignment: ${sub.companyName} for ${project.name}`);
    }
  }

  await executeBatchWrites(
    db,
    assignments,
    (batch, assignment) => {
      const ref = assignmentsRef.doc(assignment.id);
      batch.set(ref, {
        ...assignment,
        startDate: toTimestamp(assignment.startDate),
        endDate: assignment.endDate ? toTimestamp(assignment.endDate) : null,
        createdAt: toTimestamp(assignment.createdAt),
        updatedAt: Timestamp.now(),
      });
    },
    'Sub Assignments'
  );

  logSuccess(`Created ${assignments.length} sub assignments`);
  return assignments.length;
}

async function seedBids(): Promise<number> {
  logSection('Seeding Bids');

  const bidsRef = db.collection('organizations').doc(DEMO_ORG_ID).collection('bids');
  const bids: any[] = [];

  // Create bids for solicitations
  for (const project of DEMO_PROJECTS.slice(0, 4)) { // First 4 projects
    const numBids = randomInt(4, 8);

    for (let i = 0; i < numBids; i++) {
      const sub = randomItem(SUBCONTRACTORS);
      const baseAmount = project.budget * (randomInt(5, 15) / 100);

      const bid = {
        id: generateId('bid'),
        orgId: DEMO_ORG_ID,
        projectId: project.id,
        projectName: project.name,
        subcontractorId: sub.id,
        subcontractorName: sub.companyName,
        contactName: sub.contactName,
        contactEmail: sub.email,
        trade: sub.trade,
        amount: Math.round(baseAmount + randomAmount(-500, 2000)),
        submittedAt: daysAgo(randomInt(7, 45)),
        status: randomItem(['pending', 'pending', 'accepted', 'rejected']),
        validUntil: daysFromNow(randomInt(15, 45)),
        lineItems: [
          { description: 'Labor', amount: Math.round(baseAmount * 0.6) },
          { description: 'Materials', amount: Math.round(baseAmount * 0.35) },
          { description: 'Overhead & Profit', amount: Math.round(baseAmount * 0.05) },
        ],
        notes: randomItem(['', 'Includes all materials', 'Price valid for 30 days', 'Can start immediately']),
        createdAt: daysAgo(randomInt(7, 45)),
        isDemoData: true,
      };

      bids.push(bid);
    }
  }

  await executeBatchWrites(
    db,
    bids,
    (batch, bid) => {
      const ref = bidsRef.doc(bid.id);
      batch.set(ref, {
        ...bid,
        submittedAt: toTimestamp(bid.submittedAt),
        validUntil: toTimestamp(bid.validUntil),
        createdAt: toTimestamp(bid.createdAt),
        updatedAt: Timestamp.now(),
      });
    },
    'Bids'
  );

  logSuccess(`Created ${bids.length} bids`);
  return bids.length;
}

async function seedSolicitations(): Promise<number> {
  logSection('Seeding Solicitations');

  const solicitationsRef = db.collection('organizations').doc(DEMO_ORG_ID).collection('solicitations');
  const solicitations: any[] = [];

  const solicitationTemplates = [
    { title: 'Plumbing Rough-In', description: 'Seeking bids for complete plumbing rough-in', trades: ['plumbing'] },
    { title: 'Electrical Work', description: 'Full electrical package including panel upgrade', trades: ['electrical'] },
    { title: 'HVAC Installation', description: 'New HVAC system installation', trades: ['hvac'] },
    { title: 'Drywall & Finishing', description: 'Drywall installation, taping, and finishing', trades: ['drywall', 'painting'] },
    { title: 'Tile Work', description: 'Tile installation for bathroom/kitchen', trades: ['tile'] },
    { title: 'Flooring Installation', description: 'LVP and carpet installation', trades: ['flooring'] },
  ];

  for (const project of DEMO_PROJECTS.slice(0, 5)) {
    const numSolicitations = randomInt(2, 3);

    for (let i = 0; i < numSolicitations; i++) {
      const template = randomItem(solicitationTemplates);

      const solicitation = {
        id: generateId('sol'),
        orgId: DEMO_ORG_ID,
        projectId: project.id,
        projectName: project.name,
        title: `${template.title} - ${project.name}`,
        description: template.description,
        targetTrades: template.trades,
        dueDate: daysFromNow(randomInt(7, 30)),
        status: randomItem(['open', 'open', 'closed', 'awarded']),
        bidCount: randomInt(2, 6),
        requirements: [
          'Valid contractor license',
          'Proof of insurance',
          'References from similar projects',
        ],
        createdBy: DEMO_USERS.pm.uid,
        createdByName: DEMO_USERS.pm.displayName,
        createdAt: daysAgo(randomInt(14, 60)),
        isDemoData: true,
      };

      solicitations.push(solicitation);
      logProgress(`Created solicitation: ${solicitation.title}`);
    }
  }

  await executeBatchWrites(
    db,
    solicitations,
    (batch, sol) => {
      const ref = solicitationsRef.doc(sol.id);
      batch.set(ref, {
        ...sol,
        dueDate: toTimestamp(sol.dueDate),
        createdAt: toTimestamp(sol.createdAt),
        updatedAt: Timestamp.now(),
      });
    },
    'Solicitations'
  );

  logSuccess(`Created ${solicitations.length} solicitations`);
  return solicitations.length;
}

// ============================================
// Main Export
// ============================================

export async function seedAllSubcontractorData(): Promise<{
  subcontractors: number;
  assignments: number;
  bids: number;
  solicitations: number;
}> {
  const subcontractors = await seedSubcontractors();
  const assignments = await seedSubAssignments();
  const bids = await seedBids();
  const solicitations = await seedSolicitations();

  return { subcontractors, assignments, bids, solicitations };
}

// Run if executed directly
if (require.main === module) {
  seedAllSubcontractorData()
    .then((result) => {
      console.log('\n✅ Subcontractor data seeding complete!');
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error seeding subcontractor data:', error);
      process.exit(1);
    });
}
