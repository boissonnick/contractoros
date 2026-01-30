"use client";

// Force dynamic rendering - skip static generation
export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, getCountFromServer, query } from 'firebase/firestore';
import { Card } from '@/components/ui';
import {
  BuildingOfficeIcon,
  UsersIcon,
  FolderIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';

interface StatCard {
  label: string;
  value: number | null;
  icon: React.ElementType;
  color: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<{ orgs: number | null; users: number | null; projects: number | null; invites: number | null }>({
    orgs: null, users: null, projects: null, invites: null,
  });

  useEffect(() => {
    async function loadStats() {
      const [orgs, users, projects, invites] = await Promise.all([
        getCountFromServer(query(collection(db, 'organizations'))),
        getCountFromServer(query(collection(db, 'users'))),
        getCountFromServer(query(collection(db, 'projects'))),
        getCountFromServer(query(collection(db, 'invites'))),
      ]);
      setStats({
        orgs: orgs.data().count,
        users: users.data().count,
        projects: projects.data().count,
        invites: invites.data().count,
      });
    }
    loadStats();
  }, []);

  const cards: StatCard[] = [
    { label: 'Organizations', value: stats.orgs, icon: BuildingOfficeIcon, color: 'bg-blue-100 text-blue-600' },
    { label: 'Users', value: stats.users, icon: UsersIcon, color: 'bg-green-100 text-green-600' },
    { label: 'Projects', value: stats.projects, icon: FolderIcon, color: 'bg-purple-100 text-purple-600' },
    { label: 'Invitations', value: stats.invites, icon: EnvelopeIcon, color: 'bg-amber-100 text-amber-600' },
  ];

  return (
    <div className="p-6 max-w-6xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Admin Dashboard</h1>
      <p className="text-gray-500 mb-6">Platform overview and management</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {value !== null ? value : '—'}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
