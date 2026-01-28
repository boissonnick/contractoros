import React from 'react';

// ============================================
// User & Organization Types
// ============================================

export type UserRole =
  | 'OWNER'      // Business owner
  | 'PM'         // Project manager
  | 'EMPLOYEE'   // W2 employee
  | 'CONTRACTOR' // 1099 contractor
  | 'SUB'        // Subcontractor
  | 'CLIENT';    // Homeowner/client

export type EmployeeType = 'site_manager' | 'hourly' | 'salaried';

export interface UserPermissions {
  projectIds: string[];           // Projects user has access to
  canCreateProjects?: boolean;
  canManageTeam?: boolean;
  canViewFinances?: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
  role: UserRole;
  employeeType?: EmployeeType;    // For EMPLOYEE role
  orgId: string;
  photoURL?: string;
  trade?: string;                 // For SUBs: electrician, plumber, etc.
  hourlyRate?: number;            // For billing/payroll
  permissions?: UserPermissions;
  isActive: boolean;
  onboardingCompleted: boolean;
  onboardingStep?: string;
  createdAt: Date;
  updatedAt?: Date;
  emergencyContact?: EmergencyContact;
  certifications?: Certification[];
  trades?: string[]; // multiple trades
  taxClassification?: 'W2' | '1099';
  address?: string;
  bio?: string;                   // User bio/description
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface Certification {
  name: string;
  issuingBody?: string;
  number?: string;
  expiryDate?: string; // ISO date string
  fileURL?: string;
}

export const CONSTRUCTION_TRADES = [
  'General Contractor',
  'Electrician',
  'Plumber',
  'HVAC',
  'Carpenter',
  'Mason',
  'Roofer',
  'Painter',
  'Flooring',
  'Drywall',
  'Landscaper',
  'Concrete',
  'Welding',
  'Insulation',
  'Demolition',
  'Excavation',
  'Other',
] as const;

export type ConstructionTrade = typeof CONSTRUCTION_TRADES[number];

export interface OrgBranding {
  logoURL?: string;
  primaryColor: string;     // hex e.g. "#2563eb"
  secondaryColor: string;   // hex
  accentColor: string;      // hex
}

export interface Organization {
  id: string;
  name: string;
  ownerUid: string;
  address?: string;
  phone?: string;
  email?: string;
  logoURL?: string;
  branding: OrgBranding;
  settings: OrgSettings;
  onboardingCompleted: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface OrgSettings {
  timezone: string;
  workdayStart: string;    // "08:00"
  workdayEnd: string;      // "17:00"
  overtimeThreshold: number; // hours per week
  requireGeoLocation: boolean;
}

// ============================================
// Project Types
// ============================================

export type ProjectStatus =
  | 'lead'        // Potential project
  | 'bidding'     // Awaiting bid acceptance
  | 'planning'    // Accepted, being planned
  | 'active'      // In progress
  | 'on_hold'     // Temporarily paused
  | 'completed'   // Finished
  | 'cancelled';  // Cancelled

export interface Project {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  status: ProjectStatus;
  clientId: string;         // Primary client
  pmId: string;             // Project manager
  startDate?: Date;
  estimatedEndDate?: Date;
  actualEndDate?: Date;
  budget?: number;
  currentSpend?: number;
  scope?: string;           // References template scopeType
  templateId?: string;      // PhaseTemplate used
  quoteTotal?: number;
  isDemoData?: boolean;
  // Sprint 4: Project Management Polish
  isArchived?: boolean;     // Soft archive (hides from default list)
  archivedAt?: Date;
  archivedBy?: string;      // User ID who archived
  tags?: string[];          // User-defined tags
  category?: ProjectCategory;
  sourceProjectId?: string; // If cloned, reference to original project
  createdAt: Date;
  updatedAt?: Date;
}

export type ProjectCategory =
  | 'residential'
  | 'commercial'
  | 'industrial'
  | 'renovation'
  | 'new_construction'
  | 'addition'
  | 'repair'
  | 'maintenance'
  | 'other';

// ============================================
// Project Activity Feed Types
// ============================================

export type ProjectActivityType =
  | 'project_created'
  | 'project_updated'
  | 'status_changed'
  | 'phase_started'
  | 'phase_completed'
  | 'task_created'
  | 'task_completed'
  | 'note_added'
  | 'document_uploaded'
  | 'photo_uploaded'
  | 'team_member_added'
  | 'team_member_removed'
  | 'budget_updated'
  | 'invoice_sent'
  | 'payment_received'
  | 'rfi_created'
  | 'rfi_answered'
  | 'submittal_created'
  | 'submittal_approved'
  | 'punch_item_created'
  | 'punch_item_completed';

export interface ProjectActivity {
  id: string;
  projectId: string;
  orgId: string;
  type: ProjectActivityType;
  title: string;
  description?: string;
  userId: string;
  userName: string;
  userPhotoUrl?: string;
  metadata?: Record<string, unknown>; // Extra data like old/new values, linked IDs
  createdAt: Date;
}

export interface ProjectNote {
  id: string;
  projectId: string;
  orgId: string;
  content: string;
  isPinned?: boolean;
  userId: string;
  userName: string;
  userPhotoUrl?: string;
  attachments?: {
    name: string;
    url: string;
    type: string;
    size: number;
  }[];
  createdAt: Date;
  updatedAt?: Date;
}

// ============================================
// Phase Template Types (org-level, customizable)
// ============================================

export interface PhaseTemplatePhase {
  name: string;
  order: number;
  defaultTasks?: string[];
}

export interface PhaseTemplate {
  id: string;
  orgId: string;
  name: string;            // e.g. "Single Room Remodel"
  scopeType: string;       // e.g. "single_room" — not a fixed union, owner can create new ones
  phases: PhaseTemplatePhase[];
  isDefault: boolean;      // true for system-seeded templates
  createdAt: Date;
  updatedAt?: Date;
}

// ============================================
// Project Phase Types (per-project, copied from template)
// ============================================

export type PhaseStatus = 'upcoming' | 'active' | 'completed' | 'skipped';

export interface PhaseMilestone {
  id: string;
  title: string;
  date: Date;
  completed: boolean;
  completedAt?: Date;
}

export interface PhaseDocument {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface ProjectPhase {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  order: number;
  status: PhaseStatus;
  startDate?: Date;
  endDate?: Date;
  estimatedDuration?: number; // days
  budgetAmount?: number;
  actualCost?: number;
  assignedTeamMembers: string[]; // user UIDs
  assignedSubcontractors: string[]; // sub IDs
  progressPercent: number;
  tasksTotal: number;
  tasksCompleted: number;
  dependencies: string[]; // phase IDs
  documents: PhaseDocument[];
  milestones: PhaseMilestone[];
  createdAt: Date;
  updatedAt?: Date;
}

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
// Client Preferences Types
// ============================================

export interface FinishPreferences {
  flooring?: string;
  countertops?: string;
  cabinetry?: string;
  fixtures?: string;
  paint?: string;
}

export interface InspirationImage {
  url: string;
  uploadedAt: Date;
}

export interface ClientPreferences {
  notes?: string;
  finishes?: FinishPreferences;
  inspirationImageUrls?: string[];  // legacy: URL-pasted images
  inspirationImages?: InspirationImage[]; // uploaded images with metadata
  budgetRange?: string;
  timelinePreference?: string;
}

export interface ClientOnboardingToken {
  id: string;
  token: string;
  projectId: string;
  clientId: string;
  orgId: string;
  createdAt: Date;
  expiresAt: Date;
  used: boolean;
}

// ============================================
// Task/Scope Types
// ============================================

export type TaskStatus =
  | 'pending'
  | 'assigned'
  | 'in_progress'
  | 'blocked'
  | 'review'
  | 'completed';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type DependencyType =
  | 'finish-to-start'
  | 'start-to-start'
  | 'finish-to-finish'
  | 'start-to-finish';

export interface TaskDependency {
  taskId: string;
  type: DependencyType;
  lag: number; // days (positive = delay, negative = lead)
}

export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  type: string;           // MIME type
  size: number;           // bytes
  uploadedBy: string;
  uploadedAt: Date;
}

// Sprint 5: Checklist item for tasks
export interface TaskChecklistItem {
  id: string;
  title: string;
  isCompleted: boolean;
  completedAt?: Date;
  completedBy?: string;
  order: number;
}

// Sprint 5: Recurring task configuration
export type RecurrenceFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';

export interface RecurrenceConfig {
  frequency: RecurrenceFrequency;
  interval: number;              // Every X days/weeks/months
  daysOfWeek?: number[];         // For weekly: 0=Sun, 1=Mon, etc
  dayOfMonth?: number;           // For monthly: 1-31
  endDate?: Date;                // When to stop recurring
  maxOccurrences?: number;       // Max number of recurrences
  lastGeneratedAt?: Date;        // Track when last task was created
}

export interface Task {
  id: string;
  orgId: string;
  projectId: string;
  phaseId?: string;            // Link task to a phase
  parentTaskId?: string;       // For subtasks

  // Basic info
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;

  // Assignment
  assignedTo: string[];        // User UIDs
  assignedSubId?: string;      // Subcontractor ID
  trade?: string;              // Required trade

  // Scheduling
  startDate?: Date;
  dueDate?: Date;
  duration?: number;           // days
  estimatedHours?: number;
  actualHours?: number;
  completedAt?: Date;

  // Dependencies
  dependencies: TaskDependency[];

  // Attachments
  attachments: TaskAttachment[];

  // Sprint 5: Checklist
  checklist?: TaskChecklistItem[];

  // Sprint 5: Recurring tasks
  isRecurring?: boolean;
  recurrenceConfig?: RecurrenceConfig;
  recurringParentId?: string;    // Links to the original recurring template
  recurrenceIndex?: number;      // Which occurrence this is (1, 2, 3...)

  // Sprint 5: Template reference
  templateId?: string;           // Task template this was created from

  // Display
  order: number;               // Sort order within phase/column

  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
}

// ============================================
// Task Template Types (for reusable task patterns by trade)
// ============================================

export interface TaskTemplate {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  trade?: string;              // Which trade this template is for
  category?: string;           // Grouping (e.g., "Framing", "Electrical Rough-In")

  // Default task properties
  defaultTitle: string;
  defaultDescription?: string;
  defaultPriority: TaskPriority;
  defaultEstimatedHours?: number;
  defaultChecklist?: TaskChecklistItem[];

  // Recurrence defaults
  isRecurring?: boolean;
  defaultRecurrenceConfig?: RecurrenceConfig;

  isDefault?: boolean;         // Built-in system template
  createdBy?: string;
  createdAt: Date;
  updatedAt?: Date;
}

// ============================================
// Task Comment Types (subcollection: tasks/{id}/comments)
// ============================================

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
}

// ============================================
// Task Activity Types (subcollection: tasks/{id}/activity)
// ============================================

export type TaskActivityAction =
  | 'created'
  | 'updated'
  | 'status_changed'
  | 'assigned'
  | 'unassigned'
  | 'commented'
  | 'attachment_added'
  | 'attachment_removed'
  | 'dependency_added'
  | 'dependency_removed'
  | 'completed';

export interface TaskActivity {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  action: TaskActivityAction;
  changes?: Record<string, { from: unknown; to: unknown }>;
  metadata?: Record<string, unknown>; // extra context (e.g. comment text, file name)
  createdAt: Date;
}

// ============================================
// Time Tracking Types
// ============================================

export interface TimeEntry {
  id: string;
  userId: string;
  projectId: string;
  taskId?: string;
  clockIn: Date;
  clockOut?: Date;
  breakMinutes?: number;
  totalMinutes?: number;
  location?: {
    lat: number;
    lng: number;
    accuracy: number;
  };
  notes?: string;
  status: 'active' | 'completed' | 'edited' | 'disputed';
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export interface WeeklyTimesheet {
  id: string;
  orgId: string;
  userId: string;
  userName?: string;
  weekStart: Date;
  entries: TimeEntry[];
  totalHours: number;
  overtimeHours: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submittedAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
}

export interface Geofence {
  id: string;
  projectId: string;
  orgId: string;
  name: string;
  center: { lat: number; lng: number };
  radiusMeters: number;
  isActive: boolean;
  createdAt: Date;
}

// ============================================
// Payroll Types
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

export interface PayrollEntry {
  userId: string;
  userName: string;
  regularHours: number;
  overtimeHours: number;
  hourlyRate: number;
  regularPay: number;
  overtimePay: number;
  totalPay: number;
}

export interface PayrollRun {
  id: string;
  orgId: string;
  periodStart: Date;
  periodEnd: Date;
  entries: PayrollEntry[];
  totalRegular: number;
  totalOvertime: number;
  totalPay: number;
  status: 'preview' | 'finalized';
  createdAt: Date;
}

// ============================================
// Availability & Scheduling Types
// ============================================

export interface Availability {
  id: string;
  userId: string;
  date: Date;
  isAvailable: boolean;
  startTime?: string;       // "08:00"
  endTime?: string;         // "17:00"
  notes?: string;
  createdAt: Date;
}

export interface AvailabilityDefault {
  id: string;
  userId: string;
  orgId: string;
  dayOfWeek: number; // 0=Sun, 1=Mon, ..., 6=Sat
  isAvailable: boolean;
  startTime: string; // "08:00"
  endTime: string;   // "17:00"
}

export interface ScheduleAssignment {
  id: string;
  userId: string;
  projectId: string;
  taskId?: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'no_show';
  createdAt: Date;
  userName?: string;
  projectName?: string;
  notes?: string;
  orgId?: string;
}

// ============================================
// Subcontractor Types
// ============================================

export interface SubcontractorDocument {
  id: string;
  type: 'license' | 'insurance' | 'w9' | 'contract' | 'other';
  name: string;
  url: string;
  expiresAt?: Date;
  uploadedAt: Date;
}

export interface SubcontractorMetrics {
  projectsCompleted: number;
  onTimeRate: number; // 0-100
  avgRating: number; // 0-5
  totalPaid: number;
}

export interface Subcontractor {
  id: string;
  orgId: string;
  userId?: string; // linked UserProfile if they have an account
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  trade: string;
  licenseNumber?: string;
  insuranceExpiry?: Date;
  address?: string;
  notes?: string;
  metrics: SubcontractorMetrics;
  documents: SubcontractorDocument[];
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

// ============================================
// Sub Assignment Types
// ============================================

export type SubAssignmentStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

export interface SubPaymentScheduleItem {
  id: string;
  description: string;
  amount: number;
  dueDate?: Date;
  paidAt?: Date;
  status: 'pending' | 'paid' | 'overdue';
}

export interface SubAssignment {
  id: string;
  subId: string;
  projectId: string;
  type: 'phase' | 'task';
  phaseId?: string;
  taskId?: string;
  bidId?: string;
  status: SubAssignmentStatus;
  agreedAmount: number;
  paidAmount: number;
  paymentSchedule: SubPaymentScheduleItem[];
  rating?: number; // 0-5
  ratingComment?: string;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

// ============================================
// Bid Types (for Subcontractors)
// ============================================

export type BidStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'accepted'
  | 'rejected'
  | 'withdrawn';

export interface Bid {
  id: string;
  projectId: string;
  phaseIds?: string[];        // Can bid on phases
  taskId?: string;            // Can bid on specific tasks
  quoteSectionIds?: string[]; // Linked quote sections
  subId: string;              // Subcontractor ID
  amount: number;
  laborCost?: number;
  materialCost?: number;
  proposedStartDate?: Date;
  proposedEndDate?: Date;
  timeline?: string;          // "2 weeks"
  description?: string;
  attachments?: string[];     // URLs
  status: BidStatus;
  submittedAt?: Date;
  expiresAt?: Date;
  respondedAt?: Date;
  respondedBy?: string;
  responseNotes?: string;
  createdAt: Date;
  updatedAt?: Date;
}

// ============================================
// Bid Solicitation Types
// ============================================

export type BidSolicitationStatus = 'open' | 'closed' | 'cancelled';

export interface BidSolicitation {
  id: string;
  projectId: string;
  orgId: string;
  title: string;
  description?: string;
  scopeItemIds: string[];
  phaseIds: string[];
  trade?: string;
  invitedSubIds: string[];
  deadline: Date;
  status: BidSolicitationStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
}

// ============================================
// Expense Types
// ============================================

export type ExpenseCategory =
  | 'materials'
  | 'tools'
  | 'equipment_rental'
  | 'permits'
  | 'travel'
  | 'meals'
  | 'other';

export type ExpenseStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'reimbursed';

export interface Expense {
  id: string;
  orgId: string;
  userId: string;
  projectId: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  vendor?: string;
  receiptURL?: string;
  date: Date;
  status: ExpenseStatus;
  submittedAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  reimbursedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
}

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
// Photo/Documentation Types
// ============================================

export type PhotoType =
  | 'progress'
  | 'before'
  | 'after'
  | 'issue'
  | 'receipt'
  | 'other';

export interface ProjectPhoto {
  id: string;
  projectId: string;
  taskId?: string;
  phaseId?: string;
  scopeItemId?: string;
  folderId?: string;
  userId: string;
  userName?: string;
  url: string;
  thumbnailUrl?: string;
  type: PhotoType;
  caption?: string;
  tags?: string[];
  approved?: boolean;
  location?: {
    lat: number;
    lng: number;
  };
  takenAt: Date;
  createdAt: Date;
}

export interface PhotoFolder {
  id: string;
  projectId: string;
  name: string;
  parentId?: string;
  order: number;
  createdAt: Date;
}

export interface PhotoComment {
  id: string;
  photoId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Date;
}

// ============================================
// Issue/Blocker Types
// ============================================

export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface Issue {
  id: string;
  projectId: string;
  taskId?: string;
  reportedBy: string;
  title: string;
  description: string;
  severity: IssueSeverity;
  status: IssueStatus;
  assignedTo?: string;
  photoIds?: string[];
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

// ============================================
// Invoice Types
// ============================================

// NOTE: Invoice types moved to dedicated section below (after Estimate types)

// ============================================
// Daily Log Types
// ============================================

export interface DailyLog {
  id: string;
  projectId: string;
  orgId: string;
  date: Date;
  weather?: {
    condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy';
    temperature?: number;
  };
  workersOnSite: number;
  workPerformed: string;
  materials?: string;
  equipment?: string;
  delays?: string;
  safetyNotes?: string;
  notes?: string;
  photos?: string[];       // Photo IDs or URLs
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
}

// ============================================
// Navigation Types
// ============================================

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];       // Which roles can see this
  badge?: number;           // Notification count
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================
// Dashboard/Stats Types
// ============================================

export interface DashboardStats {
  activeProjects: number;
  pendingTasks: number;
  todayTimeEntries: number;
  pendingExpenses: number;
  pendingBids: number;
  openIssues: number;
  unpaidInvoices: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'project' | 'task' | 'time' | 'expense' | 'bid' | 'issue' | 'invoice' | 'photo';
  action: string;
  userId: string;
  userName: string;
  entityId: string;
  entityName: string;
  projectId?: string;
  projectName?: string;
  timestamp: Date;
}

// ============================================
// Scope of Work (SOW) Types
// ============================================

export type ScopeStatus = 'draft' | 'pending_approval' | 'approved' | 'superseded';

export interface ScopeMaterial {
  name: string;
  quantity?: number;
  unit?: string;
  estimatedCost?: number;
}

export interface ScopeItem {
  id: string;
  phaseId?: string;
  title: string;
  description?: string;
  specifications?: string;
  materials: ScopeMaterial[];
  laborDescription?: string;
  estimatedHours?: number;
  estimatedCost?: number;
  quoteSectionId?: string; // link to QuoteSection
  order: number;
}

export interface ScopeApproval {
  clientId: string;
  clientName: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  decidedAt?: Date;
}

export interface Scope {
  id: string;
  projectId: string;
  orgId: string;
  version: number;
  status: ScopeStatus;
  items: ScopeItem[];
  approvals: ScopeApproval[];
  previousVersionId?: string;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface SowTemplate {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  items: Omit<ScopeItem, 'id'>[];
  createdAt: Date;
  updatedAt?: Date;
}

// ============================================
// Change Order Types
// ============================================

export type ChangeOrderStatus =
  | 'draft'
  | 'pending_pm'
  | 'pending_owner'
  | 'pending_client'
  | 'approved'
  | 'rejected';

export type ScopeChangeType = 'add' | 'remove' | 'modify';

export interface ScopeChange {
  id: string;
  type: ScopeChangeType;
  phaseId?: string;
  originalDescription?: string;
  proposedDescription: string;
  costImpact: number; // positive = increase, negative = decrease
}

export interface ChangeOrderImpact {
  costChange: number;
  scheduleChange: number; // days
  affectedPhaseIds: string[];
  affectedTaskIds: string[];
}

export interface ChangeOrderApproval {
  role: 'pm' | 'owner' | 'client';
  userId: string;
  userName: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  decidedAt?: Date;
}

export interface ChangeOrderHistoryEntry {
  id: string;
  action: string;
  userId: string;
  userName: string;
  details?: string;
  timestamp: Date;
}

export interface ChangeOrder {
  id: string;
  projectId: string;
  orgId: string;
  number: string; // CO-001, CO-002, etc.
  title: string;
  description: string;
  reason: string;
  scopeChanges: ScopeChange[];
  impact: ChangeOrderImpact;
  photos: string[]; // URLs
  documents: string[]; // URLs
  status: ChangeOrderStatus;
  approvals: ChangeOrderApproval[];
  history: ChangeOrderHistoryEntry[];
  newScopeVersionId?: string; // created after approval
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
}

// ============================================
// RFI (Request for Information) Types
// ============================================

export type RFIStatus = 'draft' | 'open' | 'pending_response' | 'answered' | 'closed';
export type RFIPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface RFI {
  id: string;
  projectId: string;
  orgId: string;
  number: string; // RFI-001, RFI-002, etc.
  subject: string;
  question: string;
  answer?: string;
  officialResponse?: string;
  status: RFIStatus;
  priority: RFIPriority;

  // References
  drawingRef?: string;
  specSection?: string;
  location?: string;

  // Routing
  assignedTo?: string; // User ID responsible for answering
  assignedToName?: string;
  submittedBy: string;
  submittedByName: string;
  createdBy?: string;
  createdByName?: string;
  answeredBy?: string;
  answeredByName?: string;

  // Dates
  dueDate?: Date;
  submittedAt: Date;
  answeredAt?: Date;
  respondedAt?: Date;
  closedAt?: Date;

  // Attachments & Responses
  attachments: RFIAttachment[];
  responses?: RFIResponse[];

  // Impact
  costImpact?: number;
  scheduleImpact?: number; // days

  // History
  history: RFIHistoryEntry[];

  createdAt: Date;
  updatedAt?: Date;
}

export interface RFIResponse {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
  isOfficial?: boolean;
  attachments?: RFIAttachment[];
}

export interface RFIAttachment {
  id?: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedBy?: string;
  uploadedAt?: Date;
}

export interface RFIHistoryEntry {
  id: string;
  action: 'created' | 'submitted' | 'assigned' | 'answered' | 'closed' | 'reopened' | 'comment';
  userId: string;
  userName: string;
  details?: string;
  timestamp: Date;
}

// ============================================
// Submittal Types
// ============================================

export type SubmittalStatus = 'draft' | 'pending_review' | 'approved' | 'approved_as_noted' | 'revise_resubmit' | 'rejected';
export type SubmittalType = 'shop_drawing' | 'product_data' | 'sample' | 'mock_up' | 'certificate' | 'test_report' | 'other';
export type SubmittalPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Submittal {
  id: string;
  projectId: string;
  orgId?: string;
  number: string; // SUB-001, SUB-002, etc.
  title: string;
  description?: string;
  type?: SubmittalType;
  status: SubmittalStatus;
  priority: SubmittalPriority;

  // Spec reference
  specSection?: string;
  specDescription?: string;

  // Routing
  submittedBy: string;
  submittedByName: string;
  assignedTo?: string;
  assignedToName?: string;
  subcontractorId?: string;
  subcontractorName?: string;
  reviewerId?: string;
  reviewerName?: string;

  // Documents & Attachments
  documents?: SubmittalDocument[];
  attachments?: SubmittalAttachment[];

  // Review
  reviewComments?: string;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewedByName?: string;

  // Dates
  dueDate?: Date;
  submittedAt?: Date;
  requiredBy?: Date;

  // Revisions
  revisionNumber: number;
  previousVersionId?: string;

  // History
  history?: SubmittalHistoryEntry[];

  createdAt: Date;
  updatedAt?: Date;
}

export interface SubmittalAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface SubmittalDocument {
  id: string;
  name: string;
  url: string;
  revision: number;
  uploadedBy: string;
  uploadedAt: Date;
  reviewStatus?: 'pending' | 'approved' | 'rejected';
  reviewNotes?: string;
}

export interface SubmittalHistoryEntry {
  id: string;
  action: 'created' | 'submitted' | 'review_started' | 'approved' | 'rejected' | 'resubmitted' | 'comment';
  userId: string;
  userName: string;
  details?: string;
  timestamp: Date;
}

// ============================================
// Punch List Types
// ============================================

export type PunchItemStatus = 'open' | 'in_progress' | 'ready_for_review' | 'approved' | 'rejected';
export type PunchItemPriority = 'low' | 'medium' | 'high' | 'critical';

export interface PunchList {
  id: string;
  projectId: string;
  orgId: string;
  name: string;
  description?: string;
  status: 'active' | 'completed';
  createdBy: string;
  createdByName: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export interface PunchItem {
  id: string;
  punchListId?: string;
  projectId: string;
  orgId: string;
  number: string; // PI-001, PI-002, etc.
  title: string;
  description?: string;
  status: PunchItemStatus;
  priority: PunchItemPriority;

  // Location
  location?: string;
  room?: string;
  drawingRef?: string;
  drawingCoordinates?: { x: number; y: number };

  // Trade/Category
  trade?: string;

  // Assignment
  assignedTo?: string;
  assignedToName?: string;
  assignedToCompany?: string; // subcontractor name

  // Responsibility
  responsibleParty?: 'contractor' | 'subcontractor' | 'vendor' | 'other';
  subcontractorId?: string;

  // Photos
  photos?: PunchItemPhoto[];

  // Cost tracking
  backChargeAmount?: number;
  backChargeApproved?: boolean;

  // Dates
  dueDate?: Date;
  completedAt?: Date;
  completedBy?: string;
  completedByName?: string;
  verifiedAt?: Date;

  // History
  history?: PunchItemHistoryEntry[];

  createdBy: string;
  createdByName?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface PunchItemPhoto {
  id: string;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  type: 'issue' | 'completed';
  uploadedBy: string;
  uploadedAt: Date;
}

export interface PunchItemHistoryEntry {
  id: string;
  action: 'created' | 'assigned' | 'status_changed' | 'photo_added' | 'completed' | 'verified' | 'rejected' | 'comment';
  userId: string;
  userName: string;
  previousStatus?: PunchItemStatus;
  newStatus?: PunchItemStatus;
  details?: string;
  timestamp: Date;
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
// Selections Management Types (Sprint 12)
// ============================================

export type SelectionStatus = 'pending' | 'selected' | 'approved' | 'ordered' | 'installed';

export interface SelectionCategory {
  id: string;
  orgId: string;
  projectId: string;
  name: string;
  description?: string;
  room?: string;
  budgetAmount: number;
  order: number;
  createdAt: Date;
  updatedAt?: Date;
}

export interface SelectionOption {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  imageURL?: string;
  supplierName?: string;
  supplierURL?: string;
  sku?: string;
  price: number;
  leadTimeDays?: number;
  isRecommended: boolean;
  order: number;
}

export interface Selection {
  id: string;
  orgId: string;
  projectId: string;
  categoryId: string;
  categoryName: string;
  status: SelectionStatus;
  selectedOptionId?: string;
  selectedOptionName?: string;
  selectedPrice?: number;
  budgetAmount: number;
  budgetVariance: number;
  options: SelectionOption[];
  room?: string;
  notes?: string;
  clientNote?: string;
  selectedBy?: string;
  selectedByName?: string;
  selectedAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  orderedAt?: Date;
  installedAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
}

// ============================================
// Warranty & Client Experience Types (Sprint 12)
// ============================================

export type WarrantyStatus = 'active' | 'expiring_soon' | 'expired' | 'claimed';

export interface WarrantyItem {
  id: string;
  orgId: string;
  projectId: string;
  itemName: string;
  manufacturer?: string;
  warrantyProvider?: string;
  startDate: Date;
  endDate: Date;
  coverageDescription?: string;
  documentURL?: string;
  status: WarrantyStatus;
  claimHistory: WarrantyClaim[];
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface WarrantyClaim {
  id: string;
  date: Date;
  description: string;
  resolution?: string;
  resolvedAt?: Date;
}

export interface ClientSurvey {
  id: string;
  orgId: string;
  projectId: string;
  clientId: string;
  clientName: string;
  overallRating: number;
  communicationRating: number;
  qualityRating: number;
  timelinessRating: number;
  comments?: string;
  wouldRecommend: boolean;
  submittedAt: Date;
}

// ============================================
// Messaging & Notifications Types (Sprint 13)
// ============================================

export type MessageChannelType = 'project' | 'direct';

export interface MessageChannel {
  id: string;
  orgId: string;
  type: MessageChannelType;
  name: string;
  projectId?: string;
  participantIds: string[];
  lastMessageAt?: Date;
  lastMessageText?: string;
  lastMessageBy?: string;
  createdBy: string;
  createdAt: Date;
}

export interface Message {
  id: string;
  channelId: string;
  orgId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  mentions: string[];
  attachmentURL?: string;
  attachmentName?: string;
  isEdited: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export type NotificationType =
  | 'task_assigned'
  | 'task_completed'
  | 'task_due_soon'
  | 'rfi_created'
  | 'rfi_responded'
  | 'submittal_review'
  | 'punch_item_assigned'
  | 'invoice_paid'
  | 'invoice_overdue'
  | 'expense_approved'
  | 'expense_rejected'
  | 'change_order_pending'
  | 'selection_pending'
  | 'selection_made'
  | 'message_received'
  | 'mention'
  | 'general';

export interface AppNotification {
  id: string;
  orgId: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  projectId?: string;
  isRead: boolean;
  createdAt: Date;
}

export interface NotificationPreferences {
  id: string;
  userId: string;
  orgId: string;
  email: {
    enabled: boolean;
    taskAssigned: boolean;
    taskDueSoon: boolean;
    invoicePaid: boolean;
    invoiceOverdue: boolean;
    rfiCreated: boolean;
    expenseApproved: boolean;
    messages: boolean;
    mentions: boolean;
    dailyDigest: boolean;
  };
  push: {
    enabled: boolean;
    taskAssigned: boolean;
    taskDueSoon: boolean;
    invoicePaid: boolean;
    messages: boolean;
    mentions: boolean;
  };
}

// ============================================
// Safety & Compliance Types (Sprint 15)
// ============================================

export type SafetyInspectionStatus = 'scheduled' | 'in_progress' | 'passed' | 'failed' | 'needs_followup';

export interface SafetyChecklistItem {
  id: string;
  label: string;
  category: string;
  passed: boolean | null;
  notes?: string;
}

export interface SafetyInspection {
  id: string;
  orgId: string;
  projectId: string;
  projectName?: string;
  inspectorId: string;
  inspectorName: string;
  type: 'daily' | 'weekly' | 'monthly' | 'osha' | 'custom';
  status: SafetyInspectionStatus;
  scheduledDate: Date;
  completedDate?: Date;
  checklist: SafetyChecklistItem[];
  overallNotes?: string;
  photos: string[];
  issuesFound: number;
  createdAt: Date;
  updatedAt?: Date;
}

export type IncidentSeverity = 'near_miss' | 'first_aid' | 'medical' | 'lost_time' | 'fatality';

export interface SafetyIncident {
  id: string;
  orgId: string;
  projectId: string;
  projectName?: string;
  reportedBy: string;
  reportedByName: string;
  severity: IncidentSeverity;
  date: Date;
  time?: string;
  location: string;
  description: string;
  injuredWorkers: string[];
  witnesses: string[];
  rootCause?: string;
  correctiveActions?: string;
  photos: string[];
  isOshaReportable: boolean;
  oshaReportedAt?: Date;
  status: 'reported' | 'investigating' | 'resolved' | 'closed';
  createdAt: Date;
  updatedAt?: Date;
}

export interface ToolboxTalk {
  id: string;
  orgId: string;
  projectId?: string;
  projectName?: string;
  conductedBy: string;
  conductedByName: string;
  date: Date;
  topic: string;
  content: string;
  attendees: { userId: string; name: string; signature?: string }[];
  duration: number;
  createdAt: Date;
}

// ============================================
// Tools & Equipment Types (Sprint 16)
// ============================================

export type ToolStatus = 'available' | 'checked_out' | 'maintenance' | 'retired';

export interface Tool {
  id: string;
  orgId: string;
  name: string;
  serialNumber?: string;
  barcode?: string;
  category: string;
  purchaseDate?: Date;
  purchaseCost?: number;
  currentValue?: number;
  status: ToolStatus;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  assignedTo?: string;
  assignedToName?: string;
  assignedProjectId?: string;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  notes?: string;
  imageURL?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ToolCheckout {
  id: string;
  toolId: string;
  orgId: string;
  userId: string;
  userName: string;
  projectId?: string;
  projectName?: string;
  checkedOutAt: Date;
  expectedReturnDate?: Date;
  returnedAt?: Date;
  conditionOnReturn?: string;
  notes?: string;
}

// ============================================
// Tax & Compliance Types (Sprint 17)
// ============================================

export type W9Status = 'pending' | 'received' | 'verified' | 'expired';

export interface SubcontractorW9 {
  id: string;
  orgId: string;
  subcontractorId: string;
  subcontractorName: string;
  businessName?: string;
  tin: string;
  tinType: 'ssn' | 'ein';
  address: string;
  status: W9Status;
  receivedDate?: Date;
  verifiedDate?: Date;
  expirationDate?: Date;
  documentURL?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface PaymentTo1099 {
  subcontractorId: string;
  subcontractorName: string;
  tin: string;
  totalPaid: number;
  requiresForm: boolean;
}

// ============================================
// CRM & Lead Types (Sprint 19)
// ============================================

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal_sent' | 'won' | 'lost';

export interface Lead {
  id: string;
  orgId: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  source: 'website' | 'referral' | 'advertising' | 'social' | 'other';
  status: LeadStatus;
  projectType?: string;
  estimatedValue?: number;
  notes?: string;
  assignedTo?: string;
  assignedToName?: string;
  lastContactDate?: Date;
  nextFollowUpDate?: Date;
  lostReason?: string;
  convertedProjectId?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export type ServiceTicketStatus = 'open' | 'scheduled' | 'in_progress' | 'completed' | 'closed';

export interface ServiceTicket {
  id: string;
  orgId: string;
  clientId: string;
  clientName: string;
  projectId?: string;
  projectName?: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: ServiceTicketStatus;
  assignedTo?: string;
  assignedToName?: string;
  scheduledDate?: Date;
  completedDate?: Date;
  resolution?: string;
  createdAt: Date;
  updatedAt?: Date;
}
