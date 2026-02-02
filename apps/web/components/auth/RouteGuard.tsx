"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { RolePermissions, UserRole } from '@/types';
import { usePermissions, useImpersonation } from '@/lib/contexts/ImpersonationContext';
import { ShieldExclamationIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui';

interface RouteGuardProps {
  children: React.ReactNode;
  /** Required permission(s) - all must be satisfied */
  permissions?: (keyof RolePermissions)[];
  /** Alternative permissions - at least one must be satisfied */
  anyOf?: (keyof RolePermissions)[];
  /** Allowed roles (in addition to or instead of permissions) */
  allowedRoles?: UserRole[];
  /** Path to redirect to on access denied (default: show access denied page) */
  redirectTo?: string;
  /** Custom access denied component */
  accessDeniedComponent?: React.ReactNode;
}

/**
 * RouteGuard - Protects entire routes based on permissions or roles.
 *
 * Unlike AuthGuard which handles authentication, RouteGuard handles authorization.
 * Use this in layout.tsx or page.tsx files to protect routes.
 *
 * Usage examples:
 *
 * // In a layout.tsx
 * <RouteGuard permissions={['canViewSettings']}>
 *   {children}
 * </RouteGuard>
 *
 * // Role-based access
 * <RouteGuard allowedRoles={['OWNER', 'PM']}>
 *   {children}
 * </RouteGuard>
 *
 * // Mixed (user needs the permission OR the role)
 * <RouteGuard permissions={['canManageTeam']} allowedRoles={['OWNER']}>
 *   {children}
 * </RouteGuard>
 *
 * // Redirect on failure
 * <RouteGuard permissions={['canViewAllFinances']} redirectTo="/dashboard">
 *   {children}
 * </RouteGuard>
 */
export function RouteGuard({
  children,
  permissions,
  anyOf,
  allowedRoles,
  redirectTo,
  accessDeniedComponent,
}: RouteGuardProps) {
  const { profile, loading, user } = useAuth();
  const allPermissions = usePermissions();
  const router = useRouter();
  const pathname = usePathname();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    // Still loading auth state
    if (loading) return;

    // Not authenticated at all - AuthGuard should handle this
    if (!user || !profile) {
      setHasAccess(false);
      return;
    }

    // Check role-based access
    if (allowedRoles && allowedRoles.length > 0) {
      if (allowedRoles.includes(profile.role)) {
        setHasAccess(true);
        return;
      }
    }

    // Check ALL permissions required
    if (permissions && permissions.length > 0) {
      const hasAll = permissions.every((p) => allPermissions[p]);
      if (hasAll) {
        setHasAccess(true);
        return;
      }
    }

    // Check ANY permission required
    if (anyOf && anyOf.length > 0) {
      const hasAny = anyOf.some((p) => allPermissions[p]);
      if (hasAny) {
        setHasAccess(true);
        return;
      }
    }

    // If no permission or role checks specified, allow access
    if (!permissions?.length && !anyOf?.length && !allowedRoles?.length) {
      setHasAccess(true);
      return;
    }

    // Access denied
    setHasAccess(false);
  }, [loading, user, profile, permissions, anyOf, allowedRoles, allPermissions]);

  // Handle redirect on access denied
  useEffect(() => {
    if (hasAccess === false && redirectTo) {
      router.push(redirectTo);
    }
  }, [hasAccess, redirectTo, router]);

  // Loading state
  if (loading || hasAccess === null) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Access denied - show custom component or default
  if (!hasAccess && !redirectTo) {
    if (accessDeniedComponent) {
      return <>{accessDeniedComponent}</>;
    }

    return <AccessDeniedPage pathname={pathname} />;
  }

  // Access denied with redirect - show nothing (redirect happening)
  if (!hasAccess) {
    return null;
  }

  return <>{children}</>;
}

/**
 * Default Access Denied page component
 * BUG #7 FIX: Shows impersonated role instead of actual role when impersonating
 */
function AccessDeniedPage({ pathname }: { pathname: string }) {
  const router = useRouter();
  const { currentRole, isImpersonating } = useImpersonation();

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldExclamationIcon className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          You don&apos;t have permission to access this page.
          <span className="block mt-1 text-sm text-gray-500">
            Your current role: <span className="font-medium uppercase">{currentRole.replace('_', ' ')}</span>
            {isImpersonating && (
              <span className="ml-1 text-amber-600">(Demo Mode)</span>
            )}
          </span>
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeftIcon className="h-4 w-4 mr-1.5" />
            Go Back
          </Button>
          <Button onClick={() => router.push('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
        <p className="mt-6 text-xs text-gray-400">
          If you believe this is an error, contact your organization administrator.
        </p>
      </div>
    </div>
  );
}

/**
 * Pre-configured route guards for common scenarios
 */

export function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard allowedRoles={['OWNER', 'PM']}>
      {children}
    </RouteGuard>
  );
}

export function OwnerOnlyRouteGuard({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard allowedRoles={['OWNER']}>
      {children}
    </RouteGuard>
  );
}

export function FinanceRouteGuard({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard anyOf={['canViewAllFinances', 'canViewAssignedFinances']}>
      {children}
    </RouteGuard>
  );
}

export function SettingsRouteGuard({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard permissions={['canViewSettings']}>
      {children}
    </RouteGuard>
  );
}

export default RouteGuard;
