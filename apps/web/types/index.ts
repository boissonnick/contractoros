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
  albumId?: string;
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
    address?: string;
  };
  // Before/after pairing
  pairedPhotoId?: string;
  pairType?: 'before' | 'after';
  // Annotations
  annotations?: PhotoAnnotation[];
  // Metadata
  metadata?: {
    width?: number;
    height?: number;
    fileSize?: number;
    mimeType?: string;
    deviceModel?: string;
    originalFilename?: string;
  };
  // Sharing
  isPublic?: boolean;
  shareToken?: string;
  // Offline sync
  syncStatus?: 'pending' | 'synced' | 'failed';
  localPath?: string;
  takenAt: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export interface PhotoAnnotation {
  id: string;
  type: 'arrow' | 'circle' | 'rectangle' | 'text' | 'freehand';
  color: string;
  // Position as percentage (0-100) for responsive scaling
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  points?: { x: number; y: number }[]; // For freehand
  createdBy: string;
  createdAt: Date;
}

export interface PhotoAlbum {
  id: string;
  projectId: string;
  orgId: string;
  name: string;
  description?: string;
  coverPhotoId?: string;
  coverPhotoUrl?: string;
  phaseId?: string;
  photoCount: number;
  // Sharing
  isPublic: boolean;
  shareToken?: string;
  shareExpiresAt?: Date;
  // Client access
  clientAccessEnabled: boolean;
  clientAccessEmails?: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface BeforeAfterPair {
  id: string;
  projectId: string;
  beforePhotoId: string;
  afterPhotoId: string;
  title?: string;
  description?: string;
  location?: string;
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

export type ScopeStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'superseded';

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
  submittedAt?: Date | { toDate: () => Date };
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

// ============================================
// Client Management Types (FEAT-L4)
// ============================================

export type ClientStatus = 'active' | 'past' | 'potential' | 'inactive';

export type ClientSource =
  | 'referral'
  | 'google'
  | 'social_media'
  | 'yard_sign'
  | 'vehicle_wrap'
  | 'website'
  | 'repeat'
  | 'other';

export type ClientCommunicationPreference = 'email' | 'phone' | 'text' | 'any';

export interface ClientContact {
  id: string;
  type: 'primary' | 'secondary' | 'emergency';
  name: string;
  email?: string;
  phone?: string;
  relationship?: string; // e.g., "Spouse", "Property Manager", "Assistant"
}

export interface ClientAddress {
  id: string;
  type: 'billing' | 'property' | 'mailing';
  label?: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  isDefault?: boolean;
}

export interface ClientNote {
  id: string;
  content: string;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  isPinned?: boolean;
}

export interface ClientFinancials {
  lifetimeValue: number;
  totalProjects: number;
  completedProjects: number;
  activeProjects: number;
  outstandingBalance: number;
  lastPaymentDate?: Date;
  lastPaymentAmount?: number;
  averageProjectValue: number;
}

export interface Client {
  id: string;
  orgId: string;
  userId?: string;              // Linked UserProfile if they have an account

  // Basic info
  firstName: string;
  lastName: string;
  displayName: string;          // Computed: firstName + lastName or company name
  companyName?: string;         // For commercial clients
  isCommercial: boolean;

  // Contact info
  email: string;
  phone?: string;
  preferredCommunication: ClientCommunicationPreference;
  contacts: ClientContact[];    // Additional contacts
  addresses: ClientAddress[];   // Multiple addresses

  // Status & tracking
  status: ClientStatus;
  source: ClientSource;
  sourceDetails?: string;       // e.g., "Referred by John Smith"
  referredBy?: string;          // Client ID if referred by another client

  // Preferences
  preferences?: ClientPreferences;
  notes: ClientNote[];
  tags?: string[];

  // Financials (computed/cached)
  financials: ClientFinancials;

  // Project references
  projectIds: string[];

  // Dates
  firstContactDate?: Date;
  lastContactDate?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ClientCommunicationLog {
  id: string;
  clientId: string;
  orgId: string;
  type: 'email' | 'phone' | 'text' | 'meeting' | 'site_visit' | 'note';
  subject?: string;
  content: string;
  direction: 'inbound' | 'outbound';
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  projectId?: string;           // If related to a specific project
}

// ============================================
// Payment Processing Types (Stripe)
// ============================================

export type PaymentMethod = 'card' | 'ach';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'partially_refunded' | 'cancelled';
export type SplitPaymentType = 'deposit' | 'milestone' | 'final';

export interface StripePayment {
  id: string;
  orgId: string;
  invoiceId: string;
  projectId: string;
  clientId: string;

  // Payment Details
  amount: number; // in cents
  currency: 'USD';
  paymentMethod: PaymentMethod;

  // Stripe Integration
  stripePaymentIntentId: string;
  stripeCustomerId?: string;
  stripeChargeId?: string;

  // Status
  status: PaymentStatus;
  failureReason?: string;
  failureCode?: string;

  // Metadata
  description: string;
  reference?: string; // e.g., invoice number

  // Dates
  createdAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  refundedAt?: Date;

  // Refund Info
  refundId?: string;
  refundAmount?: number; // in cents
  refundReason?: string;

  // Split Payment
  isSplitPayment?: boolean;
  splitType?: SplitPaymentType;
  parentPaymentId?: string;

  // Receipt
  receiptUrl?: string;
  receiptSentAt?: Date;

  // Audit
  createdBy?: string;
  metadata?: Record<string, string>;
}

export interface SavedPaymentMethod {
  id: string;
  orgId: string;
  clientId: string;

  // Stripe Integration
  stripePaymentMethodId: string;
  stripeCustomerId: string;

  type: PaymentMethod;

  // Card details (masked for display)
  last4?: string;
  brand?: string; // visa, mastercard, amex, discover
  expMonth?: number;
  expYear?: number;

  // ACH details (masked for display)
  accountLast4?: string;
  bankName?: string;
  accountType?: 'checking' | 'savings';

  // Settings
  isDefault: boolean;
  nickname?: string;

  // Dates
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export interface PaymentLink {
  id: string;
  orgId: string;
  invoiceId: string;
  projectId: string;
  clientId: string;

  // Link Details
  token: string; // unique token for magic link
  amount: number; // in cents
  currency: 'USD';

  // Status
  status: 'active' | 'used' | 'expired' | 'cancelled';
  paymentId?: string; // set when payment is completed

  // Expiration
  expiresAt: Date;

  // Dates
  createdAt: Date;
  usedAt?: Date;
}

export interface PaymentReminder {
  id: string;
  orgId: string;
  invoiceId: string;
  clientId: string;

  // Reminder Details
  type: 'email' | 'sms';
  scheduledAt: Date;
  sentAt?: Date;

  // Status
  status: 'scheduled' | 'sent' | 'failed' | 'cancelled';
  failureReason?: string;

  // Content
  subject?: string;
  message?: string;

  // Tracking
  reminderNumber: number; // 1st, 2nd, 3rd reminder
  isEscalation: boolean;
}

export interface PaymentSchedule {
  id: string;
  orgId: string;
  projectId: string;
  invoiceId?: string;

  // Schedule Details
  name: string;
  description?: string;
  totalAmount: number; // in cents

  // Milestones
  milestones: PaymentMilestone[];

  // Status
  status: 'draft' | 'active' | 'completed' | 'cancelled';

  // Dates
  createdAt: Date;
  updatedAt?: Date;
}

export interface PaymentMilestone {
  id: string;
  name: string;
  description?: string;
  amount: number; // in cents
  percentage?: number; // percentage of total (0-100)
  dueDate?: Date;
  status: 'pending' | 'due' | 'paid' | 'overdue';
  paymentId?: string;
  paidAt?: Date;
}

export interface StripeConnectAccount {
  id: string;
  orgId: string;
  stripeAccountId: string;
  status: 'pending' | 'active' | 'restricted' | 'disabled';
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  requirements?: {
    currentlyDue: string[];
    eventuallyDue: string[];
    pastDue: string[];
  };
  createdAt: Date;
  updatedAt?: Date;
}

// ============================================
// SMS/Text Workflows Types (Twilio)
// ============================================

export type SmsStatus = 'queued' | 'sent' | 'delivered' | 'failed' | 'undelivered';
export type SmsDirection = 'outbound' | 'inbound';
export type SmsTemplateType =
  | 'payment_reminder'
  | 'payment_received'
  | 'schedule_update'
  | 'project_update'
  | 'invoice_sent'
  | 'document_ready'
  | 'task_assigned'
  | 'custom';

export interface SmsMessage {
  id: string;
  orgId: string;

  // Message Details
  to: string; // E.164 format (+1XXXXXXXXXX)
  from: string; // Twilio phone number
  body: string;
  direction: SmsDirection;

  // Twilio Integration
  twilioMessageSid?: string;
  twilioAccountSid?: string;

  // Status
  status: SmsStatus;
  errorCode?: string;
  errorMessage?: string;

  // Pricing
  price?: string;
  priceUnit?: string;

  // Context
  recipientId?: string; // User, client, or subcontractor ID
  recipientType?: 'user' | 'client' | 'subcontractor';
  recipientName?: string;

  // Related entities
  projectId?: string;
  invoiceId?: string;
  taskId?: string;

  // Template info
  templateId?: string;
  templateType?: SmsTemplateType;
  templateVariables?: Record<string, string>;

  // Dates
  createdAt: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  updatedAt?: Date;

  // Metadata
  createdBy?: string;
  metadata?: Record<string, string>;
}

export interface SmsTemplate {
  id: string;
  orgId: string;

  // Template Details
  name: string;
  description?: string;
  type: SmsTemplateType;
  body: string; // Template body with {{variable}} placeholders

  // Variables
  variables: SmsTemplateVariable[];

  // Settings
  isActive: boolean;
  isDefault: boolean;

  // Dates
  createdAt: Date;
  updatedAt?: Date;
  createdBy: string;
}

export interface SmsTemplateVariable {
  name: string;
  description: string;
  required: boolean;
  defaultValue?: string;
}

export interface SmsConversation {
  id: string;
  orgId: string;

  // Participant
  phoneNumber: string; // E.164 format
  participantId?: string;
  participantType?: 'user' | 'client' | 'subcontractor';
  participantName?: string;

  // Conversation state
  lastMessageAt: Date;
  lastMessagePreview: string;
  lastMessageDirection: SmsDirection;
  unreadCount: number;

  // Context
  projectId?: string;

  // Dates
  createdAt: Date;
  updatedAt?: Date;
}

export interface SmsBroadcast {
  id: string;
  orgId: string;

  // Broadcast Details
  name: string;
  message: string;

  // Recipients
  recipients: SmsBroadcastRecipient[];
  totalRecipients: number;

  // Status
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'cancelled';
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;

  // Statistics
  sentCount: number;
  deliveredCount: number;
  failedCount: number;

  // Related entities
  projectId?: string;

  // Dates
  createdAt: Date;
  updatedAt?: Date;
  createdBy: string;
}

export interface SmsBroadcastRecipient {
  phoneNumber: string;
  name?: string;
  recipientId?: string;
  recipientType?: 'user' | 'client' | 'subcontractor';
  status: SmsStatus;
  messageSid?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  errorCode?: string;
  errorMessage?: string;
}

export interface TwilioPhoneNumber {
  id: string;
  orgId: string;

  // Phone number details
  phoneNumber: string; // E.164 format
  friendlyName?: string;

  // Twilio details
  twilioPhoneNumberSid: string;

  // Capabilities
  smsEnabled: boolean;
  voiceEnabled: boolean;
  mmsEnabled: boolean;

  // Settings
  isDefault: boolean;
  isActive: boolean;

  // Dates
  createdAt: Date;
  updatedAt?: Date;
}

export interface SmsAutomation {
  id: string;
  orgId: string;

  // Automation Details
  name: string;
  description?: string;

  // Trigger
  trigger: SmsAutomationTrigger;

  // Action
  templateId: string;

  // Settings
  isActive: boolean;
  delay?: number; // Delay in minutes before sending

  // Filters
  filters?: {
    projectStatus?: string[];
    clientTags?: string[];
    invoiceStatus?: string[];
  };

  // Statistics
  sentCount: number;
  lastTriggeredAt?: Date;

  // Dates
  createdAt: Date;
  updatedAt?: Date;
  createdBy: string;
}

export type SmsAutomationTrigger =
  | 'invoice_created'
  | 'invoice_overdue'
  | 'payment_received'
  | 'project_started'
  | 'project_completed'
  | 'schedule_changed'
  | 'task_assigned'
  | 'document_uploaded';

// =============================================================================
// ESTIMATE LINE ITEM LIBRARY
// =============================================================================

/**
 * Trade categories for line items
 */
export type LineItemTrade =
  | 'general'
  | 'demolition'
  | 'framing'
  | 'roofing'
  | 'siding'
  | 'windows_doors'
  | 'plumbing'
  | 'electrical'
  | 'hvac'
  | 'insulation'
  | 'drywall'
  | 'painting'
  | 'flooring'
  | 'cabinets'
  | 'countertops'
  | 'tile'
  | 'fixtures'
  | 'landscaping'
  | 'concrete'
  | 'masonry'
  | 'custom';

/**
 * Unit types for line items
 */
export type LineItemUnit =
  | 'each'
  | 'sqft'
  | 'lnft'
  | 'sqyd'
  | 'cuft'
  | 'cuyd'
  | 'hour'
  | 'day'
  | 'week'
  | 'lump'
  | 'gallon'
  | 'pound'
  | 'ton'
  | 'bundle'
  | 'box'
  | 'roll'
  | 'sheet'
  | 'pallet';

/**
 * A saved line item in the library
 */
export interface LineItem {
  id: string;
  orgId: string;

  // Basic info
  name: string;
  description?: string;
  trade: LineItemTrade;
  category?: string; // Custom sub-category within trade

  // Pricing
  unit: LineItemUnit;
  materialCost: number; // Per unit
  laborCost: number; // Per unit
  unitPrice: number; // Total per unit (material + labor + markup)
  defaultMarkup: number; // Percentage (e.g., 20 for 20%)

  // Tracking
  sku?: string; // Internal SKU or part number
  supplier?: string;
  supplierSku?: string;

  // Metadata
  tags?: string[];
  isActive: boolean;
  isFavorite: boolean;
  usageCount: number;
  lastUsedAt?: Date;

  // Dates
  createdAt: Date;
  updatedAt?: Date;
  createdBy: string;
}

/**
 * A line item as used on the quick estimate builder
 * This is separate from the existing EstimateLineItem which has different fields
 */
export interface BuilderLineItem {
  id: string;
  lineItemId?: string; // Reference to library item if from library

  // Basic info
  name: string;
  description?: string;
  trade?: LineItemTrade;

  // Quantity and pricing
  quantity: number;
  unit: LineItemUnit;
  materialCost: number; // Per unit
  laborCost: number; // Per unit
  unitPrice: number; // Total per unit
  subtotal: number; // quantity * unitPrice

  // Markup (can be adjusted per line)
  markupPercent: number;
  markupAmount: number;

  // Tax
  taxable: boolean;
  taxAmount?: number;

  // Total
  total: number; // subtotal + markup + tax

  // Phase/section grouping
  phaseId?: string;
  sectionId?: string;
  sortOrder: number;

  // Optional
  notes?: string;
}

/**
 * Estimate template for quick creation
 */
export interface EstimateTemplate {
  id: string;
  orgId: string;

  // Basic info
  name: string;
  description?: string;
  trade?: LineItemTrade;
  projectType?: string; // e.g., 'Kitchen Remodel', 'Bathroom Addition'

  // Line items
  lineItems: BuilderTemplateItem[];

  // Settings
  defaultMarkup: number;
  includeTax: boolean;
  defaultTaxRate?: number;
  terms?: string;
  notes?: string;

  // Metadata
  isActive: boolean;
  usageCount: number;
  lastUsedAt?: Date;

  // Dates
  createdAt: Date;
  updatedAt?: Date;
  createdBy: string;
}

/**
 * A line item within an estimate template (for the builder)
 */
export interface BuilderTemplateItem {
  lineItemId?: string; // Reference to library item
  name: string;
  description?: string;
  trade?: LineItemTrade;
  unit: LineItemUnit;
  materialCost: number;
  laborCost: number;
  unitPrice: number;
  defaultQuantity: number;
  markupPercent: number;
  taxable: boolean;
  phaseId?: string;
  sortOrder: number;
}

/**
 * Price history entry for tracking changes
 */
export interface LineItemPriceHistory {
  id: string;
  lineItemId: string;
  orgId: string;

  // Pricing at this point
  materialCost: number;
  laborCost: number;
  unitPrice: number;

  // Context
  reason?: string; // e.g., 'Supplier price increase', 'Market adjustment'

  // Dates
  effectiveDate: Date;
  createdAt: Date;
  createdBy: string;
}

/**
 * Helper functions for line item calculations
 */
export const LINE_ITEM_TRADES: { value: LineItemTrade; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'demolition', label: 'Demolition' },
  { value: 'framing', label: 'Framing' },
  { value: 'roofing', label: 'Roofing' },
  { value: 'siding', label: 'Siding' },
  { value: 'windows_doors', label: 'Windows & Doors' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'insulation', label: 'Insulation' },
  { value: 'drywall', label: 'Drywall' },
  { value: 'painting', label: 'Painting' },
  { value: 'flooring', label: 'Flooring' },
  { value: 'cabinets', label: 'Cabinets' },
  { value: 'countertops', label: 'Countertops' },
  { value: 'tile', label: 'Tile' },
  { value: 'fixtures', label: 'Fixtures' },
  { value: 'landscaping', label: 'Landscaping' },
  { value: 'concrete', label: 'Concrete' },
  { value: 'masonry', label: 'Masonry' },
  { value: 'custom', label: 'Custom' },
];

export const LINE_ITEM_UNITS: { value: LineItemUnit; label: string; abbr: string }[] = [
  { value: 'each', label: 'Each', abbr: 'ea' },
  { value: 'sqft', label: 'Square Foot', abbr: 'sq ft' },
  { value: 'lnft', label: 'Linear Foot', abbr: 'ln ft' },
  { value: 'sqyd', label: 'Square Yard', abbr: 'sq yd' },
  { value: 'cuft', label: 'Cubic Foot', abbr: 'cu ft' },
  { value: 'cuyd', label: 'Cubic Yard', abbr: 'cu yd' },
  { value: 'hour', label: 'Hour', abbr: 'hr' },
  { value: 'day', label: 'Day', abbr: 'day' },
  { value: 'week', label: 'Week', abbr: 'wk' },
  { value: 'lump', label: 'Lump Sum', abbr: 'LS' },
  { value: 'gallon', label: 'Gallon', abbr: 'gal' },
  { value: 'pound', label: 'Pound', abbr: 'lb' },
  { value: 'ton', label: 'Ton', abbr: 'ton' },
  { value: 'bundle', label: 'Bundle', abbr: 'bdl' },
  { value: 'box', label: 'Box', abbr: 'box' },
  { value: 'roll', label: 'Roll', abbr: 'roll' },
  { value: 'sheet', label: 'Sheet', abbr: 'sht' },
  { value: 'pallet', label: 'Pallet', abbr: 'plt' },
];

// ============================================
// Schedule Types
// ============================================

/**
 * Schedule event status
 */
export type ScheduleEventStatus =
  | 'scheduled'     // Confirmed on schedule
  | 'tentative'     // Pending confirmation
  | 'in_progress'   // Currently happening
  | 'completed'     // Finished
  | 'cancelled'     // Cancelled
  | 'postponed';    // Moved to future date

/**
 * Schedule event type
 */
export type ScheduleEventType =
  | 'job'           // Project work
  | 'inspection'    // Building/permit inspection
  | 'meeting'       // Client/team meeting
  | 'delivery'      // Material delivery
  | 'milestone'     // Project milestone
  | 'time_off'      // Crew time off
  | 'training'      // Safety/skills training
  | 'other';

/**
 * Recurrence pattern for events
 */
export type RecurrencePattern =
  | 'none'
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly';

/**
 * Weather condition type
 */
export type WeatherCondition =
  | 'clear'
  | 'partly_cloudy'
  | 'cloudy'
  | 'rain'
  | 'heavy_rain'
  | 'snow'
  | 'storm'
  | 'extreme_heat'
  | 'extreme_cold'
  | 'wind';

/**
 * Weather impact level
 */
export type WeatherImpact = 'none' | 'low' | 'moderate' | 'high' | 'severe';

/**
 * Schedule event - main scheduling unit
 */
export interface ScheduleEvent {
  id: string;
  orgId: string;

  // Event info
  title: string;
  description?: string;
  type: ScheduleEventType;
  status: ScheduleEventStatus;
  color?: string; // Custom color for calendar

  // Timing
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  estimatedHours?: number;

  // Recurrence
  recurrence: RecurrencePattern;
  recurrenceEndDate?: Date;
  parentEventId?: string; // For recurring event instances

  // Location
  location?: string;
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };

  // Relationships
  projectId?: string;
  projectName?: string;
  phaseId?: string;
  phaseName?: string;
  taskIds?: string[];
  clientId?: string;
  clientName?: string;

  // Crew assignment
  assignedUserIds: string[];
  assignedUsers?: {
    id: string;
    name: string;
    role?: string;
  }[];
  crewSize?: number;
  leadUserId?: string; // Crew lead for this job

  // Weather considerations
  weatherSensitive: boolean;
  weatherConditions?: WeatherCondition[];
  weatherImpact?: WeatherImpact;
  weatherNotes?: string;

  // Conflict tracking
  hasConflicts?: boolean;
  conflictEventIds?: string[];

  // Notifications
  notifyAssignees: boolean;
  notifyClient: boolean;
  reminderMinutes?: number[]; // e.g., [1440, 60] = 24 hours and 1 hour before

  // Notes
  internalNotes?: string;
  clientVisibleNotes?: string;

  // Metadata
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
  updatedBy?: string;
}

/**
 * Crew availability for scheduling
 */
export interface CrewAvailability {
  id: string;
  orgId: string;
  userId: string;
  userName: string;

  // Availability period
  date: Date;
  startTime?: string; // HH:mm format, null = all day
  endTime?: string;
  allDay: boolean;

  // Status
  status: 'available' | 'unavailable' | 'limited';
  reason?: 'time_off' | 'sick' | 'training' | 'other_job' | 'personal' | 'other';
  notes?: string;

  // Recurring availability (e.g., always off Sundays)
  isRecurring: boolean;
  recurrencePattern?: RecurrencePattern;
  recurrenceEndDate?: Date;

  // Metadata
  createdAt: Date;
  createdBy: string;
}

/**
 * Time off request
 */
export interface TimeOffRequest {
  id: string;
  orgId: string;
  userId: string;
  userName: string;

  // Request details
  type: 'vacation' | 'sick' | 'personal' | 'bereavement' | 'jury_duty' | 'other';
  startDate: Date;
  endDate: Date;
  halfDay?: 'morning' | 'afternoon';
  reason?: string;

  // Approval workflow
  status: 'pending' | 'approved' | 'denied' | 'cancelled';
  approvedBy?: string;
  approvedAt?: Date;
  denialReason?: string;

  // Metadata
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Weather forecast data
 */
export interface WeatherForecast {
  id: string;
  orgId: string;

  // Location
  location: string;
  coordinates: {
    lat: number;
    lng: number;
  };

  // Forecast
  date: Date;
  condition: WeatherCondition;
  tempHigh: number;
  tempLow: number;
  precipitation: number; // percentage
  humidity: number;
  windSpeed: number;
  windDirection?: string;
  uvIndex?: number;

  // Impact assessment
  impact: WeatherImpact;
  impactNotes?: string;
  affectedTrades?: string[]; // e.g., ['roofing', 'concrete', 'painting']

  // Source
  source: string; // e.g., 'openweathermap', 'weatherapi'
  fetchedAt: Date;
}

/**
 * Schedule conflict
 */
export interface ScheduleConflict {
  id: string;
  orgId: string;

  // Conflict type
  type: 'crew_overlap' | 'equipment_overlap' | 'location_overlap' | 'weather' | 'resource_shortage';
  severity: 'warning' | 'error';

  // Conflicting events
  eventIds: string[];
  eventTitles: string[];

  // Affected resources
  affectedUserIds?: string[];
  affectedUserNames?: string[];
  affectedEquipmentIds?: string[];

  // Description
  description: string;
  suggestedResolution?: string;

  // Resolution
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolution?: string;

  // Metadata
  detectedAt: Date;
}

/**
 * Schedule view preferences
 */
export interface ScheduleViewPreferences {
  userId: string;
  defaultView: 'day' | 'week' | 'month' | 'timeline';
  showWeekends: boolean;
  startOfWeek: 0 | 1 | 6; // 0 = Sunday, 1 = Monday, 6 = Saturday
  workingHoursStart: string; // HH:mm
  workingHoursEnd: string;
  showWeather: boolean;
  showConflicts: boolean;
  colorBy: 'type' | 'project' | 'status' | 'assignee';
  hiddenEventTypes?: ScheduleEventType[];
  hiddenUserIds?: string[];
}

/**
 * Schedule statistics
 */
export interface ScheduleStats {
  orgId: string;
  period: {
    start: Date;
    end: Date;
  };

  // Counts
  totalEvents: number;
  completedEvents: number;
  cancelledEvents: number;
  postponedEvents: number;

  // Hours
  scheduledHours: number;
  completedHours: number;
  averageEventDuration: number;

  // Crew utilization
  crewUtilization: {
    userId: string;
    userName: string;
    scheduledHours: number;
    availableHours: number;
    utilizationPercent: number;
  }[];

  // Weather impact
  weatherDelayedEvents: number;
  weatherDelayedHours: number;

  // Conflicts
  totalConflicts: number;
  resolvedConflicts: number;
}

/**
 * Constants for schedule
 */
export const SCHEDULE_EVENT_TYPES: { value: ScheduleEventType; label: string; color: string }[] = [
  { value: 'job', label: 'Job/Work', color: '#2563eb' },
  { value: 'inspection', label: 'Inspection', color: '#7c3aed' },
  { value: 'meeting', label: 'Meeting', color: '#0891b2' },
  { value: 'delivery', label: 'Delivery', color: '#059669' },
  { value: 'milestone', label: 'Milestone', color: '#d97706' },
  { value: 'time_off', label: 'Time Off', color: '#6b7280' },
  { value: 'training', label: 'Training', color: '#db2777' },
  { value: 'other', label: 'Other', color: '#71717a' },
];

export const SCHEDULE_EVENT_STATUSES: { value: ScheduleEventStatus; label: string; color: string }[] = [
  { value: 'scheduled', label: 'Scheduled', color: '#2563eb' },
  { value: 'tentative', label: 'Tentative', color: '#f59e0b' },
  { value: 'in_progress', label: 'In Progress', color: '#8b5cf6' },
  { value: 'completed', label: 'Completed', color: '#10b981' },
  { value: 'cancelled', label: 'Cancelled', color: '#ef4444' },
  { value: 'postponed', label: 'Postponed', color: '#6b7280' },
];

export const WEATHER_CONDITIONS: { value: WeatherCondition; label: string; icon: string }[] = [
  { value: 'clear', label: 'Clear', icon: '☀️' },
  { value: 'partly_cloudy', label: 'Partly Cloudy', icon: '⛅' },
  { value: 'cloudy', label: 'Cloudy', icon: '☁️' },
  { value: 'rain', label: 'Rain', icon: '🌧️' },
  { value: 'heavy_rain', label: 'Heavy Rain', icon: '⛈️' },
  { value: 'snow', label: 'Snow', icon: '❄️' },
  { value: 'storm', label: 'Storm', icon: '🌩️' },
  { value: 'extreme_heat', label: 'Extreme Heat', icon: '🔥' },
  { value: 'extreme_cold', label: 'Extreme Cold', icon: '🥶' },
  { value: 'wind', label: 'High Wind', icon: '💨' },
];

export const TIME_OFF_TYPES: { value: TimeOffRequest['type']; label: string }[] = [
  { value: 'vacation', label: 'Vacation' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'personal', label: 'Personal' },
  { value: 'bereavement', label: 'Bereavement' },
  { value: 'jury_duty', label: 'Jury Duty' },
  { value: 'other', label: 'Other' },
];

// ============================================
// Material & Equipment Tracking Types
// ============================================

/**
 * Material category
 */
export type MaterialCategory =
  | 'lumber'
  | 'hardware'
  | 'electrical'
  | 'plumbing'
  | 'hvac'
  | 'roofing'
  | 'insulation'
  | 'drywall'
  | 'paint'
  | 'flooring'
  | 'tile'
  | 'concrete'
  | 'masonry'
  | 'windows_doors'
  | 'cabinets'
  | 'countertops'
  | 'fixtures'
  | 'appliances'
  | 'landscaping'
  | 'safety'
  | 'tools'
  | 'equipment'
  | 'rental'
  | 'other';

/**
 * Material status in inventory
 */
export type MaterialStatus =
  | 'in_stock'      // Available in warehouse/storage
  | 'low_stock'     // Below reorder threshold
  | 'out_of_stock'  // None available
  | 'on_order'      // Ordered, awaiting delivery
  | 'on_site'       // Delivered to job site
  | 'consumed'      // Used up
  | 'returned';     // Returned to supplier

/**
 * Equipment checkout status
 */
export type EquipmentCheckoutStatus =
  | 'available'     // Ready for checkout
  | 'checked_out'   // Currently in use
  | 'maintenance'   // Being repaired
  | 'retired';      // No longer in service

/**
 * Material purchase order status (for material tracking module)
 * Note: Different from the general PurchaseOrderStatus used elsewhere
 */
export type MaterialPurchaseOrderStatus =
  | 'draft'         // Being prepared
  | 'pending'       // Awaiting approval
  | 'approved'      // Approved, not yet sent
  | 'ordered'       // Sent to supplier
  | 'partial'       // Partially received
  | 'received'      // Fully received
  | 'cancelled';    // Cancelled

/**
 * Material item in inventory
 */
export interface MaterialItem {
  id: string;
  orgId: string;

  // Basic info
  name: string;
  description?: string;
  sku?: string; // Stock keeping unit
  barcode?: string;
  category: MaterialCategory;
  unit: LineItemUnit;

  // Inventory
  quantityOnHand: number;
  quantityReserved: number; // Reserved for projects
  quantityAvailable: number; // onHand - reserved
  reorderPoint: number; // Alert when below this
  reorderQuantity: number; // How much to reorder

  // Pricing
  unitCost: number;
  lastPurchasePrice?: number;
  averageCost?: number; // Weighted average
  markupPercent?: number;
  sellPrice?: number;

  // Storage
  defaultLocation?: string; // e.g., 'Warehouse A', 'Shelf B-3'
  locations?: {
    locationId: string;
    locationName: string;
    quantity: number;
  }[];

  // Supplier info
  preferredSupplierId?: string;
  preferredSupplierName?: string;
  supplierSku?: string;
  leadTimeDays?: number;

  // Images
  imageUrl?: string;
  imageUrls?: string[];

  // Tracking
  status: MaterialStatus;
  isActive: boolean;

  // Metadata
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
  updatedBy?: string;
}

/**
 * Equipment/Tool item
 */
export interface EquipmentItem {
  id: string;
  orgId: string;

  // Basic info
  name: string;
  description?: string;
  serialNumber?: string;
  assetTag?: string;
  category: MaterialCategory;
  make?: string;
  model?: string;
  year?: number;

  // Value
  purchasePrice?: number;
  purchaseDate?: Date;
  currentValue?: number;
  depreciationRate?: number;

  // Rental info (if rental equipment)
  isRental: boolean;
  rentalSupplierId?: string;
  rentalSupplierName?: string;
  rentalRate?: number;
  rentalPeriod?: 'hour' | 'day' | 'week' | 'month';
  rentalStartDate?: Date;
  rentalEndDate?: Date;

  // Status
  status: EquipmentCheckoutStatus;
  condition: 'excellent' | 'good' | 'fair' | 'poor';

  // Current location
  currentLocationId?: string;
  currentLocationName?: string;
  currentProjectId?: string;
  currentProjectName?: string;

  // Checkout info
  checkedOutTo?: string; // userId
  checkedOutToName?: string;
  checkedOutAt?: Date;
  expectedReturnDate?: Date;

  // Maintenance
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  maintenanceNotes?: string;

  // Images & docs
  imageUrl?: string;
  imageUrls?: string[];
  documentUrls?: string[];

  // Metadata
  isActive: boolean;
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
  updatedBy?: string;
}

/**
 * Equipment checkout record
 */
export interface EquipmentCheckout {
  id: string;
  orgId: string;

  // Equipment
  equipmentId: string;
  equipmentName: string;
  equipmentSerialNumber?: string;

  // Checkout details
  checkedOutBy: string;
  checkedOutByName: string;
  checkedOutAt: Date;
  expectedReturnDate?: Date;

  // Return details
  returnedAt?: Date;
  returnedBy?: string;
  returnCondition?: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
  returnNotes?: string;

  // Location
  projectId?: string;
  projectName?: string;
  location?: string;

  // Notes
  checkoutNotes?: string;

  // Status
  status: 'active' | 'returned' | 'overdue';

  // Metadata
  createdAt: Date;
  createdBy: string;
}

/**
 * Supplier/Vendor
 */
export interface Supplier {
  id: string;
  orgId: string;

  // Basic info
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  website?: string;

  // Address
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country?: string;
  };

  // Account info
  accountNumber?: string;
  paymentTerms?: string; // e.g., 'Net 30', 'COD'
  creditLimit?: number;

  // Categories they supply
  categories?: MaterialCategory[];

  // Rating
  rating?: number; // 1-5
  notes?: string;

  // Status
  isPreferred: boolean;
  isActive: boolean;

  // Metadata
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
}

/**
 * Material purchase order (for material tracking module)
 * Note: Different from the general PurchaseOrder used elsewhere
 */
export interface MaterialPurchaseOrder {
  id: string;
  orgId: string;

  // Order info
  orderNumber: string;
  status: MaterialPurchaseOrderStatus;

  // Supplier
  supplierId: string;
  supplierName: string;
  supplierContact?: string;
  supplierEmail?: string;

  // Project (optional)
  projectId?: string;
  projectName?: string;

  // Shipping
  shipToAddress?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  shipToLocation?: string; // e.g., 'Job Site', 'Warehouse'

  // Line items
  lineItems: MaterialPurchaseOrderLineItem[];

  // Totals
  subtotal: number;
  taxRate?: number;
  taxAmount?: number;
  shippingCost?: number;
  total: number;

  // Dates
  orderDate: Date;
  expectedDeliveryDate?: Date;
  actualDeliveryDate?: Date;

  // Approval
  approvedBy?: string;
  approvedAt?: Date;

  // Notes
  notes?: string;
  internalNotes?: string;

  // Attachments (receipts, invoices)
  attachments?: {
    name: string;
    url: string;
    type: 'receipt' | 'invoice' | 'packing_slip' | 'other';
    uploadedAt: Date;
  }[];

  // Metadata
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
  updatedBy?: string;
}

/**
 * Material purchase order line item
 */
export interface MaterialPurchaseOrderLineItem {
  id: string;
  materialId?: string;
  name: string;
  description?: string;
  sku?: string;
  unit: LineItemUnit;
  quantityOrdered: number;
  quantityReceived: number;
  unitCost: number;
  totalCost: number;
}

/**
 * Material allocation to a project
 */
export interface MaterialAllocation {
  id: string;
  orgId: string;

  // Material
  materialId: string;
  materialName: string;

  // Project
  projectId: string;
  projectName: string;
  phaseId?: string;
  phaseName?: string;
  taskId?: string;

  // Quantities
  quantityAllocated: number;
  quantityUsed: number;
  quantityRemaining: number;
  unit: LineItemUnit;

  // Cost tracking
  unitCost: number;
  totalCost: number;

  // Status
  status: 'allocated' | 'partial_used' | 'fully_used' | 'returned';

  // Notes
  notes?: string;

  // Metadata
  allocatedAt: Date;
  allocatedBy: string;
  updatedAt?: Date;
}

/**
 * Material movement/transaction record
 */
export interface MaterialTransaction {
  id: string;
  orgId: string;

  // Material
  materialId: string;
  materialName: string;

  // Transaction type
  type:
    | 'purchase'      // Received from supplier
    | 'return'        // Returned to supplier
    | 'transfer_in'   // Transferred in from another location
    | 'transfer_out'  // Transferred out to another location
    | 'allocate'      // Allocated to project
    | 'deallocate'    // Removed from project
    | 'consume'       // Used/consumed
    | 'adjust'        // Manual adjustment
    | 'waste'         // Damaged/wasted
    | 'count';        // Inventory count adjustment

  // Quantities
  quantity: number;
  unit: LineItemUnit;
  previousQuantity: number;
  newQuantity: number;

  // Cost
  unitCost?: number;
  totalCost?: number;

  // References
  purchaseOrderId?: string;
  projectId?: string;
  projectName?: string;
  locationFrom?: string;
  locationTo?: string;

  // Notes
  reason?: string;
  notes?: string;
  receiptUrl?: string;

  // Metadata
  transactionDate: Date;
  createdBy: string;
  createdByName: string;
}

/**
 * Storage location
 */
export interface StorageLocation {
  id: string;
  orgId: string;

  name: string;
  type: 'warehouse' | 'job_site' | 'vehicle' | 'storage_unit' | 'other';
  address?: string;
  projectId?: string; // If job site
  projectName?: string;

  // Contact for location
  contactName?: string;
  contactPhone?: string;

  isActive: boolean;
  createdAt: Date;
  createdBy: string;
}

/**
 * Low stock alert
 */
export interface LowStockAlert {
  id: string;
  orgId: string;

  materialId: string;
  materialName: string;
  category: MaterialCategory;

  currentQuantity: number;
  reorderPoint: number;
  reorderQuantity: number;
  unit: LineItemUnit;

  // Supplier
  preferredSupplierId?: string;
  preferredSupplierName?: string;

  // Status
  status: 'active' | 'acknowledged' | 'ordered' | 'resolved';
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  purchaseOrderId?: string;

  createdAt: Date;
  resolvedAt?: Date;
}

/**
 * Constants for materials
 */
export const MATERIAL_CATEGORIES: { value: MaterialCategory; label: string }[] = [
  { value: 'lumber', label: 'Lumber' },
  { value: 'hardware', label: 'Hardware' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'roofing', label: 'Roofing' },
  { value: 'insulation', label: 'Insulation' },
  { value: 'drywall', label: 'Drywall' },
  { value: 'paint', label: 'Paint' },
  { value: 'flooring', label: 'Flooring' },
  { value: 'tile', label: 'Tile' },
  { value: 'concrete', label: 'Concrete' },
  { value: 'masonry', label: 'Masonry' },
  { value: 'windows_doors', label: 'Windows & Doors' },
  { value: 'cabinets', label: 'Cabinets' },
  { value: 'countertops', label: 'Countertops' },
  { value: 'fixtures', label: 'Fixtures' },
  { value: 'appliances', label: 'Appliances' },
  { value: 'landscaping', label: 'Landscaping' },
  { value: 'safety', label: 'Safety Equipment' },
  { value: 'tools', label: 'Tools' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'rental', label: 'Rental Equipment' },
  { value: 'other', label: 'Other' },
];

export const MATERIAL_STATUSES: { value: MaterialStatus; label: string; color: string }[] = [
  { value: 'in_stock', label: 'In Stock', color: '#10b981' },
  { value: 'low_stock', label: 'Low Stock', color: '#f59e0b' },
  { value: 'out_of_stock', label: 'Out of Stock', color: '#ef4444' },
  { value: 'on_order', label: 'On Order', color: '#3b82f6' },
  { value: 'on_site', label: 'On Site', color: '#8b5cf6' },
  { value: 'consumed', label: 'Consumed', color: '#6b7280' },
  { value: 'returned', label: 'Returned', color: '#71717a' },
];

export const EQUIPMENT_STATUSES: { value: EquipmentCheckoutStatus; label: string; color: string }[] = [
  { value: 'available', label: 'Available', color: '#10b981' },
  { value: 'checked_out', label: 'Checked Out', color: '#f59e0b' },
  { value: 'maintenance', label: 'Maintenance', color: '#ef4444' },
  { value: 'retired', label: 'Retired', color: '#6b7280' },
];

export const MATERIAL_PURCHASE_ORDER_STATUSES: { value: MaterialPurchaseOrderStatus; label: string; color: string }[] = [
  { value: 'draft', label: 'Draft', color: '#6b7280' },
  { value: 'pending', label: 'Pending Approval', color: '#f59e0b' },
  { value: 'approved', label: 'Approved', color: '#3b82f6' },
  { value: 'ordered', label: 'Ordered', color: '#8b5cf6' },
  { value: 'partial', label: 'Partially Received', color: '#0891b2' },
  { value: 'received', label: 'Received', color: '#10b981' },
  { value: 'cancelled', label: 'Cancelled', color: '#ef4444' },
];
