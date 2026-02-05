"use client";

// Force dynamic rendering - skip static generation
export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Card } from '@/components/ui';
import Link from 'next/link';
import { MagnifyingGlassIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface UserRow {
  uid: string;
  displayName?: string;
  email?: string;
  role?: string;
  orgId?: string;
  onboardingCompleted?: boolean;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      const snap = await getDocs(query(collection(db, 'users'), orderBy('displayName')));
      setUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserRow)));
      setLoading(false);
    }
    load();
  }, []);

  const filtered = users.filter(u =>
    u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.role?.toLowerCase().includes(search.toLowerCase())
  );

  const roleBadge = (role?: string) => {
    const colors: Record<string, string> = {
      OWNER: 'bg-purple-100 text-purple-700',
      PM: 'bg-blue-100 text-blue-700',
      EMPLOYEE: 'bg-green-100 text-green-700',
      CONTRACTOR: 'bg-orange-100 text-orange-700',
      SUB: 'bg-teal-100 text-teal-700',
      CLIENT: 'bg-gray-100 text-gray-700',
    };
    return colors[role || ''] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 font-heading tracking-tight mb-6">Users</h1>

      <div className="relative mb-4">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <Card><p className="text-gray-500 text-sm text-center py-4">No users found</p></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(u => (
            <Link key={u.uid} href={`/admin/users/${u.uid}`}>
              <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{u.displayName || 'Unnamed'}</p>
                    <p className="text-sm text-gray-500">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${roleBadge(u.role)}`}>
                      {u.role || 'N/A'}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      u.onboardingCompleted ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {u.onboardingCompleted ? 'Active' : 'Onboarding'}
                    </span>
                    <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
