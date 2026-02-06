/**
 * PDF Generation Service
 * Handles PDF generation and storage for e-signature documents
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { logger } from '@/lib/utils/logger';

// Lazy-load @react-pdf/renderer to reduce initial bundle size (~3MB)
async function renderPdfToBlob(document: any): Promise<Blob> {
  const { pdf } = await import('@react-pdf/renderer');
  return pdf(document).toBlob();
}
import { ref, uploadBytes, getDownloadURL, getBlob } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';
import { Estimate, Organization, QuotePdfTemplate, ChangeOrder, Invoice, LienWaiver } from '@/types';
import EstimatePdf from './pdf-templates/estimate-pdf';
import ContractPdf from './pdf-templates/contract-template';
import ChangeOrderPdf from './pdf-templates/change-order-template';
import ScopeOfWorkPdf from './pdf-templates/scope-of-work-template';
import InvoicePdf from './pdf-templates/invoice-template';
import LienWaiverPdf from './pdf-templates/lien-waiver-template';
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

  const blob = await renderPdfToBlob(pdfDocument);
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
    logger.error('Error generating estimate PDF', { error, module: 'pdf-service' });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate PDF',
    };
  }
}

/**
 * Contract document data interface
 */
export interface ContractData {
  id: string;
  number: string;
  projectName: string;
  projectAddress?: string;
  clientName: string;
  clientEmail?: string;
  clientAddress?: string;
  contractAmount: number;
  startDate?: Date;
  endDate?: Date;
  scopeOfWork: string;
  paymentTerms?: string;
  termsAndConditions?: string;
  createdAt: Date;
}

/**
 * Scope of Work document data interface
 */
export interface ScopeOfWorkData {
  id: string;
  number: string;
  projectName: string;
  projectAddress?: string;
  clientName: string;
  version: number;
  scope: string;
  inclusions?: string[];
  exclusions?: string[];
  assumptions?: string[];
  deliverables?: string[];
  createdAt: Date;
}

/**
 * Generate and upload a contract PDF
 */
export async function generateAndUploadContractPdf(
  contract: ContractData,
  organization: Organization
): Promise<PdfGenerationResult> {
  try {
    const pdfDocument = ContractPdf({ contract, organization });
    const blob = await renderPdfToBlob(pdfDocument);

    const timestamp = Date.now();
    const filename = `contract_${contract.number}_${timestamp}.pdf`;
    const storagePath = `orgs/${organization.id}/documents/contracts/${contract.id}/${filename}`;

    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, blob, {
      contentType: 'application/pdf',
      customMetadata: {
        documentType: 'contract',
        documentId: contract.id,
        documentNumber: contract.number,
        orgId: organization.id,
      },
    });

    const url = await getDownloadURL(storageRef);
    return { success: true, url, blob };
  } catch (error) {
    logger.error('Error generating contract PDF', { error, module: 'pdf-service' });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate PDF',
    };
  }
}

/**
 * Generate and upload a change order PDF
 */
export async function generateAndUploadChangeOrderPdf(
  changeOrder: ChangeOrder,
  organization: Organization
): Promise<PdfGenerationResult> {
  try {
    const pdfDocument = ChangeOrderPdf({ changeOrder, organization });
    const blob = await renderPdfToBlob(pdfDocument);

    const timestamp = Date.now();
    const filename = `change_order_${changeOrder.number}_${timestamp}.pdf`;
    const storagePath = `orgs/${organization.id}/documents/change_orders/${changeOrder.id}/${filename}`;

    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, blob, {
      contentType: 'application/pdf',
      customMetadata: {
        documentType: 'change_order',
        documentId: changeOrder.id,
        documentNumber: changeOrder.number,
        orgId: organization.id,
      },
    });

    const url = await getDownloadURL(storageRef);
    return { success: true, url, blob };
  } catch (error) {
    logger.error('Error generating change order PDF', { error, module: 'pdf-service' });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate PDF',
    };
  }
}

/**
 * Generate and upload a scope of work PDF
 */
export async function generateAndUploadScopeOfWorkPdf(
  sow: ScopeOfWorkData,
  organization: Organization
): Promise<PdfGenerationResult> {
  try {
    const pdfDocument = ScopeOfWorkPdf({ scopeOfWork: sow, organization });
    const blob = await renderPdfToBlob(pdfDocument);

    const timestamp = Date.now();
    const filename = `sow_${sow.number}_${timestamp}.pdf`;
    const storagePath = `orgs/${organization.id}/documents/scope_of_work/${sow.id}/${filename}`;

    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, blob, {
      contentType: 'application/pdf',
      customMetadata: {
        documentType: 'scope_of_work',
        documentId: sow.id,
        documentNumber: sow.number,
        orgId: organization.id,
      },
    });

    const url = await getDownloadURL(storageRef);
    return { success: true, url, blob };
  } catch (error) {
    logger.error('Error generating scope of work PDF', { error, module: 'pdf-service' });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate PDF',
    };
  }
}

/**
 * Generate and upload an invoice PDF
 */
export async function generateAndUploadInvoicePdf(
  invoice: Invoice,
  organization: Organization
): Promise<PdfGenerationResult> {
  try {
    const pdfDocument = InvoicePdf({ invoice, organization });
    const blob = await renderPdfToBlob(pdfDocument);

    const timestamp = Date.now();
    const filename = `invoice_${invoice.number}_${timestamp}.pdf`;
    const storagePath = `orgs/${organization.id}/documents/invoices/${invoice.id}/${filename}`;

    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, blob, {
      contentType: 'application/pdf',
      customMetadata: {
        documentType: 'invoice',
        documentId: invoice.id,
        documentNumber: invoice.number,
        orgId: organization.id,
      },
    });

    const url = await getDownloadURL(storageRef);
    return { success: true, url, blob };
  } catch (error) {
    logger.error('Error generating invoice PDF', { error, module: 'pdf-service' });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate PDF',
    };
  }
}

/**
 * Generate and upload a lien waiver PDF
 */
export async function generateAndUploadLienWaiverPdf(
  lienWaiver: LienWaiver,
  organization: Organization
): Promise<PdfGenerationResult> {
  try {
    const pdfDocument = LienWaiverPdf({ lienWaiver, organization });
    const blob = await renderPdfToBlob(pdfDocument);

    const timestamp = Date.now();
    const filename = `lien_waiver_${lienWaiver.id}_${timestamp}.pdf`;
    const storagePath = `orgs/${organization.id}/documents/lien_waivers/${lienWaiver.id}/${filename}`;

    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, blob, {
      contentType: 'application/pdf',
      customMetadata: {
        documentType: 'lien_waiver',
        documentId: lienWaiver.id,
        orgId: organization.id,
      },
    });

    const url = await getDownloadURL(storageRef);
    return { success: true, url, blob };
  } catch (error) {
    logger.error('Error generating lien waiver PDF', { error, module: 'pdf-service' });
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
      return generateAndUploadContractPdf(
        documentData as ContractData,
        organization
      );

    case 'change_order':
      return generateAndUploadChangeOrderPdf(
        documentData as ChangeOrder,
        organization
      );

    case 'scope_of_work':
      return generateAndUploadScopeOfWorkPdf(
        documentData as ScopeOfWorkData,
        organization
      );

    case 'invoice':
      return generateAndUploadInvoicePdf(
        documentData as Invoice,
        organization
      );

    case 'lien_waiver':
      return generateAndUploadLienWaiverPdf(
        documentData as LienWaiver,
        organization
      );

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
  documentId: string,
  documentType: SignatureDocumentType = 'contract'
): Promise<PdfGenerationResult> {
  try {
    // Fetch the original PDF
    let pdfBytes: ArrayBuffer;

    if (originalPdfUrl.startsWith('gs://') || originalPdfUrl.includes('firebasestorage')) {
      // Firebase Storage URL - fetch via storage API
      const storageRef = ref(storage, originalPdfUrl.replace(/^gs:\/\/[^\/]+\//, ''));
      const blob = await getBlob(storageRef);
      pdfBytes = await blob.arrayBuffer();
    } else {
      // Regular URL - fetch directly
      const response = await fetch(originalPdfUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.statusText}`);
      }
      pdfBytes = await response.arrayBuffer();
    }

    // Load the PDF document
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Get the last page (where signatures typically go)
    const pages = pdfDoc.getPages();
    const lastPage = pages[pages.length - 1];
    const { width: _width, height: _height } = lastPage.getSize();

    // Embed the signature image
    let signatureImage;
    if (signatureDataUrl.startsWith('data:image/png')) {
      const signatureImageBytes = Uint8Array.from(
        atob(signatureDataUrl.split(',')[1]),
        c => c.charCodeAt(0)
      );
      signatureImage = await pdfDoc.embedPng(signatureImageBytes);
    } else if (signatureDataUrl.startsWith('data:image/jpeg') || signatureDataUrl.startsWith('data:image/jpg')) {
      const signatureImageBytes = Uint8Array.from(
        atob(signatureDataUrl.split(',')[1]),
        c => c.charCodeAt(0)
      );
      signatureImage = await pdfDoc.embedJpg(signatureImageBytes);
    } else {
      // Assume PNG if no prefix
      const signatureImageBytes = Uint8Array.from(
        atob(signatureDataUrl.replace(/^data:[^;]+;base64,/, '')),
        c => c.charCodeAt(0)
      );
      signatureImage = await pdfDoc.embedPng(signatureImageBytes);
    }

    // Calculate signature dimensions (maintain aspect ratio)
    const sigDims = signatureImage.scale(0.5);
    const maxWidth = 150;
    const maxHeight = 60;
    const scale = Math.min(maxWidth / sigDims.width, maxHeight / sigDims.height, 1);
    const sigWidth = sigDims.width * scale;
    const sigHeight = sigDims.height * scale;

    // Position signature (lower left area for signature line)
    const signatureX = 72; // 1 inch from left
    const signatureY = 120; // Above footer area

    // Draw signature image
    lastPage.drawImage(signatureImage, {
      x: signatureX,
      y: signatureY,
      width: sigWidth,
      height: sigHeight,
    });

    // Embed font for text
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Add signer name below signature
    lastPage.drawText(signerName, {
      x: signatureX,
      y: signatureY - 15,
      size: 10,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    });

    // Add signed date
    const formattedDate = signedAt.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    lastPage.drawText(`Signed: ${formattedDate}`, {
      x: signatureX,
      y: signatureY - 28,
      size: 9,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Add verification text at bottom
    const verificationText = `Electronically signed via ContractorOS | Document ID: ${documentId}`;
    lastPage.drawText(verificationText, {
      x: 72,
      y: 30,
      size: 7,
      font: font,
      color: rgb(0.6, 0.6, 0.6),
    });

    // Save the modified PDF
    const modifiedPdfBytes = await pdfDoc.save();
    // Convert Uint8Array to ArrayBuffer for Blob compatibility
    const arrayBuffer = modifiedPdfBytes.buffer.slice(
      modifiedPdfBytes.byteOffset,
      modifiedPdfBytes.byteOffset + modifiedPdfBytes.byteLength
    ) as ArrayBuffer;
    const modifiedBlob = new Blob([arrayBuffer], { type: 'application/pdf' });

    // Upload the signed PDF
    const timestamp = Date.now();
    const filename = `signed_${documentId}_${timestamp}.pdf`;
    const storagePath = `orgs/${organization.id}/documents/signed/${documentId}/${filename}`;
    const storageRef = ref(storage, storagePath);

    await uploadBytes(storageRef, modifiedBlob, {
      contentType: 'application/pdf',
      customMetadata: {
        documentType,
        documentId,
        orgId: organization.id,
        signedBy: signerName,
        signedAt: signedAt.toISOString(),
      },
    });

    const url = await getDownloadURL(storageRef);

    return {
      success: true,
      url,
      blob: modifiedBlob,
    };
  } catch (error) {
    logger.error('Error generating signed PDF', { error, module: 'pdf-service' });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate signed PDF',
    };
  }
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
    logger.error('Error uploading PDF', { error, module: 'pdf-service' });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload PDF',
    };
  }
}
