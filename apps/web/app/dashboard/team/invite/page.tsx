"use client";

import React from 'react';
import { Card } from '@/components/ui';
import { UserGroupIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import InviteForm from '@/components/invitations/InviteForm';
import InviteList from '@/components/invitations/InviteList';

export default function TeamInvitePage() {
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
              <p className="text-sm text-gray-500">Add employees, contractors, subcontractors, or clients</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Invite Form */}
        <Card>
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Send Invitations</h2>
          <InviteForm />
        </Card>

        {/* Pending Invites */}
        <Card>
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Sent Invitations</h2>
          <InviteList />
        </Card>

        {/* Info */}
        <Card className="bg-blue-50 border-blue-200">
          <div className="flex gap-4">
            <UserGroupIcon className="h-6 w-6 text-blue-600 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-blue-900">How invitations work</h3>
              <ul className="mt-2 text-sm text-blue-700 space-y-1">
                <li>Invitees receive an email with a link to join</li>
                <li>They can sign up with Google, email/password, or magic link</li>
                <li>Clients can also use phone number sign-in</li>
                <li>Invitations expire after 7 days</li>
                <li>You can resend or cancel invitations above</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
