"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { ScopeItem } from '@/types';
import { useAuth } from '@/lib/auth';
import { ensureSowTemplates, SowTemplateData } from '@/lib/firebase/seedSowTemplates';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { XMarkIcon, DocumentTextIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

interface ScopeTemplateSelectorProps {
  onSelect: (items: ScopeItem[]) => void;
  onClose: () => void;
  /** Available project phases for mapping */
  phases?: { id: string; name: string }[];
}

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

// Phase mapping keywords - maps common task patterns to phase names
const PHASE_KEYWORDS: Record<string, string[]> = {
  'Pre-Construction': ['permit', 'design', 'planning', 'survey'],
  'Demo': ['demo', 'demolition', 'tear-off', 'removal', 'strip'],
  'Rough': ['rough', 'framing', 'foundation', 'excavat'],
  'MEP Rough': ['electrical', 'plumbing', 'hvac', 'mep', 'wiring'],
  'Finishes': ['finish', 'paint', 'trim', 'tile', 'floor', 'drywall', 'cabinet', 'counter'],
  'Final': ['final', 'inspection', 'fixture', 'appliance', 'punch'],
};

/**
 * Match a template item to a project phase
 * Priority: 1) phaseName from template item, 2) title keywords, 3) keyword patterns
 */
function matchPhase(
  itemTitle: string,
  phases: { id: string; name: string }[],
  itemPhaseName?: string
): string {
  // Priority 1: If template item specifies a phaseName, try to match it
  if (itemPhaseName) {
    const phaseNameLower = itemPhaseName.toLowerCase();
    const directMatch = phases.find(p =>
      p.name.toLowerCase() === phaseNameLower ||
      p.name.toLowerCase().includes(phaseNameLower) ||
      phaseNameLower.includes(p.name.toLowerCase())
    );
    if (directMatch) return directMatch.id;
  }

  const title = itemTitle.toLowerCase();

  // Priority 2: Try to match against phase names directly
  for (const phase of phases) {
    const phaseLower = phase.name.toLowerCase();
    if (title.includes(phaseLower) || phaseLower.includes(title.split(' ')[0])) {
      return phase.id;
    }
  }

  // Priority 3: Try keyword matching
  for (const [phaseName, keywords] of Object.entries(PHASE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (title.includes(keyword)) {
        // Find a matching phase by name similarity
        const matchedPhase = phases.find(p =>
          p.name.toLowerCase().includes(phaseName.toLowerCase()) ||
          phaseName.toLowerCase().includes(p.name.toLowerCase())
        );
        if (matchedPhase) return matchedPhase.id;
      }
    }
  }

  return ''; // Unassigned
}

export default function ScopeTemplateSelector({ onSelect, onClose, phases = [] }: ScopeTemplateSelectorProps) {
  const { profile } = useAuth();
  const [templates, setTemplates] = useState<SowTemplateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SowTemplateData | null>(null);
  const [autoAssignPhases, setAutoAssignPhases] = useState(phases.length > 0);

  useEffect(() => {
    if (!profile?.orgId) return;
    ensureSowTemplates(profile.orgId)
      .then(setTemplates)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [profile?.orgId]);

  // Preview items with phase assignments
  const previewItems = useMemo(() => {
    if (!selected) return [];
    return selected.items.map((item, idx) => {
      // Support both old templates (no phaseName) and new templates (with phaseName)
      const itemWithPhaseName = item as typeof item & { phaseName?: string };
      return {
        ...item,
        id: `tmpl_${Date.now()}_${idx}`,
        phaseId: autoAssignPhases && phases.length > 0
          ? matchPhase(item.title, phases, itemWithPhaseName.phaseName)
          : '',
      };
    });
  }, [selected, autoAssignPhases, phases]);

  const handleApply = () => {
    if (!selected) return;
    onSelect(previewItems);
  };

  const totalCost = selected?.items.reduce((s, i) => s + (i.estimatedCost || 0), 0) || 0;
  const totalMaterials = selected?.items.reduce((s, i) =>
    s + i.materials.reduce((ms, m) => ms + ((m.estimatedCost || 0) * (m.quantity || 1)), 0), 0) || 0;

  // Count items by phase for preview
  const itemsByPhase = useMemo(() => {
    const counts: Record<string, number> = { unassigned: 0 };
    for (const item of previewItems) {
      if (item.phaseId) {
        const phase = phases.find(p => p.id === item.phaseId);
        const name = phase?.name || 'Unknown';
        counts[name] = (counts[name] || 0) + 1;
      } else {
        counts['unassigned']++;
      }
    }
    return counts;
  }, [previewItems, phases]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overscroll-contain">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Start from Template</h3>
          <button
            onClick={onClose}
            className="p-2 -m-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {templates.map(tmpl => {
                const isSelected = selected?.name === tmpl.name;
                const cost = tmpl.items.reduce((s, i) => s + (i.estimatedCost || 0), 0);
                return (
                  <button
                    key={tmpl.id || tmpl.name}
                    onClick={() => setSelected(tmpl)}
                    className={cn(
                      'text-left p-4 rounded-lg border-2 transition-all hover:shadow-md',
                      isSelected ? 'border-brand-primary bg-brand-50 ring-1 ring-brand-primary' : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <DocumentTextIcon className={cn('h-6 w-6 mt-0.5', isSelected ? 'text-brand-primary' : 'text-gray-400')} />
                      <div>
                        <h4 className={cn('font-semibold text-sm', isSelected ? 'text-gray-900' : 'text-gray-900')}>{tmpl.name}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">{tmpl.description}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {tmpl.items.length} items · {fmt(cost)} labor
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Phase assignment toggle */}
          {selected && phases.length > 0 && (
            <div className="mt-5 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
              <InformationCircleIcon className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-blue-800 font-medium">Auto-assign items to phases</p>
                  <button
                    onClick={() => setAutoAssignPhases(!autoAssignPhases)}
                    className={cn(
                      'relative w-10 h-5 rounded-full transition-colors',
                      autoAssignPhases ? 'bg-brand-primary' : 'bg-gray-300'
                    )}
                  >
                    <span className={cn(
                      'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform',
                      autoAssignPhases && 'translate-x-5'
                    )} />
                  </button>
                </div>
                {autoAssignPhases && (
                  <p className="text-xs text-blue-600 mt-1">
                    Items will be matched to phases based on task type. Unmatched items go to "Unassigned".
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Preview */}
          {selected && (
            <div className="mt-5 border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b">
                <h4 className="text-sm font-semibold text-gray-900">{selected.name} — Preview</h4>
                <p className="text-xs text-gray-500">
                  {selected.items.length} items · Labor: {fmt(totalCost)} · Materials: {fmt(totalMaterials)} · Total: {fmt(totalCost + totalMaterials)}
                </p>
                {autoAssignPhases && phases.length > 0 && (
                  <p className="text-xs text-brand-primary mt-1">
                    Phase assignment: {Object.entries(itemsByPhase)
                      .filter(([, count]) => count > 0)
                      .map(([name, count]) => `${name}: ${count}`)
                      .join(' · ')}
                  </p>
                )}
              </div>
              <div className="divide-y max-h-64 overflow-y-auto">
                {previewItems.map((item, idx) => {
                  const phase = phases.find(p => p.id === item.phaseId);
                  return (
                    <div key={idx} className="px-4 py-2.5 text-sm">
                      <div className="flex justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{item.title}</span>
                          {autoAssignPhases && phase && (
                            <span className="text-xs px-1.5 py-0.5 bg-brand-50 text-brand-primary rounded">
                              {phase.name}
                            </span>
                          )}
                          {autoAssignPhases && !phase && (
                            <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                              Unassigned
                            </span>
                          )}
                        </div>
                        <span className="text-gray-500">{fmt(item.estimatedCost || 0)}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {item.estimatedHours}h · {item.materials.length} materials
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-5 border-t">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={handleApply} disabled={!selected}>
            Use Template ({selected?.items.length || 0} items)
          </Button>
        </div>
      </div>
    </div>
  );
}
