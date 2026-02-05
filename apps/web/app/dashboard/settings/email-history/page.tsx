"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import {
  collection,
  query,
  orderBy,
  getDocs,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
  getCountFromServer,
} from 'firebase/firestore';
import { EmailLog, EmailTemplateType } from '@/types';
import { Card, Button, Badge, EmptyState } from '@/components/ui';
import { SkeletonList } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/Toast';
import BaseModal from '@/components/ui/BaseModal';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import {
  EnvelopeIcon,
  EnvelopeOpenIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  UserIcon,
  DocumentTextIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

const PAGE_SIZE = 25;

const statusConfig: Record<EmailLog['status'], { label: string; color: string; icon: React.ReactNode }> = {
  sent: {
    label: 'Sent',
    color: 'bg-green-100 text-green-700',
    icon: <CheckCircleIcon className="h-4 w-4" />,
  },
  failed: {
    label: 'Failed',
    color: 'bg-red-100 text-red-700',
    icon: <XCircleIcon className="h-4 w-4" />,
  },
  bounced: {
    label: 'Bounced',
    color: 'bg-orange-100 text-orange-700',
    icon: <ExclamationTriangleIcon className="h-4 w-4" />,
  },
  opened: {
    label: 'Opened',
    color: 'bg-blue-100 text-blue-700',
    icon: <EnvelopeOpenIcon className="h-4 w-4" />,
  },
};

const templateTypeLabels: Record<EmailTemplateType, string> = {
  estimate_sent: 'Estimate Sent',
  estimate_followup: 'Estimate Follow-up',
  invoice_sent: 'Invoice Sent',
  invoice_reminder: 'Invoice Reminder',
  invoice_overdue: 'Invoice Overdue',
  payment_received: 'Payment Received',
  project_started: 'Project Started',
  project_completed: 'Project Completed',
  document_ready: 'Document Ready',
  signature_request: 'Signature Request',
  welcome_client: 'Welcome Client',
  custom: 'Custom',
};

export default function EmailHistoryPage() {
  const { profile } = useAuth();
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<EmailLog['status'] | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<EmailTemplateType | 'all'>('all');
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [pageHistory, setPageHistory] = useState<QueryDocumentSnapshot<DocumentData>[]>([]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const orgId = profile?.orgId;

  const loadLogs = useCallback(async (direction: 'first' | 'next' | 'prev' = 'first') => {
    if (!orgId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Get total count
      const countQuery = query(
        collection(db, 'organizations', orgId, 'emailLogs')
      );
      const countSnapshot = await getCountFromServer(countQuery);
      setTotalCount(countSnapshot.data().count);

      // Build paginated query
      let q = query(
        collection(db, 'organizations', orgId, 'emailLogs'),
        orderBy('sentAt', 'desc'),
        limit(PAGE_SIZE)
      );

      if (direction === 'next' && lastDoc) {
        q = query(
          collection(db, 'organizations', orgId, 'emailLogs'),
          orderBy('sentAt', 'desc'),
          startAfter(lastDoc),
          limit(PAGE_SIZE)
        );
      } else if (direction === 'prev' && pageHistory.length >= 2) {
        const prevPageStart = pageHistory[pageHistory.length - 2];
        q = query(
          collection(db, 'organizations', orgId, 'emailLogs'),
          orderBy('sentAt', 'desc'),
          startAfter(prevPageStart),
          limit(PAGE_SIZE)
        );
      }

      const snapshot = await getDocs(q);
      const emailLogs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        sentAt: doc.data().sentAt?.toDate?.() || new Date(),
        openedAt: doc.data().openedAt?.toDate?.(),
      })) as EmailLog[];

      setLogs(emailLogs);

      // Update pagination cursors
      if (snapshot.docs.length > 0) {
        const firstDocSnapshot = snapshot.docs[0];
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);

        if (direction === 'next') {
          setPageHistory(prev => [...prev, firstDocSnapshot]);
        } else if (direction === 'prev') {
          setPageHistory(prev => prev.slice(0, -1));
        } else {
          setPageHistory([]);
        }
      }
    } catch (error) {
      console.error('Error loading email logs:', error);
      toast.error('Failed to load email history');
    } finally {
      setLoading(false);
    }
  }, [orgId, lastDoc, pageHistory]);

  useEffect(() => {
    if (orgId) {
      setCurrentPage(1);
      loadLogs('first');
    }
  }, [orgId, loadLogs]);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
      loadLogs('next');
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
      loadLogs('prev');
    }
  };

  // Filter logs client-side
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch =
        log.recipientEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.subject.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
      const matchesType = typeFilter === 'all' || log.templateType === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [logs, searchQuery, statusFilter, typeFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = logs.length;
    const sent = logs.filter(l => l.status === 'sent').length;
    const opened = logs.filter(l => l.status === 'opened').length;
    const failed = logs.filter(l => l.status === 'failed' || l.status === 'bounced').length;
    const openRate = sent > 0 ? Math.round((opened / sent) * 100) : 0;
    return { total, sent, opened, failed, openRate };
  }, [logs]);

  if (loading && logs.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Email History</h2>
            <p className="text-sm text-gray-500">Track sent emails and delivery status</p>
          </div>
        </div>
        <SkeletonList count={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Email History</h2>
          <p className="text-sm text-gray-500">Track sent emails and delivery status</p>
        </div>
        <Button
          variant="secondary"
          onClick={() => loadLogs('first')}
          disabled={loading}
        >
          <ArrowPathIcon className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <EnvelopeIcon className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 font-heading tracking-tight">{totalCount}</p>
              <p className="text-xs text-gray-500">Total Sent</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <EnvelopeOpenIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 font-heading tracking-tight">{stats.openRate}%</p>
              <p className="text-xs text-gray-500">Open Rate</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 font-heading tracking-tight">{stats.sent}</p>
              <p className="text-xs text-gray-500">Delivered</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircleIcon className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 font-heading tracking-tight">{stats.failed}</p>
              <p className="text-xs text-gray-500">Failed/Bounced</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by recipient or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as EmailLog['status'] | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent text-sm"
          >
            <option value="all">All Status</option>
            <option value="sent">Sent</option>
            <option value="opened">Opened</option>
            <option value="failed">Failed</option>
            <option value="bounced">Bounced</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as EmailTemplateType | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent text-sm"
          >
            <option value="all">All Types</option>
            {Object.entries(templateTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Email List */}
      {filteredLogs.length === 0 ? (
        <EmptyState
          icon={<EnvelopeIcon className="h-full w-full" />}
          title={logs.length === 0 ? "No emails sent yet" : "No matching emails"}
          description={logs.length === 0
            ? "Emails you send will appear here with delivery tracking."
            : "Try adjusting your search or filter criteria."
          }
        />
      ) : (
        <div className="space-y-2">
          {filteredLogs.map((log) => (
            <Card
              key={log.id}
              className="p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedLog(log)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={cn(
                    "p-2 rounded-lg",
                    log.status === 'opened' ? 'bg-blue-100' : 'bg-gray-100'
                  )}>
                    {log.status === 'opened' ? (
                      <EnvelopeOpenIcon className="h-5 w-5 text-blue-600" />
                    ) : (
                      <EnvelopeIcon className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={statusConfig[log.status].color}>
                        {statusConfig[log.status].icon}
                        <span className="ml-1">{statusConfig[log.status].label}</span>
                      </Badge>
                      <Badge className="bg-gray-100 text-gray-600">
                        {templateTypeLabels[log.templateType] || log.templateType}
                      </Badge>
                    </div>
                    <h4 className="font-medium text-gray-900 truncate">{log.subject}</h4>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <UserIcon className="h-3.5 w-3.5" />
                        {log.recipientName} ({log.recipientEmail})
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="h-3.5 w-3.5" />
                        {formatDistanceToNow(new Date(log.sentAt), { addSuffix: true })}
                      </span>
                    </div>
                    {log.errorMessage && (
                      <p className="mt-1 text-sm text-red-600">{log.errorMessage}</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedLog(log);
                  }}
                >
                  <EyeIcon className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalCount > PAGE_SIZE && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, totalCount)}-
            {Math.min(currentPage * PAGE_SIZE, totalCount)} of {totalCount} emails
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={goToPrevPage}
              disabled={currentPage === 1 || loading}
            >
              <ChevronLeftIcon className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <span className="px-3 py-1 text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={goToNextPage}
              disabled={currentPage >= totalPages || loading}
            >
              Next
              <ChevronRightIcon className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <BaseModal
        open={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Email Details"
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-4">
            {/* Status & Type */}
            <div className="flex items-center gap-2">
              <Badge className={statusConfig[selectedLog.status].color}>
                {statusConfig[selectedLog.status].icon}
                <span className="ml-1">{statusConfig[selectedLog.status].label}</span>
              </Badge>
              <Badge className="bg-gray-100 text-gray-600">
                {templateTypeLabels[selectedLog.templateType] || selectedLog.templateType}
              </Badge>
            </div>

            {/* Recipient */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Recipient</p>
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-900">{selectedLog.recipientName}</span>
                <span className="text-sm text-gray-500">({selectedLog.recipientEmail})</span>
              </div>
            </div>

            {/* Subject */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Subject</p>
              <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedLog.subject}</p>
            </div>

            {/* Timestamps */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Sent At</p>
                <p className="text-sm text-gray-900">
                  {format(new Date(selectedLog.sentAt), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
              {selectedLog.openedAt && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Opened At</p>
                  <p className="text-sm text-gray-900">
                    {format(new Date(selectedLog.openedAt), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              )}
            </div>

            {/* Related Resources */}
            {(selectedLog.projectId || selectedLog.invoiceId || selectedLog.estimateId || selectedLog.clientId) && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Related To</p>
                <div className="flex flex-wrap gap-2">
                  {selectedLog.projectId && (
                    <Badge className="bg-blue-100 text-blue-700">
                      <DocumentTextIcon className="h-3 w-3 mr-1" />
                      Project
                    </Badge>
                  )}
                  {selectedLog.invoiceId && (
                    <Badge className="bg-green-100 text-green-700">
                      <DocumentTextIcon className="h-3 w-3 mr-1" />
                      Invoice
                    </Badge>
                  )}
                  {selectedLog.estimateId && (
                    <Badge className="bg-purple-100 text-purple-700">
                      <DocumentTextIcon className="h-3 w-3 mr-1" />
                      Estimate
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Error Message */}
            {selectedLog.errorMessage && (
              <div>
                <p className="text-xs font-medium text-red-500 mb-1">Error</p>
                <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  {selectedLog.errorMessage}
                </p>
              </div>
            )}
          </div>
        )}
      </BaseModal>
    </div>
  );
}
