'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  ImpersonationRole,
  RolePermissions,
  ROLE_PERMISSIONS,
  IMPERSONATION_ROLE_INFO,
  UserRole,
} from '@/types';
import { useAuth } from '@/lib/auth';
import { mapUserRoleToImpersonationRole } from '@/lib/auth/role-utils';

// ============================================
// Types
// ============================================

interface ImpersonationState {
  isImpersonating: boolean;
  actualUserId: string | null;
  actualUserRole: UserRole | null;
  impersonatedRole: ImpersonationRole;
  startedAt: Date | null;
}

interface ImpersonationContextValue {
  // State
  state: ImpersonationState;
  isImpersonating: boolean;
  currentRole: ImpersonationRole;

  // Actions
  switchRole: (role: ImpersonationRole) => void;
  resetImpersonation: () => void;

  // Permissions
  permissions: RolePermissions;
  hasPermission: (permission: keyof RolePermissions) => boolean;

  // UI Helpers
  canImpersonate: boolean;
  roleInfo: typeof IMPERSONATION_ROLE_INFO;
}

const STORAGE_KEY = 'contractoros_impersonation';
const AUTO_EXPIRE_HOURS = 2;

// ============================================
// Context
// ============================================

const ImpersonationContext = createContext<ImpersonationContextValue | null>(null);

// ============================================
// Provider
// ============================================

export function ImpersonationProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();

  const [state, setState] = useState<ImpersonationState>({
    isImpersonating: false,
    actualUserId: null,
    actualUserRole: null,
    impersonatedRole: 'owner',
    startedAt: null,
  });

  // Determine if user can impersonate (only OWNER and PM roles)
  const canImpersonate = profile?.role === 'OWNER' || profile?.role === 'PM';

  // Load saved impersonation state from sessionStorage
  useEffect(() => {
    if (typeof window === 'undefined' || !user || !profile) return;

    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const startedAt = new Date(parsed.startedAt);

        // Check if expired (2 hours)
        const hoursElapsed = (Date.now() - startedAt.getTime()) / (1000 * 60 * 60);
        if (hoursElapsed > AUTO_EXPIRE_HOURS) {
          sessionStorage.removeItem(STORAGE_KEY);
          return;
        }

        // Validate user is the same
        if (parsed.actualUserId === user.uid && canImpersonate) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- initialization from sessionStorage on mount
          setState({
            isImpersonating: true,
            actualUserId: parsed.actualUserId,
            actualUserRole: parsed.actualUserRole,
            impersonatedRole: parsed.impersonatedRole,
            startedAt,
          });
        } else {
          sessionStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [user, profile, canImpersonate]);

  // Reset to actual user role (defined before switchRole since switchRole calls it)
  const resetImpersonation = useCallback(() => {
    if (state.isImpersonating) {
      console.log(`[Impersonation] User ${state.actualUserId} exited impersonation mode`);
    }

    setState({
      isImpersonating: false,
      actualUserId: null,
      actualUserRole: null,
      impersonatedRole: 'owner',
      startedAt: null,
    });

    sessionStorage.removeItem(STORAGE_KEY);
  }, [state.actualUserId, state.isImpersonating]);

  // Switch to a different role
  const switchRole = useCallback((role: ImpersonationRole) => {
    if (!user || !profile || !canImpersonate) {
      console.warn('Cannot impersonate: insufficient permissions');
      return;
    }

    // If switching to owner and we're currently owner, reset
    if (role === 'owner' && mapUserRoleToImpersonationRole(profile.role) === 'owner') {
      resetImpersonation();
      return;
    }

    const newState: ImpersonationState = {
      isImpersonating: true,
      actualUserId: user.uid,
      actualUserRole: profile.role,
      impersonatedRole: role,
      startedAt: new Date(),
    };

    setState(newState);

    // Persist to sessionStorage
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...newState,
      startedAt: newState.startedAt?.toISOString(),
    }));

    // Log impersonation event (could send to analytics/audit log)
    console.log(`[Impersonation] User ${user.uid} switched to ${role} view`);
  }, [user, profile, canImpersonate, resetImpersonation]);

  // Get current effective role
  const currentRole: ImpersonationRole = state.isImpersonating
    ? state.impersonatedRole
    : mapUserRoleToImpersonationRole(profile?.role || 'EMPLOYEE');

  // Get permissions for current role
  const permissions = ROLE_PERMISSIONS[currentRole];

  // Check specific permission
  const hasPermission = useCallback((permission: keyof RolePermissions): boolean => {
    return permissions[permission] === true;
  }, [permissions]);

  const value: ImpersonationContextValue = {
    state,
    isImpersonating: state.isImpersonating,
    currentRole,
    switchRole,
    resetImpersonation,
    permissions,
    hasPermission,
    canImpersonate,
    roleInfo: IMPERSONATION_ROLE_INFO,
  };

  return (
    <ImpersonationContext.Provider value={value}>
      {children}
    </ImpersonationContext.Provider>
  );
}

// ============================================
// Hook
// ============================================

export function useImpersonation(): ImpersonationContextValue {
  const context = useContext(ImpersonationContext);
  if (!context) {
    throw new Error('useImpersonation must be used within ImpersonationProvider');
  }
  return context;
}

// ============================================
// Permissions Hook (convenience)
// ============================================

export function usePermissions(): RolePermissions {
  const { permissions } = useImpersonation();
  return permissions;
}

export function useHasPermission(permission: keyof RolePermissions): boolean {
  const { hasPermission } = useImpersonation();
  return hasPermission(permission);
}

