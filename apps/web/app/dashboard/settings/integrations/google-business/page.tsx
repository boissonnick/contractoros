'use client';

import React from 'react';
import { useAuth } from '@/lib/auth';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import { useGoogleBusiness } from '@/lib/hooks/useGoogleBusiness';
import { LinkIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useSearchParams } from 'next/navigation';

export default function GoogleBusinessSettingsPage() {
  const { profile } = useAuth();
  const orgId = profile?.orgId || '';
  const searchParams = useSearchParams();

  const {
    connections,
    loading,
    isConnected,
    initiateOAuth,
    disconnect,
  } = useGoogleBusiness(orgId);

  // Handle URL params for success/error messages
  const success = searchParams.get('success');
  const error = searchParams.get('error');

  const errorMessages: Record<string, string> = {
    oauth_denied: 'Authorization was denied. Please try again.',
    invalid_callback: 'Invalid callback. Please try again.',
    no_accounts: 'No Google Business accounts found.',
    no_locations: 'No business locations found in your account.',
    connection_failed: 'Failed to connect. Please try again.',
  };

  // Role guard
  if (profile?.role !== 'OWNER' && profile?.role !== 'PM') {
    return (
      <div className="p-8">
        <EmptyState
          icon={<LinkIcon className="h-full w-full" />}
          title="Access Restricted"
          description="You don't have permission to manage integrations."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Google Business Profile"
        description="Connect your Google Business Profile to automatically sync reviews"
        breadcrumbs={[
          { label: 'Settings', href: '/dashboard/settings' },
          { label: 'Integrations', href: '/dashboard/settings/integrations' },
          { label: 'Google Business', href: '/dashboard/settings/integrations/google-business' },
        ]}
      />

      {/* Success/Error Messages */}
      {success === 'connected' && (
        <div className="rounded-lg bg-green-50 p-4 text-green-800">
          Successfully connected to Google Business Profile!
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-800">
          {errorMessages[error] || 'An error occurred. Please try again.'}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
        </div>
      ) : !isConnected ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <svg className="h-8 w-8 text-blue-600" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900 tracking-tight">
            Connect Google Business Profile
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Connect your Google Business Profile to automatically sync reviews and respond
            to customers directly from ContractorOS.
          </p>
          <button
            onClick={initiateOAuth}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700"
          >
            <LinkIcon className="h-5 w-5" />
            Connect Google Business
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {connections.map((connection) => (
            <div
              key={connection.id}
              className="rounded-lg border border-gray-200 bg-white p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                    <svg className="h-6 w-6 text-green-600" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 tracking-tight">{connection.locationName}</h3>
                    <p className="text-sm text-gray-500">
                      {connection.locationAddress || 'Google Business Profile'}
                    </p>
                    <p className="text-xs text-gray-400">
                      Connected {new Date(connection.connectedAt).toLocaleDateString()}
                      {connection.lastSyncAt && (
                        <> | Last synced {new Date(connection.lastSyncAt).toLocaleDateString()}</>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => disconnect(connection.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
                  >
                    <TrashIcon className="h-4 w-4" />
                    Disconnect
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Add more locations button */}
          <button
            onClick={initiateOAuth}
            className="w-full rounded-lg border-2 border-dashed border-gray-300 p-4 text-sm text-gray-600 hover:border-gray-400 hover:text-gray-700"
          >
            + Add Another Location
          </button>
        </div>
      )}
    </div>
  );
}
