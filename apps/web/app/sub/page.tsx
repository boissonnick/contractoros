"use client";

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Bid, BidStatus, ScheduleAssignment } from '@/types';
import {
  DocumentTextIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { FirestoreError } from '@/components/ui';
import { formatDate } from '@/lib/date-utils';

const bidStatusConfig: Record<BidStatus, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: DocumentTextIcon },
  submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-700', icon: ClockIcon },
  under_review: { label: 'Under Review', color: 'bg-yellow-100 text-yellow-700', icon: ClockIcon },
  accepted: { label: 'Accepted', color: 'bg-green-100 text-green-700', icon: CheckCircleIcon },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: ExclamationCircleIcon },
  withdrawn: { label: 'Withdrawn', color: 'bg-gray-100 text-gray-700', icon: DocumentTextIcon },
};

export default function SubDashboard() {
  const { user, profile } = useAuth();
  const [bids, setBids] = useState<Bid[]>([]);
  const [upcomingWork, setUpcomingWork] = useState<ScheduleAssignment[]>([]);
  const [stats, setStats] = useState({
    activeBids: 0,
    acceptedBids: 0,
    pendingPayments: 0,
    totalEarnings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    setFetchError(null);
    setLoading(true);

    try {
      // Fetch bids
      const bidsQuery = query(
        collection(db, 'bids'),
        where('subId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const bidsSnap = await getDocs(bidsQuery);
      const bidsData = bidsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Bid[];
      setBids(bidsData);

      // Calculate stats
      const activeBids = bidsData.filter(b => ['submitted', 'under_review'].includes(b.status)).length;
      const acceptedBids = bidsData.filter(b => b.status === 'accepted').length;

      setStats({
        activeBids,
        acceptedBids,
        pendingPayments: 0, // Would calculate from invoices
        totalEarnings: bidsData.filter(b => b.status === 'accepted').reduce((sum, b) => sum + b.amount, 0),
      });
    } catch (error) {
      console.error('Error fetching sub data:', error);
      setFetchError('Failed to load data. The database may be unreachable.');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (fetchError) {
    return <FirestoreError message={fetchError} onRetry={fetchData} />;
  }

  const recentBids = bids.slice(0, 5);
  const pendingBids = bids.filter(b => ['submitted', 'under_review'].includes(b.status));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {profile?.displayName?.split(' ')[0]}
        </h1>
        <p className="text-gray-500 mt-1">
          {profile?.trade && <span className="capitalize">{profile.trade} · </span>}
          Manage your bids, schedule, and invoices
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DocumentTextIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.activeBids}</p>
              <p className="text-sm text-gray-500">Active Bids</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.acceptedBids}</p>
              <p className="text-sm text-gray-500">Won Jobs</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ClockIcon className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">${stats.pendingPayments.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Pending Payment</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BanknotesIcon className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">${stats.totalEarnings.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Total Earned</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Bids */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Pending Bids</h2>
            <Link href="/sub/bids" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View all <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>

          {pendingBids.length > 0 ? (
            <div className="space-y-3">
              {pendingBids.slice(0, 4).map((bid) => {
                const config = bidStatusConfig[bid.status];
                return (
                  <Link
                    key={bid.id}
                    href={`/sub/bids/${bid.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${config.color}`}>
                        <config.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Bid #{bid.id.slice(-6)}</p>
                        <p className="text-sm text-gray-500">${bid.amount.toLocaleString()}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
                      {config.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <DocumentTextIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No pending bids</p>
              <p className="text-sm mt-1">Check back for new bid opportunities</p>
            </div>
          )}
        </div>

        {/* Upcoming Schedule */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Work</h2>
            <Link href="/sub/schedule" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              Full schedule <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>

          {upcomingWork.length > 0 ? (
            <div className="space-y-3">
              {upcomingWork.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center gap-3 p-3 rounded-lg border"
                >
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <CalendarDaysIcon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {formatDate(assignment.date, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-sm text-gray-500">
                      {assignment.startTime} - {assignment.endTime}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CalendarDaysIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No upcoming work scheduled</p>
              <p className="text-sm mt-1">Win bids to get scheduled</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/sub/availability"
            className="inline-flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
          >
            Update Availability
          </Link>
          <Link
            href="/sub/invoices/new"
            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-400 transition-colors"
          >
            Create Invoice
          </Link>
          <Link
            href="/sub/expenses/new"
            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-400 transition-colors"
          >
            Submit Expense
          </Link>
        </div>
      </div>
    </div>
  );
}
