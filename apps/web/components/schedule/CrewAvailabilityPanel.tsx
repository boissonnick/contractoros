"use client";

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button, Card, Badge } from '@/components/ui';
import BaseModal from '@/components/ui/BaseModal';
import {
  CrewAvailability,
  TimeOffRequest,
  TIME_OFF_TYPES,
} from '@/types';
import {
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CalendarDaysIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

export interface CrewAvailabilityPanelProps {
  users: { id: string; name: string; role?: string }[];
  availability: CrewAvailability[];
  timeOffRequests: TimeOffRequest[];
  selectedDate: Date;
  onSetAvailability?: (userId: string, status: 'available' | 'unavailable' | 'limited') => void;
  onRequestTimeOff?: (data: TimeOffRequestData) => void;
  onApproveTimeOff?: (requestId: string) => void;
  onDenyTimeOff?: (requestId: string, reason: string) => void;
  loading?: boolean;
  className?: string;
}

export interface TimeOffRequestData {
  userId: string;
  userName: string;
  type: TimeOffRequest['type'];
  startDate: Date;
  endDate: Date;
  halfDay?: 'morning' | 'afternoon';
  reason?: string;
}

export default function CrewAvailabilityPanel({
  users,
  availability,
  timeOffRequests,
  selectedDate,
  onSetAvailability,
  onRequestTimeOff,
  onApproveTimeOff,
  onDenyTimeOff,
  loading = false,
  className,
}: CrewAvailabilityPanelProps) {
  const [showTimeOffModal, setShowTimeOffModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [showDenyModal, setShowDenyModal] = useState(false);
  const [denyRequestId, setDenyRequestId] = useState<string>('');
  const [denyReason, setDenyReason] = useState('');

  const [timeOffForm, setTimeOffForm] = useState<TimeOffRequestData>({
    userId: '',
    userName: '',
    type: 'vacation',
    startDate: new Date(),
    endDate: new Date(),
    halfDay: undefined,
    reason: '',
  });

  const dateStr = selectedDate.toDateString();

  const getUserAvailability = (userId: string): CrewAvailability | undefined => {
    return availability.find(
      (a) => a.userId === userId && a.date.toDateString() === dateStr
    );
  };

  const getUserTimeOff = (userId: string): TimeOffRequest | undefined => {
    return timeOffRequests.find(
      (r) =>
        r.userId === userId &&
        r.status === 'approved' &&
        selectedDate >= r.startDate &&
        selectedDate <= r.endDate
    );
  };

  const getPendingRequests = () => {
    return timeOffRequests.filter((r) => r.status === 'pending');
  };

  const getStatusIcon = (userId: string) => {
    const avail = getUserAvailability(userId);
    const timeOff = getUserTimeOff(userId);

    if (timeOff) {
      return <XCircleIcon className="h-5 w-5 text-gray-400" />;
    }

    if (!avail || avail.status === 'available') {
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    }

    if (avail.status === 'unavailable') {
      return <XCircleIcon className="h-5 w-5 text-red-500" />;
    }

    return <ClockIcon className="h-5 w-5 text-yellow-500" />;
  };

  const getStatusText = (userId: string) => {
    const avail = getUserAvailability(userId);
    const timeOff = getUserTimeOff(userId);

    if (timeOff) {
      const typeLabel = TIME_OFF_TYPES.find((t) => t.value === timeOff.type)?.label;
      return typeLabel || 'Time Off';
    }

    if (!avail || avail.status === 'available') {
      return 'Available';
    }

    if (avail.status === 'unavailable') {
      return avail.reason || 'Unavailable';
    }

    return 'Limited';
  };

  const handleOpenTimeOffModal = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    setTimeOffForm({
      userId,
      userName: user?.name || '',
      type: 'vacation',
      startDate: new Date(),
      endDate: new Date(),
      halfDay: undefined,
      reason: '',
    });
    setShowTimeOffModal(true);
  };

  const handleSubmitTimeOff = () => {
    if (onRequestTimeOff) {
      onRequestTimeOff(timeOffForm);
    }
    setShowTimeOffModal(false);
  };

  const handleDeny = (requestId: string) => {
    setDenyRequestId(requestId);
    setDenyReason('');
    setShowDenyModal(true);
  };

  const handleConfirmDeny = () => {
    if (onDenyTimeOff && denyRequestId) {
      onDenyTimeOff(denyRequestId, denyReason);
    }
    setShowDenyModal(false);
    setDenyRequestId('');
  };

  const pendingRequests = getPendingRequests();

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Crew Availability</h3>
        <span className="text-sm text-gray-500">
          {selectedDate.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      </div>

      {/* Pending Requests Alert */}
      {pendingRequests.length > 0 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <div className="p-3">
            <div className="flex items-center gap-2 text-yellow-800 mb-2">
              <CalendarDaysIcon className="h-5 w-5" />
              <span className="font-medium">
                {pendingRequests.length} Pending Time Off Request{pendingRequests.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-2">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between bg-white rounded p-2"
                >
                  <div className="text-sm">
                    <span className="font-medium">{request.userName}</span>
                    <span className="text-gray-500 mx-1">·</span>
                    <span>
                      {TIME_OFF_TYPES.find((t) => t.value === request.type)?.label}
                    </span>
                    <div className="text-xs text-gray-500">
                      {request.startDate.toLocaleDateString()} - {request.endDate.toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onApproveTimeOff?.(request.id)}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeny(request.id)}
                    >
                      Deny
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* User List */}
      <div className="space-y-2">
        {users.map((user) => {
          const avail = getUserAvailability(user.id);
          const timeOff = getUserTimeOff(user.id);
          const statusText = getStatusText(user.id);

          return (
            <div
              key={user.id}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(user.id)}
                <div>
                  <div className="font-medium text-gray-900">{user.name}</div>
                  <div className="text-xs text-gray-500">{statusText}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!timeOff && onSetAvailability && (
                  <div className="flex bg-gray-100 rounded p-0.5">
                    {(['available', 'limited', 'unavailable'] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => onSetAvailability(user.id, status)}
                        className={cn(
                          'px-2 py-1 text-xs rounded transition-colors capitalize',
                          (!avail && status === 'available') || avail?.status === status
                            ? 'bg-white shadow-sm font-medium'
                            : 'text-gray-600 hover:text-gray-900'
                        )}
                      >
                        {status === 'available' ? '✓' : status === 'limited' ? '~' : '✗'}
                      </button>
                    ))}
                  </div>
                )}

                {onRequestTimeOff && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenTimeOffModal(user.id)}
                  >
                    <CalendarDaysIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time Off Request Modal */}
      <BaseModal
        open={showTimeOffModal}
        onClose={() => setShowTimeOffModal(false)}
        title="Request Time Off"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Employee
            </label>
            <input
              type="text"
              value={timeOffForm.userName}
              disabled
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={timeOffForm.type}
              onChange={(e) =>
                setTimeOffForm({ ...timeOffForm, type: e.target.value as TimeOffRequest['type'] })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {TIME_OFF_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={timeOffForm.startDate.toISOString().slice(0, 10)}
                onChange={(e) =>
                  setTimeOffForm({ ...timeOffForm, startDate: new Date(e.target.value) })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={timeOffForm.endDate.toISOString().slice(0, 10)}
                onChange={(e) =>
                  setTimeOffForm({ ...timeOffForm, endDate: new Date(e.target.value) })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Half Day?
            </label>
            <select
              value={timeOffForm.halfDay || ''}
              onChange={(e) =>
                setTimeOffForm({
                  ...timeOffForm,
                  halfDay: e.target.value as 'morning' | 'afternoon' | undefined,
                })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Full Day</option>
              <option value="morning">Morning Only</option>
              <option value="afternoon">Afternoon Only</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason (optional)
            </label>
            <textarea
              value={timeOffForm.reason || ''}
              onChange={(e) => setTimeOffForm({ ...timeOffForm, reason: e.target.value })}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Optional reason for the time off..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => setShowTimeOffModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmitTimeOff}>Submit Request</Button>
        </div>
      </BaseModal>

      {/* Deny Reason Modal */}
      <BaseModal
        open={showDenyModal}
        onClose={() => setShowDenyModal(false)}
        title="Deny Time Off Request"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Denial
            </label>
            <textarea
              value={denyReason}
              onChange={(e) => setDenyReason(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Please provide a reason..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => setShowDenyModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirmDeny}>
            Deny Request
          </Button>
        </div>
      </BaseModal>
    </div>
  );
}
