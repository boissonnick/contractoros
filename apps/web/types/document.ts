// ============================================
// Document Types
// Photos, RFIs, Submittals, Punch Lists, Change Orders
// Extracted from types/index.ts
// ============================================

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
// Closeout Checklist Types
// ============================================

export interface CloseoutChecklist {
  id: string;
  projectId: string;
  orgId: string;

  items: CloseoutChecklistItem[];
  completedCount: number;
  totalCount: number;

  completedAt?: Date;
  completedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CloseoutChecklistItem {
  id: string;
  label: string;
  category: 'documentation' | 'inspection' | 'client' | 'financial' | 'warranty';
  completed: boolean;
  completedAt?: Date;
  completedBy?: string;
  notes?: string;
}

// ============================================
// Document Status Labels
// ============================================

export const RFI_STATUS_LABELS: Record<RFIStatus, string> = {
  draft: 'Draft',
  open: 'Open',
  pending_response: 'Pending Response',
  answered: 'Answered',
  closed: 'Closed',
};

export const SUBMITTAL_STATUS_LABELS: Record<SubmittalStatus, string> = {
  draft: 'Draft',
  pending_review: 'Pending Review',
  approved: 'Approved',
  approved_as_noted: 'Approved as Noted',
  revise_resubmit: 'Revise & Resubmit',
  rejected: 'Rejected',
};

export const PUNCH_ITEM_STATUS_LABELS: Record<PunchItemStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  ready_for_review: 'Ready for Review',
  approved: 'Approved',
  rejected: 'Rejected',
};

export const CHANGE_ORDER_STATUS_LABELS: Record<ChangeOrderStatus, string> = {
  draft: 'Draft',
  pending_pm: 'Pending PM Review',
  pending_owner: 'Pending Owner Review',
  pending_client: 'Pending Client Approval',
  approved: 'Approved',
  rejected: 'Rejected',
};
