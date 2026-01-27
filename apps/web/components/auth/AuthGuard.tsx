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
  const { profile, loading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (profile && allowedRoles && !allowedRoles.includes(profile.role)) {
        // Redirect to the appropriate path for their role
        const redirectPath = fallbackPath || getDefaultPath(profile.role);
        router.push(redirectPath);
      }
    }
  }, [loading, user, profile, allowedRoles, router, fallbackPath]);

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