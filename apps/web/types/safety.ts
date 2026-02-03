// ============================================
// Safety & Compliance Types
// Extracted from types/index.ts
// ============================================

// ============================================
// Safety Inspection Types
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

// ============================================
// Safety Incident Types
// ============================================

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

// ============================================
// Toolbox Talk Types
// ============================================

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
// Permit Types
// ============================================

export type PermitType =
  | 'building'
  | 'electrical'
  | 'plumbing'
  | 'mechanical'
  | 'demolition'
  | 'excavation'
  | 'fire'
  | 'environmental'
  | 'zoning'
  | 'other';

export type PermitStatus = 'pending' | 'submitted' | 'in_review' | 'approved' | 'rejected' | 'expired';

export interface Permit {
  id: string;
  orgId: string;
  projectId?: string;
  projectName?: string;
  permitType: PermitType;
  permitNumber?: string;
  jurisdiction: string;
  description: string;
  status: PermitStatus;
  submittedDate?: Date;
  approvedDate?: Date;
  expirationDate?: Date;
  fees?: number;
  feePaidDate?: Date;
  inspections: PermitInspection[];
  notes?: string;
  documentURL?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface PermitInspection {
  id: string;
  type: string;
  scheduledDate?: Date;
  completedDate?: Date;
  result?: 'passed' | 'failed' | 'partial';
  inspector?: string;
  notes?: string;
}

// ============================================
// Tax & Compliance Types
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
// Safety Status Labels
// ============================================

export const SAFETY_INSPECTION_STATUS_LABELS: Record<SafetyInspectionStatus, { label: string; color: string }> = {
  scheduled: { label: 'Scheduled', color: 'blue' },
  in_progress: { label: 'In Progress', color: 'yellow' },
  passed: { label: 'Passed', color: 'green' },
  failed: { label: 'Failed', color: 'red' },
  needs_followup: { label: 'Needs Follow-up', color: 'orange' },
};

export const INCIDENT_SEVERITY_LABELS: Record<IncidentSeverity, { label: string; color: string }> = {
  near_miss: { label: 'Near Miss', color: 'yellow' },
  first_aid: { label: 'First Aid', color: 'blue' },
  medical: { label: 'Medical Treatment', color: 'orange' },
  lost_time: { label: 'Lost Time', color: 'red' },
  fatality: { label: 'Fatality', color: 'purple' },
};

export const PERMIT_TYPE_LABELS: Record<PermitType, string> = {
  building: 'Building Permit',
  electrical: 'Electrical Permit',
  plumbing: 'Plumbing Permit',
  mechanical: 'Mechanical Permit',
  demolition: 'Demolition Permit',
  excavation: 'Excavation Permit',
  fire: 'Fire Permit',
  environmental: 'Environmental Permit',
  zoning: 'Zoning Permit',
  other: 'Other',
};

export const PERMIT_STATUS_LABELS: Record<PermitStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'gray' },
  submitted: { label: 'Submitted', color: 'blue' },
  in_review: { label: 'In Review', color: 'yellow' },
  approved: { label: 'Approved', color: 'green' },
  rejected: { label: 'Rejected', color: 'red' },
  expired: { label: 'Expired', color: 'orange' },
};

export const W9_STATUS_LABELS: Record<W9Status, string> = {
  pending: 'Pending',
  received: 'Received',
  verified: 'Verified',
  expired: 'Expired',
};
