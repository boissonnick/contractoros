"use client";

import React, { useRef, useState, useMemo } from 'react';
import {
  DocumentArrowUpIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  XCircleIcon,
  FunnelIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils';
import { logger } from '@/lib/utils/logger';
import { Button } from '@/components/ui';
import {
  ComplianceDocType,
  ComplianceStatus,
  COMPLIANCE_DOC_TYPE_LABELS,
  COMPLIANCE_STATUS_LABELS,
} from '@/types';
import { useSubCompliance, REQUIRED_DOC_TYPES } from '@/lib/hooks/useSubCompliance';

interface ComplianceVaultProps {
  subcontractorId: string;
}

type StatusFilter = 'all' | ComplianceStatus;

const STATUS_COLORS: Record<ComplianceStatus, { bg: string; text: string; dot: string }> = {
  valid: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  expiring_soon: { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  expired: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  missing: { bg: 'bg-gray-50', text: 'text-gray-500', dot: 'bg-gray-400' },
};

const STATUS_ICONS: Record<ComplianceStatus, React.ReactNode> = {
  valid: <CheckCircleIcon className="h-4 w-4 text-green-500" />,
  expiring_soon: <ClockIcon className="h-4 w-4 text-yellow-500" />,
  expired: <XCircleIcon className="h-4 w-4 text-red-500" />,
  missing: <ExclamationTriangleIcon className="h-4 w-4 text-gray-400" />,
};

function daysUntil(date: Date): number {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function expiryLabel(expiryDate?: Date): string | null {
  if (!expiryDate) return null;
  const days = daysUntil(expiryDate);
  if (days < 0) return `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago`;
  if (days === 0) return 'Expires today';
  if (days === 1) return 'Expires tomorrow';
  if (days <= 30) return `Expires in ${days} days`;
  return `Expires ${formatDate(expiryDate)}`;
}

export default function ComplianceVault({ subcontractorId }: ComplianceVaultProps) {
  const { user, profile } = useAuth();
  const {
    documents,
    loading,
    error,
    addDocument,
    deleteDocument,
    getComplianceStatus,
  } = useSubCompliance(subcontractorId);

  const [filter, setFilter] = useState<StatusFilter>('all');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedDocType, setSelectedDocType] = useState<ComplianceDocType>('insurance_coi');
  const [expiryDateInput, setExpiryDateInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const overview = useMemo(() => getComplianceStatus(), [getComplianceStatus]);

  const filteredDocs = useMemo(() => {
    if (filter === 'all') return documents;
    return documents.filter((d) => d.status === filter);
  }, [documents, filter]);

  // Determine which required doc types are missing
  const missingDocTypes = useMemo(() => {
    const present = new Set(documents.map((d) => d.type));
    return REQUIRED_DOC_TYPES.filter((t) => !present.has(t));
  }, [documents]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !profile?.orgId) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const storagePath = `organizations/${profile.orgId}/compliance/${subcontractorId}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      const url = await new Promise<string>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snap) => setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
          (err) => {
            logger.error('Compliance doc upload error', { error: err, component: 'ComplianceVault' });
            reject(err);
          },
          async () => {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadUrl);
          }
        );
      });

      await addDocument({
        subcontractorId,
        type: selectedDocType,
        name: COMPLIANCE_DOC_TYPE_LABELS[selectedDocType],
        fileUrl: url,
        fileName: file.name,
        expiryDate: expiryDateInput ? new Date(expiryDateInput) : undefined,
      });

      setExpiryDateInput('');
    } catch (err) {
      logger.error('Failed to upload compliance document', { error: err, component: 'ComplianceVault' });
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (docId: string) => {
    if (!window.confirm('Remove this compliance document?')) return;
    await deleteDocument(docId);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-6 w-48 bg-gray-200 rounded" />
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg" />
          ))}
        </div>
        <div className="h-32 bg-gray-100 rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
        <ExclamationTriangleIcon className="inline h-4 w-4 mr-1" />
        Failed to load compliance documents: {error}
      </div>
    );
  }

  const overallBadge = overview.overallStatus === 'compliant'
    ? { label: 'Compliant', className: 'bg-green-100 text-green-700' }
    : overview.overallStatus === 'at_risk'
      ? { label: 'At Risk', className: 'bg-yellow-100 text-yellow-700' }
      : { label: 'Non-Compliant', className: 'bg-red-100 text-red-700' };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheckIcon className="h-5 w-5 text-gray-600" />
          <h3 className="text-base font-semibold text-gray-900">Compliance Vault</h3>
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', overallBadge.className)}>
            {overallBadge.label}
          </span>
        </div>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {([
          { key: 'valid' as const, count: overview.valid, label: 'Valid' },
          { key: 'expiring_soon' as const, count: overview.expiringSoon, label: 'Expiring Soon' },
          { key: 'expired' as const, count: overview.expired, label: 'Expired' },
          { key: 'missing' as const, count: overview.missing, label: 'Missing' },
        ]).map(({ key, count, label }) => (
          <button
            key={key}
            onClick={() => setFilter(filter === key ? 'all' : key)}
            className={cn(
              'rounded-lg p-3 text-left transition-all border',
              filter === key ? 'ring-2 ring-blue-500 border-blue-200' : 'border-gray-200 hover:border-gray-300',
              STATUS_COLORS[key].bg
            )}
          >
            <div className="flex items-center gap-2">
              {STATUS_ICONS[key]}
              <span className={cn('text-lg font-bold', STATUS_COLORS[key].text)}>{count}</span>
            </div>
            <p className="text-xs text-gray-600 mt-0.5">{label}</p>
          </button>
        ))}
      </div>

      {/* Upload Section */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm font-medium text-gray-700 mb-3">Upload Document</p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Document Type</label>
            <select
              value={selectedDocType}
              onChange={(e) => setSelectedDocType(e.target.value as ComplianceDocType)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
            >
              {Object.entries(COMPLIANCE_DOC_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Expiry Date (optional)</label>
            <input
              type="date"
              value={expiryDateInput}
              onChange={(e) => setExpiryDateInput(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
            />
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            icon={<DocumentArrowUpIcon className="h-4 w-4" />}
          >
            {uploading ? `Uploading ${uploadProgress}%` : 'Choose File'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={handleUpload}
          />
        </div>

        {uploading && (
          <div className="mt-3">
            <div className="h-1.5 bg-blue-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Required Documents Checklist */}
      {missingDocTypes.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-800 mb-2">
            <ExclamationTriangleIcon className="inline h-4 w-4 mr-1" />
            Missing Required Documents
          </p>
          <ul className="space-y-1">
            {missingDocTypes.map((type) => (
              <li key={type} className="flex items-center gap-2 text-sm text-amber-700">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                {COMPLIANCE_DOC_TYPE_LABELS[type]}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Filter indicator */}
      {filter !== 'all' && (
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-500">
            Showing: {COMPLIANCE_STATUS_LABELS[filter]}
          </span>
          <button onClick={() => setFilter('all')} className="text-xs text-blue-600 hover:underline">
            Clear filter
          </button>
        </div>
      )}

      {/* Document List */}
      {filteredDocs.length === 0 && filter === 'all' && (
        <div className="text-center py-8 text-gray-400">
          <ShieldCheckIcon className="h-10 w-10 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No compliance documents uploaded yet.</p>
          <p className="text-xs mt-1">Use the upload section above to add documents.</p>
        </div>
      )}

      {filteredDocs.length === 0 && filter !== 'all' && (
        <p className="text-sm text-gray-400 py-4 text-center">
          No documents with status &quot;{COMPLIANCE_STATUS_LABELS[filter]}&quot;.
        </p>
      )}

      <div className="space-y-2">
        {filteredDocs.map((compDoc) => {
          const statusColor = STATUS_COLORS[compDoc.status];
          const expLabel = expiryLabel(compDoc.expiryDate);
          return (
            <div
              key={compDoc.id}
              className={cn(
                'flex items-center justify-between px-4 py-3 rounded-lg border',
                compDoc.status === 'expired' ? 'border-red-200 bg-red-50' :
                compDoc.status === 'expiring_soon' ? 'border-yellow-200 bg-yellow-50' :
                'border-gray-200 bg-white'
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
                    statusColor.bg, statusColor.text
                  )}>
                    <span className={cn('h-1.5 w-1.5 rounded-full', statusColor.dot)} />
                    {COMPLIANCE_STATUS_LABELS[compDoc.status]}
                  </span>
                  <span className="text-xs font-medium px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                    {COMPLIANCE_DOC_TYPE_LABELS[compDoc.type]}
                  </span>
                </div>
                <p className="text-sm text-gray-900 mt-1 truncate">
                  {compDoc.fileName || compDoc.name}
                </p>
                {expLabel && (
                  <p className={cn(
                    'text-xs mt-0.5',
                    compDoc.status === 'expired' ? 'text-red-600 font-medium' :
                    compDoc.status === 'expiring_soon' ? 'text-yellow-600' :
                    'text-gray-500'
                  )}>
                    {compDoc.status === 'expired' && <XCircleIcon className="inline h-3 w-3 mr-0.5" />}
                    {compDoc.status === 'expiring_soon' && <ClockIcon className="inline h-3 w-3 mr-0.5" />}
                    {expLabel}
                  </p>
                )}
                {compDoc.verifiedBy && (
                  <p className="text-xs text-green-600 mt-0.5">
                    <CheckCircleIcon className="inline h-3 w-3 mr-0.5" />
                    Verified {compDoc.verifiedAt ? formatDate(compDoc.verifiedAt) : ''}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 ml-3">
                {compDoc.fileUrl && (
                  <a
                    href={compDoc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50 transition-colors"
                    title="Download"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                  </a>
                )}
                <button
                  onClick={() => handleDelete(compDoc.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors"
                  title="Remove"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
