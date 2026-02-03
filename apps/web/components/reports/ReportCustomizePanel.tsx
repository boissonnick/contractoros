"use client";

import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  XMarkIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  StarIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowPathIcon,
  ChartBarIcon,
  TableCellsIcon,
  PresentationChartLineIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';
import { FinancialMetricId, MetricCardDefinition } from '@/types';
import Button from '@/components/ui/Button';

interface ReportCustomizePanelProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: {
    visibleMetrics: FinancialMetricId[];
    metricOrder: FinancialMetricId[];
    favoriteMetrics: FinancialMetricId[];
  } | null;
  metricDefinitions: MetricCardDefinition[];
  saving: boolean;
  onToggleVisibility: (metricId: FinancialMetricId) => void;
  onToggleFavorite: (metricId: FinancialMetricId) => void;
  onMoveUp: (metricId: FinancialMetricId) => void;
  onMoveDown: (metricId: FinancialMetricId) => void;
  onReset: () => void;
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  kpi: PresentationChartLineIcon,
  chart: ChartBarIcon,
  table: TableCellsIcon,
};

const CATEGORY_LABELS: Record<string, string> = {
  kpi: 'KPI Cards',
  chart: 'Charts',
  table: 'Tables',
};

export function ReportCustomizePanel({
  isOpen,
  onClose,
  preferences,
  metricDefinitions,
  saving,
  onToggleVisibility,
  onToggleFavorite,
  onMoveUp,
  onMoveDown,
  onReset,
}: ReportCustomizePanelProps) {
  if (!preferences) return null;

  // Group metrics by category while preserving order
  const orderedMetrics = preferences.metricOrder
    .map(id => metricDefinitions.find(m => m.id === id))
    .filter((m): m is MetricCardDefinition => m !== undefined);

  // Get metrics not in order (newly added defaults)
  const unorderedMetrics = metricDefinitions.filter(
    m => !preferences.metricOrder.includes(m.id)
  );

  const allOrderedMetrics = [...orderedMetrics, ...unorderedMetrics];

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                    {/* Header */}
                    <div className="bg-brand-primary px-4 py-6 sm:px-6">
                      <div className="flex items-center justify-between">
                        <Dialog.Title className="text-lg font-semibold text-white">
                          Customize Report
                        </Dialog.Title>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className="rounded-md bg-brand-primary text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white"
                            onClick={onClose}
                          >
                            <span className="sr-only">Close panel</span>
                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-white/80">
                        Choose which metrics to display and their order
                      </p>
                    </div>

                    {/* Content */}
                    <div className="flex-1 px-4 py-6 sm:px-6">
                      {/* Legend */}
                      <div className="mb-6 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs font-medium text-gray-500 mb-2">Legend</p>
                        <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                          <span className="flex items-center gap-1">
                            <EyeIcon className="h-4 w-4" /> Visible
                          </span>
                          <span className="flex items-center gap-1">
                            <EyeSlashIcon className="h-4 w-4" /> Hidden
                          </span>
                          <span className="flex items-center gap-1">
                            <StarIconSolid className="h-4 w-4 text-amber-400" /> Favorite
                          </span>
                        </div>
                      </div>

                      {/* Metric List */}
                      <div className="space-y-2">
                        {allOrderedMetrics.map((metric, index) => {
                          const isVisible = preferences.visibleMetrics.includes(metric.id);
                          const isFavorite = preferences.favoriteMetrics.includes(metric.id);
                          const CategoryIcon = CATEGORY_ICONS[metric.category];
                          const isFirst = index === 0;
                          const isLast = index === allOrderedMetrics.length - 1;

                          return (
                            <div
                              key={metric.id}
                              className={cn(
                                'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                                isVisible
                                  ? 'bg-white border-gray-200'
                                  : 'bg-gray-50 border-gray-100 opacity-60'
                              )}
                            >
                              {/* Visibility Toggle */}
                              <button
                                onClick={() => onToggleVisibility(metric.id)}
                                className={cn(
                                  'p-1.5 rounded-md transition-colors',
                                  isVisible
                                    ? 'text-green-600 hover:bg-green-50'
                                    : 'text-gray-400 hover:bg-gray-100'
                                )}
                                title={isVisible ? 'Hide metric' : 'Show metric'}
                              >
                                {isVisible ? (
                                  <EyeIcon className="h-5 w-5" />
                                ) : (
                                  <EyeSlashIcon className="h-5 w-5" />
                                )}
                              </button>

                              {/* Metric Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <CategoryIcon className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm font-medium text-gray-900 truncate">
                                    {metric.title}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 truncate mt-0.5">
                                  {metric.description}
                                </p>
                              </div>

                              {/* Favorite Toggle */}
                              <button
                                onClick={() => onToggleFavorite(metric.id)}
                                className={cn(
                                  'p-1.5 rounded-md transition-colors',
                                  isFavorite
                                    ? 'text-amber-400 hover:bg-amber-50'
                                    : 'text-gray-300 hover:bg-gray-100 hover:text-gray-400'
                                )}
                                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                              >
                                {isFavorite ? (
                                  <StarIconSolid className="h-5 w-5" />
                                ) : (
                                  <StarIcon className="h-5 w-5" />
                                )}
                              </button>

                              {/* Reorder Buttons */}
                              <div className="flex flex-col">
                                <button
                                  onClick={() => onMoveUp(metric.id)}
                                  disabled={isFirst || !isVisible}
                                  className={cn(
                                    'p-1 rounded transition-colors',
                                    isFirst || !isVisible
                                      ? 'text-gray-200 cursor-not-allowed'
                                      : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                                  )}
                                  title="Move up"
                                >
                                  <ChevronUpIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => onMoveDown(metric.id)}
                                  disabled={isLast || !isVisible}
                                  className={cn(
                                    'p-1 rounded transition-colors',
                                    isLast || !isVisible
                                      ? 'text-gray-200 cursor-not-allowed'
                                      : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                                  )}
                                  title="Move down"
                                >
                                  <ChevronDownIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Category Summary */}
                      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700 mb-3">Visible Metrics</p>
                        <div className="grid grid-cols-3 gap-4">
                          {(['kpi', 'chart', 'table'] as const).map(category => {
                            const CategoryIcon = CATEGORY_ICONS[category];
                            const visibleCount = metricDefinitions.filter(
                              m => m.category === category && preferences.visibleMetrics.includes(m.id)
                            ).length;
                            const totalCount = metricDefinitions.filter(m => m.category === category).length;

                            return (
                              <div key={category} className="text-center">
                                <CategoryIcon className="h-5 w-5 mx-auto text-gray-400 mb-1" />
                                <p className="text-xs text-gray-500">{CATEGORY_LABELS[category]}</p>
                                <p className="text-sm font-semibold text-gray-900">
                                  {visibleCount}/{totalCount}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex-shrink-0 border-t border-gray-200 px-4 py-4 sm:px-6">
                      <div className="flex justify-between">
                        <Button
                          variant="outline"
                          onClick={onReset}
                          disabled={saving}
                          className="gap-2"
                        >
                          <ArrowPathIcon className="h-4 w-4" />
                          Reset to Default
                        </Button>
                        <Button
                          variant="primary"
                          onClick={onClose}
                          loading={saving}
                        >
                          Done
                        </Button>
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

export default ReportCustomizePanel;
