"use client";

// Force dynamic rendering - skip static generation
export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { resetOrgOnboarding, resetUserOnboarding } from '@/lib/admin/resetOnboarding';
import { Card, Button, toast } from '@/components/ui';
import { ArrowLeftIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface OrgDetail {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  onboardingCompleted?: boolean;
  branding?: { primaryColor?: string; secondaryColor?: string; accentColor?: string; logoURL?: string };
}

interface UserRow {
  uid: string;
  displayName?: string;
  email?: string;
  role?: string;
  onboardingCompleted?: boolean;
}

export default function AdminOrgDetailPage() {
  const { id } = useParams<{ id: string }>();
  const _router = useRouter();
  const [org, setOrg] = useState<OrgDetail | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    async function load() {
      const snap = await getDoc(doc(db, 'organizations', id));
      if (snap.exists()) {
        setOrg({ id: snap.id, ...snap.data() } as OrgDetail);
      }
      const usersSnap = await getDocs(query(collection(db, 'users'), where('orgId', '==', id)));
      setUsers(usersSnap.docs.map(d => ({ uid: d.id, ...d.data() } as UserRow)));
      setLoading(false);
    }
    load();
  }, [id]);

  const handleResetOrg = async () => {
    if (!org) return;
    setResetting(true);
    try {
      await resetOrgOnboarding(org.id);
      setOrg(prev => prev ? { ...prev, onboardingCompleted: false } : null);
      toast.success('Organization onboarding reset');
    } catch {
      toast.error('Failed to reset onboarding');
    } finally {
      setResetting(false);
    }
  };

  const handleResetUser = async (uid: string) => {
    try {
      await resetUserOnboarding(uid);
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, onboardingCompleted: false } : u));
      toast.success('User onboarding reset');
    } catch {
      toast.error('Failed to reset user onboarding');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Organization not found.</p>
        <Link href="/admin/organizations" className="text-blue-600 hover:underline text-sm mt-2 inline-block">Back to Organizations</Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <Link href="/admin/organizations" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeftIcon className="h-4 w-4" /> Back
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-heading tracking-tight">{org.name}</h1>
          <p className="text-gray-500">{org.email || 'No email'}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetOrg}
          loading={resetting}
          icon={<ArrowPathIcon className="h-4 w-4" />}
        >
          Reset Onboarding
        </Button>
      </div>

      {/* Org Info */}
      <Card className="mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Details</h2>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-gray-500">Phone</dt>
            <dd className="text-gray-900">{org.phone || '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Address</dt>
            <dd className="text-gray-900">{org.address || '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Onboarding</dt>
            <dd>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                org.onboardingCompleted ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {org.onboardingCompleted ? 'Complete' : 'Incomplete'}
              </span>
            </dd>
          </div>
          {org.branding?.primaryColor && (
            <div>
              <dt className="text-gray-500">Brand Colors</dt>
              <dd className="flex gap-2 mt-1">
                {[org.branding.primaryColor, org.branding.secondaryColor, org.branding.accentColor].filter(Boolean).map((c, i) => (
                  <div key={i} className="w-6 h-6 rounded-full border border-gray-200" style={{ backgroundColor: c }} title={c} />
                ))}
              </dd>
            </div>
          )}
        </dl>
      </Card>

      {/* Members */}
      <Card>
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Members ({users.length})</h2>
        {users.length === 0 ? (
          <p className="text-sm text-gray-500">No members found</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {users.map(u => (
              <div key={u.uid} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{u.displayName || 'Unnamed'}</p>
                  <p className="text-xs text-gray-500">{u.email} · {u.role}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    u.onboardingCompleted ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {u.onboardingCompleted ? 'Active' : 'Onboarding'}
                  </span>
                  <button
                    onClick={() => handleResetUser(u.uid)}
                    className="text-xs text-gray-400 hover:text-blue-600"
                    title="Reset onboarding"
                  >
                    <ArrowPathIcon className="h-3.5 w-3.5" />
                  </button>
                  <Link href={`/admin/users/${u.uid}`} className="text-xs text-blue-600 hover:underline">
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
