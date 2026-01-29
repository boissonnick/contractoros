"use client";

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSubcontractor, LinkedProject } from '@/lib/hooks/useSubcontractor';
import { useSubcontractors } from '@/lib/hooks/useSubcontractors';
import { Subcontractor } from '@/types';
import { Card, Button, Badge } from '@/components/ui';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import { format, differenceInDays } from 'date-fns';
import SubDetailModal from '@/components/subcontractors/SubDetailModal';
import {
  ArrowLeftIcon,
  PencilSquareIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  StarIcon,
  DocumentTextIcon,
  ClockIcon,
  CurrencyDollarIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  FolderIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    lead: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Lead' },
    bidding: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Bidding' },
    planning: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Planning' },
    active: { bg: 'bg-green-100', text: 'text-green-700', label: 'Active' },
    on_hold: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'On Hold' },
    completed: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Completed' },
    cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' },
  };
  const c = config[status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status };
  return <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', c.bg, c.text)}>{c.label}</span>;
}

export default function SubcontractorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const subId = params.id as string;

  const { sub, linkedProjects, loading, error, reload } = useSubcontractor(subId);
  const { updateSub, deleteSub } = useSubcontractors();
  const [showEditModal, setShowEditModal] = useState(false);

  const handleUpdate = async (id: string, data: Partial<Subcontractor>) => {
    await updateSub(id, data);
    reload();
  };

  const handleDelete = async (id: string) => {
    await deleteSub(id);
    router.push('/dashboard/subcontractors');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !sub) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard/subcontractors"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Subcontractors
        </Link>
        <Card className="p-8 text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">{error?.message || 'Subcontractor not found'}</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/dashboard/subcontractors')}>
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  // Calculate aggregate metrics from linked projects
  const aggregateMetrics = {
    totalProjects: linkedProjects.length,
    activeProjects: linkedProjects.filter((lp) => lp.project.status === 'active').length,
    completedProjects: linkedProjects.filter((lp) => lp.project.status === 'completed').length,
    totalTasksAssigned: linkedProjects.reduce((sum, lp) => sum + lp.tasksAssigned, 0),
    totalTasksCompleted: linkedProjects.reduce((sum, lp) => sum + lp.tasksCompleted, 0),
    totalPaidAcrossProjects: linkedProjects.reduce((sum, lp) => sum + lp.totalPaid, 0),
  };

  // Document expiration warnings
  const expiringDocs = sub.documents.filter((doc) => {
    if (!doc.expiresAt) return false;
    const daysUntil = differenceInDays(doc.expiresAt, new Date());
    return daysUntil >= 0 && daysUntil <= 30;
  });

  const expiredDocs = sub.documents.filter((doc) => {
    if (!doc.expiresAt) return false;
    return differenceInDays(doc.expiresAt, new Date()) < 0;
  });

  const insuranceWarning = sub.insuranceExpiry && differenceInDays(sub.insuranceExpiry, new Date()) <= 30;
  const insuranceExpired = sub.insuranceExpiry && differenceInDays(sub.insuranceExpiry, new Date()) < 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/dashboard/subcontractors"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Subcontractors
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{sub.companyName}</h1>
            <Badge className={sub.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
              {sub.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <p className="text-gray-500 mt-1">{sub.contactName} · {sub.trade}</p>
        </div>
        <Button variant="outline" onClick={() => setShowEditModal(true)}>
          <PencilSquareIcon className="h-4 w-4 mr-1" />
          Edit
        </Button>
      </div>

      {/* Alerts */}
      {(insuranceExpired || insuranceWarning || expiredDocs.length > 0 || expiringDocs.length > 0) && (
        <div className="space-y-2">
          {insuranceExpired && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <ExclamationTriangleIcon className="h-5 w-5" />
              Insurance has expired! Last valid: {format(sub.insuranceExpiry!, 'MMM d, yyyy')}
            </div>
          )}
          {!insuranceExpired && insuranceWarning && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
              <ExclamationTriangleIcon className="h-5 w-5" />
              Insurance expires on {format(sub.insuranceExpiry!, 'MMM d, yyyy')} ({differenceInDays(sub.insuranceExpiry!, new Date())} days)
            </div>
          )}
          {expiredDocs.map((doc) => (
            <div key={doc.id} className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <ExclamationTriangleIcon className="h-5 w-5" />
              {doc.name} has expired
            </div>
          ))}
          {expiringDocs.map((doc) => (
            <div key={doc.id} className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
              <ExclamationTriangleIcon className="h-5 w-5" />
              {doc.name} expires on {format(doc.expiresAt!, 'MMM d, yyyy')}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Info */}
          <Card className="p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <EnvelopeIcon className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <a href={`mailto:${sub.email}`} className="text-sm text-blue-600 hover:underline">
                    {sub.email}
                  </a>
                </div>
              </div>
              {sub.phone && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <PhoneIcon className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <a href={`tel:${sub.phone}`} className="text-sm text-blue-600 hover:underline">
                      {sub.phone}
                    </a>
                  </div>
                </div>
              )}
              {sub.address && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <MapPinIcon className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Address</p>
                    <p className="text-sm text-gray-700">{sub.address}</p>
                  </div>
                </div>
              )}
              {sub.licenseNumber && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <DocumentTextIcon className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">License #</p>
                    <p className="text-sm text-gray-700">{sub.licenseNumber}</p>
                  </div>
                </div>
              )}
            </div>
            {sub.notes && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Notes</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{sub.notes}</p>
              </div>
            )}
          </Card>

          {/* Project History */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Project History</h3>
              <span className="text-xs text-gray-500">
                {linkedProjects.length} project{linkedProjects.length !== 1 ? 's' : ''}
              </span>
            </div>

            {linkedProjects.length === 0 ? (
              <div className="text-center py-8">
                <FolderIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No projects yet</p>
                <p className="text-xs text-gray-400">Assign this subcontractor to a project to see history</p>
              </div>
            ) : (
              <div className="space-y-3">
                {linkedProjects.map((lp) => (
                  <Link
                    key={lp.project.id}
                    href={`/dashboard/projects/${lp.project.id}`}
                    className="block border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">{lp.project.name}</h4>
                        <p className="text-xs text-gray-500">
                          {lp.project.address?.street}, {lp.project.address?.city}
                        </p>
                      </div>
                      <StatusBadge status={lp.project.status} />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <CheckCircleIcon className="h-3.5 w-3.5" />
                        {lp.tasksCompleted}/{lp.tasksAssigned} tasks
                      </span>
                      {lp.totalPaid > 0 && (
                        <span className="flex items-center gap-1">
                          <CurrencyDollarIcon className="h-3.5 w-3.5" />
                          {fmt(lp.totalPaid)} paid
                        </span>
                      )}
                      {lp.project.startDate && (
                        <span className="flex items-center gap-1">
                          <ClockIcon className="h-3.5 w-3.5" />
                          Started {format(lp.project.startDate, 'MMM d, yyyy')}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          {/* Documents */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Documents</h3>
              <span className="text-xs text-gray-500">
                {sub.documents.length} document{sub.documents.length !== 1 ? 's' : ''}
              </span>
            </div>

            {sub.documents.length === 0 ? (
              <div className="text-center py-8">
                <DocumentTextIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No documents uploaded</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sub.documents.map((doc) => {
                  const isExpired = doc.expiresAt && differenceInDays(doc.expiresAt, new Date()) < 0;
                  const isExpiring = doc.expiresAt && !isExpired && differenceInDays(doc.expiresAt, new Date()) <= 30;
                  return (
                    <div
                      key={doc.id}
                      className={cn(
                        'flex items-center justify-between p-3 border rounded-lg',
                        isExpired ? 'border-red-200 bg-red-50' : isExpiring ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <DocumentTextIcon className={cn(
                          'h-5 w-5',
                          isExpired ? 'text-red-500' : isExpiring ? 'text-yellow-500' : 'text-gray-400'
                        )} />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                          <p className="text-xs text-gray-500 capitalize">{doc.type.replace('_', ' ')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {doc.expiresAt && (
                          <p className={cn(
                            'text-xs',
                            isExpired ? 'text-red-600' : isExpiring ? 'text-yellow-600' : 'text-gray-500'
                          )}>
                            {isExpired ? 'Expired' : 'Expires'} {format(doc.expiresAt, 'MMM d, yyyy')}
                          </p>
                        )}
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar - Metrics */}
        <div className="space-y-6">
          {/* Rating */}
          <Card className="p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Rating</h3>
            <div className="flex items-center gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                star <= Math.round(sub.metrics.avgRating)
                  ? <StarSolid key={star} className="h-6 w-6 text-yellow-400" />
                  : <StarIcon key={star} className="h-6 w-6 text-gray-300" />
              ))}
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {sub.metrics.avgRating > 0 ? sub.metrics.avgRating.toFixed(1) : '—'}
              <span className="text-sm font-normal text-gray-500"> / 5</span>
            </p>
          </Card>

          {/* Performance Metrics */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <ChartBarIcon className="h-5 w-5 text-gray-400" />
              <h3 className="font-semibold text-gray-900">Performance</h3>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">On-time Rate</span>
                  <span className="font-semibold text-gray-900">{sub.metrics.onTimeRate}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      sub.metrics.onTimeRate >= 90 ? 'bg-green-500' :
                        sub.metrics.onTimeRate >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                    )}
                    style={{ width: `${sub.metrics.onTimeRate}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-gray-900">{sub.metrics.projectsCompleted}</p>
                  <p className="text-xs text-gray-500">Projects Completed</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-gray-900">{fmt(sub.metrics.totalPaid)}</p>
                  <p className="text-xs text-gray-500">Total Paid</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Cross-Project Summary */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <BriefcaseIcon className="h-5 w-5 text-gray-400" />
              <h3 className="font-semibold text-gray-900">Project Summary</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Projects</span>
                <span className="font-semibold text-gray-900">{aggregateMetrics.totalProjects}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active Projects</span>
                <span className="font-semibold text-green-600">{aggregateMetrics.activeProjects}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Completed Projects</span>
                <span className="font-semibold text-gray-900">{aggregateMetrics.completedProjects}</span>
              </div>
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Tasks Assigned</span>
                  <span className="font-semibold text-gray-900">{aggregateMetrics.totalTasksAssigned}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-gray-600">Tasks Completed</span>
                  <span className="font-semibold text-green-600">{aggregateMetrics.totalTasksCompleted}</span>
                </div>
              </div>
              {aggregateMetrics.totalPaidAcrossProjects > 0 && (
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Paid (All Projects)</span>
                    <span className="font-semibold text-gray-900">{fmt(aggregateMetrics.totalPaidAcrossProjects)}</span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Insurance Status */}
          <Card className="p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Insurance</h3>
            {sub.insuranceExpiry ? (
              <div>
                <p className={cn(
                  'text-sm font-medium',
                  insuranceExpired ? 'text-red-600' : insuranceWarning ? 'text-yellow-600' : 'text-green-600'
                )}>
                  {insuranceExpired ? 'Expired' : insuranceWarning ? 'Expiring Soon' : 'Valid'}
                </p>
                <p className="text-xs text-gray-500">
                  {insuranceExpired ? 'Expired' : 'Expires'} {format(sub.insuranceExpiry, 'MMMM d, yyyy')}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No insurance info on file</p>
            )}
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <SubDetailModal
          sub={sub}
          onClose={() => setShowEditModal(false)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
