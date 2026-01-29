"use client";

import React, { useState, useCallback } from 'react';
import { Dialog } from '@headlessui/react';
import { useAuth } from '@/lib/auth';
import { Button, Input, Textarea } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  createSignatureRequest,
  sendSignatureRequest,
  SignatureDocumentType,
} from '@/lib/esignature';
import {
  XMarkIcon,
  PaperAirplaneIcon,
  PlusIcon,
  TrashIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

interface Signer {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
}

interface SendForSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: SignatureDocumentType;
  documentId: string;
  documentTitle: string;
  projectId?: string;
  documentData?: unknown;
  /** Pre-fill signer info if available */
  defaultSigner?: Partial<Signer>;
  onSuccess?: (signatureRequestId: string, signingUrls: { email: string; url: string }[]) => void;
}

const DEFAULT_EMAIL_SUBJECT = 'Please sign: {{document_title}}';
const DEFAULT_EMAIL_MESSAGE = `Hello {{signer_name}},

{{sender_name}} has sent you a document to review and sign.

Document: {{document_title}}

Please click the link below to review and sign the document. No account is needed.

If you have any questions, please reply to this email.

Thank you!`;

export default function SendForSignatureModal({
  isOpen,
  onClose,
  documentType,
  documentId,
  documentTitle,
  projectId,
  documentData,
  defaultSigner,
  onSuccess,
}: SendForSignatureModalProps) {
  const { profile } = useAuth();

  const [step, setStep] = useState<'signers' | 'message' | 'sending' | 'success' | 'error'>('signers');
  const [signers, setSigners] = useState<Signer[]>([
    {
      id: `signer_${Date.now()}`,
      name: defaultSigner?.name || '',
      email: defaultSigner?.email || '',
      phone: defaultSigner?.phone || '',
      role: defaultSigner?.role || 'Client',
    },
  ]);
  const [emailSubject, setEmailSubject] = useState(DEFAULT_EMAIL_SUBJECT.replace('{{document_title}}', documentTitle));
  const [emailMessage, setEmailMessage] = useState(DEFAULT_EMAIL_MESSAGE);
  const [expirationDays, setExpirationDays] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const [signingUrls, setSigningUrls] = useState<{ email: string; url: string }[]>([]);

  // Add a new signer
  const addSigner = useCallback(() => {
    setSigners((prev) => [
      ...prev,
      {
        id: `signer_${Date.now()}`,
        name: '',
        email: '',
        phone: '',
        role: 'Signer',
      },
    ]);
  }, []);

  // Remove a signer
  const removeSigner = useCallback((id: string) => {
    setSigners((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // Update a signer
  const updateSigner = useCallback((id: string, field: keyof Signer, value: string) => {
    setSigners((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  }, []);

  // Validate signers
  const validateSigners = useCallback(() => {
    for (const signer of signers) {
      if (!signer.name.trim()) {
        setError('Please enter a name for all signers');
        return false;
      }
      if (!signer.email.trim()) {
        setError('Please enter an email for all signers');
        return false;
      }
      // Basic email validation
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signer.email)) {
        setError(`Invalid email address: ${signer.email}`);
        return false;
      }
    }
    setError(null);
    return true;
  }, [signers]);

  // Handle send
  const handleSend = useCallback(async () => {
    if (!profile?.orgId || !profile.uid) return;

    setStep('sending');
    setError(null);

    try {
      // Create the signature request
      const result = await createSignatureRequest(
        {
          documentType,
          documentId,
          documentTitle,
          projectId,
          signers: signers.map((s) => ({
            name: s.name,
            email: s.email,
            phone: s.phone || undefined,
            role: s.role,
          })),
          emailSubject,
          emailMessage,
          expirationDays,
        },
        profile.orgId,
        profile.uid,
        profile.displayName,
        documentData
      );

      if (!result.success || !result.signatureRequestId) {
        setError(result.error || 'Failed to create signature request');
        setStep('error');
        return;
      }

      // Send the request (changes status to pending and triggers email)
      const sendResult = await sendSignatureRequest(
        result.signatureRequestId,
        profile.uid,
        profile.displayName
      );

      if (!sendResult.success) {
        setError(sendResult.error || 'Failed to send signature request');
        setStep('error');
        return;
      }

      setSigningUrls(result.signingUrls || []);
      setStep('success');
      onSuccess?.(result.signatureRequestId, result.signingUrls || []);
    } catch (err) {
      console.error('Error sending for signature:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setStep('error');
    }
  }, [
    profile,
    documentType,
    documentId,
    documentTitle,
    projectId,
    signers,
    emailSubject,
    emailMessage,
    expirationDays,
    documentData,
    onSuccess,
  ]);

  // Handle close
  const handleClose = useCallback(() => {
    // Reset state
    setStep('signers');
    setError(null);
    setSigningUrls([]);
    onClose();
  }, [onClose]);

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-primary-light rounded-lg">
                <DocumentTextIcon className="h-5 w-5 text-brand-primary" />
              </div>
              <div>
                <Dialog.Title className="text-lg font-semibold text-gray-900">
                  Send for Signature
                </Dialog.Title>
                <p className="text-sm text-gray-500">{documentTitle}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Step: Signers */}
            {step === 'signers' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">Who needs to sign?</h3>
                  <p className="text-sm text-gray-500">
                    Add the people who need to sign this document. They&apos;ll receive an email with a link to sign.
                  </p>
                </div>

                <div className="space-y-4">
                  {signers.map((signer, index) => (
                    <div
                      key={signer.id}
                      className="p-4 border border-gray-200 rounded-lg space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          Signer {index + 1}
                        </span>
                        {signers.length > 1 && (
                          <button
                            onClick={() => removeSigner(signer.id)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            title="Remove signer"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="relative">
                          <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            value={signer.name}
                            onChange={(e) => updateSigner(signer.id, 'name', e.target.value)}
                            placeholder="Full name"
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-sm"
                          />
                        </div>
                        <div className="relative">
                          <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="email"
                            value={signer.email}
                            onChange={(e) => updateSigner(signer.id, 'email', e.target.value)}
                            placeholder="Email address"
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-sm"
                          />
                        </div>
                        <div className="relative">
                          <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="tel"
                            value={signer.phone}
                            onChange={(e) => updateSigner(signer.id, 'phone', e.target.value)}
                            placeholder="Phone (optional)"
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-sm"
                          />
                        </div>
                        <input
                          type="text"
                          value={signer.role}
                          onChange={(e) => updateSigner(signer.id, 'role', e.target.value)}
                          placeholder="Role (e.g., Client, Property Owner)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-sm"
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={addSigner}
                    className="flex items-center gap-2 text-sm text-brand-primary hover:text-brand-primary-dark transition-colors"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add another signer
                  </button>
                </div>

                {/* Expiration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Signature expires in
                  </label>
                  <select
                    value={expirationDays}
                    onChange={(e) => setExpirationDays(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-sm"
                  >
                    <option value={7}>7 days</option>
                    <option value={14}>14 days</option>
                    <option value={30}>30 days</option>
                    <option value={60}>60 days</option>
                    <option value={90}>90 days</option>
                  </select>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {error}
                  </div>
                )}
              </div>
            )}

            {/* Step: Message */}
            {step === 'message' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">Customize your message</h3>
                  <p className="text-sm text-gray-500">
                    This message will be included in the email sent to signers.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Subject
                    </label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Message
                    </label>
                    <textarea
                      value={emailMessage}
                      onChange={(e) => setEmailMessage(e.target.value)}
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-sm resize-none"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Available variables: {`{{signer_name}}, {{sender_name}}, {{document_title}}`}
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {error}
                  </div>
                )}
              </div>
            )}

            {/* Step: Sending */}
            {step === 'sending' && (
              <div className="py-12 text-center">
                <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="mt-4 text-gray-600">Preparing document and sending...</p>
              </div>
            )}

            {/* Step: Success */}
            {step === 'success' && (
              <div className="py-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircleIcon className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">Sent Successfully!</h3>
                <p className="mt-2 text-gray-600">
                  Your document has been sent to {signers.length} recipient{signers.length > 1 ? 's' : ''} for signature.
                </p>

                {signingUrls.length > 0 && (
                  <div className="mt-6 text-left p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      You can also share these direct signing links:
                    </p>
                    <div className="space-y-2">
                      {signingUrls.map((url) => (
                        <div key={url.email} className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">{url.email}:</span>
                          <code className="flex-1 text-xs bg-white px-2 py-1 rounded border truncate">
                            {url.url}
                          </code>
                          <button
                            onClick={() => navigator.clipboard.writeText(url.url)}
                            className="text-xs text-brand-primary hover:text-brand-primary-dark"
                          >
                            Copy
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step: Error */}
            {step === 'error' && (
              <div className="py-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <ExclamationCircleIcon className="h-10 w-10 text-red-600" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">Something went wrong</h3>
                <p className="mt-2 text-gray-600">{error || 'Failed to send document for signature.'}</p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-4"
                  onClick={() => setStep('signers')}
                >
                  Try Again
                </Button>
              </div>
            )}
          </div>

          {/* Footer */}
          {(step === 'signers' || step === 'message') && (
            <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
              <div className="text-sm text-gray-500">
                {step === 'signers' && `${signers.length} signer${signers.length > 1 ? 's' : ''}`}
                {step === 'message' && 'Customize your message'}
              </div>
              <div className="flex gap-3">
                {step === 'message' && (
                  <Button variant="secondary" onClick={() => setStep('signers')}>
                    Back
                  </Button>
                )}
                {step === 'signers' && (
                  <Button
                    variant="primary"
                    onClick={() => {
                      if (validateSigners()) {
                        setStep('message');
                      }
                    }}
                  >
                    Next
                  </Button>
                )}
                {step === 'message' && (
                  <Button
                    variant="primary"
                    onClick={handleSend}
                    icon={<PaperAirplaneIcon className="h-4 w-4" />}
                  >
                    Send for Signature
                  </Button>
                )}
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="flex justify-end px-6 py-4 border-t bg-gray-50">
              <Button variant="primary" onClick={handleClose}>
                Done
              </Button>
            </div>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
