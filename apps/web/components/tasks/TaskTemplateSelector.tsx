"use client";

import React, { useState, useMemo } from 'react';
import { DEFAULT_TASK_TEMPLATES, DefaultTaskTemplate, getUniqueTrades } from '@/lib/constants/defaultTaskTemplates';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import {
  MagnifyingGlassIcon,
  ClockIcon,
  CheckCircleIcon,
  XMarkIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';

interface TaskTemplateSelectorProps {
  onSelect: (template: DefaultTaskTemplate) => void;
  onClose: () => void;
}

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

export default function TaskTemplateSelector({ onSelect, onClose }: TaskTemplateSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrade, setSelectedTrade] = useState<string>('all');

  const trades = useMemo(() => ['all', ...getUniqueTrades()], []);

  const filteredTemplates = useMemo(() => {
    return DEFAULT_TASK_TEMPLATES.filter((template) => {
      const matchesSearch =
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.defaultTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.defaultDescription?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTrade = selectedTrade === 'all' || template.trade === selectedTrade;
      return matchesSearch && matchesTrade;
    });
  }, [searchQuery, selectedTrade]);

  // Group templates by trade for display
  const groupedTemplates = useMemo(() => {
    if (selectedTrade !== 'all') {
      return { [selectedTrade]: filteredTemplates };
    }
    return filteredTemplates.reduce((acc, template) => {
      const trade = template.trade || 'Other';
      if (!acc[trade]) acc[trade] = [];
      acc[trade].push(template);
      return acc;
    }, {} as Record<string, DefaultTaskTemplate[]>);
  }, [filteredTemplates, selectedTrade]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Task Templates</h2>
            <p className="text-sm text-gray-500">Select a template to create a new task</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Search & Filters */}
        <div className="p-4 border-b border-gray-100 space-y-3">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-transparent"
              autoFocus
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {trades.map((trade) => (
              <button
                key={trade}
                onClick={() => setSelectedTrade(trade)}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-full border transition-colors',
                  selectedTrade === trade
                    ? 'bg-brand-50 border-brand-300 text-brand-primary'
                    : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                )}
              >
                {trade === 'all' ? 'All Trades' : trade}
              </button>
            ))}
          </div>
        </div>

        {/* Template List */}
        <div className="flex-1 overflow-y-auto p-4">
          {Object.keys(groupedTemplates).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <WrenchScrewdriverIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No templates found matching your criteria</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedTemplates).map(([trade, templates]) => (
                <div key={trade}>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                    {trade}
                  </h3>
                  <div className="space-y-2">
                    {templates.map((template, index) => (
                      <button
                        key={`${template.name}-${index}`}
                        onClick={() => onSelect(template)}
                        className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-brand-300 hover:bg-brand-50/50 transition-all group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 group-hover:text-brand-700">
                              {template.name}
                            </h4>
                            {template.defaultDescription && (
                              <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                                {template.defaultDescription}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2">
                              <span className={cn(
                                'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                                priorityColors[template.defaultPriority]
                              )}>
                                {template.defaultPriority}
                              </span>
                              {template.defaultEstimatedHours && (
                                <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                                  <ClockIcon className="h-3.5 w-3.5" />
                                  {template.defaultEstimatedHours}h estimated
                                </span>
                              )}
                              {template.defaultChecklist && template.defaultChecklist.length > 0 && (
                                <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                                  <CheckCircleIcon className="h-3.5 w-3.5" />
                                  {template.defaultChecklist.length} checklist items
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-xs font-medium text-brand-600">Use →</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} available
            </p>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
