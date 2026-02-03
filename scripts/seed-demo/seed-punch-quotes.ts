/**
 * Seed Punch List and Quotes Data for Sprint 38
 */

import { getDb } from './db';
import { Timestamp } from 'firebase-admin/firestore';

const db = getDb();
const orgId = 'u8hwVPLEv4YL9D71ymBwCOrmKta2';

const DEMO_PROJECTS = [
  { id: 'demo-proj-smith-kitchen', name: 'Smith Kitchen Remodel', clientId: 'demo-client-smith' },
  { id: 'demo-proj-garcia-bath', name: 'Garcia Master Bath', clientId: 'demo-client-garcia' },
  { id: 'demo-proj-mainst-retail', name: 'Main St. Retail Storefront', clientId: 'demo-client-main-st-retail' },
];

const PUNCH_LIST_ITEMS = [
  'Touch up paint at corner trim',
  'Adjust cabinet door alignment',
  'Caulk gap at backsplash',
  'Fix squeaky floorboard',
  'Replace damaged outlet cover',
  'Grout touch-up at shower corner',
  'Adjust door closer tension',
  'Clean window tracks',
  'Touch up drywall patch',
  'Tighten loose towel bar',
];

const QUOTE_LINE_ITEMS = [
  { description: 'Demo & removal', quantity: 1, unitPrice: 2500, category: 'labor' },
  { description: 'Framing materials', quantity: 1, unitPrice: 3200, category: 'materials' },
  { description: 'Electrical rough-in', quantity: 1, unitPrice: 4500, category: 'labor' },
  { description: 'Plumbing rough-in', quantity: 1, unitPrice: 5200, category: 'labor' },
  { description: 'Drywall installation', quantity: 450, unitPrice: 3.50, category: 'materials' },
  { description: 'Cabinet package', quantity: 1, unitPrice: 12000, category: 'materials' },
  { description: 'Countertops (granite)', quantity: 35, unitPrice: 85, category: 'materials' },
  { description: 'Tile flooring', quantity: 200, unitPrice: 8, category: 'materials' },
  { description: 'Light fixtures', quantity: 6, unitPrice: 250, category: 'materials' },
  { description: 'Final cleanup', quantity: 1, unitPrice: 500, category: 'labor' },
];

async function seed() {
  console.log('='.repeat(50));
  console.log('Seeding Punch List and Quotes');
  console.log('='.repeat(50));

  const now = Timestamp.now();
  const punchListRef = db.collection('organizations').doc(orgId).collection('punchList');
  const quotesRef = db.collection('organizations').doc(orgId).collection('quotes');
  const lineItemsRef = db.collection('organizations').doc(orgId).collection('quoteLineItems');

  // Seed punch list items
  console.log('\nCreating punch list items...');
  let punchCount = 0;
  for (const project of DEMO_PROJECTS) {
    const numItems = 3 + Math.floor(Math.random() * 4); // 3-6 items per project
    for (let i = 0; i < numItems; i++) {
      const item = PUNCH_LIST_ITEMS[Math.floor(Math.random() * PUNCH_LIST_ITEMS.length)];
      const status = ['pending', 'pending', 'in_progress', 'completed'][Math.floor(Math.random() * 4)];

      await punchListRef.add({
        orgId,
        projectId: project.id,
        projectName: project.name,
        description: item,
        location: ['Kitchen', 'Bathroom', 'Living Room', 'Bedroom', 'Hallway'][Math.floor(Math.random() * 5)],
        priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        status,
        assignedTo: status !== 'pending' ? 'demo-carlos-rodriguez' : null,
        completedAt: status === 'completed' ? now : null,
        createdAt: now,
        updatedAt: now,
      });
      punchCount++;
    }
  }
  console.log(`  ✓ ${punchCount} punch list items created`);

  // Seed quotes
  console.log('\nCreating quotes...');
  let quoteCount = 0;
  let lineItemCount = 0;

  for (const project of DEMO_PROJECTS) {
    // Create 1-2 quotes per project
    const numQuotes = 1 + Math.floor(Math.random() * 2);
    for (let q = 0; q < numQuotes; q++) {
      const quoteId = `quote-${project.id}-${q + 1}`;
      const numLineItems = 4 + Math.floor(Math.random() * 5); // 4-8 line items
      const selectedItems = QUOTE_LINE_ITEMS.slice(0, numLineItems);

      let subtotal = 0;
      const lineItems: any[] = [];

      for (const item of selectedItems) {
        const total = item.quantity * item.unitPrice * (0.9 + Math.random() * 0.2);
        subtotal += total;

        const lineItem = {
          id: `li-${quoteId}-${lineItems.length}`,
          orgId,
          quoteId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: Math.round(total * 100) / 100,
          category: item.category,
          sortOrder: lineItems.length,
          createdAt: now,
        };
        lineItems.push(lineItem);
        lineItemCount++;
      }

      // Create the quote
      const quote = {
        id: quoteId,
        orgId,
        projectId: project.id,
        projectName: project.name,
        clientId: project.clientId,
        quoteNumber: `QT-2026-${String(quoteCount + 1).padStart(3, '0')}`,
        status: ['draft', 'sent', 'accepted', 'declined'][Math.floor(Math.random() * 4)],
        subtotal: Math.round(subtotal * 100) / 100,
        taxRate: 8.25,
        tax: Math.round(subtotal * 0.0825 * 100) / 100,
        total: Math.round(subtotal * 1.0825 * 100) / 100,
        validUntil: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
        notes: 'Thank you for the opportunity to provide this estimate.',
        createdAt: now,
        updatedAt: now,
      };

      await quotesRef.doc(quoteId).set(quote);

      // Create line items
      const batch = db.batch();
      for (const li of lineItems) {
        batch.set(lineItemsRef.doc(li.id), li);
      }
      await batch.commit();

      quoteCount++;
    }
  }
  console.log(`  ✓ ${quoteCount} quotes created`);
  console.log(`  ✓ ${lineItemCount} line items created`);

  console.log('\n' + '='.repeat(50));
  console.log('Seed Complete');
  console.log('='.repeat(50));
}

seed()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  });
