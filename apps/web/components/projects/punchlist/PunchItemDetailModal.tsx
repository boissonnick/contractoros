"use client";

import React, { Fragment, useState } from 'react';
import { Dialog, Transition, Tab } from '@headlessui/react';
import { Button, Badge } from '@/components/ui';
import {
  XMarkIcon,
  CameraIcon,
  MapPinIcon,
  UserCircleIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  WrenchScrewdriverIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { PunchItem, PunchItemStatus, PunchItemPriority, PunchItemPhoto } from '@/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface PunchItemDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: PunchItem | null;
  onUpdateStatus: (itemId: string, status: PunchItemStatus) => Promise<void>;
  onDelete: (itemId: string) => Promise<void>;
  canEdit?: boolean;
}

const statusConfig: Record<PunchItemStatus, { label: string; color: string; icon: React.ReactNode }> = {
  open: { label: 'Open', color: 'bg-red-100 text-red-700', icon: <ExclamationTriangleIcon className="h-4 w-4" /> },
  in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-700', icon: <ArrowPathIcon className="h-4 w-4" /> },
  ready_for_review: { label: 'Ready for Review', color: 'bg-blue-100 text-blue-700', icon: <ClockIcon className="h-4 w-4" /> },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700', icon: <CheckCircleIcon className="h-4 w-4" /> },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: <XCircleIcon className="h-4 w-4" /> },
};

const priorityConfig: Record<PunchItemPriority, { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-gray-100 text-gray-700' },
  medium: { label: 'Medium', color: 'bg-blue-100 text-blue-700' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-700' },
  critical: { label: 'Critical', color: 'bg-red-100 text-red-700' },
};

const statusFlow: Record<PunchItemStatus, PunchItemStatus[]> = {
  open: ['in_progress'],
  in_progress: ['ready_for_review', 'open'],
  ready_for_review: ['approved', 'rejected'],
  approved: [],
  rejected: ['open'],
};

export default function PunchItemDetailModal({
  isOpen,
  onClose,
  item,
  onUpdateStatus,
  onDelete,
  canEdit = true,
}: PunchItemDetailModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedPhoto, setSelectedPhoto] = useState<PunchItemPhoto | null>(null);

  const handleStatusChange = async (newStatus: PunchItemStatus) => {
    if (!item) return;
    setIsUpdating(true);
    try {
      await onUpdateStatus(item.id, newStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    await onDelete(item.id);
  };

  if (!item) return null;

  const availableStatusTransitions = statusFlow[item.status] || [];
  const isCompleted = item.status === 'approved';

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-xl bg-white shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-start justify-between px-6 py-4 border-b border-gray-200">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-mono text-gray-500">{item.number}</span>
                      <Badge className={statusConfig[item.status].color}>
                        {statusConfig[item.status].icon}
                        <span className="ml-1">{statusConfig[item.status].label}</span>
                      </Badge>
                      <Badge className={priorityConfig[item.priority].color}>
                        {priorityConfig[item.priority].label}
                      </Badge>
                    </div>
                    <Dialog.Title className="text-lg font-semibold text-gray-900">
                      {item.title}
                    </Dialog.Title>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="max-h-[60vh] overflow-y-auto">
                  <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
                    <Tab.List className="flex border-b border-gray-200 px-6">
                      <Tab className={({ selected }) =>
                        cn(
                          'px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                          selected
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        )
                      }>
                        Details
                      </Tab>
                      <Tab className={({ selected }) =>
                        cn(
                          'px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1',
                          selected
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        )
                      }>
                        <CameraIcon className="h-4 w-4" />
                        Photos ({item.photos?.length || 0})
                      </Tab>
                      <Tab className={({ selected }) =>
                        cn(
                          'px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                          selected
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        )
                      }>
                        History
                      </Tab>
                    </Tab.List>

                    <Tab.Panels>
                      {/* Details Tab */}
                      <Tab.Panel className="p-6 space-y-6">
                        {/* Description */}
                        {item.description && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                            <div className="bg-gray-50 rounded-lg p-4">
                              <p className="text-gray-900 whitespace-pre-wrap">{item.description}</p>
                            </div>
                          </div>
                        )}

                        {/* Metadata Grid */}
                        <div className="grid grid-cols-2 gap-4">
                          {item.location && (
                            <div className="flex items-start gap-2">
                              <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                              <div>
                                <p className="text-xs text-gray-500">Location</p>
                                <p className="text-sm font-medium text-gray-900">{item.location}</p>
                              </div>
                            </div>
                          )}
                          {item.trade && (
                            <div className="flex items-start gap-2">
                              <WrenchScrewdriverIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                              <div>
                                <p className="text-xs text-gray-500">Trade</p>
                                <p className="text-sm font-medium text-gray-900 capitalize">{item.trade}</p>
                              </div>
                            </div>
                          )}
                          {item.dueDate && (
                            <div className="flex items-start gap-2">
                              <CalendarIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                              <div>
                                <p className="text-xs text-gray-500">Due Date</p>
                                <p className={cn(
                                  "text-sm font-medium",
                                  new Date(item.dueDate) < new Date() && !isCompleted
                                    ? "text-red-600"
                                    : "text-gray-900"
                                )}>
                                  {format(new Date(item.dueDate), 'MMM d, yyyy')}
                                </p>
                              </div>
                            </div>
                          )}
                          {item.backChargeAmount !== undefined && item.backChargeAmount > 0 && (
                            <div className="flex items-start gap-2">
                              <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                              <div>
                                <p className="text-xs text-gray-500">Back Charge</p>
                                <p className="text-sm font-medium text-red-600">
                                  ${item.backChargeAmount.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* People */}
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                          <div className="flex items-start gap-2">
                            <UserCircleIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-xs text-gray-500">Created By</p>
                              <p className="text-sm font-medium text-gray-900">
                                {item.createdByName || 'Unknown'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {format(new Date(item.createdAt), 'MMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                          {item.assignedToName && (
                            <div className="flex items-start gap-2">
                              <UserCircleIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                              <div>
                                <p className="text-xs text-gray-500">Assigned To</p>
                                <p className="text-sm font-medium text-gray-900">
                                  {item.assignedToName}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Completion Info */}
                        {isCompleted && item.completedAt && (
                          <div className="pt-4 border-t border-gray-200">
                            <div className="flex items-center gap-2 p-4 bg-green-50 rounded-lg border border-green-100">
                              <CheckCircleIcon className="h-5 w-5 text-green-600" />
                              <div>
                                <p className="text-sm font-medium text-green-800">Completed</p>
                                <p className="text-xs text-green-700">
                                  {item.completedByName && `by ${item.completedByName} on `}
                                  {format(new Date(item.completedAt), 'MMM d, yyyy h:mm a')}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Status Actions */}
                        {canEdit && availableStatusTransitions.length > 0 && (
                          <div className="pt-4 border-t border-gray-200">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">Update Status</h4>
                            <div className="flex flex-wrap gap-2">
                              {availableStatusTransitions.map((status) => (
                                <Button
                                  key={status}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleStatusChange(status)}
                                  loading={isUpdating}
                                  className={cn(
                                    status === 'approved' && 'text-green-600 border-green-300 hover:bg-green-50',
                                    status === 'rejected' && 'text-red-600 border-red-300 hover:bg-red-50',
                                  )}
                                >
                                  {statusConfig[status].icon}
                                  <span className="ml-1">{statusConfig[status].label}</span>
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                      </Tab.Panel>

                      {/* Photos Tab */}
                      <Tab.Panel className="p-6">
                        {item.photos && item.photos.length > 0 ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-3">
                              {item.photos.map((photo, index) => (
                                <div
                                  key={index}
                                  className="aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => setSelectedPhoto(photo)}
                                >
                                  <img
                                    src={photo.url}
                                    alt={photo.caption || `Photo ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                            <Button variant="outline" size="sm" className="w-full">
                              <CameraIcon className="h-4 w-4 mr-2" />
                              Add Photo
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <CameraIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                            <p className="mb-4">No photos yet</p>
                            <Button variant="outline" size="sm">
                              <CameraIcon className="h-4 w-4 mr-2" />
                              Add Photo
                            </Button>
                          </div>
                        )}

                        {/* Photo Lightbox */}
                        {selectedPhoto && (
                          <div
                            className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4"
                            onClick={() => setSelectedPhoto(null)}
                          >
                            <img
                              src={selectedPhoto.url}
                              alt={selectedPhoto.caption || 'Photo'}
                              className="max-w-full max-h-full object-contain"
                            />
                            {selectedPhoto.caption && (
                              <div className="absolute bottom-4 left-4 right-4 text-center text-white">
                                <p>{selectedPhoto.caption}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </Tab.Panel>

                      {/* History Tab */}
                      <Tab.Panel className="p-6">
                        {item.history && item.history.length > 0 ? (
                          <div className="space-y-4">
                            {item.history.map((entry, index) => (
                              <div
                                key={entry.id || index}
                                className="flex items-start gap-3"
                              >
                                <div className="w-2 h-2 bg-gray-400 rounded-full mt-2" />
                                <div className="flex-1">
                                  <p className="text-sm text-gray-900">
                                    <span className="font-medium">{entry.userName}</span>
                                    {' '}{entry.action.replace('_', ' ')}
                                  </p>
                                  {entry.details && (
                                    <p className="text-sm text-gray-500 mt-1">{entry.details}</p>
                                  )}
                                  <p className="text-xs text-gray-400 mt-1">
                                    {format(new Date(entry.timestamp), 'MMM d, yyyy h:mm a')}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <ClockIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                            <p>No history recorded</p>
                          </div>
                        )}
                      </Tab.Panel>
                    </Tab.Panels>
                  </Tab.Group>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div>
                    {canEdit && !isCompleted && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDelete}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <TrashIcon className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    )}
                  </div>
                  <Button variant="outline" onClick={onClose}>
                    Close
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
