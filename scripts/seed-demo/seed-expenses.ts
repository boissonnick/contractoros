/**
 * Demo Expense Seeder for ContractorOS
 *
 * Creates 80+ expenses across 12 months:
 * - Materials purchases (Home Depot, Lowe's, specialty suppliers)
 * - Subcontractor payments
 * - Equipment rentals
 * - Permit fees
 * - Fuel/mileage
 * - Link expenses to projects where applicable
 * - Include receipt references
 */

import { Timestamp } from 'firebase-admin/firestore';
import {
  DEMO_ORG_ID,
  DEMO_USERS,
  daysAgo,
  monthsAgo,
  generateId,
  randomAmount,
  randomItem,
  toTimestamp,
  logSection,
  logSuccess,
  executeBatchWrites,
} from './utils';
import { VENDORS, EXPENSE_DESCRIPTIONS, PAYMENT_METHODS } from './data/expense-vendors';

// Type definitions
type ExpenseCategory =
  | 'materials'
  | 'tools'
  | 'equipment_rental'
  | 'fuel'
  | 'vehicle'
  | 'subcontractor'
  | 'permits'
  | 'labor'
  | 'office'
  | 'travel'
  | 'meals'
  | 'insurance'
  | 'utilities'
  | 'marketing'
  | 'other';

type ExpenseStatus = 'pending' | 'approved' | 'rejected' | 'reimbursed';
type ExpensePaymentMethod = 'cash' | 'credit_card' | 'debit_card' | 'check' | 'company_card' | 'other';

interface ExpenseReceipt {
  id: string;
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
}

interface Expense {
  id: string;
  orgId: string;
  userId: string;
  userName: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  projectId?: string;
  projectName?: string;
  vendorName?: string;
  paymentMethod?: ExpensePaymentMethod;
  reimbursable: boolean;
  billable: boolean;
  receipts: ExpenseReceipt[];
  notes?: string;
  status: ExpenseStatus;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  isDemoData: boolean;
}

// Demo projects for expense linking
const DEMO_PROJECTS = [
  { id: 'demo-proj-smith-kitchen', name: 'Smith Kitchen Remodel' },
  { id: 'demo-proj-wilson-fence', name: 'Wilson Fence Installation' },
  { id: 'demo-proj-mainst-retail', name: 'Main St. Retail Storefront' },
  { id: 'demo-proj-garcia-bath', name: 'Garcia Master Bath' },
  { id: 'demo-proj-cafe-ti', name: 'Downtown Cafe TI' },
  { id: 'demo-proj-thompson-deck', name: 'Thompson Deck Build' },
  { id: 'demo-proj-office-park', name: 'Office Park Suite 200' },
  { id: 'demo-proj-garcia-basement', name: 'Garcia Basement Finish' },
  { id: 'demo-proj-brown-kitchen', name: 'Brown Kitchen Update' },
];

// Demo team for expenses
const EXPENSE_USERS = [
  DEMO_USERS.owner,
  DEMO_USERS.pm,
  DEMO_USERS.foreman,
  DEMO_USERS.fieldWorker1,
  DEMO_USERS.fieldWorker2,
  DEMO_USERS.fieldWorker3,
  DEMO_USERS.admin,
];

// Receipt reference generator
let receiptCounter = 1000;
const nextReceiptRef = (): string => {
  receiptCounter++;
  return `RCP-${receiptCounter}`;
};

// ============================================================================
// EXPENSE FACTORY
// ============================================================================

interface ExpenseParams {
  category: ExpenseCategory;
  vendorName: string;
  description: string;
  amount: number;
  daysAgo: number;
  projectId?: string;
  projectName?: string;
  userId?: string;
  userName?: string;
  reimbursable?: boolean;
  billable?: boolean;
  status?: ExpenseStatus;
  notes?: string;
}

const createExpense = (params: ExpenseParams): Expense => {
  const user = params.userId
    ? { uid: params.userId, displayName: params.userName || 'Unknown' }
    : randomItem(EXPENSE_USERS);

  const date = new Date();
  date.setDate(date.getDate() - params.daysAgo);

  const dateStr = date.toISOString().split('T')[0];

  return {
    id: generateId('exp'),
    orgId: DEMO_ORG_ID,
    userId: user.uid,
    userName: user.displayName,
    description: params.description,
    amount: params.amount,
    category: params.category,
    date: dateStr,
    projectId: params.projectId,
    projectName: params.projectName,
    vendorName: params.vendorName,
    paymentMethod: randomItem(PAYMENT_METHODS),
    reimbursable: params.reimbursable ?? false,
    billable: params.billable ?? true,
    receipts: [
      {
        id: generateId('rcpt'),
        url: `/receipts/${nextReceiptRef()}.pdf`,
        fileName: `${nextReceiptRef()}.pdf`,
        fileSize: Math.floor(Math.random() * 500000) + 100000,
        mimeType: 'application/pdf',
        uploadedAt: date,
      },
    ],
    notes: params.notes,
    status: params.status || 'approved',
    approvedBy: params.status === 'approved' ? DEMO_USERS.owner.uid : undefined,
    approvedAt: params.status === 'approved' ? date : undefined,
    createdAt: date,
    updatedAt: date,
    isDemoData: true,
  };
};

// ============================================================================
// GENERATE DEMO EXPENSES
// ============================================================================

export const generateDemoExpenses = (): Expense[] => {
  const expenses: Expense[] = [];
  receiptCounter = 1000; // Reset counter

  // -------------------------------------------------------------------------
  // Project-specific expenses
  // -------------------------------------------------------------------------

  // Smith Kitchen Remodel (completed 8 months ago)
  expenses.push(createExpense({
    category: 'permits',
    vendorName: 'City of Denver',
    description: 'Kitchen remodel building permit',
    amount: 485,
    daysAgo: 275,
    projectId: 'demo-proj-smith-kitchen',
    projectName: 'Smith Kitchen Remodel',
  }));

  expenses.push(createExpense({
    category: 'materials',
    vendorName: 'Home Depot',
    description: 'Demo supplies and protection materials',
    amount: 342,
    daysAgo: 268,
    projectId: 'demo-proj-smith-kitchen',
    projectName: 'Smith Kitchen Remodel',
  }));

  expenses.push(createExpense({
    category: 'materials',
    vendorName: 'ProSource Wholesale',
    description: 'Shaker cabinets - white maple',
    amount: 8450,
    daysAgo: 260,
    projectId: 'demo-proj-smith-kitchen',
    projectName: 'Smith Kitchen Remodel',
  }));

  expenses.push(createExpense({
    category: 'materials',
    vendorName: 'Denver Stone & Tile',
    description: 'Quartz countertop slabs',
    amount: 3200,
    daysAgo: 250,
    projectId: 'demo-proj-smith-kitchen',
    projectName: 'Smith Kitchen Remodel',
  }));

  expenses.push(createExpense({
    category: 'subcontractor',
    vendorName: 'Rocky Mountain Electric',
    description: 'Electrical rough-in and fixtures',
    amount: 4200,
    daysAgo: 258,
    projectId: 'demo-proj-smith-kitchen',
    projectName: 'Smith Kitchen Remodel',
  }));

  expenses.push(createExpense({
    category: 'subcontractor',
    vendorName: 'Front Range Plumbing',
    description: 'Plumbing rough-in and fixtures',
    amount: 3800,
    daysAgo: 255,
    projectId: 'demo-proj-smith-kitchen',
    projectName: 'Smith Kitchen Remodel',
  }));

  // Main St. Retail Storefront (completed 4 months ago)
  expenses.push(createExpense({
    category: 'permits',
    vendorName: 'City of Denver',
    description: 'Commercial build-out permit',
    amount: 2850,
    daysAgo: 215,
    projectId: 'demo-proj-mainst-retail',
    projectName: 'Main St. Retail Storefront',
  }));

  expenses.push(createExpense({
    category: 'materials',
    vendorName: 'ABC Supply',
    description: 'Storefront framing system',
    amount: 12500,
    daysAgo: 200,
    projectId: 'demo-proj-mainst-retail',
    projectName: 'Main St. Retail Storefront',
  }));

  expenses.push(createExpense({
    category: 'materials',
    vendorName: 'Lowes',
    description: 'Drywall and framing materials',
    amount: 4850,
    daysAgo: 185,
    projectId: 'demo-proj-mainst-retail',
    projectName: 'Main St. Retail Storefront',
  }));

  expenses.push(createExpense({
    category: 'subcontractor',
    vendorName: 'Mile High HVAC',
    description: 'Commercial HVAC installation',
    amount: 18500,
    daysAgo: 175,
    projectId: 'demo-proj-mainst-retail',
    projectName: 'Main St. Retail Storefront',
  }));

  expenses.push(createExpense({
    category: 'equipment_rental',
    vendorName: 'United Rentals',
    description: 'Scissor lift rental - 2 weeks',
    amount: 1250,
    daysAgo: 180,
    projectId: 'demo-proj-mainst-retail',
    projectName: 'Main St. Retail Storefront',
  }));

  // Garcia Master Bath (completed 2 months ago)
  expenses.push(createExpense({
    category: 'permits',
    vendorName: 'City of Lakewood',
    description: 'Bathroom remodel permit',
    amount: 285,
    daysAgo: 92,
    projectId: 'demo-proj-garcia-bath',
    projectName: 'Garcia Master Bath',
  }));

  expenses.push(createExpense({
    category: 'materials',
    vendorName: 'Floor & Decor',
    description: 'Tile - shower and floor',
    amount: 2450,
    daysAgo: 80,
    projectId: 'demo-proj-garcia-bath',
    projectName: 'Garcia Master Bath',
  }));

  expenses.push(createExpense({
    category: 'materials',
    vendorName: 'Ferguson Plumbing',
    description: 'Plumbing fixtures - shower, faucets',
    amount: 1850,
    daysAgo: 75,
    projectId: 'demo-proj-garcia-bath',
    projectName: 'Garcia Master Bath',
  }));

  // Downtown Cafe TI (completed 1 month ago)
  expenses.push(createExpense({
    category: 'permits',
    vendorName: 'City of Denver',
    description: 'Commercial tenant improvement permit',
    amount: 1950,
    daysAgo: 76,
    projectId: 'demo-proj-cafe-ti',
    projectName: 'Downtown Cafe TI',
  }));

  expenses.push(createExpense({
    category: 'materials',
    vendorName: '84 Lumber',
    description: 'Framing and drywall materials',
    amount: 6800,
    daysAgo: 65,
    projectId: 'demo-proj-cafe-ti',
    projectName: 'Downtown Cafe TI',
  }));

  expenses.push(createExpense({
    category: 'subcontractor',
    vendorName: 'Rocky Mountain Electric',
    description: 'Commercial electrical installation',
    amount: 8500,
    daysAgo: 55,
    projectId: 'demo-proj-cafe-ti',
    projectName: 'Downtown Cafe TI',
  }));

  // Thompson Deck (active - 40% complete)
  expenses.push(createExpense({
    category: 'permits',
    vendorName: 'City of Aurora',
    description: 'Deck construction permit',
    amount: 350,
    daysAgo: 15,
    projectId: 'demo-proj-thompson-deck',
    projectName: 'Thompson Deck Build',
  }));

  expenses.push(createExpense({
    category: 'materials',
    vendorName: '84 Lumber',
    description: 'Pressure-treated framing lumber',
    amount: 2850,
    daysAgo: 12,
    projectId: 'demo-proj-thompson-deck',
    projectName: 'Thompson Deck Build',
  }));

  expenses.push(createExpense({
    category: 'materials',
    vendorName: 'Home Depot',
    description: 'Concrete and post hardware',
    amount: 680,
    daysAgo: 13,
    projectId: 'demo-proj-thompson-deck',
    projectName: 'Thompson Deck Build',
  }));

  // Office Park Suite 200 (active - 25% complete)
  expenses.push(createExpense({
    category: 'permits',
    vendorName: 'City of Englewood',
    description: 'Commercial office TI permit',
    amount: 1850,
    daysAgo: 32,
    projectId: 'demo-proj-office-park',
    projectName: 'Office Park Suite 200',
  }));

  expenses.push(createExpense({
    category: 'materials',
    vendorName: 'Lowes',
    description: 'Metal studs and framing',
    amount: 4200,
    daysAgo: 28,
    projectId: 'demo-proj-office-park',
    projectName: 'Office Park Suite 200',
  }));

  expenses.push(createExpense({
    category: 'equipment_rental',
    vendorName: 'Sunbelt Rentals',
    description: 'Dumpster rental - 30 day',
    amount: 650,
    daysAgo: 30,
    projectId: 'demo-proj-office-park',
    projectName: 'Office Park Suite 200',
  }));

  // Garcia Basement (active - 35% complete)
  expenses.push(createExpense({
    category: 'permits',
    vendorName: 'City of Lakewood',
    description: 'Basement finish permit',
    amount: 485,
    daysAgo: 22,
    projectId: 'demo-proj-garcia-basement',
    projectName: 'Garcia Basement Finish',
  }));

  expenses.push(createExpense({
    category: 'materials',
    vendorName: 'Home Depot',
    description: 'Egress window kit',
    amount: 1450,
    daysAgo: 18,
    projectId: 'demo-proj-garcia-basement',
    projectName: 'Garcia Basement Finish',
  }));

  expenses.push(createExpense({
    category: 'materials',
    vendorName: 'Lowes',
    description: 'Framing lumber and insulation',
    amount: 2200,
    daysAgo: 15,
    projectId: 'demo-proj-garcia-basement',
    projectName: 'Garcia Basement Finish',
  }));

  // Brown Kitchen (active - 15% complete)
  expenses.push(createExpense({
    category: 'materials',
    vendorName: 'Home Depot',
    description: 'Demo supplies and protection',
    amount: 285,
    daysAgo: 6,
    projectId: 'demo-proj-brown-kitchen',
    projectName: 'Brown Kitchen Update',
  }));

  // -------------------------------------------------------------------------
  // General/Overhead Expenses
  // -------------------------------------------------------------------------

  // Weekly fuel expenses - 52 weeks
  for (let week = 0; week < 52; week++) {
    const fuelAmount = randomAmount(85, 220);
    const fuelVendor = randomItem(VENDORS.fuel);
    const user = randomItem([
      DEMO_USERS.foreman,
      DEMO_USERS.fieldWorker1,
      DEMO_USERS.fieldWorker2,
      DEMO_USERS.fieldWorker3,
    ]);

    expenses.push(createExpense({
      category: 'fuel',
      vendorName: fuelVendor,
      description: 'Fuel for work truck',
      amount: fuelAmount,
      daysAgo: week * 7 + Math.floor(Math.random() * 3),
      userId: user.uid,
      userName: user.displayName,
      reimbursable: true,
      billable: false,
    }));
  }

  // Monthly office supplies
  for (let month = 0; month < 12; month++) {
    expenses.push(createExpense({
      category: 'office',
      vendorName: randomItem(VENDORS.office),
      description: randomItem(EXPENSE_DESCRIPTIONS.office),
      amount: randomAmount(45, 180),
      daysAgo: month * 30 + Math.floor(Math.random() * 10),
      userId: DEMO_USERS.admin.uid,
      userName: DEMO_USERS.admin.displayName,
      billable: false,
    }));
  }

  // Tool purchases
  const toolPurchases = [
    { desc: 'Cordless drill set - DeWalt', amount: 389, daysAgo: 280 },
    { desc: 'Circular saw blade set', amount: 145, daysAgo: 220 },
    { desc: 'Level and measuring tools', amount: 125, daysAgo: 180 },
    { desc: 'Safety harnesses (2)', amount: 380, daysAgo: 150 },
    { desc: 'Hand tools assortment', amount: 285, daysAgo: 100 },
    { desc: 'Drill bits and accessories', amount: 165, daysAgo: 60 },
    { desc: 'Caulk gun and supplies', amount: 85, daysAgo: 30 },
    { desc: 'Impact driver - Milwaukee', amount: 225, daysAgo: 15 },
  ];

  toolPurchases.forEach(tool => {
    expenses.push(createExpense({
      category: 'tools',
      vendorName: randomItem(VENDORS.tools),
      description: tool.desc,
      amount: tool.amount,
      daysAgo: tool.daysAgo,
      userId: DEMO_USERS.foreman.uid,
      userName: DEMO_USERS.foreman.displayName,
      billable: false,
    }));
  });

  // Quarterly insurance
  for (let quarter = 0; quarter < 4; quarter++) {
    expenses.push(createExpense({
      category: 'insurance',
      vendorName: 'State Farm Business',
      description: 'Quarterly liability insurance premium',
      amount: 2450,
      daysAgo: quarter * 90 + 15,
      userId: DEMO_USERS.owner.uid,
      userName: DEMO_USERS.owner.displayName,
      billable: false,
    }));
  }

  // Vehicle maintenance
  const vehicleExpenses = [
    { desc: 'Oil change and inspection - Truck #1', amount: 125, daysAgo: 90 },
    { desc: 'New tires - Truck #1', amount: 680, daysAgo: 180 },
    { desc: 'Brake service - Company van', amount: 485, daysAgo: 120 },
    { desc: 'Annual inspection - Truck #2', amount: 95, daysAgo: 45 },
  ];

  vehicleExpenses.forEach(vehicle => {
    expenses.push(createExpense({
      category: 'vehicle',
      vendorName: 'Front Range Auto Service',
      description: vehicle.desc,
      amount: vehicle.amount,
      daysAgo: vehicle.daysAgo,
      userId: DEMO_USERS.admin.uid,
      userName: DEMO_USERS.admin.displayName,
      billable: false,
    }));
  });

  // Misc materials
  const miscMaterials = [
    { vendor: 'Home Depot', desc: 'Misc hardware and fasteners', amount: 234, daysAgo: 42 },
    { vendor: 'Lowes', desc: 'Paint supplies - various projects', amount: 567, daysAgo: 38 },
    { vendor: 'ABC Supply', desc: 'Flashing and sealants', amount: 345, daysAgo: 55 },
    { vendor: 'Ferguson Plumbing', desc: 'PVC fittings assortment', amount: 189, daysAgo: 25 },
    { vendor: 'Home Depot', desc: 'Electrical supplies', amount: 278, daysAgo: 18 },
    { vendor: 'Grainger', desc: 'Safety supplies', amount: 425, daysAgo: 32 },
  ];

  miscMaterials.forEach(mat => {
    expenses.push(createExpense({
      category: 'materials',
      vendorName: mat.vendor,
      description: mat.desc,
      amount: mat.amount,
      daysAgo: mat.daysAgo,
    }));
  });

  // Add a few pending expenses
  expenses.push(createExpense({
    category: 'materials',
    vendorName: 'Home Depot',
    description: 'Composite decking boards - pending approval',
    amount: 4200,
    daysAgo: 2,
    projectId: 'demo-proj-thompson-deck',
    projectName: 'Thompson Deck Build',
    status: 'pending',
  }));

  expenses.push(createExpense({
    category: 'tools',
    vendorName: 'Milwaukee Tool',
    description: 'New reciprocating saw - pending approval',
    amount: 289,
    daysAgo: 1,
    status: 'pending',
  }));

  return expenses;
};

// Export for use in seeding scripts
export const DEMO_EXPENSES = generateDemoExpenses();

// Summary for verification
export const getExpenseSummary = () => {
  const expenses = DEMO_EXPENSES;
  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  const byCategory: Record<ExpenseCategory, { count: number; total: number }> = {} as any;
  expenses.forEach(e => {
    if (!byCategory[e.category]) {
      byCategory[e.category] = { count: 0, total: 0 };
    }
    byCategory[e.category].count++;
    byCategory[e.category].total += e.amount;
  });

  const byProject = new Map<string, { name: string; count: number; total: number }>();
  expenses.forEach(e => {
    if (e.projectId) {
      const existing = byProject.get(e.projectId) || {
        name: e.projectName || 'Unknown',
        count: 0,
        total: 0,
      };
      existing.count++;
      existing.total += e.amount;
      byProject.set(e.projectId, existing);
    }
  });

  return {
    total: expenses.length,
    totalAmount,
    byCategory,
    byProject: Object.fromEntries(byProject),
    approved: expenses.filter(e => e.status === 'approved').length,
    pending: expenses.filter(e => e.status === 'pending').length,
  };
};

// Helper to remove undefined values (Firestore doesn't accept undefined)
const removeUndefined = <T extends Record<string, unknown>>(obj: T): T => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined)
  ) as T;
};

// Firestore seeding function
export async function seedExpenses(
  db: FirebaseFirestore.Firestore,
  orgId: string
): Promise<{ count: number }> {
  logSection('Seeding Expenses');

  const expenses = generateDemoExpenses();

  await executeBatchWrites(
    db,
    expenses,
    (batch, expense) => {
      const docRef = db
        .collection('organizations')
        .doc(orgId)
        .collection('expenses')
        .doc(expense.id);

      batch.set(docRef, removeUndefined({
        ...expense,
        orgId,
        approvedAt: expense.approvedAt ? toTimestamp(expense.approvedAt) : null,
        createdAt: toTimestamp(expense.createdAt),
        updatedAt: toTimestamp(expense.updatedAt),
        receipts: expense.receipts.map(r => ({
          ...r,
          uploadedAt: toTimestamp(r.uploadedAt),
        })),
      }));
    },
    'Expenses'
  );

  logSuccess(`Seeded ${expenses.length} expenses`);
  return { count: expenses.length };
}
