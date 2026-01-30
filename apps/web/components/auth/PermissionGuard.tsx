"use client";

import React from 'react';
import { RolePermissions } from '@/types';
import { useHasPermission, usePermissions } from '@/lib/contexts/ImpersonationContext';

interface PermissionGuardProps {
  children: React.ReactNode;
  /** Single permission required */
  permission?: keyof RolePermissions;
  /** Multiple permissions - user must have ALL of them */
  permissions?: (keyof RolePermissions)[];
  /** Multiple permissions - user must have ANY of them */
  anyOf?: (keyof RolePermissions)[];
  /** Fallback content when permission check fails */
  fallback?: React.ReactNode;
  /** If true, shows nothing instead of fallback (useful for hiding UI elements) */
  hide?: boolean;
}

/**
 * PermissionGuard - Conditionally renders children based on user permissions.
 *
 * Usage examples:
 *
 * // Single permission
 * <PermissionGuard permission="canCreateProjects">
 *   <Button>Create Project</Button>
 * </PermissionGuard>
 *
 * // Multiple permissions (ALL required)
 * <PermissionGuard permissions={['canEditProjects', 'canAssignTasks']}>
 *   <Button>Assign and Edit</Button>
 * </PermissionGuard>
 *
 * // Multiple permissions (ANY required)
 * <PermissionGuard anyOf={['canViewAllProjects', 'canViewAssignedProjects']}>
 *   <ProjectList />
 * </PermissionGuard>
 *
 * // With fallback content
 * <PermissionGuard permission="canManageRoles" fallback={<p>Contact admin for access</p>}>
 *   <RoleManagement />
 * </PermissionGuard>
 *
 * // Hide completely (no fallback)
 * <PermissionGuard permission="canDeleteProjects" hide>
 *   <DeleteButton />
 * </PermissionGuard>
 */
export function PermissionGuard({
  children,
  permission,
  permissions,
  anyOf,
  fallback = null,
  hide = false,
}: PermissionGuardProps) {
  const allPermissions = usePermissions();

  // Check single permission
  if (permission && !allPermissions[permission]) {
    return hide ? null : <>{fallback}</>;
  }

  // Check ALL permissions required
  if (permissions && permissions.length > 0) {
    const hasAll = permissions.every((p) => allPermissions[p]);
    if (!hasAll) {
      return hide ? null : <>{fallback}</>;
    }
  }

  // Check ANY permission required
  if (anyOf && anyOf.length > 0) {
    const hasAny = anyOf.some((p) => allPermissions[p]);
    if (!hasAny) {
      return hide ? null : <>{fallback}</>;
    }
  }

  return <>{children}</>;
}

/**
 * Hook version for conditional logic in components
 *
 * Usage:
 * const canCreate = useCanAccess('canCreateProjects');
 * const canManage = useCanAccessAll(['canEditProjects', 'canDeleteProjects']);
 * const canView = useCanAccessAny(['canViewAllProjects', 'canViewAssignedProjects']);
 */
export function useCanAccess(permission: keyof RolePermissions): boolean {
  return useHasPermission(permission);
}

export function useCanAccessAll(permissions: (keyof RolePermissions)[]): boolean {
  const allPermissions = usePermissions();
  return permissions.every((p) => allPermissions[p]);
}

export function useCanAccessAny(permissions: (keyof RolePermissions)[]): boolean {
  const allPermissions = usePermissions();
  return permissions.some((p) => allPermissions[p]);
}

/**
 * Higher-order component version for wrapping entire components
 *
 * Usage:
 * const ProtectedSettings = withPermission(SettingsPage, 'canViewSettings');
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  permission: keyof RolePermissions,
  FallbackComponent?: React.ComponentType
): React.FC<P> {
  return function PermissionWrappedComponent(props: P) {
    const hasPermission = useHasPermission(permission);

    if (!hasPermission) {
      if (FallbackComponent) {
        return <FallbackComponent />;
      }
      return null;
    }

    return <Component {...props} />;
  };
}

export default PermissionGuard;
