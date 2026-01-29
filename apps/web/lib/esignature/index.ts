/**
 * E-Signature Module
 * Sprint 3: FEAT-L1 - E-Signature System
 *
 * Provides functionality for:
 * - Sending documents for e-signature
 * - Client signing without login (magic links)
 * - Signature status tracking
 * - PDF generation with signature fields
 * - Legally binding audit trail
 */

// Types
export * from './types';

// Services
export {
  createSignatureRequest,
  sendSignatureRequest,
  cancelSignatureRequest,
  sendReminder,
  getProjectSignatureRequests,
  getOrgSignatureRequests,
  getSignatureRequest,
  generateSigningUrl,
} from './signature-service';

// PDF Generation
export {
  generateEstimatePdfBlob,
  generateAndUploadEstimatePdf,
  generateDocumentPdf,
  uploadPdfBlob,
} from './pdf-service';
