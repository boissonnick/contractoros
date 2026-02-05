"use client";

// Force dynamic rendering - skip static generation
export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { resetUserOnboarding } from '@/lib/admin/resetOnboarding';
import { Card, Button, toast } from '@/components/ui';
import { ArrowLeftIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { UserRole } from '@/types';
import { formatDate } from '@/lib/date-utils';

interface UserDetail {
  uid: string;
  displayName?: string;
  email?: string;
  role?: UserRole;
  employeeType?: string;
  orgId?: string;
  phone?: string;
  onboardingCompleted?: boolean;
  createdAt?: { toDate: () => Date };
}

const ALL_ROLES: UserRole[] = ['OWNER', 'PM', 'EMPLOYEE', 'CONTRACTOR', 'SUB', 'CLIENT'];

export default function AdminUserDetailPage() {
  const { uid } = useParams<{ uid: string }>();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [changingRole, setChangingRole] = useState(false);

  useEffect(() => {
    async function load() {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        setUser({ uid: snap.id, ...snap.data() } as UserDetail);
      }
      setLoading(false);
    }
    load();
  }, [uid]);

  const handleResetOnboarding = async () => {
    if (!user) return;
    setResetting(true);
    try {
      await resetUserOnboarding(user.uid);
      setUser(prev => prev ? { ...prev, onboardingCompleted: false } : null);
      toast.success('Onboarding reset');
    } catch {
      toast.error('Failed to reset onboarding');
    } finally {
      setResetting(false);
    }
  };

  const handleRoleChange = async (newRole: UserRole) => {
    if (!user) return;
    setChangingRole(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        role: newRole,
        updatedAt: Timestamp.now(),
      });
      setUser(prev => prev ? { ...prev, role: newRole } : null);
      toast.success(`Role changed to ${newRole}`);
    } catch {
      toast.error('Failed to change role');
    } finally {
      setChangingRole(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6">
        <p className="text-gray-500">User not found.</p>
        <Link href="/admin/users" className="text-blue-600 hover:underline text-sm mt-2 inline-block">Back to Users</Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl">
      <Link href="/admin/users" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeftIcon className="h-4 w-4" /> Back
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-heading tracking-tight">{user.displayName || 'Unnamed'}</h1>
          <p className="text-gray-500">{user.email}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetOnboarding}
          loading={resetting}
          icon={<ArrowPathIcon className="h-4 w-4" />}
        >
          Reset Onboarding
        </Button>
      </div>

      {/* Details */}
      <Card className="mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Profile</h2>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-gray-500">UID</dt>
            <dd className="text-gray-900 font-mono text-xs">{user.uid}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Phone</dt>
            <dd className="text-gray-900">{user.phone || '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Org ID</dt>
            <dd className="text-gray-900 font-mono text-xs">
              {user.orgId ? (
                <Link href={`/admin/organizations/${user.orgId}`} className="text-blue-600 hover:underline">
                  {user.orgId}
                </Link>
              ) : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Onboarding</dt>
            <dd>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                user.onboardingCompleted ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {user.onboardingCompleted ? 'Complete' : 'Incomplete'}
              </span>
            </dd>
          </div>
          {user.employeeType && (
            <div>
              <dt className="text-gray-500">Employee Type</dt>
              <dd className="text-gray-900 capitalize">{user.employeeType.replace('_', ' ')}</dd>
            </div>
          )}
          {user.createdAt && (
            <div>
              <dt className="text-gray-500">Created</dt>
              <dd className="text-gray-900">{formatDate(user.createdAt?.toDate())}</dd>
            </div>
          )}
        </dl>
      </Card>

      {/* Role Change */}
      <Card>
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Change Role</h2>
        <div className="flex flex-wrap gap-2">
          {ALL_ROLES.map(role => (
            <button
              key={role}
              onClick={() => handleRoleChange(role)}
              disabled={changingRole || user.role === role}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                user.role === role
                  ? 'bg-brand-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } disabled:opacity-50`}
            >
              {role}
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
