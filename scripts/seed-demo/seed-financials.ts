/**
 * Demo Invoice Seeder for ContractorOS
 *
 * Creates 45 invoices across all demo projects:
 * - 38 paid invoices
 * - 4 unpaid/current invoices
 * - 3 overdue invoices
 *
 * Invoice pattern per project:
 * - Deposit invoice: 30% on contract signing
 * - Progress invoices: Based on milestones
 * - Final invoice: Remaining balance on completion
 */

import { Timestamp } from 'firebase-admin/firestore';
import {
  DEMO_ORG_ID,
  DEMO_USERS,
  DEMO_CLIENTS,
  daysAgo,
  daysFromNow,
  monthsAgo,
  generateId,
  toTimestamp,
  logSection,
  logProgress,
  logSuccess,
  executeBatchWrites,
} from './utils';

// Type definitions (matching types/index.ts)
type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'partial' | 'paid' | 'overdue' | 'void';
type InvoiceType = 'standard' | 'progress' | 'deposit' | 'final' | 'change_order';

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
}

// Invoice number generator
let invoiceCounter = 0;
const nextInvoiceNumber = (): string => {
  invoiceCounter++;
  return `INV-${String(invoiceCounter).padStart(5, '0')}`;
};

// Create a basic line item
const createLineItem = (
  description: string,
  quantity: number,
  unit: string,
  unitPrice: number,
  sortOrder: number
): InvoiceLineItem => ({
  id: generateId('li'),
  sortOrder,
  description,
  quantity,
  unit,
  unitPrice,
  amount: quantity * unitPrice,
});

// Invoice factory
interface InvoiceParams {
  projectId: string;
  projectName: string;
  projectAddress: string;
  clientId: string;
  clientName: string;
  clientEmail?: string;
  type: InvoiceType;
  status: InvoiceStatus;
  lineItems: InvoiceLineItem[];
  createdAt: Date;
  dueDate: Date;
  paidAt?: Date;
  notes?: string;
}

const createInvoice = (params: InvoiceParams): Invoice => {
  const subtotal = params.lineItems.reduce((sum, item) => sum + item.amount, 0);
  const taxRate = 0; // Most construction services not taxed in CO
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;
  const amountPaid = params.status === 'paid' ? total : 0;

  return {
    id: generateId('inv'),
    projectId: params.projectId,
    orgId: DEMO_ORG_ID,
    number: nextInvoiceNumber(),
    type: params.type,
    status: params.status,
    clientId: params.clientId,
    clientName: params.clientName,
    clientEmail: params.clientEmail,
    projectName: params.projectName,
    projectAddress: params.projectAddress,
    lineItems: params.lineItems,
    subtotal,
    taxRate,
    taxAmount,
    total,
    amountDue: total - amountPaid,
    amountPaid,
    paymentTerms: 'Net 30',
    dueDate: params.dueDate,
    notes: params.notes,
    sentAt: params.createdAt,
    viewedAt: params.status !== 'draft' ? new Date(params.createdAt.getTime() + 86400000) : undefined,
    paidAt: params.paidAt,
    createdBy: DEMO_USERS.owner.uid,
    createdByName: DEMO_USERS.owner.displayName,
    createdAt: params.createdAt,
    updatedAt: params.paidAt || params.createdAt,
    isDemoData: true,
  };
};

// ============================================================================
// DEMO INVOICES
// ============================================================================

export const generateDemoInvoices = (): Invoice[] => {
  const invoices: Invoice[] = [];
  invoiceCounter = 0; // Reset counter

  // -------------------------------------------------------------------------
  // Project 1: Smith Kitchen Remodel - $45,000 (COMPLETED 8 months ago)
  // 3 invoices, all paid
  // -------------------------------------------------------------------------
  const proj1Address = '1234 Maple Street, Denver, CO 80202';
  const proj1Total = 45000;

  invoices.push(createInvoice({
    projectId: 'demo-proj-smith-kitchen',
    projectName: 'Smith Kitchen Remodel',
    projectAddress: proj1Address,
    clientId: DEMO_CLIENTS.smith.id,
    clientName: `${DEMO_CLIENTS.smith.firstName} ${DEMO_CLIENTS.smith.lastName}`,
    clientEmail: DEMO_CLIENTS.smith.email,
    type: 'deposit',
    status: 'paid',
    lineItems: [
      createLineItem('Project deposit - Kitchen Remodel', 1, 'ea', proj1Total * 0.30, 1),
    ],
    createdAt: monthsAgo(9),
    dueDate: daysAgo(270 - 30),
    paidAt: daysAgo(270 - 2),
    notes: 'Deposit for kitchen remodel project. Work begins next week.',
  }));

  invoices.push(createInvoice({
    projectId: 'demo-proj-smith-kitchen',
    projectName: 'Smith Kitchen Remodel',
    projectAddress: proj1Address,
    clientId: DEMO_CLIENTS.smith.id,
    clientName: `${DEMO_CLIENTS.smith.firstName} ${DEMO_CLIENTS.smith.lastName}`,
    clientEmail: DEMO_CLIENTS.smith.email,
    type: 'progress',
    status: 'paid',
    lineItems: [
      createLineItem('Demo complete', 1, 'ea', 3500, 1),
      createLineItem('Rough-in electrical', 1, 'ea', 4200, 2),
      createLineItem('Rough-in plumbing', 1, 'ea', 3800, 3),
      createLineItem('Cabinet installation', 1, 'ea', 8500, 4),
    ],
    createdAt: daysAgo(255),
    dueDate: daysAgo(225),
    paidAt: daysAgo(250),
  }));

  invoices.push(createInvoice({
    projectId: 'demo-proj-smith-kitchen',
    projectName: 'Smith Kitchen Remodel',
    projectAddress: proj1Address,
    clientId: DEMO_CLIENTS.smith.id,
    clientName: `${DEMO_CLIENTS.smith.firstName} ${DEMO_CLIENTS.smith.lastName}`,
    clientEmail: DEMO_CLIENTS.smith.email,
    type: 'final',
    status: 'paid',
    lineItems: [
      createLineItem('Countertop installation - quartz', 1, 'ea', 6500, 1),
      createLineItem('Tile backsplash', 1, 'ea', 2800, 2),
      createLineItem('LVP flooring installation', 1, 'ea', 3200, 3),
      createLineItem('Final paint and trim', 1, 'ea', 1500, 4),
    ],
    createdAt: daysAgo(240),
    dueDate: daysAgo(210),
    paidAt: daysAgo(235),
    notes: 'Final invoice. Thank you for choosing Horizon Construction!',
  }));

  // -------------------------------------------------------------------------
  // Project 2: Wilson Fence Installation - $8,500 (COMPLETED 6 months ago)
  // 2 invoices, all paid
  // -------------------------------------------------------------------------
  const proj2Address = '234 Birch Lane, Centennial, CO 80112';

  invoices.push(createInvoice({
    projectId: 'demo-proj-wilson-fence',
    projectName: 'Wilson Fence Installation',
    projectAddress: proj2Address,
    clientId: DEMO_CLIENTS.wilson.id,
    clientName: `${DEMO_CLIENTS.wilson.firstName} ${DEMO_CLIENTS.wilson.lastName}`,
    clientEmail: DEMO_CLIENTS.wilson.email,
    type: 'deposit',
    status: 'paid',
    lineItems: [
      createLineItem('Deposit - Fence materials', 1, 'ea', 4250, 1),
    ],
    createdAt: daysAgo(185),
    dueDate: daysAgo(155),
    paidAt: daysAgo(183),
  }));

  invoices.push(createInvoice({
    projectId: 'demo-proj-wilson-fence',
    projectName: 'Wilson Fence Installation',
    projectAddress: proj2Address,
    clientId: DEMO_CLIENTS.wilson.id,
    clientName: `${DEMO_CLIENTS.wilson.firstName} ${DEMO_CLIENTS.wilson.lastName}`,
    clientEmail: DEMO_CLIENTS.wilson.email,
    type: 'final',
    status: 'paid',
    lineItems: [
      createLineItem('Cedar fence installation - 140 LF', 140, 'lf', 25, 1),
      createLineItem('Gate installation - 4ft', 1, 'ea', 450, 2),
      createLineItem('Stain/seal application', 1, 'ea', 550, 3),
    ],
    createdAt: daysAgo(175),
    dueDate: daysAgo(145),
    paidAt: daysAgo(170),
    notes: 'Completed one day ahead of schedule.',
  }));

  // -------------------------------------------------------------------------
  // Project 3: Main St. Retail Storefront - $125,000 (COMPLETED 4 months ago)
  // 4 invoices, all paid
  // -------------------------------------------------------------------------
  const proj3Address = '250 Main Street, Denver, CO 80202';
  const proj3Total = 125000;

  invoices.push(createInvoice({
    projectId: 'demo-proj-mainst-retail',
    projectName: 'Main St. Retail Storefront',
    projectAddress: proj3Address,
    clientId: DEMO_CLIENTS.mainStRetail.id,
    clientName: DEMO_CLIENTS.mainStRetail.companyName!,
    clientEmail: DEMO_CLIENTS.mainStRetail.email,
    type: 'deposit',
    status: 'paid',
    lineItems: [
      createLineItem('Project deposit - Retail buildout', 1, 'ea', proj3Total * 0.30, 1),
    ],
    createdAt: daysAgo(210),
    dueDate: daysAgo(180),
    paidAt: daysAgo(205),
  }));

  invoices.push(createInvoice({
    projectId: 'demo-proj-mainst-retail',
    projectName: 'Main St. Retail Storefront',
    projectAddress: proj3Address,
    clientId: DEMO_CLIENTS.mainStRetail.id,
    clientName: DEMO_CLIENTS.mainStRetail.companyName!,
    clientEmail: DEMO_CLIENTS.mainStRetail.email,
    type: 'progress',
    status: 'paid',
    lineItems: [
      createLineItem('Demo and site prep', 1, 'ea', 8500, 1),
      createLineItem('Storefront system installation', 1, 'ea', 22000, 2),
    ],
    createdAt: daysAgo(185),
    dueDate: daysAgo(155),
    paidAt: daysAgo(180),
  }));

  invoices.push(createInvoice({
    projectId: 'demo-proj-mainst-retail',
    projectName: 'Main St. Retail Storefront',
    projectAddress: proj3Address,
    clientId: DEMO_CLIENTS.mainStRetail.id,
    clientName: DEMO_CLIENTS.mainStRetail.companyName!,
    clientEmail: DEMO_CLIENTS.mainStRetail.email,
    type: 'progress',
    status: 'paid',
    lineItems: [
      createLineItem('MEP rough-in', 1, 'ea', 18000, 1),
      createLineItem('Drywall and paint', 1, 'ea', 12500, 2),
      createLineItem('Polished concrete flooring', 1, 'ea', 9600, 3),
    ],
    createdAt: daysAgo(155),
    dueDate: daysAgo(125),
    paidAt: daysAgo(148),
  }));

  invoices.push(createInvoice({
    projectId: 'demo-proj-mainst-retail',
    projectName: 'Main St. Retail Storefront',
    projectAddress: proj3Address,
    clientId: DEMO_CLIENTS.mainStRetail.id,
    clientName: DEMO_CLIENTS.mainStRetail.companyName!,
    clientEmail: DEMO_CLIENTS.mainStRetail.email,
    type: 'final',
    status: 'paid',
    lineItems: [
      createLineItem('Custom millwork installation', 1, 'ea', 12000, 1),
      createLineItem('Track lighting system', 1, 'ea', 4500, 2),
      createLineItem('Final punch list items', 1, 'ea', 1650, 3),
      createLineItem('Change order - upgraded lighting', 1, 'ea', 3750, 4),
    ],
    createdAt: daysAgo(125),
    dueDate: daysAgo(95),
    paidAt: daysAgo(118),
    notes: 'Change order for upgraded lighting added per client request.',
  }));

  // -------------------------------------------------------------------------
  // Project 4: Garcia Master Bath - $32,000 (COMPLETED 2 months ago)
  // 3 invoices, all paid
  // -------------------------------------------------------------------------
  const proj4Address = '567 Oak Avenue, Lakewood, CO 80226';

  invoices.push(createInvoice({
    projectId: 'demo-proj-garcia-bath',
    projectName: 'Garcia Master Bath',
    projectAddress: proj4Address,
    clientId: DEMO_CLIENTS.garcia.id,
    clientName: `${DEMO_CLIENTS.garcia.firstName} ${DEMO_CLIENTS.garcia.lastName}`,
    clientEmail: DEMO_CLIENTS.garcia.email,
    type: 'deposit',
    status: 'paid',
    lineItems: [
      createLineItem('Project deposit - Master bathroom', 1, 'ea', 9600, 1),
    ],
    createdAt: daysAgo(95),
    dueDate: daysAgo(65),
    paidAt: daysAgo(92),
  }));

  invoices.push(createInvoice({
    projectId: 'demo-proj-garcia-bath',
    projectName: 'Garcia Master Bath',
    projectAddress: proj4Address,
    clientId: DEMO_CLIENTS.garcia.id,
    clientName: `${DEMO_CLIENTS.garcia.firstName} ${DEMO_CLIENTS.garcia.lastName}`,
    clientEmail: DEMO_CLIENTS.garcia.email,
    type: 'progress',
    status: 'paid',
    lineItems: [
      createLineItem('Demo and prep', 1, 'ea', 2800, 1),
      createLineItem('Plumbing rough-in', 1, 'ea', 3500, 2),
      createLineItem('Electrical rough-in', 1, 'ea', 2200, 3),
      createLineItem('Tile work - shower and floor', 1, 'ea', 6800, 4),
    ],
    createdAt: daysAgo(75),
    dueDate: daysAgo(45),
    paidAt: daysAgo(70),
  }));

  invoices.push(createInvoice({
    projectId: 'demo-proj-garcia-bath',
    projectName: 'Garcia Master Bath',
    projectAddress: proj4Address,
    clientId: DEMO_CLIENTS.garcia.id,
    clientName: `${DEMO_CLIENTS.garcia.firstName} ${DEMO_CLIENTS.garcia.lastName}`,
    clientEmail: DEMO_CLIENTS.garcia.email,
    type: 'final',
    status: 'paid',
    lineItems: [
      createLineItem('Double vanity installation', 1, 'ea', 3200, 1),
      createLineItem('Fixtures and hardware', 1, 'ea', 2400, 2),
      createLineItem('Heated floor system', 1, 'ea', 1850, 3),
      createLineItem('Final details and cleanup', 1, 'ea', 650, 4),
    ],
    createdAt: daysAgo(60),
    dueDate: daysAgo(30),
    paidAt: daysAgo(55),
    notes: 'Client referred us to their neighbor for basement project.',
  }));

  // -------------------------------------------------------------------------
  // Project 5: Downtown Cafe TI - $78,000 (COMPLETED 1 month ago)
  // 3 invoices, all paid
  // -------------------------------------------------------------------------
  const proj5Address = '100 Main Street, Denver, CO 80202';

  invoices.push(createInvoice({
    projectId: 'demo-proj-cafe-ti',
    projectName: 'Downtown Cafe TI',
    projectAddress: proj5Address,
    clientId: DEMO_CLIENTS.downtownCafe.id,
    clientName: DEMO_CLIENTS.downtownCafe.companyName!,
    clientEmail: DEMO_CLIENTS.downtownCafe.email,
    type: 'deposit',
    status: 'paid',
    lineItems: [
      createLineItem('Project deposit - Cafe TI', 1, 'ea', 23400, 1),
    ],
    createdAt: daysAgo(78),
    dueDate: daysAgo(48),
    paidAt: daysAgo(75),
  }));

  invoices.push(createInvoice({
    projectId: 'demo-proj-cafe-ti',
    projectName: 'Downtown Cafe TI',
    projectAddress: proj5Address,
    clientId: DEMO_CLIENTS.downtownCafe.id,
    clientName: DEMO_CLIENTS.downtownCafe.companyName!,
    clientEmail: DEMO_CLIENTS.downtownCafe.email,
    type: 'progress',
    status: 'paid',
    lineItems: [
      createLineItem('Demo and site prep', 1, 'ea', 6500, 1),
      createLineItem('Framing and MEP rough-in', 1, 'ea', 18000, 2),
      createLineItem('Drywall and ceiling grid', 1, 'ea', 9500, 3),
    ],
    createdAt: daysAgo(55),
    dueDate: daysAgo(25),
    paidAt: daysAgo(50),
  }));

  invoices.push(createInvoice({
    projectId: 'demo-proj-cafe-ti',
    projectName: 'Downtown Cafe TI',
    projectAddress: proj5Address,
    clientId: DEMO_CLIENTS.downtownCafe.id,
    clientName: DEMO_CLIENTS.downtownCafe.companyName!,
    clientEmail: DEMO_CLIENTS.downtownCafe.email,
    type: 'final',
    status: 'paid',
    lineItems: [
      createLineItem('Flooring installation', 1, 'ea', 7200, 1),
      createLineItem('Paint and finish', 1, 'ea', 4800, 2),
      createLineItem('ADA compliance upgrades', 1, 'ea', 5500, 3),
      createLineItem('Final inspection and punch', 1, 'ea', 2100, 4),
    ],
    createdAt: daysAgo(32),
    dueDate: daysAgo(2),
    paidAt: daysAgo(28),
    notes: 'Owner plans to open next month. Great working relationship.',
  }));

  // -------------------------------------------------------------------------
  // Project 6: Thompson Deck Build - $18,000 (ACTIVE - 40% complete)
  // 2 invoices, 1 paid, 1 current
  // -------------------------------------------------------------------------
  const proj6Address = '890 Pine Road, Aurora, CO 80012';

  invoices.push(createInvoice({
    projectId: 'demo-proj-thompson-deck',
    projectName: 'Thompson Deck Build',
    projectAddress: proj6Address,
    clientId: DEMO_CLIENTS.thompson.id,
    clientName: `${DEMO_CLIENTS.thompson.firstName} ${DEMO_CLIENTS.thompson.lastName}`,
    clientEmail: DEMO_CLIENTS.thompson.email,
    type: 'deposit',
    status: 'paid',
    lineItems: [
      createLineItem('Project deposit - Deck build', 1, 'ea', 5400, 1),
    ],
    createdAt: daysAgo(16),
    dueDate: daysFromNow(14),
    paidAt: daysAgo(14),
  }));

  invoices.push(createInvoice({
    projectId: 'demo-proj-thompson-deck',
    projectName: 'Thompson Deck Build',
    projectAddress: proj6Address,
    clientId: DEMO_CLIENTS.thompson.id,
    clientName: `${DEMO_CLIENTS.thompson.firstName} ${DEMO_CLIENTS.thompson.lastName}`,
    clientEmail: DEMO_CLIENTS.thompson.email,
    type: 'progress',
    status: 'sent',
    lineItems: [
      createLineItem('Footings and concrete', 1, 'ea', 2800, 1),
      createLineItem('Framing - posts and beams', 1, 'ea', 3200, 2),
    ],
    createdAt: daysAgo(3),
    dueDate: daysFromNow(27),
    notes: 'Progress billing for completed framing phase.',
  }));

  // -------------------------------------------------------------------------
  // Project 7: Office Park Suite 200 - $95,000 (ACTIVE - 25% complete)
  // 2 invoices, 1 paid, 1 overdue
  // -------------------------------------------------------------------------
  const proj7Address = '500 Business Parkway, Englewood, CO 80111';

  invoices.push(createInvoice({
    projectId: 'demo-proj-office-park',
    projectName: 'Office Park Suite 200',
    projectAddress: proj7Address,
    clientId: DEMO_CLIENTS.officePark.id,
    clientName: DEMO_CLIENTS.officePark.companyName!,
    clientEmail: DEMO_CLIENTS.officePark.email,
    type: 'deposit',
    status: 'paid',
    lineItems: [
      createLineItem('Project deposit - Office TI', 1, 'ea', 28500, 1),
    ],
    createdAt: daysAgo(35),
    dueDate: daysAgo(5),
    paidAt: daysAgo(32),
  }));

  invoices.push(createInvoice({
    projectId: 'demo-proj-office-park',
    projectName: 'Office Park Suite 200',
    projectAddress: proj7Address,
    clientId: DEMO_CLIENTS.officePark.id,
    clientName: DEMO_CLIENTS.officePark.companyName!,
    clientEmail: DEMO_CLIENTS.officePark.email,
    type: 'progress',
    status: 'overdue',
    lineItems: [
      createLineItem('Demo complete', 1, 'ea', 8500, 1),
      createLineItem('Framing - 60% complete', 1, 'ea', 12000, 2),
    ],
    createdAt: daysAgo(45),
    dueDate: daysAgo(15),
    notes: 'OVERDUE - Payment needed to continue work on MEP rough-in.',
  }));

  // -------------------------------------------------------------------------
  // Project 8: Garcia Basement Finish - $55,000 (ACTIVE - 35% complete)
  // 2 invoices, 1 paid, 1 current
  // -------------------------------------------------------------------------
  const proj8Address = '567 Oak Avenue, Lakewood, CO 80226';

  invoices.push(createInvoice({
    projectId: 'demo-proj-garcia-basement',
    projectName: 'Garcia Basement Finish',
    projectAddress: proj8Address,
    clientId: DEMO_CLIENTS.garcia.id,
    clientName: `${DEMO_CLIENTS.garcia.firstName} ${DEMO_CLIENTS.garcia.lastName}`,
    clientEmail: DEMO_CLIENTS.garcia.email,
    type: 'deposit',
    status: 'paid',
    lineItems: [
      createLineItem('Project deposit - Basement finish', 1, 'ea', 16500, 1),
    ],
    createdAt: daysAgo(25),
    dueDate: daysFromNow(5),
    paidAt: daysAgo(22),
    notes: 'Referral discount applied - same client as master bath.',
  }));

  invoices.push(createInvoice({
    projectId: 'demo-proj-garcia-basement',
    projectName: 'Garcia Basement Finish',
    projectAddress: proj8Address,
    clientId: DEMO_CLIENTS.garcia.id,
    clientName: `${DEMO_CLIENTS.garcia.firstName} ${DEMO_CLIENTS.garcia.lastName}`,
    clientEmail: DEMO_CLIENTS.garcia.email,
    type: 'progress',
    status: 'sent',
    lineItems: [
      createLineItem('Framing and egress window', 1, 'ea', 8500, 1),
      createLineItem('Rough MEP - 70% complete', 1, 'ea', 6200, 2),
    ],
    createdAt: daysAgo(5),
    dueDate: daysFromNow(25),
    notes: 'Progress billing for framing and partial MEP.',
  }));

  // -------------------------------------------------------------------------
  // Project 9: Brown Kitchen Update - $28,000 (ACTIVE - 15% complete)
  // 2 invoices, 1 paid, 1 overdue
  // -------------------------------------------------------------------------
  const proj9Address = '678 Cedar Court, Littleton, CO 80120';

  invoices.push(createInvoice({
    projectId: 'demo-proj-brown-kitchen',
    projectName: 'Brown Kitchen Update',
    projectAddress: proj9Address,
    clientId: DEMO_CLIENTS.brown.id,
    clientName: `${DEMO_CLIENTS.brown.firstName} ${DEMO_CLIENTS.brown.lastName}`,
    clientEmail: DEMO_CLIENTS.brown.email,
    type: 'deposit',
    status: 'paid',
    lineItems: [
      createLineItem('Project deposit - Kitchen update', 1, 'ea', 8400, 1),
    ],
    createdAt: daysAgo(10),
    dueDate: daysFromNow(20),
    paidAt: daysAgo(8),
  }));

  invoices.push(createInvoice({
    projectId: 'demo-proj-brown-kitchen',
    projectName: 'Brown Kitchen Update',
    projectAddress: proj9Address,
    clientId: DEMO_CLIENTS.brown.id,
    clientName: `${DEMO_CLIENTS.brown.firstName} ${DEMO_CLIENTS.brown.lastName}`,
    clientEmail: DEMO_CLIENTS.brown.email,
    type: 'progress',
    status: 'overdue',
    lineItems: [
      createLineItem('Prep and demo - 60% complete', 1, 'ea', 3200, 1),
    ],
    createdAt: daysAgo(40),
    dueDate: daysAgo(10),
    notes: 'OVERDUE - Invoice from estimate phase, payment needed to proceed.',
  }));

  // -------------------------------------------------------------------------
  // Historical invoices - Small jobs from past year (to reach 45 total)
  // All paid
  // -------------------------------------------------------------------------

  // Small job 1: Deck repair
  invoices.push(createInvoice({
    projectId: 'demo-proj-hist-1',
    projectName: 'Wilson Deck Repair',
    projectAddress: '234 Birch Lane, Centennial, CO 80112',
    clientId: DEMO_CLIENTS.wilson.id,
    clientName: `${DEMO_CLIENTS.wilson.firstName} ${DEMO_CLIENTS.wilson.lastName}`,
    clientEmail: DEMO_CLIENTS.wilson.email,
    type: 'standard',
    status: 'paid',
    lineItems: [
      createLineItem('Deck board replacement - 12 boards', 12, 'ea', 85, 1),
      createLineItem('Railing repair', 1, 'ea', 450, 2),
      createLineItem('Stain application', 1, 'ea', 380, 3),
    ],
    createdAt: daysAgo(320),
    dueDate: daysAgo(290),
    paidAt: daysAgo(315),
  }));

  // Small job 2: Bathroom vanity
  invoices.push(createInvoice({
    projectId: 'demo-proj-hist-2',
    projectName: 'Thompson Vanity Install',
    projectAddress: '890 Pine Road, Aurora, CO 80012',
    clientId: DEMO_CLIENTS.thompson.id,
    clientName: `${DEMO_CLIENTS.thompson.firstName} ${DEMO_CLIENTS.thompson.lastName}`,
    clientEmail: DEMO_CLIENTS.thompson.email,
    type: 'standard',
    status: 'paid',
    lineItems: [
      createLineItem('Vanity removal and disposal', 1, 'ea', 250, 1),
      createLineItem('New vanity installation', 1, 'ea', 1200, 2),
      createLineItem('Faucet and drain hookup', 1, 'ea', 350, 3),
    ],
    createdAt: daysAgo(290),
    dueDate: daysAgo(260),
    paidAt: daysAgo(285),
  }));

  // Small job 3: Exterior painting
  invoices.push(createInvoice({
    projectId: 'demo-proj-hist-3',
    projectName: 'Brown Exterior Painting',
    projectAddress: '678 Cedar Court, Littleton, CO 80120',
    clientId: DEMO_CLIENTS.brown.id,
    clientName: `${DEMO_CLIENTS.brown.firstName} ${DEMO_CLIENTS.brown.lastName}`,
    clientEmail: DEMO_CLIENTS.brown.email,
    type: 'standard',
    status: 'paid',
    lineItems: [
      createLineItem('Pressure washing', 1, 'ea', 350, 1),
      createLineItem('Exterior paint - 2 coats', 1, 'ea', 4200, 2),
      createLineItem('Trim and detail work', 1, 'ea', 950, 3),
    ],
    createdAt: daysAgo(260),
    dueDate: daysAgo(230),
    paidAt: daysAgo(252),
  }));

  // Small job 4: Window replacement
  invoices.push(createInvoice({
    projectId: 'demo-proj-hist-4',
    projectName: 'Smith Window Replacement',
    projectAddress: '1234 Maple Street, Denver, CO 80202',
    clientId: DEMO_CLIENTS.smith.id,
    clientName: `${DEMO_CLIENTS.smith.firstName} ${DEMO_CLIENTS.smith.lastName}`,
    clientEmail: DEMO_CLIENTS.smith.email,
    type: 'deposit',
    status: 'paid',
    lineItems: [
      createLineItem('Deposit - Window materials', 1, 'ea', 2400, 1),
    ],
    createdAt: daysAgo(340),
    dueDate: daysAgo(310),
    paidAt: daysAgo(338),
  }));

  invoices.push(createInvoice({
    projectId: 'demo-proj-hist-4',
    projectName: 'Smith Window Replacement',
    projectAddress: '1234 Maple Street, Denver, CO 80202',
    clientId: DEMO_CLIENTS.smith.id,
    clientName: `${DEMO_CLIENTS.smith.firstName} ${DEMO_CLIENTS.smith.lastName}`,
    clientEmail: DEMO_CLIENTS.smith.email,
    type: 'final',
    status: 'paid',
    lineItems: [
      createLineItem('Energy-efficient windows - 4 units', 4, 'ea', 650, 1),
      createLineItem('Installation labor', 4, 'ea', 175, 2),
      createLineItem('Trim and finishing', 1, 'ea', 380, 3),
    ],
    createdAt: daysAgo(325),
    dueDate: daysAgo(295),
    paidAt: daysAgo(320),
  }));

  // Small job 5: Garage door
  invoices.push(createInvoice({
    projectId: 'demo-proj-hist-5',
    projectName: 'Garcia Garage Door',
    projectAddress: '567 Oak Avenue, Lakewood, CO 80226',
    clientId: DEMO_CLIENTS.garcia.id,
    clientName: `${DEMO_CLIENTS.garcia.firstName} ${DEMO_CLIENTS.garcia.lastName}`,
    clientEmail: DEMO_CLIENTS.garcia.email,
    type: 'standard',
    status: 'paid',
    lineItems: [
      createLineItem('Insulated garage door - 16x7', 1, 'ea', 1650, 1),
      createLineItem('Opener with smart features', 1, 'ea', 420, 2),
      createLineItem('Installation and disposal', 1, 'ea', 580, 3),
    ],
    createdAt: daysAgo(220),
    dueDate: daysAgo(190),
    paidAt: daysAgo(215),
  }));

  // Small job 6: Flooring repair
  invoices.push(createInvoice({
    projectId: 'demo-proj-hist-6',
    projectName: 'Wilson Flooring Repair',
    projectAddress: '234 Birch Lane, Centennial, CO 80112',
    clientId: DEMO_CLIENTS.wilson.id,
    clientName: `${DEMO_CLIENTS.wilson.firstName} ${DEMO_CLIENTS.wilson.lastName}`,
    clientEmail: DEMO_CLIENTS.wilson.email,
    type: 'standard',
    status: 'paid',
    lineItems: [
      createLineItem('Hardwood floor repair - 80 SF', 80, 'sf', 8.50, 1),
      createLineItem('Sanding and refinishing', 1, 'ea', 650, 2),
    ],
    createdAt: daysAgo(145),
    dueDate: daysAgo(115),
    paidAt: daysAgo(140),
  }));

  // Small job 7: Commercial HVAC
  invoices.push(createInvoice({
    projectId: 'demo-proj-hist-7',
    projectName: 'Office Park HVAC Repair',
    projectAddress: '500 Business Parkway, Englewood, CO 80111',
    clientId: DEMO_CLIENTS.officePark.id,
    clientName: DEMO_CLIENTS.officePark.companyName!,
    clientEmail: DEMO_CLIENTS.officePark.email,
    type: 'standard',
    status: 'paid',
    lineItems: [
      createLineItem('HVAC diagnostic', 1, 'ea', 185, 1),
      createLineItem('Compressor replacement', 1, 'ea', 2800, 2),
      createLineItem('Refrigerant recharge', 1, 'ea', 450, 3),
    ],
    createdAt: daysAgo(200),
    dueDate: daysAgo(170),
    paidAt: daysAgo(195),
  }));

  // Small job 8: Drywall repair
  invoices.push(createInvoice({
    projectId: 'demo-proj-hist-8',
    projectName: 'Thompson Drywall Repair',
    projectAddress: '890 Pine Road, Aurora, CO 80012',
    clientId: DEMO_CLIENTS.thompson.id,
    clientName: `${DEMO_CLIENTS.thompson.firstName} ${DEMO_CLIENTS.thompson.lastName}`,
    clientEmail: DEMO_CLIENTS.thompson.email,
    type: 'standard',
    status: 'paid',
    lineItems: [
      createLineItem('Water damage drywall removal', 1, 'ea', 450, 1),
      createLineItem('New drywall installation', 1, 'ea', 680, 2),
      createLineItem('Tape, mud, and texture', 1, 'ea', 520, 3),
      createLineItem('Paint to match', 1, 'ea', 350, 4),
    ],
    createdAt: daysAgo(165),
    dueDate: daysAgo(135),
    paidAt: daysAgo(160),
  }));

  // Small job 9: Commercial maintenance
  invoices.push(createInvoice({
    projectId: 'demo-proj-hist-9',
    projectName: 'Downtown Cafe Quarterly Maintenance',
    projectAddress: '100 Main Street, Denver, CO 80202',
    clientId: DEMO_CLIENTS.downtownCafe.id,
    clientName: DEMO_CLIENTS.downtownCafe.companyName!,
    clientEmail: DEMO_CLIENTS.downtownCafe.email,
    type: 'standard',
    status: 'paid',
    lineItems: [
      createLineItem('Quarterly building inspection', 1, 'ea', 350, 1),
      createLineItem('Minor repairs and touch-ups', 1, 'ea', 480, 2),
    ],
    createdAt: daysAgo(105),
    dueDate: daysAgo(75),
    paidAt: daysAgo(100),
  }));

  // Small job 10: Electrical upgrade
  invoices.push(createInvoice({
    projectId: 'demo-proj-hist-10',
    projectName: 'Brown Panel Upgrade',
    projectAddress: '678 Cedar Court, Littleton, CO 80120',
    clientId: DEMO_CLIENTS.brown.id,
    clientName: `${DEMO_CLIENTS.brown.firstName} ${DEMO_CLIENTS.brown.lastName}`,
    clientEmail: DEMO_CLIENTS.brown.email,
    type: 'standard',
    status: 'paid',
    lineItems: [
      createLineItem('200A panel upgrade', 1, 'ea', 2850, 1),
      createLineItem('Permit and inspection', 1, 'ea', 350, 2),
    ],
    createdAt: daysAgo(350),
    dueDate: daysAgo(320),
    paidAt: daysAgo(345),
  }));

  // Small job 11: Retail signage
  invoices.push(createInvoice({
    projectId: 'demo-proj-hist-11',
    projectName: 'Main St. Retail Signage',
    projectAddress: '250 Main Street, Denver, CO 80202',
    clientId: DEMO_CLIENTS.mainStRetail.id,
    clientName: DEMO_CLIENTS.mainStRetail.companyName!,
    clientEmail: DEMO_CLIENTS.mainStRetail.email,
    type: 'standard',
    status: 'paid',
    lineItems: [
      createLineItem('Signage installation prep', 1, 'ea', 650, 1),
      createLineItem('Electrical for illuminated sign', 1, 'ea', 1200, 2),
    ],
    createdAt: daysAgo(115),
    dueDate: daysAgo(85),
    paidAt: daysAgo(110),
  }));

  // Small job 12: Emergency repair
  invoices.push(createInvoice({
    projectId: 'demo-proj-hist-12',
    projectName: 'Smith Emergency Roof Repair',
    projectAddress: '1234 Maple Street, Denver, CO 80202',
    clientId: DEMO_CLIENTS.smith.id,
    clientName: `${DEMO_CLIENTS.smith.firstName} ${DEMO_CLIENTS.smith.lastName}`,
    clientEmail: DEMO_CLIENTS.smith.email,
    type: 'standard',
    status: 'paid',
    lineItems: [
      createLineItem('Emergency tarp installation', 1, 'ea', 380, 1),
      createLineItem('Shingle replacement - 25 SF', 25, 'sf', 12, 2),
      createLineItem('Flashing repair', 1, 'ea', 280, 3),
    ],
    createdAt: daysAgo(130),
    dueDate: daysAgo(100),
    paidAt: daysAgo(125),
  }));

  return invoices;
};

// Export for use in seeding scripts
export const DEMO_INVOICES = generateDemoInvoices();

// Summary for verification
export const getInvoiceSummary = () => {
  const invoices = DEMO_INVOICES;
  const paid = invoices.filter(i => i.status === 'paid').length;
  const current = invoices.filter(i => i.status === 'sent' || i.status === 'viewed').length;
  const overdue = invoices.filter(i => i.status === 'overdue').length;
  const total = invoices.reduce((sum, i) => sum + i.total, 0);
  const collected = invoices.reduce((sum, i) => sum + i.amountPaid, 0);

  return {
    total: invoices.length,
    paid,
    current,
    overdue,
    totalValue: total,
    totalCollected: collected,
    totalOutstanding: total - collected,
  };
};

// Helper to remove undefined values (Firestore doesn't accept undefined)
const removeUndefined = <T extends Record<string, unknown>>(obj: T): T => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined)
  ) as T;
};

// Firestore seeding function
export async function seedInvoices(
  db: FirebaseFirestore.Firestore,
  orgId: string
): Promise<{ count: number }> {
  logSection('Seeding Invoices');

  const invoices = generateDemoInvoices();

  await executeBatchWrites(
    db,
    invoices,
    (batch, invoice) => {
      const docRef = db
        .collection('organizations')
        .doc(orgId)
        .collection('invoices')
        .doc(invoice.id);

      batch.set(docRef, removeUndefined({
        ...invoice,
        orgId,
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

  logSuccess(`Seeded ${invoices.length} invoices`);
  return { count: invoices.length };
}
