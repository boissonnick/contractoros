'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { SubmittalCard, Submittal, SubmittalStatus } from '@/components/submittals/SubmittalCard';
import { Project } from '@/types';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';

interface SubmittalWithProject extends Submittal {
  projectName: string;
}

export default function SubmittalsPage() {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [allSubmittals, setAllSubmittals] = useState<SubmittalWithProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SubmittalStatus | ''>('');
  const [projectFilter, setProjectFilter] = useState('');

  // Fetch projects and submittals
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

        // Fetch submittals from API for each project
        const promises = projectsList.map(async (project) => {
          try {
            const res = await fetch(`/api/projects/${project.id}/submittals`);
            if (res.ok) {
              const data = await res.json();
              return (data.items || []).map((s: Submittal) => ({
                ...s,
                projectName: project.name,
                projectId: project.id,
              }));
            }
          } catch {
            // Ignore
          }
          return [];
        });

        const results = await Promise.all(promises);
        setAllSubmittals(results.flat());
      } catch (err) {
        console.error('Error fetching submittals:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile?.orgId]);

  // Filter submittals
  const filteredSubmittals = useMemo(() => {
    return allSubmittals.filter((s) => {
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        if (
          !s.title.toLowerCase().includes(search) &&
          !s.number.toLowerCase().includes(search) &&
          !s.projectName.toLowerCase().includes(search)
        ) {
          return false;
        }
      }
      if (statusFilter && s.status !== statusFilter) return false;
      if (projectFilter && s.projectId !== projectFilter) return false;
      return true;
    });
  }, [allSubmittals, searchTerm, statusFilter, projectFilter]);

  // Stats
  const stats = useMemo(() => ({
    total: allSubmittals.length,
    pending: allSubmittals.filter((s) => s.status === 'pending' || s.status === 'under_review').length,
    approved: allSubmittals.filter((s) => s.status === 'approved').length,
    rejected: allSubmittals.filter((s) => s.status === 'rejected' || s.status === 'revise').length,
  }), [allSubmittals]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Submittals"
          description="Track submittals across all projects"
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
        title="Submittals"
        description="Track submittals across all projects"
      />

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="p-4">
          <p className="text-sm text-gray-500">Total Submittals</p>
          <p className="text-2xl font-bold text-gray-900 tracking-tight">{stats.total}</p>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <ClockIcon className="h-8 w-8 text-blue-500" />
          <div>
            <p className="text-sm text-gray-500">Pending Review</p>
            <p className="text-2xl font-bold text-blue-600">{stats.pending}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <CheckCircleIcon className="h-8 w-8 text-green-500" />
          <div>
            <p className="text-sm text-gray-500">Approved</p>
            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <XCircleIcon className="h-8 w-8 text-red-500" />
          <div>
            <p className="text-sm text-gray-500">Needs Revision</p>
            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search submittals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as SubmittalStatus | '')}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="revise">Revise & Resubmit</option>
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

      {/* Submittal List */}
      {filteredSubmittals.length === 0 ? (
        <EmptyState
          icon={<DocumentTextIcon className="h-full w-full" />}
          title="No Submittals Found"
          description={
            allSubmittals.length === 0
              ? "No submittals have been created yet. Create submittals from individual project pages."
              : "No submittals match your filters."
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSubmittals.map((submittal) => (
            <div key={submittal.id} className="relative">
              <div className="absolute -top-2 left-3 z-10">
                <span className="text-[10px] px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full font-medium">
                  {submittal.projectName}
                </span>
              </div>
              <SubmittalCard submittal={submittal} />
            </div>
          ))}
        </div>
      )}

      {/* Help text */}
      <div className="text-center text-sm text-gray-500 py-4">
        <p>To create new submittals, navigate to a specific project and use the Submittals tab.</p>
        <Link href="/dashboard/projects" className="text-blue-600 hover:underline">
          View Projects →
        </Link>
      </div>
    </div>
  );
}
