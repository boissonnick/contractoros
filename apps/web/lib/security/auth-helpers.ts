/**
 * Security Helper Functions
 *
 * Centralized auth/permission checking utilities.
 * Used throughout the app for consistent security checks.
 */

import { User } from 'firebase/auth';
import { UserRole } from '@/types';

/**
 * Check if a user is authenticated
 * @param user - Firebase User object or null/undefined
 * @returns true if user is authenticated
 */
export function isAuthenticated(user: User | null | undefined): boolean {
  return user !== null && user !== undefined;
}

/**
 * Check if the user belongs to the specified organization
 * @param userOrgId - The user's organization ID
 * @param targetOrgId - The target organization ID to check against
 * @returns true if the user belongs to the organization
 */
export function isSameOrg(
  userOrgId: string | null | undefined,
  targetOrgId: string | null | undefined
): boolean {
  if (!userOrgId || !targetOrgId) return false;
  return userOrgId === targetOrgId;
}

/**
 * Admin roles that have elevated privileges
 */
const ADMIN_ROLES: UserRole[] = ['OWNER', 'PM'];

/**
 * Check if a user has admin privileges (OWNER or PM role)
 * @param role - The user's role
 * @returns true if the user is an admin
 */
export function isAdmin(role: UserRole | string | null | undefined): boolean {
  if (!role) return false;
  return ADMIN_ROLES.includes(role.toUpperCase() as UserRole);
}

/**
 * Check if a user is the owner of a resource
 * @param userId - The user's ID
 * @param resourceOwnerId - The resource owner's ID
 * @returns true if the user owns the resource
 */
export function isOwner(
  userId: string | null | undefined,
  resourceOwnerId: string | null | undefined
): boolean {
  if (!userId || !resourceOwnerId) return false;
  return userId === resourceOwnerId;
}

/**
 * Check if user can access a resource (same org + authenticated)
 */
export function canAccessResource(
  user: User | null | undefined,
  userOrgId: string | null | undefined,
  resourceOrgId: string | null | undefined
): boolean {
  return isAuthenticated(user) && isSameOrg(userOrgId, resourceOrgId);
}

/**
 * Check if user can modify a resource (owner or admin)
 */
export function canModifyResource(
  userId: string | null | undefined,
  resourceOwnerId: string | null | undefined,
  userRole: UserRole | string | null | undefined
): boolean {
  return isOwner(userId, resourceOwnerId) || isAdmin(userRole);
}

/**
 * Check if user has any of the specified roles
 * @param userRole - The user's role
 * @param allowedRoles - Array of allowed roles
 */
export function hasRole(
  userRole: UserRole | string | null | undefined,
  allowedRoles: UserRole[]
): boolean {
  if (!userRole) return false;
  return allowedRoles.includes(userRole.toUpperCase() as UserRole);
}

/**
 * Role hierarchy for permission checking
 * Higher number = more privileges
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  OWNER: 100,
  PM: 80,
  EMPLOYEE: 60,
  CONTRACTOR: 40,
  SUB: 30,
  CLIENT: 10,
};

/**
 * Check if user's role meets or exceeds the required level
 */
export function hasMinimumRole(
  userRole: UserRole | string | null | undefined,
  requiredRole: UserRole
): boolean {
  if (!userRole) return false;
  const userLevel = ROLE_HIERARCHY[userRole.toUpperCase() as UserRole] || 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;
  return userLevel >= requiredLevel;
}
