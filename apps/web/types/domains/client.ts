/**
 * Client Types - Client Management Module (FEAT-L4)
 *
 * Types for client CRM functionality including:
 * - Client profiles and status
 * - Communication logs
 * - Client preferences
 * - Financial tracking
 *
 * ~120 lines
 */

// ============================================
// Client Status & Source
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

// ============================================
// Client Sub-Types
// ============================================

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

// ============================================
// Client Preferences
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

// ============================================
// Main Client Interface
// ============================================

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

// ============================================
// Communication Log
// ============================================

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
// Client Onboarding Token (Magic Links)
// ============================================

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
