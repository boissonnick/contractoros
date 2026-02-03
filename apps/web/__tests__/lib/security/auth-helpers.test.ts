/**
 * Auth Helpers Test Suite
 *
 * CRITICAL SECURITY TESTS
 * These tests verify the core authentication and authorization helpers
 * that protect all org-scoped data in ContractorOS.
 *
 * 100% coverage required for all functions.
 */

import {
  isAuthenticated,
  isSameOrg,
  isAdmin,
  isOwner,
  canAccessResource,
  canModifyResource,
  hasRole,
  hasMinimumRole,
  ROLE_HIERARCHY,
} from '@/lib/security/auth-helpers';
import { User } from 'firebase/auth';
import { UserRole } from '@/types';

// Helper to create mock Firebase User objects
function createMockUser(overrides?: Partial<User>): User {
  return {
    uid: 'test-user-123',
    email: 'test@example.com',
    emailVerified: true,
    displayName: 'Test User',
    isAnonymous: false,
    photoURL: null,
    phoneNumber: null,
    tenantId: null,
    providerId: 'firebase',
    metadata: {} as any,
    providerData: [],
    refreshToken: '',
    delete: jest.fn(),
    getIdToken: jest.fn(),
    getIdTokenResult: jest.fn(),
    reload: jest.fn(),
    toJSON: jest.fn(),
    ...overrides,
  } as User;
}

describe('isAuthenticated', () => {
  describe('returns true', () => {
    it('when user is authenticated with uid and email', () => {
      const user = createMockUser({ uid: '123', email: 'test@test.com' });
      expect(isAuthenticated(user)).toBe(true);
    });

    it('when user has uid but no email', () => {
      const user = createMockUser({ uid: '123', email: null });
      expect(isAuthenticated(user)).toBe(true);
    });

    it('when user is anonymous', () => {
      const user = createMockUser({ uid: 'anon-123', isAnonymous: true });
      expect(isAuthenticated(user)).toBe(true);
    });
  });

  describe('returns false', () => {
    it('when user is null', () => {
      expect(isAuthenticated(null)).toBe(false);
    });

    it('when user is undefined', () => {
      expect(isAuthenticated(undefined)).toBe(false);
    });
  });
});

describe('isSameOrg', () => {
  describe('returns true', () => {
    it('when orgIds match exactly', () => {
      expect(isSameOrg('org-123', 'org-123')).toBe(true);
    });

    it('when both are empty strings', () => {
      // Empty strings are falsy, so this should return false
      expect(isSameOrg('', '')).toBe(false);
    });

    it('when orgIds match with different formats', () => {
      expect(isSameOrg('ORG-ABC-123', 'ORG-ABC-123')).toBe(true);
    });
  });

  describe('returns false', () => {
    it('when orgIds do not match', () => {
      expect(isSameOrg('org-123', 'org-456')).toBe(false);
    });

    it('when userOrgId is null', () => {
      expect(isSameOrg(null, 'org-123')).toBe(false);
    });

    it('when userOrgId is undefined', () => {
      expect(isSameOrg(undefined, 'org-123')).toBe(false);
    });

    it('when targetOrgId is null', () => {
      expect(isSameOrg('org-123', null)).toBe(false);
    });

    it('when targetOrgId is undefined', () => {
      expect(isSameOrg('org-123', undefined)).toBe(false);
    });

    it('when both orgIds are null', () => {
      expect(isSameOrg(null, null)).toBe(false);
    });

    it('when both orgIds are undefined', () => {
      expect(isSameOrg(undefined, undefined)).toBe(false);
    });

    it('when both are empty strings (falsy check)', () => {
      expect(isSameOrg('', '')).toBe(false);
    });

    it('when one is empty string and other is valid', () => {
      expect(isSameOrg('', 'org-123')).toBe(false);
      expect(isSameOrg('org-123', '')).toBe(false);
    });

    it('when orgIds are similar but not identical', () => {
      expect(isSameOrg('org-123', 'org-1234')).toBe(false);
      expect(isSameOrg('org-123', 'ORG-123')).toBe(false); // Case sensitive
    });
  });
});

describe('isAdmin', () => {
  describe('returns true', () => {
    it('for OWNER role', () => {
      expect(isAdmin('OWNER')).toBe(true);
    });

    it('for PM role', () => {
      expect(isAdmin('PM')).toBe(true);
    });

    it('for lowercase owner (case insensitivity)', () => {
      expect(isAdmin('owner')).toBe(true);
    });

    it('for lowercase pm (case insensitivity)', () => {
      expect(isAdmin('pm')).toBe(true);
    });

    it('for mixed case Owner (case insensitivity)', () => {
      expect(isAdmin('Owner')).toBe(true);
    });

    it('for mixed case Pm (case insensitivity)', () => {
      expect(isAdmin('Pm')).toBe(true);
    });
  });

  describe('returns false', () => {
    it('for EMPLOYEE role', () => {
      expect(isAdmin('EMPLOYEE')).toBe(false);
    });

    it('for CONTRACTOR role', () => {
      expect(isAdmin('CONTRACTOR')).toBe(false);
    });

    it('for CLIENT role', () => {
      expect(isAdmin('CLIENT')).toBe(false);
    });

    it('for SUB role', () => {
      expect(isAdmin('SUB')).toBe(false);
    });

    it('for null role', () => {
      expect(isAdmin(null)).toBe(false);
    });

    it('for undefined role', () => {
      expect(isAdmin(undefined)).toBe(false);
    });

    it('for empty string role', () => {
      expect(isAdmin('')).toBe(false);
    });

    it('for invalid role string', () => {
      expect(isAdmin('ADMIN')).toBe(false);
      expect(isAdmin('SUPERUSER')).toBe(false);
      expect(isAdmin('MANAGER')).toBe(false);
    });

    it('for lowercase non-admin roles', () => {
      expect(isAdmin('employee')).toBe(false);
      expect(isAdmin('contractor')).toBe(false);
      expect(isAdmin('client')).toBe(false);
      expect(isAdmin('sub')).toBe(false);
    });
  });
});

describe('isOwner', () => {
  describe('returns true', () => {
    it('when userId matches resourceOwnerId', () => {
      expect(isOwner('user-123', 'user-123')).toBe(true);
    });

    it('when both IDs are complex strings', () => {
      expect(isOwner('abc-def-ghi-jkl', 'abc-def-ghi-jkl')).toBe(true);
    });
  });

  describe('returns false', () => {
    it('when userId differs from resourceOwnerId', () => {
      expect(isOwner('user-123', 'user-456')).toBe(false);
    });

    it('when userId is null', () => {
      expect(isOwner(null, 'user-123')).toBe(false);
    });

    it('when userId is undefined', () => {
      expect(isOwner(undefined, 'user-123')).toBe(false);
    });

    it('when resourceOwnerId is null', () => {
      expect(isOwner('user-123', null)).toBe(false);
    });

    it('when resourceOwnerId is undefined', () => {
      expect(isOwner('user-123', undefined)).toBe(false);
    });

    it('when both are null', () => {
      expect(isOwner(null, null)).toBe(false);
    });

    it('when both are undefined', () => {
      expect(isOwner(undefined, undefined)).toBe(false);
    });

    it('when both are empty strings', () => {
      expect(isOwner('', '')).toBe(false);
    });

    it('when one is empty string', () => {
      expect(isOwner('', 'user-123')).toBe(false);
      expect(isOwner('user-123', '')).toBe(false);
    });

    it('when IDs are similar but not identical', () => {
      expect(isOwner('user-123', 'user-1234')).toBe(false);
      expect(isOwner('user-123', 'USER-123')).toBe(false); // Case sensitive
    });
  });
});

describe('canAccessResource', () => {
  describe('returns true', () => {
    it('when user is authenticated and in same org', () => {
      const user = createMockUser();
      expect(canAccessResource(user, 'org-123', 'org-123')).toBe(true);
    });
  });

  describe('returns false', () => {
    it('when user is not authenticated (null)', () => {
      expect(canAccessResource(null, 'org-123', 'org-123')).toBe(false);
    });

    it('when user is not authenticated (undefined)', () => {
      expect(canAccessResource(undefined, 'org-123', 'org-123')).toBe(false);
    });

    it('when user is authenticated but different org', () => {
      const user = createMockUser();
      expect(canAccessResource(user, 'org-123', 'org-456')).toBe(false);
    });

    it('when user is authenticated but userOrgId is null', () => {
      const user = createMockUser();
      expect(canAccessResource(user, null, 'org-123')).toBe(false);
    });

    it('when user is authenticated but resourceOrgId is null', () => {
      const user = createMockUser();
      expect(canAccessResource(user, 'org-123', null)).toBe(false);
    });

    it('when all conditions fail', () => {
      expect(canAccessResource(null, null, null)).toBe(false);
    });
  });
});

describe('canModifyResource', () => {
  describe('returns true', () => {
    it('when user is resource owner', () => {
      expect(canModifyResource('user-123', 'user-123', 'EMPLOYEE')).toBe(true);
    });

    it('when user is admin (OWNER role)', () => {
      expect(canModifyResource('user-123', 'user-456', 'OWNER')).toBe(true);
    });

    it('when user is admin (PM role)', () => {
      expect(canModifyResource('user-123', 'user-456', 'PM')).toBe(true);
    });

    it('when user is both owner and admin', () => {
      expect(canModifyResource('user-123', 'user-123', 'OWNER')).toBe(true);
    });
  });

  describe('returns false', () => {
    it('when user is not owner and not admin', () => {
      expect(canModifyResource('user-123', 'user-456', 'EMPLOYEE')).toBe(false);
    });

    it('when user is not owner with CLIENT role', () => {
      expect(canModifyResource('user-123', 'user-456', 'CLIENT')).toBe(false);
    });

    it('when user is not owner with SUB role', () => {
      expect(canModifyResource('user-123', 'user-456', 'SUB')).toBe(false);
    });

    it('when userId is null', () => {
      expect(canModifyResource(null, 'user-456', 'EMPLOYEE')).toBe(false);
    });

    it('when all params are null/undefined', () => {
      expect(canModifyResource(null, null, null)).toBe(false);
    });
  });
});

describe('hasRole', () => {
  describe('returns true', () => {
    it('when user role is in allowed roles', () => {
      expect(hasRole('OWNER', ['OWNER', 'PM'])).toBe(true);
      expect(hasRole('PM', ['OWNER', 'PM'])).toBe(true);
    });

    it('when checking single role match', () => {
      expect(hasRole('EMPLOYEE', ['EMPLOYEE'])).toBe(true);
    });

    it('with case insensitive role check', () => {
      expect(hasRole('owner', ['OWNER', 'PM'])).toBe(true);
      expect(hasRole('pm', ['OWNER', 'PM'])).toBe(true);
    });
  });

  describe('returns false', () => {
    it('when user role is not in allowed roles', () => {
      expect(hasRole('EMPLOYEE', ['OWNER', 'PM'])).toBe(false);
    });

    it('when allowed roles array is empty', () => {
      expect(hasRole('OWNER', [])).toBe(false);
    });

    it('when user role is null', () => {
      expect(hasRole(null, ['OWNER', 'PM'])).toBe(false);
    });

    it('when user role is undefined', () => {
      expect(hasRole(undefined, ['OWNER', 'PM'])).toBe(false);
    });

    it('when user role is empty string', () => {
      expect(hasRole('', ['OWNER', 'PM'])).toBe(false);
    });
  });
});

describe('hasMinimumRole', () => {
  describe('returns true', () => {
    it('when user role equals required role', () => {
      expect(hasMinimumRole('EMPLOYEE', 'EMPLOYEE')).toBe(true);
    });

    it('when user role exceeds required role', () => {
      expect(hasMinimumRole('OWNER', 'EMPLOYEE')).toBe(true);
      expect(hasMinimumRole('PM', 'EMPLOYEE')).toBe(true);
      expect(hasMinimumRole('OWNER', 'PM')).toBe(true);
    });

    it('with case insensitive role check', () => {
      expect(hasMinimumRole('owner', 'EMPLOYEE')).toBe(true);
      expect(hasMinimumRole('pm', 'CONTRACTOR')).toBe(true);
    });
  });

  describe('returns false', () => {
    it('when user role is below required role', () => {
      expect(hasMinimumRole('EMPLOYEE', 'OWNER')).toBe(false);
      expect(hasMinimumRole('CLIENT', 'EMPLOYEE')).toBe(false);
      expect(hasMinimumRole('SUB', 'PM')).toBe(false);
    });

    it('when user role is null', () => {
      expect(hasMinimumRole(null, 'EMPLOYEE')).toBe(false);
    });

    it('when user role is undefined', () => {
      expect(hasMinimumRole(undefined, 'EMPLOYEE')).toBe(false);
    });

    it('when user role is empty string', () => {
      expect(hasMinimumRole('', 'EMPLOYEE')).toBe(false);
    });

    it('when user role is invalid', () => {
      expect(hasMinimumRole('INVALID', 'EMPLOYEE')).toBe(false);
    });

    it('when required role is invalid (edge case)', () => {
      // This tests the fallback to 0 for requiredLevel when role not in hierarchy
      // A valid user role should still compare against 0
      expect(hasMinimumRole('OWNER', 'INVALID' as any)).toBe(true);
      expect(hasMinimumRole('CLIENT', 'INVALID' as any)).toBe(true);
    });
  });
});

describe('ROLE_HIERARCHY', () => {
  it('has correct hierarchy values', () => {
    expect(ROLE_HIERARCHY.OWNER).toBe(100);
    expect(ROLE_HIERARCHY.PM).toBe(80);
    expect(ROLE_HIERARCHY.EMPLOYEE).toBe(60);
    expect(ROLE_HIERARCHY.CONTRACTOR).toBe(40);
    expect(ROLE_HIERARCHY.SUB).toBe(30);
    expect(ROLE_HIERARCHY.CLIENT).toBe(10);
  });

  it('OWNER is highest privilege', () => {
    const roles: UserRole[] = ['OWNER', 'PM', 'EMPLOYEE', 'CONTRACTOR', 'SUB', 'CLIENT'];
    const maxRole = roles.reduce((max, role) =>
      ROLE_HIERARCHY[role] > ROLE_HIERARCHY[max] ? role : max
    );
    expect(maxRole).toBe('OWNER');
  });

  it('CLIENT is lowest privilege', () => {
    const roles: UserRole[] = ['OWNER', 'PM', 'EMPLOYEE', 'CONTRACTOR', 'SUB', 'CLIENT'];
    const minRole = roles.reduce((min, role) =>
      ROLE_HIERARCHY[role] < ROLE_HIERARCHY[min] ? role : min
    );
    expect(minRole).toBe('CLIENT');
  });

  it('maintains proper ordering', () => {
    expect(ROLE_HIERARCHY.OWNER).toBeGreaterThan(ROLE_HIERARCHY.PM);
    expect(ROLE_HIERARCHY.PM).toBeGreaterThan(ROLE_HIERARCHY.EMPLOYEE);
    expect(ROLE_HIERARCHY.EMPLOYEE).toBeGreaterThan(ROLE_HIERARCHY.CONTRACTOR);
    expect(ROLE_HIERARCHY.CONTRACTOR).toBeGreaterThan(ROLE_HIERARCHY.SUB);
    expect(ROLE_HIERARCHY.SUB).toBeGreaterThan(ROLE_HIERARCHY.CLIENT);
  });
});

// Edge cases and security-critical scenarios
describe('Security Edge Cases', () => {
  describe('Org isolation protection', () => {
    it('prevents cross-org access with similar org IDs', () => {
      expect(isSameOrg('org-123', 'org-1234')).toBe(false);
      expect(isSameOrg('org-123', 'org-12')).toBe(false);
      expect(isSameOrg('org-123', 'rg-123')).toBe(false);
    });

    it('is case sensitive for org IDs', () => {
      expect(isSameOrg('ORG-123', 'org-123')).toBe(false);
    });

    it('handles whitespace in org IDs correctly', () => {
      expect(isSameOrg('org-123', ' org-123')).toBe(false);
      expect(isSameOrg('org-123', 'org-123 ')).toBe(false);
      expect(isSameOrg(' org-123', 'org-123')).toBe(false);
    });
  });

  describe('User ownership protection', () => {
    it('is case sensitive for user IDs', () => {
      expect(isOwner('USER-123', 'user-123')).toBe(false);
    });

    it('handles whitespace in user IDs correctly', () => {
      expect(isOwner('user-123', ' user-123')).toBe(false);
      expect(isOwner('user-123', 'user-123 ')).toBe(false);
    });
  });

  describe('Role-based access control', () => {
    it('only allows exact admin roles', () => {
      // These should NOT be admin
      expect(isAdmin('ADMINISTRATOR')).toBe(false);
      expect(isAdmin('ADMIN')).toBe(false);
      expect(isAdmin('PROJECT_MANAGER')).toBe(false);
      expect(isAdmin('SUPER_ADMIN')).toBe(false);
    });

    it('handles role injection attempts', () => {
      expect(isAdmin('OWNER; DROP TABLE users;')).toBe(false);
      expect(isAdmin('OWNER\nPM')).toBe(false);
      expect(isAdmin('OWNER,PM')).toBe(false);
    });
  });

  describe('Combined access checks', () => {
    it('requires both auth and org match for resource access', () => {
      const user = createMockUser();
      // Authenticated but wrong org
      expect(canAccessResource(user, 'org-1', 'org-2')).toBe(false);
      // Right org but not authenticated
      expect(canAccessResource(null, 'org-1', 'org-1')).toBe(false);
      // Both conditions met
      expect(canAccessResource(user, 'org-1', 'org-1')).toBe(true);
    });

    it('allows modify with either ownership OR admin role', () => {
      // Owner but not admin
      expect(canModifyResource('user-1', 'user-1', 'CLIENT')).toBe(true);
      // Admin but not owner
      expect(canModifyResource('user-1', 'user-2', 'OWNER')).toBe(true);
      // Neither owner nor admin
      expect(canModifyResource('user-1', 'user-2', 'CLIENT')).toBe(false);
    });
  });
});
