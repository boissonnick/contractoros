"use client";

import React, { useState } from 'react';
import { BaseModal, Button, toast } from '@/components/ui';
import { UserRole } from '@/types';
import {
  EnvelopeIcon,
  UserPlusIcon,
  CheckIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (email: string, role: UserRole, message?: string) => Promise<boolean>;
}

// Roles that can be invited (excluding OWNER, CLIENT, SUB)
const INVITABLE_ROLES: { value: UserRole; label: string; description: string }[] = [
  {
    value: 'PM',
    label: 'Project Manager',
    description: 'Full project management access. Can create projects, manage clients, and view reports.',
  },
  {
    value: 'EMPLOYEE',
    label: 'Employee',
    description: 'W2 employee access. Can view assigned work, clock time, and upload photos.',
  },
  {
    value: 'CONTRACTOR',
    label: 'Contractor',
    description: '1099 contractor access. Can view assigned tasks, update status, and log time.',
  },
];

export function InviteUserModal({ isOpen, onClose, onInvite }: InviteUserModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('EMPLOYEE');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setSending(true);
    try {
      const success = await onInvite(email.trim().toLowerCase(), role, message.trim() || undefined);
      if (success) {
        // Reset form and close
        setEmail('');
        setRole('EMPLOYEE');
        setMessage('');
        onClose();
      }
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    if (!sending) {
      setEmail('');
      setRole('EMPLOYEE');
      setMessage('');
      onClose();
    }
  };

  return (
    <BaseModal
      open={isOpen}
      onClose={handleClose}
      title="Invite Team Member"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email Input */}
        <div>
          <label htmlFor="invite-email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={sending}
              autoFocus
            />
          </div>
        </div>

        {/* Role Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Role <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            {INVITABLE_ROLES.map((option) => (
              <label
                key={option.value}
                className={cn(
                  'flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors',
                  role === option.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                )}
              >
                <input
                  type="radio"
                  name="role"
                  value={option.value}
                  checked={role === option.value}
                  onChange={() => setRole(option.value)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
                  disabled={sending}
                />
                <div className="flex-1">
                  <span className="block font-medium text-gray-900">{option.label}</span>
                  <span className="block text-sm text-gray-500 mt-0.5">{option.description}</span>
                </div>
                {role === option.value && (
                  <CheckIcon className="h-5 w-5 text-blue-600 flex-shrink-0" />
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Optional Message */}
        <div>
          <label htmlFor="invite-message" className="block text-sm font-medium text-gray-700 mb-1">
            Personal Message <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            id="invite-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a personal note to the invitation..."
            rows={3}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            disabled={sending}
          />
        </div>

        {/* Info Notice */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
          <InformationCircleIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700">
            The invitee will receive an email with a link to join your organization.
            The invitation expires in 7 days.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={sending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={sending || !email.trim()}
          >
            {sending ? (
              <>
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Sending...
              </>
            ) : (
              <>
                <UserPlusIcon className="h-4 w-4 mr-1.5" />
                Send Invitation
              </>
            )}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
}
