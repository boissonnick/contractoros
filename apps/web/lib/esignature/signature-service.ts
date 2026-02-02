/**
 * E-Signature Service
 * Handles creating, managing, and tracking signature requests
 */

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  SignatureRequest,
  SignerInfo,
  SignatureAuditEntry,
  SendForSignatureRequest,
  SendForSignatureResponse,
  SignatureDocumentType,
} from './types';
import { Estimate, Organization } from '@/types';
import { generateAndUploadEstimatePdf } from './pdf-service';

const SIGNATURE_REQUESTS_COLLECTION = 'signatureRequests';
const DEFAULT_EXPIRATION_DAYS = 30;

/**
 * Generate a unique access token for a signer
 */
function generateAccessToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Generate a signing URL for a signer
 */
export function generateSigningUrl(requestId: string, signerIndex: number): string {
  const token = btoa(`${requestId}:${signerIndex}`);
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  return `${baseUrl}/sign/${token}`;
}

/**
 * Create a new signature request
 */
export async function createSignatureRequest(
  request: SendForSignatureRequest,
  orgId: string,
  createdBy: string,
  createdByName: string,
  documentData?: unknown
): Promise<SendForSignatureResponse> {
  try {
    // Validate request
    if (!request.signers || request.signers.length === 0) {
      return { success: false, error: 'At least one signer is required' };
    }

    // Get organization for branding
    const orgDoc = await getDoc(doc(db, 'organizations', orgId));
    if (!orgDoc.exists()) {
      return { success: false, error: 'Organization not found' };
    }
    const organization = { id: orgDoc.id, ...orgDoc.data() } as Organization;

    // Generate PDF if document data is provided
    let pdfUrl: string | undefined;
    if (documentData && request.documentType === 'estimate') {
      const pdfResult = await generateAndUploadEstimatePdf(
        documentData as Estimate,
        organization,
        true
      );
      if (pdfResult.success) {
        pdfUrl = pdfResult.url;
      }
    }

    // Calculate expiration date
    const expirationDays = request.expirationDays || DEFAULT_EXPIRATION_DAYS;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);

    // Create signers with tokens
    const signers: SignerInfo[] = request.signers.map((signer, index) => ({
      id: `signer_${Date.now()}_${index}`,
      order: index + 1,
      name: signer.name,
      email: signer.email,
      phone: signer.phone,
      role: signer.role,
      accessToken: generateAccessToken(),
      tokenExpiresAt: expiresAt,
      status: 'pending',
      viewCount: 0,
      remindersSent: 0,
    }));

    // Create audit trail entry
    const auditEntry: SignatureAuditEntry = {
      id: `audit_${Date.now()}`,
      action: 'created',
      timestamp: new Date(),
      actorId: createdBy,
      actorName: createdByName,
      actorRole: 'sender',
      details: `Signature request created for ${signers.length} signer(s)`,
    };

    // Create the signature request
    const signatureRequest: Omit<SignatureRequest, 'id'> = {
      orgId,
      projectId: request.projectId,
      documentType: request.documentType,
      documentId: request.documentId,
      documentTitle: request.documentTitle,
      documentPdfUrl: pdfUrl,
      signers,
      currentSignerIndex: 0,
      status: 'draft',
      emailSubject: request.emailSubject,
      emailMessage: request.emailMessage,
      expiresAt,
      remindersSent: 0,
      auditTrail: [auditEntry],
      createdBy,
      createdByName,
      createdAt: new Date(),
    };

    // Save to Firestore
    const docRef = await addDoc(
      collection(db, SIGNATURE_REQUESTS_COLLECTION),
      {
        ...signatureRequest,
        expiresAt: Timestamp.fromDate(expiresAt),
        createdAt: Timestamp.now(),
      }
    );

    // Generate signing URLs
    const signingUrls = signers.map((signer, index) => ({
      email: signer.email,
      url: generateSigningUrl(docRef.id, index),
    }));

    return {
      success: true,
      signatureRequestId: docRef.id,
      signingUrls,
    };
  } catch (error) {
    console.error('Error creating signature request:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create signature request',
    };
  }
}

/**
 * Send signature request (changes status from draft to pending and sends emails)
 */
export async function sendSignatureRequest(
  requestId: string,
  senderId: string,
  senderName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const requestDoc = await getDoc(doc(db, SIGNATURE_REQUESTS_COLLECTION, requestId));
    if (!requestDoc.exists()) {
      return { success: false, error: 'Signature request not found' };
    }

    const request = { id: requestDoc.id, ...requestDoc.data() } as SignatureRequest;

    if (request.status !== 'draft') {
      return { success: false, error: 'Signature request has already been sent' };
    }

    // Update signer statuses to 'sent'
    const updatedSigners = request.signers.map((signer) => ({
      ...signer,
      status: 'sent' as const,
    }));

    // Add audit entry
    const auditEntry: SignatureAuditEntry = {
      id: `audit_${Date.now()}`,
      action: 'sent',
      timestamp: new Date(),
      actorId: senderId,
      actorName: senderName,
      actorRole: 'sender',
      details: `Sent to ${request.signers.length} recipient(s)`,
    };

    await updateDoc(doc(db, SIGNATURE_REQUESTS_COLLECTION, requestId), {
      status: 'pending',
      signers: updatedSigners,
      auditTrail: [...request.auditTrail, auditEntry],
      updatedAt: Timestamp.now(),
    });

    // Emails are sent automatically via Cloud Function (onSignatureRequestUpdated)
    // when status changes from 'draft' to 'pending'

    return { success: true };
  } catch (error) {
    console.error('Error sending signature request:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send signature request',
    };
  }
}

/**
 * Cancel a signature request
 */
export async function cancelSignatureRequest(
  requestId: string,
  userId: string,
  userName: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const requestDoc = await getDoc(doc(db, SIGNATURE_REQUESTS_COLLECTION, requestId));
    if (!requestDoc.exists()) {
      return { success: false, error: 'Signature request not found' };
    }

    const request = { id: requestDoc.id, ...requestDoc.data() } as SignatureRequest;

    if (request.status === 'signed') {
      return { success: false, error: 'Cannot cancel a signed document' };
    }

    // Add audit entry
    const auditEntry: SignatureAuditEntry = {
      id: `audit_${Date.now()}`,
      action: 'cancelled',
      timestamp: new Date(),
      actorId: userId,
      actorName: userName,
      actorRole: 'sender',
      details: reason || 'Cancelled by sender',
    };

    await updateDoc(doc(db, SIGNATURE_REQUESTS_COLLECTION, requestId), {
      status: 'cancelled',
      auditTrail: [...request.auditTrail, auditEntry],
      updatedAt: Timestamp.now(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error cancelling signature request:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel signature request',
    };
  }
}

/**
 * Send a reminder to a signer
 */
export async function sendReminder(
  requestId: string,
  signerIndex: number,
  orgId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Call the API endpoint to send reminder email and update Firestore
    const response = await fetch('/api/esignature/send-reminder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orgId,
        requestId,
        signerIndex,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to send reminder' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending reminder:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send reminder',
    };
  }
}

/**
 * Get signature requests for a project
 */
export async function getProjectSignatureRequests(
  projectId: string,
  orgId: string
): Promise<SignatureRequest[]> {
  try {
    const q = query(
      collection(db, SIGNATURE_REQUESTS_COLLECTION),
      where('projectId', '==', projectId),
      where('orgId', '==', orgId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as SignatureRequest[];
  } catch (error) {
    console.error('Error fetching project signature requests:', error);
    return [];
  }
}

/**
 * Get signature requests for an organization
 */
export async function getOrgSignatureRequests(
  orgId: string,
  options?: {
    status?: SignatureRequest['status'];
    limit?: number;
  }
): Promise<SignatureRequest[]> {
  try {
    let q = query(
      collection(db, SIGNATURE_REQUESTS_COLLECTION),
      where('orgId', '==', orgId),
      orderBy('createdAt', 'desc')
    );

    if (options?.status) {
      q = query(q, where('status', '==', options.status));
    }

    if (options?.limit) {
      q = query(q, limit(options.limit));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as SignatureRequest[];
  } catch (error) {
    console.error('Error fetching org signature requests:', error);
    return [];
  }
}

/**
 * Get a single signature request by ID
 */
export async function getSignatureRequest(
  requestId: string
): Promise<SignatureRequest | null> {
  try {
    const requestDoc = await getDoc(doc(db, SIGNATURE_REQUESTS_COLLECTION, requestId));
    if (!requestDoc.exists()) {
      return null;
    }
    return { id: requestDoc.id, ...requestDoc.data() } as SignatureRequest;
  } catch (error) {
    console.error('Error fetching signature request:', error);
    return null;
  }
}
