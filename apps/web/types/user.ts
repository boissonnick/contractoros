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

// ============================================
// Organization Types
// ============================================

export interface OrgBranding {
  logoURL?: string;
  primaryColor: string;     // hex e.g. "#2563eb"
  secondaryColor: string;   // hex
  accentColor: string;      // hex
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

// Organization Settings Extensions (Sprint 37B)
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
