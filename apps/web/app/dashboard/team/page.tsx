"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { Button, Card, Avatar, Badge, EmptyState, toast } from '@/components/ui';
import { cn, formatRelativeTime } from '@/lib/utils';
import {
  UserPlusIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  EnvelopeIcon,
  PhoneIcon,
  ClockIcon,
  XMarkIcon,
  ArrowPathIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { UserProfile, UserRole } from '@/types';
import Link from 'next/link';

interface Invite {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: 'pending' | 'accepted' | 'expired';
  createdAt: Date;
  expiresAt: Date;
}

const roleLabels: Record<UserRole, { label: string; color: string }> = {
  OWNER: { label: 'Owner', color: 'bg-purple-100 text-purple-700' },
  PM: { label: 'Project Manager', color: 'bg-blue-100 text-blue-700' },
  EMPLOYEE: { label: 'Employee', color: 'bg-green-100 text-green-700' },
  CONTRACTOR: { label: 'Contractor', color: 'bg-orange-100 text-orange-700' },
  SUB: { label: 'Subcontractor', color: 'bg-yellow-100 text-yellow-700' },
  CLIENT: { label: 'Client', color: 'bg-gray-100 text-gray-700' },
};

export default function TeamPage() {
  const { user, profile } = useAuth();
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'members' | 'invites'>('members');

  useEffect(() => {
    if (profile?.orgId) {
      loadTeamData();
    }
  }, [profile?.orgId]);

  const loadTeamData = async () => {
    if (!profile?.orgId) return;

    setLoading(true);
    try {
      // Load team members
      const membersQuery = query(
        collection(db, 'users'),
        where('orgId', '==', profile.orgId),
        where('isActive', '==', true)
      );
      const membersSnap = await getDocs(membersQuery);
      const membersData = membersSnap.docs.map(doc => ({
        ...doc.data(),
        uid: doc.id,
      })) as UserProfile[];
      setMembers(membersData);

      // Load pending invites
      const invitesQuery = query(
        collection(db, 'invites'),
        where('orgId', '==', profile.orgId),
        where('status', '==', 'pending')
      );
      const invitesSnap = await getDocs(invitesQuery);
      const invitesData = invitesSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          email: data.email,
          name: data.name,
          role: data.role,
          status: data.status,
          createdAt: data.createdAt?.toDate() || new Date(),
          expiresAt: data.expiresAt?.toDate() || new Date(),
        };
      }) as Invite[];
      setInvites(invitesData);
    } catch (error) {
      console.error('Error loading team data:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelInvite = async (inviteId: string) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) return;

    try {
      await deleteDoc(doc(db, 'invites', inviteId));
      setInvites(invites.filter(i => i.id !== inviteId));
    } catch (error) {
      console.error('Error canceling invite:', error);
      toast.error('Failed to cancel invitation.');
    }
  };

  const resendInvite = async (invite: Invite) => {
    try {
      await updateDoc(doc(db, 'invites', invite.id), {
        createdAt: Timestamp.now(),
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
      });
      toast.success('Invitation resent successfully!');
      loadTeamData();
    } catch (error) {
      console.error('Error resending invite:', error);
      toast.error('Failed to resend invitation.');
    }
  };

  const filteredMembers = members.filter(m =>
    m.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredInvites = invites.filter(i =>
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Team</h1>
              <p className="text-gray-500 mt-1">
                {members.length} members • {invites.length} pending invites
              </p>
            </div>
            <Link href="/dashboard/team/invite">
              <Button variant="primary" icon={<UserPlusIcon className="h-5 w-5" />}>
                Invite Team Member
              </Button>
            </Link>
          </div>

          {/* Search and Tabs */}
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search team members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('members')}
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                  activeTab === 'members'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                Members ({members.length})
              </button>
              <button
                onClick={() => setActiveTab('invites')}
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                  activeTab === 'invites'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                Pending ({invites.length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activeTab === 'members' ? (
          filteredMembers.length === 0 ? (
            <EmptyState
              icon={<UserGroupIcon className="h-full w-full" />}
              title="No team members yet"
              description="Start by inviting your employees, contractors, and subcontractors."
              action={{
                label: 'Invite Team Member',
                href: '/dashboard/team/invite',
              }}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredMembers.map((member) => (
                <Card key={member.uid} className="hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <Avatar name={member.displayName || ''} size="lg" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {member.displayName}
                        </h3>
                        {member.uid === user?.uid && (
                          <span className="text-xs text-gray-500">(You)</span>
                        )}
                      </div>
                      <span className={cn(
                        'inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1',
                        roleLabels[member.role || 'EMPLOYEE'].color
                      )}>
                        {roleLabels[member.role || 'EMPLOYEE'].label}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {member.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <EnvelopeIcon className="h-4 w-4" />
                        <span className="truncate">{member.email}</span>
                      </div>
                    )}
                    {member.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <PhoneIcon className="h-4 w-4" />
                        <span>{member.phone}</span>
                      </div>
                    )}
                    {member.trade && (
                      <div className="text-sm text-gray-500">
                        Trade: {member.trade}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )
        ) : (
          filteredInvites.length === 0 ? (
            <EmptyState
              icon={<EnvelopeIcon className="h-full w-full" />}
              title="No pending invitations"
              description="All invitations have been accepted or there are no pending invites."
              action={{
                label: 'Send New Invitation',
                href: '/dashboard/team/invite',
              }}
              size="sm"
            />
          ) : (
            <div className="space-y-4">
              {filteredInvites.map((invite) => (
                <Card key={invite.id}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar name={invite.name} size="md" />
                      <div>
                        <h3 className="font-semibold text-gray-900">{invite.name}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm text-gray-500">{invite.email}</span>
                          <span className={cn(
                            'inline-block px-2 py-0.5 rounded-full text-xs font-medium',
                            roleLabels[invite.role].color
                          )}>
                            {roleLabels[invite.role].label}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                          <ClockIcon className="h-3 w-3" />
                          <span>Sent {formatRelativeTime(invite.createdAt)}</span>
                          <span className="mx-1">•</span>
                          <span>Expires {formatRelativeTime(invite.expiresAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => resendInvite(invite)}
                        icon={<ArrowPathIcon className="h-4 w-4" />}
                      >
                        Resend
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => cancelInvite(invite.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        icon={<XMarkIcon className="h-4 w-4" />}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
