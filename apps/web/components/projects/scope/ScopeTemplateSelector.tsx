"use client";

import React, { useState, useEffect } from 'react';
import { ScopeItem } from '@/types';
import { useAuth } from '@/lib/auth';
import { ensureSowTemplates, SowTemplateData } from '@/lib/firebase/seedSowTemplates';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { XMarkIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

interface ScopeTemplateSelectorProps {
  onSelect: (items: ScopeItem[]) => void;
  onClose: () => void;
}

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export default function ScopeTemplateSelector({ onSelect, onClose }: ScopeTemplateSelectorProps) {
  const { profile } = useAuth();
  const [templates, setTemplates] = useState<SowTemplateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SowTemplateData | null>(null);

  useEffect(() => {
    if (!profile?.orgId) return;
    ensureSowTemplates(profile.orgId)
      .then(setTemplates)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [profile?.orgId]);

  const handleApply = () => {
    if (!selected) return;
    const items: ScopeItem[] = selected.items.map((item, idx) => ({
      ...item,
      id: `tmpl_${Date.now()}_${idx}`,
    }));
    onSelect(items);
  };

  const totalCost = selected?.items.reduce((s, i) => s + (i.estimatedCost || 0), 0) || 0;
  const totalMaterials = selected?.items.reduce((s, i) =>
    s + i.materials.reduce((ms, m) => ms + ((m.estimatedCost || 0) * (m.quantity || 1)), 0), 0) || 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Start from Template</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
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
                      isSelected ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <DocumentTextIcon className={cn('h-6 w-6 mt-0.5', isSelected ? 'text-blue-600' : 'text-gray-400')} />
                      <div>
                        <h4 className={cn('font-semibold text-sm', isSelected ? 'text-blue-900' : 'text-gray-900')}>{tmpl.name}</h4>
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

          {/* Preview */}
          {selected && (
            <div className="mt-5 border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b">
                <h4 className="text-sm font-semibold text-gray-900">{selected.name} — Preview</h4>
                <p className="text-xs text-gray-500">
                  {selected.items.length} items · Labor: {fmt(totalCost)} · Materials: {fmt(totalMaterials)} · Total: {fmt(totalCost + totalMaterials)}
                </p>
              </div>
              <div className="divide-y max-h-64 overflow-y-auto">
                {selected.items.map((item, idx) => (
                  <div key={idx} className="px-4 py-2.5 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-900">{item.title}</span>
                      <span className="text-gray-500">{fmt(item.estimatedCost || 0)}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {item.estimatedHours}h · {item.materials.length} materials
                    </p>
                  </div>
                ))}
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
