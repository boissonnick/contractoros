"use client";

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy, doc, updateDoc, Timestamp, addDoc, deleteDoc } from 'firebase/firestore';
import { Project, ProjectStatus, ProjectCategory } from '@/types';
import { FirestoreError, Button, Card, Badge, EmptyState } from '@/components/ui';
import { toast } from '@/components/ui/Toast';
import { SkeletonList } from '@/components/ui/Skeleton';
import { MobileProjectList } from '@/components/projects/MobileProjectCard';
import { cn } from '@/lib/utils';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  MapPinIcon,
  CalendarIcon,
  ArchiveBoxIcon,
  ArchiveBoxXMarkIcon,
  DocumentDuplicateIcon,
  TagIcon,
  EllipsisVerticalIcon,
  TrashIcon,
  FolderIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const statusConfig: Record<ProjectStatus, { label: string; color: string }> = {
  lead: { label: 'Lead', color: 'bg-gray-100 text-gray-700' },
  bidding: { label: 'Bidding', color: 'bg-yellow-100 text-yellow-700' },
  planning: { label: 'Planning', color: 'bg-blue-100 text-blue-700' },
  active: { label: 'Active', color: 'bg-green-100 text-green-700' },
  on_hold: { label: 'On Hold', color: 'bg-orange-100 text-orange-700' },
  completed: { label: 'Completed', color: 'bg-purple-100 text-purple-700' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
};

const categoryConfig: Record<ProjectCategory, string> = {
  residential: 'Residential',
  commercial: 'Commercial',
  industrial: 'Industrial',
  renovation: 'Renovation',
  new_construction: 'New Construction',
  addition: 'Addition',
  repair: 'Repair',
  maintenance: 'Maintenance',
  other: 'Other',
};

type ViewMode = 'grid' | 'list';

export default function ProjectsPage() {
  const { user, profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<ProjectCategory | 'all'>('all');
  const [showArchived, setShowArchived] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState<string | null>(null);

  const fetchProjects = React.useCallback(async () => {
    if (!profile?.orgId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setFetchError(null);

    try {
      const projectsQuery = query(
        collection(db, 'projects'),
        where('orgId', '==', profile.orgId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(projectsQuery);
      const projectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.(),
        startDate: doc.data().startDate?.toDate?.(),
        estimatedEndDate: doc.data().estimatedEndDate?.toDate?.(),
        archivedAt: doc.data().archivedAt?.toDate?.(),
      })) as Project[];
      setProjects(projectsData);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setFetchError('Failed to load projects. The database may be unreachable.');
    } finally {
      setLoading(false);
    }
  }, [profile?.orgId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Get all unique tags across projects
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    projects.forEach(p => p.tags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [projects]);

  // Filter projects
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      // Archive filter
      const isArchived = project.isArchived || false;
      if (showArchived !== isArchived) return false;

      // Search filter
      const matchesSearch =
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.address.street.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.address.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));

      // Status filter
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;

      // Category filter
      const matchesCategory = categoryFilter === 'all' || project.category === categoryFilter;

      // Tags filter
      const matchesTags = selectedTags.length === 0 ||
        selectedTags.every(tag => project.tags?.includes(tag));

      return matchesSearch && matchesStatus && matchesCategory && matchesTags;
    });
  }, [projects, searchTerm, statusFilter, categoryFilter, selectedTags, showArchived]);

  // Stats
  const stats = useMemo(() => {
    const active = projects.filter(p => !p.isArchived);
    return {
      total: active.length,
      active: active.filter(p => p.status === 'active').length,
      planning: active.filter(p => ['lead', 'bidding', 'planning'].includes(p.status)).length,
      completed: active.filter(p => p.status === 'completed').length,
      archived: projects.filter(p => p.isArchived).length,
      totalBudget: active.reduce((sum, p) => sum + (p.budget || 0), 0),
    };
  }, [projects]);

  const handleArchive = async (projectId: string, archive: boolean) => {
    if (!user?.uid) return;
    setMenuOpenId(null);

    try {
      await updateDoc(doc(db, 'projects', projectId), {
        isArchived: archive,
        archivedAt: archive ? Timestamp.now() : null,
        archivedBy: archive ? user.uid : null,
        updatedAt: Timestamp.now(),
      });

      setProjects(prev => prev.map(p =>
        p.id === projectId
          ? { ...p, isArchived: archive, archivedAt: archive ? new Date() : undefined, archivedBy: archive ? user.uid : undefined }
          : p
      ));

      toast.success(archive ? 'Project archived' : 'Project restored');
    } catch (error) {
      console.error('Error archiving project:', error);
      toast.error('Failed to update project');
    }
  };

  const handleDuplicate = async (project: Project) => {
    if (!profile?.orgId || !user?.uid) return;
    setMenuOpenId(null);
    setDuplicating(project.id);

    try {
      // Create new project with copied data
      // Status resets to 'planning' per BUG-011 requirements
      const newProjectData = {
        orgId: profile.orgId,
        name: `${project.name} (Copy)`,
        description: project.description || '',
        address: project.address,
        status: 'planning' as ProjectStatus,
        scope: project.scope,
        templateId: project.templateId,
        clientId: project.clientId,
        pmId: user.uid,
        budget: project.budget,
        tags: project.tags,
        category: project.category,
        sourceProjectId: project.id,
        isArchived: false, // New copy is never archived
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const newProjectRef = await addDoc(collection(db, 'projects'), newProjectData);

      // Build a map of old phase IDs to new phase IDs for task copying
      const phaseIdMap: Record<string, string> = {};

      // Copy phases if they exist
      const phasesSnap = await getDocs(collection(db, 'projects', project.id, 'phases'));
      for (const phaseDoc of phasesSnap.docs) {
        const phaseData = phaseDoc.data();
        const newPhaseRef = await addDoc(collection(db, 'projects', newProjectRef.id, 'phases'), {
          ...phaseData,
          projectId: newProjectRef.id,
          status: 'upcoming',
          createdAt: Timestamp.now(),
        });
        phaseIdMap[phaseDoc.id] = newPhaseRef.id;
      }

      // Copy tasks for this project
      const tasksSnap = await getDocs(
        query(collection(db, 'tasks'), where('projectId', '==', project.id))
      );

      for (const taskDoc of tasksSnap.docs) {
        const taskData = taskDoc.data();
        // Map old phase ID to new phase ID
        const newPhaseId = taskData.phaseId ? phaseIdMap[taskData.phaseId] : undefined;

        await addDoc(collection(db, 'tasks'), {
          ...taskData,
          projectId: newProjectRef.id,
          phaseId: newPhaseId,
          // Reset task status to pending
          status: 'pending',
          // Clear completion data
          completedAt: null,
          actualHours: null,
          // Clear assignments (optional - user can reassign)
          assignedTo: [],
          assignedSubId: null,
          // Clear dependencies (would need to map to new task IDs - complex)
          dependencies: [],
          // Clear attachments (files are project-specific)
          attachments: [],
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      }

      toast.success('Project duplicated successfully');
      fetchProjects();
    } catch (error) {
      console.error('Error duplicating project:', error);
      toast.error('Failed to duplicate project');
    } finally {
      setDuplicating(null);
    }
  };

  const handleDelete = async (projectId: string) => {
    if (!confirm('Are you sure you want to permanently delete this project? This cannot be undone.')) return;
    setMenuOpenId(null);

    try {
      await deleteDoc(doc(db, 'projects', projectId));
      setProjects(prev => prev.filter(p => p.id !== projectId));
      toast.success('Project deleted');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="p-6">
        <SkeletonList count={6} />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex items-center justify-center h-64">
        <FirestoreError message={fetchError} onRetry={fetchProjects} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-500 mt-1">
            {showArchived ? `${stats.archived} archived projects` : `${stats.total} total projects`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowArchived(!showArchived)}
            className={showArchived ? 'bg-gray-100' : ''}
          >
            {showArchived ? (
              <>
                <ArchiveBoxXMarkIcon className="h-4 w-4 mr-2" />
                Show Active
              </>
            ) : (
              <>
                <ArchiveBoxIcon className="h-4 w-4 mr-2" />
                Archive ({stats.archived})
              </>
            )}
          </Button>
          <Link href="/dashboard/projects/new">
            <Button variant="primary">
              <PlusIcon className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      {!showArchived && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <ChartBarIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                <p className="text-xs text-gray-500">Active</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FolderIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.planning}</p>
                <p className="text-xs text-gray-500">In Pipeline</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FolderIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                <p className="text-xs text-gray-500">Completed</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <ChartBarIcon className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalBudget)}</p>
                <p className="text-xs text-gray-500">Total Budget</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects, addresses, or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="all">All Status</option>
              <option value="lead">Lead</option>
              <option value="bidding">Bidding</option>
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as ProjectCategory | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="all">All Categories</option>
            {Object.entries(categoryConfig).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-50'
              )}
            >
              <Squares2X2Icon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-50'
              )}
            >
              <ListBulletIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Tags Filter */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <TagIcon className="h-4 w-4 text-gray-400" />
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTags(prev =>
                prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
              )}
              className={cn(
                'px-2 py-1 text-xs rounded-full transition-colors',
                selectedTags.includes(tag)
                  ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {tag}
            </button>
          ))}
          {selectedTags.length > 0 && (
            <button
              onClick={() => setSelectedTags([])}
              className="text-xs text-gray-500 hover:text-gray-700 underline ml-2"
            >
              Clear tags
            </button>
          )}
        </div>
      )}

      {/* Projects List */}
      {filteredProjects.length > 0 ? (
        <>
          {/* Mobile: Touch-optimized project cards */}
          <div className="md:hidden">
            <MobileProjectList
              projects={filteredProjects}
              basePath="/dashboard/projects"
              showBudget={true}
              showClient={true}
              emptyMessage="No projects match your filters"
            />
          </div>

          {/* Desktop: Grid/List view */}
          {viewMode === 'grid' ? (
          <div className="hidden md:grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-xl border hover:shadow-md transition-shadow relative group"
              >
                {/* Menu Button */}
                <div className="absolute top-3 right-3 z-10">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setMenuOpenId(menuOpenId === project.id ? null : project.id);
                    }}
                    className="p-1.5 rounded-lg bg-white/80 hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <EllipsisVerticalIcon className="h-5 w-5 text-gray-500" />
                  </button>
                  {menuOpenId === project.id && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-48 z-20">
                      <button
                        onClick={() => handleDuplicate(project)}
                        disabled={duplicating === project.id}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <DocumentDuplicateIcon className="h-4 w-4" />
                        {duplicating === project.id ? 'Duplicating...' : 'Duplicate'}
                      </button>
                      <button
                        onClick={() => handleArchive(project.id, !project.isArchived)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        {project.isArchived ? (
                          <>
                            <ArchiveBoxXMarkIcon className="h-4 w-4" />
                            Restore
                          </>
                        ) : (
                          <>
                            <ArchiveBoxIcon className="h-4 w-4" />
                            Archive
                          </>
                        )}
                      </button>
                      {project.isArchived && (
                        <button
                          onClick={() => handleDelete(project.id)}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <TrashIcon className="h-4 w-4" />
                          Delete Permanently
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <Link href={`/dashboard/projects/${project.id}`} prefetch={false} className="block p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 line-clamp-1 pr-8">{project.name}</h3>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className={statusConfig[project.status].color}>
                      {statusConfig[project.status].label}
                    </Badge>
                    {project.category && (
                      <Badge className="bg-gray-100 text-gray-600">
                        {categoryConfig[project.category]}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <MapPinIcon className="h-4 w-4" />
                      <span className="line-clamp-1">
                        {project.address.street}, {project.address.city}
                      </span>
                    </div>
                    {project.startDate && (
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        <span>Started {format(new Date(project.startDate), 'MMM d, yyyy')}</span>
                      </div>
                    )}
                    {project.budget && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-700">
                          {formatCurrency(project.budget)} budget
                        </span>
                        {project.currentSpend && (
                          <span className="text-gray-400">
                            · {formatCurrency(project.currentSpend)} spent
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {project.tags && project.tags.length > 0 && (
                    <div className="flex items-center gap-1 mt-3 flex-wrap">
                      {project.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                      {project.tags.length > 3 && (
                        <span className="text-xs text-gray-400">+{project.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                </Link>
              </div>
            ))}
          </div>
        ) : (
          // List View (Desktop only)
          <div className="hidden md:block space-y-2">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-lg border hover:shadow-md transition-shadow relative group"
              >
                <Link href={`/dashboard/projects/${project.id}`} prefetch={false} className="block p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900 truncate">{project.name}</h3>
                          <Badge className={cn(statusConfig[project.status].color, 'text-xs')}>
                            {statusConfig[project.status].label}
                          </Badge>
                          {project.category && (
                            <Badge className="bg-gray-100 text-gray-600 text-xs">
                              {categoryConfig[project.category]}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <MapPinIcon className="h-3.5 w-3.5" />
                            {project.address.city}, {project.address.state}
                          </span>
                          {project.startDate && (
                            <span>{format(new Date(project.startDate), 'MMM d, yyyy')}</span>
                          )}
                          {project.tags && project.tags.length > 0 && (
                            <span className="flex items-center gap-1">
                              <TagIcon className="h-3.5 w-3.5" />
                              {project.tags.slice(0, 2).join(', ')}
                              {project.tags.length > 2 && ` +${project.tags.length - 2}`}
                            </span>
                          )}
                        </div>
                      </div>
                      {project.budget && (
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{formatCurrency(project.budget)}</p>
                          {project.currentSpend && (
                            <p className="text-xs text-gray-500">{formatCurrency(project.currentSpend)} spent</p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setMenuOpenId(menuOpenId === project.id ? null : project.id);
                        }}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <EllipsisVerticalIcon className="h-5 w-5 text-gray-500" />
                      </button>
                      {menuOpenId === project.id && (
                        <div className="absolute right-4 top-12 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-48 z-20">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              handleDuplicate(project);
                            }}
                            disabled={duplicating === project.id}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <DocumentDuplicateIcon className="h-4 w-4" />
                            {duplicating === project.id ? 'Duplicating...' : 'Duplicate'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              handleArchive(project.id, !project.isArchived);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            {project.isArchived ? (
                              <>
                                <ArchiveBoxXMarkIcon className="h-4 w-4" />
                                Restore
                              </>
                            ) : (
                              <>
                                <ArchiveBoxIcon className="h-4 w-4" />
                                Archive
                              </>
                            )}
                          </button>
                          {project.isArchived && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                handleDelete(project.id);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <TrashIcon className="h-4 w-4" />
                              Delete Permanently
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
        </>
      ) : (
        <EmptyState
          icon={<FolderIcon className="h-full w-full" />}
          title={showArchived ? "No archived projects" : (searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' || selectedTags.length > 0) ? 'No projects found' : 'No projects yet'}
          description={showArchived
            ? "Projects you archive will appear here."
            : (searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' || selectedTags.length > 0)
              ? 'Try adjusting your search or filter criteria'
              : 'Get started by creating your first project'
          }
          action={!showArchived && !searchTerm && statusFilter === 'all' && categoryFilter === 'all' && selectedTags.length === 0 ? {
            label: 'New Project',
            onClick: () => window.location.href = '/dashboard/projects/new',
          } : undefined}
        />
      )}
    </div>
  );
}
