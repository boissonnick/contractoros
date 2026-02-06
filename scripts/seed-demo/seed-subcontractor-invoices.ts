/**
 * Seed Subcontractor Invoices and Lien Waivers
 * Sprint 69 - AP Automation Demo Data
 *
 * Creates:
 * - 12 Subcontractor invoices across various statuses
 * - 6 Lien waivers linked to invoices
 *
 * Run: cd scripts/seed-demo && npx ts-node seed-subcontractor-invoices.ts
 */

import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import {
  DEMO_ORG_ID,
  DEMO_USERS,
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
// Demo Subcontractor Vendors
// ============================================

const VENDORS = [
  { id: 'sub-peak-plumbing', name: 'Peak Plumbing Solutions' },
  { id: 'sub-mountain-electric', name: 'Mountain Electric Inc' },
  { id: 'sub-alpine-hvac', name: 'Alpine HVAC Services' },
  { id: 'sub-rocky-drywall', name: 'Rocky Mountain Drywall' },
  { id: 'sub-denver-tile', name: 'Denver Tile & Stone' },
  { id: 'sub-front-range-paint', name: 'Front Range Painting' },
  { id: 'sub-summit-concrete', name: 'Summit Concrete Works' },
  { id: 'sub-colorado-cabinets', name: 'Colorado Custom Cabinets' },
  { id: 'sub-centennial-flooring', name: 'Centennial Flooring' },
  { id: 'sub-mile-high-roofing', name: 'Mile High Roofing' },
] as const;

// ============================================
// Demo Projects (matching seed-activities.ts)
// ============================================

const PROJECTS = [
  { id: 'demo-proj-smith-kitchen', name: 'Smith Kitchen Remodel' },
  { id: 'demo-proj-garcia-bath', name: 'Garcia Master Bath' },
  { id: 'demo-proj-cafe-ti', name: 'Downtown Cafe TI' },
  { id: 'demo-proj-thompson-deck', name: 'Thompson Deck Build' },
  { id: 'demo-proj-office-park', name: 'Office Park Suite 200' },
  { id: 'demo-proj-garcia-basement', name: 'Garcia Basement Finish' },
  { id: 'demo-proj-brown-kitchen', name: 'Brown Kitchen Update' },
  { id: 'demo-proj-mainst-retail', name: 'Main St. Retail Storefront' },
] as const;

// ============================================
// Invoice Line Item Templates by Trade
// ============================================

const LINE_ITEM_TEMPLATES: Record<string, Array<{ description: string; quantity: number; unitPrice: number }>> = {
  plumbing: [
    { description: 'Rough-in plumbing labor', quantity: 24, unitPrice: 95 },
    { description: 'PEX piping and fittings', quantity: 1, unitPrice: 680 },
    { description: 'Drain assembly and venting', quantity: 1, unitPrice: 450 },
    { description: 'Fixture installation (per fixture)', quantity: 3, unitPrice: 175 },
  ],
  electrical: [
    { description: 'Electrical rough-in labor', quantity: 32, unitPrice: 105 },
    { description: 'Panel upgrade materials', quantity: 1, unitPrice: 1200 },
    { description: 'Recessed lighting (per unit)', quantity: 12, unitPrice: 85 },
    { description: 'Switch/outlet installation', quantity: 18, unitPrice: 45 },
  ],
  hvac: [
    { description: 'Ductwork fabrication and install', quantity: 1, unitPrice: 3200 },
    { description: 'Mini-split unit supply and install', quantity: 2, unitPrice: 1850 },
    { description: 'Thermostat and controls', quantity: 1, unitPrice: 425 },
  ],
  drywall: [
    { description: 'Drywall hanging (per sheet)', quantity: 85, unitPrice: 28 },
    { description: 'Taping and finishing labor', quantity: 40, unitPrice: 65 },
    { description: 'Materials (mud, tape, corner bead)', quantity: 1, unitPrice: 380 },
  ],
  tile: [
    { description: 'Tile installation labor (per sq ft)', quantity: 180, unitPrice: 14 },
    { description: 'Tile material (porcelain large format)', quantity: 200, unitPrice: 8.50 },
    { description: 'Thinset, grout, and backer board', quantity: 1, unitPrice: 520 },
    { description: 'Waterproofing membrane', quantity: 1, unitPrice: 340 },
  ],
  painting: [
    { description: 'Interior painting labor (per room)', quantity: 8, unitPrice: 375 },
    { description: 'Paint and primer materials', quantity: 1, unitPrice: 640 },
    { description: 'Prep work (patching, sanding, caulking)', quantity: 16, unitPrice: 55 },
  ],
  concrete: [
    { description: 'Concrete pour and finish (per yard)', quantity: 12, unitPrice: 185 },
    { description: 'Rebar and formwork', quantity: 1, unitPrice: 1450 },
    { description: 'Excavation and grading', quantity: 8, unitPrice: 125 },
  ],
  cabinets: [
    { description: 'Custom cabinet fabrication', quantity: 1, unitPrice: 8500 },
    { description: 'Cabinet installation labor', quantity: 24, unitPrice: 85 },
    { description: 'Hardware and accessories', quantity: 1, unitPrice: 620 },
  ],
  flooring: [
    { description: 'LVP installation (per sq ft)', quantity: 650, unitPrice: 6.50 },
    { description: 'Flooring material (luxury vinyl plank)', quantity: 700, unitPrice: 4.25 },
    { description: 'Underlayment and transitions', quantity: 1, unitPrice: 480 },
  ],
  roofing: [
    { description: 'Roofing labor (per square)', quantity: 24, unitPrice: 275 },
    { description: 'Architectural shingles (per square)', quantity: 26, unitPrice: 195 },
    { description: 'Underlayment and flashing', quantity: 1, unitPrice: 1100 },
    { description: 'Ridge vent and ventilation', quantity: 1, unitPrice: 650 },
  ],
};

// Map vendors to their trade for line item templates
const VENDOR_TRADE_MAP: Record<string, string> = {
  'sub-peak-plumbing': 'plumbing',
  'sub-mountain-electric': 'electrical',
  'sub-alpine-hvac': 'hvac',
  'sub-rocky-drywall': 'drywall',
  'sub-denver-tile': 'tile',
  'sub-front-range-paint': 'painting',
  'sub-summit-concrete': 'concrete',
  'sub-colorado-cabinets': 'cabinets',
  'sub-centennial-flooring': 'flooring',
  'sub-mile-high-roofing': 'roofing',
};

// ============================================
// Invoice Definitions
// ============================================

type APInvoiceStatus = 'draft' | 'submitted' | 'approved' | 'paid' | 'disputed';
type LienWaiverLinkStatus = 'not_required' | 'pending' | 'received';

interface InvoiceSeed {
  id: string;
  invoiceNumber: string;
  vendor: typeof VENDORS[number];
  project: typeof PROJECTS[number];
  status: APInvoiceStatus;
  lienWaiverStatus: LienWaiverLinkStatus;
  createdDaysAgo: number;
  submittedDaysAgo?: number;
  approvedDaysAgo?: number;
  paidDaysAgo?: number;
  notes?: string;
  lineItemScale: number; // multiplier for quantities (0.5 = half, 1 = full, 1.5 = extra)
}

const INVOICES: InvoiceSeed[] = [
  // Paid invoices (completed work)
  {
    id: 'demo-ap-inv-001',
    invoiceNumber: 'PPS-2025-0042',
    vendor: VENDORS[0], // Peak Plumbing
    project: PROJECTS[0], // Smith Kitchen
    status: 'paid',
    lienWaiverStatus: 'received',
    createdDaysAgo: 90,
    submittedDaysAgo: 88,
    approvedDaysAgo: 82,
    paidDaysAgo: 75,
    notes: 'Final payment for kitchen rough-in and fixture installation.',
    lineItemScale: 1,
  },
  {
    id: 'demo-ap-inv-002',
    invoiceNumber: 'MEI-2025-0118',
    vendor: VENDORS[1], // Mountain Electric
    project: PROJECTS[0], // Smith Kitchen
    status: 'paid',
    lienWaiverStatus: 'received',
    createdDaysAgo: 85,
    submittedDaysAgo: 83,
    approvedDaysAgo: 78,
    paidDaysAgo: 70,
    notes: 'Electrical rough-in and panel upgrade for kitchen remodel.',
    lineItemScale: 0.8,
  },
  {
    id: 'demo-ap-inv-003',
    invoiceNumber: 'DTS-2025-0065',
    vendor: VENDORS[4], // Denver Tile
    project: PROJECTS[1], // Garcia Bath
    status: 'paid',
    lienWaiverStatus: 'received',
    createdDaysAgo: 60,
    submittedDaysAgo: 58,
    approvedDaysAgo: 53,
    paidDaysAgo: 45,
    notes: 'Master bath tile work including shower pan and floor.',
    lineItemScale: 0.7,
  },
  // Approved invoices (awaiting payment)
  {
    id: 'demo-ap-inv-004',
    invoiceNumber: 'FRP-2025-0231',
    vendor: VENDORS[5], // Front Range Painting
    project: PROJECTS[2], // Cafe TI
    status: 'approved',
    lienWaiverStatus: 'pending',
    createdDaysAgo: 35,
    submittedDaysAgo: 33,
    approvedDaysAgo: 28,
    notes: 'Interior painting for Downtown Cafe tenant improvement.',
    lineItemScale: 1.2,
  },
  {
    id: 'demo-ap-inv-005',
    invoiceNumber: 'RMD-2025-0089',
    vendor: VENDORS[3], // Rocky Mountain Drywall
    project: PROJECTS[4], // Office Park
    status: 'approved',
    lienWaiverStatus: 'pending',
    createdDaysAgo: 20,
    submittedDaysAgo: 18,
    approvedDaysAgo: 12,
    notes: 'Drywall for Suite 200 - Phase 1 complete.',
    lineItemScale: 1.5,
  },
  // Submitted invoices (pending review)
  {
    id: 'demo-ap-inv-006',
    invoiceNumber: 'SCW-2025-0177',
    vendor: VENDORS[6], // Summit Concrete
    project: PROJECTS[3], // Thompson Deck
    status: 'submitted',
    lienWaiverStatus: 'not_required',
    createdDaysAgo: 10,
    submittedDaysAgo: 8,
    notes: 'Footings and pier pads for deck build.',
    lineItemScale: 0.6,
  },
  {
    id: 'demo-ap-inv-007',
    invoiceNumber: 'AHS-2025-0054',
    vendor: VENDORS[2], // Alpine HVAC
    project: PROJECTS[5], // Garcia Basement
    status: 'submitted',
    lienWaiverStatus: 'not_required',
    createdDaysAgo: 7,
    submittedDaysAgo: 5,
    notes: 'HVAC ductwork extension for basement finish.',
    lineItemScale: 0.9,
  },
  {
    id: 'demo-ap-inv-008',
    invoiceNumber: 'CCC-2025-0033',
    vendor: VENDORS[7], // Colorado Cabinets
    project: PROJECTS[6], // Brown Kitchen
    status: 'submitted',
    lienWaiverStatus: 'not_required',
    createdDaysAgo: 5,
    submittedDaysAgo: 3,
    notes: 'Custom cabinet refacing and new uppers for kitchen update.',
    lineItemScale: 0.7,
  },
  // Draft invoices (not yet submitted)
  {
    id: 'demo-ap-inv-009',
    invoiceNumber: 'CF-2025-0412',
    vendor: VENDORS[8], // Centennial Flooring
    project: PROJECTS[4], // Office Park
    status: 'draft',
    lienWaiverStatus: 'not_required',
    createdDaysAgo: 3,
    notes: 'LVP flooring for Suite 200 common areas.',
    lineItemScale: 1.3,
  },
  {
    id: 'demo-ap-inv-010',
    invoiceNumber: 'PPS-2025-0051',
    vendor: VENDORS[0], // Peak Plumbing
    project: PROJECTS[5], // Garcia Basement
    status: 'draft',
    lienWaiverStatus: 'not_required',
    createdDaysAgo: 2,
    notes: 'Bathroom rough-in for basement finish.',
    lineItemScale: 0.5,
  },
  // Disputed invoice
  {
    id: 'demo-ap-inv-011',
    invoiceNumber: 'MHR-2025-0098',
    vendor: VENDORS[9], // Mile High Roofing
    project: PROJECTS[7], // Main St Retail
    status: 'disputed',
    lienWaiverStatus: 'not_required',
    createdDaysAgo: 45,
    submittedDaysAgo: 43,
    notes: 'Disputed - scope disagreement on flashing work. Awaiting resolution.',
    lineItemScale: 0.8,
  },
  // Another paid invoice for variety
  {
    id: 'demo-ap-inv-012',
    invoiceNumber: 'MEI-2025-0125',
    vendor: VENDORS[1], // Mountain Electric
    project: PROJECTS[2], // Cafe TI
    status: 'paid',
    lienWaiverStatus: 'received',
    createdDaysAgo: 40,
    submittedDaysAgo: 38,
    approvedDaysAgo: 33,
    paidDaysAgo: 25,
    notes: 'Electrical work for Downtown Cafe - lighting and panel.',
    lineItemScale: 1.1,
  },
];

// ============================================
// Lien Waiver Definitions
// ============================================

type LienWaiverType = 'conditional_progress' | 'unconditional_progress' | 'conditional_final' | 'unconditional_final';
type LienWaiverStatus = 'draft' | 'pending' | 'signed' | 'void';

interface LienWaiverSeed {
  id: string;
  invoiceId: string;
  vendor: typeof VENDORS[number];
  project: typeof PROJECTS[number];
  type: LienWaiverType;
  status: LienWaiverStatus;
  amount: number;
  requestedDaysAgo: number;
  receivedDaysAgo?: number;
  signedDaysAgo?: number;
  propertyAddress: string;
  ownerName: string;
}

const LIEN_WAIVERS: LienWaiverSeed[] = [
  // Signed waivers (for paid invoices)
  {
    id: 'demo-lw-001',
    invoiceId: 'demo-ap-inv-001',
    vendor: VENDORS[0], // Peak Plumbing
    project: PROJECTS[0], // Smith Kitchen
    type: 'unconditional_final',
    status: 'signed',
    amount: 0, // Will be calculated from invoice
    requestedDaysAgo: 80,
    receivedDaysAgo: 77,
    signedDaysAgo: 76,
    propertyAddress: '1234 Maple Street, Denver, CO 80202',
    ownerName: 'Robert Smith',
  },
  {
    id: 'demo-lw-002',
    invoiceId: 'demo-ap-inv-002',
    vendor: VENDORS[1], // Mountain Electric
    project: PROJECTS[0], // Smith Kitchen
    type: 'unconditional_final',
    status: 'signed',
    amount: 0,
    requestedDaysAgo: 75,
    receivedDaysAgo: 72,
    signedDaysAgo: 71,
    propertyAddress: '1234 Maple Street, Denver, CO 80202',
    ownerName: 'Robert Smith',
  },
  {
    id: 'demo-lw-003',
    invoiceId: 'demo-ap-inv-003',
    vendor: VENDORS[4], // Denver Tile
    project: PROJECTS[1], // Garcia Bath
    type: 'unconditional_final',
    status: 'signed',
    amount: 0,
    requestedDaysAgo: 50,
    receivedDaysAgo: 47,
    signedDaysAgo: 46,
    propertyAddress: '567 Oak Avenue, Lakewood, CO 80226',
    ownerName: 'Maria Garcia',
  },
  // Pending waivers (for approved invoices awaiting payment)
  {
    id: 'demo-lw-004',
    invoiceId: 'demo-ap-inv-004',
    vendor: VENDORS[5], // Front Range Painting
    project: PROJECTS[2], // Cafe TI
    type: 'conditional_progress',
    status: 'pending',
    amount: 0,
    requestedDaysAgo: 28,
    propertyAddress: '100 Main Street, Denver, CO 80202',
    ownerName: 'Tom Richards / Downtown Cafe LLC',
  },
  {
    id: 'demo-lw-005',
    invoiceId: 'demo-ap-inv-005',
    vendor: VENDORS[3], // Rocky Mountain Drywall
    project: PROJECTS[4], // Office Park
    type: 'conditional_progress',
    status: 'pending',
    amount: 0,
    requestedDaysAgo: 12,
    propertyAddress: '500 Business Parkway, Englewood, CO 80111',
    ownerName: 'David Anderson / Office Park LLC',
  },
  // Signed waiver for paid invoice 12
  {
    id: 'demo-lw-006',
    invoiceId: 'demo-ap-inv-012',
    vendor: VENDORS[1], // Mountain Electric
    project: PROJECTS[2], // Cafe TI
    type: 'unconditional_progress',
    status: 'signed',
    amount: 0,
    requestedDaysAgo: 30,
    receivedDaysAgo: 27,
    signedDaysAgo: 26,
    propertyAddress: '100 Main Street, Denver, CO 80202',
    ownerName: 'Tom Richards / Downtown Cafe LLC',
  },
];

// ============================================
// Helper: Build line items for an invoice
// ============================================

function buildLineItems(
  vendorId: string,
  scale: number
): Array<{ description: string; quantity: number; unitPrice: number; amount: number }> {
  const trade = VENDOR_TRADE_MAP[vendorId] || 'painting';
  const templates = LINE_ITEM_TEMPLATES[trade] || LINE_ITEM_TEMPLATES.painting;

  // Pick 2-4 line items from the trade templates
  const count = Math.min(templates.length, randomInt(2, 4));
  const selected = templates.slice(0, count);

  return selected.map((item) => {
    const quantity = Math.max(1, Math.round(item.quantity * scale));
    const unitPrice = Math.round(item.unitPrice * (0.9 + Math.random() * 0.2) * 100) / 100;
    const amount = Math.round(quantity * unitPrice * 100) / 100;
    return {
      description: item.description,
      quantity,
      unitPrice,
      amount,
    };
  });
}

// ============================================
// Seed Subcontractor Invoices
// ============================================

async function seedSubcontractorInvoices(): Promise<number> {
  logSection('Seeding Subcontractor Invoices');

  const invoicesRef = db
    .collection('organizations')
    .doc(DEMO_ORG_ID)
    .collection('subcontractorInvoices');

  const batch = db.batch();
  const invoiceTotals: Record<string, number> = {};

  for (const inv of INVOICES) {
    logProgress(`Creating invoice ${inv.invoiceNumber} — ${inv.vendor.name} [${inv.status}]`);

    const lineItems = buildLineItems(inv.vendor.id, inv.lineItemScale);
    const subtotal = lineItems.reduce((sum, li) => sum + li.amount, 0);
    const tax = Math.round(subtotal * 0.08 * 100) / 100; // 8% tax
    const total = Math.round((subtotal + tax) * 100) / 100;

    // Store total for lien waiver amounts
    invoiceTotals[inv.id] = total;

    const invoiceDate = daysAgo(inv.createdDaysAgo);
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + 30); // Net 30

    const docRef = invoicesRef.doc(inv.id);
    const data: Record<string, unknown> = {
      orgId: DEMO_ORG_ID,
      invoiceNumber: inv.invoiceNumber,
      vendorId: inv.vendor.id,
      vendorName: inv.vendor.name,
      projectId: inv.project.id,
      projectName: inv.project.name,
      lineItems,
      amount: total,
      description: inv.notes || `Invoice from ${inv.vendor.name}`,
      invoiceDate: invoiceDate.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      status: inv.status,
      lienWaiverStatus: inv.lienWaiverStatus,
      attachmentUrls: [],
      notes: inv.notes || '',
      createdBy: DEMO_USERS.pm.uid,
      createdAt: toTimestamp(daysAgo(inv.createdDaysAgo)),
      updatedAt: Timestamp.now(),
      isDemoData: true,
    };

    // Add status-specific timestamps
    if (inv.submittedDaysAgo !== undefined) {
      data.submittedAt = toTimestamp(daysAgo(inv.submittedDaysAgo));
    }
    if (inv.approvedDaysAgo !== undefined) {
      data.approvedAt = toTimestamp(daysAgo(inv.approvedDaysAgo));
      data.approvedBy = DEMO_USERS.owner.uid;
    }
    if (inv.paidDaysAgo !== undefined) {
      data.paidAt = toTimestamp(daysAgo(inv.paidDaysAgo));
      data.paymentMethod = randomItem(['check', 'ach', 'wire']);
      if (data.paymentMethod === 'check') {
        data.checkNumber = `${randomInt(5000, 9999)}`;
      }
    }

    batch.set(docRef, data);
  }

  await batch.commit();
  logSuccess(`Created ${INVOICES.length} subcontractor invoices`);
  return INVOICES.length;
}

// ============================================
// Seed Lien Waivers
// ============================================

async function seedLienWaivers(): Promise<number> {
  logSection('Seeding Lien Waivers');

  const waiversRef = db
    .collection('organizations')
    .doc(DEMO_ORG_ID)
    .collection('lienWaivers');

  const batch = db.batch();

  // We need invoice totals for waiver amounts. Since invoices were just seeded,
  // we calculate them inline using the same logic.
  const invoiceTotals: Record<string, number> = {};
  for (const inv of INVOICES) {
    const lineItems = buildLineItems(inv.vendor.id, inv.lineItemScale);
    const subtotal = lineItems.reduce((sum, li) => sum + li.amount, 0);
    const tax = Math.round(subtotal * 0.08 * 100) / 100;
    invoiceTotals[inv.id] = Math.round((subtotal + tax) * 100) / 100;
  }

  for (const lw of LIEN_WAIVERS) {
    const waiverAmount = lw.amount > 0 ? lw.amount : (invoiceTotals[lw.invoiceId] || randomAmount(2000, 15000));

    logProgress(`Creating lien waiver ${lw.id} — ${lw.vendor.name} [${lw.status}]`);

    const docRef = waiversRef.doc(lw.id);
    const data: Record<string, unknown> = {
      orgId: DEMO_ORG_ID,
      invoiceId: lw.invoiceId,
      projectId: lw.project.id,
      type: lw.type,
      status: lw.status,

      // Parties
      claimantName: lw.vendor.name,
      claimantAddress: `${randomInt(100, 999)} ${randomItem(['Industrial', 'Commerce', 'Trade', 'Workshop'])} Dr, ${randomItem(['Denver', 'Aurora', 'Lakewood'])} CO ${randomInt(80100, 80299)}`,
      ownerName: lw.ownerName,
      propertyAddress: lw.propertyAddress,

      // Amounts
      amount: waiverAmount,
      throughDate: toTimestamp(daysAgo(lw.requestedDaysAgo)),

      // Metadata
      createdBy: DEMO_USERS.pm.uid,
      createdAt: toTimestamp(daysAgo(lw.requestedDaysAgo)),
      updatedAt: Timestamp.now(),
      isDemoData: true,
    };

    if (lw.receivedDaysAgo !== undefined) {
      data.receivedAt = toTimestamp(daysAgo(lw.receivedDaysAgo));
    }

    if (lw.signedDaysAgo !== undefined) {
      data.signedAt = toTimestamp(daysAgo(lw.signedDaysAgo));
      data.signedBy = lw.vendor.name;
    }

    batch.set(docRef, data);

    // Also update the corresponding invoice's lienWaiverId
    const invoiceRef = db
      .collection('organizations')
      .doc(DEMO_ORG_ID)
      .collection('subcontractorInvoices')
      .doc(lw.invoiceId);
    batch.update(invoiceRef, { lienWaiverId: lw.id });
  }

  await batch.commit();
  logSuccess(`Created ${LIEN_WAIVERS.length} lien waivers`);
  return LIEN_WAIVERS.length;
}

// ============================================
// Main Export & Execution
// ============================================

export async function seedSubcontractorInvoiceData(): Promise<{
  invoices: number;
  lienWaivers: number;
}> {
  const invoices = await seedSubcontractorInvoices();
  const lienWaivers = await seedLienWaivers();

  return { invoices, lienWaivers };
}

// Run if executed directly
if (require.main === module) {
  seedSubcontractorInvoiceData()
    .then((result) => {
      console.log('\nSubcontractor invoice seeding complete!');
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error seeding subcontractor invoices:', error);
      process.exit(1);
    });
}
