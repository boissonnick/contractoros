"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { Button, Card, Badge } from '@/components/ui';
import { toast } from '@/components/ui/Toast';
import { Estimate, Organization } from '@/types';
import { SendForSignatureModal, SignatureRequestList } from '@/components/esignature';
import { useSignatureRequests } from '@/lib/hooks/useSignatureRequests';
import { cn } from '@/lib/utils';
import {
  ArrowLeftIcon,
  PencilSquareIcon,
  PaperAirplaneIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  PrinterIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  EnvelopeIcon,
  DocumentTextIcon,
  UserIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: <PencilSquareIcon className="h-4 w-4" /> },
  sent: { label: 'Sent', color: 'bg-blue-100 text-blue-700', icon: <EnvelopeIcon className="h-4 w-4" /> },
  viewed: { label: 'Viewed', color: 'bg-purple-100 text-purple-700', icon: <EyeIcon className="h-4 w-4" /> },
  accepted: { label: 'Accepted', color: 'bg-green-100 text-green-700', icon: <CheckCircleIcon className="h-4 w-4" /> },
  declined: { label: 'Declined', color: 'bg-red-100 text-red-700', icon: <XCircleIcon className="h-4 w-4" /> },
  expired: { label: 'Expired', color: 'bg-orange-100 text-orange-700', icon: <ClockIcon className="h-4 w-4" /> },
  revised: { label: 'Revised', color: 'bg-yellow-100 text-yellow-700', icon: <DocumentTextIcon className="h-4 w-4" /> },
};

export default function EstimateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const estimateId = params.id as string;

  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSignatureModal, setShowSignatureModal] = useState(false);

  // Get signature requests for this estimate
  const { requests: signatureRequests } = useSignatureRequests({
    orgId: profile?.orgId || '',
  });

  const estimateSignatures = signatureRequests.filter(
    (r) => r.documentId === estimateId && r.documentType === 'estimate'
  );

  // Load estimate and organization
  useEffect(() => {
    async function loadData() {
      if (!estimateId || !profile?.orgId) return;

      try {
        setLoading(true);

        // Load estimate
        const estimateDoc = await getDoc(doc(db, 'estimates', estimateId));
        if (!estimateDoc.exists()) {
          toast.error('Estimate not found');
          router.push('/dashboard/estimates');
          return;
        }

        const estimateData = {
          id: estimateDoc.id,
          ...estimateDoc.data(),
          createdAt: estimateDoc.data().createdAt?.toDate(),
          updatedAt: estimateDoc.data().updatedAt?.toDate(),
          validUntil: estimateDoc.data().validUntil?.toDate(),
          sentAt: estimateDoc.data().sentAt?.toDate(),
          viewedAt: estimateDoc.data().viewedAt?.toDate(),
          acceptedAt: estimateDoc.data().acceptedAt?.toDate(),
        } as Estimate;

        // Verify org access
        if (estimateData.orgId !== profile.orgId) {
          toast.error('Access denied');
          router.push('/dashboard/estimates');
          return;
        }

        setEstimate(estimateData);

        // Load organization for branding
        const orgDoc = await getDoc(doc(db, 'organizations', profile.orgId));
        if (orgDoc.exists()) {
          setOrganization({ id: orgDoc.id, ...orgDoc.data() } as Organization);
        }
      } catch (error) {
        console.error('Error loading estimate:', error);
        toast.error('Failed to load estimate');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [estimateId, profile?.orgId, router]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleMarkAsSent = async () => {
    if (!estimate) return;

    try {
      await updateDoc(doc(db, 'estimates', estimate.id), {
        status: 'sent',
        sentAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      setEstimate({ ...estimate, status: 'sent', sentAt: new Date() });
      toast.success('Estimate marked as sent');
    } catch (error) {
      console.error('Error updating estimate:', error);
      toast.error('Failed to update estimate');
    }
  };

  const handleSignatureSuccess = () => {
    // Update estimate status to sent if it was draft
    if (estimate?.status === 'draft') {
      handleMarkAsSent();
    }
    setShowSignatureModal(false);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!estimate) {
    return null;
  }

  const isExpired = estimate.validUntil && new Date(estimate.validUntil) < new Date();
  const canSendForSignature = estimate.status === 'draft' || estimate.status === 'sent' || estimate.status === 'viewed';
  const hasActiveSignature = estimateSignatures.some(
    (s) => s.status === 'pending' || s.status === 'viewed'
  );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => router.push('/dashboard/estimates')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Estimates
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{estimate.name}</h1>
            <Badge className={statusConfig[estimate.status]?.color || 'bg-gray-100 text-gray-700'}>
              {statusConfig[estimate.status]?.icon}
              <span className="ml-1">{statusConfig[estimate.status]?.label || estimate.status}</span>
            </Badge>
            {isExpired && estimate.status !== 'expired' && estimate.status !== 'accepted' && (
              <Badge className="bg-orange-100 text-orange-700">
                <ClockIcon className="h-3 w-3 mr-1" />
                Expired
              </Badge>
            )}
          </div>
          <p className="text-gray-500 mt-1">#{estimate.number}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push(`/dashboard/estimates/${estimate.id}/edit`)}
          >
            <PencilSquareIcon className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.print()}
          >
            <PrinterIcon className="h-4 w-4 mr-1" />
            Print
          </Button>
          {canSendForSignature && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowSignatureModal(true)}
              disabled={hasActiveSignature}
            >
              <PaperAirplaneIcon className="h-4 w-4 mr-1" />
              {hasActiveSignature ? 'Signature Pending' : 'Send for Signature'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Info */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-gray-400" />
              Client Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{estimate.clientName}</p>
              </div>
              {estimate.clientEmail && (
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{estimate.clientEmail}</p>
                </div>
              )}
              {estimate.clientPhone && (
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{estimate.clientPhone}</p>
                </div>
              )}
              {estimate.clientAddress && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium">{estimate.clientAddress}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Line Items */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DocumentTextIcon className="h-5 w-5 text-gray-400" />
              Line Items
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Description</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-gray-500">Qty</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-gray-500">Unit</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-gray-500">Price</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-gray-500">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {estimate.lineItems.map((item) => (
                    <tr key={item.id} className={cn(
                      "border-b border-gray-100",
                      item.isOptional && "bg-gray-50"
                    )}>
                      <td className="py-3 px-2">
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          {item.description && (
                            <p className="text-sm text-gray-500">{item.description}</p>
                          )}
                          {item.isOptional && (
                            <Badge className="mt-1 bg-yellow-100 text-yellow-700 text-xs">
                              Optional
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right text-gray-700">{item.quantity}</td>
                      <td className="py-3 px-2 text-right text-gray-700">{item.unit}</td>
                      <td className="py-3 px-2 text-right text-gray-700">{formatCurrency(item.unitCost)}</td>
                      <td className="py-3 px-2 text-right font-medium text-gray-900">{formatCurrency(item.totalCost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-6 border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">{formatCurrency(estimate.subtotal)}</span>
              </div>
              {estimate.discount && estimate.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount {estimate.discountType === 'percent' ? `(${estimate.discount}%)` : ''}</span>
                  <span>-{formatCurrency(
                    estimate.discountType === 'percent'
                      ? estimate.subtotal * (estimate.discount / 100)
                      : estimate.discount
                  )}</span>
                </div>
              )}
              {estimate.taxRate && estimate.taxRate > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax ({estimate.taxRate}%)</span>
                  <span className="font-medium">{formatCurrency(estimate.taxAmount || 0)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total</span>
                <span className="text-brand-primary">{formatCurrency(estimate.total)}</span>
              </div>
              {estimate.depositRequired && estimate.depositRequired > 0 && (
                <div className="flex justify-between text-sm text-blue-600">
                  <span>Deposit Required ({estimate.depositPercent}%)</span>
                  <span className="font-medium">{formatCurrency(estimate.depositRequired)}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Scope of Work */}
          {estimate.scopeOfWork && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Scope of Work</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{estimate.scopeOfWork}</p>
            </Card>
          )}

          {/* Exclusions */}
          {estimate.exclusions && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Exclusions</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{estimate.exclusions}</p>
            </Card>
          )}

          {/* Terms */}
          {estimate.termsAndConditions && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Terms & Conditions</h2>
              <p className="text-gray-700 whitespace-pre-wrap text-sm">{estimate.termsAndConditions}</p>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary Card */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
              Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Created</span>
                <span className="font-medium">{format(new Date(estimate.createdAt), 'MMM d, yyyy')}</span>
              </div>
              {estimate.validUntil && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Valid Until</span>
                  <span className={cn(
                    "font-medium",
                    isExpired && "text-red-600"
                  )}>
                    {format(new Date(estimate.validUntil), 'MMM d, yyyy')}
                  </span>
                </div>
              )}
              {estimate.sentAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Sent</span>
                  <span className="font-medium">{format(new Date(estimate.sentAt), 'MMM d, yyyy')}</span>
                </div>
              )}
              {estimate.viewedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Viewed</span>
                  <span className="font-medium">{format(new Date(estimate.viewedAt), 'MMM d, yyyy')}</span>
                </div>
              )}
              {estimate.acceptedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Accepted</span>
                  <span className="font-medium text-green-600">{format(new Date(estimate.acceptedAt), 'MMM d, yyyy')}</span>
                </div>
              )}
              {estimate.paymentTerms && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment Terms</span>
                  <span className="font-medium">{estimate.paymentTerms}</span>
                </div>
              )}
            </div>
          </Card>

          {/* E-Signature Status */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <PaperAirplaneIcon className="h-5 w-5 text-gray-400" />
              E-Signature
            </h3>
            {estimateSignatures.length > 0 ? (
              <SignatureRequestList
                projectId={estimate.projectId}
                maxItems={3}
                emptyMessage="No signature requests"
              />
            ) : (
              <div className="text-center py-4">
                <DocumentTextIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500 mb-3">
                  No signature requests yet
                </p>
                {canSendForSignature && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowSignatureModal(true)}
                  >
                    <PaperAirplaneIcon className="h-4 w-4 mr-1" />
                    Send for Signature
                  </Button>
                )}
              </div>
            )}
          </Card>

          {/* Project Info */}
          {estimate.projectName && (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                Project
              </h3>
              <p className="font-medium text-gray-900">{estimate.projectName}</p>
              {estimate.projectAddress && (
                <p className="text-sm text-gray-500 mt-1">{estimate.projectAddress}</p>
              )}
              {estimate.projectId && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  onClick={() => router.push(`/dashboard/projects/${estimate.projectId}`)}
                >
                  View Project
                </Button>
              )}
            </Card>
          )}

          {/* Actions */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Actions</h3>
            <div className="space-y-2">
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-start"
                onClick={() => {/* duplicate logic */}}
              >
                <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
                Duplicate Estimate
              </Button>
              {estimate.status === 'draft' && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full justify-start"
                  onClick={handleMarkAsSent}
                >
                  <EnvelopeIcon className="h-4 w-4 mr-2" />
                  Mark as Sent
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-start text-red-600 hover:bg-red-50"
                onClick={() => {/* delete logic */}}
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete Estimate
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Send for Signature Modal */}
      <SendForSignatureModal
        isOpen={showSignatureModal}
        onClose={() => setShowSignatureModal(false)}
        documentType="estimate"
        documentId={estimate.id}
        documentTitle={`${estimate.name} - ${estimate.number}`}
        projectId={estimate.projectId}
        documentData={estimate}
        defaultSigner={{
          name: estimate.clientName,
          email: estimate.clientEmail,
          role: 'Client',
        }}
        onSuccess={handleSignatureSuccess}
      />
    </div>
  );
}
