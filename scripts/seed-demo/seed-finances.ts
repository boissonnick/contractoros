/**
 * Seed Comprehensive Finance Data
 * Creates invoices, payments, expenses, and financial summaries
 */

import { Timestamp } from 'firebase-admin/firestore';
import { getDb } from './db';
import {
  DEMO_ORG_ID,
  DEMO_USERS,
  DEMO_CLIENTS,
  daysAgo,
  monthsAgo,
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

const db = getDb();

// Demo projects with financial data
const DEMO_PROJECTS = [
  { id: 'demo-proj-smith-kitchen', name: 'Smith Kitchen Remodel', budget: 45000, clientId: DEMO_CLIENTS.smith.id },
  { id: 'demo-proj-garcia-bath', name: 'Garcia Master Bath', budget: 32000, clientId: DEMO_CLIENTS.garcia.id },
  { id: 'demo-proj-mainst-retail', name: 'Main St. Retail Storefront', budget: 125000, clientId: DEMO_CLIENTS.mainStRetail.id },
  { id: 'demo-proj-cafe-ti', name: 'Downtown Cafe TI', budget: 78000, clientId: DEMO_CLIENTS.downtownCafe.id },
  { id: 'demo-proj-thompson-deck', name: 'Thompson Deck Build', budget: 22000, clientId: DEMO_CLIENTS.thompson.id },
  { id: 'demo-proj-office-park', name: 'Office Park Suite 200', budget: 95000, clientId: DEMO_CLIENTS.officePark.id },
  { id: 'demo-proj-garcia-basement', name: 'Garcia Basement Finish', budget: 55000, clientId: DEMO_CLIENTS.garcia.id },
];

// Expense categories
const EXPENSE_CATEGORIES = ['materials', 'labor', 'equipment', 'permits', 'subcontractor', 'tools', 'fuel', 'misc'];

// Vendor names
const VENDORS = [
  'Home Depot Pro', 'Lowes Commercial', 'Ferguson Plumbing', 'ABC Supply',
  'Sherwin Williams', 'Floor & Decor', 'Grainger', 'Fastenal',
  'United Rentals', 'Sunbelt Rentals', 'Denver Lumber', 'Rocky Mountain Tile'
];

// Payment methods
const PAYMENT_METHODS = ['credit_card', 'check', 'ach', 'cash'];

async function seedFinances(): Promise<{ invoices: number; payments: number; expenses: number }> {
  logSection('Seeding Comprehensive Finance Data');

  const invoicesRef = db.collection('organizations').doc(DEMO_ORG_ID).collection('invoices');
  const paymentsRef = db.collection('organizations').doc(DEMO_ORG_ID).collection('payments');
  const expensesRef = db.collection('organizations').doc(DEMO_ORG_ID).collection('expenses');

  const invoices: any[] = [];
  const payments: any[] = [];
  const expenses: any[] = [];

  let invoiceNumber = 1000;

  for (const project of DEMO_PROJECTS) {
    // Create 2-4 invoices per project
    const numInvoices = randomInt(2, 4);
    let invoicedTotal = 0;
    const projectStartDays = randomInt(30, 120);

    for (let i = 0; i < numInvoices; i++) {
      invoiceNumber++;
      const isFirst = i === 0;
      const isLast = i === numInvoices - 1;

      // Calculate invoice amount
      let invoiceAmount: number;
      if (isFirst) {
        invoiceAmount = project.budget * 0.30; // 30% deposit
      } else if (isLast) {
        invoiceAmount = project.budget - invoicedTotal; // Remaining balance
      } else {
        invoiceAmount = project.budget * randomAmount(0.20, 0.35);
      }
      invoiceAmount = Math.round(invoiceAmount * 100) / 100;
      invoicedTotal += invoiceAmount;

      const invoiceDaysAgo = projectStartDays - (i * randomInt(15, 30));
      const dueDaysAgo = invoiceDaysAgo - 30;
      const isPaid = dueDaysAgo > 7 || Math.random() > 0.3;

      const invoice = {
        id: generateId('inv'),
        orgId: DEMO_ORG_ID,
        projectId: project.id,
        projectName: project.name,
        number: `INV-${invoiceNumber}`,
        type: isFirst ? 'deposit' : isLast ? 'final' : 'progress',
        status: isPaid ? 'paid' : dueDaysAgo > 0 ? 'overdue' : 'sent',
        clientId: project.clientId,
        subtotal: invoiceAmount,
        taxRate: 0,
        taxAmount: 0,
        total: invoiceAmount,
        amountPaid: isPaid ? invoiceAmount : 0,
        amountDue: isPaid ? 0 : invoiceAmount,
        paymentTerms: 'Net 30',
        dueDate: daysAgo(dueDaysAgo),
        notes: isFirst ? 'Deposit invoice' : isLast ? 'Final invoice - project completion' : 'Progress billing',
        sentAt: daysAgo(invoiceDaysAgo),
        paidAt: isPaid ? daysAgo(invoiceDaysAgo - randomInt(3, 14)) : null,
        createdBy: DEMO_USERS.pm.uid,
        createdByName: DEMO_USERS.pm.displayName,
        createdAt: daysAgo(invoiceDaysAgo + 1),
        isDemoData: true,
      };

      invoices.push(invoice);

      // Create payment record if paid
      if (isPaid) {
        payments.push({
          id: generateId('pmt'),
          orgId: DEMO_ORG_ID,
          invoiceId: invoice.id,
          invoiceNumber: invoice.number,
          projectId: project.id,
          projectName: project.name,
          clientId: project.clientId,
          amount: invoiceAmount,
          method: randomItem(PAYMENT_METHODS),
          status: 'completed',
          reference: `CHK-${randomInt(10000, 99999)}`,
          receivedAt: invoice.paidAt,
          depositedAt: new Date(invoice.paidAt!.getTime() + randomInt(1, 3) * 86400000),
          createdBy: DEMO_USERS.admin.uid,
          createdByName: DEMO_USERS.admin.displayName,
          createdAt: invoice.paidAt,
          isDemoData: true,
        });
      }
    }

    // Create 5-15 expenses per project
    const numExpenses = randomInt(5, 15);
    for (let i = 0; i < numExpenses; i++) {
      const expenseDaysAgo = randomInt(1, projectStartDays);
      const category = randomItem(EXPENSE_CATEGORIES);
      const vendor = randomItem(VENDORS);

      let amount: number;
      switch (category) {
        case 'materials':
          amount = randomAmount(100, 5000);
          break;
        case 'subcontractor':
          amount = randomAmount(500, 8000);
          break;
        case 'equipment':
          amount = randomAmount(50, 500);
          break;
        case 'permits':
          amount = randomAmount(100, 1000);
          break;
        default:
          amount = randomAmount(20, 300);
      }

      expenses.push({
        id: generateId('exp'),
        orgId: DEMO_ORG_ID,
        projectId: project.id,
        projectName: project.name,
        category,
        vendor,
        description: `${category.charAt(0).toUpperCase() + category.slice(1)} - ${vendor}`,
        amount: Math.round(amount * 100) / 100,
        date: daysAgo(expenseDaysAgo),
        paymentMethod: randomItem(PAYMENT_METHODS),
        status: randomItem(['pending', 'approved', 'approved', 'approved', 'reimbursed']),
        receiptUrl: null,
        submittedBy: randomItem([DEMO_USERS.foreman.uid, DEMO_USERS.pm.uid]),
        submittedByName: randomItem([DEMO_USERS.foreman.displayName, DEMO_USERS.pm.displayName]),
        approvedBy: DEMO_USERS.owner.uid,
        approvedByName: DEMO_USERS.owner.displayName,
        approvedAt: daysAgo(expenseDaysAgo - 1),
        createdAt: daysAgo(expenseDaysAgo),
        isDemoData: true,
      });
    }

    logProgress(`Created finance data for ${project.name}`);
  }

  // Add some general business expenses (not project-specific)
  const generalExpenses = [
    { description: 'Office supplies', category: 'misc', amount: 156.42 },
    { description: 'Vehicle maintenance', category: 'fuel', amount: 487.50 },
    { description: 'Tool replacement', category: 'tools', amount: 324.99 },
    { description: 'Insurance payment', category: 'misc', amount: 1250.00 },
    { description: 'Software subscription', category: 'misc', amount: 99.00 },
    { description: 'Safety equipment', category: 'tools', amount: 245.80 },
    { description: 'Fuel for work vehicles', category: 'fuel', amount: 387.25 },
  ];

  for (const exp of generalExpenses) {
    const expenseDaysAgo = randomInt(1, 30);
    expenses.push({
      id: generateId('exp'),
      orgId: DEMO_ORG_ID,
      projectId: null,
      projectName: null,
      category: exp.category,
      vendor: randomItem(VENDORS),
      description: exp.description,
      amount: exp.amount,
      date: daysAgo(expenseDaysAgo),
      paymentMethod: 'credit_card',
      status: 'approved',
      receiptUrl: null,
      submittedBy: DEMO_USERS.admin.uid,
      submittedByName: DEMO_USERS.admin.displayName,
      approvedBy: DEMO_USERS.owner.uid,
      approvedByName: DEMO_USERS.owner.displayName,
      approvedAt: daysAgo(expenseDaysAgo - 1),
      createdAt: daysAgo(expenseDaysAgo),
      isDemoData: true,
    });
  }

  // Write invoices
  await executeBatchWrites(
    db,
    invoices,
    (batch, invoice) => {
      const ref = invoicesRef.doc(invoice.id);
      batch.set(ref, {
        ...invoice,
        dueDate: toTimestamp(invoice.dueDate),
        sentAt: invoice.sentAt ? toTimestamp(invoice.sentAt) : null,
        paidAt: invoice.paidAt ? toTimestamp(invoice.paidAt) : null,
        createdAt: toTimestamp(invoice.createdAt),
        updatedAt: Timestamp.now(),
      });
    },
    'Invoices'
  );

  // Write payments
  await executeBatchWrites(
    db,
    payments,
    (batch, payment) => {
      const ref = paymentsRef.doc(payment.id);
      batch.set(ref, {
        ...payment,
        receivedAt: payment.receivedAt ? toTimestamp(payment.receivedAt) : null,
        depositedAt: payment.depositedAt ? toTimestamp(payment.depositedAt) : null,
        createdAt: toTimestamp(payment.createdAt),
        updatedAt: Timestamp.now(),
      });
    },
    'Payments'
  );

  // Write expenses
  await executeBatchWrites(
    db,
    expenses,
    (batch, expense) => {
      const ref = expensesRef.doc(expense.id);
      batch.set(ref, {
        ...expense,
        date: toTimestamp(expense.date),
        approvedAt: expense.approvedAt ? toTimestamp(expense.approvedAt) : null,
        createdAt: toTimestamp(expense.createdAt),
        updatedAt: Timestamp.now(),
      });
    },
    'Expenses'
  );

  logSuccess(`Created ${invoices.length} invoices, ${payments.length} payments, ${expenses.length} expenses`);

  return {
    invoices: invoices.length,
    payments: payments.length,
    expenses: expenses.length,
  };
}

export { seedFinances };

// Run if executed directly
if (require.main === module) {
  seedFinances()
    .then((counts) => {
      console.log(`\n✅ Created finance data:`);
      console.log(`   - ${counts.invoices} invoices`);
      console.log(`   - ${counts.payments} payments`);
      console.log(`   - ${counts.expenses} expenses`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error seeding finances:', error);
      process.exit(1);
    });
}
