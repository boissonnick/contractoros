"use client";

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { sendInvite } from '@/lib/invitations/sendInvite';
import { Button, Input, toast } from '@/components/ui';
import { UserRole, EmployeeType } from '@/types';
import { PlusIcon, TrashIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

interface InviteRow {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  employeeType?: EmployeeType;
}

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'PM', label: 'Project Manager' },
  { value: 'EMPLOYEE', label: 'Employee' },
  { value: 'CONTRACTOR', label: 'Contractor (1099)' },
  { value: 'SUB', label: 'Subcontractor' },
  { value: 'CLIENT', label: 'Client' },
];

const EMPLOYEE_TYPE_OPTIONS: { value: EmployeeType; label: string }[] = [
  { value: 'site_manager', label: 'Site Manager' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'salaried', label: 'Salaried' },
];

export default function InviteForm({ onSuccess }: { onSuccess?: () => void }) {
  const { user, profile } = useAuth();
  const [invites, setInvites] = useState<InviteRow[]>([
    { id: Date.now().toString(), name: '', email: '', role: 'EMPLOYEE' },
  ]);
  const [sending, setSending] = useState(false);

  const addRow = () => {
    setInvites([...invites, { id: Date.now().toString(), name: '', email: '', role: 'EMPLOYEE' }]);
  };

  const removeRow = (id: string) => {
    if (invites.length === 1) return;
    setInvites(invites.filter(i => i.id !== id));
  };

  const updateRow = (id: string, updates: Partial<InviteRow>) => {
    setInvites(invites.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  const handleSend = async () => {
    if (!user?.uid || !profile?.orgId) return;

    const valid = invites.filter(i => i.name.trim() && i.email.trim());
    if (valid.length === 0) {
      toast.error('Please fill in at least one invite');
      return;
    }

    setSending(true);
    let successCount = 0;
    const errors: string[] = [];

    for (const invite of valid) {
      try {
        await sendInvite({
          name: invite.name,
          email: invite.email,
          role: invite.role,
          employeeType: invite.role === 'EMPLOYEE' ? invite.employeeType : undefined,
          orgId: profile.orgId,
          invitedBy: user.uid,
        });
        successCount++;
      } catch (err: any) {
        errors.push(`${invite.email}: ${err.message}`);
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} invite${successCount > 1 ? 's' : ''} sent`);
      setInvites([{ id: Date.now().toString(), name: '', email: '', role: 'EMPLOYEE' }]);
      onSuccess?.();
    }
    if (errors.length > 0) {
      toast.error(errors.join('\n'));
    }

    setSending(false);
  };

  return (
    <div className="space-y-4">
      {invites.map((invite, i) => (
        <div key={invite.id} className="border border-gray-200 rounded-lg p-3 space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                label="Name"
                placeholder="John Smith"
                value={invite.name}
                onChange={(e) => updateRow(invite.id, { name: e.target.value })}
              />
            </div>
            <div className="flex-1">
              <Input
                label="Email"
                type="email"
                placeholder="john@example.com"
                value={invite.email}
                onChange={(e) => updateRow(invite.id, { email: e.target.value })}
              />
            </div>
            {invites.length > 1 && (
              <button
                onClick={() => removeRow(invite.id)}
                className="self-end p-2 text-gray-400 hover:text-red-500 mb-0.5"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={invite.role}
                onChange={(e) => updateRow(invite.id, { role: e.target.value as UserRole, employeeType: undefined })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
              >
                {ROLE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {invite.role === 'EMPLOYEE' && (
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee Type</label>
                <select
                  value={invite.employeeType || ''}
                  onChange={(e) => updateRow(invite.id, { employeeType: e.target.value as EmployeeType || undefined })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
                >
                  <option value="">Select type...</option>
                  {EMPLOYEE_TYPE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between">
        <Button variant="secondary" size="sm" onClick={addRow} icon={<PlusIcon className="h-4 w-4" />}>
          Add Another
        </Button>
        <Button
          variant="primary"
          onClick={handleSend}
          loading={sending}
          icon={<PaperAirplaneIcon className="h-4 w-4" />}
        >
          Send Invite{invites.length > 1 ? 's' : ''}
        </Button>
      </div>
    </div>
  );
}
