/**
 * Role Utilities Test Suite
 *
 * Tests the single source of truth for role-to-path mapping,
 * portal access, and role-to-impersonation mapping.
 *
 * Pure function tests — no mocking required.
 */

import {
  ROLE_DEFAULT_PATHS,
  PORTAL_ROLES,
  getDefaultPathForRole,
  getRolesForPortal,
  canAccessPortal,
  mapUserRoleToImpersonationRole,
} from '@/lib/auth/role-utils';
import { UserRole } from '@/types';

const ALL_ROLES: UserRole[] = ['OWNER', 'PM', 'EMPLOYEE', 'CONTRACTOR', 'SUB', 'CLIENT'];

describe('ROLE_DEFAULT_PATHS', () => {
  it('maps all 6 UserRole values', () => {
    expect(Object.keys(ROLE_DEFAULT_PATHS)).toHaveLength(6);
    for (const role of ALL_ROLES) {
      expect(ROLE_DEFAULT_PATHS[role]).toBeDefined();
    }
  });

  it('maps OWNER to /dashboard', () => {
    expect(ROLE_DEFAULT_PATHS.OWNER).toBe('/dashboard');
  });

  it('maps PM to /dashboard', () => {
    expect(ROLE_DEFAULT_PATHS.PM).toBe('/dashboard');
  });

  it('maps EMPLOYEE to /field', () => {
    expect(ROLE_DEFAULT_PATHS.EMPLOYEE).toBe('/field');
  });

  it('maps CONTRACTOR to /field', () => {
    expect(ROLE_DEFAULT_PATHS.CONTRACTOR).toBe('/field');
  });

  it('maps SUB to /sub', () => {
    expect(ROLE_DEFAULT_PATHS.SUB).toBe('/sub');
  });

  it('maps CLIENT to /client', () => {
    expect(ROLE_DEFAULT_PATHS.CLIENT).toBe('/client');
  });

  it('all paths start with /', () => {
    for (const path of Object.values(ROLE_DEFAULT_PATHS)) {
      expect(path).toMatch(/^\//);
    }
  });
});

describe('PORTAL_ROLES', () => {
  it('defines 4 portals', () => {
    expect(Object.keys(PORTAL_ROLES)).toHaveLength(4);
    expect(PORTAL_ROLES).toHaveProperty('dashboard');
    expect(PORTAL_ROLES).toHaveProperty('field');
    expect(PORTAL_ROLES).toHaveProperty('client');
    expect(PORTAL_ROLES).toHaveProperty('sub');
  });

  it('dashboard allows OWNER, PM, EMPLOYEE, CONTRACTOR', () => {
    expect(PORTAL_ROLES.dashboard).toEqual(
      expect.arrayContaining(['OWNER', 'PM', 'EMPLOYEE', 'CONTRACTOR'])
    );
    expect(PORTAL_ROLES.dashboard).toHaveLength(4);
  });

  it('dashboard does not allow CLIENT or SUB', () => {
    expect(PORTAL_ROLES.dashboard).not.toContain('CLIENT');
    expect(PORTAL_ROLES.dashboard).not.toContain('SUB');
  });

  it('field allows OWNER, PM, EMPLOYEE, CONTRACTOR, SUB', () => {
    expect(PORTAL_ROLES.field).toEqual(
      expect.arrayContaining(['OWNER', 'PM', 'EMPLOYEE', 'CONTRACTOR', 'SUB'])
    );
    expect(PORTAL_ROLES.field).toHaveLength(5);
  });

  it('field does not allow CLIENT', () => {
    expect(PORTAL_ROLES.field).not.toContain('CLIENT');
  });

  it('client allows only CLIENT', () => {
    expect(PORTAL_ROLES.client).toEqual(['CLIENT']);
    expect(PORTAL_ROLES.client).toHaveLength(1);
  });

  it('sub allows only SUB', () => {
    expect(PORTAL_ROLES.sub).toEqual(['SUB']);
    expect(PORTAL_ROLES.sub).toHaveLength(1);
  });

  it('every role appears in at least one portal', () => {
    const allPortalRoles = new Set(Object.values(PORTAL_ROLES).flat());
    for (const role of ALL_ROLES) {
      expect(allPortalRoles).toContain(role);
    }
  });
});

describe('getDefaultPathForRole', () => {
  it('returns /dashboard for OWNER', () => {
    expect(getDefaultPathForRole('OWNER')).toBe('/dashboard');
  });

  it('returns /dashboard for PM', () => {
    expect(getDefaultPathForRole('PM')).toBe('/dashboard');
  });

  it('returns /field for EMPLOYEE', () => {
    expect(getDefaultPathForRole('EMPLOYEE')).toBe('/field');
  });

  it('returns /field for CONTRACTOR', () => {
    expect(getDefaultPathForRole('CONTRACTOR')).toBe('/field');
  });

  it('returns /sub for SUB', () => {
    expect(getDefaultPathForRole('SUB')).toBe('/sub');
  });

  it('returns /client for CLIENT', () => {
    expect(getDefaultPathForRole('CLIENT')).toBe('/client');
  });

  it('returns /login for unknown role', () => {
    expect(getDefaultPathForRole('UNKNOWN' as UserRole)).toBe('/login');
  });

  it('returns /login for empty string role', () => {
    expect(getDefaultPathForRole('' as UserRole)).toBe('/login');
  });

  it('matches ROLE_DEFAULT_PATHS for all valid roles', () => {
    for (const role of ALL_ROLES) {
      expect(getDefaultPathForRole(role)).toBe(ROLE_DEFAULT_PATHS[role]);
    }
  });
});

describe('getRolesForPortal', () => {
  it('returns correct roles for dashboard', () => {
    expect(getRolesForPortal('dashboard')).toEqual(['OWNER', 'PM', 'EMPLOYEE', 'CONTRACTOR']);
  });

  it('returns correct roles for field', () => {
    expect(getRolesForPortal('field')).toEqual(['OWNER', 'PM', 'EMPLOYEE', 'CONTRACTOR', 'SUB']);
  });

  it('returns correct roles for client', () => {
    expect(getRolesForPortal('client')).toEqual(['CLIENT']);
  });

  it('returns correct roles for sub', () => {
    expect(getRolesForPortal('sub')).toEqual(['SUB']);
  });

  it('returns empty array for unknown portal', () => {
    expect(getRolesForPortal('admin')).toEqual([]);
  });

  it('returns empty array for empty string portal', () => {
    expect(getRolesForPortal('')).toEqual([]);
  });

  it('is case-sensitive (uppercase portal returns empty)', () => {
    expect(getRolesForPortal('Dashboard')).toEqual([]);
    expect(getRolesForPortal('FIELD')).toEqual([]);
  });
});

describe('canAccessPortal', () => {
  describe('dashboard portal access', () => {
    it('allows OWNER', () => {
      expect(canAccessPortal('OWNER', 'dashboard')).toBe(true);
    });

    it('allows PM', () => {
      expect(canAccessPortal('PM', 'dashboard')).toBe(true);
    });

    it('allows EMPLOYEE', () => {
      expect(canAccessPortal('EMPLOYEE', 'dashboard')).toBe(true);
    });

    it('allows CONTRACTOR', () => {
      expect(canAccessPortal('CONTRACTOR', 'dashboard')).toBe(true);
    });

    it('denies SUB', () => {
      expect(canAccessPortal('SUB', 'dashboard')).toBe(false);
    });

    it('denies CLIENT', () => {
      expect(canAccessPortal('CLIENT', 'dashboard')).toBe(false);
    });
  });

  describe('field portal access', () => {
    it('allows OWNER', () => {
      expect(canAccessPortal('OWNER', 'field')).toBe(true);
    });

    it('allows PM', () => {
      expect(canAccessPortal('PM', 'field')).toBe(true);
    });

    it('allows EMPLOYEE', () => {
      expect(canAccessPortal('EMPLOYEE', 'field')).toBe(true);
    });

    it('allows CONTRACTOR', () => {
      expect(canAccessPortal('CONTRACTOR', 'field')).toBe(true);
    });

    it('allows SUB', () => {
      expect(canAccessPortal('SUB', 'field')).toBe(true);
    });

    it('denies CLIENT', () => {
      expect(canAccessPortal('CLIENT', 'field')).toBe(false);
    });
  });

  describe('client portal access', () => {
    it('allows CLIENT', () => {
      expect(canAccessPortal('CLIENT', 'client')).toBe(true);
    });

    it('denies OWNER', () => {
      expect(canAccessPortal('OWNER', 'client')).toBe(false);
    });

    it('denies PM', () => {
      expect(canAccessPortal('PM', 'client')).toBe(false);
    });

    it('denies EMPLOYEE', () => {
      expect(canAccessPortal('EMPLOYEE', 'client')).toBe(false);
    });

    it('denies CONTRACTOR', () => {
      expect(canAccessPortal('CONTRACTOR', 'client')).toBe(false);
    });

    it('denies SUB', () => {
      expect(canAccessPortal('SUB', 'client')).toBe(false);
    });
  });

  describe('sub portal access', () => {
    it('allows SUB', () => {
      expect(canAccessPortal('SUB', 'sub')).toBe(true);
    });

    it('denies OWNER', () => {
      expect(canAccessPortal('OWNER', 'sub')).toBe(false);
    });

    it('denies PM', () => {
      expect(canAccessPortal('PM', 'sub')).toBe(false);
    });

    it('denies EMPLOYEE', () => {
      expect(canAccessPortal('EMPLOYEE', 'sub')).toBe(false);
    });

    it('denies CONTRACTOR', () => {
      expect(canAccessPortal('CONTRACTOR', 'sub')).toBe(false);
    });

    it('denies CLIENT', () => {
      expect(canAccessPortal('CLIENT', 'sub')).toBe(false);
    });
  });

  describe('unknown portal', () => {
    it('denies all roles for unknown portal', () => {
      for (const role of ALL_ROLES) {
        expect(canAccessPortal(role, 'nonexistent')).toBe(false);
      }
    });

    it('denies access for empty portal string', () => {
      expect(canAccessPortal('OWNER', '')).toBe(false);
    });
  });

  describe('cross-portal isolation', () => {
    it('CLIENT cannot access any portal except client', () => {
      expect(canAccessPortal('CLIENT', 'dashboard')).toBe(false);
      expect(canAccessPortal('CLIENT', 'field')).toBe(false);
      expect(canAccessPortal('CLIENT', 'sub')).toBe(false);
      expect(canAccessPortal('CLIENT', 'client')).toBe(true);
    });

    it('SUB can only access field and sub portals', () => {
      expect(canAccessPortal('SUB', 'dashboard')).toBe(false);
      expect(canAccessPortal('SUB', 'field')).toBe(true);
      expect(canAccessPortal('SUB', 'sub')).toBe(true);
      expect(canAccessPortal('SUB', 'client')).toBe(false);
    });

    it('OWNER can access dashboard and field but not client or sub', () => {
      expect(canAccessPortal('OWNER', 'dashboard')).toBe(true);
      expect(canAccessPortal('OWNER', 'field')).toBe(true);
      expect(canAccessPortal('OWNER', 'client')).toBe(false);
      expect(canAccessPortal('OWNER', 'sub')).toBe(false);
    });
  });
});

describe('mapUserRoleToImpersonationRole', () => {
  it('maps OWNER to owner', () => {
    expect(mapUserRoleToImpersonationRole('OWNER')).toBe('owner');
  });

  it('maps PM to project_manager', () => {
    expect(mapUserRoleToImpersonationRole('PM')).toBe('project_manager');
  });

  it('maps EMPLOYEE to employee', () => {
    expect(mapUserRoleToImpersonationRole('EMPLOYEE')).toBe('employee');
  });

  it('maps CONTRACTOR to contractor', () => {
    expect(mapUserRoleToImpersonationRole('CONTRACTOR')).toBe('contractor');
  });

  it('maps SUB to contractor', () => {
    expect(mapUserRoleToImpersonationRole('SUB')).toBe('contractor');
  });

  it('maps CLIENT to client', () => {
    expect(mapUserRoleToImpersonationRole('CLIENT')).toBe('client');
  });

  it('defaults to employee for unknown role', () => {
    expect(mapUserRoleToImpersonationRole('UNKNOWN' as UserRole)).toBe('employee');
  });

  it('CONTRACTOR and SUB both map to the same impersonation role', () => {
    expect(mapUserRoleToImpersonationRole('CONTRACTOR')).toBe(
      mapUserRoleToImpersonationRole('SUB')
    );
  });

  it('every valid role produces a defined impersonation role', () => {
    for (const role of ALL_ROLES) {
      const result = mapUserRoleToImpersonationRole(role);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    }
  });

  it('produces only valid ImpersonationRole values', () => {
    const validImpersonationRoles = [
      'owner',
      'project_manager',
      'finance',
      'employee',
      'contractor',
      'client',
      'assistant',
    ];
    for (const role of ALL_ROLES) {
      expect(validImpersonationRoles).toContain(mapUserRoleToImpersonationRole(role));
    }
  });
});

describe('Consistency checks', () => {
  it('every role default path leads to a portal that allows the role', () => {
    for (const role of ALL_ROLES) {
      const defaultPath = ROLE_DEFAULT_PATHS[role];
      // Extract portal name from path (e.g., '/dashboard' -> 'dashboard')
      const portal = defaultPath.replace('/', '');
      expect(canAccessPortal(role, portal)).toBe(true);
    }
  });

  it('ROLE_DEFAULT_PATHS and getDefaultPathForRole return the same values', () => {
    for (const role of ALL_ROLES) {
      expect(getDefaultPathForRole(role)).toBe(ROLE_DEFAULT_PATHS[role]);
    }
  });

  it('getRolesForPortal and canAccessPortal are consistent', () => {
    const portals = Object.keys(PORTAL_ROLES);
    for (const portal of portals) {
      const allowedRoles = getRolesForPortal(portal);
      for (const role of ALL_ROLES) {
        if (allowedRoles.includes(role)) {
          expect(canAccessPortal(role, portal)).toBe(true);
        } else {
          expect(canAccessPortal(role, portal)).toBe(false);
        }
      }
    }
  });
});
