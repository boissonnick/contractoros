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
  // Display fields (may be denormalized from related entities)
  clientName?: string;      // Denormalized from Client
  currentPhase?: string;    // Current active phase name
  createdAt: Date;
  updatedAt?: Date;
}

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
  // Weather risk (Sprint 13)
  trades?: string[];         // Trade types for weather risk assessment (roofing, concrete, etc.)
  createdAt: Date;
  updatedAt?: Date;
}

// Alias for shorter reference in weather risk
export type Phase = ProjectPhase;

// NOTE: Quote types (QuoteSection, QuoteSectionStatus) are in ./finance.ts
// NOTE: Client preferences types (ClientPreferences, FinishPreferences, etc.) are in ./domains/client.ts

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
