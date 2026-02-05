'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Equipment, EquipmentCheckout, Project } from '@/types';
import { XMarkIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';

interface TeamMember {
  userId: string;
  displayName?: string;
  email?: string;
}

interface CheckOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<EquipmentCheckout>) => Promise<void>;
  equipment: Equipment | null;
  teamMembers: TeamMember[];
  projects: Project[];
}

export function CheckOutModal({
  isOpen,
  onClose,
  onSubmit,
  equipment,
  teamMembers,
  projects,
}: CheckOutModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    projectId: '',
    expectedReturnDate: '',
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        userId: '',
        projectId: '',
        expectedReturnDate: '',
        notes: '',
      });
    }
  }, [isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipment) return;

    setLoading(true);

    try {
      const selectedMember = teamMembers.find((m) => m.userId === formData.userId);
      const selectedProject = projects.find((p) => p.id === formData.projectId);

      await onSubmit({
        equipmentId: equipment.id,
        equipmentName: equipment.name,
        userId: formData.userId,
        userName: selectedMember?.displayName || selectedMember?.email || '',
        projectId: formData.projectId || undefined,
        projectName: selectedProject?.name || undefined,
        expectedReturnDate: formData.expectedReturnDate
          ? new Date(formData.expectedReturnDate)
          : undefined,
        notes: formData.notes || undefined,
        checkedOutAt: new Date(),
      });
      onClose();
    } catch (error) {
      console.error('Error checking out equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !equipment) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Check Out Equipment</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Equipment Info */}
          <div className="p-4 bg-gray-50 border-b">
            <div className="flex items-center gap-3">
              {equipment.photoUrl ? (
                <Image
                  src={equipment.photoUrl}
                  alt={equipment.name}
                  width={48}
                  height={48}
                  className="w-12 h-12 object-cover rounded"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                  <WrenchScrewdriverIcon className="h-6 w-6 text-gray-400" />
                </div>
              )}
              <div>
                <h3 className="font-medium text-gray-900">{equipment.name}</h3>
                {equipment.serialNumber && (
                  <p className="text-sm text-gray-500">SN: {equipment.serialNumber}</p>
                )}
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Assign To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assign To *
              </label>
              <select
                name="userId"
                value={formData.userId}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select team member</option>
                {teamMembers.map((member) => (
                  <option key={member.userId} value={member.userId}>
                    {member.displayName || member.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Project / Job Site */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project / Job Site
              </label>
              <select
                name="projectId"
                value={formData.projectId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select project (optional)</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Expected Return Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expected Return Date
              </label>
              <input
                type="date"
                name="expectedReturnDate"
                value={formData.expectedReturnDate}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any notes about this checkout..."
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm text-white bg-brand-primary hover:opacity-90 rounded-md transition-colors disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Check Out'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CheckOutModal;
