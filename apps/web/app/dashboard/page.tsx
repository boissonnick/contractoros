"use client";

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { Project, Task, Invoice, Estimate, RFI, PunchItem } from '@/types';
import { Card, Badge, Button, EmptyState } from '@/components/ui';
import { FirestoreError } from '@/components/ui';
import { SkeletonList } from '@/components/ui/Skeleton';
import { cn, formatCurrency } from '@/lib/utils';
import { useActivityLog } from '@/lib/hooks/useActivityLog';
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
} from '@heroicons/react/24/outline';
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

function StatCard({ title, value, icon: Icon, trend, trendUp, href, color, subtitle }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    gray: 'bg-gray-50 text-gray-600 border-gray-200',
  };

  const content = (
    <div className={cn(
      'bg-white rounded-xl border p-5 h-full flex flex-col justify-between',
      href && 'hover:shadow-md transition-shadow cursor-pointer'
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">{subtitle}</p>
          )}
          {trend && (
            <p className={`mt-1 text-sm ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
              {trendUp ? '↑' : '↓'} {trend}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl flex-shrink-0 ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );

  return href ? <Link href={href} className="h-full">{content}</Link> : content;
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
  const { activities } = useActivityLog(profile?.orgId);

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

  const fetchDashboardData = React.useCallback(async () => {
    if (!profile?.orgId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setFetchError(null);

    try {
      // Fetch projects
      const projectsQuery = query(
        collection(db, 'projects'),
        where('orgId', '==', profile.orgId),
        orderBy('createdAt', 'desc')
      );
      const projectsSnap = await getDocs(projectsQuery);
      const projectsData = projectsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        startDate: doc.data().startDate?.toDate?.(),
        estimatedEndDate: doc.data().estimatedEndDate?.toDate?.(),
      })) as Project[];
      setProjects(projectsData.filter(p => !p.isArchived));

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
  }, [profile?.orgId]);

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

  // Get active projects for display
  const activeProjectsList = useMemo(() => {
    return projects
      .filter(p => p.status === 'active')
      .slice(0, 5);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {profile?.displayName?.split(' ')[0] || 'there'}
          </h1>
          <p className="text-gray-500 mt-1">Here's what's happening across your projects.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/estimates/new">
            <Button variant="outline">
              <DocumentTextIcon className="h-4 w-4 mr-2" />
              New Estimate
            </Button>
          </Link>
          <Link href="/dashboard/projects/new">
            <Button variant="primary">
              <PlusIcon className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 items-stretch">
        <StatCard
          title="Active Projects"
          value={stats.activeProjects}
          subtitle={`${stats.pipelineProjects} in pipeline`}
          icon={FolderIcon}
          color="blue"
          href="/dashboard/projects"
        />
        <StatCard
          title="Outstanding"
          value={formatCurrency(stats.outstandingAmount)}
          subtitle={`${stats.overdueInvoicesCount} overdue`}
          icon={BanknotesIcon}
          color={stats.overdueAmount > 0 ? 'red' : 'green'}
          href="/dashboard/invoices"
        />
        <StatCard
          title="Overdue Tasks"
          value={stats.overdueTasks}
          subtitle={`${stats.dueSoonTasks} due soon`}
          icon={ExclamationTriangleIcon}
          color={stats.overdueTasks > 0 ? 'orange' : 'green'}
        />
        <StatCard
          title="Pending Estimates"
          value={stats.pendingEstimates}
          subtitle={formatCurrency(stats.pipelineValue)}
          icon={DocumentTextIcon}
          color="purple"
          href="/dashboard/estimates"
        />
        <StatCard
          title="Budget Used"
          value={`${stats.budgetUtilization}%`}
          subtitle={formatCurrency(stats.totalSpent)}
          icon={ChartBarIcon}
          color={stats.budgetUtilization > 90 ? 'red' : stats.budgetUtilization > 75 ? 'yellow' : 'green'}
        />
        <StatCard
          title="Team"
          value={stats.teamCount}
          subtitle="active members"
          icon={UserGroupIcon}
          color="gray"
          href="/dashboard/team"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Projects */}
        <div className="lg:col-span-2">
          <Card className="p-0">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Active Projects</h2>
              <Link href="/dashboard/projects?status=active" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                View all <ArrowRightIcon className="h-3 w-3" />
              </Link>
            </div>
            {activeProjectsList.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {activeProjectsList.map((project) => (
                  <Link
                    key={project.id}
                    href={`/dashboard/projects/${project.id}`}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900 truncate">{project.name}</h3>
                        <Badge className={statusConfig[project.status].color}>
                          {statusConfig[project.status].label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPinIcon className="h-3.5 w-3.5" />
                          {project.address.city}
                        </span>
                        {project.budget && (
                          <span className="flex items-center gap-1">
                            <CurrencyDollarIcon className="h-3.5 w-3.5" />
                            {formatCurrency(project.budget)}
                          </span>
                        )}
                      </div>
                    </div>
                    {project.budget && project.currentSpend !== undefined && (
                      <div className="text-right ml-4">
                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              (project.currentSpend / project.budget) > 0.9 ? 'bg-red-500' :
                                (project.currentSpend / project.budget) > 0.75 ? 'bg-yellow-500' : 'bg-green-500'
                            )}
                            style={{ width: `${Math.min((project.currentSpend / project.budget) * 100, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {Math.round((project.currentSpend / project.budget) * 100)}% used
                        </p>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <FolderIcon className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                <p>No active projects</p>
                <Link href="/dashboard/projects/new" className="text-sm text-blue-600 hover:underline">
                  Create your first project
                </Link>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Overdue Tasks */}
          {overdueTasksList.length > 0 && (
            <Card className="p-0">
              <div className="flex items-center gap-2 p-4 border-b border-gray-100 bg-red-50">
                <ExclamationCircleIcon className="h-5 w-5 text-red-600" />
                <h2 className="font-semibold text-red-800">Overdue Tasks ({stats.overdueTasks})</h2>
              </div>
              <div className="divide-y divide-gray-100">
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

          {/* Pending Estimates */}
          <Card className="p-0">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Pending Estimates</h2>
              <Link href="/dashboard/estimates" className="text-sm text-blue-600 hover:text-blue-700">
                View all
              </Link>
            </div>
            {pendingEstimatesList.length > 0 ? (
              <div className="divide-y divide-gray-100">
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
              <div className="p-6 text-center text-gray-500">
                <p className="text-sm">No pending estimates</p>
              </div>
            )}
          </Card>

          {/* Quick Actions */}
          <Card className="p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Quick Actions</h2>
            <div className="space-y-2">
              <Link
                href="/dashboard/invoices/new"
                className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors"
              >
                <div className="p-1.5 bg-purple-100 rounded-lg">
                  <BanknotesIcon className="h-4 w-4 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-gray-900">Create Invoice</span>
              </Link>
              <Link
                href="/dashboard/team/invite"
                className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors"
              >
                <div className="p-1.5 bg-green-100 rounded-lg">
                  <UserGroupIcon className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-900">Invite Team Member</span>
              </Link>
              <Link
                href="/dashboard/estimates/new"
                className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <DocumentTextIcon className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-900">New Estimate</span>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <Card className="p-0">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          <Link href="/dashboard/activity" className="text-sm text-blue-600 hover:text-blue-700">
            View all
          </Link>
        </div>
        {activities.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {activities.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-start gap-4 p-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm flex-shrink-0">
                  {activity.userName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.userName} · {activity.timeAgo}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No recent activity</p>
            <p className="text-sm mt-1">Activity will appear here as your team works</p>
          </div>
        )}
      </Card>

      {/* Setup Guide for new users */}
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
            <Link
              href="/dashboard/settings"
              className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-400 transition-colors"
            >
              Configure Settings
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
