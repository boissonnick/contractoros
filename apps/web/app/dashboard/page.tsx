"use client";

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useImpersonation } from '@/lib/contexts/ImpersonationContext';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { Project, Task, Invoice, Estimate, RFI, PunchItem } from '@/types';
import { Card, Badge, Button, EmptyState } from '@/components/ui';
import { FirestoreError } from '@/components/ui';
import { SkeletonList } from '@/components/ui/Skeleton';
import { MobileStats } from '@/components/ui/MobileStats';
import { MobileProjectList } from '@/components/projects/MobileProjectCard';
import { MobileFAB } from '@/components/ui/MobileNav';
import { cn, formatCurrency } from '@/lib/utils';
import { useActivityLog } from '@/lib/hooks/useActivityLog';
import { useMaterialPrices } from '@/lib/hooks/useIntelligence';
import {
  calculateBudgetPercentage,
  getBudgetStatus,
  getBudgetBarColor,
  BUDGET_HELP_TEXT,
} from '@/lib/budget-utils';
import {
  FolderIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  BanknotesIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  PlusIcon,
  ChartBarIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  MapPinIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  ExclamationCircleIcon,
  ClipboardDocumentCheckIcon,
  ArrowRightIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { MaterialPriceWidget } from '@/components/intelligence';
import { format, differenceInDays, isAfter, isBefore, addDays } from 'date-fns';

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

// Color classes defined outside component to avoid recreation on each render
const ICON_COLOR_CLASSES = {
  blue: 'text-blue-600',
  green: 'text-green-600',
  yellow: 'text-amber-500',
  red: 'text-red-500',
  purple: 'text-purple-600',
  orange: 'text-orange-500',
  gray: 'text-gray-500',
} as const;

const BG_COLOR_CLASSES = {
  blue: 'bg-blue-50',
  green: 'bg-green-50',
  yellow: 'bg-amber-50',
  red: 'bg-red-50',
  purple: 'bg-purple-50',
  orange: 'bg-orange-50',
  gray: 'bg-gray-100',
} as const;

function StatCard({ title, value, icon: Icon, trend, trendUp, href, color, subtitle }: StatCardProps) {
  const content = (
    <div className={cn(
      'bg-white rounded-xl border border-gray-200 p-4 h-full min-h-[130px] flex flex-col',
      href && 'hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group'
    )}>
      <div className="flex items-start justify-between gap-2 mb-auto">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 tabular-nums">{value}</p>
        </div>
        <div className={cn('p-2.5 rounded-lg flex-shrink-0', BG_COLOR_CLASSES[color])}>
          <Icon className={cn('h-5 w-5', ICON_COLOR_CLASSES[color])} />
        </div>
      </div>
      {(subtitle || trend) && (
        <div className="mt-3 pt-2 border-t border-gray-100">
          {subtitle && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
          {trend && (
            <p className={`text-xs font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
              {trendUp ? '↑' : '↓'} {trend}
            </p>
          )}
        </div>
      )}
    </div>
  );

  return href ? <Link href={href} className="h-full block">{content}</Link> : content;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  lead: { label: 'Lead', color: 'bg-gray-100 text-gray-700' },
  bidding: { label: 'Bidding', color: 'bg-yellow-100 text-yellow-700' },
  planning: { label: 'Planning', color: 'bg-blue-100 text-blue-700' },
  active: { label: 'Active', color: 'bg-green-100 text-green-700' },
  on_hold: { label: 'On Hold', color: 'bg-orange-100 text-orange-700' },
  completed: { label: 'Completed', color: 'bg-purple-100 text-purple-700' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
};

export default function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const { currentRole, permissions } = useImpersonation();
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
  const [rfis, setRfis] = useState<RFI[]>([]);
  const [punchItems, setPunchItems] = useState<PunchItem[]>([]);
  const [teamCount, setTeamCount] = useState(0);

  // Mobile quick actions menu state
  const [showMobileQuickActions, setShowMobileQuickActions] = useState(false);

  // Memoized callbacks for mobile quick actions menu
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
      let projectsData: Project[] = [];

      if (isClientRole) {
        // BUG #1 FIX: Clients only see projects where they are the client
        const clientProjectsQuery = query(
          collection(db, 'projects'),
          where('orgId', '==', profile.orgId),
          where('clientId', '==', user?.uid),
          orderBy('createdAt', 'desc')
        );
        const projectsSnap = await getDocs(clientProjectsQuery);
        projectsData = projectsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
          startDate: doc.data().startDate?.toDate?.(),
          estimatedEndDate: doc.data().estimatedEndDate?.toDate?.(),
        })) as Project[];
      } else {
        // Staff can see all org projects
        const projectsQuery = query(
          collection(db, 'projects'),
          where('orgId', '==', profile.orgId),
          orderBy('createdAt', 'desc')
        );
        const projectsSnap = await getDocs(projectsQuery);
        projectsData = projectsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
          startDate: doc.data().startDate?.toDate?.(),
          estimatedEndDate: doc.data().estimatedEndDate?.toDate?.(),
        })) as Project[];
      }
      setProjects(projectsData.filter(p => !p.isArchived));

      // BUG #2 FIX: Clients should not see tasks, invoices, estimates, or team data
      if (!isClientRole) {
        // Fetch recent tasks
        const tasksQuery = query(
          collection(db, 'tasks'),
          where('orgId', '==', profile.orgId),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        const tasksSnap = await getDocs(tasksQuery);
        setTasks(tasksSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
          dueDate: doc.data().dueDate?.toDate?.(),
        })) as Task[]);

        // Fetch invoices
        const invoicesQuery = query(
          collection(db, 'invoices'),
          where('orgId', '==', profile.orgId),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        const invoicesSnap = await getDocs(invoicesQuery);
        setInvoices(invoicesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
          dueDate: doc.data().dueDate?.toDate?.(),
        })) as Invoice[]);

        // Fetch estimates
        const estimatesQuery = query(
          collection(db, 'estimates'),
          where('orgId', '==', profile.orgId),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        const estimatesSnap = await getDocs(estimatesQuery);
        setEstimates(estimatesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        })) as Estimate[]);

        // Fetch team members count
        const usersQuery = query(
          collection(db, 'users'),
          where('orgId', '==', profile.orgId),
          where('isActive', '==', true)
        );
        const usersSnap = await getDocs(usersQuery);
        setTeamCount(usersSnap.size);
      } else {
        // Clear sensitive data for clients
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

  // Get active projects for display (limit to 4 to keep Material Prices visible)
  const activeProjectsList = useMemo(() => {
    return projects
      .filter(p => p.status === 'active')
      .slice(0, 4);
  }, [projects]);

  // Get overdue tasks
  const overdueTasksList = useMemo(() => {
    return tasks
      .filter(t => t.status !== 'completed' && t.dueDate && new Date(t.dueDate) < new Date())
      .slice(0, 5);
  }, [tasks]);

  // Get pending estimates
  const pendingEstimatesList = useMemo(() => {
    return estimates
      .filter(e => ['sent', 'viewed'].includes(e.status))
      .slice(0, 5);
  }, [estimates]);

  // Memoized mobile stats to prevent recreation on every render
  type StatColor = 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'gray';
  const mobileStatsData = useMemo(() => {
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

    if (permissions.canViewAllFinances) {
      mobileStats.push({
        label: 'Outstanding',
        value: formatCurrency(stats.outstandingAmount),
        subtitle: `${stats.overdueInvoicesCount} overdue`,
        icon: BanknotesIcon,
        color: stats.overdueAmount > 0 ? 'red' : 'green',
        href: '/dashboard/invoices',
      });
    }

    if (permissions.canViewAllTasks) {
      mobileStats.push({
        label: 'Overdue Tasks',
        value: stats.overdueTasks,
        subtitle: `${stats.dueSoonTasks} due soon`,
        icon: ExclamationTriangleIcon,
        color: stats.overdueTasks > 0 ? 'orange' : 'green',
      });
    }

    if (permissions.canManageInvoices) {
      mobileStats.push({
        label: 'Estimates',
        value: stats.pendingEstimates,
        subtitle: formatCurrency(stats.pipelineValue),
        icon: DocumentTextIcon,
        color: 'purple',
        href: '/dashboard/estimates',
      });
    }

    if (permissions.canViewAllFinances) {
      mobileStats.push({
        label: 'Budget Used',
        value: `${stats.budgetUtilization}%`,
        subtitle: formatCurrency(stats.totalSpent),
        icon: ChartBarIcon,
        color: stats.budgetUtilization > 90 ? 'red' : stats.budgetUtilization > 75 ? 'yellow' : 'green',
      });
    }

    if (permissions.canViewTeam) {
      mobileStats.push({
        label: 'Team',
        value: stats.teamCount,
        subtitle: 'active members',
        icon: UserGroupIcon,
        color: 'gray',
        href: '/dashboard/team',
      });
    }

    return mobileStats;
  }, [stats, permissions]);

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <SkeletonList count={3} />
      </div>
    );
  }

  // Show onboarding prompt if profile is incomplete
  if (profileIncomplete) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="p-8 text-center max-w-md">
          <ExclamationTriangleIcon className="h-12 w-12 mx-auto text-amber-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Complete Your Profile</h3>
          <p className="text-gray-500 mb-4">
            {!profile
              ? "Your profile hasn't been set up yet. Please complete the onboarding process."
              : "Your organization hasn't been configured. Please complete company setup."}
          </p>
          <Link href="/onboarding/company-setup">
            <Button variant="primary">Complete Setup</Button>
          </Link>
        </Card>
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
    <div className="space-y-6 pb-40 md:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {profile?.displayName?.split(' ')[0] || 'there'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isClientRole
              ? "Here's the status of your projects."
              : "Here's what's happening across your projects."}
          </p>
        </div>
        {/* BUG #5 & #6 FIX: Hide admin action buttons for users without permission */}
        <PermissionGuard permission="canCreateProjects" hide>
          <div className="flex items-center gap-2">
            <PermissionGuard permission="canManageInvoices" hide>
              <Link href="/dashboard/estimates/new">
                <Button variant="outline">
                  <DocumentTextIcon className="h-4 w-4 mr-2" />
                  New Estimate
                </Button>
              </Link>
            </PermissionGuard>
            <Link href="/dashboard/projects/new">
              <Button variant="primary">
                <PlusIcon className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </Link>
          </div>
        </PermissionGuard>
      </div>

      {/* Key Metrics - BUG #2 FIX: Hide sensitive stats for clients */}
      {isClientRole ? (
        // Simplified stats for client view - Mobile optimized
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
            {
              label: 'Progress',
              value: `${stats.totalProjects > 0 ? Math.round((stats.completedProjects / stats.totalProjects) * 100) : 0}%`,
              subtitle: 'overall completion',
              icon: CheckCircleIcon,
              color: 'green',
            },
          ]}
          columns={2}
          scrollable={true}
        />
      ) : (
        // Full stats for staff - Mobile optimized with horizontal scroll
        <>
          {/* Mobile: Horizontal scrollable stats */}
          <div className="md:hidden">
            <MobileStats
              stats={mobileStatsData}
              columns={6}
              scrollable={true}
            />
          </div>

          {/* Desktop: Grid layout with PermissionGuards */}
          <div className="hidden md:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 items-stretch">
            <StatCard
              title="Active Projects"
              value={stats.activeProjects}
              subtitle={`${stats.pipelineProjects} in pipeline`}
              icon={FolderIcon}
              color="blue"
              href="/dashboard/projects"
            />
            <PermissionGuard permission="canViewAllFinances" hide>
              <StatCard
                title="Outstanding"
                value={formatCurrency(stats.outstandingAmount)}
                subtitle={`${stats.overdueInvoicesCount} overdue`}
                icon={BanknotesIcon}
                color={stats.overdueAmount > 0 ? 'red' : 'green'}
                href="/dashboard/invoices"
              />
            </PermissionGuard>
            <PermissionGuard permission="canViewAllTasks" hide>
              <StatCard
                title="Overdue Tasks"
                value={stats.overdueTasks}
                subtitle={`${stats.dueSoonTasks} due soon`}
                icon={ExclamationTriangleIcon}
                color={stats.overdueTasks > 0 ? 'orange' : 'green'}
              />
            </PermissionGuard>
            <PermissionGuard permission="canManageInvoices" hide>
              <StatCard
                title="Pending Estimates"
                value={stats.pendingEstimates}
                subtitle={formatCurrency(stats.pipelineValue)}
                icon={DocumentTextIcon}
                color="purple"
                href="/dashboard/estimates"
              />
            </PermissionGuard>
            <PermissionGuard permission="canViewAllFinances" hide>
              <StatCard
                title="Budget Used"
                value={`${stats.budgetUtilization}%`}
                subtitle={formatCurrency(stats.totalSpent)}
                icon={ChartBarIcon}
                color={stats.budgetUtilization > 90 ? 'red' : stats.budgetUtilization > 75 ? 'yellow' : 'green'}
              />
            </PermissionGuard>
            <PermissionGuard permission="canViewTeam" hide>
              <StatCard
                title="Team"
                value={stats.teamCount}
                subtitle="active members"
                icon={UserGroupIcon}
                color="gray"
                href="/dashboard/team"
              />
            </PermissionGuard>
          </div>
        </>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Projects */}
        <div className="lg:col-span-2">
          {/* Mobile: MobileProjectList with touch-optimized cards */}
          <div className="md:hidden">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Active Projects</h2>
              <Link href="/dashboard/projects?status=active" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                View all <ArrowRightIcon className="h-3 w-3" />
              </Link>
            </div>
            {activeProjectsList.length > 0 ? (
              <MobileProjectList
                projects={activeProjectsList}
                basePath="/dashboard/projects"
                showBudget={permissions.canViewAllFinances}
                showClient={true}
              />
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <FolderIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 mb-3">No active projects</p>
                <Link href="/dashboard/projects/new">
                  <Button variant="primary" size="sm">Create Project</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Desktop: Original card layout */}
          <Card className="hidden md:block p-0">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Active Projects</h2>
              <Link href="/dashboard/projects?status=active" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                View all <ArrowRightIcon className="h-3 w-3" />
              </Link>
            </div>
            {activeProjectsList.length > 0 ? (
              <div className="divide-y divide-gray-100 max-h-[280px] overflow-y-auto">
                {activeProjectsList.map((project) => {
                  const percentUsed = project.budget && project.currentSpend !== undefined
                    ? calculateBudgetPercentage(project.currentSpend, project.budget)
                    : 0;
                  const budgetStatus = getBudgetStatus(percentUsed);
                  const barColor = getBudgetBarColor(budgetStatus);

                  return (
                    <Link
                      key={project.id}
                      href={`/dashboard/projects/${project.id}`}
                      className="block p-4 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                              {project.name}
                            </h3>
                          </div>
                          <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                            {project.clientName && (
                              <span className="flex items-center gap-1">
                                <UserGroupIcon className="h-3.5 w-3.5 text-gray-400" />
                                {project.clientName}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <MapPinIcon className="h-3.5 w-3.5 text-gray-400" />
                              {project.address?.city || 'No location'}
                            </span>
                            {project.currentPhase && (
                              <span className="flex items-center gap-1">
                                <ClipboardDocumentCheckIcon className="h-3.5 w-3.5 text-gray-400" />
                                {project.currentPhase}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          {project.budget ? (
                            <>
                              <p className="text-sm font-semibold text-gray-900">{formatCurrency(project.budget)}</p>
                              {project.currentSpend !== undefined && (
                                <div className="mt-1">
                                  <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                      className={cn('h-full rounded-full', barColor)}
                                      style={{ width: `${Math.min(percentUsed, 100)}%` }}
                                    />
                                  </div>
                                  <p className="text-xs text-gray-400 mt-0.5">
                                    {Math.round(percentUsed)}% spent
                                  </p>
                                </div>
                              )}
                            </>
                          ) : (
                            <Badge className={statusConfig[project.status].color}>
                              {statusConfig[project.status].label}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={<FolderIcon className="h-full w-full" />}
                title="No active projects"
                description="Start your first project to see it here."
                action={{ label: 'Create Project', href: '/dashboard/projects/new' }}
                className="py-8"
              />
            )}
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Overdue Tasks - Hidden for clients */}
          <PermissionGuard permission="canViewAllTasks" hide>
            {overdueTasksList.length > 0 && (
              <Card className="p-0">
                <div className="flex items-center gap-2 p-4 border-b border-gray-100 bg-red-50">
                  <ExclamationCircleIcon className="h-5 w-5 text-red-600" />
                  <h2 className="font-semibold text-red-800">Overdue Tasks ({stats.overdueTasks})</h2>
                </div>
                <div className="divide-y divide-gray-100 max-h-[250px] overflow-y-auto">
                  {overdueTasksList.map((task) => (
                    <Link
                      key={task.id}
                      href={`/dashboard/projects/${task.projectId}/tasks`}
                      className="block p-3 hover:bg-gray-50 transition-colors"
                    >
                      <p className="font-medium text-gray-900 truncate text-sm">{task.title}</p>
                      <p className="text-xs text-red-600 mt-1">
                        {task.dueDate && differenceInDays(new Date(), new Date(task.dueDate))} days overdue
                      </p>
                    </Link>
                  ))}
                </div>
              </Card>
            )}
          </PermissionGuard>

          {/* Pending Estimates - Hidden for clients */}
          <PermissionGuard permission="canManageInvoices" hide>
            <Card className="p-0">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Pending Estimates</h2>
                <Link href="/dashboard/estimates" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  View all <ArrowRightIcon className="h-3 w-3" />
                </Link>
              </div>
              {pendingEstimatesList.length > 0 ? (
                <div className="divide-y divide-gray-100 max-h-[250px] overflow-y-auto">
                  {pendingEstimatesList.map((estimate) => (
                    <Link
                      key={estimate.id}
                      href={`/dashboard/estimates/${estimate.id}`}
                      className="block p-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 truncate text-sm">{estimate.name}</p>
                          <p className="text-xs text-gray-500">{estimate.clientName}</p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 ml-2">
                          {formatCurrency(estimate.total)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<DocumentTextIcon className="h-full w-full" />}
                  title="No pending estimates"
                  description="Create an estimate to start winning new work."
                  action={{ label: 'New Estimate', href: '/dashboard/estimates/new' }}
                  className="py-6"
                  size="sm"
                />
              )}
            </Card>
          </PermissionGuard>

          {/* Quick Actions - BUG #5 & #6 FIX: Hide for users without permissions */}
          <PermissionGuard anyOf={['canManageInvoices', 'canInviteUsers', 'canCreateProjects']} hide>
            <Card className="p-4">
              <h2 className="font-semibold text-gray-900 mb-3">Quick Actions</h2>
              <div className="space-y-2">
                <PermissionGuard permission="canManageInvoices" hide>
                  <Link
                    href="/dashboard/invoices/new"
                    className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors"
                  >
                    <div className="p-1.5 bg-purple-100 rounded-lg">
                      <BanknotesIcon className="h-4 w-4 text-purple-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">Create Invoice</span>
                  </Link>
                </PermissionGuard>
                <PermissionGuard permission="canInviteUsers" hide>
                  <Link
                    href="/dashboard/team/invite"
                    className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors"
                  >
                    <div className="p-1.5 bg-green-100 rounded-lg">
                      <UserGroupIcon className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">Invite Team Member</span>
                  </Link>
                </PermissionGuard>
                <PermissionGuard permission="canManageInvoices" hide>
                  <Link
                    href="/dashboard/estimates/new"
                    className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <div className="p-1.5 bg-blue-100 rounded-lg">
                      <DocumentTextIcon className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">New Estimate</span>
                  </Link>
                </PermissionGuard>
              </div>
            </Card>
          </PermissionGuard>

          {/* Material Prices Widget - AI Intelligence */}
          <PermissionGuard permission="canManageInvoices" hide>
            <MaterialPriceWidget
              prices={materialPrices}
              loading={materialPricesLoading}
              limit={5}
            />
          </PermissionGuard>
        </div>
      </div>

      {/* Recent Activity */}
      <Card className="p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Recent Activity</h2>
          <Link href="/dashboard/activity" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
            View all <ArrowRightIcon className="h-3 w-3" />
          </Link>
        </div>
        {activities.length > 0 ? (
          <div className="divide-y divide-gray-50 max-h-[350px] overflow-y-auto">
            {activities.slice(0, 15).map((activity) => (
              <div key={activity.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium text-xs flex-shrink-0">
                  {activity.userName?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 truncate">{activity.message}</p>
                  <p className="text-xs text-gray-400">{activity.userName} · {activity.timeAgo}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<ClockIcon className="h-full w-full" />}
            title="No activity yet"
            description="Activity will appear as you work on projects"
            className="py-6"
            size="sm"
          />
        )}
      </Card>

      {/* Setup Guide for new users - only for admins */}
      <PermissionGuard permission="canCreateProjects" hide>
        {stats.totalProjects === 0 && (
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
            <h3 className="text-lg font-semibold mb-2">Get Started with ContractorOS</h3>
            <p className="text-blue-100 mb-4">
              Welcome! Let's set up your first project and get your team onboarded.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard/projects/new"
                className="inline-flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
              >
                Create Your First Project
              </Link>
              <PermissionGuard permission="canViewSettings" hide>
                <Link
                  href="/dashboard/settings"
                  className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-400 transition-colors"
                >
                  Configure Settings
                </Link>
              </PermissionGuard>
            </div>
          </div>
        )}
      </PermissionGuard>

      {/* Mobile Quick Actions FAB & Menu */}
      <PermissionGuard anyOf={['canManageInvoices', 'canInviteUsers', 'canCreateProjects']} hide>
        {/* FAB Button */}
        {!showMobileQuickActions && (
          <button
            onClick={openMobileQuickActions}
            className="md:hidden fixed right-4 bottom-20 w-14 h-14 rounded-full bg-brand-primary text-white shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center transition-all z-30"
            aria-label="Quick Actions"
          >
            <PlusIcon className="h-6 w-6" />
          </button>
        )}

        {/* Quick Actions Menu Overlay */}
        {showMobileQuickActions && (
          <div className="md:hidden fixed inset-0 z-50">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50"
              onClick={closeMobileQuickActions}
            />

            {/* Menu */}
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 pb-8 animate-bottom-sheet">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                <button
                  onClick={closeMobileQuickActions}
                  className="p-2 -mr-2 text-gray-500 hover:text-gray-700"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <PermissionGuard permission="canCreateProjects" hide>
                  <Link
                    href="/dashboard/projects/new"
                    onClick={closeMobileQuickActions}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors"
                  >
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <FolderIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <span className="text-xs font-medium text-gray-900 text-center">New Project</span>
                  </Link>
                </PermissionGuard>

                <PermissionGuard permission="canManageInvoices" hide>
                  <Link
                    href="/dashboard/invoices/new"
                    onClick={closeMobileQuickActions}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors"
                  >
                    <div className="p-3 bg-purple-100 rounded-xl">
                      <BanknotesIcon className="h-6 w-6 text-purple-600" />
                    </div>
                    <span className="text-xs font-medium text-gray-900 text-center">New Invoice</span>
                  </Link>
                </PermissionGuard>

                <PermissionGuard permission="canManageInvoices" hide>
                  <Link
                    href="/dashboard/estimates/new"
                    onClick={closeMobileQuickActions}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-green-50 hover:bg-green-100 transition-colors"
                  >
                    <div className="p-3 bg-green-100 rounded-xl">
                      <DocumentTextIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <span className="text-xs font-medium text-gray-900 text-center">New Estimate</span>
                  </Link>
                </PermissionGuard>

                <PermissionGuard permission="canInviteUsers" hide>
                  <Link
                    href="/dashboard/team/invite"
                    onClick={closeMobileQuickActions}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-orange-50 hover:bg-orange-100 transition-colors"
                  >
                    <div className="p-3 bg-orange-100 rounded-xl">
                      <UserGroupIcon className="h-6 w-6 text-orange-600" />
                    </div>
                    <span className="text-xs font-medium text-gray-900 text-center">Invite Team</span>
                  </Link>
                </PermissionGuard>

                <PermissionGuard permission="canViewAllTasks" hide>
                  <Link
                    href="/dashboard/tasks"
                    onClick={closeMobileQuickActions}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-amber-50 hover:bg-amber-100 transition-colors"
                  >
                    <div className="p-3 bg-amber-100 rounded-xl">
                      <ClipboardDocumentCheckIcon className="h-6 w-6 text-amber-600" />
                    </div>
                    <span className="text-xs font-medium text-gray-900 text-center">View Tasks</span>
                  </Link>
                </PermissionGuard>

                <Link
                  href="/dashboard/activity"
                  onClick={closeMobileQuickActions}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="p-3 bg-gray-100 rounded-xl">
                    <ClockIcon className="h-6 w-6 text-gray-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-900 text-center">Activity</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </PermissionGuard>
    </div>
  );
}
