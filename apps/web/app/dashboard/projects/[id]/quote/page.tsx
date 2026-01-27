"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import {
  doc, getDoc, collection, getDocs, addDoc, updateDoc, deleteDoc, Timestamp,
} from 'firebase/firestore';
import { Project, ProjectPhase, QuoteSection } from '@/types';
import { Button, Card, Input, toast } from '@/components/ui';
import { cn, formatCurrency } from '@/lib/utils';
import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

export default function QuoteBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [sections, setSections] = useState<QuoteSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const projectDoc = await getDoc(doc(db, 'projects', projectId));
        if (!projectDoc.exists()) {
          router.push('/dashboard/projects');
          return;
        }
        setProject({ id: projectDoc.id, ...projectDoc.data() } as Project);

        const phasesSnap = await getDocs(collection(db, 'projects', projectId, 'phases'));
        const phasesData = phasesSnap.docs
          .map(d => ({ id: d.id, ...d.data() }) as ProjectPhase)
          .sort((a, b) => a.order - b.order);
        setPhases(phasesData);

        // Expand all phases by default
        setExpandedPhases(new Set(phasesData.map(p => p.id)));

        const quoteSnap = await getDocs(collection(db, 'projects', projectId, 'quoteSections'));
        setSections(quoteSnap.docs.map(d => ({ id: d.id, ...d.data() }) as QuoteSection));
      } catch (error) {
        console.error('Error fetching quote data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [projectId, router]);

  const togglePhase = (phaseId: string) => {
    setExpandedPhases(prev => {
      const next = new Set(prev);
      next.has(phaseId) ? next.delete(phaseId) : next.add(phaseId);
      return next;
    });
  };

  const getSectionsForPhase = (phaseId: string) =>
    sections.filter(s => s.phaseId === phaseId).sort((a, b) => a.order - b.order);

  const getUnassignedSections = () =>
    sections.filter(s => !s.phaseId).sort((a, b) => a.order - b.order);

  const handleAddSection = async (phaseId?: string) => {
    try {
      const phaseSections = phaseId ? getSectionsForPhase(phaseId) : getUnassignedSections();
      const newSection: Omit<QuoteSection, 'id'> = {
        projectId,
        phaseId: phaseId || undefined,
        name: '',
        description: '',
        laborCost: 0,
        materialCost: 0,
        order: phaseSections.length + 1,
        status: 'draft',
        createdAt: new Date(),
      };

      const docRef = await addDoc(collection(db, 'projects', projectId, 'quoteSections'), {
        ...newSection,
        createdAt: Timestamp.now(),
      });

      setSections(prev => [...prev, { id: docRef.id, ...newSection }]);
    } catch (error) {
      console.error('Error adding section:', error);
      toast.error('Failed to add section');
    }
  };

  const handleUpdateSection = async (sectionId: string, field: string, value: string | number) => {
    // Update local state immediately
    setSections(prev => prev.map(s =>
      s.id === sectionId ? { ...s, [field]: value } : s
    ));
  };

  const handleSaveSection = async (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    try {
      await updateDoc(doc(db, 'projects', projectId, 'quoteSections', sectionId), {
        name: section.name,
        description: section.description || '',
        laborCost: section.laborCost,
        materialCost: section.materialCost,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error saving section:', error);
      toast.error('Failed to save');
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    try {
      await deleteDoc(doc(db, 'projects', projectId, 'quoteSections', sectionId));
      setSections(prev => prev.filter(s => s.id !== sectionId));
    } catch (error) {
      console.error('Error deleting section:', error);
      toast.error('Failed to delete section');
    }
  };

  const handleSaveTotal = async () => {
    if (!project) return;
    setSaving(true);
    try {
      const total = sections.reduce((sum, s) => sum + (s.laborCost || 0) + (s.materialCost || 0), 0);
      await updateDoc(doc(db, 'projects', projectId), {
        quoteTotal: total,
        updatedAt: Timestamp.now(),
      });
      setProject(prev => prev ? { ...prev, quoteTotal: total } : null);
      toast.success('Quote total saved');
    } catch (error) {
      console.error('Error saving total:', error);
      toast.error('Failed to save quote total');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) return null;

  const totalLabor = sections.reduce((sum, s) => sum + (s.laborCost || 0), 0);
  const totalMaterials = sections.reduce((sum, s) => sum + (s.materialCost || 0), 0);
  const grandTotal = totalLabor + totalMaterials;

  const renderSectionRow = (section: QuoteSection) => (
    <div key={section.id} className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <input
          type="text"
          value={section.name}
          onChange={(e) => handleUpdateSection(section.id, 'name', e.target.value)}
          onBlur={() => handleSaveSection(section.id)}
          placeholder="Line item name..."
          className="w-full text-sm font-medium text-gray-900 bg-transparent border-0 border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:ring-0 px-0 py-1"
        />
      </div>
      <div className="w-28">
        <div className="relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
          <input
            type="number"
            value={section.laborCost || ''}
            onChange={(e) => handleUpdateSection(section.id, 'laborCost', parseFloat(e.target.value) || 0)}
            onBlur={() => handleSaveSection(section.id)}
            placeholder="Labor"
            className="w-full text-sm text-right text-gray-900 bg-gray-50 rounded px-2 pl-5 py-1 border border-gray-200 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      <div className="w-28">
        <div className="relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
          <input
            type="number"
            value={section.materialCost || ''}
            onChange={(e) => handleUpdateSection(section.id, 'materialCost', parseFloat(e.target.value) || 0)}
            onBlur={() => handleSaveSection(section.id)}
            placeholder="Materials"
            className="w-full text-sm text-right text-gray-900 bg-gray-50 rounded px-2 pl-5 py-1 border border-gray-200 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      <div className="w-24 text-right">
        <span className="text-sm font-medium text-gray-900">
          {formatCurrency((section.laborCost || 0) + (section.materialCost || 0))}
        </span>
      </div>
      <button
        onClick={() => handleDeleteSection(section.id)}
        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push(`/dashboard/projects/${projectId}`)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Project
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Quote Builder</h1>
        <p className="text-gray-500 mt-1">{project.name}</p>
      </div>

      {/* Column Headers */}
      <div className="flex items-center gap-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
        <div className="flex-1">Item</div>
        <div className="w-28 text-right">Labor</div>
        <div className="w-28 text-right">Materials</div>
        <div className="w-24 text-right">Total</div>
        <div className="w-6" />
      </div>

      {/* Phase Accordions */}
      {phases.map((phase) => {
        const phaseSections = getSectionsForPhase(phase.id);
        const isExpanded = expandedPhases.has(phase.id);
        const phaseTotal = phaseSections.reduce((s, sec) => s + (sec.laborCost || 0) + (sec.materialCost || 0), 0);

        return (
          <Card key={phase.id}>
            <button
              onClick={() => togglePhase(phase.id)}
              className="w-full flex items-center justify-between py-1"
            >
              <div className="flex items-center gap-2">
                {isExpanded ? (
                  <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                )}
                <h3 className="font-semibold text-gray-900">{phase.name}</h3>
                <span className="text-xs text-gray-400">({phaseSections.length} items)</span>
              </div>
              <span className="text-sm font-medium text-gray-700">{formatCurrency(phaseTotal)}</span>
            </button>

            {isExpanded && (
              <div className="mt-3 border-t pt-3">
                {phaseSections.map(renderSectionRow)}
                <button
                  onClick={() => handleAddSection(phase.id)}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 mt-3 py-1"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add line item
                </button>
              </div>
            )}
          </Card>
        );
      })}

      {/* Unassigned Sections */}
      {(() => {
        const unassigned = getUnassignedSections();
        if (unassigned.length > 0 || phases.length === 0) {
          return (
            <Card>
              <h3 className="font-semibold text-gray-900 mb-3">
                {phases.length === 0 ? 'Quote Items' : 'General Items'}
              </h3>
              {unassigned.map(renderSectionRow)}
              <button
                onClick={() => handleAddSection()}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 mt-3 py-1"
              >
                <PlusIcon className="h-4 w-4" />
                Add line item
              </button>
            </Card>
          );
        }
        return null;
      })()}

      {/* Totals */}
      <Card>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total Labor</span>
            <span className="font-medium text-gray-900">{formatCurrency(totalLabor)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total Materials</span>
            <span className="font-medium text-gray-900">{formatCurrency(totalMaterials)}</span>
          </div>
          <div className="border-t pt-3 flex justify-between">
            <span className="font-bold text-gray-900 text-lg">Grand Total</span>
            <span className="font-bold text-gray-900 text-lg">{formatCurrency(grandTotal)}</span>
          </div>
          <div className="flex justify-end pt-2">
            <Button variant="primary" onClick={handleSaveTotal} loading={saving}>
              Save Quote Total
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
