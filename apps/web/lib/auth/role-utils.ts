import { UserRole, ImpersonationRole } from '@/types';

/**
 * Role Utilities — Single Source of Truth
 *
 * Consolidates role-to-path mapping and role-to-impersonation mapping
 * that was previously duplicated across:
 *   - components/auth/AuthGuard.tsx (getDefaultPath)
 *   - app/login/page.tsx (getRedirectPath)
 *   - lib/contexts/ImpersonationContext.tsx (mapUserRoleToImpersonationRole)
 */

/** Default landing path for each role after authentication */
export const ROLE_DEFAULT_PATHS: Record<UserRole, string> = {
  OWNER: '/dashboard',
  PM: '/dashboard',
  EMPLOYEE: '/field',
  CONTRACTOR: '/field',
  SUB: '/sub',
  CLIENT: '/client',
};

/** Portal definitions with the roles allowed to access each portal */
export const PORTAL_ROLES: Record<string, UserRole[]> = {
  dashboard: ['OWNER', 'PM', 'EMPLOYEE', 'CONTRACTOR'],
  field: ['OWNER', 'PM', 'EMPLOYEE', 'CONTRACTOR', 'SUB'],
  client: ['CLIENT'],
  sub: ['SUB'],
};

/**
 * Get the default redirect path for a given role.
 * Falls back to '/login' for unknown roles.
 */
export function getDefaultPathForRole(role: UserRole): string {
  return ROLE_DEFAULT_PATHS[role] || '/login';
}

/**
 * Get all roles allowed to access a specific portal.
 * Returns an empty array for unknown portals.
 */
export function getRolesForPortal(portal: string): UserRole[] {
  return PORTAL_ROLES[portal] || [];
}

/**
 * Check whether a role is allowed to access a specific portal.
 * Returns false for unknown portals.
 */
export function canAccessPortal(role: UserRole, portal: string): boolean {
  const allowedRoles = PORTAL_ROLES[portal];
  if (!allowedRoles) return false;
  return allowedRoles.includes(role);
}

/**
 * Map a UserRole to the corresponding ImpersonationRole.
 * Used by the ImpersonationContext for role-switching in demos/testing.
 * Defaults to 'employee' for unrecognized roles.
 */
export function mapUserRoleToImpersonationRole(role: UserRole): ImpersonationRole {
  switch (role) {
    case 'OWNER':
      return 'owner';
    case 'PM':
      return 'project_manager';
    case 'EMPLOYEE':
      return 'employee';
    case 'CONTRACTOR':
    case 'SUB':
      return 'contractor';
    case 'CLIENT':
      return 'client';
    default:
      return 'employee';
  }
}
