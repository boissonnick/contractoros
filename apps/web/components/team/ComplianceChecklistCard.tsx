"use client";

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import {
  ComplianceItem,
  ComplianceItemStatus,
} from '@/lib/onboarding/user-onboarding';

interface ComplianceChecklistCardProps {
  items: ComplianceItem[];
  completedItems: Record<string, ComplianceItemStatus>;
  onToggle: (key: string, completed: boolean) => void;
  readOnly?: boolean;
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  tax: { label: 'Tax Documents', color: 'text-indigo-700' },
  identification: { label: 'Identification', color: 'text-blue-700' },
  payroll: { label: 'Payroll', color: 'text-green-700' },
  safety: { label: 'Safety', color: 'text-orange-700' },
  policy: { label: 'Company Policy', color: 'text-purple-700' },
};

export function ComplianceChecklistCard({
  items,
  completedItems,
  onToggle,
  readOnly = false,
}: ComplianceChecklistCardProps) {
  // Count completed items
  const completedCount = useMemo(() => {
    return items.filter((item) => completedItems[item.key]?.completed).length;
  }, [items, completedItems]);

  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, ComplianceItem[]> = {};
    items.forEach((item) => {
      const cat = item.category;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [items]);

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div>
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-600 font-medium">
            {completedCount} of {totalCount} items complete
          </span>
          <span className="text-gray-500">{progressPercent}%</span>
        </div>
        <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              progressPercent === 100 ? 'bg-green-500' : 'bg-blue-500'
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Grouped Checklist */}
      {Object.entries(groupedItems).map(([category, categoryItems]) => {
        const categoryInfo = CATEGORY_LABELS[category] || { label: category, color: 'text-gray-700' };

        return (
          <div key={category}>
            <h4 className={cn('text-xs font-bold uppercase tracking-wider mb-2', categoryInfo.color)}>
              {categoryInfo.label}
            </h4>
            <div className="space-y-1">
              {categoryItems.map((item) => {
                const itemStatus = completedItems[item.key];
                const isCompleted = itemStatus?.completed || false;

                return (
                  <label
                    key={item.key}
                    className={cn(
                      'flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors',
                      isCompleted
                        ? 'bg-green-50/50 border-green-200'
                        : 'bg-white border-gray-200 hover:bg-gray-50',
                      readOnly && 'cursor-default'
                    )}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {readOnly ? (
                        isCompleted ? (
                          <CheckCircleSolidIcon className="h-5 w-5 text-green-500" />
                        ) : (
                          <CheckCircleIcon className="h-5 w-5 text-gray-300" />
                        )
                      ) : (
                        <input
                          type="checkbox"
                          checked={isCompleted}
                          onChange={(e) => onToggle(item.key, e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary mt-0.5"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'text-sm font-medium',
                            isCompleted ? 'text-green-700 line-through' : 'text-gray-900'
                          )}
                        >
                          {item.label}
                        </span>
                        {item.required && (
                          <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 text-red-600">
                            Required
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                      {isCompleted && itemStatus?.completedAt && (
                        <p className="text-xs text-green-600 mt-0.5">
                          Completed {new Date(itemStatus.completedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ComplianceChecklistCard;
