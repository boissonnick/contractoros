"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useMaterialRequests } from '@/lib/hooks/useMaterialRequests';
import { toast } from '@/components/ui/Toast';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { MaterialRequestItem, MaterialRequestPriority, MaterialRequest } from '@/types';
import {
  CubeIcon,
  PlusIcon,
  TrashIcon,
  PaperAirplaneIcon,
  ClockIcon,
  CheckCircleIcon,
  TruckIcon,
  XCircleIcon,
  ShoppingCartIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { logger } from '@/lib/utils/logger';

interface ProjectOption {
  id: string;
  name: string;
}

const UNIT_OPTIONS = [
  { value: 'ea', label: 'Each (ea)' },
  { value: 'lf', label: 'Linear ft (lf)' },
  { value: 'sf', label: 'Sq ft (sf)' },
  { value: 'cy', label: 'Cubic yd (cy)' },
  { value: 'ton', label: 'Ton' },
  { value: 'bag', label: 'Bag' },
  { value: 'box', label: 'Box' },
  { value: 'roll', label: 'Roll' },
  { value: 'gal', label: 'Gallon (gal)' },
  { value: 'bundle', label: 'Bundle' },
  { value: 'pallet', label: 'Pallet' },
  { value: 'other', label: 'Other' },
];

const STATUS_CONFIG: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  pending: { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon, label: 'Pending' },
  approved: { color: 'bg-blue-100 text-blue-800', icon: CheckCircleIcon, label: 'Approved' },
  ordered: { color: 'bg-purple-100 text-purple-800', icon: ShoppingCartIcon, label: 'Ordered' },
  delivered: { color: 'bg-green-100 text-green-800', icon: TruckIcon, label: 'Delivered' },
  rejected: { color: 'bg-red-100 text-red-800', icon: XCircleIcon, label: 'Rejected' },
};

const PRIORITY_CONFIG: Record<MaterialRequestPriority, { color: string; activeColor: string; label: string }> = {
  low: { color: 'bg-gray-100 text-gray-600', activeColor: 'bg-gray-700 text-white ring-2 ring-gray-700 ring-offset-1', label: 'Low' },
  normal: { color: 'bg-blue-50 text-blue-600', activeColor: 'bg-blue-600 text-white ring-2 ring-blue-600 ring-offset-1', label: 'Normal' },
  urgent: { color: 'bg-red-50 text-red-600', activeColor: 'bg-red-600 text-white ring-2 ring-red-600 ring-offset-1', label: 'Urgent' },
};

function emptyItem(): MaterialRequestItem {
  return { name: '', quantity: 1, unit: 'ea' };
}

export default function FieldMaterialsPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const { requests, loading: requestsLoading, addRequest } = useMaterialRequests();

  // Projects for dropdown
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  // Form state
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedProjectName, setSelectedProjectName] = useState('');
  const [items, setItems] = useState<MaterialRequestItem[]>([emptyItem()]);
  const [priority, setPriority] = useState<MaterialRequestPriority>('normal');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load active projects
  useEffect(() => {
    if (!profile?.orgId) { setProjectsLoading(false); return; }

    const loadProjects = async () => {
      try {
        const q = query(
          collection(db, 'projects'),
          where('orgId', '==', profile.orgId),
          where('status', '==', 'active')
        );
        const snapshot = await getDocs(q);
        const projectList = snapshot.docs.map((d) => ({
          id: d.id,
          name: d.data().name as string,
        }));
        projectList.sort((a, b) => a.name.localeCompare(b.name));
        setProjects(projectList);
      } catch (err) {
        logger.error('Failed to load projects', { error: err, page: 'field-materials' });
      } finally {
        setProjectsLoading(false);
      }
    };

    loadProjects();
  }, [profile?.orgId]);

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId);
    const project = projects.find((p) => p.id === projectId);
    setSelectedProjectName(project?.name || '');
  };

  const updateItem = (index: number, updates: Partial<MaterialRequestItem>) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...updates } : item))
    );
  };

  const addItem = () => {
    setItems((prev) => [...prev, emptyItem()]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setSelectedProjectId('');
    setSelectedProjectName('');
    setItems([emptyItem()]);
    setPriority('normal');
    setNotes('');
  };

  const handleSubmit = async () => {
    if (!user || !profile) return;

    // Validation
    if (!selectedProjectId) {
      toast.error('Please select a project');
      return;
    }

    const validItems = items.filter((item) => item.name.trim() !== '');
    if (validItems.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    const hasInvalidQuantity = validItems.some((item) => item.quantity < 1);
    if (hasInvalidQuantity) {
      toast.error('All items must have a quantity of at least 1');
      return;
    }

    setSubmitting(true);
    try {
      await addRequest({
        projectId: selectedProjectId,
        projectName: selectedProjectName,
        requestedBy: user.uid,
        requestedByName: profile.displayName || 'Unknown',
        items: validItems,
        priority,
        notes: notes.trim() || undefined,
        status: 'pending',
      });
      toast.success('Material request submitted');
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter to show only the current user's requests
  const myRequests = requests.filter((r) => r.requestedBy === user?.uid);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="flex items-center gap-2 px-4 py-3">
          <CubeIcon className="h-6 w-6 text-brand-primary" />
          <h1 className="text-lg font-semibold tracking-tight">Material Request</h1>
        </div>
      </div>

      {/* Request Form */}
      <div className="p-4 space-y-4">
        {/* Project Selection */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">Project</label>
          {projectsLoading ? (
            <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
          ) : (
            <select
              value={selectedProjectId}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
            >
              <option value="">Select a project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Items */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-3">Items</label>
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Item {index + 1}
                  </span>
                  {items.length > 1 && (
                    <button
                      onClick={() => removeItem(index)}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 active:bg-red-100"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => updateItem(index, { name: e.target.value })}
                  placeholder="Material name (e.g., 2x4 studs)"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                    min={1}
                    className="w-24 px-3 py-2.5 border border-gray-300 rounded-xl text-sm text-center focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                  />
                  <select
                    value={item.unit}
                    onChange={(e) => updateItem(index, { unit: e.target.value })}
                    className="flex-1 px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                  >
                    {UNIT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={addItem}
            className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-500 hover:border-brand-primary hover:text-brand-primary active:bg-brand-primary/5 transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Add Item
          </button>
        </div>

        {/* Priority */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(PRIORITY_CONFIG) as MaterialRequestPriority[]).map((p) => {
              const config = PRIORITY_CONFIG[p];
              const isActive = priority === p;
              return (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive ? config.activeColor : config.color + ' hover:opacity-80'
                  }`}
                >
                  {p === 'urgent' && <ExclamationTriangleIcon className="h-4 w-4" />}
                  {config.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional details, delivery instructions, etc."
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary resize-none"
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-brand-primary text-white rounded-xl font-medium text-base hover:bg-brand-primary/90 active:bg-brand-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {submitting ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
          ) : (
            <>
              <PaperAirplaneIcon className="h-5 w-5" />
              Submit Request
            </>
          )}
        </button>
      </div>

      {/* Your Requests */}
      <div className="px-4 mt-2">
        <h2 className="text-base font-semibold text-gray-900 mb-3">Your Requests</h2>
        {requestsLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : myRequests.length === 0 ? (
          <div className="text-center py-8">
            <CubeIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No requests yet</p>
            <p className="text-gray-400 text-xs mt-1">Submit a material request above</p>
          </div>
        ) : (
          <div className="space-y-3 pb-4">
            {myRequests.map((req: MaterialRequest) => {
              const statusConf = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
              const StatusIcon = statusConf.icon;
              return (
                <div
                  key={req.id}
                  className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{req.projectName}</p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {req.items.length} item{req.items.length !== 1 ? 's' : ''}
                        {' -- '}
                        {req.items.map((item) => item.name).filter(Boolean).join(', ') || 'No items'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {req.createdAt instanceof Date
                          ? req.createdAt.toLocaleDateString()
                          : new Date(req.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="ml-3 flex flex-col items-end gap-1.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusConf.color}`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {statusConf.label}
                      </span>
                      {req.priority === 'urgent' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          <ExclamationTriangleIcon className="h-3 w-3" />
                          Urgent
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
