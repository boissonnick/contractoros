"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { PhaseTemplate, PhaseTemplatePhase } from '@/types';
import { Button, Card, Input, toast } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  XMarkIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';

export function PhaseTemplatesTab() {
  const { profile } = useAuth();
  const [templates, setTemplates] = useState<PhaseTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const [editName, setEditName] = useState('');
  const [editScopeType, setEditScopeType] = useState('');
  const [editPhases, setEditPhases] = useState<PhaseTemplatePhase[]>([]);

  const [newName, setNewName] = useState('');
  const [newScopeType, setNewScopeType] = useState('');
  const [newPhases, setNewPhases] = useState<PhaseTemplatePhase[]>([
    { name: '', order: 1 },
  ]);

  useEffect(() => {
    if (profile?.orgId) loadTemplates();
  }, [profile?.orgId]);

  const loadTemplates = async () => {
    if (!profile?.orgId) return;
    setLoading(true);
    try {
      const snap = await getDocs(
        collection(db, 'organizations', profile.orgId, 'phaseTemplates')
      );
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() }) as PhaseTemplate)
        .sort((a, b) => a.name.localeCompare(b.name));
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!profile?.orgId || !newName.trim() || !newScopeType.trim()) {
      toast.error('Name and scope type are required');
      return;
    }
    const validPhases = newPhases.filter(p => p.name.trim());
    if (validPhases.length === 0) {
      toast.error('Add at least one phase');
      return;
    }

    try {
      await addDoc(collection(db, 'organizations', profile.orgId, 'phaseTemplates'), {
        orgId: profile.orgId,
        name: newName.trim(),
        scopeType: newScopeType.trim().toLowerCase().replace(/\s+/g, '_'),
        phases: validPhases.map((p, i) => ({ name: p.name.trim(), order: i + 1 })),
        isDefault: false,
        createdAt: Timestamp.now(),
      });
      toast.success('Template created');
      setShowAddForm(false);
      setNewName('');
      setNewScopeType('');
      setNewPhases([{ name: '', order: 1 }]);
      loadTemplates();
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    }
  };

  const startEditing = (template: PhaseTemplate) => {
    setEditingId(template.id);
    setEditName(template.name);
    setEditScopeType(template.scopeType);
    setEditPhases([...template.phases].sort((a, b) => a.order - b.order));
    setExpandedId(template.id);
  };

  const handleSaveEdit = async () => {
    if (!profile?.orgId || !editingId) return;
    const validPhases = editPhases.filter(p => p.name.trim());
    if (!editName.trim() || validPhases.length === 0) {
      toast.error('Name and at least one phase required');
      return;
    }

    try {
      await updateDoc(doc(db, 'organizations', profile.orgId, 'phaseTemplates', editingId), {
        name: editName.trim(),
        scopeType: editScopeType.trim().toLowerCase().replace(/\s+/g, '_'),
        phases: validPhases.map((p, i) => ({ name: p.name.trim(), order: i + 1 })),
        updatedAt: Timestamp.now(),
      });
      toast.success('Template updated');
      setEditingId(null);
      loadTemplates();
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error('Failed to update template');
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!profile?.orgId) return;
    if (!confirm('Delete this template? This cannot be undone.')) return;

    try {
      await deleteDoc(doc(db, 'organizations', profile.orgId, 'phaseTemplates', templateId));
      toast.success('Template deleted');
      if (expandedId === templateId) setExpandedId(null);
      if (editingId === templateId) setEditingId(null);
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const movePhase = (phases: PhaseTemplatePhase[], index: number, dir: -1 | 1, setter: (p: PhaseTemplatePhase[]) => void) => {
    const newIdx = index + dir;
    if (newIdx < 0 || newIdx >= phases.length) return;
    const next = [...phases];
    [next[index], next[newIdx]] = [next[newIdx], next[index]];
    setter(next.map((p, i) => ({ ...p, order: i + 1 })));
  };

  const addPhaseRow = (phases: PhaseTemplatePhase[], setter: (p: PhaseTemplatePhase[]) => void) => {
    setter([...phases, { name: '', order: phases.length + 1 }]);
  };

  const removePhaseRow = (phases: PhaseTemplatePhase[], index: number, setter: (p: PhaseTemplatePhase[]) => void) => {
    setter(phases.filter((_, i) => i !== index).map((p, i) => ({ ...p, order: i + 1 })));
  };

  const updatePhaseName = (phases: PhaseTemplatePhase[], index: number, name: string, setter: (p: PhaseTemplatePhase[]) => void) => {
    setter(phases.map((p, i) => i === index ? { ...p, name } : p));
  };

  const renderPhaseEditor = (phases: PhaseTemplatePhase[], setter: (p: PhaseTemplatePhase[]) => void) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Phases</label>
      {phases.map((phase, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="text-xs text-gray-400 w-6 text-right">{index + 1}.</span>
          <input
            type="text"
            value={phase.name}
            onChange={(e) => updatePhaseName(phases, index, e.target.value, setter)}
            placeholder="Phase name..."
            className="flex-1 text-sm px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          />
          <button
            onClick={() => movePhase(phases, index, -1, setter)}
            disabled={index === 0}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
          >
            <ArrowUpIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => movePhase(phases, index, 1, setter)}
            disabled={index === phases.length - 1}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
          >
            <ArrowDownIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => removePhaseRow(phases, index, setter)}
            className="p-1 text-gray-400 hover:text-red-500"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        onClick={() => addPhaseRow(phases, setter)}
        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mt-2"
      >
        <PlusIcon className="h-4 w-4" />
        Add Phase
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Phase Templates</h2>
          <p className="text-sm text-gray-500">
            Define construction phases for different project types. Templates are used when creating new projects.
          </p>
        </div>
        <Button
          variant="primary"
          icon={<PlusIcon className="h-4 w-4" />}
          onClick={() => setShowAddForm(true)}
        >
          Add Template
        </Button>
      </div>

      {/* Add Template Form */}
      {showAddForm && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">New Template</h3>
            <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Template Name"
                placeholder="e.g., Kitchen Remodel"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <Input
                label="Scope Type"
                placeholder="e.g., kitchen_remodel"
                value={newScopeType}
                onChange={(e) => setNewScopeType(e.target.value)}
              />
            </div>
            {renderPhaseEditor(newPhases, setNewPhases)}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleCreateTemplate}>Create Template</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Template List */}
      {templates.length === 0 && !showAddForm ? (
        <Card className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Squares2X2Icon className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No phase templates</h3>
          <p className="text-gray-500 mb-6">Create your first template to define construction phases for projects.</p>
          <Button variant="primary" onClick={() => setShowAddForm(true)} icon={<PlusIcon className="h-4 w-4" />}>
            Create Template
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {templates.map((template) => {
            const isExpanded = expandedId === template.id;
            const isEditing = editingId === template.id;
            const sortedPhases = [...template.phases].sort((a, b) => a.order - b.order);

            return (
              <Card key={template.id}>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      if (isEditing) return;
                      setExpandedId(isExpanded ? null : template.id);
                    }}
                    className="flex items-center gap-3 flex-1 text-left"
                  >
                    {isExpanded ? (
                      <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{template.name}</h3>
                        {template.isDefault && (
                          <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">Default</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {template.scopeType.replace(/_/g, ' ')} &middot; {template.phases.length} phases
                      </p>
                    </div>
                  </button>
                  <div className="flex items-center gap-2">
                    {!isEditing && (
                      <>
                        <button
                          onClick={() => startEditing(template)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(template.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {isExpanded && !isEditing && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex flex-wrap gap-2">
                      {sortedPhases.map((phase, i) => (
                        <React.Fragment key={i}>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 text-sm rounded-lg">
                            <span className="text-xs text-gray-400">{phase.order}.</span>
                            {phase.name}
                          </span>
                          {i < sortedPhases.length - 1 && (
                            <span className="text-gray-300 self-center">&rarr;</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}

                {isEditing && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Template Name"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                      <Input
                        label="Scope Type"
                        value={editScopeType}
                        onChange={(e) => setEditScopeType(e.target.value)}
                      />
                    </div>
                    {renderPhaseEditor(editPhases, setEditPhases)}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                      <Button variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                      <Button variant="primary" onClick={handleSaveEdit}>Save Changes</Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
