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
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { useScopes } from '@/lib/hooks/useScopes';
import { useBids } from '@/lib/hooks/useBids';

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
  const [quoteStatus, setQuoteStatus] = useState<'draft' | 'sent' | 'approved' | 'rejected'>('draft');
  const [showImport, setShowImport] = useState(false);

  const { currentScope } = useScopes({ projectId });
  const { bids } = useBids(projectId);
  const acceptedBids = bids.filter(b => b.status === 'accepted');

  const handleImportFromScope = async () => {
    if (!currentScope) return;
    for (const item of currentScope.items) {
      const newSection: Omit<QuoteSection, 'id'> = {
        projectId,
        phaseId: item.phaseId,
        name: item.title,
        description: item.description || '',
        laborCost: item.estimatedCost || 0,
        materialCost: item.materials.reduce((s, m) => s + ((m.estimatedCost || 0) * (m.quantity || 1)), 0),
        order: sections.length + 1,
        status: 'draft',
        createdAt: new Date(),
      };
      const docRef = await addDoc(collection(db, 'projects', projectId, 'quoteSections'), {
        ...newSection,
        createdAt: Timestamp.now(),
      });
      setSections(prev => [...prev, { id: docRef.id, ...newSection }]);
    }
    setShowImport(false);
    toast.success(`Imported ${currentScope.items.length} scope items`);
  };

  const handleImportFromBids = async () => {
    for (const bid of acceptedBids) {
      const newSection: Omit<QuoteSection, 'id'> = {
        projectId,
        phaseId: bid.phaseIds?.[0],
        name: `Bid: ${bid.description || 'Accepted bid'}`,
        description: '',
        laborCost: bid.laborCost || bid.amount,
        materialCost: bid.materialCost || 0,
        order: sections.length + 1,
        status: 'draft',
        createdAt: new Date(),
      };
      const docRef = await addDoc(collection(db, 'projects', projectId, 'quoteSections'), {
        ...newSection,
        createdAt: Timestamp.now(),
      });
      setSections(prev => [...prev, { id: docRef.id, ...newSection }]);
    }
    setShowImport(false);
    toast.success(`Imported ${acceptedBids.length} accepted bids`);
  };

  const handleStatusChange = async (newStatus: 'draft' | 'sent' | 'approved' | 'rejected') => {
    if (!project) return;
    try {
      await updateDoc(doc(db, 'projects', projectId), {
        quoteStatus: newStatus,
        updatedAt: Timestamp.now(),
      });
      setQuoteStatus(newStatus);
      toast.success(`Quote marked as ${newStatus}`);
    } catch {
      toast.error('Failed to update quote status');
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const projectDoc = await getDoc(doc(db, 'projects', projectId));
        if (!projectDoc.exists()) {
          router.push('/dashboard/projects');
          return;
        }
        const projData = projectDoc.data();
        setProject({ id: projectDoc.id, ...projData } as Project);
        if (projData?.quoteStatus) setQuoteStatus(projData.quoteStatus);

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

      // Build Firestore data, only include phaseId if it exists
      const firestoreData: Record<string, unknown> = {
        projectId,
        name: '',
        description: '',
        laborCost: 0,
        materialCost: 0,
        order: phaseSections.length + 1,
        status: 'draft',
        createdAt: Timestamp.now(),
      };
      if (phaseId) {
        firestoreData.phaseId = phaseId;
      }

      const docRef = await addDoc(collection(db, 'projects', projectId, 'quoteSections'), firestoreData);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quote Builder</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn(
              'text-xs px-2 py-0.5 rounded-full font-medium',
              quoteStatus === 'draft' && 'bg-gray-100 text-gray-600',
              quoteStatus === 'sent' && 'bg-blue-100 text-blue-700',
              quoteStatus === 'approved' && 'bg-green-100 text-green-700',
              quoteStatus === 'rejected' && 'bg-red-100 text-red-600',
            )}>{quoteStatus}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Button variant="secondary" size="sm" onClick={() => setShowImport(!showImport)} icon={<ArrowDownTrayIcon className="h-4 w-4" />}>
              Import
            </Button>
            {showImport && (
              <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
                <button
                  onClick={handleImportFromScope}
                  disabled={!currentScope || currentScope.items.length === 0}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 disabled:text-gray-300 disabled:hover:bg-transparent"
                >
                  From Scope ({currentScope?.items.length || 0} items)
                </button>
                <button
                  onClick={handleImportFromBids}
                  disabled={acceptedBids.length === 0}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 disabled:text-gray-300 disabled:hover:bg-transparent"
                >
                  From Accepted Bids ({acceptedBids.length})
                </button>
              </div>
            )}
          </div>
          <select
            value={quoteStatus}
            onChange={(e) => handleStatusChange(e.target.value as 'draft' | 'sent' | 'approved' | 'rejected')}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5"
          >
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
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
