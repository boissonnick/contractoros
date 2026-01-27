"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { Button, Input, Card, Select, toast } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  UserPlusIcon,
  EnvelopeIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { UserRole } from '@/types';
import Link from 'next/link';

interface InviteMember {
  email: string;
  role: UserRole;
  name: string;
}

const roleOptions: { value: UserRole; label: string; description: string }[] = [
  { value: 'PM', label: 'Project Manager', description: 'Full access to manage projects and team' },
  { value: 'EMPLOYEE', label: 'Employee', description: 'Field worker with time tracking' },
  { value: 'CONTRACTOR', label: 'Contractor', description: 'Independent contractor for specific jobs' },
  { value: 'SUB', label: 'Subcontractor', description: 'Trade-specific subcontractor' },
];

export default function TeamInvitePage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [invites, setInvites] = useState<InviteMember[]>([
    { email: '', role: 'EMPLOYEE', name: '' },
  ]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<Record<number, string>>({});

  const addInvite = () => {
    setInvites([...invites, { email: '', role: 'EMPLOYEE', name: '' }]);
  };

  const removeInvite = (index: number) => {
    if (invites.length > 1) {
      setInvites(invites.filter((_, i) => i !== index));
      const newErrors = { ...errors };
      delete newErrors[index];
      setErrors(newErrors);
    }
  };

  const updateInvite = (index: number, field: keyof InviteMember, value: string) => {
    const newInvites = [...invites];
    newInvites[index] = { ...newInvites[index], [field]: value };
    setInvites(newInvites);

    // Clear error when user types
    if (errors[index]) {
      const newErrors = { ...errors };
      delete newErrors[index];
      setErrors(newErrors);
    }
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async () => {
    if (!user?.uid || !profile?.orgId) return;

    // Validate all invites
    const newErrors: Record<number, string> = {};
    const validInvites: InviteMember[] = [];

    for (let i = 0; i < invites.length; i++) {
      const invite = invites[i];
      if (!invite.email.trim()) {
        newErrors[i] = 'Email is required';
      } else if (!validateEmail(invite.email)) {
        newErrors[i] = 'Invalid email address';
      } else if (!invite.name.trim()) {
        newErrors[i] = 'Name is required';
      } else {
        validInvites.push(invite);
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSending(true);
    try {
      // Check for existing invites or users
      const existingEmails = new Set<string>();

      for (const invite of validInvites) {
        // Check if user already exists
        const usersQuery = query(
          collection(db, 'users'),
          where('email', '==', invite.email.toLowerCase())
        );
        const usersSnap = await getDocs(usersQuery);

        if (!usersSnap.empty) {
          existingEmails.add(invite.email);
          continue;
        }

        // Check if invite already sent
        const invitesQuery = query(
          collection(db, 'invites'),
          where('email', '==', invite.email.toLowerCase()),
          where('orgId', '==', profile.orgId),
          where('status', '==', 'pending')
        );
        const invitesSnap = await getDocs(invitesQuery);

        if (!invitesSnap.empty) {
          existingEmails.add(invite.email);
          continue;
        }

        // Create invite
        await addDoc(collection(db, 'invites'), {
          email: invite.email.toLowerCase(),
          name: invite.name,
          role: invite.role,
          orgId: profile.orgId,
          invitedBy: user.uid,
          status: 'pending',
          createdAt: Timestamp.now(),
          expiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days
        });
      }

      if (existingEmails.size > 0 && existingEmails.size === validInvites.length) {
        toast.warning('All invites were already sent or users already exist.');
      } else {
        setSent(true);
        setTimeout(() => {
          router.push('/dashboard/team');
        }, 2000);
      }
    } catch (error) {
      console.error('Error sending invites:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center py-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Invitations Sent!</h2>
          <p className="text-gray-500">Your team members will receive an email invitation.</p>
          <div className="mt-6">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/team" className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Invite Team Members</h1>
              <p className="text-sm text-gray-500">Add employees, contractors, or subcontractors</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <div className="space-y-6">
            {invites.map((invite, index) => (
              <div key={index} className="relative">
                {index > 0 && (
                  <div className="absolute -top-3 left-0 right-0 border-t border-gray-200" />
                )}
                <div className={cn('grid gap-4', index > 0 && 'pt-6')}>
                  <div className="flex items-start gap-4">
                    <div className="flex-1 grid gap-4 sm:grid-cols-2">
                      <Input
                        label="Name"
                        placeholder="John Smith"
                        value={invite.name}
                        onChange={(e) => updateInvite(index, 'name', e.target.value)}
                        error={errors[index]?.includes('Name') ? errors[index] : undefined}
                      />
                      <Input
                        label="Email"
                        type="email"
                        placeholder="john@example.com"
                        value={invite.email}
                        onChange={(e) => updateInvite(index, 'email', e.target.value)}
                        error={errors[index]?.includes('email') || errors[index]?.includes('Email') ? errors[index] : undefined}
                        icon={<EnvelopeIcon className="h-5 w-5" />}
                      />
                    </div>
                    {invites.length > 1 && (
                      <button
                        onClick={() => removeInvite(index)}
                        className="mt-7 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                  <Select
                    label="Role"
                    value={invite.role}
                    onChange={(e) => updateInvite(index, 'role', e.target.value as UserRole)}
                    options={roleOptions.map(r => ({ value: r.value, label: r.label }))}
                  />
                  <p className="text-sm text-gray-500 -mt-2">
                    {roleOptions.find(r => r.value === invite.role)?.description}
                  </p>
                </div>
              </div>
            ))}

            <button
              onClick={addInvite}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center gap-2"
            >
              <UserPlusIcon className="h-5 w-5" />
              Add Another Person
            </button>
          </div>

          <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
            <Link href="/dashboard/team" className="flex-1">
              <Button variant="outline" className="w-full">
                Cancel
              </Button>
            </Link>
            <Button
              variant="primary"
              onClick={handleSubmit}
              loading={sending}
              className="flex-1"
              icon={<EnvelopeIcon className="h-4 w-4" />}
            >
              Send {invites.length > 1 ? `${invites.length} Invitations` : 'Invitation'}
            </Button>
          </div>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <UserGroupIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-blue-900">How invitations work</h3>
              <ul className="mt-2 text-sm text-blue-700 space-y-1">
                <li>• Invitees will receive an email with a link to join</li>
                <li>• They can create an account and join your organization</li>
                <li>• Invitations expire after 7 days</li>
                <li>• You can resend or cancel invitations from the team page</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
