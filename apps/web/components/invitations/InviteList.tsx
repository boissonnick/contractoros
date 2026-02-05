"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import { collection, query, where, onSnapshot, doc, updateDoc, orderBy } from 'firebase/firestore';
import { sendInvite } from '@/lib/invitations/sendInvite';
import { toast } from '@/components/ui';
import { cn } from '@/lib/utils';
import { ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Invite {
  id: string;
  name: string;
  email: string;
  role: string;
  employeeType?: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  createdAt: Date;
  expiresAt: Date;
  acceptedAt?: Date;
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  accepted: 'bg-green-100 text-green-700',
  expired: 'bg-gray-100 text-gray-500',
  cancelled: 'bg-red-100 text-red-600',
};

export default function InviteList() {
  const { user, profile } = useAuth();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.orgId) return;

    const q = query(
      collection(db, 'invites'),
      where('orgId', '==', profile.orgId),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setInvites(snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name,
          email: data.email,
          role: data.role,
          employeeType: data.employeeType,
          status: data.status,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          expiresAt: data.expiresAt?.toDate?.() || new Date(),
          acceptedAt: data.acceptedAt?.toDate?.(),
        };
      }));
      setLoading(false);
    });

    return () => unsub();
  }, [profile?.orgId]);

  const handleCancel = async (inviteId: string) => {
    try {
      await updateDoc(doc(db, 'invites', inviteId), { status: 'cancelled' });
      toast.success('Invite cancelled');
    } catch {
      toast.error('Failed to cancel invite');
    }
  };

  const handleResend = async (invite: Invite) => {
    if (!user?.uid || !profile?.orgId) return;
    try {
      // Cancel old invite
      await updateDoc(doc(db, 'invites', invite.id), { status: 'cancelled' });
      // Create new one
      await sendInvite({
        name: invite.name,
        email: invite.email,
        role: invite.role as any,
        employeeType: invite.employeeType as any,
        orgId: profile.orgId,
        invitedBy: user.uid,
      });
      toast.success(`Invite resent to ${invite.email}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to resend invite');
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-400">Loading invites...</div>;
  }

  if (invites.length === 0) {
    return <p className="text-sm text-gray-400">No invites sent yet.</p>;
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Name</th>
            <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Email</th>
            <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Role</th>
            <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Status</th>
            <th className="text-right px-4 py-2 text-xs font-medium text-gray-500">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {invites.map((invite) => (
            <tr key={invite.id}>
              <td className="px-4 py-3 text-gray-900">{invite.name}</td>
              <td className="px-4 py-3 text-gray-500">{invite.email}</td>
              <td className="px-4 py-3 text-gray-600">
                {invite.role}
                {invite.employeeType && <span className="text-gray-400 ml-1">({invite.employeeType})</span>}
              </td>
              <td className="px-4 py-3">
                <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', STATUS_STYLES[invite.status] || 'bg-gray-100 text-gray-500')}>
                  {invite.status}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                {invite.status === 'pending' && (
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => handleResend(invite)} className="p-1 text-gray-400 hover:text-blue-600" title="Resend">
                      <ArrowPathIcon className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleCancel(invite.id)} className="p-1 text-gray-400 hover:text-red-500" title="Cancel">
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
                {(invite.status === 'expired' || invite.status === 'cancelled') && (
                  <button onClick={() => handleResend(invite)} className="text-xs text-blue-600 hover:underline">
                    Resend
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
