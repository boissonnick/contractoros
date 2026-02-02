'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { PortalNav, ApprovalCard, ApprovalItem } from '@/components/client-portal';
import { SkeletonList } from '@/components/ui/Skeleton';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { toast } from '@/components/ui/Toast';

interface ClientPortalData {
  projectId: string;
  projectName: string;
  orgId: string;
  companyName?: string;
}

export default function ApprovalsPage() {
  const params = useParams();
  const token = params.token as string;

  const [portalData, setPortalData] = useState<ClientPortalData | null>(null);
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!token) {
        setError('Invalid link');
        setLoading(false);
        return;
      }

      try {
        // Fetch client portal access token
        const tokenDoc = await getDoc(doc(db, 'clientPortalTokens', token));

        if (!tokenDoc.exists()) {
          setError('This link is invalid or has expired');
          setLoading(false);
          return;
        }

        const tokenData = tokenDoc.data();
        const projectId = tokenData.projectId;
        const orgId = tokenData.orgId;

        // Fetch project details
        const projectDoc = await getDoc(
          doc(db, `organizations/${orgId}/projects/${projectId}`)
        );

        if (!projectDoc.exists()) {
          setError('Project not found');
          setLoading(false);
          return;
        }

        const projectData = projectDoc.data();

        // Fetch organization for company name
        const orgDoc = await getDoc(doc(db, `organizations/${orgId}`));
        const companyName = orgDoc.exists() ? orgDoc.data()?.name : undefined;

        setPortalData({
          projectId,
          projectName: projectData.name || 'Project',
          orgId,
          companyName,
        });

        // Fetch pending estimates
        const estimatesQuery = query(
          collection(db, `organizations/${orgId}/estimates`),
          where('projectId', '==', projectId),
          where('status', '==', 'sent')
        );

        const estimatesSnap = await getDocs(estimatesQuery);
        const estimates: ApprovalItem[] = estimatesSnap.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            type: 'estimate',
            title: data.name || `Estimate #${data.number}`,
            description: data.description,
            amount: data.total || 0,
            createdAt: data.sentAt?.toDate() || data.createdAt?.toDate() || new Date(),
            lineItems: data.lineItems?.map((li: { description: string; total: number }) => ({
              description: li.description,
              amount: li.total,
            })),
            documentUrl: data.pdfUrl,
          };
        });

        // Fetch pending change orders
        const changeOrdersQuery = query(
          collection(db, `organizations/${orgId}/projects/${projectId}/changeOrders`),
          where('status', '==', 'pending')
        );

        const changeOrdersSnap = await getDocs(changeOrdersQuery);
        const changeOrders: ApprovalItem[] = changeOrdersSnap.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            type: 'change_order',
            title: data.name || `Change Order #${data.number}`,
            description: data.description,
            amount: data.amount || 0,
            createdAt: data.createdAt?.toDate() || new Date(),
            lineItems: data.lineItems?.map((li: { description: string; amount: number }) => ({
              description: li.description,
              amount: li.amount,
            })),
            documentUrl: data.pdfUrl,
          };
        });

        setApprovals([...estimates, ...changeOrders]);
      } catch (err) {
        console.error('Error fetching approvals:', err);
        setError('Failed to load approvals');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [token]);

  const handleApprove = async (id: string) => {
    if (!portalData) return;

    const item = approvals.find((a) => a.id === id);
    if (!item) return;

    try {
      if (item.type === 'estimate') {
        await updateDoc(doc(db, `organizations/${portalData.orgId}/estimates/${id}`), {
          status: 'approved',
          approvedAt: serverTimestamp(),
          approvedBy: 'client',
        });
      } else {
        await updateDoc(
          doc(
            db,
            `organizations/${portalData.orgId}/projects/${portalData.projectId}/changeOrders/${id}`
          ),
          {
            status: 'approved',
            approvedAt: serverTimestamp(),
            approvedBy: 'client',
          }
        );
      }

      // Remove from list
      setApprovals((prev) => prev.filter((a) => a.id !== id));
      toast.success('Approved successfully!');
    } catch (err) {
      console.error('Error approving:', err);
      toast.error('Failed to approve. Please try again.');
    }
  };

  const handleRequestChanges = async (id: string, feedback: string) => {
    if (!portalData) return;

    const item = approvals.find((a) => a.id === id);
    if (!item) return;

    try {
      if (item.type === 'estimate') {
        await updateDoc(doc(db, `organizations/${portalData.orgId}/estimates/${id}`), {
          status: 'changes_requested',
          clientFeedback: feedback,
          feedbackAt: serverTimestamp(),
        });
      } else {
        await updateDoc(
          doc(
            db,
            `organizations/${portalData.orgId}/projects/${portalData.projectId}/changeOrders/${id}`
          ),
          {
            status: 'changes_requested',
            clientFeedback: feedback,
            feedbackAt: serverTimestamp(),
          }
        );
      }

      // Remove from list
      setApprovals((prev) => prev.filter((a) => a.id !== id));
      toast.success('Feedback sent!');
    } catch (err) {
      console.error('Error requesting changes:', err);
      toast.error('Failed to send feedback. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="animate-pulse bg-white border-b p-4">
          <div className="h-6 bg-gray-200 rounded w-48" />
        </div>
        <div className="max-w-2xl mx-auto p-4">
          <SkeletonList count={2} />
        </div>
      </div>
    );
  }

  if (error || !portalData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            {error || 'Something went wrong'}
          </h1>
          <p className="text-gray-500">Please contact your contractor for assistance.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <PortalNav
        token={token}
        projectName={portalData.projectName}
        companyName={portalData.companyName}
      />

      <main className="max-w-2xl mx-auto p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Pending Approvals ({approvals.length})
        </h2>

        {approvals.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">All caught up!</h3>
            <p className="text-gray-500">No items waiting for your approval.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {approvals.map((item) => (
              <ApprovalCard
                key={item.id}
                item={item}
                onApprove={handleApprove}
                onRequestChanges={handleRequestChanges}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
