'use client';

import { useState } from 'react';
import { MaintenanceRecord } from '@/types';
import {
  WrenchIcon,
  PlusIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

const TYPE_CONFIG: Record<MaintenanceRecord['type'], { label: string; color: string }> = {
  routine: { label: 'Routine', color: 'bg-blue-100 text-blue-700' },
  repair: { label: 'Repair', color: 'bg-orange-100 text-orange-700' },
  inspection: { label: 'Inspection', color: 'bg-green-100 text-green-700' },
};

interface MaintenanceLogProps {
  equipmentId: string;
  records: MaintenanceRecord[];
  onAddRecord: (record: Omit<MaintenanceRecord, 'id'>) => Promise<void>;
  loading?: boolean;
}

export function MaintenanceLog({
  equipmentId,
  records,
  onAddRecord,
  loading,
}: MaintenanceLogProps) {
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: 'routine' as MaintenanceRecord['type'],
    description: '',
    cost: '',
    performedBy: '',
    nextScheduledDate: '',
  });

  const totalCost = records.reduce((sum, r) => sum + (r.cost || 0), 0);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await onAddRecord({
        equipmentId,
        type: formData.type,
        description: formData.description,
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
        performedBy: formData.performedBy,
        performedAt: new Date(),
        nextScheduledDate: formData.nextScheduledDate
          ? new Date(formData.nextScheduledDate)
          : undefined,
      });
      setFormData({
        type: 'routine',
        description: '',
        cost: '',
        performedBy: '',
        nextScheduledDate: '',
      });
      setShowForm(false);
    } catch (error) {
      console.error('Error adding maintenance record:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Maintenance Log</h3>
          <p className="text-sm text-gray-500">
            {records.length} records | Total cost: ${totalCost.toLocaleString()}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          Add Entry
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="p-4 bg-gray-50 border-b space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="routine">Routine Maintenance</option>
                <option value="repair">Repair</option>
                <option value="inspection">Inspection</option>
              </select>
            </div>

            {/* Performed By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Performed By *
              </label>
              <input
                type="text"
                name="performedBy"
                value={formData.performedBy}
                onChange={handleChange}
                required
                placeholder="Name of technician"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>

            {/* Cost */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cost
              </label>
              <input
                type="number"
                name="cost"
                value={formData.cost}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="$0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>

            {/* Next Scheduled Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Next Scheduled Date
              </label>
              <input
                type="date"
                name="nextScheduledDate"
                value={formData.nextScheduledDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={2}
              placeholder="Describe the maintenance performed..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Add Record'}
            </button>
          </div>
        </form>
      )}

      {/* Records List */}
      <div className="divide-y divide-gray-100">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : records.length === 0 ? (
          <div className="p-8 text-center">
            <WrenchIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No maintenance records yet</p>
          </div>
        ) : (
          records
            .sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime())
            .map((record) => (
              <div key={record.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded ${TYPE_CONFIG[record.type].color}`}
                    >
                      {TYPE_CONFIG[record.type].label}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(record.performedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {record.cost !== undefined && record.cost > 0 && (
                    <span className="flex items-center gap-1 text-sm font-medium text-gray-700">
                      <CurrencyDollarIcon className="h-4 w-4" />
                      {record.cost.toLocaleString()}
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-800 mb-2">{record.description}</p>

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <UserIcon className="h-3.5 w-3.5" />
                    {record.performedBy}
                  </span>
                  {record.nextScheduledDate && (
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="h-3.5 w-3.5" />
                      Next: {new Date(record.nextScheduledDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}

export default MaintenanceLog;
