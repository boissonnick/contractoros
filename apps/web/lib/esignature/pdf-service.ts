/**
 * PDF Generation Service
 * Handles PDF generation and storage for e-signature documents
 */

import { pdf } from '@react-pdf/renderer';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';
import { Estimate, Organization, QuotePdfTemplate } from '@/types';
import EstimatePdf from './pdf-templates/estimate-pdf';
import { SignatureDocumentType } from './types';

export interface PdfGenerationResult {
  success: boolean;
  url?: string;
  blob?: Blob;
  error?: string;
}

/**
 * Generate a PDF blob from an estimate
 */
export async function generateEstimatePdfBlob(
  estimate: Estimate,
  organization: Organization,
  includeSignatureFields = true,
  template?: QuotePdfTemplate
): Promise<Blob> {
  // Create the PDF document element
  const pdfDocument = EstimatePdf({
    estimate,
    organization,
    includeSignatureFields,
    template,
  });

  const blob = await pdf(pdfDocument).toBlob();
  return blob;
}

/**
 * Generate and upload an estimate PDF to Firebase Storage
 */
export async function generateAndUploadEstimatePdf(
  estimate: Estimate,
  organization: Organization,
  includeSignatureFields = true,
  template?: QuotePdfTemplate
): Promise<PdfGenerationResult> {
  try {
    // Generate the PDF blob
    const blob = await generateEstimatePdfBlob(estimate, organization, includeSignatureFields, template);

    // Create a unique filename
    const timestamp = Date.now();
    const filename = `estimate_${estimate.number}_${timestamp}.pdf`;
    const storagePath = `orgs/${organization.id}/documents/estimates/${estimate.id}/${filename}`;

    // Upload to Firebase Storage
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, blob, {
      contentType: 'application/pdf',
      customMetadata: {
        documentType: 'estimate',
        documentId: estimate.id,
        documentNumber: estimate.number,
        orgId: organization.id,
      },
    });

    // Get the download URL
    const url = await getDownloadURL(storageRef);

    return {
      success: true,
      url,
      blob,
    };
  } catch (error) {
    console.error('Error generating estimate PDF:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate PDF',
    };
  }
}

/**
 * Generate a PDF based on document type
 */
export async function generateDocumentPdf(
  documentType: SignatureDocumentType,
  documentId: string,
  organization: Organization,
  documentData: unknown
): Promise<PdfGenerationResult> {
  switch (documentType) {
    case 'estimate':
      return generateAndUploadEstimatePdf(
        documentData as Estimate,
        organization,
        true
      );

    case 'contract':
    case 'change_order':
    case 'scope_of_work':
    case 'invoice':
    case 'lien_waiver':
      // TODO: Implement other document types
      return {
        success: false,
        error: `PDF generation for ${documentType} is not yet implemented`,
      };

    case 'custom':
      return {
        success: false,
        error: 'Custom document PDF generation requires a custom template',
      };

    default:
      return {
        success: false,
        error: `Unknown document type: ${documentType}`,
      };
  }
}

/**
 * Generate a signed version of the PDF with signature overlay
 */
export async function generateSignedPdf(
  originalPdfUrl: string,
  signatureDataUrl: string,
  signerName: string,
  signedAt: Date,
  organization: Organization,
  documentId: string
): Promise<PdfGenerationResult> {
  // TODO: Implement signed PDF generation
  // This will require pdf-lib or similar library to overlay signatures on existing PDFs
  // For now, we'll store the signature data separately

  return {
    success: false,
    error: 'Signed PDF generation is not yet implemented',
  };
}

/**
 * Upload a pre-generated PDF blob to Firebase Storage
 */
export async function uploadPdfBlob(
  blob: Blob,
  orgId: string,
  documentType: SignatureDocumentType,
  documentId: string,
  filename: string
): Promise<PdfGenerationResult> {
  try {
    const storagePath = `orgs/${orgId}/documents/${documentType}s/${documentId}/${filename}`;
    const storageRef = ref(storage, storagePath);

    await uploadBytes(storageRef, blob, {
      contentType: 'application/pdf',
      customMetadata: {
        documentType,
        documentId,
        orgId,
      },
    });

    const url = await getDownloadURL(storageRef);

    return {
      success: true,
      url,
      blob,
    };
  } catch (error) {
    console.error('Error uploading PDF:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload PDF',
    };
  }
}
