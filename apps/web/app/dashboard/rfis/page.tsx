'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { RFICard, RFI } from '@/components/rfis/RFICard';
import { Project } from '@/types';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';

type RFIStatus = 'draft' | 'submitted' | 'responded' | 'closed';

interface RFIWithProject extends RFI {
  projectName: string;
}

export default function RFIsPage() {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [allRFIs, setAllRFIs] = useState<RFIWithProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<RFIStatus | ''>('');
  const [projectFilter, setProjectFilter] = useState('');

  // Fetch projects and RFIs
  useEffect(() => {
    if (!profile?.orgId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all projects
        const projectsQuery = query(
          collection(db, 'projects'),
          where('orgId', '==', profile.orgId),
          orderBy('createdAt', 'desc')
        );
        const projectsSnap = await getDocs(projectsQuery);
        const projectsList = projectsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Project[];
        setProjects(projectsList);

        // Fetch RFIs from API for each project
        const rfiPromises = projectsList.map(async (project) => {
          try {
            const res = await fetch(`/api/projects/${project.id}/rfis`);
            if (res.ok) {
              const data = await res.json();
              return (data.items || []).map((rfi: RFI) => ({
                ...rfi,
                projectName: project.name,
                projectId: project.id,
              }));
            }
          } catch {
            // Ignore
          }
          return [];
        });

        const results = await Promise.all(rfiPromises);
        setAllRFIs(results.flat());
      } catch (err) {
        console.error('Error fetching RFIs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile?.orgId]);

  // Filter RFIs
  const filteredRFIs = useMemo(() => {
    return allRFIs.filter((rfi) => {
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        if (
          !rfi.title.toLowerCase().includes(search) &&
          !rfi.number.toLowerCase().includes(search) &&
          !rfi.projectName.toLowerCase().includes(search)
        ) {
          return false;
        }
      }
      if (statusFilter && rfi.status !== statusFilter) return false;
      if (projectFilter && rfi.projectId !== projectFilter) return false;
      return true;
    });
  }, [allRFIs, searchTerm, statusFilter, projectFilter]);

  // Stats
  const stats = useMemo(() => ({
    total: allRFIs.length,
    open: allRFIs.filter((r) => r.status === 'submitted').length,
    responded: allRFIs.filter((r) => r.status === 'responded').length,
    closed: allRFIs.filter((r) => r.status === 'closed').length,
  }), [allRFIs]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="RFIs"
          description="Request for Information across all projects"
        />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="RFIs"
        description="Request for Information across all projects"
      />

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="p-4">
          <p className="text-sm text-gray-500">Total RFIs</p>
          <p className="text-2xl font-bold text-gray-900 font-heading tracking-tight">{stats.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Open</p>
          <p className="text-2xl font-bold text-blue-600">{stats.open}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Responded</p>
          <p className="text-2xl font-bold text-green-600">{stats.responded}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Closed</p>
          <p className="text-2xl font-bold text-purple-600">{stats.closed}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search RFIs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as RFIStatus | '')}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="responded">Responded</option>
            <option value="closed">Closed</option>
          </select>
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* RFI List */}
      {filteredRFIs.length === 0 ? (
        <EmptyState
          icon={<DocumentTextIcon className="h-full w-full" />}
          title="No RFIs Found"
          description={
            allRFIs.length === 0
              ? "No RFIs have been created yet. Create RFIs from individual project pages."
              : "No RFIs match your filters."
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRFIs.map((rfi) => (
            <div key={rfi.id} className="relative">
              <div className="absolute -top-2 left-3 z-10">
                <span className="text-[10px] px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full font-medium">
                  {rfi.projectName}
                </span>
              </div>
              <RFICard rfi={rfi} />
            </div>
          ))}
        </div>
      )}

      {/* Help text */}
      <div className="text-center text-sm text-gray-500 py-4">
        <p>To create new RFIs, navigate to a specific project and use the RFI tab.</p>
        <Link href="/dashboard/projects" className="text-blue-600 hover:underline">
          View Projects →
        </Link>
      </div>
    </div>
  );
}
