/**
 * Demo Payment Seeder for ContractorOS
 *
 * Creates 38 payments linked to paid invoices:
 * - Payment methods: Check (60%), Credit Card (25%), ACH (15%)
 * - Realistic payment dates (some same day, some 7-14 days after invoice)
 * - Reference numbers for checks
 */

import { Timestamp } from 'firebase-admin/firestore';
import {
  DEMO_ORG_ID,
  DEMO_USERS,
  generateId,
  toTimestamp,
  logSection,
  logSuccess,
  executeBatchWrites,
} from './utils';
import { DEMO_INVOICES } from './seed-financials';

// Type definitions
type PaymentMethod = 'check' | 'credit_card' | 'ach' | 'cash' | 'wire' | 'other';

interface Payment {
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
}

// Payment method distribution (60% check, 25% credit card, 15% ACH)
const PAYMENT_METHODS: PaymentMethod[] = [
  'check', 'check', 'check', 'check', 'check', 'check', // 60%
  'credit_card', 'credit_card', 'credit_card', // 25%
  'ach', 'ach', // 15%
];

// Check number generator - starts at realistic number
let checkNumberCounter = 4521;
const nextCheckNumber = (): string => {
  checkNumberCounter++;
  return String(checkNumberCounter);
};

// Get a random payment method based on distribution
const getPaymentMethod = (index: number): PaymentMethod => {
  return PAYMENT_METHODS[index % PAYMENT_METHODS.length];
};

// Generate payment reference based on method
const generateReference = (method: PaymentMethod): string => {
  switch (method) {
    case 'check':
      return `Check #${nextCheckNumber()}`;
    case 'credit_card':
      return `CC-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    case 'ach':
      return `ACH-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    default:
      return '';
  }
};

// Generate notes for payments
const generatePaymentNotes = (method: PaymentMethod, clientName: string): string | undefined => {
  const noteOptions: Record<PaymentMethod, (string | undefined)[]> = {
    check: [
      `Received check from ${clientName}`,
      'Check received via mail',
      'Hand-delivered check',
      'Check picked up on site',
      undefined,
      undefined,
    ],
    credit_card: [
      'Paid online via client portal',
      'Phone payment',
      'Card on file',
      undefined,
    ],
    ach: [
      'Direct bank transfer',
      'Recurring payment',
      undefined,
    ],
    cash: ['Cash payment received', undefined],
    wire: ['Wire transfer received', undefined],
    other: [undefined],
  };

  const options = noteOptions[method];
  return options[Math.floor(Math.random() * options.length)];
};

// ============================================================================
// GENERATE PAYMENTS
// ============================================================================

export const generateDemoPayments = (): Payment[] => {
  const payments: Payment[] = [];
  checkNumberCounter = 4521; // Reset counter

  // Get only paid invoices
  const paidInvoices = DEMO_INVOICES.filter(inv => inv.status === 'paid');

  paidInvoices.forEach((invoice, index) => {
    const method = getPaymentMethod(index);
    const reference = generateReference(method);
    const receivedAt = invoice.paidAt || invoice.createdAt;
    const notes = generatePaymentNotes(method, invoice.clientName);

    const payment: Payment = {
      id: generateId('pay'),
      orgId: DEMO_ORG_ID,
      invoiceId: invoice.id,
      amount: invoice.total,
      method,
      reference,
      notes,
      receivedAt,
      recordedBy: DEMO_USERS.admin.uid,
      recordedByName: DEMO_USERS.admin.displayName,
      createdAt: receivedAt,
      isDemoData: true,
    };

    payments.push(payment);
  });

  return payments;
};

// Export for use in seeding scripts
export const DEMO_PAYMENTS = generateDemoPayments();

// Summary for verification
export const getPaymentSummary = () => {
  const payments = DEMO_PAYMENTS;
  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

  const byMethod = {
    check: payments.filter(p => p.method === 'check').length,
    credit_card: payments.filter(p => p.method === 'credit_card').length,
    ach: payments.filter(p => p.method === 'ach').length,
  };

  return {
    total: payments.length,
    totalAmount,
    byMethod,
    checkPercentage: Math.round((byMethod.check / payments.length) * 100),
    ccPercentage: Math.round((byMethod.credit_card / payments.length) * 100),
    achPercentage: Math.round((byMethod.ach / payments.length) * 100),
  };
};

// Payment data grouped by invoice for easy lookup
export const getPaymentsByInvoice = (): Map<string, Payment[]> => {
  const paymentMap = new Map<string, Payment[]>();

  DEMO_PAYMENTS.forEach(payment => {
    const existing = paymentMap.get(payment.invoiceId) || [];
    existing.push(payment);
    paymentMap.set(payment.invoiceId, existing);
  });

  return paymentMap;
};

// Helper to remove undefined values (Firestore doesn't accept undefined)
const removeUndefined = <T extends Record<string, unknown>>(obj: T): T => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined)
  ) as T;
};

// Firestore seeding function
export async function seedPayments(
  db: FirebaseFirestore.Firestore,
  orgId: string
): Promise<{ count: number }> {
  logSection('Seeding Payments');

  const payments = generateDemoPayments();

  await executeBatchWrites(
    db,
    payments,
    (batch, payment) => {
      const docRef = db
        .collection('organizations')
        .doc(orgId)
        .collection('payments')
        .doc(payment.id);

      batch.set(docRef, removeUndefined({
        ...payment,
        orgId,
        receivedAt: toTimestamp(payment.receivedAt),
        createdAt: toTimestamp(payment.createdAt),
      }));
    },
    'Payments'
  );

  logSuccess(`Seeded ${payments.length} payments`);
  return { count: payments.length };
}
