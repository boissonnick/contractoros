'use client';

/**
 * Audit Logs Admin Page
 *
 * Comprehensive audit trail viewer for compliance and security monitoring.
 * Restricted to OWNER role only.
 */

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { RouteGuard } from '@/components/auth';
import { Card, Button, Badge } from '@/components/ui';
import { toast } from '@/components/ui/Toast';
import {
  useAuditLogs,
  AuditAction,
  AuditSeverity,
  AuditLogFilters,
  AUDIT_ACTION_LABELS,
  AUDIT_RESOURCE_LABELS,
  AUDIT_SEVERITY_CONFIG,
} from '@/lib/hooks/useAuditLogs';
import {
  ShieldCheckIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  UserIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { format, formatDistanceToNow, subDays, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

// ============================================
// Filter Options
// ============================================

const ACTION_OPTIONS: { value: AuditAction | ''; label: string }[] = [
  { value: '', label: 'All Actions' },
  { value: 'CREATE', label: 'Created' },
  { value: 'UPDATE', label: 'Updated' },
  { value: 'DELETE', label: 'Deleted' },
  { value: 'LOGIN', label: 'Login' },
  { value: 'LOGOUT', label: 'Logout' },
  { value: 'LOGIN_FAILED', label: 'Login Failed' },
  { value: 'PERMISSION_CHANGE', label: 'Permission Changed' },
  { value: 'SETTINGS_CHANGE', label: 'Settings Changed' },
  { value: 'EXPORT', label: 'Data Export' },
  { value: 'IMPORT', label: 'Data Import' },
  { value: 'PAYMENT', label: 'Payment' },
  { value: 'INVITE_SENT', label: 'Invitation Sent' },
  { value: 'INVITE_ACCEPTED', label: 'Invitation Accepted' },
  { value: 'USER_REMOVED', label: 'User Removed' },
  { value: 'SECURITY_THREAT', label: 'Security Threat' },
  { value: 'IMPERSONATION_START', label: 'Impersonation Started' },
];

const SEVERITY_OPTIONS: { value: AuditSeverity | ''; label: string }[] = [
  { value: '', label: 'All Severities' },
  { value: 'info', label: 'Info' },
  { value: 'warning', label: 'Warning' },
  { value: 'critical', label: 'Critical' },
];

const DATE_PRESETS = [
  { label: 'Last 24 Hours', days: 1 },
  { label: 'Last 7 Days', days: 7 },
  { label: 'Last 30 Days', days: 30 },
  { label: 'Last 90 Days', days: 90 },
];

// ============================================
// Main Component
// ============================================

export default function AuditLogsPage() {
  const { profile } = useAuth();
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter state
  const [actionFilter, setActionFilter] = useState<AuditAction | ''>('');
  const [severityFilter, setSeverityFilter] = useState<AuditSeverity | ''>('');
  const [datePreset, setDatePreset] = useState<number>(7);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Build filters object
  const filters: AuditLogFilters = useMemo(() => {
    const f: AuditLogFilters = {};

    if (actionFilter) f.action = actionFilter;
    if (severityFilter) f.severity = severityFilter;

    // Date range
    if (customStartDate) {
      f.startDate = startOfDay(new Date(customStartDate));
    } else if (datePreset > 0) {
      f.startDate = startOfDay(subDays(new Date(), datePreset));
    }

    if (customEndDate) {
      f.endDate = endOfDay(new Date(customEndDate));
    } else {
      f.endDate = endOfDay(new Date());
    }

    return f;
  }, [actionFilter, severityFilter, datePreset, customStartDate, customEndDate]);

  // Use audit logs hook
  const {
    entries,
    loading,
    error,
    hasMore,
    page,
    totalLoaded,
    refresh,
    loadMore,
    exportToCSV,
    exportToExcel,
    setFilters,
  } = useAuditLogs({
    pageSize: 50,
    autoRefreshInterval: 60000, // Refresh every minute
    initialFilters: filters,
  });

  // Apply filters when they change
  React.useEffect(() => {
    setFilters(filters);
  }, [filters, setFilters]);

  // Filter entries by search term (client-side)
  const filteredEntries = useMemo(() => {
    if (!searchTerm) return entries;

    const term = searchTerm.toLowerCase();
    return entries.filter(
      (entry) =>
        entry.userEmail.toLowerCase().includes(term) ||
        entry.userName?.toLowerCase().includes(term) ||
        entry.action.toLowerCase().includes(term) ||
        entry.resource.toLowerCase().includes(term) ||
        entry.resourceId?.toLowerCase().includes(term) ||
        JSON.stringify(entry.details).toLowerCase().includes(term)
    );
  }, [entries, searchTerm]);

  // Reset filters
  const handleResetFilters = () => {
    setActionFilter('');
    setSeverityFilter('');
    setDatePreset(7);
    setCustomStartDate('');
    setCustomEndDate('');
    setSearchTerm('');
  };

  // Export handlers
  const handleExportCSV = () => {
    exportToCSV();
    toast.success(`Exported ${totalLoaded} audit log entries to CSV`);
  };

  const handleExportExcel = async () => {
    await exportToExcel();
    toast.success(`Exported ${totalLoaded} audit log entries to Excel`);
  };

  // Check owner role
  const isOwner = profile?.role === 'OWNER';

  if (!isOwner) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <ShieldCheckIcon className="h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
        <p className="text-gray-500 text-center max-w-md">
          Audit logs are only accessible to organization owners for security and compliance purposes.
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
            <h2 className="text-lg font-semibold text-gray-900">Audit Logs</h2>
            <p className="text-sm text-gray-500">
              View all activity and security events for your organization.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FunnelIcon className="h-4 w-4 mr-1.5" />
              Filters
              {(actionFilter || severityFilter || customStartDate) && (
                <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  {[actionFilter, severityFilter, customStartDate].filter(Boolean).length}
                </span>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
              <ArrowPathIcon className={cn('h-4 w-4 mr-1.5', loading && 'animate-spin')} />
              Refresh
            </Button>
            <div className="relative">
              <Button variant="outline" size="sm" className="group">
                <ArrowDownTrayIcon className="h-4 w-4 mr-1.5" />
                Export
                <ChevronDownIcon className="h-3.5 w-3.5 ml-1" />
              </Button>
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[120px] z-10 hidden group-focus-within:block hover:block">
                <button
                  onClick={handleExportCSV}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Export CSV
                </button>
                <button
                  onClick={handleExportExcel}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Export Excel
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <InformationCircleIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800">Security Audit Trail</p>
              <p className="text-sm text-blue-700 mt-1">
                This log tracks all user actions, security events, and system changes.
                Logs are retained for 90 days and are immutable for compliance purposes.
              </p>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Filter Audit Logs</h3>
              <button
                onClick={handleResetFilters}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Reset Filters
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by user, action, or resource..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Action Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Action Type
                </label>
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value as AuditAction | '')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  {ACTION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Severity Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Severity
                </label>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value as AuditSeverity | '')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  {SEVERITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Preset */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time Period
                </label>
                <select
                  value={datePreset}
                  onChange={(e) => {
                    setDatePreset(Number(e.target.value));
                    setCustomStartDate('');
                    setCustomEndDate('');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  {DATE_PRESETS.map((preset) => (
                    <option key={preset.days} value={preset.days}>
                      {preset.label}
                    </option>
                  ))}
                  <option value={0}>Custom Range</option>
                </select>
              </div>

              {/* Custom Date Range */}
              {datePreset === 0 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </>
              )}
            </div>
          </Card>
        )}

        {/* Results Summary */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            Showing {filteredEntries.length} of {totalLoaded} entries
            {hasMore && ' (more available)'}
          </span>
          <span>
            Page {page} {hasMore && '+'} | Auto-refreshing every minute
          </span>
        </div>

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

        {/* Audit Log Entries */}
        {loading && entries.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredEntries.length === 0 ? (
          <Card className="p-12 text-center">
            <ClockIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No audit events found</h3>
            <p className="text-sm text-gray-500">
              {searchTerm || actionFilter || severityFilter
                ? 'Try adjusting your filters or search term.'
                : 'Activity will appear here as users interact with the system.'}
            </p>
          </Card>
        ) : (
          <Card className="divide-y divide-gray-100 overflow-hidden">
            {filteredEntries.map((entry) => (
              <AuditLogRow key={entry.id} entry={entry} />
            ))}
          </Card>
        )}

        {/* Load More */}
        {hasMore && filteredEntries.length > 0 && (
          <div className="flex justify-center pt-4">
            <Button
              variant="outline"
              onClick={loadMore}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                  Loading...
                </>
              ) : (
                <>Load More</>
              )}
            </Button>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}

// ============================================
// Audit Log Row Component
// ============================================

interface AuditLogRowProps {
  entry: {
    id: string;
    userId: string;
    userEmail: string;
    userName?: string;
    action: AuditAction;
    resource: string;
    resourceId?: string;
    resourceName?: string;
    details: Record<string, unknown>;
    message?: string;
    ipAddress?: string;
    timestamp: Date;
    severity: AuditSeverity;
  };
}

function AuditLogRow({ entry }: AuditLogRowProps) {
  const [expanded, setExpanded] = useState(false);
  const severityConfig = AUDIT_SEVERITY_CONFIG[entry.severity];

  // Get icon based on action type
  const getActionIcon = () => {
    switch (entry.action) {
      case 'LOGIN':
      case 'LOGOUT':
      case 'LOGIN_FAILED':
        return <UserIcon className="h-4 w-4" />;
      case 'SECURITY_THREAT':
      case 'RATE_LIMIT_EXCEEDED':
        return <ExclamationTriangleIcon className="h-4 w-4" />;
      default:
        return <DocumentTextIcon className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {/* Severity indicator */}
          <div
            className={cn(
              'mt-0.5 p-1.5 rounded-lg flex-shrink-0',
              severityConfig.bgColor
            )}
          >
            <span className={severityConfig.textColor}>{getActionIcon()}</span>
          </div>

          <div className="min-w-0 flex-1">
            {/* Action and Severity Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant={
                  entry.severity === 'critical'
                    ? 'danger'
                    : entry.severity === 'warning'
                    ? 'warning'
                    : 'default'
                }
                size="sm"
              >
                {AUDIT_ACTION_LABELS[entry.action] || entry.action}
              </Badge>
              <span className="text-xs text-gray-400">
                {formatDistanceToNow(entry.timestamp, { addSuffix: true })}
              </span>
            </div>

            {/* Message */}
            <p className="mt-1 text-sm text-gray-900">
              {entry.message ||
                `${entry.userName || entry.userEmail} ${AUDIT_ACTION_LABELS[
                  entry.action
                ]?.toLowerCase()} ${AUDIT_RESOURCE_LABELS[entry.resource] || entry.resource}${
                  entry.resourceName ? `: ${entry.resourceName}` : ''
                }`}
            </p>

            {/* User and Resource Info */}
            <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
              <span>By: {entry.userName || entry.userEmail}</span>
              <span>
                Resource: {AUDIT_RESOURCE_LABELS[entry.resource] || entry.resource}
                {entry.resourceId && ` (${entry.resourceId.substring(0, 8)}...)`}
              </span>
              {entry.ipAddress && <span>IP: {entry.ipAddress}</span>}
            </div>

            {/* Expandable Details */}
            {Object.keys(entry.details).length > 0 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-2 text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <ChevronDownIcon
                  className={cn('h-3 w-3 transition-transform', expanded && 'rotate-180')}
                />
                {expanded ? 'Hide Details' : 'Show Details'}
              </button>
            )}

            {expanded && (
              <div className="mt-2 p-2 bg-gray-50 rounded text-xs font-mono text-gray-700 overflow-x-auto">
                <pre>{JSON.stringify(entry.details, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>

        {/* Timestamp */}
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-gray-500">
            {format(entry.timestamp, 'MMM d, yyyy')}
          </p>
          <p className="text-xs text-gray-400">
            {format(entry.timestamp, 'h:mm:ss a')}
          </p>
        </div>
      </div>
    </div>
  );
}
