/**
 * Seed Demo Quotes with Line Items
 * Sprint 38 - CLI 1, Task 2
 *
 * Creates quote line items for each demo project
 * TODO: Implement this seed script
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
  randomAmount,
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

// Demo projects with budgets
const DEMO_PROJECTS = [
  { id: 'demo-proj-smith-kitchen', name: 'Smith Kitchen Remodel', budget: 45000 },
  { id: 'demo-proj-garcia-bath', name: 'Garcia Master Bath', budget: 32000 },
  { id: 'demo-proj-mainst-retail', name: 'Main St. Retail Storefront', budget: 125000 },
  { id: 'demo-proj-cafe-ti', name: 'Downtown Cafe TI', budget: 78000 },
  { id: 'demo-proj-thompson-deck', name: 'Thompson Deck Build', budget: 22000 },
  { id: 'demo-proj-office-park', name: 'Office Park Suite 200', budget: 95000 },
  { id: 'demo-proj-garcia-basement', name: 'Garcia Basement Finish', budget: 55000 },
];

// Quote sections with line item templates
const QUOTE_SECTIONS = {
  assessment: [
    { description: 'Site visit and measurements', unit: 'ea', basePrice: 250 },
    { description: 'Architectural review', unit: 'hr', basePrice: 150 },
    { description: 'Permit acquisition', unit: 'ea', basePrice: 500 },
    { description: 'Engineering consultation', unit: 'hr', basePrice: 200 },
  ],
  demolition: [
    { description: 'Demo existing fixtures', unit: 'sf', basePrice: 5 },
    { description: 'Debris removal and disposal', unit: 'load', basePrice: 350 },
    { description: 'Hazmat testing', unit: 'ea', basePrice: 400 },
  ],
  structural: [
    { description: 'Framing materials', unit: 'lf', basePrice: 8 },
    { description: 'Framing labor', unit: 'hr', basePrice: 75 },
    { description: 'Header/beam installation', unit: 'ea', basePrice: 450 },
    { description: 'Structural fasteners', unit: 'lot', basePrice: 150 },
  ],
  systems: [
    { description: 'Electrical rough-in', unit: 'outlet', basePrice: 125 },
    { description: 'Plumbing rough-in', unit: 'fixture', basePrice: 350 },
    { description: 'HVAC ductwork', unit: 'lf', basePrice: 25 },
    { description: 'Insulation', unit: 'sf', basePrice: 3 },
  ],
  finishes: [
    { description: 'Drywall installation', unit: 'sf', basePrice: 4 },
    { description: 'Paint - walls', unit: 'sf', basePrice: 2 },
    { description: 'Flooring installation', unit: 'sf', basePrice: 8 },
    { description: 'Tile work', unit: 'sf', basePrice: 15 },
    { description: 'Trim and molding', unit: 'lf', basePrice: 6 },
  ],
  fixtures: [
    { description: 'Light fixtures', unit: 'ea', basePrice: 200 },
    { description: 'Plumbing fixtures', unit: 'ea', basePrice: 450 },
    { description: 'Cabinet installation', unit: 'lf', basePrice: 150 },
    { description: 'Countertop installation', unit: 'sf', basePrice: 75 },
    { description: 'Appliance installation', unit: 'ea', basePrice: 150 },
  ],
};

async function seedQuotes(): Promise<number> {
  logSection('Seeding Demo Quotes');

  const quotesRef = db.collection('organizations').doc(DEMO_ORG_ID).collection('quotes');
  const lineItemsRef = db.collection('organizations').doc(DEMO_ORG_ID).collection('quoteLineItems');

  const quotes: any[] = [];
  const lineItems: any[] = [];

  for (const project of DEMO_PROJECTS) {
    // Create quote
    const quoteId = generateId('quote');
    const quote = {
      id: quoteId,
      orgId: DEMO_ORG_ID,
      projectId: project.id,
      projectName: project.name,
      status: randomItem(['draft', 'sent', 'approved', 'approved']),
      totalAmount: project.budget,
      createdBy: DEMO_USERS.pm.uid,
      createdByName: DEMO_USERS.pm.displayName,
      createdAt: daysAgo(randomInt(30, 90)),
      isDemoData: true,
    };
    quotes.push(quote);

    // Create line items for this quote
    const sections = Object.keys(QUOTE_SECTIONS) as (keyof typeof QUOTE_SECTIONS)[];
    let runningTotal = 0;
    let sortOrder = 0;
    const targetTotal = project.budget;

    for (const section of sections) {
      const templates = QUOTE_SECTIONS[section];
      const itemCount = randomInt(2, Math.min(4, templates.length));

      for (let i = 0; i < itemCount; i++) {
        const template = templates[i % templates.length];
        const quantity = randomInt(1, 20);
        const unitPrice = template.basePrice + randomAmount(-50, 100);
        const total = quantity * unitPrice;

        const lineItem = {
          id: generateId('qli'),
          quoteId: quoteId,
          projectId: project.id,
          section: section,
          description: template.description,
          quantity: quantity,
          unit: template.unit,
          unitPrice: Math.round(unitPrice * 100) / 100,
          total: Math.round(total * 100) / 100,
          sortOrder: sortOrder++,
          createdAt: quote.createdAt,
          isDemoData: true,
        };

        lineItems.push(lineItem);
        runningTotal += total;
      }
    }

    logProgress(`Created quote for ${project.name}: ${lineItems.filter(li => li.quoteId === quoteId).length} line items`);
  }

  // Write quotes
  await executeBatchWrites(
    db,
    quotes,
    (batch, quote) => {
      const ref = quotesRef.doc(quote.id);
      batch.set(ref, {
        ...quote,
        createdAt: toTimestamp(quote.createdAt),
        updatedAt: Timestamp.now(),
      });
    },
    'Quotes'
  );

  // Write line items
  await executeBatchWrites(
    db,
    lineItems,
    (batch, item) => {
      const ref = lineItemsRef.doc(item.id);
      batch.set(ref, {
        ...item,
        createdAt: toTimestamp(item.createdAt),
        updatedAt: Timestamp.now(),
      });
    },
    'Quote Line Items'
  );

  logSuccess(`Created ${quotes.length} quotes with ${lineItems.length} line items`);
  return quotes.length;
}

// Run if executed directly
if (require.main === module) {
  seedQuotes()
    .then((count) => {
      console.log(`\n✅ Created ${count} quotes`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error seeding quotes:', error);
      process.exit(1);
    });
}

export { seedQuotes };
