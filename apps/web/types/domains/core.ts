/**
 * Core Types - User, Organization, Auth
 *
 * These are the foundational types used throughout the application.
 * ~150 lines - much smaller than the full 6000-line index.ts
 */

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

// ============================================
// Constants
// ============================================

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
