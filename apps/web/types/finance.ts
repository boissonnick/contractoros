// ============================================
// Finance Types
// Extracted from types/index.ts for better organization
// ============================================

// ============================================
// Quote Types
// ============================================

export type QuoteSectionStatus = 'draft' | 'sent' | 'approved' | 'rejected';

export interface QuoteSection {
  id: string;
  projectId: string;
  phaseId?: string;
  name: string;
  description?: string;
  laborCost: number;
  materialCost: number;
  order: number;
  status: QuoteSectionStatus;
  createdAt: Date;
  updatedAt?: Date;
}

// ============================================
// Legacy Payroll Types (for simple payroll preview)
// Full Payroll Module types defined at end of file
// ============================================

export interface PayrollConfig {
  id: string;
  orgId: string;
  payPeriod: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';
  overtimeThresholdHours: number; // per week
  overtimeMultiplier: number; // e.g. 1.5
  defaultHourlyRate: number;
  payDay: string; // e.g. "Friday" or "1st and 15th"
  createdAt: Date;
  updatedAt?: Date;
}

// Legacy simple payroll entry - used by PayrollPreviewReport
export interface LegacyPayrollEntry {
  userId: string;
  userName: string;
  regularHours: number;
  overtimeHours: number;
  hourlyRate: number;
  regularPay: number;
  overtimePay: number;
  totalPay: number;
}

// Legacy simple payroll run - used by lib/payroll.ts
export interface LegacyPayrollRun {
  id: string;
  orgId: string;
  periodStart: Date;
  periodEnd: Date;
  entries: LegacyPayrollEntry[];
  totalRegular: number;
  totalOvertime: number;
  totalPay: number;
  status: 'preview' | 'finalized';
  createdAt: Date;
}

// ============================================
// Job Costing Types
// ============================================

/**
 * Cost category for job costing entries.
 * Used to track where money is being spent on projects.
 */
export type CostCategory =
  | 'labor_internal'      // Internal employee labor costs
  | 'labor_subcontractor' // Subcontractor labor/services
  | 'materials'           // Material costs
  | 'equipment_rental'    // Equipment and tool rentals
  | 'permits_fees'        // Permits, licenses, and fees
  | 'overhead'            // Project overhead allocation
  | 'other';              // Miscellaneous costs

/**
 * Source of a job cost entry - where the cost came from.
 */
export type JobCostSource =
  | 'manual'        // Manually entered by user
  | 'timesheet'     // Derived from time entries
  | 'expense'       // From expense tracking
  | 'invoice'       // From vendor invoice
  | 'sub_payment'   // Subcontractor payment
  | 'purchase_order'; // From PO system

/**
 * Job cost entry - individual cost record for a project.
 * Stored in: organizations/{orgId}/jobCosts/{costId}
 */
export interface JobCostEntry {
  id: string;
  projectId: string;
  orgId: string;

  // Cost classification
  category: CostCategory;
  description: string;
  amount: number;
  quantity?: number;
  unitCost?: number;
  unit?: string;

  // Date and timing
  date: Date;
  periodStart?: Date;  // For recurring costs
  periodEnd?: Date;

  // Source tracking
  source: JobCostSource;
  sourceId?: string;   // Reference to original record (timeEntryId, expenseId, etc.)
  sourceDetails?: string;

  // Phase/task association
  phaseId?: string;
  phaseName?: string;
  taskId?: string;
  taskName?: string;

  // Vendor/person
  vendorId?: string;
  vendorName?: string;
  userId?: string;
  userName?: string;

  // Budget comparison
  budgetLineId?: string;  // Link to estimate line item
  budgetedAmount?: number;

  // Flags
  isBillable: boolean;
  isApproved: boolean;
  approvedBy?: string;
  approvedAt?: Date;

  // Metadata
  notes?: string;
  tags?: string[];
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
  updatedBy?: string;
}

/**
 * Aggregated profitability data for a project.
 * Stored in: organizations/{orgId}/projectProfitability/{projectId}
 * Updated periodically (on cost entry, daily rollup, etc.)
 */
export interface ProjectProfitability {
  projectId: string;
  orgId: string;

  // Contract/Revenue
  contractValue: number;          // Original contract amount
  changeOrdersValue: number;      // Total approved change orders
  totalContractValue: number;     // contractValue + changeOrdersValue
  invoicedAmount: number;         // Amount invoiced to date
  collectedAmount: number;        // Amount collected to date

  // Costs
  totalCosts: number;             // Sum of all job cost entries
  costsByCategory: Record<CostCategory, number>;
  committedCosts: number;         // POs, contracts not yet billed
  projectedFinalCost: number;     // totalCosts + uncommitted estimate

  // Profitability
  grossProfit: number;            // totalContractValue - totalCosts
  grossMargin: number;            // Percentage: (grossProfit / totalContractValue) * 100
  projectedProfit: number;        // totalContractValue - projectedFinalCost
  projectedMargin: number;        // Percentage: (projectedProfit / totalContractValue) * 100

  // Budget Variance
  originalBudget: number;         // From estimate
  budgetVariance: number;         // originalBudget - totalCosts (positive = under budget)
  budgetVariancePercent: number;  // Percentage variance

  // Cost breakdown by type
  laborCosts: number;             // labor_internal + labor_subcontractor
  materialCosts: number;          // materials category
  otherCosts: number;             // equipment_rental + permits_fees + overhead + other

  // Phase breakdown (optional)
  costsByPhase?: Array<{
    phaseId: string;
    phaseName: string;
    budgeted: number;
    actual: number;
    variance: number;
  }>;

  // Time tracking
  totalLaborHours: number;
  laborCostPerHour: number;       // totalLaborCosts / totalLaborHours

  // Status indicators
  isOverBudget: boolean;
  isAtRisk: boolean;              // margin below threshold
  marginAlertThreshold: number;   // Configured threshold for alerts

  // Metadata
  lastUpdated: Date;
  lastUpdatedBy?: string;
  calculationVersion: number;     // For schema migrations
}

/**
 * Summary of job costs for reporting.
 */
export interface JobCostSummary {
  projectId: string;
  period: 'week' | 'month' | 'quarter' | 'year' | 'all';
  startDate: Date;
  endDate: Date;

  totalCosts: number;
  costsByCategory: Record<CostCategory, number>;
  costsBySource: Record<JobCostSource, number>;

  topVendors: Array<{
    vendorId: string;
    vendorName: string;
    amount: number;
    count: number;
  }>;

  topPhases: Array<{
    phaseId: string;
    phaseName: string;
    amount: number;
    budgeted: number;
    variance: number;
  }>;

  dailyTrend: Array<{
    date: string;
    amount: number;
    cumulative: number;
  }>;
}

/**
 * Job costing alert for budget overruns or margin issues.
 */
export interface JobCostAlert {
  id: string;
  projectId: string;
  orgId: string;

  type: 'budget_overrun' | 'margin_below_threshold' | 'cost_spike' | 'category_overrun';
  severity: 'info' | 'warning' | 'critical';

  title: string;
  message: string;
  details?: {
    category?: CostCategory;
    budgeted?: number;
    actual?: number;
    variance?: number;
    threshold?: number;
  };

  isAcknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;

  createdAt: Date;
}

export const COST_CATEGORY_LABELS: Record<CostCategory, { label: string; icon: string; color: string }> = {
  labor_internal: { label: 'Internal Labor', icon: 'UserGroupIcon', color: 'blue' },
  labor_subcontractor: { label: 'Subcontractor', icon: 'WrenchScrewdriverIcon', color: 'purple' },
  materials: { label: 'Materials', icon: 'CubeIcon', color: 'amber' },
  equipment_rental: { label: 'Equipment Rental', icon: 'TruckIcon', color: 'orange' },
  permits_fees: { label: 'Permits & Fees', icon: 'DocumentCheckIcon', color: 'green' },
  overhead: { label: 'Overhead', icon: 'BuildingOfficeIcon', color: 'gray' },
  other: { label: 'Other', icon: 'EllipsisHorizontalCircleIcon', color: 'slate' },
};

export const JOB_COST_SOURCE_LABELS: Record<JobCostSource, string> = {
  manual: 'Manual Entry',
  timesheet: 'Timesheet',
  expense: 'Expense Report',
  invoice: 'Vendor Invoice',
  sub_payment: 'Sub Payment',
  purchase_order: 'Purchase Order',
};

// ============================================
// Expense Types
// ============================================

export type ExpenseCategory =
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

export type ExpenseStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'paid';

export type ExpensePaymentMethod = 'cash' | 'credit_card' | 'debit_card' | 'check' | 'company_card' | 'other';

export interface ExpenseReceipt {
  id: string;
  url: string;
  thumbnailUrl?: string;
  fileName: string;
  fileSize: number; // bytes
  mimeType: string;
  uploadedAt: Date;
}

export interface Expense {
  id: string;
  orgId: string;
  userId: string;
  userName: string;

  // Expense details
  description: string;
  amount: number;
  category: ExpenseCategory;
  date: string; // ISO date string (YYYY-MM-DD)

  // Optional associations
  projectId?: string;
  projectName?: string;
  vendorName?: string;
  vendorId?: string;

  // Payment info
  paymentMethod?: ExpensePaymentMethod;
  reimbursable: boolean;
  billable: boolean; // Can be billed to client

  // Receipts/documentation
  receipts: ExpenseReceipt[];
  notes?: string;

  // Tax
  taxAmount?: number;
  taxDeductible?: boolean;

  // Approval workflow
  status: ExpenseStatus;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  reviewNote?: string; // Note from manager during review
  paidAt?: Date;
  paidBy?: string;
  paidByName?: string;
  reimbursementMethod?: string; // check, direct_deposit, cash, payroll

  // Tags for filtering
  tags?: string[];

  // Metadata
  createdAt: Date;
  updatedAt?: Date;
}

export interface ExpenseSummary {
  period: 'day' | 'week' | 'month' | 'year' | 'custom';
  startDate: string;
  endDate: string;
  totalExpenses: number;
  totalReimbursable: number;
  totalBillable: number;
  totalPending: number;
  totalUnderReview: number;
  totalApproved: number;
  totalRejected: number;
  totalPaid: number;
  // Status counts (number of items)
  countPending: number;
  countUnderReview: number;
  countApproved: number;
  countRejected: number;
  countPaid: number;
  byCategory: Record<ExpenseCategory, number>;
  byProject: { projectId: string; projectName: string; amount: number }[];
  byUser: { userId: string; userName: string; amount: number }[];
  count: number;
}

// Category constants with display info
export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string; icon: string; color: string }[] = [
  { value: 'materials', label: 'Materials', icon: 'cube', color: '#10b981' },
  { value: 'tools', label: 'Tools', icon: 'wrench', color: '#6366f1' },
  { value: 'equipment_rental', label: 'Equipment Rental', icon: 'truck', color: '#8b5cf6' },
  { value: 'fuel', label: 'Fuel', icon: 'fire', color: '#f59e0b' },
  { value: 'vehicle', label: 'Vehicle', icon: 'truck', color: '#3b82f6' },
  { value: 'subcontractor', label: 'Subcontractor', icon: 'users', color: '#ec4899' },
  { value: 'permits', label: 'Permits', icon: 'document', color: '#0891b2' },
  { value: 'labor', label: 'Labor', icon: 'user', color: '#14b8a6' },
  { value: 'office', label: 'Office', icon: 'building', color: '#64748b' },
  { value: 'travel', label: 'Travel', icon: 'airplane', color: '#a855f7' },
  { value: 'meals', label: 'Meals', icon: 'cake', color: '#f97316' },
  { value: 'insurance', label: 'Insurance', icon: 'shield', color: '#84cc16' },
  { value: 'utilities', label: 'Utilities', icon: 'bolt', color: '#eab308' },
  { value: 'marketing', label: 'Marketing', icon: 'megaphone', color: '#e11d48' },
  { value: 'other', label: 'Other', icon: 'ellipsis', color: '#6b7280' },
];

export const EXPENSE_STATUSES: { value: ExpenseStatus; label: string; color: string; description: string }[] = [
  { value: 'pending', label: 'Pending', color: '#f59e0b', description: 'Awaiting manager review' },
  { value: 'under_review', label: 'Under Review', color: '#8b5cf6', description: 'Manager is reviewing' },
  { value: 'approved', label: 'Approved', color: '#10b981', description: 'Ready for payment' },
  { value: 'rejected', label: 'Rejected', color: '#ef4444', description: 'Expense was rejected' },
  { value: 'paid', label: 'Paid', color: '#3b82f6', description: 'Reimbursement completed' },
];

export const EXPENSE_PAYMENT_METHODS: { value: ExpensePaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'debit_card', label: 'Debit Card' },
  { value: 'check', label: 'Check' },
  { value: 'company_card', label: 'Company Card' },
  { value: 'other', label: 'Other' },
];

// ============================================
// Purchase Order Types (Sprint 10)
// ============================================

export type PurchaseOrderStatus = 'draft' | 'pending_approval' | 'approved' | 'ordered' | 'partially_received' | 'received' | 'cancelled';

export interface PurchaseOrderLineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  costCode?: string;
  receivedQuantity?: number;
  notes?: string;
}

export interface PurchaseOrder {
  id: string;
  orgId: string;
  projectId: string;
  number: string; // PO-001, etc.
  vendor: string;
  vendorContact?: string;
  vendorEmail?: string;
  vendorPhone?: string;
  status: PurchaseOrderStatus;

  // Line items
  lineItems: PurchaseOrderLineItem[];
  subtotal: number;
  taxRate?: number;
  taxAmount?: number;
  shippingCost?: number;
  total: number;

  // Dates
  orderDate?: Date;
  expectedDeliveryDate?: Date;
  receivedDate?: Date;

  // Approval
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: Date;

  // Notes
  notes?: string;
  deliveryInstructions?: string;

  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt?: Date;
}

// ============================================
// Cost Code Types (Sprint 10)
// ============================================

export interface CostCode {
  id: string;
  orgId: string;
  code: string;        // e.g. "01-100", "03-300"
  name: string;        // e.g. "General Conditions", "Concrete Foundations"
  category: CostCodeCategory;
  description?: string;
  budgetDefault?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export type CostCodeCategory =
  | 'general_conditions'
  | 'site_work'
  | 'concrete'
  | 'masonry'
  | 'metals'
  | 'wood_plastics'
  | 'thermal_moisture'
  | 'doors_windows'
  | 'finishes'
  | 'specialties'
  | 'equipment'
  | 'furnishings'
  | 'special_construction'
  | 'conveying'
  | 'mechanical'
  | 'electrical'
  | 'overhead'
  | 'labor'
  | 'materials'
  | 'subcontractors'
  | 'other';

// ============================================
// Budget & Job Costing Types (Sprint 10)
// ============================================

export interface ProjectBudgetLine {
  id: string;
  projectId: string;
  orgId: string;
  costCodeId?: string;
  costCode?: string;
  category: string;
  description: string;
  budgetAmount: number;
  committedAmount: number; // POs, contracts
  actualAmount: number;    // Actual spend
  variance: number;        // budget - actual
  percentUsed: number;     // (actual / budget) * 100
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ProjectCostSummary {
  totalBudget: number;
  totalCommitted: number;
  totalActual: number;
  totalVariance: number;
  percentUsed: number;
  laborCost: number;
  materialCost: number;
  subcontractorCost: number;
  overheadCost: number;
  profitMargin: number;
  revenue: number;
}

// ============================================
// Estimate & Proposal Types
// ============================================

export type EstimateStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired' | 'revised';

export interface Estimate {
  id: string;
  projectId?: string;
  orgId: string;
  number: string; // EST-001, EST-002, etc.
  name: string;
  description?: string;
  status: EstimateStatus;

  // Client info
  clientId?: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;

  // Project details
  projectName?: string;
  projectAddress?: string;

  // Line items
  lineItems: EstimateLineItem[];
  sections?: EstimateSection[];

  // Pricing
  subtotal: number;
  taxRate?: number;
  taxAmount?: number;
  discount?: number;
  discountType?: 'percent' | 'fixed';
  total: number;

  // Markup/Margin
  markupPercent?: number;
  profitMargin?: number;

  // Payment terms
  paymentTerms?: string;
  depositRequired?: number;
  depositPercent?: number;

  // Validity
  validUntil?: Date;
  expirationDays?: number;

  // Scope & Notes
  scopeOfWork?: string;
  exclusions?: string;
  notes?: string;
  termsAndConditions?: string;

  // Tracking
  sentAt?: Date;
  viewedAt?: Date;
  acceptedAt?: Date;
  declinedAt?: Date;
  declineReason?: string;

  // Signature
  signatureUrl?: string;
  signedAt?: Date;
  signedBy?: string;
  signedByIp?: string;

  // Revisions
  revisionNumber: number;
  previousVersionId?: string;

  // Template
  templateId?: string;

  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface EstimateSection {
  id: string;
  name: string;
  description?: string;
  sortOrder: number;
  subtotal: number;
  lineItemIds: string[];
}

export interface EstimateLineItem {
  id: string;
  sectionId?: string;
  sortOrder: number;

  // Item details
  name: string;
  description?: string;

  // Categorization
  category?: string;
  costCode?: string;
  trade?: string;

  // Quantity & Pricing
  quantity: number;
  unit: string; // each, sqft, lf, hr, day, etc.
  unitCost: number;
  totalCost: number;

  // Labor breakdown
  laborHours?: number;
  laborRate?: number;
  laborCost?: number;

  // Material breakdown
  materialCost?: number;

  // Markup
  markup?: number;
  markupType?: 'percent' | 'fixed';

  // Flags
  isOptional?: boolean;
  isAllowance?: boolean;
  allowanceNote?: string;

  // Catalog reference
  catalogItemId?: string;
}

// Cost Catalog for reusable pricing
export interface CostCatalogItem {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  category: string;
  trade?: string;
  costCode?: string;

  // Default pricing
  defaultUnit: string;
  defaultUnitCost: number;
  defaultLaborHours?: number;
  defaultLaborRate?: number;
  defaultMaterialCost?: number;

  // Last used/updated
  lastUsedAt?: Date;
  usageCount: number;

  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

// Labor Rate configuration
export interface LaborRate {
  id: string;
  orgId: string;
  name: string; // e.g., "Journeyman Electrician", "Helper"
  trade?: string;
  hourlyRate: number;
  overtimeMultiplier?: number;
  isDefault?: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

// Estimate Template
export interface EstimateTemplate {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  projectType?: string; // kitchen remodel, bathroom, new build, etc.

  // Default content
  defaultSections: EstimateSection[];
  defaultLineItems: EstimateLineItem[];
  defaultScopeOfWork?: string;
  defaultExclusions?: string;
  defaultTerms?: string;
  defaultPaymentTerms?: string;

  isActive: boolean;
  usageCount: number;
  createdAt: Date;
  updatedAt?: Date;
}

// ============================================
// Invoice Types
// ============================================

export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'partial' | 'paid' | 'overdue' | 'void';
export type InvoiceType = 'standard' | 'progress' | 'aia_g702' | 'deposit' | 'final' | 'change_order';

export interface Invoice {
  id: string;
  projectId?: string;
  estimateId?: string;
  orgId: string;
  number: string; // INV-001, etc.
  type: InvoiceType;
  status: InvoiceStatus;

  // Client info
  clientId?: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  billingAddress?: string;

  // Project details
  projectName?: string;
  projectAddress?: string;

  // Line items
  lineItems: InvoiceLineItem[];

  // Progress billing (for type = 'progress' or 'aia_g702')
  progressBilling?: ProgressBillingInfo;

  // Pricing
  subtotal: number;
  taxRate?: number;
  taxAmount?: number;
  discount?: number;
  discountType?: 'percent' | 'fixed';
  retainage?: number;
  retainageAmount?: number;
  total: number;
  amountDue: number;

  // Payments
  amountPaid: number;
  payments?: Payment[];

  // Payment terms
  paymentTerms: string;
  dueDate: Date;
  lateFeePercent?: number;
  lateFeeAmount?: number;

  // Notes
  notes?: string;
  internalNotes?: string;

  // Tracking
  sentAt?: Date;
  viewedAt?: Date;
  paidAt?: Date;
  voidedAt?: Date;
  voidReason?: string;

  // Reminders
  remindersSent?: number;
  lastReminderAt?: Date;
  nextReminderAt?: Date;

  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface InvoiceLineItem {
  id: string;
  sortOrder: number;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;

  // For progress billing
  previousBilled?: number;
  currentBilled?: number;
  percentComplete?: number;

  // References
  estimateLineItemId?: string;
  costCode?: string;
}

export interface ProgressBillingInfo {
  contractAmount: number;
  previouslyBilled: number;
  currentBilling: number;
  totalBilled: number;
  balanceToFinish: number;
  percentComplete: number;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: 'check' | 'credit_card' | 'ach' | 'cash' | 'wire' | 'other';
  reference?: string; // Check number, transaction ID, etc.
  notes?: string;
  receivedAt: Date;
  recordedBy: string;
  recordedByName: string;
  createdAt: Date;
}

// Lien Waiver types
export type LienWaiverType = 'conditional_progress' | 'unconditional_progress' | 'conditional_final' | 'unconditional_final';

export interface LienWaiver {
  id: string;
  invoiceId?: string;
  projectId: string;
  orgId: string;
  type: LienWaiverType;
  status: 'draft' | 'pending' | 'signed' | 'void';

  // Parties
  claimantName: string;
  claimantAddress?: string;
  ownerName: string;
  propertyAddress: string;

  // Amounts
  throughDate: Date;
  amount: number;
  exceptionsAmount?: number;
  exceptionsDescription?: string;

  // Signature
  signedAt?: Date;
  signedBy?: string;
  signatureUrl?: string;

  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
}

// ============================================
// Accounting Integration Types (Sprint 11)
// ============================================

export type AccountingProvider = 'quickbooks' | 'xero' | 'none';

export type AccountingSyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export interface AccountingConnection {
  id: string;
  orgId: string;
  provider: AccountingProvider;
  isConnected: boolean;
  companyName?: string;
  companyId?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  lastSyncAt?: Date;
  lastSyncStatus?: AccountingSyncStatus;
  lastSyncError?: string;
  syncSettings: AccountingSyncSettings;
  createdAt: Date;
  updatedAt?: Date;
}

export interface AccountingSyncSettings {
  autoSyncInvoices: boolean;
  autoSyncExpenses: boolean;
  autoSyncPayments: boolean;
  syncFrequency: 'manual' | 'daily' | 'weekly';
  defaultIncomeAccountId?: string;
  defaultExpenseAccountId?: string;
  defaultAssetAccountId?: string;
}

export interface AccountingAccount {
  id: string;
  name: string;
  type: AccountingAccountType;
  number?: string;
  isActive: boolean;
  parentId?: string;
  provider: AccountingProvider;
}

export type AccountingAccountType =
  | 'income'
  | 'expense'
  | 'asset'
  | 'liability'
  | 'equity'
  | 'cost_of_goods_sold'
  | 'other_income'
  | 'other_expense';

export interface AccountMappingRule {
  id: string;
  orgId: string;
  sourceType: 'expense_category' | 'invoice_type' | 'payment_type';
  sourceValue: string;
  targetAccountId: string;
  targetAccountName: string;
  provider: AccountingProvider;
  createdAt: Date;
}

export interface TaxRate {
  id: string;
  orgId: string;
  name: string;
  rate: number;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  appliesTo: ('estimates' | 'invoices')[];
  createdAt: Date;
  updatedAt?: Date;
}

export interface AccountingSyncLog {
  id: string;
  orgId: string;
  provider: AccountingProvider;
  action: 'sync_invoices' | 'sync_expenses' | 'sync_payments' | 'full_sync';
  status: 'started' | 'completed' | 'failed';
  itemsSynced: number;
  itemsFailed: number;
  errors: string[];
  startedAt: Date;
  completedAt?: Date;
}

// ============================================
// QuickBooks Integration Types (Sprint 19)
// ============================================

export type QuickBooksEnvironment = 'sandbox' | 'production';

export type QuickBooksConnectionStatus = 'connected' | 'disconnected' | 'expired' | 'error';

export type QuickBooksSyncDirection = 'cos_to_qbo' | 'qbo_to_cos' | 'bidirectional';

export type QuickBooksEntityType =
  | 'customer'
  | 'invoice'
  | 'payment'
  | 'expense'
  | 'vendor'
  | 'item'
  | 'account';

export type QuickBooksSyncStatus = 'pending' | 'in_progress' | 'success' | 'failed' | 'partial';

export interface QuickBooksConnection {
  id: string;
  orgId: string;
  // OAuth credentials
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: Date;
  // QuickBooks company info
  realmId: string;  // QuickBooks company ID
  companyName: string;
  companyCountry?: string;
  // Connection metadata
  environment: QuickBooksEnvironment;
  status: QuickBooksConnectionStatus;
  lastTokenRefreshAt?: Date;
  // Sync configuration
  syncSettings: QuickBooksSyncSettings;
  // Audit
  connectedBy: string;
  connectedByName?: string;
  connectedAt: Date;
  disconnectedAt?: Date;
  disconnectedBy?: string;
  lastSyncAt?: Date;
  lastSyncStatus?: QuickBooksSyncStatus;
  createdAt: Date;
  updatedAt?: Date;
}

export interface QuickBooksSyncSettings {
  // Entity sync toggles
  syncCustomers: boolean;
  syncInvoices: boolean;
  syncPayments: boolean;
  syncExpenses: boolean;
  // Sync direction
  customerSyncDirection: QuickBooksSyncDirection;
  invoiceSyncDirection: QuickBooksSyncDirection;
  paymentSyncDirection: QuickBooksSyncDirection;
  expenseSyncDirection: QuickBooksSyncDirection;
  // Automation
  autoSyncEnabled: boolean;
  autoSyncFrequency: 'realtime' | 'hourly' | 'daily' | 'manual';
  // Default account mappings
  defaultIncomeAccountId?: string;
  defaultIncomeAccountName?: string;
  defaultExpenseAccountId?: string;
  defaultExpenseAccountName?: string;
  defaultAssetAccountId?: string;
  defaultAssetAccountName?: string;
  // Tax settings
  defaultTaxCodeId?: string;
  defaultTaxCodeName?: string;
}

export interface QuickBooksSyncLog {
  id: string;
  orgId: string;
  connectionId: string;
  // Sync details
  entityType: QuickBooksEntityType;
  direction: QuickBooksSyncDirection;
  status: QuickBooksSyncStatus;
  // Trigger info
  triggeredBy: 'manual' | 'auto' | 'webhook' | 'system';
  triggeredByUserId?: string;
  triggeredByUserName?: string;
  // Results
  itemsProcessed: number;
  itemsCreated: number;
  itemsUpdated: number;
  itemsSkipped: number;
  itemsFailed: number;
  // Error tracking
  errors: QuickBooksSyncError[];
  // Timing
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
  createdAt: Date;
}

export interface QuickBooksSyncError {
  entityId: string;
  entityName?: string;
  errorCode?: string;
  errorMessage: string;
  qboErrorDetail?: string;
  retryable: boolean;
}

export interface QuickBooksEntityMapping {
  id: string;
  orgId: string;
  connectionId: string;
  // Entity references
  entityType: QuickBooksEntityType;
  cosEntityId: string;       // ContractorOS entity ID
  cosEntityName?: string;    // For display purposes
  qboEntityId: string;       // QuickBooks entity ID
  qboEntityRef?: string;     // QuickBooks SyncToken for optimistic locking
  // Sync metadata
  lastSyncedAt: Date;
  lastSyncDirection: QuickBooksSyncDirection;
  syncStatus: 'synced' | 'pending' | 'conflict' | 'error';
  // Audit
  createdAt: Date;
  updatedAt?: Date;
}

// QuickBooks API response types (for internal use)
export interface QBOCustomer {
  Id: string;
  DisplayName: string;
  CompanyName?: string;
  GivenName?: string;
  FamilyName?: string;
  PrimaryEmailAddr?: { Address: string };
  PrimaryPhone?: { FreeFormNumber: string };
  BillAddr?: QBOAddress;
  ShipAddr?: QBOAddress;
  Balance?: number;
  SyncToken: string;
  Active: boolean;
}

export interface QBOInvoice {
  Id: string;
  DocNumber?: string;
  CustomerRef: { value: string; name?: string };
  TxnDate: string;
  DueDate?: string;
  TotalAmt: number;
  Balance: number;
  Line: QBOInvoiceLine[];
  SyncToken: string;
  EmailStatus?: 'NotSet' | 'NeedToSend' | 'EmailSent';
}

export interface QBOInvoiceLine {
  Id?: string;
  LineNum?: number;
  Description?: string;
  Amount: number;
  DetailType: 'SalesItemLineDetail' | 'SubTotalLineDetail' | 'DiscountLineDetail';
  SalesItemLineDetail?: {
    ItemRef?: { value: string; name?: string };
    Qty?: number;
    UnitPrice?: number;
  };
}

export interface QBOPayment {
  Id: string;
  CustomerRef: { value: string; name?: string };
  TotalAmt: number;
  TxnDate: string;
  PaymentMethodRef?: { value: string; name?: string };
  DepositToAccountRef?: { value: string; name?: string };
  Line?: { LinkedTxn: { TxnId: string; TxnType: string }[] }[];
  SyncToken: string;
}

export interface QBOAddress {
  Line1?: string;
  Line2?: string;
  City?: string;
  CountrySubDivisionCode?: string;  // State
  PostalCode?: string;
  Country?: string;
}

export interface QBOAccount {
  Id: string;
  Name: string;
  AccountType: string;
  AccountSubType?: string;
  AcctNum?: string;
  Active: boolean;
  SyncToken: string;
}
