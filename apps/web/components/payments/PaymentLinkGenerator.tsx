"use client";

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button, Input } from '@/components/ui';
import { formatCurrency } from '@/lib/payments/paymentUtils';
import {
  LinkIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export interface PaymentLinkGeneratorProps {
  invoiceId: string;
  projectId: string;
  clientId: string;
  amount: number; // in cents
  clientEmail?: string;
  clientPhone?: string;
  onGenerateLink: (params: {
    invoiceId: string;
    projectId: string;
    clientId: string;
    amount: number;
    expirationDays?: number;
  }) => Promise<{ url: string; token: string; expiresAt: Date } | null>;
  onSendEmail?: (email: string, url: string) => Promise<void>;
  onSendSms?: (phone: string, url: string) => Promise<void>;
  className?: string;
}

/**
 * PaymentLinkGenerator - Generate and share payment links
 *
 * Features:
 * - Generate unique payment link
 * - Copy to clipboard
 * - Send via email
 * - Send via SMS
 * - Set expiration
 */
export default function PaymentLinkGenerator({
  invoiceId,
  projectId,
  clientId,
  amount,
  clientEmail = '',
  clientPhone = '',
  onGenerateLink,
  onSendEmail,
  onSendSms,
  className,
}: PaymentLinkGeneratorProps) {
  const [paymentLink, setPaymentLink] = useState<{ url: string; expiresAt: Date } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expirationDays, setExpirationDays] = useState(7);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [email, setEmail] = useState(clientEmail);
  const [phone, setPhone] = useState(clientPhone);
  const [sending, setSending] = useState(false);

  const handleGenerateLink = async () => {
    setGenerating(true);
    try {
      const result = await onGenerateLink({
        invoiceId,
        projectId,
        clientId,
        amount,
        expirationDays,
      });
      if (result) {
        setPaymentLink({ url: result.url, expiresAt: result.expiresAt });
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyLink = async () => {
    if (!paymentLink) return;
    try {
      await navigator.clipboard.writeText(paymentLink.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  };

  const handleSendEmail = async () => {
    if (!paymentLink || !email || !onSendEmail) return;
    setSending(true);
    try {
      await onSendEmail(email, paymentLink.url);
      setShowShareOptions(false);
    } finally {
      setSending(false);
    }
  };

  const handleSendSms = async () => {
    if (!paymentLink || !phone || !onSendSms) return;
    setSending(true);
    try {
      await onSendSms(phone, paymentLink.url);
      setShowShareOptions(false);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={cn('bg-white rounded-lg border border-gray-200 p-4', className)}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Link</h3>

      {!paymentLink ? (
        // Generate link form
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-600">Amount</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(amount / 100)}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Link Expiration
            </label>
            <select
              value={expirationDays}
              onChange={(e) => setExpirationDays(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <option value={1}>1 day</option>
              <option value={3}>3 days</option>
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
            </select>
          </div>

          <Button
            onClick={handleGenerateLink}
            loading={generating}
            className="w-full"
          >
            <LinkIcon className="h-4 w-4 mr-2" />
            Generate Payment Link
          </Button>
        </div>
      ) : (
        // Link generated view
        <div className="space-y-4">
          {/* Link display */}
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
            <input
              type="text"
              value={paymentLink.url}
              readOnly
              className="flex-1 bg-transparent text-sm text-gray-700 outline-none truncate"
            />
            <button
              onClick={handleCopyLink}
              className={cn(
                'p-2 rounded-lg transition-colors',
                copied ? 'bg-green-100 text-green-600' : 'bg-white text-gray-500 hover:text-gray-700'
              )}
            >
              {copied ? <CheckIcon className="h-4 w-4" /> : <ClipboardDocumentIcon className="h-4 w-4" />}
            </button>
          </div>

          {/* Expiration */}
          <p className="text-xs text-gray-500">
            Expires: {paymentLink.expiresAt.toLocaleDateString()}
          </p>

          {/* Share options */}
          {!showShareOptions ? (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={handleCopyLink}
                className="flex-1"
              >
                {copied ? (
                  <>
                    <CheckIcon className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <ClipboardDocumentIcon className="h-4 w-4 mr-2" />
                    Copy Link
                  </>
                )}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowShareOptions(true)}
                className="flex-1"
              >
                Share
              </Button>
            </div>
          ) : (
            <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Share Options</span>
                <button
                  onClick={() => setShowShareOptions(false)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Email */}
              {onSendEmail && (
                <div className="flex gap-2">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    className="flex-1"
                  />
                  <Button
                    variant="secondary"
                    onClick={handleSendEmail}
                    disabled={!email || sending}
                    loading={sending}
                  >
                    <EnvelopeIcon className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* SMS */}
              {onSendSms && (
                <div className="flex gap-2">
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone number"
                    className="flex-1"
                  />
                  <Button
                    variant="secondary"
                    onClick={handleSendSms}
                    disabled={!phone || sending}
                    loading={sending}
                  >
                    <DevicePhoneMobileIcon className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Regenerate */}
          <button
            onClick={() => setPaymentLink(null)}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Generate new link
          </button>
        </div>
      )}
    </div>
  );
}
