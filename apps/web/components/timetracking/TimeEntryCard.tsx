'use client';

import { useState } from 'react';
import {
  ClockIcon,
  MapPinIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { TimeEntry, TIME_ENTRY_STATUSES, BREAK_TYPES } from '@/types';
import { formatDate } from '@/lib/date-utils';

// Format time helper
function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

interface TimeEntryCardProps {
  entry: TimeEntry;
  showUser?: boolean;
  showProject?: boolean;
  onEdit?: (entry: TimeEntry) => void;
  onDelete?: (entryId: string) => void;
  onApprove?: (entryId: string) => void;
  onReject?: (entryId: string, reason: string) => void;
  canApprove?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function TimeEntryCard({
  entry,
  showUser = false,
  showProject = true,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  canApprove = false,
  canEdit = true,
  canDelete = true,
}: TimeEntryCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  const statusInfo = TIME_ENTRY_STATUSES.find(s => s.value === entry.status);

  // Format duration
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  // Get badge variant from status
  const getBadgeVariant = (status: string): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary' => {
    switch (status) {
      case 'active':
      case 'approved':
        return 'success';
      case 'paused':
      case 'pending_approval':
        return 'warning';
      case 'rejected':
        return 'danger';
      default:
        return 'default';
    }
  };

  const handleReject = () => {
    if (rejectReason.trim() && onReject) {
      onReject(entry.id, rejectReason);
      setShowRejectInput(false);
      setRejectReason('');
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-3">
        {/* Header Row */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Date and User */}
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">
                {formatDate(entry.clockIn)}
              </span>
              {showUser && (
                <span className="text-sm text-gray-500">
                  • {entry.userName}
                </span>
              )}
            </div>

            {/* Time Range */}
            <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
              <ClockIcon className="h-4 w-4" />
              <span>{formatTime(entry.clockIn)}</span>
              <span>–</span>
              <span>{entry.clockOut ? formatTime(entry.clockOut) : 'In progress'}</span>
            </div>

            {/* Project */}
            {showProject && entry.projectName && (
              <div className="text-sm text-gray-500 mt-1">
                {entry.projectName}
                {entry.taskName && <span className="text-gray-400"> / {entry.taskName}</span>}
              </div>
            )}
          </div>

          {/* Duration and Status */}
          <div className="text-right">
            <div className="font-mono font-semibold text-lg text-gray-900">
              {entry.totalMinutes ? formatDuration(entry.totalMinutes) : '--:--'}
            </div>
            <Badge variant={getBadgeVariant(entry.status)} className="mt-1">
              {statusInfo?.label || entry.status}
            </Badge>
          </div>
        </div>

        {/* Expandable Details */}
        {showDetails && (
          <div className="pt-3 border-t border-gray-100 space-y-3">
            {/* Entry Type */}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Entry Type</span>
              <span className="text-gray-900 capitalize">{entry.type}</span>
            </div>

            {/* Breaks */}
            {entry.breaks && entry.breaks.length > 0 && (
              <div className="space-y-1">
                <span className="text-sm text-gray-500">Breaks</span>
                <div className="space-y-1">
                  {entry.breaks.map((brk, idx) => {
                    const breakTypeInfo = BREAK_TYPES.find(b => b.value === brk.type);
                    return (
                      <div key={idx} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                        <span>{breakTypeInfo?.label || brk.type}</span>
                        <span className="text-gray-600">
                          {formatTime(brk.startTime)} - {brk.endTime ? formatTime(brk.endTime) : 'Ongoing'}
                          {brk.duration && <span className="ml-1 text-gray-400">({brk.duration}m)</span>}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Location Info */}
            {(entry.clockInLocation || entry.clockOutLocation) && (
              <div className="space-y-1">
                <span className="text-sm text-gray-500">Location</span>
                <div className="text-sm">
                  {entry.clockInLocation && (
                    <div className="flex items-center gap-1 text-gray-600">
                      <MapPinIcon className="h-3 w-3" />
                      <span>Clock in: {entry.clockInLocation.address || `${entry.clockInLocation.lat.toFixed(4)}, ${entry.clockInLocation.lng.toFixed(4)}`}</span>
                    </div>
                  )}
                  {entry.clockOutLocation && (
                    <div className="flex items-center gap-1 text-gray-600">
                      <MapPinIcon className="h-3 w-3" />
                      <span>Clock out: {entry.clockOutLocation.address || `${entry.clockOutLocation.lat.toFixed(4)}, ${entry.clockOutLocation.lng.toFixed(4)}`}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {entry.notes && (
              <div className="space-y-1">
                <span className="text-sm text-gray-500">Notes</span>
                <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">{entry.notes}</p>
              </div>
            )}

            {/* Hourly Rate */}
            {entry.hourlyRate && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Rate</span>
                <span className="text-gray-900">
                  ${entry.hourlyRate}/hr
                  {entry.totalMinutes && (
                    <span className="text-gray-500 ml-1">
                      (${((entry.totalMinutes / 60) * entry.hourlyRate).toFixed(2)})
                    </span>
                  )}
                </span>
              </div>
            )}

            {/* Approval Info */}
            {entry.status === 'approved' && entry.approvedByName && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Approved by</span>
                <span className="text-gray-900">{entry.approvedByName}</span>
              </div>
            )}
            {entry.status === 'rejected' && entry.rejectionReason && (
              <div className="space-y-1">
                <span className="text-sm text-gray-500">Rejection Reason</span>
                <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{entry.rejectionReason}</p>
              </div>
            )}

            {/* Edit History */}
            {entry.editHistory && entry.editHistory.length > 0 && (
              <div className="space-y-1">
                <span className="text-sm text-gray-500">Edit History</span>
                <div className="text-xs text-gray-500 space-y-1">
                  {entry.editHistory.slice(0, 3).map((edit, idx) => (
                    <div key={idx}>
                      {edit.editedByName} changed {edit.field} on {formatDate(edit.editedAt)}
                    </div>
                  ))}
                  {entry.editHistory.length > 3 && (
                    <div>...and {entry.editHistory.length - 3} more edits</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Reject Input */}
        {showRejectInput && (
          <div className="pt-3 border-t border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rejection Reason
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Please provide a reason for rejection..."
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              rows={2}
            />
            <div className="flex gap-2 mt-2">
              <Button size="sm" variant="danger" onClick={handleReject} disabled={!rejectReason.trim()}>
                Confirm Reject
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setShowRejectInput(false); setRejectReason(''); }}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Actions Row */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          {/* Toggle Details */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            {showDetails ? (
              <>
                <ChevronUpIcon className="h-4 w-4" />
                Less details
              </>
            ) : (
              <>
                <ChevronDownIcon className="h-4 w-4" />
                More details
              </>
            )}
          </button>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Approval Actions */}
            {canApprove && entry.status === 'pending_approval' && !showRejectInput && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onApprove?.(entry.id)}
                  className="text-green-600 border-green-200 hover:bg-green-50"
                >
                  <CheckIcon className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowRejectInput(true)}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <XMarkIcon className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </>
            )}

            {/* Edit/Delete Actions */}
            {entry.status !== 'approved' && entry.status !== 'active' && entry.status !== 'paused' && (
              <>
                {canEdit && onEdit && (
                  <Button size="sm" variant="ghost" onClick={() => onEdit(entry)}>
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                )}
                {canDelete && onDelete && (
                  <Button size="sm" variant="ghost" onClick={() => onDelete(entry.id)}>
                    <TrashIcon className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
