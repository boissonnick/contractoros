"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { UserRole } from '@/types';

function getRedirectPath(role: UserRole): string {
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

export default function HomePage() {
  const router = useRouter();
  const { user, profile, loading, authError } = useAuth();

  useEffect(() => {
    if (loading || authError) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    if (profile?.role) {
      router.replace(getRedirectPath(profile.role));
    } else {
      // Authenticated but no profile — send to onboarding or login
      router.replace('/login');
    }
  }, [user, profile, loading, authError, router]);

  if (authError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 max-w-sm w-full mx-4 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Connection Problem</h1>
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

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">ContractorOS</h1>
        <p className="text-gray-500">Loading...</p>
      </div>
    </div>
  );
}
