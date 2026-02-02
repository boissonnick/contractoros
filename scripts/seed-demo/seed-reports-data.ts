/**
 * Reports Demo Data Enhancement for ContractorOS
 * Sprint 37B - Task 5
 *
 * Enhances demo data for reports:
 * 1. Historical revenue - Backdated paid invoices (3-6 months)
 * 2. Labor costs - Project-linked time entries with proper rates
 * 3. Invoice aging - Realistic distribution of overdue invoices
 */

import { Timestamp } from 'firebase-admin/firestore';
import {
  DEMO_ORG_ID,
  DEMO_USERS,
  DEMO_CLIENTS,
  daysAgo,
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

// ============================================
// Type Definitions
// ============================================

type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'partial' | 'paid' | 'overdue' | 'void';

interface InvoiceLineItem {
  id: string;
  sortOrder: number;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
}

interface Invoice {
  id: string;
  projectId: string;
  orgId: string;
  number: string;
  type: string;
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
}

// ============================================
// Constants
// ============================================

// Completed projects for historical data
const COMPLETED_PROJECTS = [
  {
    id: 'demo-proj-smith-kitchen',
    name: 'Smith Kitchen Remodel',
    client: DEMO_CLIENTS.smith,
    budget: 45000,
    completedMonthsAgo: 8,
  },
  {
    id: 'demo-proj-wilson-fence',
    name: 'Wilson Fence Installation',
    client: DEMO_CLIENTS.wilson,
    budget: 8500,
    completedMonthsAgo: 6,
  },
  {
    id: 'demo-proj-mainst-retail',
    name: 'Main St. Retail Storefront',
    client: DEMO_CLIENTS.mainStRetail,
    budget: 125000,
    completedMonthsAgo: 4,
  },
  {
    id: 'demo-proj-garcia-bath',
    name: 'Garcia Master Bath',
    client: DEMO_CLIENTS.garcia,
    budget: 35000,
    completedMonthsAgo: 2,
  },
  {
    id: 'demo-proj-cafe-ti',
    name: 'Downtown Cafe TI',
    client: DEMO_CLIENTS.downtownCafe,
    budget: 65000,
    completedMonthsAgo: 1,
  },
];

// Active projects for current invoices
const ACTIVE_PROJECTS = [
  {
    id: 'demo-proj-thompson-deck',
    name: 'Thompson Deck Build',
    client: DEMO_CLIENTS.thompson,
    budget: 22000,
  },
  {
    id: 'demo-proj-office-park',
    name: 'Office Park Suite 200',
    client: DEMO_CLIENTS.officePark,
    budget: 95000,
  },
  {
    id: 'demo-proj-garcia-basement',
    name: 'Garcia Basement Finish',
    client: DEMO_CLIENTS.garcia,
    budget: 55000,
  },
];

// Invoice number counter
let invoiceCounter = 1000;
const nextInvoiceNumber = (): string => {
  invoiceCounter++;
  return `INV-${String(invoiceCounter).padStart(5, '0')}`;
};

// ============================================
// Helper Functions
// ============================================

function createLineItem(
  description: string,
  quantity: number,
  unit: string,
  unitPrice: number,
  sortOrder: number
): InvoiceLineItem {
  return {
    id: generateId('li'),
    sortOrder,
    description,
    quantity,
    unit,
    unitPrice,
    amount: quantity * unitPrice,
  };
}

function createInvoice(
  project: { id: string; name: string; client: typeof DEMO_CLIENTS.smith; budget: number },
  amount: number,
  status: InvoiceStatus,
  createdDate: Date,
  dueDate: Date,
  paidDate?: Date
): Invoice {
  const taxRate = 0; // No tax for simplicity
  const subtotal = amount;
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;
  const amountPaid = status === 'paid' ? total : status === 'partial' ? total * 0.5 : 0;

  const lineItems: InvoiceLineItem[] = [
    createLineItem('Progress Payment - ' + project.name, 1, 'each', amount, 1),
  ];

  const clientName = project.client.companyName || `${project.client.firstName} ${project.client.lastName}`;

  return {
    id: generateId('inv'),
    projectId: project.id,
    orgId: DEMO_ORG_ID,
    number: nextInvoiceNumber(),
    type: 'progress',
    status,
    clientId: project.client.id,
    clientName,
    clientEmail: project.client.email,
    projectName: project.name,
    projectAddress: `${project.client.address.street}, ${project.client.address.city}, ${project.client.address.state} ${project.client.address.zip}`,
    lineItems,
    subtotal,
    taxRate,
    taxAmount,
    total,
    amountDue: total - amountPaid,
    amountPaid,
    paymentTerms: 'Net 30',
    dueDate,
    sentAt: createdDate,
    viewedAt: status !== 'sent' ? new Date(createdDate.getTime() + 86400000) : undefined,
    paidAt: paidDate,
    createdBy: DEMO_USERS.owner.uid,
    createdByName: DEMO_USERS.owner.displayName,
    createdAt: createdDate,
    updatedAt: paidDate || createdDate,
    isDemoData: true,
  };
}

// ============================================
// Seed Functions
// ============================================

/**
 * Seed historical revenue with backdated paid invoices
 * Creates 3-6 months of invoice history
 */
export async function seedHistoricalRevenue(db: FirebaseFirestore.Firestore): Promise<number> {
  logSection('Seeding Historical Revenue');

  const invoices: Invoice[] = [];

  // Create multiple paid invoices for each completed project
  for (const project of COMPLETED_PROJECTS) {
    const invoiceCount = randomInt(2, 4); // 2-4 invoices per completed project
    const invoiceAmount = project.budget / invoiceCount;

    for (let i = 0; i < invoiceCount; i++) {
      const monthOffset = project.completedMonthsAgo + (invoiceCount - i - 1);
      const createdDate = monthsAgo(monthOffset);
      const dueDate = new Date(createdDate);
      dueDate.setDate(dueDate.getDate() + 30);
      const paidDate = new Date(dueDate);
      paidDate.setDate(paidDate.getDate() - randomInt(1, 15)); // Paid 1-15 days before due

      const invoice = createInvoice(
        project,
        invoiceAmount + randomAmount(-500, 500),
        'paid',
        createdDate,
        dueDate,
        paidDate
      );
      invoices.push(invoice);
      logProgress(`Created paid invoice ${invoice.number} for ${project.name}`);
    }
  }

  // Write to Firestore
  await executeBatchWrites(
    db,
    invoices,
    (batch, invoice) => {
      const ref = db.collection('organizations').doc(DEMO_ORG_ID).collection('invoices').doc(invoice.id);
      batch.set(ref, {
        ...invoice,
        dueDate: toTimestamp(invoice.dueDate),
        sentAt: invoice.sentAt ? toTimestamp(invoice.sentAt) : null,
        viewedAt: invoice.viewedAt ? toTimestamp(invoice.viewedAt) : null,
        paidAt: invoice.paidAt ? toTimestamp(invoice.paidAt) : null,
        createdAt: toTimestamp(invoice.createdAt),
        updatedAt: toTimestamp(invoice.updatedAt),
      });
    },
    'Historical Invoices'
  );

  logSuccess(`Created ${invoices.length} historical paid invoices`);
  return invoices.length;
}

/**
 * Seed labor cost data - Ensure time entries have proper hourly rates
 */
export async function seedLaborCostData(db: FirebaseFirestore.Firestore): Promise<number> {
  logSection('Seeding Labor Cost Data');

  // Get existing time entries and update with labor costs
  const timeEntriesSnap = await db
    .collection('organizations')
    .doc(DEMO_ORG_ID)
    .collection('timeEntries')
    .where('isDemoData', '==', true)
    .get();

  if (timeEntriesSnap.empty) {
    logProgress('No existing time entries to update');
    return 0;
  }

  const hourlyRates: Record<string, number> = {
    [DEMO_USERS.foreman.uid]: DEMO_USERS.foreman.hourlyRate,
    [DEMO_USERS.fieldWorker1.uid]: DEMO_USERS.fieldWorker1.hourlyRate,
    [DEMO_USERS.fieldWorker2.uid]: DEMO_USERS.fieldWorker2.hourlyRate,
  };

  let updatedCount = 0;
  const batch = db.batch();

  for (const doc of timeEntriesSnap.docs) {
    const entry = doc.data();
    const hourlyRate = hourlyRates[entry.userId] || 30; // Default rate
    const totalMinutes = entry.totalMinutes || 480; // Default 8 hours
    const laborCost = (totalMinutes / 60) * hourlyRate;

    batch.update(doc.ref, {
      hourlyRate,
      laborCost,
      updatedAt: Timestamp.now(),
    });
    updatedCount++;

    if (updatedCount % 100 === 0) {
      logProgress(`Updated ${updatedCount} time entries with labor costs`);
    }
  }

  await batch.commit();
  logSuccess(`Updated ${updatedCount} time entries with labor costs`);
  return updatedCount;
}

/**
 * Seed invoice aging data with realistic distribution:
 * - 70% current (paid within terms)
 * - 20% 1-30 days past due
 * - 5% 31-60 days past due
 * - 5% 61-90+ days past due
 */
export async function seedInvoiceAgingData(db: FirebaseFirestore.Firestore): Promise<number> {
  logSection('Seeding Invoice Aging Data');

  const invoices: Invoice[] = [];

  // Create current invoices for active projects (70% of total)
  for (const project of ACTIVE_PROJECTS) {
    const progressPercent = randomInt(30, 70) / 100;
    const invoiceAmount = project.budget * progressPercent;
    const createdDate = daysAgo(randomInt(5, 20));
    const dueDate = new Date(createdDate);
    dueDate.setDate(dueDate.getDate() + 30);

    const invoice = createInvoice(project, invoiceAmount, 'sent', createdDate, dueDate);
    invoices.push(invoice);
    logProgress(`Created current invoice ${invoice.number} for ${project.name}`);
  }

  // Create 1-30 days overdue invoices (20%)
  const overdueProjects = [ACTIVE_PROJECTS[0], ACTIVE_PROJECTS[1]];
  for (const project of overdueProjects) {
    const createdDate = daysAgo(45);
    const dueDate = daysAgo(randomInt(5, 25));

    const invoice = createInvoice(
      project,
      randomAmount(2000, 8000),
      'overdue',
      createdDate,
      dueDate
    );
    invoices.push(invoice);
    logProgress(`Created 1-30 day overdue invoice ${invoice.number}`);
  }

  // Create 31-60 days overdue invoice (5%)
  const invoice60 = createInvoice(
    ACTIVE_PROJECTS[2],
    randomAmount(3000, 6000),
    'overdue',
    daysAgo(75),
    daysAgo(randomInt(35, 55))
  );
  invoices.push(invoice60);
  logProgress(`Created 31-60 day overdue invoice ${invoice60.number}`);

  // Create 61-90+ days overdue invoice (5%)
  const invoice90 = createInvoice(
    COMPLETED_PROJECTS[3],
    randomAmount(1500, 4000),
    'overdue',
    daysAgo(120),
    daysAgo(randomInt(65, 85))
  );
  invoices.push(invoice90);
  logProgress(`Created 61-90+ day overdue invoice ${invoice90.number}`);

  // Write to Firestore
  await executeBatchWrites(
    db,
    invoices,
    (batch, invoice) => {
      const ref = db.collection('organizations').doc(DEMO_ORG_ID).collection('invoices').doc(invoice.id);
      batch.set(ref, {
        ...invoice,
        dueDate: toTimestamp(invoice.dueDate),
        sentAt: invoice.sentAt ? toTimestamp(invoice.sentAt) : null,
        viewedAt: invoice.viewedAt ? toTimestamp(invoice.viewedAt) : null,
        paidAt: invoice.paidAt ? toTimestamp(invoice.paidAt) : null,
        createdAt: toTimestamp(invoice.createdAt),
        updatedAt: toTimestamp(invoice.updatedAt),
      });
    },
    'Aging Invoices'
  );

  logSuccess(`Created ${invoices.length} invoices for aging distribution`);
  return invoices.length;
}

// ============================================
// Main Export
// ============================================

export async function seedReportsData(db: FirebaseFirestore.Firestore): Promise<{
  historicalInvoices: number;
  laborCostUpdates: number;
  agingInvoices: number;
}> {
  logSection('Starting Reports Data Enhancement');

  const historicalInvoices = await seedHistoricalRevenue(db);
  const laborCostUpdates = await seedLaborCostData(db);
  const agingInvoices = await seedInvoiceAgingData(db);

  logSection('Reports Data Enhancement Complete');
  logSuccess(`Historical Invoices: ${historicalInvoices}`);
  logSuccess(`Labor Cost Updates: ${laborCostUpdates}`);
  logSuccess(`Aging Invoices: ${agingInvoices}`);

  return {
    historicalInvoices,
    laborCostUpdates,
    agingInvoices,
  };
}

// CLI execution
if (require.main === module) {
  const { initializeApp, cert } = require('firebase-admin/app');
  const { getFirestore } = require('firebase-admin/firestore');

  // Initialize Firebase Admin
  const serviceAccount = require('../../apps/web/firebase-service-account.json');
  initializeApp({
    credential: cert(serviceAccount),
  });

  const db = getFirestore();

  seedReportsData(db)
    .then((result) => {
      console.log('\n✅ Reports data seeding complete!');
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error seeding reports data:', error);
      process.exit(1);
    });
}
