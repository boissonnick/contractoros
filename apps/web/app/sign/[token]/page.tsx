"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { SignatureRequest, SignerInfo, SignatureData, SignatureAuditEntry } from '@/lib/esignature/types';
import { Organization } from '@/types';
import SignaturePad from '@/components/esignature/SignaturePad';
import { Button, Card } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

type SigningPageStatus = 'loading' | 'ready' | 'signing' | 'signed' | 'declined' | 'expired' | 'invalid';

interface SigningPageState {
  status: SigningPageStatus;
  request: SignatureRequest | null;
  signer: SignerInfo | null;
  organization: Organization | null;
  error: string | null;
}

export default function SigningPage() {
  const params = useParams();
  const token = params.token as string;

  const [state, setState] = useState<SigningPageState>({
    status: 'loading',
    request: null,
    signer: null,
    organization: null,
    error: null,
  });

  const [signatureData, setSignatureData] = useState<SignatureData | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [showDeclineModal, setShowDeclineModal] = useState(false);

  // Fetch signature request data
  useEffect(() => {
    async function fetchSignatureRequest() {
      if (!token) {
        setState((s) => ({ ...s, status: 'invalid', error: 'Invalid signing link' }));
        return;
      }

      try {
        // Query for the signature request with this token
        // In production, you'd use a collection query with the token
        // For now, we'll assume the token is encoded as requestId:signerIndex
        const [requestId, signerIndex] = decodeToken(token);

        if (!requestId) {
          setState((s) => ({ ...s, status: 'invalid', error: 'Invalid signing link' }));
          return;
        }

        const requestDoc = await getDoc(doc(db, 'signatureRequests', requestId));

        if (!requestDoc.exists()) {
          setState((s) => ({ ...s, status: 'invalid', error: 'Signing request not found' }));
          return;
        }

        const request = { id: requestDoc.id, ...requestDoc.data() } as SignatureRequest;

        // Find the signer by token
        const signerIdx = signerIndex !== undefined
          ? signerIndex
          : request.signers.findIndex((s) => s.accessToken === token);

        if (signerIdx === -1) {
          setState((s) => ({ ...s, status: 'invalid', error: 'Invalid signing link' }));
          return;
        }

        const signer = request.signers[signerIdx];

        // Check if already signed
        if (signer.status === 'signed') {
          setState((s) => ({
            ...s,
            status: 'signed',
            request,
            signer,
          }));
          return;
        }

        // Check if declined
        if (signer.status === 'declined') {
          setState((s) => ({
            ...s,
            status: 'declined',
            request,
            signer,
          }));
          return;
        }

        // Check if expired
        if (request.expiresAt && new Date(request.expiresAt) < new Date()) {
          setState((s) => ({
            ...s,
            status: 'expired',
            request,
            signer,
          }));
          return;
        }

        // Check if request is cancelled
        if (request.status === 'cancelled') {
          setState((s) => ({
            ...s,
            status: 'invalid',
            request,
            signer,
            error: 'This signing request has been cancelled',
          }));
          return;
        }

        // Fetch organization for branding
        const orgDoc = await getDoc(doc(db, 'organizations', request.orgId));
        const organization = orgDoc.exists()
          ? ({ id: orgDoc.id, ...orgDoc.data() } as Organization)
          : null;

        // Record view event
        await recordView(request, signerIdx);

        setState({
          status: 'ready',
          request,
          signer,
          organization,
          error: null,
        });
      } catch (error) {
        console.error('Error fetching signature request:', error);
        setState((s) => ({
          ...s,
          status: 'invalid',
          error: 'Failed to load signing request',
        }));
      }
    }

    fetchSignatureRequest();
  }, [token]);

  // Decode token (format: base64(requestId:signerIndex))
  function decodeToken(token: string): [string | null, number | undefined] {
    try {
      const decoded = atob(token);
      const [requestId, indexStr] = decoded.split(':');
      const signerIndex = indexStr ? parseInt(indexStr, 10) : undefined;
      return [requestId, signerIndex];
    } catch {
      // Try treating token as just the request ID
      return [token, undefined];
    }
  }

  // Record view event
  async function recordView(request: SignatureRequest, signerIndex: number) {
    try {
      const signer = request.signers[signerIndex];
      const now = new Date();

      // Update signer view status
      const updatedSigners = [...request.signers];
      updatedSigners[signerIndex] = {
        ...signer,
        status: signer.status === 'pending' ? 'viewed' : signer.status,
        viewedAt: signer.viewedAt || now,
        viewCount: (signer.viewCount || 0) + 1,
        lastViewedAt: now,
      };

      // Add audit entry
      const auditEntry: SignatureAuditEntry = {
        id: `audit_${Date.now()}`,
        action: 'viewed',
        timestamp: now,
        actorId: signer.id,
        actorName: signer.name,
        actorEmail: signer.email,
        actorRole: 'signer',
        ipAddress: await getClientIp(),
        userAgent: navigator.userAgent,
      };

      await updateDoc(doc(db, 'signatureRequests', request.id), {
        signers: updatedSigners,
        status: request.status === 'pending' ? 'viewed' : request.status,
        auditTrail: [...request.auditTrail, auditEntry],
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error recording view:', error);
    }
  }

  // Get client IP (mock for now - in production use a service)
  async function getClientIp(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }

  // Handle sign document
  const handleSign = useCallback(async () => {
    if (!state.request || !state.signer || !signatureData || !agreedToTerms) return;

    setIsSubmitting(true);

    try {
      const now = new Date();
      const ipAddress = await getClientIp();
      const signerIndex = state.request.signers.findIndex((s) => s.id === state.signer!.id);

      // Update signer with signature
      const updatedSigners = [...state.request.signers];
      updatedSigners[signerIndex] = {
        ...state.signer,
        status: 'signed',
        signatureData,
        signedAt: now,
        signedIpAddress: ipAddress,
        signedUserAgent: navigator.userAgent,
      };

      // Check if all signers have signed
      const allSigned = updatedSigners.every((s) => s.status === 'signed');

      // Add audit entry
      const auditEntry: SignatureAuditEntry = {
        id: `audit_${Date.now()}`,
        action: 'signed',
        timestamp: now,
        actorId: state.signer.id,
        actorName: state.signer.name,
        actorEmail: state.signer.email,
        actorRole: 'signer',
        ipAddress,
        userAgent: navigator.userAgent,
        details: `Signed using ${signatureData.method} method`,
      };

      await updateDoc(doc(db, 'signatureRequests', state.request.id), {
        signers: updatedSigners,
        status: allSigned ? 'signed' : 'pending',
        completedAt: allSigned ? Timestamp.now() : null,
        auditTrail: [...state.request.auditTrail, auditEntry],
        updatedAt: Timestamp.now(),
      });

      setState((s) => ({ ...s, status: 'signed' }));
    } catch (error) {
      console.error('Error signing document:', error);
      setState((s) => ({ ...s, error: 'Failed to sign document. Please try again.' }));
    } finally {
      setIsSubmitting(false);
    }
  }, [state.request, state.signer, signatureData, agreedToTerms]);

  // Handle decline
  const handleDecline = useCallback(async () => {
    if (!state.request || !state.signer) return;

    setIsSubmitting(true);

    try {
      const now = new Date();
      const ipAddress = await getClientIp();
      const signerIndex = state.request.signers.findIndex((s) => s.id === state.signer!.id);

      // Update signer status to declined
      const updatedSigners = [...state.request.signers];
      updatedSigners[signerIndex] = {
        ...state.signer,
        status: 'declined',
        declinedAt: now,
        declineReason: declineReason || undefined,
      };

      // Add audit entry
      const auditEntry: SignatureAuditEntry = {
        id: `audit_${Date.now()}`,
        action: 'declined',
        timestamp: now,
        actorId: state.signer.id,
        actorName: state.signer.name,
        actorEmail: state.signer.email,
        actorRole: 'signer',
        ipAddress,
        userAgent: navigator.userAgent,
        details: declineReason || 'No reason provided',
      };

      await updateDoc(doc(db, 'signatureRequests', state.request.id), {
        signers: updatedSigners,
        status: 'declined',
        auditTrail: [...state.request.auditTrail, auditEntry],
        updatedAt: Timestamp.now(),
      });

      setState((s) => ({ ...s, status: 'declined' }));
      setShowDeclineModal(false);
    } catch (error) {
      console.error('Error declining document:', error);
      setState((s) => ({ ...s, error: 'Failed to decline document. Please try again.' }));
    } finally {
      setIsSubmitting(false);
    }
  }, [state.request, state.signer, declineReason]);

  // Render loading state
  if (state.status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  // Render invalid/expired states
  if (state.status === 'invalid' || state.status === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full p-8 text-center">
          {state.status === 'expired' ? (
            <ClockIcon className="h-16 w-16 text-yellow-500 mx-auto" />
          ) : (
            <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto" />
          )}
          <h1 className="mt-4 text-xl font-semibold text-gray-900">
            {state.status === 'expired' ? 'Link Expired' : 'Invalid Link'}
          </h1>
          <p className="mt-2 text-gray-600">
            {state.error || (state.status === 'expired'
              ? 'This signing link has expired. Please contact the sender for a new link.'
              : 'This signing link is not valid. Please check the link and try again.')}
          </p>
        </Card>
      </div>
    );
  }

  // Render signed state
  if (state.status === 'signed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircleIcon className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-gray-900">Document Signed!</h1>
          <p className="mt-2 text-gray-600">
            Thank you for signing. A copy of the signed document will be sent to your email.
          </p>
          {state.signer?.signedAt && (
            <p className="mt-4 text-sm text-gray-500">
              Signed on {format(new Date(state.signer.signedAt), 'MMMM d, yyyy \'at\' h:mm a')}
            </p>
          )}
        </Card>
      </div>
    );
  }

  // Render declined state
  if (state.status === 'declined') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <XCircleIcon className="h-10 w-10 text-red-600" />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-gray-900">Document Declined</h1>
          <p className="mt-2 text-gray-600">
            You have declined to sign this document. The sender has been notified.
          </p>
          {state.signer?.declineReason && (
            <p className="mt-4 text-sm text-gray-500">
              Reason: {state.signer.declineReason}
            </p>
          )}
        </Card>
      </div>
    );
  }

  // Main signing interface
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {state.organization?.logoURL ? (
              <img
                src={state.organization.logoURL}
                alt={state.organization.name}
                className="h-8 object-contain"
              />
            ) : (
              <span className="font-semibold text-gray-900">
                {state.organization?.name || 'ContractorOS'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <ShieldCheckIcon className="h-4 w-4 text-green-600" />
            Secure signing
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Document preview column */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-3">
                  <DocumentTextIcon className="h-6 w-6 text-gray-400" />
                  <div>
                    <h2 className="font-semibold text-gray-900">
                      {state.request?.documentTitle}
                    </h2>
                    <p className="text-sm text-gray-500">
                      From {state.organization?.name}
                    </p>
                  </div>
                </div>
              </div>

              {/* PDF Preview */}
              {state.request?.documentPdfUrl ? (
                <div className="aspect-[8.5/11] bg-white">
                  <iframe
                    src={`${state.request.documentPdfUrl}#toolbar=0`}
                    className="w-full h-full"
                    title="Document preview"
                  />
                </div>
              ) : (
                <div className="aspect-[8.5/11] bg-gray-100 flex items-center justify-center">
                  <p className="text-gray-500">Document preview not available</p>
                </div>
              )}
            </Card>
          </div>

          {/* Signing panel column */}
          <div className="space-y-6">
            {/* Signer info */}
            <Card className="p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Signing as</h3>
              <p className="font-semibold text-gray-900">{state.signer?.name}</p>
              <p className="text-sm text-gray-600">{state.signer?.email}</p>
              {state.signer?.role && (
                <p className="text-sm text-gray-500 mt-1">{state.signer.role}</p>
              )}
            </Card>

            {/* Signature pad */}
            <Card className="p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Your Signature</h3>
              <SignaturePad
                onSignatureChange={setSignatureData}
                height={120}
              />
            </Card>

            {/* Terms agreement */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="agree-terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
              />
              <label htmlFor="agree-terms" className="text-sm text-gray-600">
                I agree that my signature above will be the electronic representation of my
                signature for all purposes when using this signing service, just the same as a
                pen-and-paper signature.
              </label>
            </div>

            {/* Error message */}
            {state.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {state.error}
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-3">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleSign}
                disabled={!signatureData || !agreedToTerms || isSubmitting}
                icon={<CheckCircleIcon className="h-5 w-5" />}
              >
                {isSubmitting ? 'Signing...' : 'Sign Document'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => setShowDeclineModal(true)}
                disabled={isSubmitting}
              >
                Decline to Sign
              </Button>
            </div>

            {/* Expiration notice */}
            {state.request?.expiresAt && (
              <p className="text-xs text-center text-gray-500">
                This link expires on{' '}
                {format(new Date(state.request.expiresAt), 'MMMM d, yyyy')}
              </p>
            )}
          </div>
        </div>
      </main>

      {/* Decline modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Decline to Sign</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to decline signing this document? The sender will be notified.
            </p>
            <textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="Optional: Provide a reason for declining..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 resize-none"
              rows={3}
            />
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setShowDeclineModal(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1 !bg-red-600 hover:!bg-red-700"
                onClick={handleDecline}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Declining...' : 'Decline'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-8 py-4">
        <div className="max-w-4xl mx-auto px-4 text-center text-xs text-gray-500">
          <p>
            Powered by ContractorOS E-Signature • All signatures are legally binding and
            include a complete audit trail
          </p>
        </div>
      </footer>
    </div>
  );
}
