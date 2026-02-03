"use client";

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { Project, ProjectPhoto, Invoice } from '@/types';
import {
  HomeIcon,
  CalendarIcon,
  PhotoIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowRightIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { FirestoreError } from '@/components/ui';
import { formatDate } from '@/lib/date-utils';

export default function ClientDashboard() {
  const { user, profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [recentPhotos, setRecentPhotos] = useState<ProjectPhoto[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
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
      // Fetch client's projects
      const projectsQuery = query(
        collection(db, 'projects'),
        where('clientId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const projectsSnap = await getDocs(projectsQuery);
      const projectsData = projectsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Project[];
      setProjects(projectsData);

      // Fetch recent photos from their projects
      if (projectsData.length > 0) {
        const projectIds = projectsData.map(p => p.id);
        const photosQuery = query(
          collection(db, 'photos'),
          where('projectId', 'in', projectIds.slice(0, 10)),
          orderBy('createdAt', 'desc'),
          limit(6)
        );
        const photosSnap = await getDocs(photosQuery);
        setRecentPhotos(photosSnap.docs.map(d => ({ id: d.id, ...d.data() })) as ProjectPhoto[]);
      }

      // Fetch invoices
      const invoicesQuery = query(
        collection(db, 'invoices'),
        where('clientId', '==', user.uid),
        orderBy('issueDate', 'desc')
      );
      const invoicesSnap = await getDocs(invoicesQuery);
      setInvoices(invoicesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Invoice[]);

    } catch (error) {
      console.error('Error fetching client data:', error);
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

  const activeProject = projects.find(p => p.status === 'active');
  const pendingInvoices = invoices.filter(i => ['sent', 'viewed'].includes(i.status));
  const pendingAmount = pendingInvoices.reduce((sum, i) => sum + i.total, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {profile?.displayName?.split(' ')[0]}
        </h1>
        <p className="text-gray-500 mt-1">
          Track your project progress and stay updated
        </p>
      </div>

      {/* Active Project Card */}
      {activeProject ? (
        <Link
          href={`/client/projects/${activeProject.id}`}
          className="block bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white hover:from-blue-700 hover:to-blue-800 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-blue-200 text-sm font-medium mb-1">Active Project</p>
              <h2 className="text-xl font-bold mb-2">{activeProject.name}</h2>
              <p className="text-blue-100 text-sm">
                {activeProject.address.street}, {activeProject.address.city}
              </p>
            </div>
            <div className="p-3 bg-white/20 rounded-lg">
              <HomeIcon className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClockIcon className="h-4 w-4" />
              <span className="text-sm">In Progress</span>
            </div>
            <span className="text-sm flex items-center gap-1">
              View details <ArrowRightIcon className="h-4 w-4" />
            </span>
          </div>
        </Link>
      ) : (
        <div className="bg-white rounded-xl border p-6 text-center">
          <HomeIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Active Projects</h3>
          <p className="text-gray-500">Your contractor will add projects here when work begins</p>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <HomeIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
              <p className="text-sm text-gray-500">Total Projects</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <PhotoIcon className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{recentPhotos.length}</p>
              <p className="text-sm text-gray-500">Recent Photos</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-4 col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${pendingAmount > 0 ? 'bg-yellow-100' : 'bg-green-100'}`}>
              <CurrencyDollarIcon className={`h-5 w-5 ${pendingAmount > 0 ? 'text-yellow-600' : 'text-green-600'}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">${pendingAmount.toLocaleString()}</p>
              <p className="text-sm text-gray-500">
                {pendingAmount > 0 ? 'Balance Due' : 'All Paid Up'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Photos */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Progress</h2>
            <Link href="/client/photos" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              All photos <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>

          {recentPhotos.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {recentPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="aspect-square bg-gray-100 rounded-lg overflow-hidden"
                >
                  {photo.thumbnailUrl || photo.url ? (
                    <img
                      src={photo.thumbnailUrl || photo.url}
                      alt={photo.caption || 'Progress photo'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <PhotoIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <PhotoIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No photos yet</p>
              <p className="text-sm mt-1">Photos will appear here as work progresses</p>
            </div>
          )}
        </div>

        {/* Recent Invoices */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Invoices</h2>
            <Link href="/client/documents" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              All documents <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>

          {invoices.length > 0 ? (
            <div className="space-y-3">
              {invoices.slice(0, 4).map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      invoice.status === 'paid' ? 'bg-green-100' :
                      invoice.status === 'overdue' ? 'bg-red-100' : 'bg-yellow-100'
                    }`}>
                      <DocumentTextIcon className={`h-4 w-4 ${
                        invoice.status === 'paid' ? 'text-green-600' :
                        invoice.status === 'overdue' ? 'text-red-600' : 'text-yellow-600'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Invoice #{invoice.number}</p>
                      <p className="text-sm text-gray-500">
                        Due {formatDate(invoice.dueDate)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">${invoice.total.toLocaleString()}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                      invoice.status === 'overdue' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {invoice.status === 'paid' ? 'Paid' :
                       invoice.status === 'overdue' ? 'Overdue' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CheckCircleIcon className="h-12 w-12 mx-auto mb-3 text-green-500" />
              <p>No invoices</p>
              <p className="text-sm mt-1">Invoices will appear here when issued</p>
            </div>
          )}
        </div>
      </div>

      {/* Contact Card */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h3>
        <p className="text-gray-600 mb-4">
          If you have questions about your project, reach out to your contractor directly.
        </p>
        <Link
          href="/client/messages"
          className="inline-flex items-center px-4 py-2 bg-brand-primary text-white rounded-lg font-medium hover:opacity-90 transition-colors"
        >
          Send Message
        </Link>
      </div>
    </div>
  );
}
