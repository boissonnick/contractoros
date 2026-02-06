'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc, collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { PortalNav, ProjectTimeline, TimelinePhase } from '@/components/client-portal';
import { SkeletonList } from '@/components/ui/Skeleton';

interface ClientPortalData {
  projectId: string;
  projectName: string;
  orgId: string;
  companyName?: string;
}

export default function TimelinePage() {
  const params = useParams();
  const token = params.token as string;

  const [portalData, setPortalData] = useState<ClientPortalData | null>(null);
  const [phases, setPhases] = useState<TimelinePhase[]>([]);
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

        // Fetch project phases
        const phasesQuery = query(
          collection(db, `organizations/${orgId}/projects/${projectId}/phases`),
          orderBy('order', 'asc')
        );

        const phasesSnap = await getDocs(phasesQuery);
        const phasesData: TimelinePhase[] = phasesSnap.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            description: data.description,
            status: data.status || 'upcoming',
            startDate: data.startDate?.toDate() || null,
            endDate: data.endDate?.toDate() || null,
            completedDate: data.completedDate?.toDate() || null,
          };
        });

        setPhases(phasesData);
      } catch (err) {
        console.error('Error fetching timeline:', err);
        setError('Failed to load timeline');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="animate-pulse bg-white border-b p-4">
          <div className="h-6 bg-gray-200 rounded w-48" />
        </div>
        <div className="max-w-2xl mx-auto p-4">
          <SkeletonList count={4} />
        </div>
      </div>
    );
  }

  if (error || !portalData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold tracking-tight text-gray-900 mb-2">
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
        <h2 className="text-lg font-semibold tracking-tight text-gray-900 mb-4">Project Timeline</h2>
        <ProjectTimeline phases={phases} />
      </main>
    </div>
  );
}
