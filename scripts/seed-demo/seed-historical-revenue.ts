#!/usr/bin/env ts-node
/**
 * Seed Historical Revenue Data for ContractorOS
 *
 * Creates backdated invoices and payments spanning Nov 2025 - Jan 2026
 * to make reports more meaningful with historical revenue data.
 *
 * Creates:
 * - 20 historical invoices across projects
 * - Spread over months: Nov 2025, Dec 2025, Jan 2026
 * - Various statuses: paid, partial, overdue
 * - Matching payments for paid/partial invoices
 *
 * Usage:
 *   npx ts-node scripts/seed-demo/seed-historical-revenue.ts
 */

import { Timestamp } from 'firebase-admin/firestore';
import { getDb } from './db';
import {
  DEMO_ORG_ID,
  DEMO_USERS,
  DEMO_CLIENTS,
  generateId,
  toTimestamp,
  logSection,
  logProgress,
  logSuccess,
  logWarning,
  randomAmount,
  randomItem,
  executeBatchWrites,
} from './utils';

// Type definitions
type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'partial' | 'paid' | 'overdue' | 'void';
type InvoiceType = 'standard' | 'progress' | 'deposit' | 'final' | 'change_order';
type PaymentMethod = 'check' | 'credit_card' | 'ach' | 'cash' | 'wire' | 'other';

interface InvoiceLineItem {
  id: string;
  sortOrder: number;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
}

interface HistoricalInvoice {
  id: string;
  projectId: string;
  orgId: string;
  number: string;
  type: InvoiceType;
  status: InvoiceStatus;
  clientId: string;
  clientName: string;
  clientEmail?: string;
  projectName: string;
  projectAddress: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  amountDue: number;
  amountPaid: number;
  paymentTerms: string;
  dueDate: Date;
  notes?: string;
  sentAt?: Date;
  viewedAt?: Date;
  paidAt?: Date;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
  isDemoData: boolean;
  isHistoricalSeed: boolean;
}

interface HistoricalPayment {
  id: string;
  orgId: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
  receivedAt: Date;
  recordedBy: string;
  recordedByName: string;
  createdAt: Date;
  isDemoData: boolean;
  isHistoricalSeed: boolean;
}

// ============================================
// Date helpers for specific months
// ============================================

function getDateInMonth(year: number, month: number, day: number): Date {
  return new Date(year, month, day);
}

function randomDateInMonth(year: number, month: number): Date {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const day = Math.floor(Math.random() * daysInMonth) + 1;
  return new Date(year, month, day, 10 + Math.floor(Math.random() * 6), Math.floor(Math.random() * 60));
}

// Invoice number generator for historical invoices
let historicalInvoiceCounter = 2024;
const nextHistoricalInvoiceNumber = (): string => {
  historicalInvoiceCounter++;
  return `INV-${String(historicalInvoiceCounter).padStart(5, '0')}`;
};

// Check number generator
let historicalCheckCounter = 3800;
const nextHistoricalCheckNumber = (): string => {
  historicalCheckCounter++;
  return String(historicalCheckCounter);
};

// ============================================
// Line item templates for realistic invoices
// ============================================

const LINE_ITEM_TEMPLATES = {
  residential: [
    { description: 'Labor - General construction', unit: 'hr', priceRange: [45, 75] },
    { description: 'Materials - Lumber and supplies', unit: 'lot', priceRange: [500, 3000] },
    { description: 'Demo and disposal', unit: 'ea', priceRange: [300, 1500] },
    { description: 'Finish carpentry work', unit: 'hr', priceRange: [55, 85] },
    { description: 'Paint and finishes', unit: 'ea', priceRange: [400, 2000] },
    { description: 'Electrical rough-in', unit: 'ea', priceRange: [800, 2500] },
    { description: 'Plumbing rough-in', unit: 'ea', priceRange: [1000, 3500] },
    { description: 'Tile installation', unit: 'sf', priceRange: [8, 15] },
    { description: 'Flooring installation', unit: 'sf', priceRange: [4, 12] },
    { description: 'Cabinet installation', unit: 'ea', priceRange: [2000, 8000] },
  ],
  commercial: [
    { description: 'Commercial demolition', unit: 'ea', priceRange: [2000, 8000] },
    { description: 'Framing and drywall', unit: 'sf', priceRange: [12, 25] },
    { description: 'MEP rough-in work', unit: 'ea', priceRange: [5000, 15000] },
    { description: 'Fire sprinkler modifications', unit: 'ea', priceRange: [3000, 8000] },
    { description: 'Ceiling grid and tiles', unit: 'sf', priceRange: [3, 8] },
    { description: 'Commercial flooring', unit: 'sf', priceRange: [5, 15] },
    { description: 'ADA compliance upgrades', unit: 'ea', priceRange: [2000, 6000] },
    { description: 'Final inspection prep', unit: 'ea', priceRange: [500, 1500] },
  ],
};

function createLineItems(category: 'residential' | 'commercial', targetAmount: number): InvoiceLineItem[] {
  const templates = LINE_ITEM_TEMPLATES[category];
  const items: InvoiceLineItem[] = [];
  let runningTotal = 0;
  let sortOrder = 1;

  // Add 2-5 line items
  const numItems = 2 + Math.floor(Math.random() * 4);
  const amountPerItem = targetAmount / numItems;

  for (let i = 0; i < numItems; i++) {
    const template = randomItem(templates);
    const [minPrice, maxPrice] = template.priceRange;
    const unitPrice = randomAmount(minPrice, maxPrice);

    let quantity = 1;
    if (template.unit === 'hr') {
      quantity = Math.floor(amountPerItem / unitPrice);
    } else if (template.unit === 'sf') {
      quantity = Math.floor(amountPerItem / unitPrice);
    }
    quantity = Math.max(1, quantity);

    const amount = Math.round(quantity * unitPrice * 100) / 100;
    runningTotal += amount;

    items.push({
      id: generateId('li'),
      sortOrder: sortOrder++,
      description: template.description,
      quantity,
      unit: template.unit,
      unitPrice,
      amount,
    });
  }

  return items;
}

// ============================================
// Historical data definitions
// ============================================

interface ProjectInfo {
  id: string;
  name: string;
  address: string;
  clientId: string;
  clientName: string;
  clientEmail?: string;
  category: 'residential' | 'commercial';
}

// These are historical project references that may or may not exist
// We'll create invoices against them for revenue history
const HISTORICAL_PROJECTS: ProjectInfo[] = [
  {
    id: 'demo-proj-smith-kitchen',
    name: 'Smith Kitchen Remodel',
    address: '1234 Maple Street, Denver, CO 80202',
    clientId: DEMO_CLIENTS.smith.id,
    clientName: `${DEMO_CLIENTS.smith.firstName} ${DEMO_CLIENTS.smith.lastName}`,
    clientEmail: DEMO_CLIENTS.smith.email,
    category: 'residential',
  },
  {
    id: 'demo-proj-wilson-fence',
    name: 'Wilson Fence Installation',
    address: '234 Birch Lane, Centennial, CO 80112',
    clientId: DEMO_CLIENTS.wilson.id,
    clientName: `${DEMO_CLIENTS.wilson.firstName} ${DEMO_CLIENTS.wilson.lastName}`,
    clientEmail: DEMO_CLIENTS.wilson.email,
    category: 'residential',
  },
  {
    id: 'demo-proj-mainst-retail',
    name: 'Main St. Retail Storefront',
    address: '250 Main Street, Denver, CO 80202',
    clientId: DEMO_CLIENTS.mainStRetail.id,
    clientName: DEMO_CLIENTS.mainStRetail.companyName!,
    clientEmail: DEMO_CLIENTS.mainStRetail.email,
    category: 'commercial',
  },
  {
    id: 'demo-proj-garcia-bath',
    name: 'Garcia Master Bath',
    address: '567 Oak Avenue, Lakewood, CO 80226',
    clientId: DEMO_CLIENTS.garcia.id,
    clientName: `${DEMO_CLIENTS.garcia.firstName} ${DEMO_CLIENTS.garcia.lastName}`,
    clientEmail: DEMO_CLIENTS.garcia.email,
    category: 'residential',
  },
  {
    id: 'demo-proj-cafe-ti',
    name: 'Downtown Cafe TI',
    address: '100 Main Street, Denver, CO 80202',
    clientId: DEMO_CLIENTS.downtownCafe.id,
    clientName: DEMO_CLIENTS.downtownCafe.companyName!,
    clientEmail: DEMO_CLIENTS.downtownCafe.email,
    category: 'commercial',
  },
  {
    id: 'demo-proj-office-park',
    name: 'Office Park Suite 200',
    address: '500 Business Parkway, Englewood, CO 80111',
    clientId: DEMO_CLIENTS.officePark.id,
    clientName: DEMO_CLIENTS.officePark.companyName!,
    clientEmail: DEMO_CLIENTS.officePark.email,
    category: 'commercial',
  },
  {
    id: 'hist-proj-thompson-repair',
    name: 'Thompson Home Repairs',
    address: '890 Pine Road, Aurora, CO 80012',
    clientId: DEMO_CLIENTS.thompson.id,
    clientName: `${DEMO_CLIENTS.thompson.firstName} ${DEMO_CLIENTS.thompson.lastName}`,
    clientEmail: DEMO_CLIENTS.thompson.email,
    category: 'residential',
  },
  {
    id: 'hist-proj-brown-exterior',
    name: 'Brown Exterior Work',
    address: '678 Cedar Court, Littleton, CO 80120',
    clientId: DEMO_CLIENTS.brown.id,
    clientName: `${DEMO_CLIENTS.brown.firstName} ${DEMO_CLIENTS.brown.lastName}`,
    clientEmail: DEMO_CLIENTS.brown.email,
    category: 'residential',
  },
];

// ============================================
// Generate Historical Invoices and Payments
// ============================================

interface GeneratedData {
  invoices: HistoricalInvoice[];
  payments: HistoricalPayment[];
}

function generateHistoricalData(): GeneratedData {
  const invoices: HistoricalInvoice[] = [];
  const payments: HistoricalPayment[] = [];

  // November 2025 invoices (6-7 invoices)
  const nov2025Invoices = [
    { project: HISTORICAL_PROJECTS[0], amount: 12500, status: 'paid' as const, type: 'progress' as const },
    { project: HISTORICAL_PROJECTS[2], amount: 28000, status: 'paid' as const, type: 'progress' as const },
    { project: HISTORICAL_PROJECTS[3], amount: 8500, status: 'paid' as const, type: 'deposit' as const },
    { project: HISTORICAL_PROJECTS[4], amount: 15000, status: 'paid' as const, type: 'progress' as const },
    { project: HISTORICAL_PROJECTS[6], amount: 3200, status: 'paid' as const, type: 'standard' as const },
    { project: HISTORICAL_PROJECTS[7], amount: 5800, status: 'paid' as const, type: 'standard' as const },
  ];

  // December 2025 invoices (7-8 invoices)
  const dec2025Invoices = [
    { project: HISTORICAL_PROJECTS[0], amount: 18000, status: 'paid' as const, type: 'progress' as const },
    { project: HISTORICAL_PROJECTS[1], amount: 4500, status: 'paid' as const, type: 'final' as const },
    { project: HISTORICAL_PROJECTS[2], amount: 42000, status: 'paid' as const, type: 'progress' as const },
    { project: HISTORICAL_PROJECTS[3], amount: 12000, status: 'paid' as const, type: 'progress' as const },
    { project: HISTORICAL_PROJECTS[4], amount: 22000, status: 'paid' as const, type: 'progress' as const },
    { project: HISTORICAL_PROJECTS[5], amount: 35000, status: 'partial' as const, type: 'deposit' as const },
    { project: HISTORICAL_PROJECTS[6], amount: 6500, status: 'paid' as const, type: 'final' as const },
  ];

  // January 2026 invoices (6-7 invoices, some unpaid for aging reports)
  const jan2026Invoices = [
    { project: HISTORICAL_PROJECTS[0], amount: 14500, status: 'paid' as const, type: 'final' as const },
    { project: HISTORICAL_PROJECTS[2], amount: 25000, status: 'paid' as const, type: 'final' as const },
    { project: HISTORICAL_PROJECTS[3], amount: 11500, status: 'paid' as const, type: 'final' as const },
    { project: HISTORICAL_PROJECTS[4], amount: 18000, status: 'paid' as const, type: 'final' as const },
    { project: HISTORICAL_PROJECTS[5], amount: 28000, status: 'overdue' as const, type: 'progress' as const },
    { project: HISTORICAL_PROJECTS[7], amount: 7200, status: 'overdue' as const, type: 'progress' as const },
  ];

  // Helper to create invoice and payment
  const createInvoiceAndPayment = (
    config: { project: ProjectInfo; amount: number; status: InvoiceStatus; type: InvoiceType },
    year: number,
    month: number
  ) => {
    const createdAt = randomDateInMonth(year, month);
    const dueDate = new Date(createdAt);
    dueDate.setDate(dueDate.getDate() + 30); // Net 30

    const lineItems = createLineItems(config.project.category, config.amount);
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const taxRate = 0;
    const taxAmount = 0;
    const total = subtotal + taxAmount;

    let amountPaid = 0;
    let paidAt: Date | undefined;

    if (config.status === 'paid') {
      amountPaid = total;
      paidAt = new Date(createdAt);
      paidAt.setDate(paidAt.getDate() + Math.floor(Math.random() * 20) + 3);
    } else if (config.status === 'partial') {
      amountPaid = Math.round(total * 0.5 * 100) / 100;
      paidAt = new Date(createdAt);
      paidAt.setDate(paidAt.getDate() + Math.floor(Math.random() * 15) + 5);
    }

    const invoiceId = generateId('hist-inv');

    const invoice: HistoricalInvoice = {
      id: invoiceId,
      projectId: config.project.id,
      orgId: DEMO_ORG_ID,
      number: nextHistoricalInvoiceNumber(),
      type: config.type,
      status: config.status,
      clientId: config.project.clientId,
      clientName: config.project.clientName,
      clientEmail: config.project.clientEmail,
      projectName: config.project.name,
      projectAddress: config.project.address,
      lineItems,
      subtotal,
      taxRate,
      taxAmount,
      total,
      amountDue: total - amountPaid,
      amountPaid,
      paymentTerms: 'Net 30',
      dueDate,
      sentAt: createdAt,
      viewedAt: new Date(createdAt.getTime() + 86400000),
      paidAt,
      createdBy: DEMO_USERS.owner.uid,
      createdByName: DEMO_USERS.owner.displayName,
      createdAt,
      updatedAt: paidAt || createdAt,
      isDemoData: true,
      isHistoricalSeed: true,
    };

    invoices.push(invoice);

    // Create payment(s) for paid/partial invoices
    if (amountPaid > 0 && paidAt) {
      const paymentMethods: PaymentMethod[] = ['check', 'check', 'check', 'credit_card', 'ach'];
      const method = randomItem(paymentMethods);

      let reference: string | undefined;
      if (method === 'check') {
        reference = `Check #${nextHistoricalCheckNumber()}`;
      } else if (method === 'credit_card') {
        reference = `CC-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
      } else if (method === 'ach') {
        reference = `ACH-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
      }

      const payment: HistoricalPayment = {
        id: generateId('hist-pay'),
        orgId: DEMO_ORG_ID,
        invoiceId,
        amount: amountPaid,
        method,
        reference,
        receivedAt: paidAt,
        recordedBy: DEMO_USERS.admin.uid,
        recordedByName: DEMO_USERS.admin.displayName,
        createdAt: paidAt,
        isDemoData: true,
        isHistoricalSeed: true,
      };

      payments.push(payment);
    }
  };

  // Generate November 2025 data
  for (const config of nov2025Invoices) {
    createInvoiceAndPayment(config, 2025, 10); // November = month 10 (0-indexed)
  }

  // Generate December 2025 data
  for (const config of dec2025Invoices) {
    createInvoiceAndPayment(config, 2025, 11); // December = month 11
  }

  // Generate January 2026 data
  for (const config of jan2026Invoices) {
    createInvoiceAndPayment(config, 2026, 0); // January = month 0
  }

  return { invoices, payments };
}

// ============================================
// Remove undefined helper
// ============================================

const removeUndefined = <T extends Record<string, unknown>>(obj: T): T => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined)
  ) as T;
};

// ============================================
// Main seed function
// ============================================

async function seedHistoricalRevenue(): Promise<void> {
  const db = getDb();

  logSection('Seeding Historical Revenue Data');
  logProgress('Generating invoices and payments for Nov 2025 - Jan 2026...');

  const { invoices, payments } = generateHistoricalData();

  // Calculate summary stats
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalCollected = payments.reduce((sum, pay) => sum + pay.amount, 0);
  const paidCount = invoices.filter(inv => inv.status === 'paid').length;
  const partialCount = invoices.filter(inv => inv.status === 'partial').length;
  const overdueCount = invoices.filter(inv => inv.status === 'overdue').length;

  logProgress(`Generated ${invoices.length} invoices totaling $${totalInvoiced.toLocaleString()}`);
  logProgress(`Generated ${payments.length} payments totaling $${totalCollected.toLocaleString()}`);

  // Seed invoices
  logProgress('Writing invoices to Firestore...');
  await executeBatchWrites(
    db,
    invoices,
    (batch, invoice) => {
      const docRef = db
        .collection('organizations')
        .doc(DEMO_ORG_ID)
        .collection('invoices')
        .doc(invoice.id);

      batch.set(docRef, removeUndefined({
        ...invoice,
        dueDate: toTimestamp(invoice.dueDate),
        sentAt: invoice.sentAt ? toTimestamp(invoice.sentAt) : null,
        viewedAt: invoice.viewedAt ? toTimestamp(invoice.viewedAt) : null,
        paidAt: invoice.paidAt ? toTimestamp(invoice.paidAt) : null,
        createdAt: toTimestamp(invoice.createdAt),
        updatedAt: toTimestamp(invoice.updatedAt),
      }));
    },
    'Invoices'
  );

  // Seed payments
  logProgress('Writing payments to Firestore...');
  await executeBatchWrites(
    db,
    payments,
    (batch, payment) => {
      const docRef = db
        .collection('organizations')
        .doc(DEMO_ORG_ID)
        .collection('payments')
        .doc(payment.id);

      batch.set(docRef, removeUndefined({
        ...payment,
        receivedAt: toTimestamp(payment.receivedAt),
        createdAt: toTimestamp(payment.createdAt),
      }));
    },
    'Payments'
  );

  // Summary
  logSection('Historical Revenue Summary');
  console.log(`  Invoices created:    ${invoices.length}`);
  console.log(`    - Paid:            ${paidCount}`);
  console.log(`    - Partial:         ${partialCount}`);
  console.log(`    - Overdue:         ${overdueCount}`);
  console.log(`  ─────────────────────────────`);
  console.log(`  Total invoiced:      $${totalInvoiced.toLocaleString()}`);
  console.log(`  Total collected:     $${totalCollected.toLocaleString()}`);
  console.log(`  Outstanding:         $${(totalInvoiced - totalCollected).toLocaleString()}`);
  console.log();
  console.log(`  Payments created:    ${payments.length}`);

  // By month breakdown
  logSection('Revenue by Month');
  const byMonth = new Map<string, { invoiced: number; collected: number }>();

  for (const inv of invoices) {
    const month = `${inv.createdAt.getFullYear()}-${String(inv.createdAt.getMonth() + 1).padStart(2, '0')}`;
    const existing = byMonth.get(month) || { invoiced: 0, collected: 0 };
    existing.invoiced += inv.total;
    byMonth.set(month, existing);
  }

  for (const pay of payments) {
    const month = `${pay.receivedAt.getFullYear()}-${String(pay.receivedAt.getMonth() + 1).padStart(2, '0')}`;
    const existing = byMonth.get(month) || { invoiced: 0, collected: 0 };
    existing.collected += pay.amount;
    byMonth.set(month, existing);
  }

  const sortedMonths = Array.from(byMonth.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  for (const [month, data] of sortedMonths) {
    console.log(`  ${month}: Invoiced $${data.invoiced.toLocaleString()}, Collected $${data.collected.toLocaleString()}`);
  }

  logSuccess('Historical revenue data seeded successfully!');
}

// ============================================
// Run if executed directly
// ============================================

if (require.main === module) {
  seedHistoricalRevenue()
    .then(() => {
      console.log('\nDone!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nError seeding historical revenue:', error);
      process.exit(1);
    });
}

export { seedHistoricalRevenue };
