'use client';

/**
 * Data Retention Policy Management Page
 *
 * Admin page for configuring organization data retention policies.
 * Restricted to OWNER role only for security and compliance.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { RouteGuard } from '@/components/auth';
import { Card, Button, Badge } from '@/components/ui';
import { toast } from '@/components/ui/Toast';
import {
  useDataRetention,
  useRetentionValidation,
  RetentionResource,
  RetentionAction,
  formatRetentionPeriod,
  getComplianceInfo,
  RETENTION_RESOURCE_LABELS,
  RETENTION_ACTION_LABELS,
  RETENTION_ACTION_DESCRIPTIONS,
} from '@/lib/hooks/useDataRetention';
import {
  ShieldCheckIcon,
  ClockIcon,
  TrashIcon,
  ArchiveBoxIcon,
  EyeSlashIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  BellIcon,
  MicrophoneIcon,
  SparklesIcon,
  PhotoIcon,
  CalendarDaysIcon,
  CogIcon,
} from '@heroicons/react/24/outline';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

// ============================================
// Resource Icons
// ============================================

const RESOURCE_ICONS: Record<RetentionResource, React.ComponentType<{ className?: string }>> = {
  auditLogs: ShieldCheckIcon,
  messages: ChatBubbleLeftRightIcon,
  activityLogs: DocumentTextIcon,
  deletedItems: TrashIcon,
  exportedData: ArchiveBoxIcon,
  notifications: BellIcon,
  voiceLogs: MicrophoneIcon,
  aiConversations: SparklesIcon,
  timeEntries: CalendarDaysIcon,
  photos: PhotoIcon,
};

// ============================================
// Action Icons
// ============================================

const ACTION_ICONS: Record<RetentionAction, React.ComponentType<{ className?: string }>> = {
  archive: ArchiveBoxIcon,
  delete: TrashIcon,
  anonymize: EyeSlashIcon,
};

// ============================================
// Main Component
// ============================================

export default function DataRetentionPage() {
  const { profile } = useAuth();
  const {
    policies,
    loading,
    error,
    updating,
    previews,
    config,
    refresh,
    updatePolicy,
    togglePolicy,
    loadPreview,
    resetAllToDefaults,
  } = useDataRetention();

  const [expandedPolicies, setExpandedPolicies] = useState<Set<RetentionResource>>(new Set());
  const [editingPolicy, setEditingPolicy] = useState<RetentionResource | null>(null);
  const [showComplianceInfo, setShowComplianceInfo] = useState(false);

  // Check owner role
  const isOwner = profile?.role === 'OWNER';

  // Count enabled policies
  const enabledCount = useMemo(() => {
    return policies.filter((p) => p.enabled).length;
  }, [policies]);

  // Toggle expanded state
  const toggleExpanded = (resource: RetentionResource) => {
    setExpandedPolicies((prev) => {
      const next = new Set(prev);
      if (next.has(resource)) {
        next.delete(resource);
      } else {
        next.add(resource);
        // Load preview when expanding
        loadPreview(resource);
      }
      return next;
    });
  };

  // Handle save
  const handleSave = async (
    resource: RetentionResource,
    updates: {
      retentionDays?: number;
      action?: RetentionAction;
      enabled?: boolean;
    }
  ) => {
    const result = await updatePolicy(resource, updates);
    if (result.success) {
      toast.success(`Updated ${RETENTION_RESOURCE_LABELS[resource]} retention policy`);
      setEditingPolicy(null);
    } else {
      toast.error(result.error || 'Failed to update policy');
    }
  };

  // Handle reset all
  const handleResetAll = async () => {
    if (
      window.confirm(
        'Reset all retention policies to defaults? This will disable all policies.'
      )
    ) {
      await resetAllToDefaults();
      toast.success('All policies reset to defaults');
    }
  };

  if (!isOwner) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <ShieldCheckIcon className="h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
        <p className="text-gray-500 text-center max-w-md">
          Data retention settings are only accessible to organization owners for security
          and compliance purposes.
        </p>
      </div>
    );
  }

  return (
    <RouteGuard allowedRoles={['OWNER']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Data Retention</h2>
            <p className="text-sm text-gray-500">
              Configure how long different types of data are retained before cleanup.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowComplianceInfo(!showComplianceInfo)}
            >
              <InformationCircleIcon className="h-4 w-4 mr-1.5" />
              Compliance Info
            </Button>
            <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
              <ArrowPathIcon className={cn('h-4 w-4 mr-1.5', loading && 'animate-spin')} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetAll}
              disabled={updating}
            >
              Reset All
            </Button>
          </div>
        </div>

        {/* Summary Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ClockIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800">Data Retention Overview</p>
              <p className="text-sm text-blue-700 mt-1">
                {enabledCount === 0 ? (
                  'No retention policies are currently active. Enable policies below to automatically manage data lifecycle.'
                ) : (
                  <>
                    <span className="font-medium">{enabledCount}</span> retention{' '}
                    {enabledCount === 1 ? 'policy is' : 'policies are'} currently active.
                    Data will be processed according to the configured schedules.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Compliance Info Panel */}
        {showComplianceInfo && (
          <Card className="p-4 bg-amber-50 border-amber-200">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  Compliance Considerations
                </p>
                <ul className="text-sm text-amber-700 mt-2 space-y-1 list-disc list-inside">
                  <li>
                    <strong>GDPR:</strong> Requires data minimization and the right to erasure.
                    Consider shorter retention periods for personal data.
                  </li>
                  <li>
                    <strong>CCPA:</strong> California residents have the right to deletion.
                    Ensure deleted items are permanently removed within your policy period.
                  </li>
                  <li>
                    <strong>SOX:</strong> Financial records and audit logs may need to be
                    retained for 7 years.
                  </li>
                  <li>
                    <strong>FLSA:</strong> Payroll and time tracking records must be retained
                    for at least 3 years.
                  </li>
                </ul>
                <p className="text-xs text-amber-600 mt-3">
                  Consult with your legal team to ensure retention policies meet your
                  regulatory requirements.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
            <Button size="sm" variant="outline" onClick={refresh}>
              Retry
            </Button>
          </div>
        )}

        {/* Loading State */}
        {loading && policies.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          /* Policy List */
          <div className="space-y-4">
            {policies.map((policy) => (
              <RetentionPolicyCard
                key={policy.resource}
                policy={policy}
                config={config[policy.resource]}
                preview={previews[policy.resource]}
                expanded={expandedPolicies.has(policy.resource)}
                editing={editingPolicy === policy.resource}
                updating={updating}
                onToggle={() => togglePolicy(policy.resource)}
                onExpand={() => toggleExpanded(policy.resource)}
                onEdit={() => setEditingPolicy(policy.resource)}
                onCancel={() => setEditingPolicy(null)}
                onSave={(updates) => handleSave(policy.resource, updates)}
                onLoadPreview={(days) => loadPreview(policy.resource, days)}
              />
            ))}
          </div>
        )}
      </div>
    </RouteGuard>
  );
}

// ============================================
// Policy Card Component
// ============================================

interface PolicyCardProps {
  policy: {
    resource: RetentionResource;
    retentionDays: number;
    action: RetentionAction;
    enabled: boolean;
    lastRun?: Date;
    lastRunRecordsAffected?: number;
  };
  config: {
    default: number;
    min: number;
    max: number;
    description: string;
    recommendedAction: RetentionAction;
  };
  preview: {
    totalRecords: number;
    recordsAffected: number;
    oldestRecord?: Date;
    newestAffected?: Date;
  } | null;
  expanded: boolean;
  editing: boolean;
  updating: boolean;
  onToggle: () => void;
  onExpand: () => void;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (updates: {
    retentionDays?: number;
    action?: RetentionAction;
    enabled?: boolean;
  }) => Promise<void>;
  onLoadPreview: (days: number) => void;
}

function RetentionPolicyCard({
  policy,
  config,
  preview,
  expanded,
  editing,
  updating,
  onToggle,
  onExpand,
  onEdit,
  onCancel,
  onSave,
  onLoadPreview,
}: PolicyCardProps) {
  const { validateDays } = useRetentionValidation();
  const [editValues, setEditValues] = useState({
    retentionDays: policy.retentionDays,
    action: policy.action,
  });
  const [validationError, setValidationError] = useState<string | null>(null);

  // Reset edit values when entering edit mode
  useEffect(() => {
    if (editing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- async data fetch setState is not synchronous
      setEditValues({
        retentionDays: policy.retentionDays,
        action: policy.action,
      });
      setValidationError(null);
    }
  }, [editing, policy.retentionDays, policy.action]);

  // Validate on change
  useEffect(() => {
    if (editing) {
      const result = validateDays(policy.resource, editValues.retentionDays);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- async data fetch setState is not synchronous
      setValidationError(result.valid ? null : result.message || null);
    }
  }, [editing, editValues.retentionDays, policy.resource, validateDays]);

  // Get compliance info
  const compliance = getComplianceInfo(policy.resource);

  // Get icons
  const ResourceIcon = RESOURCE_ICONS[policy.resource];
  const ActionIcon = ACTION_ICONS[policy.action];

  // Handle save
  const handleSave = async () => {
    if (validationError) return;
    await onSave(editValues);
  };

  return (
    <Card className={cn('overflow-hidden', policy.enabled && 'ring-2 ring-blue-200')}>
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {/* Icon */}
            <div
              className={cn(
                'p-2 rounded-lg flex-shrink-0',
                policy.enabled ? 'bg-blue-100' : 'bg-gray-100'
              )}
            >
              <ResourceIcon
                className={cn('h-5 w-5', policy.enabled ? 'text-blue-600' : 'text-gray-500')}
              />
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-gray-900">
                  {RETENTION_RESOURCE_LABELS[policy.resource]}
                </h3>
                {policy.enabled && (
                  <Badge variant="success" size="sm">
                    Active
                  </Badge>
                )}
                {compliance.regulations.length > 0 && (
                  <div className="flex items-center gap-1">
                    {compliance.regulations.slice(0, 2).map((reg) => (
                      <Badge key={reg} variant="default" size="sm">
                        {reg}
                      </Badge>
                    ))}
                    {compliance.regulations.length > 2 && (
                      <Badge variant="default" size="sm">
                        +{compliance.regulations.length - 2}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{config.description}</p>

              {/* Current settings summary */}
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <ClockIcon className="h-4 w-4" />
                  {formatRetentionPeriod(policy.retentionDays)}
                </span>
                <span className="flex items-center gap-1">
                  <ActionIcon className="h-4 w-4" />
                  {RETENTION_ACTION_LABELS[policy.action]}
                </span>
                {policy.lastRun && (
                  <span className="text-xs text-gray-400">
                    Last run: {formatDistanceToNow(policy.lastRun, { addSuffix: true })}
                    {policy.lastRunRecordsAffected !== undefined &&
                      ` (${policy.lastRunRecordsAffected} records)`}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Toggle Switch */}
            <button
              onClick={onToggle}
              disabled={updating}
              className={cn(
                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                policy.enabled ? 'bg-blue-600' : 'bg-gray-200',
                updating && 'opacity-50 cursor-not-allowed'
              )}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                  policy.enabled ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>

            {/* Expand button */}
            <button
              onClick={onExpand}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
            >
              {expanded ? (
                <ChevronUpIcon className="h-5 w-5" />
              ) : (
                <ChevronDownIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-4">
          {/* Edit Form */}
          {editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Retention Days */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Retention Period (days)
                  </label>
                  <input
                    type="number"
                    min={config.min}
                    max={config.max}
                    value={editValues.retentionDays}
                    onChange={(e) => {
                      const days = parseInt(e.target.value, 10);
                      setEditValues((prev) => ({ ...prev, retentionDays: days }));
                      onLoadPreview(days);
                    }}
                    className={cn(
                      'w-full px-3 py-2 border rounded-lg text-sm',
                      validationError ? 'border-red-300' : 'border-gray-300'
                    )}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Min: {config.min} days, Max: {config.max} days (
                    {formatRetentionPeriod(config.max)})
                  </p>
                  {validationError && (
                    <p className="text-xs text-red-600 mt-1">{validationError}</p>
                  )}
                </div>

                {/* Action */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Action
                  </label>
                  <select
                    value={editValues.action}
                    onChange={(e) =>
                      setEditValues((prev) => ({
                        ...prev,
                        action: e.target.value as RetentionAction,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    {(Object.keys(RETENTION_ACTION_LABELS) as RetentionAction[]).map(
                      (action) => (
                        <option key={action} value={action}>
                          {RETENTION_ACTION_LABELS[action]}
                        </option>
                      )
                    )}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {RETENTION_ACTION_DESCRIPTIONS[editValues.action]}
                  </p>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={updating || !!validationError}
                >
                  {updating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
                <Button size="sm" variant="outline" onClick={onCancel} disabled={updating}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Preview Stats */}
              {preview && (
                <div className="bg-white rounded-lg border border-gray-200 p-3">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Data Preview
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Total Records</p>
                      <p className="font-semibold text-gray-900">
                        {preview.totalRecords.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Would Be Affected</p>
                      <p
                        className={cn(
                          'font-semibold',
                          preview.recordsAffected > 0 ? 'text-amber-600' : 'text-green-600'
                        )}
                      >
                        {preview.recordsAffected.toLocaleString()}
                      </p>
                    </div>
                    {preview.oldestRecord && (
                      <div>
                        <p className="text-gray-500">Oldest Record</p>
                        <p className="font-semibold text-gray-900">
                          {format(preview.oldestRecord, 'MMM d, yyyy')}
                        </p>
                      </div>
                    )}
                    {preview.newestAffected && (
                      <div>
                        <p className="text-gray-500">Newest Affected</p>
                        <p className="font-semibold text-gray-900">
                          {format(preview.newestAffected, 'MMM d, yyyy')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Compliance Notes */}
              {compliance.notes && (
                <div className="flex items-start gap-2 text-sm">
                  <InformationCircleIcon className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-600">{compliance.notes}</p>
                </div>
              )}

              {/* Edit Button */}
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={onEdit}>
                  <CogIcon className="h-4 w-4 mr-1" />
                  Configure
                </Button>
                <span className="text-xs text-gray-400">
                  Default: {formatRetentionPeriod(config.default)} with{' '}
                  {RETENTION_ACTION_LABELS[config.recommendedAction].toLowerCase()}
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </Card>
  );
}
