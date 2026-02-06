"use client";

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/auth';
import { useImpersonation } from '@/lib/contexts/ImpersonationContext';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { Project, Task, Invoice, Estimate } from '@/types';
import { Badge, Button, EmptyState } from '@/components/ui';
import { FirestoreError } from '@/components/ui';
import { SkeletonList } from '@/components/ui/Skeleton';
import { MobileStats } from '@/components/ui/MobileStats';
import { cn, formatCurrency } from '@/lib/utils';
import { useActivityLog } from '@/lib/hooks/useActivityLog';
import { useMaterialPrices } from '@/lib/hooks/useIntelligence';

// Lazy-load heavy below-fold widget
const MaterialPriceWidget = dynamic(
  () => import('@/components/intelligence/MaterialPriceWidget'),
  { ssr: false, loading: () => <div className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse h-48" /> }
);
import {
  calculateBudgetPercentage,
  getBudgetStatus,
  getBudgetBarColor,
} from '@/lib/budget-utils';
import {
  FolderIcon,
  BanknotesIcon,
  UserGroupIcon,
  PlusIcon,
  ChartBarIcon,
  DocumentTextIcon,
  MapPinIcon,
  ClipboardDocumentCheckIcon,
  ArrowRightIcon,
  XMarkIcon,
  ExclamationCircleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { format, isAfter, isBefore, addDays } from 'date-fns';

// ===========================================
// PREMIUM STAT CARD COMPONENT
// ===========================================
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
  trendUp?: boolean;
  href?: string;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'gray';
  subtitle?: string;
}

const BG_GRADIENTS = {
  blue: 'from-blue-500/10 to-blue-600/5 border-blue-200/50',
  green: 'from-green-500/10 to-green-600/5 border-green-200/50',
  yellow: 'from-amber-500/10 to-amber-600/5 border-amber-200/50',
  red: 'from-red-500/10 to-red-600/5 border-red-200/50',
  purple: 'from-purple-500/10 to-purple-600/5 border-purple-200/50',
  orange: 'from-orange-500/10 to-orange-600/5 border-orange-200/50',
  gray: 'from-gray-500/10 to-gray-600/5 border-gray-200/50',
} as const;

const ICON_COLORS = {
  blue: 'text-blue-600',
  green: 'text-green-600',
  yellow: 'text-amber-600',
  red: 'text-red-600',
  purple: 'text-purple-600',
  orange: 'text-orange-600',
  gray: 'text-gray-600',
} as const;

function StatCard({ title, value, icon: Icon, trend, trendUp, href, color, subtitle }: StatCardProps) {
  const content = (
    <div className={cn(
      'group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300',
      'bg-gradient-to-br bg-white hover:shadow-lg hover:shadow-brand-500/5',
      BG_GRADIENTS[color],
      href && 'cursor-pointer'
    )}>
      {/* Background Glow Effect */}
      <div className={cn(
        "absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-20 blur-2xl",
        color === 'blue' && "bg-blue-500",
        color === 'green' && "bg-green-500",
        color === 'yellow' && "bg-amber-500",
        color === 'red' && "bg-red-500",
        color === 'purple' && "bg-purple-500",
        color === 'orange' && "bg-orange-500",
        color === 'gray' && "bg-gray-500"
      )} />

      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{value}</h3>
          </div>
          {subtitle && (
            <p className="mt-1 text-xs font-medium text-gray-500">{subtitle}</p>
          )}
        </div>
        <div className={cn(
          "p-2.5 rounded-xl bg-white shadow-sm ring-1 ring-black/5 transition-transform duration-300 group-hover:scale-110",
          ICON_COLORS[color]
        )}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {trend && (
        <div className="mt-4 flex items-center gap-1">
          <span className={cn(
            "text-xs font-bold px-1.5 py-0.5 rounded-md",
            trendUp ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          )}>
            {trendUp ? '↑' : '↓'} {trend}
          </span>
          <span className="text-xs text-gray-400">vs last month</span>
        </div>
      )}
    </div>
  );

  return href ? <Link href={href} className="flex-1 min-w-[200px]">{content}</Link> : <div className="flex-1 min-w-[200px]">{content}</div>;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  lead: { label: 'Lead', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  bidding: { label: 'Bidding', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  planning: { label: 'Planning', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  active: { label: 'Active', color: 'bg-green-50 text-green-700 border-green-200' },
  on_hold: { label: 'On Hold', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  completed: { label: 'Completed', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  cancelled: { label: 'Cancelled', color: 'bg-red-50 text-red-700 border-red-200' },
};

// ===========================================
// MAIN DASHBOARD PAGE
// ===========================================

export default function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const { currentRole } = useImpersonation();
  const { activities } = useActivityLog(profile?.orgId);
  const { prices: materialPrices, loading: materialPricesLoading } = useMaterialPrices();

  // Determine if user is a client (limited view)
  const isClientRole = currentRole === 'client';

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Check for missing profile or orgId
  const profileIncomplete = !authLoading && user && (!profile || !profile.orgId);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [teamCount, setTeamCount] = useState(0);

  // Mobile quick actions menu state
  const [showMobileQuickActions, setShowMobileQuickActions] = useState(false);
  const openMobileQuickActions = useCallback(() => setShowMobileQuickActions(true), []);
  const closeMobileQuickActions = useCallback(() => setShowMobileQuickActions(false), []);

  const fetchDashboardData = React.useCallback(async () => {
    if (!profile?.orgId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setFetchError(null);

    try {
      // Fetch projects - filter by client if user is a client
      const projectsQ = isClientRole
        ? query(
          collection(db, 'projects'),
          where('orgId', '==', profile.orgId),
          where('clientId', '==', user?.uid),
          orderBy('createdAt', 'desc'),
          limit(100)
        )
        : query(
          collection(db, 'projects'),
          where('orgId', '==', profile.orgId),
          orderBy('createdAt', 'desc'),
          limit(100)
        );

      if (!isClientRole) {
        // Parallel fetch all dashboard data at once (eliminates waterfall)
        const [projectsSnap, tasksSnap, invoicesSnap, estimatesSnap, usersSnap] = await Promise.all([
          getDocs(projectsQ),
          getDocs(query(
            collection(db, 'tasks'),
            where('orgId', '==', profile.orgId),
            orderBy('createdAt', 'desc'),
            limit(50)
          )),
          getDocs(query(
            collection(db, 'invoices'),
            where('orgId', '==', profile.orgId),
            orderBy('createdAt', 'desc'),
            limit(50)
          )),
          getDocs(query(
            collection(db, 'estimates'),
            where('orgId', '==', profile.orgId),
            orderBy('createdAt', 'desc'),
            limit(20)
          )),
          getDocs(query(
            collection(db, 'users'),
            where('orgId', '==', profile.orgId),
            where('isActive', '==', true),
            limit(200)
          )),
        ]);

        setProjects((projectsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
          startDate: doc.data().startDate?.toDate?.(),
          estimatedEndDate: doc.data().estimatedEndDate?.toDate?.(),
        })) as Project[]).filter(p => !p.isArchived));

        setTasks(tasksSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
          dueDate: doc.data().dueDate?.toDate?.(),
        })) as Task[]);

        setInvoices(invoicesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
          dueDate: doc.data().dueDate?.toDate?.(),
        })) as Invoice[]);

        setEstimates(estimatesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        })) as Estimate[]);

        setTeamCount(usersSnap.size);
      } else {
        // Client: only fetch projects
        const projectsSnap = await getDocs(projectsQ);
        setProjects((projectsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
          startDate: doc.data().startDate?.toDate?.(),
          estimatedEndDate: doc.data().estimatedEndDate?.toDate?.(),
        })) as Project[]).filter(p => !p.isArchived));

        setTasks([]);
        setInvoices([]);
        setEstimates([]);
        setTeamCount(0);
      }

    } catch (error: unknown) {
      console.error('Error fetching dashboard data:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('requires an index')) {
        setFetchError('Database index required. Please run: firebase deploy --only firestore:indexes');
      } else if (errorMessage.includes('permission-denied')) {
        setFetchError('Permission denied. Please check your Firestore security rules.');
      } else {
        setFetchError(`Failed to load dashboard data: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  }, [profile?.orgId, user?.uid, isClientRole]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Calculate stats
  const stats = useMemo(() => {
    const activeProjects = projects.filter(p => p.status === 'active');
    const pipelineProjects = projects.filter(p => ['lead', 'bidding', 'planning'].includes(p.status));
    const completedProjects = projects.filter(p => p.status === 'completed');

    // Financial stats
    const outstandingInvoices = invoices.filter(i => ['sent', 'viewed', 'partial', 'overdue'].includes(i.status));
    const outstandingAmount = outstandingInvoices.reduce((sum, i) => sum + i.amountDue, 0);
    const overdueInvoices = invoices.filter(i => i.status === 'overdue' || (i.dueDate && new Date(i.dueDate) < new Date() && ['sent', 'viewed', 'partial'].includes(i.status)));
    const overdueAmount = overdueInvoices.reduce((sum, i) => sum + i.amountDue, 0);

    // Task stats
    const pendingTasks = tasks.filter(t => t.status !== 'completed');
    const overdueTasks = pendingTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date());
    const dueSoonTasks = pendingTasks.filter(t => {
      if (!t.dueDate) return false;
      const dueDate = new Date(t.dueDate);
      const now = new Date();
      return isAfter(dueDate, now) && isBefore(dueDate, addDays(now, 7));
    });

    // Estimate stats
    const pendingEstimates = estimates.filter(e => ['sent', 'viewed'].includes(e.status));
    const acceptedEstimates = estimates.filter(e => e.status === 'accepted');
    const pipelineValue = pendingEstimates.reduce((sum, e) => sum + e.total, 0);

    // Budget utilization
    const totalBudget = activeProjects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const totalSpent = activeProjects.reduce((sum, p) => sum + (p.currentSpend || 0), 0);

    return {
      activeProjects: activeProjects.length,
      pipelineProjects: pipelineProjects.length,
      completedProjects: completedProjects.length,
      totalProjects: projects.length,
      outstandingAmount,
      overdueAmount,
      overdueInvoicesCount: overdueInvoices.length,
      pendingTasks: pendingTasks.length,
      overdueTasks: overdueTasks.length,
      dueSoonTasks: dueSoonTasks.length,
      pendingEstimates: pendingEstimates.length,
      pipelineValue,
      acceptedEstimatesCount: acceptedEstimates.length,
      totalBudget,
      totalSpent,
      budgetUtilization: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
      teamCount,
    };
  }, [projects, tasks, invoices, estimates, teamCount]);

  // Active projects list
  const activeProjectsList = useMemo(() => {
    return projects
      .filter(p => p.status === 'active')
      .slice(0, 4);
  }, [projects]);

  // Overdue tasks list
  const overdueTasksList = useMemo(() => {
    return tasks
      .filter(t => t.status !== 'completed' && t.dueDate && new Date(t.dueDate) < new Date())
      .slice(0, 5);
  }, [tasks]);

  // Pending estimates list
  const _pendingEstimatesList = useMemo(() => {
    return estimates
      .filter(e => ['sent', 'viewed'].includes(e.status))
      .slice(0, 5);
  }, [estimates]);

  // Mobile stats
  type StatColor = 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'gray';
  const _mobileStatsData = useMemo(() => {
    // ... (Existing Mobile Stats logic kept for compatibility but not primary)
    const mobileStats: Array<{
      label: string;
      value: string | number;
      subtitle: string;
      icon: React.ComponentType<{ className?: string }>;
      color: StatColor;
      href?: string;
    }> = [
        {
          label: 'Active Projects',
          value: stats.activeProjects,
          subtitle: `${stats.pipelineProjects} in pipeline`,
          icon: FolderIcon,
          color: 'blue',
          href: '/dashboard/projects',
        },
      ];
    // Add other mobile stats conditionally... (Simplified for brevity as we focus on Premium UI)
    return mobileStats;
  }, [stats]);


  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonList count={4} />
        </div>
      </div>
    );
  }

  // Onboarding Prompt
  if (profileIncomplete) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-10 text-center max-w-lg">
          <div className="h-16 w-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <SparklesIcon className="h-8 w-8 text-amber-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Complete Your Setup</h3>
          <p className="text-gray-500 mb-8 leading-relaxed">
            {!profile
              ? "Your profile hasn't been set up yet. Join the team to get started."
              : "Your organization isn't configured. Let's set up your company details."}
          </p>
          <Link href="/onboarding/company-setup">
            <Button size="lg" className="w-full bg-brand-primary hover:bg-brand-800 text-white shadow-lg shadow-brand-500/20">
              Complete Setup <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex items-center justify-center h-64">
        <FirestoreError message={fetchError} onRetry={fetchDashboardData} />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-32 md:pb-0">
      {/* 1. HERO HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2 border border-blue-100">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            System Operational
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
            Hello, {profile?.displayName?.split(' ')[0] || 'there'}
          </h1>
          <p className="text-gray-500 mt-2 text-lg">
            You have <span className="font-semibold text-gray-900">{stats.activeProjects} active projects</span> and <span className="font-semibold text-gray-900">{stats.pendingTasks} pending tasks</span> today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PermissionGuard permission="canCreateProjects" hide>
            <Link href="/dashboard/projects/new">
              <Button className="bg-brand-primary hover:bg-brand-800 text-white shadow-lg shadow-brand-500/25 border-0">
                <PlusIcon className="h-5 w-5 mr-2" />
                New Project
              </Button>
            </Link>
          </PermissionGuard>
        </div>
      </div>

      {/* 2. PREMIUM STATS GRID */}
      {isClientRole ? (
        <MobileStats
          stats={[
            {
              label: 'My Projects',
              value: stats.activeProjects,
              subtitle: `${stats.completedProjects} completed`,
              icon: FolderIcon,
              color: 'blue',
              href: '/dashboard/projects',
            },
          ]}
          columns={2}
          scrollable={true}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <StatCard
            title="Active Projects"
            value={stats.activeProjects}
            subtitle={`${stats.pipelineProjects} currently in pipeline`}
            icon={FolderIcon}
            color="blue"
            href="/dashboard/projects"
          />
          <PermissionGuard permission="canViewAllFinances" hide>
            <StatCard
              title="Outstanding Revenue"
              value={formatCurrency(stats.outstandingAmount)}
              subtitle={`${stats.overdueInvoicesCount} invoices overdue`}
              icon={BanknotesIcon}
              color={stats.overdueAmount > 0 ? 'red' : 'green'}
              href="/dashboard/invoices"
            />
          </PermissionGuard>
          <PermissionGuard permission="canManageInvoices" hide>
            <StatCard
              title="Pipeline Value"
              value={formatCurrency(stats.pipelineValue)}
              subtitle={`${stats.pendingEstimates} estimates sent`}
              icon={ChartBarIcon}
              color="purple"
              href="/dashboard/estimates"
            />
          </PermissionGuard>
          <PermissionGuard permission="canViewAllTasks" hide>
            <StatCard
              title="Pending Tasks"
              value={stats.pendingTasks}
              subtitle={`${stats.overdueTasks} urgent items`}
              icon={ClipboardDocumentCheckIcon}
              color={stats.overdueTasks > 0 ? 'orange' : 'gray'}
            />
          </PermissionGuard>
        </div>
      )}

      {/* 3. MAIN CONTENT MASONRY */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8 items-start">

        {/* Left Column (2/3 width) */}
        <div className="xl:col-span-2 space-y-8">
          {/* Active Projects List */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                <FolderIcon className="h-5 w-5 text-gray-400" />
                Active Projects
              </h2>
              <Link href="/dashboard/projects" className="text-sm font-medium text-brand-primary hover:text-brand-700">
                View All
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {activeProjectsList.length > 0 ? activeProjectsList.map((project) => {
                const percentUsed = project.budget && project.currentSpend !== undefined
                  ? calculateBudgetPercentage(project.currentSpend, project.budget)
                  : 0;
                return (
                  <Link key={project.id} href={`/dashboard/projects/${project.id}`} className="block p-5 hover:bg-gray-50 transition-all group">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 group-hover:text-brand-primary transition-colors line-clamp-2 sm:truncate">
                          {project.name}
                        </h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          {project.clientName && (
                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gray-100/50">
                              <UserGroupIcon className="h-3.5 w-3.5" /> {project.clientName}
                            </span>
                          )}
                          <span className="flex items-center gap-1.5">
                            <MapPinIcon className="h-3.5 w-3.5" /> {project.address?.city || 'No Location'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {project.budget ? (
                          <div>
                            <p className="font-bold text-gray-900">{formatCurrency(project.budget)}</p>
                            <div className="mt-1.5 w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden ml-auto">
                              <div
                                className={cn('h-full rounded-full', getBudgetBarColor(getBudgetStatus(percentUsed)))}
                                style={{ width: `${Math.min(percentUsed, 100)}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <Badge className={statusConfig[project.status].color}>
                            {statusConfig[project.status].label}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              }) : (
                <EmptyState
                  icon={<FolderIcon className="w-full h-full" />}
                  title="No active projects"
                  description="Start a new project to see it here."
                  action={{ label: "Create Project", href: "/dashboard/projects/new" }}
                />
              )}
            </div>
          </div>

          {/* Material Prices Widget */}
          <PermissionGuard permission="canManageInvoices" hide>
            <MaterialPriceWidget
              prices={materialPrices}
              loading={materialPricesLoading}
              limit={5}
            />
          </PermissionGuard>
        </div>

        {/* Right Column (1/3 width) */}
        <div className="space-y-6">

          {/* Overdue Tasks Widget */}
          <PermissionGuard permission="canViewAllTasks" hide>
            {overdueTasksList.length > 0 && (
              <div className="bg-white rounded-3xl border border-red-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-red-100 bg-red-50/50 flex items-center justify-between">
                  <h3 className="font-bold text-red-900 text-sm uppercase tracking-wider flex items-center gap-2">
                    <ExclamationCircleIcon className="h-4 w-4" />
                    Urgent Attention
                  </h3>
                </div>
                <div className="divide-y divide-red-50">
                  {overdueTasksList.map(task => (
                    <Link key={task.id} href={`/dashboard/projects/${task.projectId}/tasks`} className="block p-4 hover:bg-red-50/30 transition-colors">
                      <p className="text-sm font-medium text-gray-900 line-clamp-2 sm:truncate">{task.title}</p>
                      <p className="text-xs text-red-600 mt-1 font-medium">Due {task.dueDate ? format(new Date(task.dueDate), 'MMM d') : 'Overdue'}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </PermissionGuard>

          {/* Quick Actions Card */}
          <PermissionGuard anyOf={['canManageInvoices', 'canInviteUsers', 'canCreateProjects']} hide>
            <div className="bg-gradient-to-br from-brand-900 to-brand-800 rounded-3xl p-6 text-white shadow-xl shadow-brand-900/10">
              <h3 className="font-bold text-lg mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <PermissionGuard permission="canCreateProjects" hide>
                  <Link href="/dashboard/projects/new" className="flex items-center gap-3 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all border border-white/5 group">
                    <div className="p-2 bg-brand-500 rounded-lg group-hover:scale-110 transition-transform">
                      <PlusIcon className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-medium">New Project</span>
                  </Link>
                </PermissionGuard>
                <PermissionGuard permission="canManageInvoices" hide>
                  <Link href="/dashboard/estimates/new" className="flex items-center gap-3 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all border border-white/5 group">
                    <div className="p-2 bg-purple-500 rounded-lg group-hover:scale-110 transition-transform">
                      <DocumentTextIcon className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-medium">New Estimate</span>
                  </Link>
                </PermissionGuard>
              </div>
            </div>
          </PermissionGuard>

          {/* Recent Activity */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider">Recent Activity</h3>
            </div>
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
              {activities.length > 0 ? activities.slice(0, 10).map((activity) => (
                <div key={activity.id} className="p-4 flex gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
                  <div className="h-2 w-2 mt-2 rounded-full bg-blue-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-700 leading-snug">{activity.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{activity.timeAgo}</p>
                  </div>
                </div>
              )) : (
                <div className="p-8 text-center text-gray-400 text-sm">No recent activity</div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Mobile Actions FAB (kept for mobile users) */}
      <PermissionGuard anyOf={['canManageInvoices', 'canInviteUsers', 'canCreateProjects']} hide>
        {!showMobileQuickActions && (
          <button
            onClick={openMobileQuickActions}
            className="md:hidden fixed right-4 bottom-20 w-14 h-14 rounded-full bg-brand-primary text-white shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center transition-all z-30"
          >
            <PlusIcon className="h-6 w-6" />
          </button>
        )}
        {showMobileQuickActions && (
          <div className="md:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeMobileQuickActions} />
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 pb-8 animate-slide-up">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-xl text-gray-900">Quick Actions</h3>
                <button onClick={closeMobileQuickActions} className="p-2 bg-gray-100 rounded-full"><XMarkIcon className="h-6 w-6 text-gray-600" /></button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Link href="/dashboard/projects/new" className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-2xl gap-2">
                  <FolderIcon className="h-8 w-8 text-blue-600" />
                  <span className="font-medium text-blue-900">New Project</span>
                </Link>
                <Link href="/dashboard/estimates/new" className="flex flex-col items-center justify-center p-4 bg-purple-50 rounded-2xl gap-2">
                  <DocumentTextIcon className="h-8 w-8 text-purple-600" />
                  <span className="font-medium text-purple-900">New Estimate</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </PermissionGuard>
    </div>
  );
}
