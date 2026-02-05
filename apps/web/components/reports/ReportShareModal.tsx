'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { FormModal } from '@/components/ui/FormModal';
import { FormSection } from '@/components/ui/FormField';
import {
  LinkIcon,
  ClipboardIcon,
  CheckIcon,
  TrashIcon,
  GlobeAltIcon,
  LockClosedIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

export interface ReportShareConfig {
  id?: string;
  token: string;
  reportId: string;
  reportName: string;
  createdBy: string;
  createdAt: Date;
  expiresAt?: Date;
  enabled: boolean;
  viewCount: number;
}

interface ReportShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateShare: (config: { reportId: string; expiryDays: number | null }) => Promise<ReportShareConfig>;
  onRevokeShare: (shareId: string) => Promise<void>;
  reportId: string;
  reportName: string;
  existingShares: ReportShareConfig[];
}

const EXPIRY_OPTIONS = [
  { value: '', label: 'Never expires' },
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
];

function generateShareUrl(token: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/share/report/${token}`;
  }
  return `/share/report/${token}`;
}

export function ReportShareModal({
  isOpen,
  onClose,
  onCreateShare,
  onRevokeShare,
  reportId,
  reportName,
  existingShares,
}: ReportShareModalProps) {
  const [expiryDays, setExpiryDays] = useState<string>('30');
  const [loading, setLoading] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (copiedToken) {
      const timer = setTimeout(() => setCopiedToken(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedToken]);

  const handleCreateShare = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const share = await onCreateShare({
        reportId,
        expiryDays: expiryDays ? parseInt(expiryDays) : null,
      });
      // Auto-copy the new share link
      const url = generateShareUrl(share.token);
      await navigator.clipboard.writeText(url);
      setCopiedToken(share.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create share link');
    } finally {
      setLoading(false);
    }
  }, [reportId, expiryDays, onCreateShare]);

  const handleCopyLink = useCallback(async (token: string) => {
    const url = generateShareUrl(token);
    await navigator.clipboard.writeText(url);
    setCopiedToken(token);
  }, []);

  const handleRevoke = useCallback(async (shareId: string) => {
    try {
      await onRevokeShare(shareId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke share');
    }
  }, [onRevokeShare]);

  const activeShares = existingShares.filter(
    (s) => s.enabled && (!s.expiresAt || new Date(s.expiresAt) > new Date())
  );

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Share Report"
      description={`Create a shareable link for "${reportName}"`}
      hideFooter
      size="md"
    >
      {/* Create New Share Link */}
      <FormSection title="Create Share Link">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Link Expiry</label>
              <select
                value={expiryDays}
                onChange={(e) => setExpiryDays(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                {EXPIRY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCreateShare}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary-dark rounded-lg transition-colors disabled:opacity-50"
          >
            <LinkIcon className="h-4 w-4" />
            {loading ? 'Creating...' : 'Generate Share Link'}
          </button>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>
      </FormSection>

      {/* Active Shares */}
      {activeShares.length > 0 && (
        <FormSection title={`Active Links (${activeShares.length})`}>
          <div className="space-y-2">
            {activeShares.map((share) => {
              const url = generateShareUrl(share.token);
              const isCopied = copiedToken === share.token;
              const expiresText = share.expiresAt
                ? `Expires ${new Date(share.expiresAt).toLocaleDateString()}`
                : 'Never expires';

              return (
                <div
                  key={share.token}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <GlobeAltIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono text-gray-600 truncate">{url}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <ClockIcon className="h-3 w-3" />
                        {expiresText}
                      </span>
                      <span>{share.viewCount} view{share.viewCount !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyLink(share.token)}
                      className="p-2 text-gray-400 hover:text-brand-primary hover:bg-white rounded-lg transition-colors"
                      title="Copy link"
                    >
                      {isCopied ? (
                        <CheckIcon className="h-4 w-4 text-green-500" />
                      ) : (
                        <ClipboardIcon className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => share.id && handleRevoke(share.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg transition-colors"
                      title="Revoke link"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </FormSection>
      )}

      {/* Info */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
        <LockClosedIcon className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-700">
          Anyone with the link can view the report data. Revoke access anytime by deleting the link.
        </p>
      </div>
    </FormModal>
  );
}

export default ReportShareModal;
