'use client';

import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
  XMarkIcon,
  PaperClipIcon,
  DocumentPlusIcon,
  TrashIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';

export interface RFIFormData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedToId?: string;
  dueDate?: string;
  linkedDrawings: string[];
  attachments: File[];
}

interface TeamMember {
  id: string;
  name: string;
  type: 'team' | 'sub';
  company?: string;
}

interface Drawing {
  id: string;
  number: string;
  title: string;
}

interface RFIFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RFIFormData, isDraft: boolean) => Promise<void>;
  initialData?: Partial<RFIFormData>;
  teamMembers: TeamMember[];
  drawings?: Drawing[];
  projectId: string;
  editMode?: boolean;
}

export function RFIFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  teamMembers,
  drawings = [],
  projectId: _projectId,
  editMode = false,
}: RFIFormModalProps) {
  const [formData, setFormData] = useState<RFIFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    priority: initialData?.priority || 'medium',
    assignedToId: initialData?.assignedToId || '',
    dueDate: initialData?.dueDate || '',
    linkedDrawings: initialData?.linkedDrawings || [],
    attachments: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDrawingPicker, setShowDrawingPicker] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData((prev) => ({
      ...prev,
      attachments: [...prev.attachments, ...files],
    }));
  };

  const removeAttachment = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const toggleDrawing = (drawingId: string) => {
    setFormData((prev) => ({
      ...prev,
      linkedDrawings: prev.linkedDrawings.includes(drawingId)
        ? prev.linkedDrawings.filter((id) => id !== drawingId)
        : [...prev.linkedDrawings, drawingId],
    }));
  };

  const handleSubmit = async (isDraft: boolean) => {
    if (!formData.title.trim()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(formData, isDraft);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const groupedMembers = {
    team: teamMembers.filter((m) => m.type === 'team'),
    sub: teamMembers.filter((m) => m.type === 'sub'),
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                  <Dialog.Title className="text-lg font-semibold text-gray-900">
                    {editMode ? 'Edit RFI' : 'New Request for Information'}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Form */}
                <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Brief description of the request"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      placeholder="Detailed description of the information needed..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                    />
                  </div>

                  {/* Priority & Assign To */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Priority
                      </label>
                      <select
                        name="priority"
                        value={formData.priority}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Assign To
                      </label>
                      <select
                        name="assignedToId"
                        value={formData.assignedToId}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      >
                        <option value="">Select assignee...</option>
                        {groupedMembers.team.length > 0 && (
                          <optgroup label="Team Members">
                            {groupedMembers.team.map((m) => (
                              <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                          </optgroup>
                        )}
                        {groupedMembers.sub.length > 0 && (
                          <optgroup label="Subcontractors">
                            {groupedMembers.sub.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name}{m.company ? ` (${m.company})` : ''}
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                    </div>
                  </div>

                  {/* Due Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      name="dueDate"
                      value={formData.dueDate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                  </div>

                  {/* Linked Drawings */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Linked Drawings/Specs
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowDrawingPicker(!showDrawingPicker)}
                      className="inline-flex items-center gap-2 text-sm text-violet-600 hover:text-violet-700"
                    >
                      <LinkIcon className="h-4 w-4" />
                      {formData.linkedDrawings.length > 0
                        ? `${formData.linkedDrawings.length} selected`
                        : 'Link drawings'}
                    </button>
                    {showDrawingPicker && drawings.length > 0 && (
                      <div className="mt-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg">
                        {drawings.map((drawing) => (
                          <label
                            key={drawing.id}
                            className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={formData.linkedDrawings.includes(drawing.id)}
                              onChange={() => toggleDrawing(drawing.id)}
                              className="rounded text-violet-600 focus:ring-violet-500"
                            />
                            <span className="text-sm">
                              <span className="font-mono text-gray-500">{drawing.number}</span>
                              {' - '}
                              {drawing.title}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* File Attachments */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Attachments
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                        id="rfi-attachments"
                      />
                      <label
                        htmlFor="rfi-attachments"
                        className="flex flex-col items-center cursor-pointer"
                      >
                        <DocumentPlusIcon className="h-8 w-8 text-gray-400" />
                        <span className="mt-2 text-sm text-gray-500">
                          Click to upload or drag and drop
                        </span>
                      </label>
                    </div>
                    {formData.attachments.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {formData.attachments.map((file, index) => (
                          <li
                            key={index}
                            className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded"
                          >
                            <div className="flex items-center gap-2">
                              <PaperClipIcon className="h-4 w-4" />
                              <span className="truncate max-w-xs">{file.name}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeAttachment(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSubmit(true)}
                    disabled={isSubmitting || !formData.title.trim()}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Save Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSubmit(false)}
                    disabled={isSubmitting || !formData.title.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit RFI'}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default RFIFormModal;
