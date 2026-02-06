import React from 'react';

// Re-export types from separate modules
export * from './project';
export * from './user';
export * from './schedule';
export * from './subcontractor';
export * from './finance';
export * from './document';
export * from './communication';
export * from './equipment';
export * from './safety';
export * from './ai';
export * from './review';
// Note: domains/client.ts types are defined inline in this file for backwards compatibility

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

export type PaySchedule = 'weekly' | 'bi-weekly' | 'semi-monthly' | 'monthly';
export type PayMethod = 'direct_deposit' | 'check' | 'cash';

export interface BankInfo {
  routingNumber?: string;      // Masked in UI
  accountLast4?: string;       // Last 4 digits only
  accountType?: 'checking' | 'savings';
  bankName?: string;
}

export interface W4Info {
  filingStatus?: 'single' | 'married_filing_jointly' | 'married_filing_separately' | 'head_of_household';
  allowances?: number;
  additionalWithholding?: number;
  isExempt?: boolean;
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
  hourlyRate?: number;            // For billing/payroll (what you bill the client)
  hourlyCost?: number;            // Internal cost rate (what the employee costs the company)
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

  // Payroll fields
  salary?: number;               // Annual salary (for salaried employees)
  overtimeRate?: number;         // Multiplier (e.g., 1.5 for time-and-a-half), defaults to 1.5
  doubleTimeRate?: number;       // Multiplier for double-time, defaults to 2.0
  paySchedule?: PaySchedule;     // How often employee is paid
  payMethod?: PayMethod;         // How employee receives payment
  bankInfo?: BankInfo;           // For direct deposit (masked/partial data only)
  w4Info?: W4Info;               // Tax withholding configuration

  // Time-off balances (in hours)
  ptoBalance?: number;           // Paid time off balance
  sickLeaveBalance?: number;     // Sick leave balance
  ptoAccrualRate?: number;       // Hours accrued per pay period
  sickAccrualRate?: number;      // Hours accrued per pay period

  // Company info (for subs/contractors)
  companyName?: string;
  ein?: string;                  // Employer Identification Number (masked)

  // Specialty for display
  specialty?: string;            // Job title or specialty

  // Regional preferences
  timezone?: string;             // IANA timezone (e.g., 'America/New_York')
  dateFormat?: string;           // Date display format (e.g., 'MM/DD/YYYY')
  timeFormat?: string;           // Time display format ('12h' or '24h')
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export type CertificationCategory = 'license' | 'insurance' | 'training' | 'safety' | 'other';
export type CertificationStatus = 'valid' | 'expiring' | 'expired';

export interface Certification {
  name: string;
  issuingBody?: string;
  number?: string;
  expiryDate?: string; // ISO date string
  fileURL?: string;
  category?: CertificationCategory;
  status?: CertificationStatus;
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
  // Financial configuration (Sprint 37B)
  fiscalYear?: FiscalYearConfig;
  payrollPeriod?: PayrollPeriodConfig;
  taxConfig?: TaxConfig;
  // Corporate structure & compliance
  corporateStructure?: CorporateStructure;
  insuranceCompliance?: InsuranceCompliance;
  // Data & Privacy (Sprint 37B) - AI data contribution setting
  // Defaults to true (opt-out model) - helps improve AI suggestions for all contractors
  aiContributionEnabled?: boolean;
}

export interface OrgSettings {
  timezone: string;
  workdayStart: string;    // "08:00"
  workdayEnd: string;      // "17:00"
  overtimeThreshold: number; // hours per week
  requireGeoLocation: boolean;

  // Voice Command Settings (Sprint 29)
  voiceEnabled?: boolean;              // Master toggle for voice commands
  voiceLanguage?: string;              // Default: 'en-US'
  voiceConfirmationRequired?: boolean; // Require confirm before executing
  voiceWakeWord?: string | null;       // Optional wake word (e.g., 'Hey ContractorOS')
}

// ============================================
// Impersonation & Permissions Types
// ============================================

// Impersonation role types for testing/demos
export type ImpersonationRole =
  | 'owner'           // Full admin access
  | 'project_manager' // Project-level admin
  | 'finance'         // Finance/billing access
  | 'employee'        // W-2 staff member
  | 'contractor'      // 1099 subcontractor
  | 'client'          // Customer viewing their project
  | 'assistant';      // Limited administrative access

export interface ImpersonationContext {
  isImpersonating: boolean;
  actualUserId: string;
  actualUserRole: UserRole;
  impersonatedRole: ImpersonationRole;
  impersonatedUserId?: string; // Optional: impersonate specific user
  startedAt: Date;
}

// Granular permission flags
export interface RolePermissions {
  // Projects
  canViewAllProjects: boolean;
  canViewAssignedProjects: boolean;
  canCreateProjects: boolean;
  canEditProjects: boolean;
  canDeleteProjects: boolean;

  // Finances
  canViewAllFinances: boolean;
  canViewAssignedFinances: boolean;
  canManageExpenses: boolean;
  canManageInvoices: boolean;
  canApproveBudgets: boolean;

  // Team
  canViewTeam: boolean;
  canInviteUsers: boolean;
  canEditUsers: boolean;
  canRemoveUsers: boolean;
  canChangeRoles: boolean;

  // Time Tracking
  canClockInOut: boolean;
  canViewOwnTime: boolean;
  canViewTeamTime: boolean;
  canEditOwnTime: boolean;
  canEditTeamTime: boolean;
  canApproveTimesheets: boolean;

  // Tasks
  canViewAssignedTasks: boolean;
  canViewAllTasks: boolean;
  canCreateTasks: boolean;
  canEditTasks: boolean;
  canDeleteTasks: boolean;
  canAssignTasks: boolean;

  // Clients
  canViewClients: boolean;
  canCreateClients: boolean;
  canEditClients: boolean;
  canDeleteClients: boolean;

  // Documents (RFIs, Submittals, COs)
  canViewDocuments: boolean;
  canCreateDocuments: boolean;
  canEditDocuments: boolean;
  canApproveDocuments: boolean;

  // Reports
  canViewProjectReports: boolean;
  canViewCompanyReports: boolean;
  canExportReports: boolean;

  // Settings
  canViewSettings: boolean;
  canEditOrganization: boolean;
  canManageTemplates: boolean;
  canManageIntegrations: boolean;
  canManageRoles: boolean;

  // Special
  canImpersonate: boolean; // God mode
}

// Permission matrix by role
export const ROLE_PERMISSIONS: Record<ImpersonationRole, RolePermissions> = {
  owner: {
    canViewAllProjects: true,
    canViewAssignedProjects: true,
    canCreateProjects: true,
    canEditProjects: true,
    canDeleteProjects: true,
    canViewAllFinances: true,
    canViewAssignedFinances: true,
    canManageExpenses: true,
    canManageInvoices: true,
    canApproveBudgets: true,
    canViewTeam: true,
    canInviteUsers: true,
    canEditUsers: true,
    canRemoveUsers: true,
    canChangeRoles: true,
    canClockInOut: false, // Owners don't clock in
    canViewOwnTime: true,
    canViewTeamTime: true,
    canEditOwnTime: true,
    canEditTeamTime: true,
    canApproveTimesheets: true,
    canViewAssignedTasks: true,
    canViewAllTasks: true,
    canCreateTasks: true,
    canEditTasks: true,
    canDeleteTasks: true,
    canAssignTasks: true,
    canViewClients: true,
    canCreateClients: true,
    canEditClients: true,
    canDeleteClients: true,
    canViewDocuments: true,
    canCreateDocuments: true,
    canEditDocuments: true,
    canApproveDocuments: true,
    canViewProjectReports: true,
    canViewCompanyReports: true,
    canExportReports: true,
    canViewSettings: true,
    canEditOrganization: true,
    canManageTemplates: true,
    canManageIntegrations: true,
    canManageRoles: true,
    canImpersonate: true,
  },
  project_manager: {
    canViewAllProjects: true,
    canViewAssignedProjects: true,
    canCreateProjects: true,
    canEditProjects: true,
    canDeleteProjects: false,
    canViewAllFinances: true,
    canViewAssignedFinances: true,
    canManageExpenses: true,
    canManageInvoices: true,
    canApproveBudgets: false,
    canViewTeam: true,
    canInviteUsers: true,
    canEditUsers: false,
    canRemoveUsers: false,
    canChangeRoles: false,
    canClockInOut: false,
    canViewOwnTime: true,
    canViewTeamTime: true,
    canEditOwnTime: true,
    canEditTeamTime: true,
    canApproveTimesheets: true,
    canViewAssignedTasks: true,
    canViewAllTasks: true,
    canCreateTasks: true,
    canEditTasks: true,
    canDeleteTasks: true,
    canAssignTasks: true,
    canViewClients: true,
    canCreateClients: true,
    canEditClients: true,
    canDeleteClients: false,
    canViewDocuments: true,
    canCreateDocuments: true,
    canEditDocuments: true,
    canApproveDocuments: true,
    canViewProjectReports: true,
    canViewCompanyReports: true,
    canExportReports: true,
    canViewSettings: true,
    canEditOrganization: false,
    canManageTemplates: true,
    canManageIntegrations: false,
    canManageRoles: false,
    canImpersonate: false,
  },
  finance: {
    canViewAllProjects: true,
    canViewAssignedProjects: true,
    canCreateProjects: false,
    canEditProjects: false,
    canDeleteProjects: false,
    canViewAllFinances: true,
    canViewAssignedFinances: true,
    canManageExpenses: true,
    canManageInvoices: true,
    canApproveBudgets: true,
    canViewTeam: true,
    canInviteUsers: false,
    canEditUsers: false,
    canRemoveUsers: false,
    canChangeRoles: false,
    canClockInOut: false,
    canViewOwnTime: true,
    canViewTeamTime: true,
    canEditOwnTime: false,
    canEditTeamTime: false,
    canApproveTimesheets: false,
    canViewAssignedTasks: false,
    canViewAllTasks: false,
    canCreateTasks: false,
    canEditTasks: false,
    canDeleteTasks: false,
    canAssignTasks: false,
    canViewClients: true,
    canCreateClients: false,
    canEditClients: true,
    canDeleteClients: false,
    canViewDocuments: true,
    canCreateDocuments: false,
    canEditDocuments: false,
    canApproveDocuments: false,
    canViewProjectReports: true,
    canViewCompanyReports: true,
    canExportReports: true,
    canViewSettings: true,
    canEditOrganization: false,
    canManageTemplates: false,
    canManageIntegrations: false,
    canManageRoles: false,
    canImpersonate: false,
  },
  employee: {
    canViewAllProjects: false,
    canViewAssignedProjects: true,
    canCreateProjects: false,
    canEditProjects: false,
    canDeleteProjects: false,
    canViewAllFinances: false,
    canViewAssignedFinances: false,
    canManageExpenses: true, // Their own expenses
    canManageInvoices: false,
    canApproveBudgets: false,
    canViewTeam: true,
    canInviteUsers: false,
    canEditUsers: false,
    canRemoveUsers: false,
    canChangeRoles: false,
    canClockInOut: true, // Key feature for employees
    canViewOwnTime: true,
    canViewTeamTime: false,
    canEditOwnTime: true,
    canEditTeamTime: false,
    canApproveTimesheets: false,
    canViewAssignedTasks: true,
    canViewAllTasks: false,
    canCreateTasks: false,
    canEditTasks: true, // Their tasks only
    canDeleteTasks: false,
    canAssignTasks: false,
    canViewClients: false,
    canCreateClients: false,
    canEditClients: false,
    canDeleteClients: false,
    canViewDocuments: true,
    canCreateDocuments: true,
    canEditDocuments: false,
    canApproveDocuments: false,
    canViewProjectReports: false,
    canViewCompanyReports: false,
    canExportReports: false,
    canViewSettings: false,
    canEditOrganization: false,
    canManageTemplates: false,
    canManageIntegrations: false,
    canManageRoles: false,
    canImpersonate: false,
  },
  contractor: {
    canViewAllProjects: false,
    canViewAssignedProjects: true, // Only assigned projects
    canCreateProjects: false,
    canEditProjects: false,
    canDeleteProjects: false,
    canViewAllFinances: false,
    canViewAssignedFinances: false, // Only their invoices
    canManageExpenses: false,
    canManageInvoices: false,
    canApproveBudgets: false,
    canViewTeam: false,
    canInviteUsers: false,
    canEditUsers: false,
    canRemoveUsers: false,
    canChangeRoles: false,
    canClockInOut: false, // They're 1099
    canViewOwnTime: true,
    canViewTeamTime: false,
    canEditOwnTime: true,
    canEditTeamTime: false,
    canApproveTimesheets: false,
    canViewAssignedTasks: true,
    canViewAllTasks: false,
    canCreateTasks: false,
    canEditTasks: true,
    canDeleteTasks: false,
    canAssignTasks: false,
    canViewClients: false,
    canCreateClients: false,
    canEditClients: false,
    canDeleteClients: false,
    canViewDocuments: true,
    canCreateDocuments: true,
    canEditDocuments: false,
    canApproveDocuments: false,
    canViewProjectReports: false,
    canViewCompanyReports: false,
    canExportReports: false,
    canViewSettings: false,
    canEditOrganization: false,
    canManageTemplates: false,
    canManageIntegrations: false,
    canManageRoles: false,
    canImpersonate: false,
  },
  client: {
    canViewAllProjects: false,
    canViewAssignedProjects: true, // Their projects only
    canCreateProjects: false,
    canEditProjects: false,
    canDeleteProjects: false,
    canViewAllFinances: false,
    canViewAssignedFinances: true, // Their project finances
    canManageExpenses: false,
    canManageInvoices: false,
    canApproveBudgets: false,
    canViewTeam: false,
    canInviteUsers: false,
    canEditUsers: false,
    canRemoveUsers: false,
    canChangeRoles: false,
    canClockInOut: false,
    canViewOwnTime: false,
    canViewTeamTime: false,
    canEditOwnTime: false,
    canEditTeamTime: false,
    canApproveTimesheets: false,
    canViewAssignedTasks: false,
    canViewAllTasks: false,
    canCreateTasks: false,
    canEditTasks: false,
    canDeleteTasks: false,
    canAssignTasks: false,
    canViewClients: false,
    canCreateClients: false,
    canEditClients: false,
    canDeleteClients: false,
    canViewDocuments: true, // View their project docs
    canCreateDocuments: false,
    canEditDocuments: false,
    canApproveDocuments: true, // Approve change orders
    canViewProjectReports: true, // Their project only
    canViewCompanyReports: false,
    canExportReports: false,
    canViewSettings: false,
    canEditOrganization: false,
    canManageTemplates: false,
    canManageIntegrations: false,
    canManageRoles: false,
    canImpersonate: false,
  },
  assistant: {
    canViewAllProjects: true,
    canViewAssignedProjects: true,
    canCreateProjects: false,
    canEditProjects: true,
    canDeleteProjects: false,
    canViewAllFinances: false,
    canViewAssignedFinances: false,
    canManageExpenses: false,
    canManageInvoices: false,
    canApproveBudgets: false,
    canViewTeam: true,
    canInviteUsers: false,
    canEditUsers: false,
    canRemoveUsers: false,
    canChangeRoles: false,
    canClockInOut: true,
    canViewOwnTime: true,
    canViewTeamTime: false,
    canEditOwnTime: true,
    canEditTeamTime: false,
    canApproveTimesheets: false,
    canViewAssignedTasks: true,
    canViewAllTasks: true,
    canCreateTasks: true,
    canEditTasks: true,
    canDeleteTasks: false,
    canAssignTasks: true,
    canViewClients: true,
    canCreateClients: true,
    canEditClients: true,
    canDeleteClients: false,
    canViewDocuments: true,
    canCreateDocuments: true,
    canEditDocuments: true,
    canApproveDocuments: false,
    canViewProjectReports: true,
    canViewCompanyReports: false,
    canExportReports: false,
    canViewSettings: true,
    canEditOrganization: false,
    canManageTemplates: true,
    canManageIntegrations: false,
    canManageRoles: false,
    canImpersonate: false,
  },
};

// Role display info
export const IMPERSONATION_ROLE_INFO: Record<ImpersonationRole, { label: string; icon: string; description: string }> = {
  owner: { label: 'Owner/Admin', icon: '👑', description: 'Full system access' },
  project_manager: { label: 'Project Manager', icon: '📋', description: 'Project-level admin' },
  finance: { label: 'Finance Manager', icon: '💰', description: 'Billing & accounting' },
  employee: { label: 'Employee', icon: '👷', description: 'W-2 staff member' },
  contractor: { label: 'Contractor', icon: '🔧', description: '1099 subcontractor' },
  client: { label: 'Client', icon: '👤', description: 'Customer portal' },
  assistant: { label: 'Assistant', icon: '📎', description: 'Limited admin access' },
};

// ============================================
// User Invitation Types
// ============================================

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

export interface UserInvitation {
  id: string;
  orgId: string;
  email: string;
  role: UserRole;
  status: InvitationStatus;
  invitedBy: string;        // userId of inviter
  invitedByName: string;    // Display name of inviter
  token: string;            // Unique token for invitation link
  expiresAt: Date;
  createdAt: Date;
  acceptedAt?: Date;
  acceptedBy?: string;      // userId of acceptor (if different from invite email)
  revokedAt?: Date;
  revokedBy?: string;
  message?: string;         // Optional personal message
}

// ============================================
// User Onboarding Types
// ============================================

/**
 * Onboarding step identifiers
 */
export type OnboardingStep = 'invite_sent' | 'email_verified' | 'profile_completed' | 'first_login';

/**
 * Status of a single onboarding step
 */
export interface OnboardingStepStatus {
  completed: boolean;
  completedAt?: Date;
}

/**
 * Full onboarding status for a user
 */
export interface OnboardingStatus {
  userId: string;
  inviteSent: boolean;
  inviteSentAt?: Date;
  emailVerified: boolean;
  profileCompleted: boolean;
  firstLoginAt?: Date;
  completedAt?: Date;
  currentStep?: OnboardingStep;
  steps?: Record<OnboardingStep, OnboardingStepStatus>;
}

/**
 * Onboarding checklist item for display
 */
export interface OnboardingChecklistItem {
  id: OnboardingStep;
  label: string;
  description: string;
  completed: boolean;
  completedAt?: Date;
  canTriggerManually: boolean;
}

/**
 * User with onboarding status (for list displays)
 */
export interface UserWithOnboarding extends UserProfile {
  onboardingStatus?: OnboardingStatus;
  onboardingProgress?: number; // 0-100 percentage
}

// NOTE: Project, Phase, Task, Quote, and ClientPreferences types have been
// moved to ./project.ts and are re-exported via "export * from './project'"

// ============================================
// Time Tracking Types (Legacy - preserved for backwards compatibility)
// ============================================

export interface TimesheetReviewEntry {
  action: 'approved' | 'rejected';
  reviewedBy: string;
  reviewedByName?: string;
  reviewedAt: Date;
  reason?: string;
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
  approvedByName?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewHistory?: TimesheetReviewEntry[];
}

// Full TimeEntry and related types are defined in the
// "Time Tracking Types (FEAT-S13)" section at the end of this file.

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
// Bid Intelligence Types
// ============================================

export type BidComparisonRating = 'excellent' | 'good' | 'fair' | 'high' | 'very_high';

export interface BidMarketComparison {
  bidAmount: number;
  marketLow: number;
  marketAverage: number;
  marketHigh: number;
  percentileRank: number; // 0-100, where 50 is average
  rating: BidComparisonRating;
  recommendation: string;
}

export interface BidHistoryComparison {
  bidAmount: number;
  subAverageBid: number;
  subLowestBid: number;
  subHighestBid: number;
  totalBidsFromSub: number;
  percentChange: number; // vs their average
  trend: 'increasing' | 'stable' | 'decreasing';
}

export interface BidAnalysis {
  id: string;
  bidId: string;
  projectId: string;
  subId: string;
  trade: string;
  analyzedAt: Date;
  marketComparison: BidMarketComparison;
  historyComparison?: BidHistoryComparison;
  competitorComparison?: {
    totalBidsReceived: number;
    rank: number; // 1 = lowest bid
    averageOfAllBids: number;
    lowestBid: number;
    highestBid: number;
  };
  overallScore: number; // 0-100
  flags: BidFlag[];
  recommendation: 'strongly_recommend' | 'recommend' | 'neutral' | 'caution' | 'avoid';
}

export interface BidFlag {
  type: 'warning' | 'info' | 'positive';
  code: string;
  message: string;
}

export type SubcontractorScoreCategory =
  | 'quality'
  | 'reliability'
  | 'communication'
  | 'price_competitiveness'
  | 'safety';

export interface SubcontractorScoreBreakdown {
  category: SubcontractorScoreCategory;
  score: number; // 0-100
  weight: number; // 0-1
  dataPoints: number;
  trend?: 'improving' | 'stable' | 'declining';
}

export interface SubcontractorIntelligence {
  subId: string;
  overallScore: number; // 0-100
  scoreBreakdown: SubcontractorScoreBreakdown[];
  performanceMetrics: {
    projectsCompleted: number;
    onTimeCompletionRate: number; // 0-100
    budgetAdherenceRate: number; // 0-100
    avgChangeOrderRate: number; // percent of original contract
    warrantyCallbackRate: number; // percent with callbacks
    repeatHireRate: number; // 0-100
  };
  pricingMetrics: {
    avgBidVsMarket: number; // percent, 100 = at market rate
    bidAcceptanceRate: number; // 0-100
    avgNegotiationDiscount: number; // percent typically negotiated
    priceConsistency: number; // 0-100, higher = more consistent
  };
  reliabilityMetrics: {
    showUpRate: number; // 0-100
    avgDelayDays: number;
    communicationRating: number; // 0-5
    documentCompleteness: number; // 0-100
  };
  recommendations: string[];
  lastUpdated: Date;
}

export interface BidRecommendation {
  projectId: string;
  trade: string;
  recommendedSubIds: string[];
  optimalBidCount: number;
  marketTiming: 'favorable' | 'neutral' | 'unfavorable';
  marketTimingReason?: string;
  estimatedMarketRate: {
    low: number;
    average: number;
    high: number;
  };
  suggestedDeadline: Date;
  notes: string[];
}

export const BID_COMPARISON_RATINGS: Record<BidComparisonRating, { label: string; color: string; description: string }> = {
  excellent: { label: 'Excellent Value', color: 'green', description: 'Well below market average' },
  good: { label: 'Good Value', color: 'emerald', description: 'Below market average' },
  fair: { label: 'Fair Price', color: 'yellow', description: 'At market average' },
  high: { label: 'Above Market', color: 'orange', description: 'Above market average' },
  very_high: { label: 'Premium Price', color: 'red', description: 'Well above market average' },
};

export const SUBCONTRACTOR_SCORE_CATEGORIES: Record<SubcontractorScoreCategory, { label: string; icon: string; weight: number }> = {
  quality: { label: 'Work Quality', icon: 'StarIcon', weight: 0.3 },
  reliability: { label: 'Reliability', icon: 'ClockIcon', weight: 0.25 },
  communication: { label: 'Communication', icon: 'ChatBubbleLeftRightIcon', weight: 0.15 },
  price_competitiveness: { label: 'Price', icon: 'CurrencyDollarIcon', weight: 0.2 },
  safety: { label: 'Safety', icon: 'ShieldCheckIcon', weight: 0.1 },
};


// ============================================
// Sub Compliance & Performance (Sprint 116)
// ============================================

export type ComplianceDocType = 'insurance_coi' | 'w9' | 'business_license' | 'workers_comp' | 'bond' | 'safety_cert' | 'other';
export type ComplianceStatus = 'valid' | 'expiring_soon' | 'expired' | 'missing';

export interface ComplianceDocument {
  id: string;
  orgId: string;
  subcontractorId: string;
  type: ComplianceDocType;
  name: string;
  fileUrl?: string;
  fileName?: string;
  issueDate?: Date;
  expiryDate?: Date;
  status: ComplianceStatus;
  notes?: string;
  verifiedBy?: string;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubPerformanceMetrics {
  subcontractorId: string;
  orgId: string;
  totalProjects: number;
  completedProjects: number;
  onTimePercentage: number;
  averageQualityRating: number; // 1-5
  totalBidsSubmitted: number;
  bidsWon: number;
  winRate: number;
  averageResponseTime: number; // hours
  lastUpdated: Date;
}

export type SubOnboardingStepId = 'company_info' | 'insurance' | 'w9' | 'banking' | 'safety_certs' | 'agreement';
export type SubOnboardingStepStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

export interface SubOnboardingStep {
  id: SubOnboardingStepId;
  label: string;
  description: string;
  status: SubOnboardingStepStatus;
  completedAt?: Date;
  requiredDocType?: ComplianceDocType;
}

export const COMPLIANCE_DOC_TYPE_LABELS: Record<ComplianceDocType, string> = {
  insurance_coi: 'Certificate of Insurance',
  w9: 'W-9 Form',
  business_license: 'Business License',
  workers_comp: "Workers' Compensation",
  bond: 'Surety Bond',
  safety_cert: 'Safety Certification',
  other: 'Other',
};

export const COMPLIANCE_STATUS_LABELS: Record<ComplianceStatus, string> = {
  valid: 'Valid',
  expiring_soon: 'Expiring Soon',
  expired: 'Expired',
  missing: 'Missing',
};

// ============================================
// Project Intelligence Types
// ============================================

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface ProjectRiskIndicator {
  id: string;
  type: ProjectRiskType;
  level: RiskLevel;
  title: string;
  description: string;
  impact: string;
  mitigation?: string;
  relatedEntityId?: string;
  relatedEntityType?: 'task' | 'phase' | 'expense' | 'subcontractor';
  detectedAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
}

export type ProjectRiskType =
  | 'thin_margin'
  | 'scope_creep'
  | 'schedule_delay'
  | 'weather_risk'
  | 'resource_conflict'
  | 'budget_overrun'
  | 'sub_reliability'
  | 'permit_delay'
  | 'material_cost_increase'
  | 'change_order_pattern';

export interface ProfitabilityForecast {
  projectId: string;
  forecastDate: Date;
  estimatedRevenue: number;
  estimatedCosts: number;
  estimatedProfit: number;
  estimatedMargin: number; // percentage
  confidence: number; // 0-100
  factors: ProfitabilityFactor[];
  comparison?: {
    similarProjects: number;
    avgMargin: number;
    percentile: number;
  };
}

export interface ProfitabilityFactor {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number; // 0-1
  description: string;
}

export interface ProjectVarianceAnalysis {
  projectId: string;
  analyzedAt: Date;
  overall: {
    estimatedTotal: number;
    actualTotal: number;
    variance: number;
    variancePercent: number;
  };
  byCategory: Array<{
    category: string;
    estimated: number;
    actual: number;
    variance: number;
    variancePercent: number;
    notes?: string;
  }>;
  byPhase: Array<{
    phaseId: string;
    phaseName: string;
    estimated: number;
    actual: number;
    variance: number;
    variancePercent: number;
  }>;
  byTrade: Array<{
    trade: string;
    estimated: number;
    actual: number;
    variance: number;
    variancePercent: number;
  }>;
  insights: string[];
  lessonsLearned: string[];
}

export interface ProjectIntelligence {
  projectId: string;
  updatedAt: Date;
  profitabilityForecast: ProfitabilityForecast;
  riskIndicators: ProjectRiskIndicator[];
  overallRiskScore: number; // 0-100, higher = more risk
  healthScore: number; // 0-100, higher = healthier
  statusSummary: {
    scheduleStatus: 'ahead' | 'on_track' | 'behind' | 'at_risk';
    budgetStatus: 'under' | 'on_track' | 'over' | 'at_risk';
    qualityStatus: 'excellent' | 'good' | 'fair' | 'poor';
  };
  recommendations: ProjectRecommendation[];
  varianceAnalysis?: ProjectVarianceAnalysis;
}

export interface ProjectRecommendation {
  id: string;
  type: 'action' | 'insight' | 'warning';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  actionLabel?: string;
  actionType?: 'navigate' | 'modal' | 'api';
  actionPayload?: Record<string, unknown>;
}

export const RISK_LEVEL_STYLES: Record<RiskLevel, { bg: string; text: string; icon: string }> = {
  low: { bg: 'bg-green-100', text: 'text-green-800', icon: 'CheckCircleIcon' },
  medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: 'ExclamationTriangleIcon' },
  high: { bg: 'bg-orange-100', text: 'text-orange-800', icon: 'ExclamationTriangleIcon' },
  critical: { bg: 'bg-red-100', text: 'text-red-800', icon: 'XCircleIcon' },
};

export const RISK_TYPE_LABELS: Record<ProjectRiskType, string> = {
  thin_margin: 'Thin Margin',
  scope_creep: 'Scope Creep',
  schedule_delay: 'Schedule Delay',
  weather_risk: 'Weather Risk',
  resource_conflict: 'Resource Conflict',
  budget_overrun: 'Budget Overrun',
  sub_reliability: 'Subcontractor Reliability',
  permit_delay: 'Permit Delay',
  material_cost_increase: 'Material Cost Increase',
  change_order_pattern: 'Change Order Pattern',
};

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
// AP Invoice Types (PM-facing Accounts Payable)
// Note: Distinct from SubInvoice types in types/subcontractor.ts
// which are the sub-portal-facing invoice types.
// ============================================

export type APInvoiceStatus = 'draft' | 'submitted' | 'approved' | 'paid' | 'disputed';

export interface APLineItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

/**
 * Subcontractor invoice for Accounts Payable (AP) workflow.
 * Stored in: organizations/{orgId}/subcontractorInvoices/{invoiceId}
 */
export interface SubcontractorInvoice {
  id: string;
  orgId: string;

  // Vendor info (denormalized)
  vendorId: string;
  vendorName: string;

  // Project info (denormalized)
  projectId: string;
  projectName: string;

  // Invoice details
  invoiceNumber: string;
  invoiceDate: string; // ISO date string
  dueDate: string;     // ISO date string
  amount: number;
  description: string;
  lineItems: APLineItem[];

  // Status & approval
  status: APInvoiceStatus;
  approvedBy?: string;
  approvedAt?: Date;
  paidAt?: Date;
  paymentMethod?: string;
  checkNumber?: string;

  // Lien waiver tracking
  lienWaiverStatus: 'not_required' | 'pending' | 'received';
  lienWaiverId?: string;

  // Attachments
  attachmentUrls: string[];
  notes?: string;

  // Metadata
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
}

export const AP_INVOICE_STATUS_LABELS: Record<APInvoiceStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  approved: 'Approved',
  paid: 'Paid',
  disputed: 'Disputed',
};

export const AP_INVOICE_STATUS_COLORS: Record<APInvoiceStatus, string> = {
  draft: 'gray',
  submitted: 'blue',
  approved: 'green',
  paid: 'emerald',
  disputed: 'red',
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

  // OCR metadata (populated when receipt is scanned)
  ocrConfidence?: number; // 0.0-1.0
  ocrModel?: string; // e.g., "claude-haiku", "gemini-1.5-flash"
  ocrProcessingTimeMs?: number;
  lineItems?: Array<{
    description: string;
    quantity: number | null;
    unitPrice: number | null;
    totalPrice: number | null;
  }>;

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

export interface NavItemChild {
  label: string;
  href: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];       // Which roles can see this
  badge?: number;           // Notification count
  children?: NavItemChild[]; // Sub-navigation items for collapsible sections
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

// ============================================
// Recurring Invoice Types (Sprint 107)
// ============================================

export type RecurringFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually';

export interface RecurringInvoice {
  id: string;
  orgId: string;

  // Template info (used to create each invoice)
  templateName: string;
  type: InvoiceType;
  clientId?: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  billingAddress?: string;
  projectId?: string;
  projectName?: string;
  projectAddress?: string;
  lineItems: InvoiceLineItem[];
  paymentTerms: string;
  taxRate?: number;
  retainage?: number;
  discount?: number;
  discountType?: 'percent' | 'fixed';
  notes?: string;

  // Schedule
  frequency: RecurringFrequency;
  startDate: Date;
  endDate?: Date;
  nextGenerationDate: Date;
  dayOfMonth?: number; // For monthly: which day (1-28)
  dayOfWeek?: number; // For weekly: 0=Sun, 1=Mon, etc.

  // Auto-send
  autoSend: boolean;

  // Status
  isActive: boolean;
  lastGeneratedAt?: Date;
  lastGeneratedInvoiceId?: string;
  totalGenerated: number;

  // Metadata
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt?: Date;
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
  projectId?: string;
  projectName?: string;
  itemName: string;
  category?: string;
  manufacturer?: string;
  warrantyProvider?: string;
  warrantyNumber?: string;
  startDate: Date;
  endDate: Date;
  coverageDescription?: string;
  documentURL?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
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
  referenceNumber?: string;
  resolution?: string;
  resolvedAt?: Date;
}

// Permit Tracking Types
export type PermitStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'denied' | 'expired' | 'closed';
export type PermitType = 'building' | 'electrical' | 'plumbing' | 'mechanical' | 'demolition' | 'grading' | 'fence' | 'sign' | 'other';

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
  readBy?: Record<string, Date>; // userId → readAt timestamp
  createdAt: Date;
  updatedAt?: Date;
}

// ============================================
// Message Templates & Search (Sprint 115)
// ============================================

export type MessageTemplateCategory = 'general' | 'project_update' | 'scheduling' | 'payment' | 'change_order' | 'custom';

export interface MessageTemplate {
  id: string;
  orgId: string;
  name: string;
  category: MessageTemplateCategory;
  content: string;
  variables: string[]; // e.g. ['{{projectName}}', '{{clientName}}']
  isDefault: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReadReceipt {
  userId: string;
  userName: string;
  readAt: Date;
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

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface QuietHoursConfig {
  enabled: boolean;
  startTime: string; // "22:00" format
  endTime: string;   // "07:00" format
  days: DayOfWeek[];
  allowHighPriority: boolean;
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
    changeOrderPending: boolean;
    selectionPending: boolean;
    messages: boolean;
    mentions: boolean;
    dailyDigest: boolean;
  };
  push: {
    enabled: boolean;
    taskAssigned: boolean;
    taskDueSoon: boolean;
    invoicePaid: boolean;
    changeOrderPending: boolean;
    messages: boolean;
    mentions: boolean;
  };
  quietHours?: QuietHoursConfig;
  projectSettings?: NotificationProjectSettings[];
}

// Per-project notification settings
export interface NotificationProjectSettings {
  projectId: string;
  projectName?: string; // Cached for display purposes
  muted: boolean; // Mute all notifications from this project
  taskNotifications: boolean;
  rfiNotifications: boolean;
  expenseNotifications: boolean;
  changeOrderNotifications: boolean;
  updatedAt?: Date;
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

// Client preferences for projects (duplicated here for backwards compatibility)
// Canonical version is in ./domains/client.ts
export interface ClientPreferences {
  notes?: string;
  finishes?: FinishPreferences;
  inspirationImageUrls?: string[];  // legacy: URL-pasted images
  inspirationImages?: InspirationImage[]; // uploaded images with metadata
  budgetRange?: string;
  timelinePreference?: string;
}

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
  | 'review_request'
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
// Quote/Estimate PDF Template Types
// ============================================

/**
 * PDF layout style preset
 */
export type QuotePdfLayout = 'modern' | 'classic' | 'minimal' | 'professional';

/**
 * Font family for PDF generation
 */
export type QuotePdfFont = 'inter' | 'roboto' | 'open-sans' | 'lato' | 'poppins';

/**
 * Header layout style
 */
export type QuotePdfHeaderStyle = 'logo-left' | 'logo-right' | 'centered' | 'full-width-banner';

/**
 * Quote/Estimate PDF Template
 * Controls the visual styling and layout of generated PDF quotes/estimates
 */
export interface QuotePdfTemplate {
  id: string;
  orgId: string;

  // Basic info
  name: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;

  // Layout settings
  layout: QuotePdfLayout;
  font: QuotePdfFont;
  headerStyle: QuotePdfHeaderStyle;

  // Colors (hex format)
  primaryColor: string;      // Main accent color
  secondaryColor: string;    // Secondary accent
  textColor: string;         // Body text
  backgroundColor: string;   // Page background
  tableHeaderBg: string;     // Table header background
  tableAltRowBg: string;     // Alternating row color

  // Header customization
  header: {
    showLogo: boolean;
    logoSize: 'small' | 'medium' | 'large';
    showCompanyName: boolean;
    showAddress: boolean;
    showPhone: boolean;
    showEmail: boolean;
    showWebsite: boolean;
    customTagline?: string;
  };

  // Footer customization
  footer: {
    showPageNumbers: boolean;
    showValidUntil: boolean;
    showEstimateNumber: boolean;
    customText?: string;
    termsUrl?: string;
  };

  // Table styling
  tableSettings: {
    showQuantity: boolean;
    showUnit: boolean;
    showUnitPrice: boolean;
    showDescription: boolean;
    showOptionalBadge: boolean;
    groupBySection: boolean;
  };

  // Content sections to include
  sections: {
    showScopeOfWork: boolean;
    showExclusions: boolean;
    showPaymentTerms: boolean;
    showTermsAndConditions: boolean;
    showSignatureBlock: boolean;
    showDepositInfo: boolean;
    showValidUntil: boolean;
  };

  // Default content (can be overridden per estimate)
  defaultContent: {
    scopeOfWork?: string;
    exclusions?: string;
    paymentTerms?: string;
    termsAndConditions?: string;
    acceptanceText?: string;
  };

  // Metadata
  usageCount: number;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
  createdBy: string;
}

/**
 * Preset template configurations
 */
export const QUOTE_PDF_LAYOUTS: { value: QuotePdfLayout; label: string; description: string }[] = [
  { value: 'modern', label: 'Modern', description: 'Clean design with accent colors and clean lines' },
  { value: 'classic', label: 'Classic', description: 'Traditional layout with formal typography' },
  { value: 'minimal', label: 'Minimal', description: 'Simple, content-focused with subtle styling' },
  { value: 'professional', label: 'Professional', description: 'Corporate style with structured sections' },
];

export const QUOTE_PDF_FONTS: { value: QuotePdfFont; label: string }[] = [
  { value: 'inter', label: 'Inter' },
  { value: 'roboto', label: 'Roboto' },
  { value: 'open-sans', label: 'Open Sans' },
  { value: 'lato', label: 'Lato' },
  { value: 'poppins', label: 'Poppins' },
];

export const QUOTE_PDF_HEADER_STYLES: { value: QuotePdfHeaderStyle; label: string }[] = [
  { value: 'logo-left', label: 'Logo on Left' },
  { value: 'logo-right', label: 'Logo on Right' },
  { value: 'centered', label: 'Centered' },
  { value: 'full-width-banner', label: 'Full Width Banner' },
];

/**
 * Default template settings factory
 */
export const createDefaultQuotePdfTemplate = (orgId: string): Omit<QuotePdfTemplate, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> => ({
  orgId,
  name: 'Default Template',
  description: 'Standard estimate template',
  isDefault: true,
  isActive: true,
  layout: 'modern',
  font: 'inter',
  headerStyle: 'logo-left',
  primaryColor: '#2563eb',
  secondaryColor: '#1e40af',
  textColor: '#1f2937',
  backgroundColor: '#ffffff',
  tableHeaderBg: '#f3f4f6',
  tableAltRowBg: '#fafafa',
  header: {
    showLogo: true,
    logoSize: 'medium',
    showCompanyName: true,
    showAddress: true,
    showPhone: true,
    showEmail: true,
    showWebsite: false,
  },
  footer: {
    showPageNumbers: true,
    showValidUntil: true,
    showEstimateNumber: true,
  },
  tableSettings: {
    showQuantity: true,
    showUnit: true,
    showUnitPrice: true,
    showDescription: true,
    showOptionalBadge: true,
    groupBySection: false,
  },
  sections: {
    showScopeOfWork: true,
    showExclusions: true,
    showPaymentTerms: true,
    showTermsAndConditions: true,
    showSignatureBlock: true,
    showDepositInfo: true,
    showValidUntil: true,
  },
  defaultContent: {},
  usageCount: 0,
});

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
 * PTO / Time-Off balance tracking
 */
export interface PTOBalanceCategory {
  accrued: number; // hours accrued
  used: number;    // hours used
  balance: number; // accrued - used
}

export interface PTOBalance {
  userId: string;
  orgId: string;
  vacation: PTOBalanceCategory;
  sick: PTOBalanceCategory;
  personal: { total: number; used: number; balance: number };
  asOfDate: Date;
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
 * Material category trade groups for better organization
 */
export type MaterialCategoryGroup =
  | 'structural'
  | 'electrical'
  | 'plumbing'
  | 'hvac'
  | 'exterior'
  | 'interior'
  | 'finishes'
  | 'site_work'
  | 'equipment_tools'
  | 'general';

/**
 * Material category
 */
export type MaterialCategory =
  // Structural
  | 'lumber'
  | 'framing'
  | 'concrete'
  | 'masonry'
  | 'steel'
  // Electrical
  | 'electrical'
  | 'wiring'
  | 'lighting'
  | 'electrical_panels'
  | 'switches_outlets'
  // Plumbing
  | 'plumbing'
  | 'pipes_fittings'
  | 'fixtures'
  | 'water_heaters'
  | 'drainage'
  // HVAC
  | 'hvac'
  | 'ductwork'
  | 'hvac_equipment'
  | 'ventilation'
  // Exterior
  | 'roofing'
  | 'siding'
  | 'gutters'
  | 'windows'
  | 'doors'
  | 'garage_doors'
  | 'decking'
  | 'fencing'
  // Interior
  | 'drywall'
  | 'insulation'
  | 'cabinets'
  | 'countertops'
  | 'trim_molding'
  | 'stairs_railings'
  // Finishes
  | 'paint'
  | 'flooring'
  | 'tile'
  | 'carpet'
  | 'appliances'
  | 'hardware'
  // Site Work
  | 'landscaping'
  | 'irrigation'
  | 'pavers'
  | 'grading'
  // Equipment & Tools
  | 'tools'
  | 'equipment'
  | 'rental'
  | 'safety'
  // General
  | 'fasteners'
  | 'adhesives_sealants'
  | 'custom'
  | 'other';

/**
 * Material category info with grouping
 */
export interface MaterialCategoryInfo {
  value: MaterialCategory;
  label: string;
  group: MaterialCategoryGroup;
  description?: string;
}

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

// ============================================
// Material Request Types (Sprint 111)
// ============================================

export type MaterialRequestStatus = 'pending' | 'approved' | 'ordered' | 'delivered' | 'rejected';
export type MaterialRequestPriority = 'low' | 'normal' | 'urgent';

export const MATERIAL_REQUEST_STATUS_LABELS: Record<MaterialRequestStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  ordered: 'Ordered',
  delivered: 'Delivered',
  rejected: 'Rejected',
};

export const MATERIAL_REQUEST_PRIORITY_LABELS: Record<MaterialRequestPriority, string> = {
  low: 'Low',
  normal: 'Normal',
  urgent: 'Urgent',
};

export interface MaterialRequestItem {
  name: string;
  quantity: number;
  unit: string;
  notes?: string;
}

export interface MaterialRequest {
  id: string;
  orgId: string;
  projectId: string;
  projectName: string;
  requestedBy: string;
  requestedByName: string;
  items: MaterialRequestItem[];
  priority: MaterialRequestPriority;
  notes?: string;
  status: MaterialRequestStatus;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
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
 * Category group labels
 */
export const MATERIAL_CATEGORY_GROUPS: { value: MaterialCategoryGroup; label: string }[] = [
  { value: 'structural', label: 'Structural' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'exterior', label: 'Exterior' },
  { value: 'interior', label: 'Interior' },
  { value: 'finishes', label: 'Finishes' },
  { value: 'site_work', label: 'Site Work' },
  { value: 'equipment_tools', label: 'Equipment & Tools' },
  { value: 'general', label: 'General' },
];

/**
 * Constants for materials with trade-based grouping
 */
export const MATERIAL_CATEGORIES: MaterialCategoryInfo[] = [
  // Structural
  { value: 'lumber', label: 'Lumber', group: 'structural', description: '2x4s, plywood, OSB, treated lumber' },
  { value: 'framing', label: 'Framing', group: 'structural', description: 'Studs, joists, headers, trusses' },
  { value: 'concrete', label: 'Concrete', group: 'structural', description: 'Ready-mix, bags, rebar, forms' },
  { value: 'masonry', label: 'Masonry', group: 'structural', description: 'Blocks, bricks, mortar, stone' },
  { value: 'steel', label: 'Steel', group: 'structural', description: 'Beams, columns, metal framing' },

  // Electrical
  { value: 'electrical', label: 'Electrical (General)', group: 'electrical', description: 'General electrical supplies' },
  { value: 'wiring', label: 'Wiring & Cable', group: 'electrical', description: 'Romex, conduit, wire' },
  { value: 'lighting', label: 'Lighting', group: 'electrical', description: 'Fixtures, bulbs, LED' },
  { value: 'electrical_panels', label: 'Panels & Breakers', group: 'electrical', description: 'Load centers, breakers, disconnects' },
  { value: 'switches_outlets', label: 'Switches & Outlets', group: 'electrical', description: 'Receptacles, switches, covers' },

  // Plumbing
  { value: 'plumbing', label: 'Plumbing (General)', group: 'plumbing', description: 'General plumbing supplies' },
  { value: 'pipes_fittings', label: 'Pipes & Fittings', group: 'plumbing', description: 'PVC, copper, PEX, fittings' },
  { value: 'fixtures', label: 'Fixtures', group: 'plumbing', description: 'Sinks, faucets, toilets, tubs' },
  { value: 'water_heaters', label: 'Water Heaters', group: 'plumbing', description: 'Tank, tankless, parts' },
  { value: 'drainage', label: 'Drainage', group: 'plumbing', description: 'Drains, P-traps, vents' },

  // HVAC
  { value: 'hvac', label: 'HVAC (General)', group: 'hvac', description: 'General HVAC supplies' },
  { value: 'ductwork', label: 'Ductwork', group: 'hvac', description: 'Ducts, boots, registers, grilles' },
  { value: 'hvac_equipment', label: 'HVAC Equipment', group: 'hvac', description: 'Units, compressors, handlers' },
  { value: 'ventilation', label: 'Ventilation', group: 'hvac', description: 'Exhaust fans, range hoods, HRV' },

  // Exterior
  { value: 'roofing', label: 'Roofing', group: 'exterior', description: 'Shingles, underlayment, flashing' },
  { value: 'siding', label: 'Siding', group: 'exterior', description: 'Vinyl, fiber cement, wood' },
  { value: 'gutters', label: 'Gutters', group: 'exterior', description: 'Gutters, downspouts, guards' },
  { value: 'windows', label: 'Windows', group: 'exterior', description: 'Windows, skylights, glass' },
  { value: 'doors', label: 'Doors', group: 'exterior', description: 'Entry, storm, patio doors' },
  { value: 'garage_doors', label: 'Garage Doors', group: 'exterior', description: 'Doors, openers, hardware' },
  { value: 'decking', label: 'Decking', group: 'exterior', description: 'Deck boards, railings, posts' },
  { value: 'fencing', label: 'Fencing', group: 'exterior', description: 'Fence panels, posts, gates' },

  // Interior
  { value: 'drywall', label: 'Drywall', group: 'interior', description: 'Sheets, tape, mud, corner bead' },
  { value: 'insulation', label: 'Insulation', group: 'interior', description: 'Batts, blown-in, foam' },
  { value: 'cabinets', label: 'Cabinets', group: 'interior', description: 'Kitchen, bath, storage' },
  { value: 'countertops', label: 'Countertops', group: 'interior', description: 'Granite, quartz, laminate' },
  { value: 'trim_molding', label: 'Trim & Molding', group: 'interior', description: 'Baseboards, crown, casing' },
  { value: 'stairs_railings', label: 'Stairs & Railings', group: 'interior', description: 'Treads, risers, balusters' },

  // Finishes
  { value: 'paint', label: 'Paint', group: 'finishes', description: 'Interior, exterior, primers' },
  { value: 'flooring', label: 'Flooring', group: 'finishes', description: 'Hardwood, LVP, laminate' },
  { value: 'tile', label: 'Tile', group: 'finishes', description: 'Ceramic, porcelain, stone' },
  { value: 'carpet', label: 'Carpet', group: 'finishes', description: 'Carpet, padding, transitions' },
  { value: 'appliances', label: 'Appliances', group: 'finishes', description: 'Kitchen, laundry appliances' },
  { value: 'hardware', label: 'Hardware', group: 'finishes', description: 'Knobs, pulls, hinges, locks' },

  // Site Work
  { value: 'landscaping', label: 'Landscaping', group: 'site_work', description: 'Plants, mulch, soil, sod' },
  { value: 'irrigation', label: 'Irrigation', group: 'site_work', description: 'Sprinklers, drip, controllers' },
  { value: 'pavers', label: 'Pavers & Hardscape', group: 'site_work', description: 'Pavers, retaining walls' },
  { value: 'grading', label: 'Grading & Drainage', group: 'site_work', description: 'French drains, fill, gravel' },

  // Equipment & Tools
  { value: 'tools', label: 'Tools', group: 'equipment_tools', description: 'Hand tools, power tools' },
  { value: 'equipment', label: 'Equipment', group: 'equipment_tools', description: 'Heavy equipment, machinery' },
  { value: 'rental', label: 'Rental Equipment', group: 'equipment_tools', description: 'Rented tools & equipment' },
  { value: 'safety', label: 'Safety Equipment', group: 'equipment_tools', description: 'PPE, barriers, signage' },

  // General
  { value: 'fasteners', label: 'Fasteners', group: 'general', description: 'Nails, screws, bolts, anchors' },
  { value: 'adhesives_sealants', label: 'Adhesives & Sealants', group: 'general', description: 'Caulk, glue, foam, tape' },
  { value: 'custom', label: 'Custom Category', group: 'general', description: 'User-defined category' },
  { value: 'other', label: 'Other', group: 'general', description: 'Miscellaneous items' },
];

/**
 * Get categories organized by group
 */
export function getMaterialCategoriesByGroup(): Record<MaterialCategoryGroup, MaterialCategoryInfo[]> {
  const grouped: Record<MaterialCategoryGroup, MaterialCategoryInfo[]> = {
    structural: [],
    electrical: [],
    plumbing: [],
    hvac: [],
    exterior: [],
    interior: [],
    finishes: [],
    site_work: [],
    equipment_tools: [],
    general: [],
  };

  MATERIAL_CATEGORIES.forEach((cat) => {
    grouped[cat.group].push(cat);
  });

  return grouped;
}

/**
 * Legacy flat category list for backward compatibility
 */
export const MATERIAL_CATEGORIES_FLAT: { value: MaterialCategory; label: string }[] =
  MATERIAL_CATEGORIES.map(({ value, label }) => ({ value, label }));

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

// ============================================
// Time Tracking Types (FEAT-S13)
// ============================================

export type TimeEntryStatus = 'active' | 'paused' | 'completed' | 'pending_approval' | 'approved' | 'rejected';

export type TimeEntryType = 'clock' | 'manual' | 'imported';

export type BreakType = 'lunch' | 'short' | 'other';

export interface TimeEntryBreak {
  id: string;
  type: BreakType;
  startTime: Date;
  endTime?: Date;
  duration?: number; // minutes
  isPaid: boolean;
}

export interface TimeEntryLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  address?: string;
  timestamp: Date;
}

export interface TimeEntry {
  id: string;
  orgId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  projectId?: string;
  projectName?: string;
  taskId?: string;
  taskName?: string;
  type: TimeEntryType;
  status: TimeEntryStatus;

  // Time data
  clockIn: Date;
  clockOut?: Date;
  totalMinutes?: number;        // Calculated: clockOut - clockIn - unpaid breaks
  billableMinutes?: number;     // Subset that's billable

  // Breaks
  breaks: TimeEntryBreak[];
  totalBreakMinutes?: number;

  // Location tracking
  clockInLocation?: TimeEntryLocation;
  clockOutLocation?: TimeEntryLocation;
  locationHistory?: TimeEntryLocation[]; // For continuous tracking

  // Rates
  hourlyRate?: number;
  overtimeRate?: number;        // Usually 1.5x
  isOvertime?: boolean;

  // Notes & metadata
  notes?: string;
  tags?: string[];

  // Approval workflow
  submittedAt?: Date;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedByName?: string;
  rejectedAt?: Date;
  rejectionReason?: string;

  // Audit
  createdAt: Date;
  updatedAt?: Date;
  editedBy?: string;
  editHistory?: TimeEntryEdit[];
}

export interface TimeEntryEdit {
  editedAt: Date;
  editedBy: string;
  editedByName: string;
  field: string;
  oldValue: string;
  newValue: string;
  reason?: string;
}

export interface TimesheetPeriod {
  id: string;
  orgId: string;
  userId: string;
  userName: string;
  startDate: Date;
  endDate: Date;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  totalBreakHours: number;
  entries: string[]; // TimeEntry IDs
  submittedAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface TimeTrackingSettings {
  orgId: string;
  requireGeoLocation: boolean;
  geoFenceRadius?: number;      // meters
  projectGeoFences?: {
    projectId: string;
    lat: number;
    lng: number;
    radius: number;
  }[];
  autoClockOutAfter?: number;   // minutes of inactivity
  requireProjectSelection: boolean;
  requireTaskSelection: boolean;
  allowManualEntry: boolean;
  requireApproval: boolean;
  approvers?: string[];         // User IDs who can approve
  overtimeThreshold: number;    // hours per day (default 8)
  weeklyOvertimeThreshold: number; // hours per week (default 40)
  paidBreakMinutes: number;     // Default paid break per day
  workWeekStart: 'sunday' | 'monday';
  roundingInterval?: 0 | 5 | 6 | 15; // Round to nearest X minutes (0 = no rounding)
  roundingRule?: 'nearest' | 'up' | 'down';
}

export interface DailyTimeSummary {
  date: string; // ISO date
  userId: string;
  userName: string;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  breakHours: number;
  entries: TimeEntry[];
  projectBreakdown: {
    projectId: string;
    projectName: string;
    hours: number;
  }[];
}

export interface WeeklyTimeSummary {
  userId: string;
  userName: string;
  weekStart: Date;
  weekEnd: Date;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  breakHours: number;
  dailySummaries: DailyTimeSummary[];
  projectBreakdown: {
    projectId: string;
    projectName: string;
    hours: number;
  }[];
}

// Time entry status constants
export const TIME_ENTRY_STATUSES: { value: TimeEntryStatus; label: string; color: string }[] = [
  { value: 'active', label: 'Clocked In', color: '#10b981' },
  { value: 'paused', label: 'On Break', color: '#f59e0b' },
  { value: 'completed', label: 'Completed', color: '#6b7280' },
  { value: 'pending_approval', label: 'Pending Approval', color: '#3b82f6' },
  { value: 'approved', label: 'Approved', color: '#10b981' },
  { value: 'rejected', label: 'Rejected', color: '#ef4444' },
];

export const BREAK_TYPES: { value: BreakType; label: string; defaultMinutes: number; isPaid: boolean }[] = [
  { value: 'lunch', label: 'Lunch Break', defaultMinutes: 30, isPaid: false },
  { value: 'short', label: 'Short Break', defaultMinutes: 15, isPaid: true },
  { value: 'other', label: 'Other', defaultMinutes: 15, isPaid: false },
];

// ============================================
// Team Location Tracking Types (Sprint 13)
// ============================================

export interface TeamMemberLocation {
  id: string;
  orgId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  // Current location
  lat: number;
  lng: number;
  accuracy?: number;
  heading?: number;           // Direction in degrees
  speed?: number;             // Speed in m/s
  altitude?: number;
  address?: string;           // Reverse geocoded
  // Context
  projectId?: string;
  projectName?: string;
  status: 'active' | 'idle' | 'offline';
  isClockingIn: boolean;      // Currently clocked in
  // Vehicle info
  vehicleId?: string;
  vehicleName?: string;
  // Timestamps
  lastUpdated: Date;
  createdAt: Date;
}

export interface VehicleLocation {
  id: string;
  orgId: string;
  // Vehicle details
  vehicleId: string;
  name: string;
  type: 'truck' | 'van' | 'car' | 'trailer' | 'equipment' | 'other';
  licensePlate?: string;
  make?: string;
  model?: string;
  year?: number;
  // Current location
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  // Assignment
  assignedToUserId?: string;
  assignedToUserName?: string;
  projectId?: string;
  projectName?: string;
  // Status
  status: 'moving' | 'parked' | 'offline';
  engineOn?: boolean;
  fuelLevel?: number;         // 0-100%
  odometer?: number;          // Miles
  // Timestamps
  lastUpdated: Date;
  createdAt: Date;
}

export interface Vehicle {
  id: string;
  orgId: string;
  name: string;
  type: 'truck' | 'van' | 'car' | 'trailer' | 'equipment' | 'other';
  licensePlate?: string;
  make?: string;
  model?: string;
  year?: number;
  vin?: string;
  color?: string;
  // Assignment
  assignedToUserId?: string;
  assignedToUserName?: string;
  // Tracking
  hasGpsTracker: boolean;
  trackerDeviceId?: string;
  // Maintenance
  lastServiceDate?: Date;
  nextServiceDue?: Date;
  odometerReading?: number;
  // Status
  status: 'active' | 'maintenance' | 'inactive';
  notes?: string;
  // Timestamps
  createdAt: Date;
  updatedAt?: Date;
}

export interface LocationHistoryEntry {
  lat: number;
  lng: number;
  timestamp: Date;
  accuracy?: number;
  speed?: number;
  heading?: number;
  source: 'user' | 'vehicle';
  sourceId: string;           // userId or vehicleId
}

export const VEHICLE_TYPES: { value: Vehicle['type']; label: string; icon: string }[] = [
  { value: 'truck', label: 'Truck', icon: '🚚' },
  { value: 'van', label: 'Van', icon: '🚐' },
  { value: 'car', label: 'Car', icon: '🚗' },
  { value: 'trailer', label: 'Trailer', icon: '🚛' },
  { value: 'equipment', label: 'Equipment', icon: '🚜' },
  { value: 'other', label: 'Other', icon: '🚙' },
];

// ============================================
// Weather Risk Assessment Types (Sprint 13)
// ============================================

export type WeatherRiskLevel = 'none' | 'low' | 'moderate' | 'high' | 'severe';

export interface WeatherRiskAssessment {
  projectId: string;
  projectName: string;
  phaseId?: string;
  phaseName?: string;
  // Weather data
  forecastDate: Date;
  condition: WeatherCondition;
  temperature: number;        // Fahrenheit
  precipitation: number;      // Probability %
  windSpeed: number;          // mph
  humidity: number;           // %
  // Risk assessment
  overallRisk: WeatherRiskLevel;
  riskFactors: WeatherRiskFactor[];
  affectedTrades: string[];
  recommendedActions: string[];
  // Impact
  estimatedDelayHours?: number;
  shouldPauseWork: boolean;
}

export interface WeatherRiskFactor {
  type: 'temperature' | 'precipitation' | 'wind' | 'humidity' | 'storm' | 'snow' | 'heat' | 'cold';
  severity: WeatherRiskLevel;
  description: string;
  threshold?: string;         // e.g., "Wind > 25 mph"
}

export interface ProjectWeatherForecast {
  projectId: string;
  projectName: string;
  projectAddress?: string;
  lat?: number;
  lng?: number;
  // 5-day forecast
  forecasts: DailyWeatherForecast[];
  // Risk summary
  highRiskDays: number;
  nextRiskyDay?: Date;
  // Timestamps
  fetchedAt: Date;
}

export interface DailyWeatherForecast {
  date: Date;
  condition: WeatherCondition;
  highTemp: number;
  lowTemp: number;
  precipitation: number;
  windSpeed: number;
  windDirection?: string;
  humidity: number;
  sunrise?: string;
  sunset?: string;
  uvIndex?: number;
  riskLevel: WeatherRiskLevel;
  riskFactors: WeatherRiskFactor[];
}

export const WEATHER_RISK_LEVELS: { value: WeatherRiskLevel; label: string; color: string }[] = [
  { value: 'none', label: 'Clear', color: '#10b981' },
  { value: 'low', label: 'Low Risk', color: '#22c55e' },
  { value: 'moderate', label: 'Moderate Risk', color: '#f59e0b' },
  { value: 'high', label: 'High Risk', color: '#ef4444' },
  { value: 'severe', label: 'Severe Risk', color: '#7c2d12' },
];

// Trade-specific weather thresholds
export const TRADE_WEATHER_THRESHOLDS: Record<string, {
  minTemp?: number;
  maxTemp?: number;
  maxWind?: number;
  maxPrecipitation?: number;
  description: string;
}> = {
  roofing: { maxWind: 25, maxPrecipitation: 20, description: 'High winds and rain affect roofing safety' },
  concrete: { minTemp: 40, maxTemp: 90, maxPrecipitation: 30, description: 'Temperature affects curing; rain damages fresh concrete' },
  painting: { minTemp: 50, maxTemp: 85, maxPrecipitation: 10, description: 'Paint requires specific temp range and dry conditions' },
  landscaping: { maxPrecipitation: 50, description: 'Heavy rain makes ground unworkable' },
  framing: { maxWind: 30, maxPrecipitation: 40, description: 'High winds dangerous for framing work' },
  electrical: { maxPrecipitation: 30, description: 'Rain creates electrical hazards' },
  plumbing: { minTemp: 32, description: 'Frozen pipes risk below freezing' },
  siding: { maxWind: 20, maxPrecipitation: 20, description: 'Vinyl siding brittle in cold, difficult in rain' },
  masonry: { minTemp: 40, maxPrecipitation: 30, description: 'Mortar needs proper temp to set' },
  excavation: { maxPrecipitation: 40, description: 'Heavy rain causes unstable soil' },
};

// ============================================
// Daily Log / Journal Types (FEAT-S17)
// ============================================

export type DailyLogCategory =
  | 'general'
  | 'progress'
  | 'issue'
  | 'safety'
  | 'weather'
  | 'delivery'
  | 'inspection'
  | 'client_interaction'
  | 'subcontractor'
  | 'equipment';

// Note: WeatherCondition is defined above in the Schedule section

export interface DailyLogPhoto {
  id: string;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  uploadedAt: Date;
}

export interface DailyLogEntry {
  id: string;
  orgId: string;
  projectId: string;
  projectName: string;
  userId: string;
  userName: string;
  date: string; // ISO date string (YYYY-MM-DD)

  // Content
  category: DailyLogCategory;
  title: string;
  description: string;

  // Media
  photos: DailyLogPhoto[];

  // Weather (optional)
  weather?: {
    condition: WeatherCondition;
    temperatureHigh?: number;
    temperatureLow?: number;
    precipitation?: number; // percentage
    notes?: string;
  };

  // Work details
  crewCount?: number;
  crewMembers?: string[]; // User IDs
  hoursWorked?: number;
  workPerformed?: string[];

  // Safety
  safetyIncidents?: number;
  safetyNotes?: string;

  // Visitors/Inspections
  visitors?: {
    name: string;
    company?: string;
    purpose: string;
    arrivalTime?: string;
    departureTime?: string;
  }[];

  // Deliveries
  deliveries?: {
    supplier: string;
    items: string;
    quantity?: string;
    receivedBy?: string;
    time?: string;
  }[];

  // Issues/Delays
  issues?: {
    description: string;
    impact: 'low' | 'medium' | 'high';
    resolved: boolean;
    resolution?: string;
  }[];

  // Tags for filtering
  tags?: string[];

  // Flags
  isPrivate?: boolean; // Only visible to PMs/Owners
  requiresFollowUp?: boolean;
  followUpDate?: Date;

  // Metadata
  createdAt: Date;
  updatedAt?: Date;
  editedBy?: string;
}

export interface DailyLogSummary {
  date: string;
  projectId: string;
  projectName: string;
  totalEntries: number;
  categories: Record<DailyLogCategory, number>;
  crewCount: number;
  hoursWorked: number;
  issueCount: number;
  photoCount: number;
  weather?: {
    condition: WeatherCondition;
    temperatureHigh?: number;
    temperatureLow?: number;
  };
}

// Category constants with display info
export const DAILY_LOG_CATEGORIES: { value: DailyLogCategory; label: string; icon: string; color: string }[] = [
  { value: 'general', label: 'General', icon: 'clipboard', color: '#6b7280' },
  { value: 'progress', label: 'Progress', icon: 'trending-up', color: '#10b981' },
  { value: 'issue', label: 'Issue', icon: 'exclamation-triangle', color: '#ef4444' },
  { value: 'safety', label: 'Safety', icon: 'shield-check', color: '#f59e0b' },
  { value: 'weather', label: 'Weather', icon: 'cloud', color: '#3b82f6' },
  { value: 'delivery', label: 'Delivery', icon: 'truck', color: '#8b5cf6' },
  { value: 'inspection', label: 'Inspection', icon: 'clipboard-check', color: '#0891b2' },
  { value: 'client_interaction', label: 'Client', icon: 'user', color: '#ec4899' },
  { value: 'subcontractor', label: 'Subcontractor', icon: 'users', color: '#6366f1' },
  { value: 'equipment', label: 'Equipment', icon: 'wrench', color: '#84cc16' },
];

// Note: WEATHER_CONDITIONS is defined above in the Schedule section
// Daily logs reuse that same constant for consistency

// Note: Expense types (ExpenseCategory, ExpenseStatus, PaymentMethod, Expense, ExpenseSummary, ExpenseReceipt)
// and constants (EXPENSE_CATEGORIES, EXPENSE_STATUSES, PAYMENT_METHODS) are defined earlier in the file
// in the "Expense Types" section

// ============================================
// Payroll Module Types
// ============================================

// Payroll run status
export type PayrollRunStatus = 'draft' | 'pending_approval' | 'approved' | 'processing' | 'completed' | 'cancelled';

// Pay period configuration
export interface PayPeriod {
  id: string;
  type: PaySchedule;
  startDate: Date;
  endDate: Date;
  payDate: Date;
  label: string; // e.g., "Jan 1-15, 2026"
}

// Payroll adjustment (bonuses, deductions, reimbursements)
export type PayrollAdjustmentType = 'bonus' | 'commission' | 'reimbursement' | 'deduction' | 'garnishment' | 'advance' | 'other';

export interface PayrollAdjustment {
  id: string;
  type: PayrollAdjustmentType;
  description: string;
  amount: number; // Positive for additions, negative for deductions
  taxable: boolean;
  notes?: string;
}

// Payroll entry for one employee in one pay period
export interface PayrollEntry {
  id: string;
  payrollRunId: string;
  employeeId: string;
  employeeName: string;
  employeeType: EmployeeType;

  // Hours breakdown
  regularHours: number;
  overtimeHours: number;      // Hours over 8/day or 40/week
  doubleTimeHours: number;    // e.g., 7th consecutive day, holidays
  ptoHours: number;
  sickHours: number;
  holidayHours: number;

  // Rates
  regularRate: number;        // Hourly rate
  overtimeRate: number;       // Multiplier (e.g., 1.5)
  doubleTimeRate: number;     // Multiplier (e.g., 2.0)

  // Earnings breakdown
  regularPay: number;
  overtimePay: number;
  doubleTimePay: number;
  ptoPay: number;
  sickPay: number;
  holidayPay: number;
  bonuses: number;
  commissions: number;
  reimbursements: number;     // Non-taxable
  grossPay: number;

  // Deductions breakdown (estimates)
  federalWithholding: number;
  stateWithholding: number;
  socialSecurity: number;     // 6.2% up to wage base
  medicare: number;           // 1.45% (+ 0.9% additional above threshold)
  localTax: number;
  retirement401k: number;
  healthInsurance: number;
  otherDeductions: number;
  totalDeductions: number;

  // Net pay
  netPay: number;

  // Source tracking
  timeEntryIds: string[];     // Time entries used for calculation
  adjustments: PayrollAdjustment[];

  // YTD totals (for reference)
  ytdGrossPay: number;
  ytdFederalWithholding: number;
  ytdStateWithholding: number;
  ytdSocialSecurity: number;
  ytdMedicare: number;

  // Notes and flags
  notes?: string;
  hasManualOverrides: boolean;
  overrideReason?: string;
}

// Complete payroll run for an organization
export interface PayrollRun {
  id: string;
  orgId: string;
  runNumber: number;          // Sequential run number for the year

  // Pay period
  payPeriod: PayPeriod;

  // Status
  status: PayrollRunStatus;

  // Entries (one per employee)
  entries: PayrollEntry[];
  employeeCount: number;

  // Totals
  totalRegularHours: number;
  totalOvertimeHours: number;
  totalGrossPay: number;
  totalDeductions: number;
  totalNetPay: number;

  // Approval workflow
  createdBy: string;
  createdByName: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: Date;

  // Processing
  processedAt?: Date;
  processedBy?: string;

  // Export tracking
  exportedAt?: Date;
  exportFormat?: 'csv' | 'pdf' | 'gusto' | 'adp' | 'quickbooks';

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Tax calculation inputs
export interface TaxCalculationInput {
  grossPay: number;
  payPeriodType: PaySchedule;
  filingStatus: W4Info['filingStatus'];
  allowances: number;
  additionalWithholding: number;
  isExempt: boolean;
  stateCode: string;          // e.g., 'NC', 'CA'
  ytdGrossPay: number;        // For social security wage cap
}

// Tax calculation result
export interface TaxCalculation {
  grossPay: number;
  federalWithholding: number;
  stateWithholding: number;
  socialSecurity: number;
  medicare: number;
  totalTax: number;
  effectiveRate: number;      // Percentage
}

// Payroll settings for the organization
export interface PayrollSettings {
  id: string;
  orgId: string;

  // Default pay schedule
  defaultPaySchedule: PaySchedule;

  // Pay dates
  payDayOfWeek?: number;      // 0-6 for weekly/bi-weekly
  payDayOfMonth?: number;     // 1-31 for monthly/semi-monthly
  semiMonthlyPayDays?: [number, number]; // e.g., [15, 30]

  // Overtime rules
  dailyOvertimeThreshold: number;    // Hours (default 8)
  weeklyOvertimeThreshold: number;   // Hours (default 40)
  overtimeMultiplier: number;        // Default 1.5
  doubleTimeMultiplier: number;      // Default 2.0
  enableDailyOvertime: boolean;      // Some states require daily OT
  enableSeventhDayOvertime: boolean; // 7th consecutive day = OT

  // State/locality
  stateCode: string;
  localTaxRate?: number;

  // Employer contributions (for display/reporting)
  employerSocialSecurityRate: number;  // 6.2%
  employerMedicareRate: number;        // 1.45%
  employerFutaRate: number;            // 0.6% (after credit)
  employerSutaRate?: number;           // Varies by state

  // Benefits deductions defaults
  defaultRetirementPercent?: number;
  healthInsuranceAmount?: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Pay stub for PDF generation
export interface PayStub {
  employee: {
    name: string;
    id: string;
    address?: string;
    ssn?: string;             // Last 4 only: ***-**-1234
  };
  employer: {
    name: string;
    address?: string;
    ein?: string;
  };
  payPeriod: PayPeriod;
  payDate: Date;
  checkNumber?: string;

  // Current period
  currentEarnings: {
    regular: { hours: number; rate: number; amount: number };
    overtime: { hours: number; rate: number; amount: number };
    doubleTime: { hours: number; rate: number; amount: number };
    pto: { hours: number; rate: number; amount: number };
    sick: { hours: number; rate: number; amount: number };
    holiday: { hours: number; rate: number; amount: number };
    bonuses: number;
    commissions: number;
    reimbursements: number;
    grossPay: number;
  };

  currentDeductions: {
    federal: number;
    state: number;
    socialSecurity: number;
    medicare: number;
    local: number;
    retirement: number;
    healthInsurance: number;
    other: number;
    total: number;
  };

  netPay: number;

  // YTD totals
  ytdEarnings: {
    gross: number;
    regular: number;
    overtime: number;
    bonuses: number;
    pto: number;
  };

  ytdDeductions: {
    federal: number;
    state: number;
    socialSecurity: number;
    medicare: number;
    retirement: number;
    healthInsurance: number;
    total: number;
  };

  ytdNetPay: number;

  // PTO/Sick balances
  ptoBalance: number;
  sickBalance: number;
}

// Payroll summary for dashboard
export interface PayrollSummary {
  orgId: string;
  period: { start: Date; end: Date };

  // Overall stats
  totalRuns: number;
  totalEmployees: number;
  totalGrossPay: number;
  totalNetPay: number;
  totalTaxes: number;

  // By pay period
  byPeriod: {
    periodLabel: string;
    runId: string;
    status: PayrollRunStatus;
    employeeCount: number;
    grossPay: number;
    netPay: number;
    payDate: Date;
  }[];

  // By employee
  byEmployee: {
    employeeId: string;
    employeeName: string;
    grossPay: number;
    netPay: number;
    hoursWorked: number;
    overtimeHours: number;
  }[];

  // Alerts
  alerts: {
    type: 'overtime_warning' | 'missing_time' | 'pending_approval' | 'upcoming_deadline';
    message: string;
    severity: 'info' | 'warning' | 'error';
    employeeId?: string;
    payrollRunId?: string;
  }[];
}

// Constants
export const PAYROLL_RUN_STATUSES: { value: PayrollRunStatus; label: string; color: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' }[] = [
  { value: 'draft', label: 'Draft', color: 'default' },
  { value: 'pending_approval', label: 'Pending Approval', color: 'warning' },
  { value: 'approved', label: 'Approved', color: 'primary' },
  { value: 'processing', label: 'Processing', color: 'info' },
  { value: 'completed', label: 'Completed', color: 'success' },
  { value: 'cancelled', label: 'Cancelled', color: 'danger' },
];

export const PAYROLL_ADJUSTMENT_TYPES: { value: PayrollAdjustmentType; label: string; isAddition: boolean }[] = [
  { value: 'bonus', label: 'Bonus', isAddition: true },
  { value: 'commission', label: 'Commission', isAddition: true },
  { value: 'reimbursement', label: 'Reimbursement', isAddition: true },
  { value: 'deduction', label: 'Deduction', isAddition: false },
  { value: 'garnishment', label: 'Garnishment', isAddition: false },
  { value: 'advance', label: 'Pay Advance', isAddition: false },
  { value: 'other', label: 'Other', isAddition: true },
];

export const PAY_SCHEDULE_LABELS: Record<PaySchedule, string> = {
  'weekly': 'Weekly (52 pay periods/year)',
  'bi-weekly': 'Bi-Weekly (26 pay periods/year)',
  'semi-monthly': 'Semi-Monthly (24 pay periods/year)',
  'monthly': 'Monthly (12 pay periods/year)',
};

// Tax rate constants (2026 estimated - disclaimer: for estimates only!)
export const TAX_RATES = {
  socialSecurity: {
    rate: 0.062,              // 6.2%
    wageBase: 176100,         // 2026 estimated wage base
  },
  medicare: {
    rate: 0.0145,             // 1.45%
    additionalRate: 0.009,    // Additional 0.9% over threshold
    additionalThreshold: 200000, // Single filer threshold
  },
  futa: {
    rate: 0.006,              // 0.6% (after state credit)
    wageBase: 7000,
  },
} as const;

// ============================================================================
// Voice Log Types (Daily Voice Log Feature - Sprint 14)
// ============================================================================

/**
 * Voice log processing status
 */
export type VoiceLogStatus =
  | 'queued'           // In local IndexedDB, waiting for upload
  | 'uploading'        // Currently uploading to server
  | 'uploaded'         // Audio uploaded, waiting for processing
  | 'processing'       // AI processing in progress
  | 'completed'        // Successfully processed
  | 'failed'           // Processing failed (retryable)
  | 'error';           // Permanent error (not retryable)

/**
 * Work event types that can be extracted from voice logs
 */
export type WorkEventType =
  | 'arrival'          // Arrived at site
  | 'departure'        // Left site
  | 'break_start'      // Started break
  | 'break_end'        // Ended break
  | 'task_start'       // Started a task
  | 'task_complete'    // Completed a task
  | 'task_progress'    // Made progress on task
  | 'issue_found'      // Found a problem/issue
  | 'issue_resolved'   // Fixed a problem
  | 'material_used'    // Used materials
  | 'material_needed'  // Need materials
  | 'weather_delay'    // Weather-related delay
  | 'equipment_issue'  // Equipment problem
  | 'safety_concern'   // Safety issue noted
  | 'coordination'     // Coordinated with others
  | 'inspection'       // Inspection performed
  | 'photo_taken'      // Photo was taken
  | 'other';           // Other event

/**
 * Confidence level for AI-extracted data
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low';

/**
 * A single segment of the transcript with timing
 */
export interface TranscriptSegment {
  text: string;
  startTime: number;    // Seconds from start
  endTime: number;
  confidence: number;   // 0-1
  speaker?: string;     // If speaker diarization is available
}

/**
 * Full transcript data from audio processing
 */
export interface TranscriptData {
  fullText: string;
  segments: TranscriptSegment[];
  language: string;           // Detected language code
  durationSeconds: number;
  wordCount: number;
}

/**
 * A work event extracted from the voice log
 */
export interface WorkEvent {
  id: string;
  type: WorkEventType;
  description: string;
  timestamp?: Date;           // When this happened (if mentioned)
  duration?: number;          // Duration in minutes (if applicable)
  confidence: ConfidenceLevel;
  sourceText: string;         // The original text this was extracted from
  metadata?: {
    taskId?: string;
    projectId?: string;
    phaseId?: string;
    materials?: string[];
    quantities?: Record<string, number>;
    personnelMentioned?: string[];
    equipmentMentioned?: string[];
  };
}

/**
 * A match between extracted work and a scheduled task
 */
export interface TaskMatch {
  eventId: string;            // ID of the WorkEvent this matches
  taskId: string;
  taskName: string;
  projectId: string;
  projectName: string;
  phaseId?: string;
  phaseName?: string;
  matchConfidence: ConfidenceLevel;
  matchReason: string;        // Why this was matched
  suggestedTimeEntry?: {
    hours: number;
    notes: string;
  };
}

/**
 * Summary generated from voice log
 */
export interface VoiceLogSummary {
  bullets: string[];          // 2-6 bullet points
  blockers: string[];         // Any blockers mentioned
  nextSteps: string[];        // Planned next steps
  mood?: 'positive' | 'neutral' | 'frustrated' | 'concerned';
  weatherMentioned?: string;
  hoursWorked?: number;       // Total hours if mentioned
}

/**
 * AI processing metadata
 */
export interface VoiceLogProcessingMeta {
  provider: string;           // 'gemini', 'openai', 'whisper', etc.
  model: string;              // Model version used
  processingTimeMs: number;
  tokensUsed?: number;
  costEstimate?: number;      // Estimated cost in USD
  retryCount: number;
  lastError?: string;
}

/**
 * Main VoiceLog document stored in Firestore
 */
export interface VoiceLog {
  id: string;
  orgId: string;
  userId: string;
  userName: string;

  // Recording metadata
  recordedAt: Date;
  durationSeconds: number;
  fileSizeBytes: number;
  mimeType: string;           // 'audio/webm', 'audio/mp4', etc.
  audioUrl?: string;          // Signed URL to audio file (expires)

  // Optional typed summary from user
  userSummary?: string;

  // Processing status
  status: VoiceLogStatus;
  statusMessage?: string;
  uploadedAt?: Date;
  processedAt?: Date;

  // Processing results (populated when status = 'completed')
  transcript?: TranscriptData;
  events?: WorkEvent[];
  taskMatches?: TaskMatch[];
  summary?: VoiceLogSummary;

  // Context at time of recording
  location?: {
    lat: number;
    lng: number;
    accuracy: number;
    address?: string;
  };
  projectContext?: {
    projectId: string;
    projectName: string;
    phaseId?: string;
    phaseName?: string;
  };

  // Processing metadata
  processingMeta?: VoiceLogProcessingMeta;

  // Idempotency
  contentHash: string;        // SHA256 of audio + userId + timestamp

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * VoiceLog create payload (for API)
 */
export type VoiceLogCreate = Omit<VoiceLog,
  | 'id'
  | 'audioUrl'
  | 'uploadedAt'
  | 'processedAt'
  | 'transcript'
  | 'events'
  | 'taskMatches'
  | 'summary'
  | 'processingMeta'
  | 'createdAt'
  | 'updatedAt'
>;

/**
 * Item stored in IndexedDB for offline queue
 */
export interface VoiceLogQueueItem {
  id: string;                 // Local UUID
  audioBlob: Blob;            // The actual audio data
  metadata: VoiceLogCreate;
  queuedAt: Date;
  retryCount: number;
  lastError?: string;
  status: 'pending' | 'uploading' | 'failed';
}

/**
 * Voice log provider configuration (stored in org settings)
 */
export interface VoiceLogProviderConfig {
  provider: 'gemini' | 'openai' | 'whisper' | 'azure';
  model?: string;             // Model version (defaults to provider default)
  apiKey?: string;            // Encrypted API key for BYO credentials
  useVertexAI?: boolean;      // Use Vertex AI (GCP-managed) vs direct API
  maxDurationMinutes: number; // Max recording duration (default 10)
  dailyLimitPerUser: number;  // Max logs per user per day
  dailyLimitPerOrg: number;   // Max logs per org per day
  retentionDays: number;      // How long to keep audio files
}

/**
 * Status labels for display
 */
export const VOICE_LOG_STATUS_LABELS: Record<VoiceLogStatus, string> = {
  queued: 'Queued',
  uploading: 'Uploading',
  uploaded: 'Processing',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
  error: 'Error',
};

/**
 * Work event type labels
 */
export const WORK_EVENT_TYPE_LABELS: Record<WorkEventType, string> = {
  arrival: 'Arrived',
  departure: 'Departed',
  break_start: 'Break Started',
  break_end: 'Break Ended',
  task_start: 'Task Started',
  task_complete: 'Task Completed',
  task_progress: 'Task Progress',
  issue_found: 'Issue Found',
  issue_resolved: 'Issue Resolved',
  material_used: 'Material Used',
  material_needed: 'Material Needed',
  weather_delay: 'Weather Delay',
  equipment_issue: 'Equipment Issue',
  safety_concern: 'Safety Concern',
  coordination: 'Coordination',
  inspection: 'Inspection',
  photo_taken: 'Photo Taken',
  other: 'Other',
};

// ============================================
// AI Assistant Types (Sprint 10)
// ============================================

/**
 * AI Model provider options
 */
export type AIModelProvider = 'gemini' | 'claude' | 'openai';

/**
 * Subscription tier that determines available AI features
 */
export type AIModelTier = 'free' | 'pro' | 'enterprise';
export type AIResponseStyle = 'concise' | 'detailed' | 'technical';

/**
 * Content filter strictness level
 */
export type AIContentFilterLevel = 'strict' | 'balanced' | 'permissive';

/**
 * Organization-level AI settings stored in Firestore
 * Path: organizations/{orgId}/settings/ai
 */
export interface OrganizationAISettings {
  orgId: string;

  // Model selection
  selectedModel: string;           // Model key (e.g., 'gemini-2.0-flash')
  allowedModels: string[];         // Models this org can use based on tier

  // API Key status (keys stored in GCP Secret Manager, not Firestore)
  hasCustomGeminiKey: boolean;
  hasCustomClaudeKey: boolean;
  hasCustomOpenAIKey: boolean;

  // Usage limits
  tier: AIModelTier;
  dailyRequestLimit: number;
  dailyTokenLimit: number;
  dailyCostLimit: number;          // Max cost per day in USD

  // Feature flags
  enableAssistant: boolean;        // Master toggle for AI assistant
  enableVoiceInput: boolean;       // Allow voice input
  enableStreaming: boolean;        // Stream responses
  enableIntelligence: boolean;     // AI-powered insights (pricing, etc.)

  // Response style
  responseStyle: AIResponseStyle;  // concise, detailed, or technical

  // Text-to-speech settings
  enableTTS: boolean;              // Enable text-to-speech for responses
  ttsVoiceURI: string;             // Selected voice URI
  ttsRate: number;                 // Speech rate (0.5 - 2.0)
  ttsAutoSpeak: boolean;           // Automatically speak AI responses

  // Safety settings
  contentFilterLevel: AIContentFilterLevel;
  logPrompts: boolean;             // Log prompts for debugging/audit
  blockExternalUrls: boolean;      // Block responses containing external URLs

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Default AI settings for new organizations
 */
export const DEFAULT_AI_SETTINGS: Omit<OrganizationAISettings, 'orgId' | 'createdAt' | 'updatedAt'> = {
  selectedModel: 'gemini-2.0-flash',
  allowedModels: ['gemini-2.0-flash'],
  hasCustomGeminiKey: false,
  hasCustomClaudeKey: false,
  hasCustomOpenAIKey: false,
  tier: 'free',
  dailyRequestLimit: 200,
  dailyTokenLimit: 100000,
  dailyCostLimit: 0,
  enableAssistant: true,
  enableVoiceInput: true,
  enableStreaming: true,
  enableIntelligence: true,
  responseStyle: 'detailed',
  enableTTS: false,
  ttsVoiceURI: '',
  ttsRate: 1.0,
  ttsAutoSpeak: false,
  contentFilterLevel: 'balanced',
  logPrompts: false,
  blockExternalUrls: true,
};

/**
 * Daily AI usage record
 * Path: organizations/{orgId}/aiUsage/{YYYY-MM-DD}
 */
export interface AIUsageRecord {
  orgId: string;
  date: string;                    // YYYY-MM-DD

  // Aggregate stats
  requests: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;

  // Per-model breakdown
  modelBreakdown: Record<string, {
    requests: number;
    tokens: number;
    cost: number;
  }>;

  // Timestamps
  firstRequestAt: Date;
  lastRequestAt: Date;
}

/**
 * AI model configuration for display
 */
export interface AIModelDisplayConfig {
  key: string;
  provider: AIModelProvider;
  displayName: string;
  description: string;
  tier: AIModelTier;
  isDefault: boolean;
  isAvailable: boolean;            // Whether API key is configured
}

/**
 * Rate limit status returned from API
 */
export interface AIRateLimitStatus {
  allowed: boolean;
  remaining: {
    requests: number;
    tokens: number;
  };
  resetAt: Date;
  reason?: string;
}

/**
 * AI API Key authentication method
 */
export type AIKeyAuthMethod = 'oauth' | 'api_key';

/**
 * Validation status for an AI API key
 */
export type AIKeyValidationStatus = 'valid' | 'invalid' | 'not_set' | 'validating' | 'expired';

/**
 * Configuration for an AI provider's API key
 * Note: Actual API keys are stored in GCP Secret Manager, NOT in Firestore.
 * Firestore stores only metadata about the key status.
 * Path: organizations/{orgId}/aiKeyConfigs/{provider}
 */
export interface AIKeyConfig {
  provider: AIModelProvider;
  keySet: boolean;
  keyLastFour?: string;              // Last 4 characters for display (e.g., "sk-...7x9Z")
  validatedAt?: Date;
  validationStatus: AIKeyValidationStatus;
  availableModels?: string[];        // Models available with this key
  authMethod: AIKeyAuthMethod;       // How the user authenticated (OAuth vs API key)
  errorMessage?: string;             // Last validation error, if any
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Result of validating an AI provider API key
 */
export interface AIKeyValidationResult {
  valid: boolean;
  provider: AIModelProvider;
  models?: string[];                 // Available models if valid
  error?: string;                    // Error message if invalid
  rateLimit?: {                      // Rate limit info if available
    requestsPerMinute?: number;
    tokensPerMinute?: number;
  };
}

/**
 * Request payload for setting an AI provider API key
 * Note: This is sent to a Cloud Function, NOT stored in Firestore
 */
export interface AIKeySetRequest {
  provider: AIModelProvider;
  apiKey: string;                    // Raw key - only sent to Cloud Function for storage in Secret Manager
  orgId: string;
}

/**
 * Response from setting an AI provider API key
 */
export interface AIKeySetResponse {
  success: boolean;
  keyLastFour?: string;
  availableModels?: string[];
  error?: string;
}

// ============================================================================
// AI Provider Priority & Fallback (Sprint 37)
// ============================================================================

/**
 * AI feature types that can have custom model assignments
 */
export type AIFeatureType =
  | 'assistant'        // General AI assistant chat
  | 'estimates'        // Estimate analysis and suggestions
  | 'photo_analysis'   // Photo tagging and safety analysis
  | 'document_analysis'// Document parsing and extraction
  | 'project_summary'  // Project status summaries
  | 'nl_query';        // Natural language data queries

/**
 * Human-readable labels for AI feature types
 */
export const AI_FEATURE_LABELS: Record<AIFeatureType, string> = {
  assistant: 'AI Assistant Chat',
  estimates: 'Estimate Analysis',
  photo_analysis: 'Photo Analysis',
  document_analysis: 'Document Parsing',
  project_summary: 'Project Summaries',
  nl_query: 'Natural Language Queries',
};

/**
 * Provider priority configuration for fallback chain
 * Path: organizations/{orgId}/settings/aiProviders
 */
export interface AIProviderPriority {
  providerId: string;            // e.g., 'gemini', 'claude', 'openai'
  priority: number;              // Lower number = higher priority (1 = primary)
  enabled: boolean;              // Whether this provider is active
  isPrimary: boolean;            // Marked as the primary provider
  costPer1kTokens: number;       // Blended cost estimate (input + output average)
  hasApiKey: boolean;            // Whether API key is configured
  lastUsed?: Date;               // Last successful use timestamp
  failureCount?: number;         // Recent failure count for health tracking
  lastFailure?: Date;            // Most recent failure timestamp
}

/**
 * Per-feature model assignment
 */
export interface AIFeatureModelAssignment {
  feature: AIFeatureType;
  modelKey: string;              // e.g., 'gemini-2.0-flash', 'claude-sonnet'
  fallbackModelKey?: string;     // Optional fallback for this specific feature
}

/**
 * Organization AI provider settings
 * Path: organizations/{orgId}/settings/aiProviders
 */
export interface OrganizationAIProviderSettings {
  orgId: string;

  // Provider priority chain
  providerPriorities: AIProviderPriority[];

  // Per-feature model assignments
  featureAssignments: AIFeatureModelAssignment[];

  // Global fallback behavior
  enableAutomaticFallback: boolean;  // Auto-fallback to next provider on failure
  fallbackDelayMs: number;           // Delay before trying fallback (default: 0)
  maxFallbackAttempts: number;       // Max providers to try (default: 3)

  // Cost controls
  monthlyBudget?: number;            // Optional monthly spending limit in USD
  alertThresholdPercent?: number;    // Alert when reaching % of budget (default: 80)

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Default provider settings for new organizations
 */
export const DEFAULT_AI_PROVIDER_SETTINGS: Omit<OrganizationAIProviderSettings, 'orgId' | 'createdAt' | 'updatedAt'> = {
  providerPriorities: [
    {
      providerId: 'gemini',
      priority: 1,
      enabled: true,
      isPrimary: true,
      costPer1kTokens: 0,
      hasApiKey: true, // Free tier default
    },
    {
      providerId: 'claude',
      priority: 2,
      enabled: false,
      isPrimary: false,
      costPer1kTokens: 0.009, // (0.003 + 0.015) / 2 average
      hasApiKey: false,
    },
    {
      providerId: 'openai',
      priority: 3,
      enabled: false,
      isPrimary: false,
      costPer1kTokens: 0.01, // (0.005 + 0.015) / 2 average
      hasApiKey: false,
    },
  ],
  featureAssignments: [
    { feature: 'assistant', modelKey: 'gemini-2.0-flash' },
    { feature: 'estimates', modelKey: 'gemini-2.0-flash' },
    { feature: 'photo_analysis', modelKey: 'gemini-2.0-flash' },
    { feature: 'document_analysis', modelKey: 'gemini-2.0-flash' },
    { feature: 'project_summary', modelKey: 'gemini-2.0-flash' },
    { feature: 'nl_query', modelKey: 'gemini-2.0-flash' },
  ],
  enableAutomaticFallback: true,
  fallbackDelayMs: 0,
  maxFallbackAttempts: 3,
  alertThresholdPercent: 80,
};

/**
 * AI usage statistics per provider
 */
export interface AIProviderUsageStats {
  provider: string;              // Provider ID
  period: string;                // 'daily' | 'weekly' | 'monthly' or date string
  periodStart: Date;
  periodEnd: Date;

  // Token usage
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;

  // Request counts
  requestCount: number;
  successCount: number;
  failureCount: number;

  // Cost tracking
  estimatedCost: number;         // In USD

  // Performance
  averageLatencyMs: number;
  p95LatencyMs?: number;
}

/**
 * Monthly usage summary across all providers
 * Path: organizations/{orgId}/aiUsageSummary/{YYYY-MM}
 */
export interface AIMonthlyUsageSummary {
  orgId: string;
  month: string;                 // YYYY-MM format

  // Aggregated stats
  totalCost: number;
  totalTokens: number;
  totalRequests: number;

  // Per-provider breakdown
  providerStats: AIProviderUsageStats[];

  // Per-feature breakdown
  featureStats: Record<AIFeatureType, {
    requests: number;
    tokens: number;
    cost: number;
  }>;

  // Budget tracking
  budgetUsedPercent?: number;
  budgetRemaining?: number;

  // Metadata
  updatedAt: Date;
}

/**
 * Result of an AI operation with provider tracking
 */
export interface AIOperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;

  // Provider tracking
  providerId: string;
  modelKey: string;
  wasFallback: boolean;          // True if not the primary provider
  fallbackAttempts: number;      // Number of providers tried

  // Usage
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  latencyMs: number;
}

// ============================================================================
// Email Templates
// ============================================================================

/**
 * Email template types for automated and manual sending
 */
export type EmailTemplateType =
  | 'estimate_sent'
  | 'estimate_followup'
  | 'invoice_sent'
  | 'invoice_reminder'
  | 'invoice_overdue'
  | 'payment_received'
  | 'project_started'
  | 'project_completed'
  | 'document_ready'
  | 'signature_request'
  | 'welcome_client'
  | 'review_request'
  | 'custom';

/**
 * Email template configuration
 * Path: organizations/{orgId}/emailTemplates/{templateId}
 */
export interface EmailTemplate {
  id: string;
  orgId: string;
  type: EmailTemplateType;
  name: string;
  subject: string;
  body: string; // HTML with {{variables}}
  variables: string[]; // Available: clientName, projectName, amount, dueDate, etc.
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Email log entry for tracking sent emails
 * Path: organizations/{orgId}/emailLogs/{logId}
 */
export interface EmailLog {
  id: string;
  orgId: string;
  templateId?: string;
  templateType: EmailTemplateType;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  status: 'sent' | 'failed' | 'bounced' | 'opened';
  clientId?: string;
  projectId?: string;
  invoiceId?: string;
  estimateId?: string;
  sentAt: Date;
  openedAt?: Date;
  errorMessage?: string;
}

// ============================================================================
// Voice Command Types (Sprint 29)
// ============================================================================

/**
 * Voice command types supported by the system
 */
export type VoiceCommandType =
  | 'time_entry'      // Clock in/out, add time
  | 'daily_log'       // Create/update daily log entries
  | 'task_update'     // Update task status, assign tasks
  | 'navigation'      // Navigate to pages/sections
  | 'photo_note';     // Add notes to photos

/**
 * Status of a voice command execution
 */
export type VoiceCommandStatus =
  | 'pending'         // Command received, not yet processed
  | 'processing'      // Currently being parsed/executed
  | 'completed'       // Successfully executed
  | 'failed'          // Execution failed
  | 'cancelled';      // User cancelled confirmation

/**
 * Parsed voice command structure
 */
export interface ParsedVoiceCommand {
  type: VoiceCommandType;
  action: string;           // e.g., 'clock_in', 'create', 'update', 'navigate'
  entityType?: string;      // e.g., 'time_entry', 'daily_log', 'task'
  entityId?: string;        // ID if referencing existing entity
  parameters: Record<string, unknown>; // Command-specific params
  confidence: number;       // 0-1 confidence score from parser
}

/**
 * Voice command record
 * Path: organizations/{orgId}/voiceCommands/{commandId}
 */
export interface VoiceCommand {
  id: string;
  orgId: string;
  userId: string;
  userName: string;

  // Input
  rawText: string;          // Original transcribed text
  audioUrl?: string;        // Optional audio recording URL
  language: string;         // e.g., 'en-US'

  // Parsing
  parsedCommand?: ParsedVoiceCommand;
  parsingError?: string;

  // Execution
  status: VoiceCommandStatus;
  result?: VoiceCommandResult;

  // Context
  contextPage?: string;     // Page where command was issued (e.g., '/field/time')
  projectId?: string;       // Active project context if any
  projectName?: string;

  // Confirmation
  requiresConfirmation: boolean;
  confirmedAt?: Date;
  confirmedBy?: string;

  // Timestamps
  createdAt: Date;
  processedAt?: Date;
  completedAt?: Date;
}

/**
 * Result of voice command execution
 */
export interface VoiceCommandResult {
  success: boolean;
  action: string;           // Action that was performed
  entityType?: string;      // Type of entity affected
  entityId?: string;        // ID of created/updated entity
  message: string;          // Human-readable result message
  error?: string;           // Error message if failed
  undoAction?: {            // Info for undo capability
    type: string;
    entityId: string;
    previousState?: Record<string, unknown>;
  };
}

/**
 * Voice command analytics log
 * Path: organizations/{orgId}/voiceCommandLogs/{logId}
 * Note: Admins only for analytics, write-only via admin SDK
 */
export interface VoiceCommandLog {
  id: string;
  orgId: string;

  // Aggregated stats (no PII)
  commandType: VoiceCommandType;
  action: string;
  success: boolean;
  confidence: number;
  processingTimeMs: number;

  // Context (anonymized)
  contextPage?: string;
  language: string;

  // Error tracking
  errorCode?: string;
  errorCategory?: 'parsing' | 'validation' | 'execution' | 'timeout' | 'cancelled';

  // Timestamp
  createdAt: Date;
}

/**
 * Voice command statistics for analytics dashboard
 */
export interface VoiceCommandStats {
  orgId: string;
  period: 'day' | 'week' | 'month';
  date: string;             // Period start date

  // Totals
  totalCommands: number;
  successfulCommands: number;
  failedCommands: number;

  // By type breakdown
  byType: Record<VoiceCommandType, {
    total: number;
    success: number;
    avgConfidence: number;
  }>;

  // Performance
  avgProcessingTimeMs: number;
  avgConfidence: number;

  // Error breakdown
  errorsByCategory: Record<string, number>;
}

// ===========================================
// AI ASSISTANT V2 - SPRINT 31
// ===========================================

/**
 * Document analysis result from AI
 * Path: organizations/{orgId}/documentAnalyses/{docId}
 */
export interface DocumentAnalysis {
  id: string;
  orgId: string;
  userId: string;

  // File info
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;

  // AI-extracted data
  extractedData: {
    summary: string;
    keyDates: Array<{ date: string; description: string }>;
    amounts: Array<{ amount: number; currency: string; description: string }>;
    parties: Array<{ name: string; role?: string }>;
    actionItems: string[];
    documentType?: 'contract' | 'invoice' | 'permit' | 'change_order' | 'proposal' | 'other';
    tags: string[];
  };

  // AI metadata
  confidence: number;
  modelUsed: string;
  processingTimeMs: number;

  // Context
  projectId?: string;
  projectName?: string;

  // Timestamps
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Photo analysis result from vision AI
 * Path: organizations/{orgId}/photoAnalyses/{photoId}
 */
export interface PhotoAnalysis {
  id: string;
  orgId: string;
  userId: string;

  // File info
  fileName: string;
  fileUrl: string;
  thumbnailUrl?: string;
  mimeType: string;
  fileSize: number;
  dimensions?: { width: number; height: number };

  // AI-extracted data
  analysis: {
    description: string;
    detectedObjects: Array<{
      label: string;
      confidence: number;
      boundingBox?: { x: number; y: number; width: number; height: number };
    }>;
    suggestedTags: string[];
    safetyObservations?: string[];
    progressIndicators?: string[];
    weatherConditions?: string;
    qualityAssessment?: {
      rating: 'good' | 'acceptable' | 'needs_attention' | 'issue';
      notes: string;
    };
  };

  // AI metadata
  confidence: number;
  modelUsed: string;
  processingTimeMs: number;

  // Context
  projectId?: string;
  projectName?: string;
  photoId?: string;

  // Timestamps
  createdAt: Date;
}

/**
 * AI-generated project summary
 */
export interface ProjectSummary {
  id: string;
  orgId: string;
  projectId: string;
  projectName: string;

  // Summary content
  summary: {
    overview: string;
    progressPercentage: number;
    recentActivity: string[];
    accomplishments: string[];
    concerns: Array<{
      issue: string;
      severity: 'low' | 'medium' | 'high';
      recommendation?: string;
    }>;
    nextSteps: string[];
    budgetStatus?: {
      spent: number;
      budgeted: number;
      projectedFinal: number;
      status: 'under' | 'on_track' | 'over';
    };
    scheduleStatus?: {
      daysRemaining: number;
      originalDays: number;
      status: 'ahead' | 'on_track' | 'behind';
    };
  };

  // Data sources used
  sourcesUsed: {
    dailyLogs: number;
    timeEntries: number;
    photos: number;
    tasks: number;
    invoices: number;
    expenses: number;
  };

  // AI metadata
  confidence: number;
  modelUsed: string;
  processingTimeMs: number;
  generatedAt: Date;
}

/**
 * AI suggestion for proactive assistance
 * Path: organizations/{orgId}/aiSuggestions/{suggestionId}
 */
export interface AISuggestion {
  id: string;
  orgId: string;
  userId?: string;

  // Suggestion content
  type: AISuggestionType;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';

  // Context
  entityType?: 'project' | 'invoice' | 'task' | 'estimate' | 'expense' | 'schedule';
  entityId?: string;
  entityName?: string;

  // Action
  suggestedAction?: {
    type: 'navigate' | 'create' | 'update' | 'remind' | 'alert';
    route?: string;
    payload?: Record<string, unknown>;
  };

  // Status
  status: 'pending' | 'viewed' | 'accepted' | 'dismissed' | 'expired';
  viewedAt?: Date;
  actionedAt?: Date;
  feedback?: 'helpful' | 'not_helpful';

  // AI metadata
  confidence: number;
  modelUsed: string;
  triggerReason: string;

  // Timestamps
  createdAt: Date;
  expiresAt?: Date;
}

export type AISuggestionType =
  | 'overdue_invoice'
  | 'budget_warning'
  | 'schedule_delay'
  | 'missing_document'
  | 'incomplete_estimate'
  | 'unusual_expense'
  | 'follow_up_needed'
  | 'task_reminder'
  | 'progress_update'
  | 'safety_concern'
  | 'weather_alert'
  | 'optimization'
  | 'custom';

// ===========================================
// NATURAL LANGUAGE QUERY TYPES - SPRINT 31
// ===========================================

/**
 * Entity types supported by NL query parser
 */
export type QueryEntityType =
  | 'invoices'
  | 'projects'
  | 'clients'
  | 'tasks'
  | 'timeEntries'
  | 'expenses'
  | 'estimates'
  | 'photos'
  | 'dailyLogs'
  | 'subcontractors'
  | 'scheduleEvents';

/**
 * Filter operator for query conditions
 */
export type QueryFilterOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'lt'
  | 'gte'
  | 'lte'
  | 'contains'
  | 'in'
  | 'not_in'
  | 'between';

/**
 * Single filter condition
 */
export interface QueryFilter {
  field: string;
  operator: QueryFilterOperator;
  value: unknown;
  value2?: unknown;
}

/**
 * Parsed natural language query
 */
export interface ParsedQuery {
  originalText: string;
  entity: QueryEntityType;
  filters: QueryFilter[];
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  limit?: number;
  offset?: number;
  dateRange?: {
    field: string;
    start: Date;
    end: Date;
  };
  aggregation?: {
    type: 'count' | 'sum' | 'avg' | 'min' | 'max';
    field?: string;
  };
  confidence: number;
  ambiguities?: string[];
  suggestions?: string[];
}

/**
 * Result from query execution
 */
export interface QueryResult<T = unknown> {
  success: boolean;
  data: T[];
  totalCount: number;
  hasMore: boolean;
  query: ParsedQuery;
  executionTimeMs: number;
  error?: string;
  suggestion?: string;
}

// ===========================================
// ESTIMATE ANALYZER TYPES - SPRINT 31
// ===========================================

/**
 * Result from estimate analysis
 */
export interface EstimateAnalysisResult {
  estimateId: string;
  analyzedAt: Date;
  overallScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  potentiallyMissingItems: Array<{
    category: string;
    item: string;
    reason: string;
    suggestedAmount?: number;
    confidence: number;
  }>;
  pricingFlags: Array<{
    lineItemId: string;
    lineItemDescription: string;
    currentPrice: number;
    marketRangeLow: number;
    marketRangeHigh: number;
    flag: 'too_low' | 'too_high' | 'significantly_low' | 'significantly_high';
    recommendation: string;
  }>;
  categoryCoverage: Array<{
    category: string;
    itemCount: number;
    expectedItems: string[];
    missingCommon: string[];
    coverage: 'complete' | 'partial' | 'minimal';
  }>;
  suggestions: string[];
  confidence: number;
  modelUsed: string;
  processingTimeMs: number;
}

// ============================================================================

// ============================================================================
// Closeout Checklist Types (Sprint 33)
// ============================================================================

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

// ============================================================================
// Equipment Types (Sprint 35)
// ============================================================================

export type EquipmentStatus = 'available' | 'checked_out' | 'maintenance' | 'retired';
export type EquipmentCategory = 'power_tool' | 'hand_tool' | 'heavy_equipment' | 'safety' | 'measuring' | 'vehicle' | 'other';

export interface Equipment {
  id: string;
  orgId: string;
  name: string;
  category: EquipmentCategory;
  status: EquipmentStatus;
  serialNumber?: string;
  description?: string;
  photoUrl?: string;
  purchaseDate?: Date;
  purchasePrice?: number;
  currentValue?: number;
  currentLocation?: string;
  currentProjectId?: string;
  checkedOutTo?: string;
  checkedOutToName?: string;
  checkedOutAt?: Date;
  expectedReturnDate?: Date;
  maintenanceSchedule?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface EquipmentCheckout {
  id: string;
  equipmentId: string;
  equipmentName: string;
  userId: string;
  userName: string;
  projectId?: string;
  projectName?: string;
  checkedOutAt: Date;
  expectedReturnDate?: Date;
  returnedAt?: Date;
  notes?: string;
}

export interface MaintenanceRecord {
  id: string;
  equipmentId: string;
  type: 'routine' | 'repair' | 'inspection';
  description: string;
  cost?: number;
  performedBy: string;
  performedAt: Date;
  nextScheduledDate?: Date;
}

// ============================================================================
// Client Portal Types (Sprint 36)
// ============================================================================

export interface ClientPortalSelection {
  id: string;
  projectId: string;
  orgId: string;
  category: string;
  options: ClientPortalSelectionOption[];
  selectedOptionId?: string;
  clientApproved: boolean;
  clientApprovedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientPortalSelectionOption {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price?: number;
  supplier?: string;
  leadTime?: string;
}

export interface ClientPortalNote {
  id: string;
  projectId: string;
  orgId: string;
  clientId: string;
  clientName: string;
  content: string;
  addressed: boolean;
  addressedBy?: string;
  addressedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectProgress {
  projectId: string;
  orgId: string;
  overallPercent: number;
  phases: PhaseProgress[];
  estimatedCompletion?: Date;
  lastUpdated: Date;
}

export interface PhaseProgress {
  phaseId: string;
  phaseName: string;
  percent: number;
  startDate?: Date;
  endDate?: Date;
}

// Convenience aliases for client portal (using existing types)
export type Photo = ProjectPhoto;
export type Activity = ActivityItem;

// ============================================================================
// Organization Settings Extensions (Sprint 37B)
// ============================================================================

export interface FiscalYearConfig {
  startMonth: number; // 1-12 (January = 1)
  startDay: number;   // 1-31
}

export interface PayrollPeriodConfig {
  frequency: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';
  periodStartDay: number;    // Day of week (0-6) or day of month (1-31)
  payDateOffset: number;     // Days after period end to pay
}

export interface TaxConfig {
  entityType: 'sole_proprietor' | 'llc' | 'partnership' | 's_corp' | 'c_corp';
  federalTaxRate: number;
  stateTaxRate: number;
  localTaxRate: number;
  state: string;
  taxIdEin?: string;  // Tax ID / EIN for display on invoices (optional)
}

// Business Type for Corporate Structure
export type BusinessType = 'llc' | 's_corp' | 'c_corp' | 'sole_prop' | 'partnership';

// Corporate Structure Configuration
export interface CorporateStructure {
  legalName?: string;           // Full legal name of the business
  dba?: string;                 // Doing Business As (trade name)
  ein?: string;                 // Employer Identification Number (XX-XXXXXXX)
  businessAddress?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  businessType?: BusinessType;
}

// Insurance & Compliance Configuration
export interface InsuranceCompliance {
  stateUnemploymentRate?: number;  // SUTA rate (e.g., 2.7 for 2.7%)
  futaRate?: number;               // FUTA rate (e.g., 6.0 for 6.0%)
  workersCompRate?: number;        // Workers comp rate per $100 payroll
  workersCompClass?: string;       // Classification code (e.g., "5403" for carpentry)
  generalLiabilityProvider?: string;
  generalLiabilityPolicyNumber?: string;
  workersCompProvider?: string;
  workersCompPolicyNumber?: string;
}

export interface OrganizationSettings {
  fiscalYear?: FiscalYearConfig;
  payrollPeriod?: PayrollPeriodConfig;
  taxConfig?: TaxConfig;
}

// ============================================
// Financial Report Preferences (Sprint 66)
// ============================================

/**
 * Available metric card IDs for financial reports
 */
export type FinancialMetricId =
  | 'total-revenue'
  | 'total-expenses'
  | 'net-profit'
  | 'net-margin'
  | 'pnl-statement'
  | 'revenue-trend'
  | 'cost-breakdown'
  | 'revenue-by-client'
  | 'revenue-by-project'
  | 'budget-summary'
  | 'expenses-by-category'
  | 'invoice-aging'
  | 'project-profitability'
  | 'invoice-aging-detail';

/**
 * Report preferences stored per organization
 * Path: organizations/{orgId}/reportPreferences/financial
 */
export interface ReportPreferences {
  id: string;
  orgId: string;
  userId: string; // User who last modified

  // Visible metrics (IDs of cards to show)
  visibleMetrics: FinancialMetricId[];

  // Order of metrics (first = top of page)
  metricOrder: FinancialMetricId[];

  // Favorite metrics (shown with star indicator)
  favoriteMetrics: FinancialMetricId[];

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Metric card definition for the customize panel
 */
export interface MetricCardDefinition {
  id: FinancialMetricId;
  title: string;
  description: string;
  category: 'kpi' | 'chart' | 'table';
  defaultVisible: boolean;
}

// ============================================================================
// Custom Report Builder Types (F4, #67)
// ============================================================================

/**
 * Visualization type for custom reports
 */
export type CustomReportVisualization = 'table' | 'bar' | 'line' | 'pie';

/**
 * Aggregation type for report fields
 */
export type CustomReportAggregation = 'sum' | 'avg' | 'count' | 'min' | 'max' | 'none';

/**
 * Filter operator types
 */
export type CustomReportFilterOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'greaterThan'
  | 'lessThan'
  | 'between'
  | 'in'
  | 'isNull'
  | 'isNotNull';

/**
 * Data source types available for custom reports
 */
export type CustomReportDataSource =
  | 'projects'
  | 'tasks'
  | 'expenses'
  | 'invoices'
  | 'timeEntries'
  | 'clients'
  | 'subcontractors'
  | 'materials';

/**
 * Field type for custom report fields
 */
export type CustomReportFieldType = 'string' | 'number' | 'date' | 'boolean' | 'currency';

/**
 * Field definition for custom reports
 */
export interface CustomReportField {
  id: string;
  source: string;
  label: string;
  type: CustomReportFieldType;
  aggregation?: CustomReportAggregation;
  format?: string;
}

/**
 * Filter definition for custom reports
 */
export interface CustomReportFilter {
  id: string;
  field: string;
  operator: CustomReportFilterOperator;
  value: unknown;
  value2?: unknown;
}

/**
 * Custom report configuration
 * Path: organizations/{orgId}/customReports/{reportId}
 */
export interface CustomReportConfig {
  id: string;
  name: string;
  description?: string;
  dataSource: CustomReportDataSource;
  fields: CustomReportField[];
  filters: CustomReportFilter[];
  visualization: CustomReportVisualization;
  groupBy?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  isShared?: boolean;
  sharedWith?: string[];
}

// ============================================================================
// AI Provider Configuration Types (F2, #90)
// ============================================================================

/**
 * Supported AI provider types
 */
export type AIProviderType = 'openai' | 'anthropic' | 'google' | 'ollama';

/**
 * OAuth connection status
 */
export type AIProviderConnectionStatus = 'connected' | 'disconnected' | 'pending' | 'error';

/**
 * Individual AI provider configuration
 * Path: organizations/{orgId}/aiProviders/{provider}
 */
export interface AIProviderConfig {
  id: string;
  orgId: string;
  provider: AIProviderType;
  connected: boolean;
  connectionStatus: AIProviderConnectionStatus;
  connectionDate?: Date;
  lastUsedAt?: Date;

  // For cloud providers (OpenAI, Anthropic, Google)
  // API keys stored encrypted or reference to secret manager
  hasApiKey: boolean;
  apiKeyLastFour?: string;  // Last 4 characters for display

  // For local providers (Ollama)
  localUrl?: string;        // e.g., 'http://localhost:11434'
  isLocalProvider: boolean;

  // Model selection
  defaultModelId?: string;
  availableModels?: string[];

  // Usage tracking
  totalRequests?: number;
  totalTokens?: number;
  lastError?: string;
  lastErrorAt?: Date;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

/**
 * OAuth state for tracking authorization flow
 */
export interface AIProviderOAuthState {
  provider: AIProviderType;
  state: string;           // CSRF protection token
  codeVerifier?: string;   // PKCE code verifier
  redirectUri: string;
  createdAt: Date;
  expiresAt: Date;
}

/**
 * Display configuration for provider cards
 */
export interface AIProviderDisplayInfo {
  provider: AIProviderType;
  name: string;
  description: string;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  website: string;
  documentationUrl: string;
  supportsOAuth: boolean;
  features: string[];
}

/**
 * Provider validation result
 */
export interface AIProviderValidationResult {
  valid: boolean;
  provider: AIProviderType;
  message: string;
  models?: string[];
  error?: string;
}

/**
 * Constants for AI provider display information
 */
export const AI_PROVIDER_INFO: Record<AIProviderType, AIProviderDisplayInfo> = {
  openai: {
    provider: 'openai',
    name: 'OpenAI',
    description: 'GPT-4o and GPT-4o Mini for advanced language understanding and generation.',
    iconColor: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    website: 'https://openai.com',
    documentationUrl: 'https://platform.openai.com/docs',
    supportsOAuth: false,
    features: ['GPT-4o', 'GPT-4o Mini', 'Vision', 'Function calling'],
  },
  anthropic: {
    provider: 'anthropic',
    name: 'Anthropic Claude',
    description: 'Claude Sonnet for thoughtful, nuanced responses with strong reasoning.',
    iconColor: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    website: 'https://anthropic.com',
    documentationUrl: 'https://docs.anthropic.com',
    supportsOAuth: false,
    features: ['Claude Sonnet', 'Long context', 'Vision', 'Safe outputs'],
  },
  google: {
    provider: 'google',
    name: 'Google Gemini',
    description: 'Gemini 2.0 Flash for fast, multimodal AI with 1M token context.',
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    website: 'https://ai.google.dev',
    documentationUrl: 'https://ai.google.dev/docs',
    supportsOAuth: false,
    features: ['Gemini 2.0 Flash', 'Gemini 1.5 Pro', '1M context', 'Vision'],
  },
  ollama: {
    provider: 'ollama',
    name: 'Ollama (Local)',
    description: 'Run open-source models locally for complete data privacy.',
    iconColor: 'text-gray-700',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    website: 'https://ollama.ai',
    documentationUrl: 'https://github.com/ollama/ollama',
    supportsOAuth: false,
    features: ['Llama 3', 'Mistral', 'CodeLlama', 'Local & Private'],
  },
};

// ============================================
// User Offboarding Types (Sprint 37B)
// ============================================

/**
 * Status of the offboarding process
 */
export type OffboardingStatus =
  | 'pending'      // Offboarding initiated, not started
  | 'in_progress'  // Currently processing
  | 'completed'    // Successfully completed
  | 'cancelled'    // Cancelled before completion
  | 'failed';      // Failed during process

/**
 * Options for initiating user offboarding
 */
export interface OffboardingOptions {
  /** User ID to reassign tasks to (optional - if not provided, tasks remain unassigned) */
  reassignTasksTo?: string;
  /** Whether to archive user data for compliance (default: true) */
  archiveData: boolean;
  /** Whether to send notification emails to affected parties */
  sendNotification: boolean;
  /** When the offboarding should take effect */
  effectiveDate: Date;
  /** Optional reason for offboarding */
  reason?: string;
  /** Whether to revoke all active sessions immediately */
  revokeSessionsImmediately?: boolean;
  /** Custom notes for the offboarding record */
  notes?: string;
  /** Equipment IDs that need to be returned */
  equipmentToReturn?: string[];
  /** Whether equipment return has been verified */
  equipmentReturnVerified?: boolean;
}

/**
 * Summary report generated after offboarding completes
 */
export interface OffboardingReport {
  /** The offboarded user's ID */
  userId: string;
  /** User's display name at time of offboarding */
  userName: string;
  /** User's email at time of offboarding */
  userEmail: string;
  /** Number of tasks reassigned to another user */
  tasksReassigned: number;
  /** Number of projects where ownership was transferred */
  projectsTransferred: number;
  /** Whether user data was archived */
  dataArchived: boolean;
  /** Whether access was revoked */
  accessRevoked: boolean;
  /** When the offboarding was completed */
  completedAt: Date;
  /** Who initiated the offboarding */
  initiatedBy: string;
  /** The effective date of the offboarding */
  effectiveDate: Date;
  /** Any errors encountered during offboarding */
  errors?: string[];
  /** Detailed action log */
  actionLog: OffboardingAction[];
}

/**
 * Individual action taken during offboarding
 */
export interface OffboardingAction {
  /** Type of action performed */
  action: 'revoke_access' | 'reassign_task' | 'transfer_project' | 'archive_data' | 'send_notification' | 'update_records';
  /** Description of what was done */
  description: string;
  /** When the action was performed */
  timestamp: Date;
  /** Whether the action succeeded */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Offboarding record stored in Firestore
 */
export interface OffboardingRecord {
  id: string;
  orgId: string;
  /** The user being offboarded */
  userId: string;
  userName: string;
  userEmail: string;
  userRole: UserRole;
  /** Current status of the offboarding */
  status: OffboardingStatus;
  /** Options used for this offboarding */
  options: OffboardingOptions;
  /** Who initiated the offboarding */
  initiatedBy: string;
  initiatedByName: string;
  /** Timestamps */
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  /** The final report (populated when completed) */
  report?: OffboardingReport;
  /** Can be restored until this date (30 days after completion) */
  restorableUntil?: Date;
  /** If restored, when and by whom */
  restoredAt?: Date;
  restoredBy?: string;
}

/**
 * User data archive for compliance
 */
export interface UserDataArchive {
  id: string;
  orgId: string;
  userId: string;
  userName: string;
  userEmail: string;
  /** Snapshot of user profile at time of archival */
  profileSnapshot: Partial<UserProfile>;
  /** Summary of user's activity */
  activitySummary: {
    totalTasks: number;
    totalProjects: number;
    totalTimeEntries: number;
    totalExpenses: number;
    totalPhotos: number;
    lastActiveDate?: Date;
  };
  /** References to archived data collections */
  archivedCollections: {
    collection: string;
    documentCount: number;
  }[];
  /** When the archive was created */
  createdAt: Date;
  /** Who created the archive */
  createdBy: string;
  /** Retention period end date */
  retainUntil: Date;
}

/**
 * Offboarding wizard step
 */
export type OffboardingWizardStep =
  | 'confirm'           // Step 1: Confirm user to offboard
  | 'reassign'          // Step 2: Reassign tasks/projects
  | 'equipment_return'  // Step 3: Verify equipment returned
  | 'data_handling'     // Step 4: Archive vs delete data
  | 'review'            // Step 5: Review and confirm
  | 'processing'        // Processing state
  | 'complete';         // Final: Show completion report

/**
 * State for the offboarding wizard
 */
export interface OffboardingWizardState {
  currentStep: OffboardingWizardStep;
  /** User being offboarded */
  targetUser: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  } | null;
  /** Options being configured */
  options: Partial<OffboardingOptions>;
  /** User selected to receive reassigned items */
  reassignToUser: {
    id: string;
    name: string;
  } | null;
  /** Preview of what will be affected */
  impactPreview: {
    taskCount: number;
    projectCount: number;
    timeEntryCount: number;
    expenseCount: number;
  } | null;
  /** Processing status */
  isProcessing: boolean;
  /** Final report after completion */
  report: OffboardingReport | null;
  /** Any errors during the process */
  error: string | null;
}

/**
 * Status labels for offboarding
 */
export const OFFBOARDING_STATUS_LABELS: Record<OffboardingStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800' },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-800' },
};

// ===========================================
// AI INSIGHTS & ANOMALY DETECTION TYPES
// ===========================================

/**
 * Severity level for AI insights
 */
export type AIInsightSeverity = 'info' | 'warning' | 'critical';

/**
 * Type of AI insight
 */
export type AIInsightType = 'anomaly' | 'trend' | 'recommendation' | 'summary';

/**
 * Category of insight for filtering/grouping
 */
export type AIInsightCategory =
  | 'financial'
  | 'operational'
  | 'project_health'
  | 'productivity'
  | 'risk'
  | 'opportunity';

/**
 * Trend direction indicator
 */
export type TrendDirection = 'improving' | 'declining' | 'stable' | 'volatile';

/**
 * Action that can be taken from an insight
 */
export interface AIInsightAction {
  label: string;
  url?: string;
  type: 'navigate' | 'action' | 'external';
  actionId?: string;  // For programmatic actions
}

/**
 * Core AI Insight interface
 */
export interface AIInsight {
  id: string;
  type: AIInsightType;
  severity: AIInsightSeverity;
  category: AIInsightCategory;
  title: string;
  description: string;

  // Optional metric details
  metric?: string;
  value?: number;
  expectedValue?: number;
  deviation?: number;  // Percentage deviation from expected

  // Trend information
  trend?: TrendDirection;
  trendPeriod?: string;  // e.g., "last 30 days"

  // Comparison context
  comparisonType?: 'historical' | 'peer' | 'benchmark' | 'target';
  comparisonLabel?: string;
  comparisonValue?: number;

  // Actionable items
  action?: AIInsightAction;
  relatedEntityType?: string;
  relatedEntityId?: string;
  relatedEntityName?: string;

  // Metadata
  confidence: number;  // 0-1
  generatedAt: Date;
  expiresAt?: Date;
  source: 'statistical' | 'ml' | 'rule_based' | 'hybrid';
}

/**
 * Anomaly detection result
 */
export interface AnomalyDetectionResult {
  isAnomaly: boolean;
  value: number;
  expectedValue: number;
  deviation: number;  // Standard deviations from mean
  percentageDeviation: number;
  direction: 'above' | 'below';
  severity: AIInsightSeverity;
  method: 'zscore' | 'iqr' | 'percentage' | 'threshold';
}

/**
 * Trend analysis result
 */
export interface TrendAnalysisResult {
  direction: TrendDirection;
  changePercentage: number;
  slope: number;  // Rate of change
  rSquared: number;  // Goodness of fit
  forecastValue?: number;
  forecastPeriod?: string;
  dataPoints: number;
  periodLabel: string;
}

/**
 * Statistical summary for a metric
 */
export interface MetricStatistics {
  current: number;
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  q1: number;  // 25th percentile
  q3: number;  // 75th percentile
  iqr: number; // Interquartile range
  count: number;
}

/**
 * Project health score breakdown
 */
export interface ProjectHealthScore {
  overall: number;  // 0-100
  budgetHealth: number;
  scheduleHealth: number;
  taskHealth: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';

  // Component details
  budgetVariance: number;
  scheduleVariance: number;  // Days ahead (+) or behind (-)
  taskCompletionRate: number;
  overdueTaskCount: number;

  // Flags
  isAtRisk: boolean;
  riskFactors: string[];
}

/**
 * Financial insight data
 */
export interface FinancialInsightData {
  totalRevenue: number;
  totalExpenses: number;
  profitMargin: number;
  cashFlow: number;
  outstandingInvoices: number;
  overdueAmount: number;

  // Period comparisons
  revenueChange: number;
  expenseChange: number;
  marginChange: number;

  // Anomalies
  anomalies: {
    metric: string;
    result: AnomalyDetectionResult;
  }[];
}

/**
 * Operational insight data
 */
export interface OperationalInsightData {
  activeProjects: number;
  completedProjects: number;
  averageProjectDuration: number;
  onTimeCompletionRate: number;
  resourceUtilization: number;

  // Task metrics
  openTasks: number;
  completedTasks: number;
  overdueTasksCount: number;
  averageTaskCompletionTime: number;

  // Team metrics
  teamProductivity: number;
  hoursLogged: number;
}

/**
 * Natural language summary for reports
 */
export interface InsightSummary {
  headline: string;
  keyPoints: string[];
  recommendations: string[];
  outlook: 'positive' | 'neutral' | 'concerning';
  confidence: number;
  generatedAt: Date;
}

/**
 * Configuration for insight generation
 */
export interface InsightGenerationConfig {
  includeTrends: boolean;
  includeAnomalies: boolean;
  includeRecommendations: boolean;
  lookbackDays: number;
  sensitivityLevel: 'low' | 'medium' | 'high';  // Anomaly detection sensitivity
  maxInsights: number;
}

/**
 * Batch insight generation result
 */
export interface InsightGenerationResult {
  insights: AIInsight[];
  summary: InsightSummary;
  generatedAt: Date;
  processingTimeMs: number;
  dataPointsAnalyzed: number;
}
