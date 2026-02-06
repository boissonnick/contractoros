"use client";

import React, { useState, useMemo } from 'react';
import { UserProfile, Certification, CertificationCategory } from '@/types';
import { Card, Button, Badge, EmptyState } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  ShieldCheckIcon,
  PlusIcon,
  DocumentTextIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import { CertificationFormModal } from './CertificationFormModal';

type CertFilter = 'all' | 'expiring' | 'expired';

const CATEGORY_STYLES: Record<CertificationCategory, { bg: string; text: string; label: string }> = {
  license: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'License' },
  insurance: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Insurance' },
  training: { bg: 'bg-green-100', text: 'text-green-700', label: 'Training' },
  safety: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Safety' },
  other: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Other' },
};

function computeCertStatus(expiryDate?: string): 'valid' | 'expiring' | 'expired' {
  if (!expiryDate) return 'expired';
  const expiry = new Date(expiryDate);
  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return 'expired';
  if (diffDays <= 90) return 'expiring';
  return 'valid';
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  valid: { bg: 'bg-green-100', text: 'text-green-700', label: 'Valid' },
  expiring: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Expiring Soon' },
  expired: { bg: 'bg-red-100', text: 'text-red-700', label: 'Expired' },
};

interface FlatCert {
  userId: string;
  displayName: string;
  cert: Certification;
  computedStatus: 'valid' | 'expiring' | 'expired';
}

interface CertificationsDashboardProps {
  members: UserProfile[];
}

export function CertificationsDashboard({ members }: CertificationsDashboardProps) {
  const [filter, setFilter] = useState<CertFilter>('all');
  const [showFormModal, setShowFormModal] = useState(false);

  // Flatten all certifications from all members into a single list
  const allCerts: FlatCert[] = useMemo(() => {
    const flat: FlatCert[] = [];
    members.forEach((member) => {
      if (member.certifications && member.certifications.length > 0) {
        member.certifications.forEach((cert) => {
          flat.push({
            userId: member.uid,
            displayName: member.displayName || 'Unknown',
            cert,
            computedStatus: computeCertStatus(cert.expiryDate),
          });
        });
      }
    });
    // Sort by expiry date (soonest first), expired/no-date at top
    flat.sort((a, b) => {
      if (!a.cert.expiryDate && !b.cert.expiryDate) return 0;
      if (!a.cert.expiryDate) return -1;
      if (!b.cert.expiryDate) return 1;
      return new Date(a.cert.expiryDate).getTime() - new Date(b.cert.expiryDate).getTime();
    });
    return flat;
  }, [members]);

  // Apply filter
  const filteredCerts = useMemo(() => {
    if (filter === 'all') return allCerts;
    if (filter === 'expiring') return allCerts.filter((c) => c.computedStatus === 'expiring');
    return allCerts.filter((c) => c.computedStatus === 'expired');
  }, [allCerts, filter]);

  const expiringCount = allCerts.filter((c) => c.computedStatus === 'expiring').length;
  const expiredCount = allCerts.filter((c) => c.computedStatus === 'expired').length;

  if (allCerts.length === 0 && filter === 'all') {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button
            variant="primary"
            icon={<PlusIcon className="h-5 w-5" />}
            onClick={() => setShowFormModal(true)}
          >
            Add Certification
          </Button>
        </div>
        <EmptyState
          icon={<ShieldCheckIcon className="h-full w-full" />}
          title="No certifications tracked"
          description="Add certifications to track license expiry dates, insurance renewals, and training completions for your team."
          action={{
            label: 'Add Certification',
            onClick: () => setShowFormModal(true),
          }}
        />
        {showFormModal && (
          <CertificationFormModal
            isOpen={showFormModal}
            onClose={() => setShowFormModal(false)}
            members={members}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Add button and filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-colors',
              filter === 'all'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            All ({allCerts.length})
          </button>
          <button
            onClick={() => setFilter('expiring')}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-colors',
              filter === 'expiring'
                ? 'bg-white text-amber-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            Expiring Soon ({expiringCount})
          </button>
          <button
            onClick={() => setFilter('expired')}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-colors',
              filter === 'expired'
                ? 'bg-white text-red-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            Expired ({expiredCount})
          </button>
        </div>
        <Button
          variant="primary"
          icon={<PlusIcon className="h-5 w-5" />}
          onClick={() => setShowFormModal(true)}
        >
          Add Certification
        </Button>
      </div>

      {/* Certifications Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Certification
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Issuing Body
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Category
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Number
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Expiry Date
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCerts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    No certifications match this filter.
                  </td>
                </tr>
              ) : (
                filteredCerts.map((item, index) => {
                  const statusStyle = STATUS_STYLES[item.computedStatus];
                  const category = item.cert.category || 'other';
                  const categoryStyle = CATEGORY_STYLES[category];

                  return (
                    <tr key={`${item.userId}-${item.cert.name}-${index}`} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900">{item.displayName}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <DocumentTextIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-900">{item.cert.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600 hidden md:table-cell">
                        {item.cert.issuingBody || '-'}
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell">
                        <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-medium', categoryStyle.bg, categoryStyle.text)}>
                          {categoryStyle.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 hidden lg:table-cell">
                        {item.cert.number || '-'}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {item.cert.expiryDate
                          ? new Date(item.cert.expiryDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'No date'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-medium', statusStyle.bg, statusStyle.text)}>
                          {statusStyle.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {item.cert.fileURL && (
                          <a
                            href={item.cert.fileURL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-600 hover:text-brand-700"
                            title="View document"
                          >
                            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Form Modal */}
      {showFormModal && (
        <CertificationFormModal
          isOpen={showFormModal}
          onClose={() => setShowFormModal(false)}
          members={members}
        />
      )}
    </div>
  );
}

export default CertificationsDashboard;
