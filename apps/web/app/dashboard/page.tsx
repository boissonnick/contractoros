"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import {
  FolderIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  BanknotesIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
  trendUp?: boolean;
  href?: string;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

function StatCard({ title, value, icon: Icon, trend, trendUp, href, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
  };

  const content = (
    <div className={`bg-white rounded-xl border ${href ? 'hover:shadow-md transition-shadow cursor-pointer' : ''} p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className={`mt-1 text-sm ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
              {trendUp ? '↑' : '↓'} {trend}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

interface ActivityItem {
  id: string;
  type: string;
  message: string;
  time: string;
  user: string;
}

export default function DashboardPage() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    activeProjects: 0,
    todayHours: 0,
    openIssues: 0,
    pendingInvoices: 0,
    teamMembers: 0,
  });
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!profile?.orgId) {
        setLoading(false);
        return;
      }

      try {
        // Fetch active projects count
        const projectsQuery = query(
          collection(db, 'projects'),
          where('orgId', '==', profile.orgId),
          where('status', '==', 'active')
        );
        const projectsSnap = await getDocs(projectsQuery);

        // Fetch team members count
        const usersQuery = query(
          collection(db, 'users'),
          where('orgId', '==', profile.orgId),
          where('isActive', '==', true)
        );
        const usersSnap = await getDocs(usersQuery);

        // Fetch open issues count
        const issuesQuery = query(
          collection(db, 'issues'),
          where('orgId', '==', profile.orgId),
          where('status', '==', 'open')
        );
        const issuesSnap = await getDocs(issuesQuery);

        setStats({
          activeProjects: projectsSnap.size,
          todayHours: 0, // Would calculate from time entries
          openIssues: issuesSnap.size,
          pendingInvoices: 0, // Would calculate from invoices
          teamMembers: usersSnap.size,
        });

        // For demo, show placeholder activity
        setRecentActivity([
          { id: '1', type: 'project', message: 'New project created: Kitchen Renovation', time: '2 hours ago', user: 'You' },
          { id: '2', type: 'time', message: 'John clocked in at Downtown Loft', time: '3 hours ago', user: 'John Smith' },
          { id: '3', type: 'issue', message: 'Issue reported: Material delay', time: '5 hours ago', user: 'Mike Johnson' },
        ]);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [profile?.orgId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {profile?.displayName?.split(' ')[0] || 'there'}
          </h1>
          <p className="text-gray-500 mt-1">Here's what's happening with your projects today.</p>
        </div>
        <Link
          href="/dashboard/projects/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Project
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Active Projects"
          value={stats.activeProjects}
          icon={FolderIcon}
          color="blue"
          href="/dashboard/projects"
        />
        <StatCard
          title="Today's Hours"
          value={`${stats.todayHours}h`}
          icon={ClockIcon}
          color="green"
          href="/dashboard/schedule"
        />
        <StatCard
          title="Open Issues"
          value={stats.openIssues}
          icon={ExclamationTriangleIcon}
          color={stats.openIssues > 0 ? 'red' : 'green'}
        />
        <StatCard
          title="Pending Invoices"
          value={`$${stats.pendingInvoices.toLocaleString()}`}
          icon={BanknotesIcon}
          color="purple"
          href="/dashboard/finances"
        />
        <StatCard
          title="Team Members"
          value={stats.teamMembers}
          icon={UserGroupIcon}
          color="blue"
          href="/dashboard/team"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <Link href="/dashboard/activity" className="text-sm text-blue-600 hover:text-blue-700">
              View all
            </Link>
          </div>
          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm">
                    {activity.user.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.user} · {activity.time}</p>
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
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              href="/dashboard/projects/new"
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="p-2 bg-blue-100 rounded-lg">
                <FolderIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Create Project</p>
                <p className="text-sm text-gray-500">Start a new job</p>
              </div>
            </Link>
            <Link
              href="/dashboard/team/invite"
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors"
            >
              <div className="p-2 bg-green-100 rounded-lg">
                <UserGroupIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Invite Team Member</p>
                <p className="text-sm text-gray-500">Add employees or subs</p>
              </div>
            </Link>
            <Link
              href="/dashboard/finances/invoice/new"
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors"
            >
              <div className="p-2 bg-purple-100 rounded-lg">
                <BanknotesIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Create Invoice</p>
                <p className="text-sm text-gray-500">Bill a client</p>
              </div>
            </Link>
            <Link
              href="/dashboard/schedule"
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-yellow-300 hover:bg-yellow-50 transition-colors"
            >
              <div className="p-2 bg-yellow-100 rounded-lg">
                <ArrowTrendingUpIcon className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">View Schedule</p>
                <p className="text-sm text-gray-500">See today's assignments</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Setup Guide for new users */}
      {stats.activeProjects === 0 && (
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
