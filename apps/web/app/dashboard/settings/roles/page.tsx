"use client";

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Card, Badge, Button, toast } from '@/components/ui';
import { PermissionGuard, useCanAccess } from '@/components/auth';
import { useAuditLog } from '@/lib/hooks/useAuditLog';
import {
  ROLE_PERMISSIONS,
  ImpersonationRole,
  RolePermissions,
  IMPERSONATION_ROLE_INFO,
} from '@/types';
import {
  ShieldCheckIcon,
  UserGroupIcon,
  CheckIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { AUDIT_EVENT_LABELS, SEVERITY_CONFIG, AuditLogEntry } from '@/lib/audit';

// Permission category groupings for display
const PERMISSION_CATEGORIES: {
  name: string;
  permissions: (keyof RolePermissions)[];
}[] = [
  {
    name: 'Projects',
    permissions: [
      'canViewAllProjects',
      'canViewAssignedProjects',
      'canCreateProjects',
      'canEditProjects',
      'canDeleteProjects',
    ],
  },
  {
    name: 'Tasks',
    permissions: [
      'canViewAllTasks',
      'canViewAssignedTasks',
      'canCreateTasks',
      'canEditTasks',
      'canDeleteTasks',
      'canAssignTasks',
    ],
  },
  {
    name: 'Finances',
    permissions: [
      'canViewAllFinances',
      'canViewAssignedFinances',
      'canManageExpenses',
      'canManageInvoices',
      'canApproveBudgets',
    ],
  },
  {
    name: 'Team',
    permissions: [
      'canViewTeam',
      'canInviteUsers',
      'canEditUsers',
      'canRemoveUsers',
      'canChangeRoles',
    ],
  },
  {
    name: 'Time Tracking',
    permissions: [
      'canClockInOut',
      'canViewOwnTime',
      'canViewTeamTime',
      'canEditOwnTime',
      'canEditTeamTime',
      'canApproveTimesheets',
    ],
  },
  {
    name: 'Clients',
    permissions: [
      'canViewClients',
      'canCreateClients',
      'canEditClients',
      'canDeleteClients',
    ],
  },
  {
    name: 'Documents',
    permissions: [
      'canViewDocuments',
      'canCreateDocuments',
      'canEditDocuments',
      'canApproveDocuments',
    ],
  },
  {
    name: 'Reports',
    permissions: [
      'canViewProjectReports',
      'canViewCompanyReports',
      'canExportReports',
    ],
  },
  {
    name: 'Settings',
    permissions: [
      'canViewSettings',
      'canEditOrganization',
      'canManageTemplates',
      'canManageIntegrations',
      'canManageRoles',
    ],
  },
];

// Readable permission names
const PERMISSION_LABELS: Record<keyof RolePermissions, string> = {
  canViewAllProjects: 'View All Projects',
  canViewAssignedProjects: 'View Assigned Projects',
  canCreateProjects: 'Create Projects',
  canEditProjects: 'Edit Projects',
  canDeleteProjects: 'Delete Projects',
  canViewAllFinances: 'View All Finances',
  canViewAssignedFinances: 'View Assigned Finances',
  canManageExpenses: 'Manage Expenses',
  canManageInvoices: 'Manage Invoices',
  canApproveBudgets: 'Approve Budgets',
  canViewTeam: 'View Team',
  canInviteUsers: 'Invite Users',
  canEditUsers: 'Edit Users',
  canRemoveUsers: 'Remove Users',
  canChangeRoles: 'Change Roles',
  canClockInOut: 'Clock In/Out',
  canViewOwnTime: 'View Own Time',
  canViewTeamTime: 'View Team Time',
  canEditOwnTime: 'Edit Own Time',
  canEditTeamTime: 'Edit Team Time',
  canApproveTimesheets: 'Approve Timesheets',
  canViewAssignedTasks: 'View Assigned Tasks',
  canViewAllTasks: 'View All Tasks',
  canCreateTasks: 'Create Tasks',
  canEditTasks: 'Edit Tasks',
  canDeleteTasks: 'Delete Tasks',
  canAssignTasks: 'Assign Tasks',
  canViewClients: 'View Clients',
  canCreateClients: 'Create Clients',
  canEditClients: 'Edit Clients',
  canDeleteClients: 'Delete Clients',
  canViewDocuments: 'View Documents',
  canCreateDocuments: 'Create Documents',
  canEditDocuments: 'Edit Documents',
  canApproveDocuments: 'Approve Documents',
  canViewProjectReports: 'View Project Reports',
  canViewCompanyReports: 'View Company Reports',
  canExportReports: 'Export Reports',
  canViewSettings: 'View Settings',
  canEditOrganization: 'Edit Organization',
  canManageTemplates: 'Manage Templates',
  canManageIntegrations: 'Manage Integrations',
  canManageRoles: 'Manage Roles',
  canImpersonate: 'Impersonate Roles',
};

// Roles to display in the matrix
const DISPLAY_ROLES: ImpersonationRole[] = [
  'owner',
  'project_manager',
  'finance',
  'employee',
  'contractor',
  'client',
];

// Role display configuration
const ROLE_DISPLAY: Record<ImpersonationRole, { label: string; color: string }> = {
  owner: { label: 'Owner', color: 'bg-purple-100 text-purple-800' },
  project_manager: { label: 'Project Manager', color: 'bg-blue-100 text-blue-800' },
  finance: { label: 'Finance', color: 'bg-green-100 text-green-800' },
  employee: { label: 'Employee', color: 'bg-gray-100 text-gray-800' },
  contractor: { label: 'Contractor', color: 'bg-orange-100 text-orange-800' },
  client: { label: 'Client', color: 'bg-teal-100 text-teal-800' },
  assistant: { label: 'Assistant', color: 'bg-pink-100 text-pink-800' },
};

export default function RolesPermissionsPage() {
  const { profile } = useAuth();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'matrix' | 'audit'>('matrix');
  const canManageRoles = useCanAccess('canManageRoles');

  const { entries: auditEntries, loading: auditLoading } = useAuditLog({
    limit: 50,
  });

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedCategories(new Set(PERMISSION_CATEGORIES.map((c) => c.name)));
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Roles & Permissions</h2>
          <p className="text-sm text-gray-500">
            View role capabilities and permission assignments.
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('matrix')}
            className={cn(
              'pb-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'matrix'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            <ShieldCheckIcon className="h-4 w-4 inline-block mr-1.5" />
            Permission Matrix
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={cn(
              'pb-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'audit'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            <ClockIcon className="h-4 w-4 inline-block mr-1.5" />
            Audit Log
          </button>
        </nav>
      </div>

      {activeTab === 'matrix' ? (
        <>
          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <InformationCircleIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">Role-Based Access Control</p>
                <p className="text-sm text-blue-700 mt-1">
                  Permissions are determined by user roles. Each role has a predefined set of
                  capabilities. Contact your administrator to change a user&apos;s role.
                </p>
              </div>
            </div>
          </div>

          {/* Role Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {DISPLAY_ROLES.map((role) => {
              const info = IMPERSONATION_ROLE_INFO[role];
              const display = ROLE_DISPLAY[role];
              const permissions = ROLE_PERMISSIONS[role];
              const enabledCount = Object.values(permissions).filter(Boolean).length;
              const totalCount = Object.keys(permissions).length;
              // Admin roles are those that can manage roles/team
              const isAdminRole = permissions.canManageRoles || permissions.canChangeRoles;

              return (
                <Card key={role} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={cn('px-2 py-1 text-xs font-medium rounded-full', display.color)}>
                        {display.label}
                      </span>
                      {isAdminRole && (
                        <Badge variant="warning" size="sm" className="ml-2">
                          Admin
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-semibold text-gray-900">{enabledCount}</span>
                      <span className="text-sm text-gray-500">/{totalCount}</span>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{info.description}</p>
                  <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${(enabledCount / totalCount) * 100}%` }}
                    />
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Permission Matrix */}
          <Card className="overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Permission Matrix</h3>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={expandAll}>
                  Expand All
                </Button>
                <Button variant="ghost" size="sm" onClick={collapseAll}>
                  Collapse All
                </Button>
              </div>
            </div>

            {/* Matrix Header */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 w-64">
                      Permission
                    </th>
                    {DISPLAY_ROLES.map((role) => (
                      <th
                        key={role}
                        className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-2 py-3"
                      >
                        <span className={cn('px-2 py-0.5 rounded-full text-[10px]', ROLE_DISPLAY[role].color)}>
                          {ROLE_DISPLAY[role].label}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {PERMISSION_CATEGORIES.map((category) => {
                    const isExpanded = expandedCategories.has(category.name);

                    return (
                      <React.Fragment key={category.name}>
                        {/* Category Header Row */}
                        <tr
                          className="bg-gray-50 cursor-pointer hover:bg-gray-100"
                          onClick={() => toggleCategory(category.name)}
                        >
                          <td className="px-4 py-2 font-medium text-gray-900 flex items-center gap-2" colSpan={1}>
                            {isExpanded ? (
                              <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                            )}
                            {category.name}
                            <span className="text-xs text-gray-400 font-normal">
                              ({category.permissions.length})
                            </span>
                          </td>
                          {DISPLAY_ROLES.map((role) => {
                            const permissions = ROLE_PERMISSIONS[role];
                            const enabledInCategory = category.permissions.filter(
                              (p) => permissions[p]
                            ).length;
                            return (
                              <td key={role} className="text-center px-2 py-2">
                                <span className="text-xs text-gray-500">
                                  {enabledInCategory}/{category.permissions.length}
                                </span>
                              </td>
                            );
                          })}
                        </tr>

                        {/* Permission Rows (when expanded) */}
                        {isExpanded &&
                          category.permissions.map((permission) => (
                            <tr key={permission} className="hover:bg-gray-50">
                              <td className="px-4 py-2 pl-10 text-sm text-gray-600">
                                {PERMISSION_LABELS[permission]}
                              </td>
                              {DISPLAY_ROLES.map((role) => {
                                const hasPermission = ROLE_PERMISSIONS[role][permission];
                                return (
                                  <td key={role} className="text-center px-2 py-2">
                                    {hasPermission ? (
                                      <CheckIcon className="h-4 w-4 text-green-600 mx-auto" />
                                    ) : (
                                      <XMarkIcon className="h-4 w-4 text-gray-300 mx-auto" />
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Legend */}
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <CheckIcon className="h-4 w-4 text-green-600" />
              <span>Permission granted</span>
            </div>
            <div className="flex items-center gap-1.5">
              <XMarkIcon className="h-4 w-4 text-gray-300" />
              <span>Permission denied</span>
            </div>
          </div>
        </>
      ) : (
        /* Audit Log Tab */
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Security Audit Log</p>
                <p className="text-sm text-amber-700 mt-1">
                  This log tracks security-sensitive actions including role changes, user management,
                  and access events. Logs are retained for 90 days.
                </p>
              </div>
            </div>
          </div>

          {auditLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : auditEntries.length === 0 ? (
            <Card className="p-8 text-center">
              <ClockIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No audit events yet</h3>
              <p className="text-sm text-gray-500 mt-1">
                Security-sensitive actions will be logged here.
              </p>
            </Card>
          ) : (
            <Card className="divide-y divide-gray-100">
              {auditEntries.map((entry) => (
                <AuditLogRow key={entry.id} entry={entry} />
              ))}
            </Card>
          )}
        </div>
      )}

      {/* Not Admin Notice */}
      {!canManageRoles && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ShieldCheckIcon className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-600">View Only</p>
              <p className="text-sm text-gray-500 mt-1">
                You can view the permission matrix but cannot modify roles. Contact your
                organization owner to request role changes.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AuditLogRow({ entry }: { entry: AuditLogEntry }) {
  const severityConfig = SEVERITY_CONFIG[entry.severity];

  return (
    <div className="p-4 hover:bg-gray-50">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Badge
              variant={entry.severity === 'critical' ? 'danger' : entry.severity === 'warning' ? 'warning' : 'default'}
              size="sm"
            >
              {AUDIT_EVENT_LABELS[entry.type] || entry.type}
            </Badge>
            <span className="text-xs text-gray-400">
              {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-900">{entry.message}</p>
          <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
            <span>By: {entry.actorName}</span>
            {entry.targetUserName && <span>Target: {entry.targetUserName}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
