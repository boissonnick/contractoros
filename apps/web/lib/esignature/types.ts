/**
 * E-Signature System Types
 * Sprint 3: FEAT-L1 - E-Signature System
 */

// ============================================
// Signature Request Types
// ============================================

export type SignatureRequestStatus =
  | 'draft'
  | 'pending'      // Sent, awaiting signature
  | 'viewed'       // Recipient opened the link
  | 'signed'       // Successfully signed
  | 'declined'     // Recipient declined to sign
  | 'expired'      // Past expiration date
  | 'cancelled';   // Sender cancelled

export type SignatureDocumentType =
  | 'estimate'
  | 'contract'
  | 'change_order'
  | 'scope_of_work'
  | 'invoice'
  | 'lien_waiver'
  | 'custom';

export interface SignatureRequest {
  id: string;
  orgId: string;
  projectId?: string;

  // Document being signed
  documentType: SignatureDocumentType;
  documentId?: string;      // Reference to estimate, contract, etc.
  documentTitle: string;
  documentPdfUrl?: string;  // Generated PDF URL

  // Signers (supports multi-party)
  signers: SignerInfo[];
  currentSignerIndex: number;

  // Status
  status: SignatureRequestStatus;

  // Message
  emailSubject?: string;
  emailMessage?: string;

  // Expiration
  expiresAt?: Date;
  remindersSent: number;
  lastReminderAt?: Date;

  // Completion
  completedAt?: Date;
  signedDocumentUrl?: string;

  // Audit trail
  auditTrail: SignatureAuditEntry[];

  // Metadata
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt?: Date;
}

// ============================================
// Signer Types
// ============================================

export type SignerStatus = 'pending' | 'sent' | 'viewed' | 'signed' | 'declined';

export interface SignerInfo {
  id: string;
  order: number;           // Signing order (1 = first, 2 = second, etc.)

  // Contact info
  name: string;
  email: string;
  phone?: string;

  // Role
  role: string;            // "Client", "Property Owner", "Contractor", etc.

  // Access
  accessToken: string;     // Magic link token
  tokenExpiresAt: Date;

  // Status
  status: SignerStatus;

  // Signature data
  signatureData?: SignatureData;
  signedAt?: Date;
  signedIpAddress?: string;
  signedUserAgent?: string;

  // Decline
  declinedAt?: Date;
  declineReason?: string;

  // Tracking
  viewedAt?: Date;
  viewCount: number;
  lastViewedAt?: Date;

  // Reminders
  remindersSent: number;
  lastReminderAt?: Date;
}

// ============================================
// Signature Data Types
// ============================================

export type SignatureMethod = 'draw' | 'type' | 'upload';

export interface SignatureData {
  method: SignatureMethod;

  // For drawn signatures
  drawingData?: string;     // Base64 encoded SVG or PNG

  // For typed signatures
  typedName?: string;
  typedFont?: string;       // Font family used

  // For uploaded signatures
  uploadedImageUrl?: string;

  // Common fields
  width?: number;
  height?: number;
}

// ============================================
// Signature Field Types (for document positioning)
// ============================================

export type SignatureFieldType = 'signature' | 'initials' | 'date' | 'text' | 'checkbox';

export interface SignatureField {
  id: string;
  type: SignatureFieldType;
  signerId: string;         // Which signer this field is for

  // Position on PDF
  page: number;
  x: number;                // X coordinate (points from left)
  y: number;                // Y coordinate (points from bottom)
  width: number;
  height: number;

  // For text fields
  label?: string;
  placeholder?: string;
  required: boolean;

  // Value (filled in when signed)
  value?: string;
  signatureData?: SignatureData;
}

// ============================================
// Audit Trail Types
// ============================================

export type SignatureAuditAction =
  | 'created'
  | 'sent'
  | 'viewed'
  | 'signed'
  | 'declined'
  | 'reminder_sent'
  | 'expired'
  | 'cancelled'
  | 'downloaded'
  | 'voided';

export interface SignatureAuditEntry {
  id: string;
  action: SignatureAuditAction;
  timestamp: Date;

  // Actor info
  actorId?: string;         // User ID or signer ID
  actorName?: string;
  actorEmail?: string;
  actorRole?: string;       // "sender", "signer", "system"

  // Technical details for legal compliance
  ipAddress?: string;
  userAgent?: string;
  geoLocation?: {
    city?: string;
    region?: string;
    country?: string;
  };

  // Additional details
  details?: string;
  metadata?: Record<string, unknown>;
}

// ============================================
// Email Template Types
// ============================================

export interface SignatureEmailTemplate {
  id: string;
  orgId: string;
  name: string;
  subject: string;
  body: string;             // HTML with placeholders like {{client_name}}, {{document_title}}
  isDefault: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

// ============================================
// Signature Settings Types
// ============================================

export interface SignatureSettings {
  orgId: string;

  // Expiration
  defaultExpirationDays: number;

  // Reminders
  autoRemindersEnabled: boolean;
  reminderDays: number[];    // Days before expiration to send reminders

  // Branding
  includeCompanyLogo: boolean;
  customFooterText?: string;

  // Notifications
  notifySenderOnView: boolean;
  notifySenderOnSign: boolean;
  notifySenderOnDecline: boolean;

  // Security
  requirePhoneVerification: boolean;
  requireAccessCode: boolean;

  updatedAt?: Date;
}

// ============================================
// API Response Types
// ============================================

export interface SendForSignatureRequest {
  documentType: SignatureDocumentType;
  documentId?: string;
  documentTitle: string;
  projectId?: string;

  signers: {
    name: string;
    email: string;
    phone?: string;
    role: string;
  }[];

  emailSubject?: string;
  emailMessage?: string;
  expirationDays?: number;
}

export interface SendForSignatureResponse {
  success: boolean;
  signatureRequestId?: string;
  signingUrls?: { email: string; url: string }[];
  error?: string;
}

export interface SignDocumentRequest {
  token: string;
  signatureData: SignatureData;
  agreedToTerms: boolean;
  fields?: { fieldId: string; value: string }[];
}

export interface SignDocumentResponse {
  success: boolean;
  message?: string;
  signedDocumentUrl?: string;
  error?: string;
}

// ============================================
// PDF Generation Types
// ============================================

export interface PdfGenerationOptions {
  documentType: SignatureDocumentType;
  documentId: string;
  includeSignatureFields: boolean;
  signatureFields?: SignatureField[];

  // Styling
  paperSize?: 'letter' | 'a4';
  orientation?: 'portrait' | 'landscape';
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };

  // Branding
  includeHeader: boolean;
  includeFooter: boolean;
  includeLogo: boolean;
}
