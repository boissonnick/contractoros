"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { UserRole } from '@/types';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  fallbackPath?: string;
}

// Get the default dashboard path for each role
function getDefaultPath(role: UserRole): string {
  switch (role) {
    case 'OWNER':
    case 'PM':
      return '/dashboard';
    case 'EMPLOYEE':
    case 'CONTRACTOR':
      return '/field';
    case 'SUB':
      return '/sub';
    case 'CLIENT':
      return '/client';
    default:
      return '/login';
  }
}

export default function AuthGuard({ children, allowedRoles, fallbackPath }: AuthGuardProps) {
  const { profile, loading, user, authError } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !authError) {
      if (!user) {
        router.push('/login');
      } else if (profile && allowedRoles && !allowedRoles.includes(profile.role)) {
        // Redirect to the appropriate path for their role
        const redirectPath = fallbackPath || getDefaultPath(profile.role);
        router.push(redirectPath);
      }
    }
  }, [loading, user, profile, allowedRoles, router, fallbackPath, authError]);

  if (authError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 max-w-sm w-full mx-4 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Connection Problem</h2>
          <p className="text-sm text-gray-500 mb-6">{authError}</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-brand-primary text-white font-medium rounded-lg hover:opacity-90 transition-colors"
            >
              Retry
            </button>
            <a
              href="/login"
              className="block w-full px-4 py-2 text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Go to Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading ContractorOS...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (profile && allowedRoles && !allowedRoles.includes(profile.role)) {
    return null;
  }

  return <>{children}</>;
}