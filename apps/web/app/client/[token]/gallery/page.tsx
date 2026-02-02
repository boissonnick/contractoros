'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc, collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { PortalNav, PhotoGallery, GalleryPhoto } from '@/components/client-portal';
import { SkeletonList } from '@/components/ui/Skeleton';

interface ClientPortalData {
  projectId: string;
  projectName: string;
  orgId: string;
  companyName?: string;
}

export default function GalleryPage() {
  const params = useParams();
  const token = params.token as string;

  const [portalData, setPortalData] = useState<ClientPortalData | null>(null);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [phases, setPhases] = useState<string[]>([]);
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

        // Fetch project photos
        const photosQuery = query(
          collection(db, `organizations/${orgId}/projects/${projectId}/photos`),
          orderBy('createdAt', 'desc')
        );

        const photosSnap = await getDocs(photosQuery);
        const photosData: GalleryPhoto[] = photosSnap.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            url: data.url,
            thumbnailUrl: data.thumbnailUrl,
            caption: data.caption || data.description,
            phase: data.phase,
            takenAt: data.takenAt?.toDate() || data.createdAt?.toDate(),
          };
        });

        setPhotos(photosData);

        // Extract unique phases
        const phaseSet = new Set(photosData.map((p) => p.phase).filter((p): p is string => Boolean(p)));
        const uniquePhases = Array.from(phaseSet);
        setPhases(uniquePhases);
      } catch (err) {
        console.error('Error fetching photos:', err);
        setError('Failed to load photos');
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
        <div className="max-w-4xl mx-auto p-4">
          <div className="grid grid-cols-3 gap-2">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded-lg" />
            ))}
          </div>
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

      <main className="max-w-4xl mx-auto p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Project Photos ({photos.length})
        </h2>
        <PhotoGallery photos={photos} phases={phases} />
      </main>
    </div>
  );
}
