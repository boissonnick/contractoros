"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { Card, Button, Badge, toast, EmptyState } from '@/components/ui';
import { UserProfile, UserRole, OffboardingRecord, OffboardingReport } from '@/types';
import { InviteUserModal, OnboardingChecklist, OffboardingWizard } from '@/components/team';
import { getRestorableUsers, restoreUser } from '@/lib/offboarding/user-offboarding';
import { useInvitations } from '@/lib/hooks/useInvitations';
import { useAuditLogger } from '@/lib/hooks/useAuditLog';
import {
  UserGroupIcon,
  ShieldCheckIcon,
  UserIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon,
  EnvelopeIcon,
  StarIcon,
  WrenchScrewdriverIcon,
  BriefcaseIcon,
  UserPlusIcon,
  ClockIcon,
  ArrowPathIcon,
  NoSymbolIcon,
  RocketLaunchIcon,
  UserMinusIcon,
  ArchiveBoxIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

// Role configuration (using actual UserRole type from types/index.ts)
const ROLE_CONFIG: Record<UserRole, {
  label: string;
  description: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
  permissions: string[];
}> = {
  OWNER: {
    label: 'Owner',
    description: 'Full access to all features including billing and team management',
    color: 'bg-purple-100 text-purple-800',
    icon: StarIcon,
    permissions: ['All features', 'Billing management', 'Team management', 'Delete organization'],
  },
  PM: {
    label: 'Project Manager',
    description: 'Manage projects, clients, and team members',
    color: 'bg-blue-100 text-blue-800',
    icon: BriefcaseIcon,
    permissions: ['Create/edit projects', 'Manage clients', 'View reports', 'Send invoices'],
  },
  EMPLOYEE: {
    label: 'Employee',
    description: 'W2 employee with assigned work access',
    color: 'bg-gray-100 text-gray-800',
    icon: UserIcon,
    permissions: ['View assigned work', 'Clock in/out', 'View schedule', 'Upload photos'],
  },
  CONTRACTOR: {
    label: 'Contractor',
    description: '1099 contractor with project access',
    color: 'bg-orange-100 text-orange-800',
    icon: WrenchScrewdriverIcon,
    permissions: ['View assigned tasks', 'Update task status', 'Upload photos', 'Log time'],
  },
  SUB: {
    label: 'Subcontractor',
    description: 'External subcontractor with limited access',
    color: 'bg-yellow-100 text-yellow-800',
    icon: WrenchScrewdriverIcon,
    permissions: ['View assigned work', 'Submit invoices', 'Upload documents'],
  },
  CLIENT: {
    label: 'Client',
    description: 'Customer with portal access',
    color: 'bg-teal-100 text-teal-800',
    icon: UserIcon,
    permissions: ['View project status', 'Approve estimates', 'Make payments', 'View documents'],
  },
};

// Roles that can be assigned to team members (excluding CLIENT)
const ASSIGNABLE_ROLES: UserRole[] = ['PM', 'EMPLOYEE', 'CONTRACTOR'];

interface TeamMember extends UserProfile {
  id: string;
}

type MemberStatus = 'active' | 'inactive';

export default function TeamContent() {
  const { profile } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('EMPLOYEE');
  const [saving, setSaving] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'members' | 'invitations' | 'onboarding' | 'offboarded'>('members');

  // Offboarding state
  const [showOffboardingWizard, setShowOffboardingWizard] = useState(false);
  const [offboardingTarget, setOffboardingTarget] = useState<{
    id: string;
    name: string;
    email: string;
    role: UserRole;
  } | null>(null);
  const [restorableUsers, setRestorableUsers] = useState<OffboardingRecord[]>([]);
  const [loadingRestorable, setLoadingRestorable] = useState(false);

  const {
    pendingInvitations,
    loading: loadingInvitations,
    sendInvitation,
    revokeInvitation,
    resendInvitation,
    isExpired,
  } = useInvitations();

  const {
    logRoleChange,
    logUserInvitation,
    logUserStatusChange,
  } = useAuditLogger();

  const isOwner = profile?.role === 'OWNER';
  const canManageTeam = profile?.role === 'OWNER' || profile?.role === 'PM';

  // Load team members
  useEffect(() => {
    if (!profile?.orgId) return;

    async function loadMembers() {
      try {
        const q = query(
          collection(db, 'users'),
          where('orgId', '==', profile!.orgId)
        );
        const snap = await getDocs(q);
        const rawData = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          createdAt: d.data().createdAt?.toDate() || new Date(),
        })) as unknown as TeamMember[];

        // Sort by role priority, then name
        const rolePriority: Record<UserRole, number> = {
          OWNER: 0,
          PM: 1,
          CONTRACTOR: 2,
          EMPLOYEE: 3,
          SUB: 4,
          CLIENT: 5,
        };

        const data = rawData
          .filter((m) => m.role !== 'CLIENT' && m.role !== 'SUB') // Filter out clients and subs
          .sort((a, b) => {
            const priorityDiff = (rolePriority[a.role] || 99) - (rolePriority[b.role] || 99);
            if (priorityDiff !== 0) return priorityDiff;
            return (a.displayName || '').localeCompare(b.displayName || '');
          });
        setMembers(data);
      } catch (err) {
        console.error('Error loading team:', err);
        toast.error('Failed to load team members');
      } finally {
        setLoading(false);
      }
    }

    loadMembers();
  }, [profile?.orgId]);

  // Load restorable (offboarded) users
  useEffect(() => {
    if (!profile?.orgId || !isOwner) return;

    async function loadRestorableUsers() {
      setLoadingRestorable(true);
      try {
        const users = await getRestorableUsers(profile!.orgId);
        setRestorableUsers(users);
      } catch (err) {
        console.error('Error loading restorable users:', err);
      } finally {
        setLoadingRestorable(false);
      }
    }

    loadRestorableUsers();
  }, [profile?.orgId, isOwner]);

  const startEditing = (member: TeamMember) => {
    if (!canManageTeam) return;
    if (member.role === 'OWNER' && !isOwner) return;
    setEditingId(member.id);
    setEditRole(member.role);
  };

  const handleSaveRole = async (memberId: string) => {
    if (!canManageTeam) return;
    setSaving(true);

    const member = members.find((m) => m.id === memberId);
    const previousRole = member?.role;

    try {
      await updateDoc(doc(db, 'users', memberId), {
        role: editRole,
        updatedAt: Timestamp.now(),
      });

      setMembers((prev) =>
        prev.map((m) =>
          m.id === memberId ? { ...m, role: editRole } : m
        )
      );
      setEditingId(null);
      toast.success('Role updated');

      // Log the role change
      if (member && previousRole && previousRole !== editRole) {
        await logRoleChange({
          target: {
            id: member.id,
            name: member.displayName || 'Unknown',
            email: member.email || '',
          },
          previousRole,
          newRole: editRole,
        });
      }
    } catch (err) {
      console.error('Error updating role:', err);
      toast.error('Failed to update role');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivateMember = async (member: TeamMember) => {
    if (!isOwner) {
      toast.error('Only organization owners can deactivate team members');
      return;
    }
    if (member.role === 'OWNER') {
      toast.error('Cannot deactivate the organization owner');
      return;
    }

    if (!confirm(`Deactivate ${member.displayName || member.email}? They will lose access but their data will be preserved.`)) {
      return;
    }

    try {
      await updateDoc(doc(db, 'users', member.id), {
        isActive: false,
        updatedAt: Timestamp.now(),
      });

      setMembers((prev) =>
        prev.map((m) =>
          m.id === member.id ? { ...m, isActive: false } : m
        )
      );
      toast.success('Team member deactivated');

      // Log the status change
      await logUserStatusChange(
        {
          id: member.id,
          name: member.displayName || 'Unknown',
          email: member.email || '',
        },
        'deactivated'
      );
    } catch (err) {
      console.error('Error deactivating member:', err);
      toast.error('Failed to deactivate team member');
    }
  };

  const handleReactivateMember = async (member: TeamMember) => {
    if (!isOwner) {
      toast.error('Only organization owners can reactivate team members');
      return;
    }

    try {
      await updateDoc(doc(db, 'users', member.id), {
        isActive: true,
        updatedAt: Timestamp.now(),
      });

      setMembers((prev) =>
        prev.map((m) =>
          m.id === member.id ? { ...m, isActive: true } : m
        )
      );
      toast.success('Team member reactivated');

      // Log the status change
      await logUserStatusChange(
        {
          id: member.id,
          name: member.displayName || 'Unknown',
          email: member.email || '',
        },
        'activated'
      );
    } catch (err) {
      console.error('Error reactivating member:', err);
      toast.error('Failed to reactivate team member');
    }
  };

  const handleRemoveMember = async (member: TeamMember) => {
    if (!isOwner) {
      toast.error('Only organization owners can remove team members');
      return;
    }
    if (member.role === 'OWNER') {
      toast.error('Cannot remove the organization owner');
      return;
    }

    if (!confirm(`Remove ${member.displayName || member.email} from the team? They will lose access to all organization data.`)) {
      return;
    }

    try {
      await updateDoc(doc(db, 'users', member.id), {
        orgId: null,
        role: null,
        updatedAt: Timestamp.now(),
      });

      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      toast.success('Team member removed');

      // Log the removal
      await logUserStatusChange(
        {
          id: member.id,
          name: member.displayName || 'Unknown',
          email: member.email || '',
        },
        'removed'
      );
    } catch (err) {
      console.error('Error removing member:', err);
      toast.error('Failed to remove team member');
    }
  };

  const handleInvite = async (email: string, role: UserRole, message?: string): Promise<boolean> => {
    const result = await sendInvitation(email, role, message);
    if (result) {
      // Log the invitation
      await logUserInvitation(email, role);
    }
    return result !== null;
  };

  // Offboarding handlers
  const handleStartOffboarding = (member: TeamMember) => {
    if (!isOwner) {
      toast.error('Only organization owners can offboard team members');
      return;
    }
    if (member.role === 'OWNER') {
      toast.error('Cannot offboard the organization owner');
      return;
    }

    setOffboardingTarget({
      id: member.id,
      name: member.displayName || 'Unknown User',
      email: member.email || '',
      role: member.role,
    });
    setShowOffboardingWizard(true);
  };

  const handleOffboardingComplete = (report: OffboardingReport) => {
    // Remove user from active members list
    setMembers((prev) => prev.filter((m) => m.id !== report.userId));

    // Refresh restorable users list
    if (profile?.orgId) {
      getRestorableUsers(profile.orgId).then(setRestorableUsers).catch(console.error);
    }

    // Log the offboarding (using 'deactivated' as the closest match)
    logUserStatusChange(
      {
        id: report.userId,
        name: report.userName,
        email: report.userEmail,
      },
      'deactivated'
    );
  };

  const handleRestoreUser = async (record: OffboardingRecord) => {
    if (!isOwner || !profile?.orgId || !profile?.uid) {
      toast.error('Only organization owners can restore users');
      return;
    }

    if (!confirm(`Restore ${record.userName}? They will regain access to the organization.`)) {
      return;
    }

    try {
      await restoreUser(record.id, profile.orgId, record.userId, profile.uid);

      // Refresh restorable users list
      const users = await getRestorableUsers(profile.orgId);
      setRestorableUsers(users);

      // Reload team members to show restored user
      const q = query(
        collection(db, 'users'),
        where('orgId', '==', profile.orgId)
      );
      const snap = await getDocs(q);
      const rawData = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate() || new Date(),
      })) as unknown as TeamMember[];

      const rolePriority: Record<UserRole, number> = {
        OWNER: 0, PM: 1, CONTRACTOR: 2, EMPLOYEE: 3, SUB: 4, CLIENT: 5,
      };
      const data = rawData
        .filter((m) => m.role !== 'CLIENT' && m.role !== 'SUB')
        .sort((a, b) => {
          const priorityDiff = (rolePriority[a.role] || 99) - (rolePriority[b.role] || 99);
          if (priorityDiff !== 0) return priorityDiff;
          return (a.displayName || '').localeCompare(b.displayName || '');
        });
      setMembers(data);

      toast.success('User restored successfully');

      // Log the restoration (using 'activated' as the closest match)
      await logUserStatusChange(
        {
          id: record.userId,
          name: record.userName,
          email: record.userEmail,
        },
        'activated'
      );
    } catch (err) {
      console.error('Error restoring user:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to restore user');
    }
  };

  const getMemberStatus = (member: TeamMember): MemberStatus => {
    if (member.isActive === false) return 'inactive';
    return 'active';
  };

  const getStatusBadge = (status: MemberStatus) => {
    switch (status) {
      case 'active':
        return <Badge variant="success" size="sm">Active</Badge>;
      case 'inactive':
        return <Badge variant="default" size="sm">Inactive</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeMembers = members.filter((m) => m.isActive !== false);
  const inactiveMembers = members.filter((m) => m.isActive === false);

  return (
    <div className="space-y-6">
      {/* Header with Invite Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Team Management</h2>
          <p className="text-sm text-gray-500">
            Manage team members, roles, and invitations.
          </p>
        </div>
        {canManageTeam && (
          <Button
            variant="primary"
            onClick={() => setShowInviteModal(true)}
          >
            <UserPlusIcon className="h-4 w-4 mr-1.5" />
            Invite User
          </Button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('members')}
            className={cn(
              'pb-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'members'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            Team Members ({members.length})
          </button>
          <button
            onClick={() => setActiveTab('invitations')}
            className={cn(
              'pb-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'invitations'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            Pending Invitations ({pendingInvitations.length})
          </button>
          <button
            onClick={() => setActiveTab('onboarding')}
            className={cn(
              'pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5',
              activeTab === 'onboarding'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            <RocketLaunchIcon className="h-4 w-4" />
            Onboarding
          </button>
          {isOwner && (
            <button
              onClick={() => setActiveTab('offboarded')}
              className={cn(
                'pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5',
                activeTab === 'offboarded'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              <ArchiveBoxIcon className="h-4 w-4" />
              Offboarded ({restorableUsers.length})
            </button>
          )}
        </nav>
      </div>

      {activeTab === 'members' ? (
        <>
          {/* Team Members Table */}
          {members.length === 0 ? (
            <EmptyState
              icon={<UserGroupIcon className="h-full w-full" />}
              title="No team members"
              description="Invite team members to collaborate on projects"
              action={
                canManageTeam ? {
                  label: 'Invite User',
                  onClick: () => setShowInviteModal(true),
                } : undefined
              }
            />
          ) : (
            <Card className="overflow-hidden">
              {/* Table Header */}
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="col-span-4">User</div>
                <div className="col-span-2">Role</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Joined</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

              {/* Active Members */}
              {activeMembers.map((member) => {
                const isEditing = editingId === member.id;
                const roleConfig = ROLE_CONFIG[member.role] || ROLE_CONFIG.EMPLOYEE;
                const isCurrentUser = member.id === profile?.uid;
                const canEdit = canManageTeam && !isCurrentUser && (member.role !== 'OWNER' || isOwner);
                const status = getMemberStatus(member);

                return (
                  <div
                    key={member.id}
                    className="px-4 py-3 grid grid-cols-12 gap-4 items-center border-b border-gray-100 last:border-0 hover:bg-gray-50"
                  >
                    {/* User Info */}
                    <div className="col-span-4 flex items-center gap-3">
                      <div className="h-9 w-9 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                        {member.photoURL ? (
                          <img src={member.photoURL} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <UserIcon className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate flex items-center gap-1.5">
                          {member.displayName || 'Unnamed User'}
                          {isCurrentUser && (
                            <span className="text-xs text-gray-400 font-normal">(you)</span>
                          )}
                        </p>
                        <p className="text-sm text-gray-500 truncate">{member.email}</p>
                      </div>
                    </div>

                    {/* Role */}
                    <div className="col-span-2">
                      {isEditing ? (
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value as UserRole)}
                          className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500 w-full"
                          disabled={saving}
                        >
                          {ASSIGNABLE_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {ROLE_CONFIG[role].label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className={cn('px-2 py-1 text-xs font-medium rounded-full', roleConfig.color)}>
                          {roleConfig.label}
                        </span>
                      )}
                    </div>

                    {/* Status */}
                    <div className="col-span-2">
                      {getStatusBadge(status)}
                    </div>

                    {/* Joined Date */}
                    <div className="col-span-2 text-sm text-gray-500">
                      {member.createdAt ? formatDistanceToNow(new Date(member.createdAt), { addSuffix: true }) : '—'}
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 flex items-center justify-end gap-1">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleSaveRole(member.id)}
                            disabled={saving}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                            title="Save"
                          >
                            <CheckIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            disabled={saving}
                            className="p-1.5 text-gray-400 hover:bg-gray-100 rounded"
                            title="Cancel"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        canEdit && (
                          <>
                            <button
                              onClick={() => startEditing(member)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Change role"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            {isOwner && member.role !== 'OWNER' && (
                              <>
                                <button
                                  onClick={() => handleStartOffboarding(member)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                  title="Offboard user"
                                >
                                  <UserMinusIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeactivateMember(member)}
                                  className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded"
                                  title="Deactivate"
                                >
                                  <NoSymbolIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleRemoveMember(member)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                  title="Remove from team"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </>
                        )
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Inactive Members Section */}
              {inactiveMembers.length > 0 && (
                <>
                  <div className="bg-gray-100 px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inactive Members ({inactiveMembers.length})
                  </div>
                  {inactiveMembers.map((member) => {
                    const roleConfig = ROLE_CONFIG[member.role] || ROLE_CONFIG.EMPLOYEE;

                    return (
                      <div
                        key={member.id}
                        className="px-4 py-3 grid grid-cols-12 gap-4 items-center border-b border-gray-100 last:border-0 bg-gray-50 opacity-75"
                      >
                        {/* User Info */}
                        <div className="col-span-4 flex items-center gap-3">
                          <div className="h-9 w-9 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                            {member.photoURL ? (
                              <img src={member.photoURL} alt="" className="h-full w-full object-cover grayscale" />
                            ) : (
                              <UserIcon className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-600 truncate">
                              {member.displayName || 'Unnamed User'}
                            </p>
                            <p className="text-sm text-gray-400 truncate">{member.email}</p>
                          </div>
                        </div>

                        {/* Role */}
                        <div className="col-span-2">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-200 text-gray-500">
                            {roleConfig.label}
                          </span>
                        </div>

                        {/* Status */}
                        <div className="col-span-2">
                          <Badge variant="default" size="sm">Inactive</Badge>
                        </div>

                        {/* Joined Date */}
                        <div className="col-span-2 text-sm text-gray-400">
                          {member.createdAt ? formatDistanceToNow(new Date(member.createdAt), { addSuffix: true }) : '—'}
                        </div>

                        {/* Actions */}
                        <div className="col-span-2 flex items-center justify-end gap-1">
                          {isOwner && (
                            <>
                              <button
                                onClick={() => handleReactivateMember(member)}
                                className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                                title="Reactivate"
                              >
                                <ArrowPathIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleRemoveMember(member)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                title="Remove permanently"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </Card>
          )}

          {/* Role Legend */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Role Permissions</h3>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {ASSIGNABLE_ROLES.map((roleKey) => {
                const config = ROLE_CONFIG[roleKey];
                return (
                  <div key={roleKey} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', config.color)}>
                        {config.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{config.description}</p>
                    <ul className="text-xs text-gray-500 space-y-0.5">
                      {config.permissions.slice(0, 3).map((perm, i) => (
                        <li key={i} className="flex items-center gap-1">
                          <CheckIcon className="h-3 w-3 text-green-500" />
                          {perm}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      ) : (
        /* Invitations Tab */
        <div className="space-y-4">
          {loadingInvitations ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : pendingInvitations.length === 0 ? (
            <EmptyState
              icon={<EnvelopeIcon className="h-full w-full" />}
              title="No pending invitations"
              description="Invite team members to join your organization"
              action={
                canManageTeam ? {
                  label: 'Invite User',
                  onClick: () => setShowInviteModal(true),
                } : undefined
              }
            />
          ) : (
            <Card className="divide-y divide-gray-100">
              {pendingInvitations.map((invitation) => {
                const expired = isExpired(invitation);
                const roleConfig = ROLE_CONFIG[invitation.role] || ROLE_CONFIG.EMPLOYEE;

                return (
                  <div
                    key={invitation.id}
                    className={cn(
                      'p-4 flex items-center gap-4',
                      expired && 'bg-gray-50 opacity-75'
                    )}
                  >
                    {/* Email & Role */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                        <p className="font-medium text-gray-900 truncate">{invitation.email}</p>
                        <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', roleConfig.color)}>
                          {roleConfig.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <ClockIcon className="h-3.5 w-3.5" />
                          Sent {formatDistanceToNow(new Date(invitation.createdAt), { addSuffix: true })}
                        </span>
                        {expired ? (
                          <Badge variant="danger" size="sm">Expired</Badge>
                        ) : (
                          <Badge variant="warning" size="sm">Pending</Badge>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {canManageTeam && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resendInvitation(invitation)}
                        >
                          <ArrowPathIcon className="h-4 w-4 mr-1" />
                          Resend
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => revokeInvitation(invitation.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <XMarkIcon className="h-4 w-4 mr-1" />
                          Revoke
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </Card>
          )}
        </div>
      )}

      {activeTab === 'onboarding' && (
        /* Onboarding Tab */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">User Onboarding Status</h3>
              <p className="text-sm text-gray-500 mt-1">
                Track onboarding progress and manually trigger steps for team members.
              </p>
            </div>
          </div>
          <OnboardingChecklist showBulkActions={canManageTeam} />
        </div>
      )}

      {activeTab === 'offboarded' && isOwner && (
        /* Offboarded Users Tab */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Offboarded Users</h3>
              <p className="text-sm text-gray-500 mt-1">
                Recently offboarded users can be restored within 30 days.
              </p>
            </div>
          </div>

          {loadingRestorable ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : restorableUsers.length === 0 ? (
            <EmptyState
              icon={<ArchiveBoxIcon className="h-full w-full" />}
              title="No offboarded users"
              description="Users who are offboarded will appear here for 30 days and can be restored"
            />
          ) : (
            <Card className="divide-y divide-gray-100">
              {restorableUsers.map((record) => {
                const roleConfig = ROLE_CONFIG[record.userRole] || ROLE_CONFIG.EMPLOYEE;
                const daysRemaining = record.restorableUntil
                  ? Math.ceil((new Date(record.restorableUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  : 0;

                return (
                  <div
                    key={record.id}
                    className="p-4 flex items-center gap-4"
                  >
                    {/* User Info */}
                    <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 truncate">{record.userName}</p>
                        <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', roleConfig.color)}>
                          {roleConfig.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">{record.userEmail}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <ClockIcon className="h-3 w-3" />
                          Offboarded {record.completedAt ? formatDistanceToNow(new Date(record.completedAt), { addSuffix: true }) : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          {daysRemaining > 0 ? `${daysRemaining} days to restore` : 'Expires today'}
                        </span>
                      </div>
                    </div>

                    {/* Offboarding summary */}
                    {record.report && (
                      <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500">
                        <span>{record.report.tasksReassigned} tasks reassigned</span>
                        <span>{record.report.projectsTransferred} projects transferred</span>
                        {record.report.dataArchived && (
                          <Badge variant="default" size="sm">Data Archived</Badge>
                        )}
                      </div>
                    )}

                    {/* Restore Action */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestoreUser(record)}
                    >
                      <ArrowPathIcon className="h-4 w-4 mr-1" />
                      Restore
                    </Button>
                  </div>
                );
              })}
            </Card>
          )}

          {/* Info notice */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <ArchiveBoxIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800">About Offboarding</p>
              <p className="text-sm text-blue-700 mt-1">
                When a user is offboarded, their access is revoked immediately, their tasks and projects
                can be reassigned, and their data is optionally archived for compliance. Users can be
                restored within 30 days of offboarding.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Owner Notice */}
      {!isOwner && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ShieldCheckIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Limited Access</p>
              <p className="text-sm text-amber-700 mt-1">
                Some team management features are restricted to organization owners.
                Contact the owner if you need to invite new members or change permissions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      <InviteUserModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onInvite={handleInvite}
      />

      {/* Offboarding Wizard */}
      {offboardingTarget && (
        <OffboardingWizard
          isOpen={showOffboardingWizard}
          onClose={() => {
            setShowOffboardingWizard(false);
            setOffboardingTarget(null);
          }}
          targetUser={offboardingTarget}
          onComplete={handleOffboardingComplete}
        />
      )}
    </div>
  );
}
