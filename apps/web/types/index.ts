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
}

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

  // Display
  order: number;               // Sort order within phase/column

  // Metadata
  createdBy: string;
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
  userId: string;
  weekStart: Date;
  entries: TimeEntry[];
  totalHours: number;
  overtimeHours: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submittedAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
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
  userId: string;
  url: string;
  thumbnailUrl?: string;
  type: PhotoType;
  caption?: string;
  location?: {
    lat: number;
    lng: number;
  };
  takenAt: Date;
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

export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'paid'
  | 'overdue'
  | 'cancelled';

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  taskId?: string;
}

export interface Invoice {
  id: string;
  orgId: string;
  projectId: string;
  clientId: string;
  invoiceNumber: string;
  items: InvoiceLineItem[];
  subtotal: number;
  tax?: number;
  taxRate?: number;
  total: number;
  status: InvoiceStatus;
  issueDate: Date;
  dueDate: Date;
  paidAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
}

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
