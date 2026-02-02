'use client';

import React, { useState, useMemo } from 'react';
import {
  SparklesIcon,
  FunnelIcon,
  CheckIcon,
  BellSlashIcon,
} from '@heroicons/react/24/outline';
import { BudgetAlertCard, BudgetAlert } from './BudgetAlertCard';
import { SchedulingSuggestionCard, SchedulingSuggestion } from './SchedulingSuggestionCard';
import { ChangeOrderAlert, ChangeOrderDetection } from './ChangeOrderAlert';
import { IntelligentReminders, IntelligentReminder } from './IntelligentReminders';

export type AlertCategory = 'all' | 'budget' | 'scheduling' | 'change-orders' | 'reminders';

export interface AutomationDashboardProps {
  budgetAlerts?: BudgetAlert[];
  schedulingSuggestions?: SchedulingSuggestion[];
  changeOrderDetections?: ChangeOrderDetection[];
  reminders?: IntelligentReminder[];
  onDismissBudgetAlert?: (id: string) => void;
  onApplyScheduleSuggestion?: (id: string) => Promise<void>;
  onIgnoreScheduleSuggestion?: (id: string) => void;
  onCreateChangeOrder?: (id: string) => void;
  onDismissChangeOrder?: (id: string) => void;
  onSnoozeReminder?: (id: string, duration: 'hour' | 'day' | 'week') => void;
  onCompleteReminder?: (id: string) => void;
  onMarkAllRead?: () => void;
}

const CATEGORY_CONFIG: Record<AlertCategory, { label: string; color: string }> = {
  all: { label: 'All', color: 'bg-gray-100 text-gray-700' },
  budget: { label: 'Budget', color: 'bg-green-100 text-green-700' },
  scheduling: { label: 'Scheduling', color: 'bg-blue-100 text-blue-700' },
  'change-orders': { label: 'Change Orders', color: 'bg-orange-100 text-orange-700' },
  reminders: { label: 'Reminders', color: 'bg-purple-100 text-purple-700' },
};

export function AutomationDashboard({
  budgetAlerts = [],
  schedulingSuggestions = [],
  changeOrderDetections = [],
  reminders = [],
  onDismissBudgetAlert,
  onApplyScheduleSuggestion,
  onIgnoreScheduleSuggestion,
  onCreateChangeOrder,
  onDismissChangeOrder,
  onSnoozeReminder,
  onCompleteReminder,
  onMarkAllRead,
}: AutomationDashboardProps) {
  const [activeCategory, setActiveCategory] = useState<AlertCategory>('all');

  // Count totals
  const counts = useMemo(() => ({
    all: budgetAlerts.length + schedulingSuggestions.length + changeOrderDetections.length + reminders.length,
    budget: budgetAlerts.length,
    scheduling: schedulingSuggestions.length,
    'change-orders': changeOrderDetections.length,
    reminders: reminders.length,
  }), [budgetAlerts, schedulingSuggestions, changeOrderDetections, reminders]);

  const totalAlerts = counts.all;
  const hasAlerts = totalAlerts > 0;

  // Filter based on category
  const showBudget = activeCategory === 'all' || activeCategory === 'budget';
  const showScheduling = activeCategory === 'all' || activeCategory === 'scheduling';
  const showChangeOrders = activeCategory === 'all' || activeCategory === 'change-orders';
  const showReminders = activeCategory === 'all' || activeCategory === 'reminders';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SparklesIcon className="h-5 w-5 text-violet-600" />
          <h2 className="text-lg font-semibold text-gray-900">Smart Automation</h2>
          {totalAlerts > 0 && (
            <span className="text-xs px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full font-medium">
              {totalAlerts} alerts
            </span>
          )}
        </div>

        {hasAlerts && onMarkAllRead && (
          <button
            onClick={onMarkAllRead}
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-medium"
          >
            <CheckIcon className="h-3.5 w-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {/* Category filters */}
      {hasAlerts && (
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-4 w-4 text-gray-400" />
          <div className="flex items-center gap-1 overflow-x-auto">
            {(Object.keys(CATEGORY_CONFIG) as AlertCategory[]).map((cat) => {
              const config = CATEGORY_CONFIG[cat];
              const count = counts[cat];
              if (cat !== 'all' && count === 0) return null;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                    activeCategory === cat
                      ? config.color
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {config.label}
                  {count > 0 && <span className="ml-1 opacity-70">({count})</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!hasAlerts && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <BellSlashIcon className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-1">
            No automation alerts
          </h3>
          <p className="text-xs text-gray-500 max-w-xs">
            AI is monitoring your projects for budget issues, scheduling optimizations,
            and scope changes. Alerts will appear here.
          </p>
        </div>
      )}

      {/* Alerts grid */}
      {hasAlerts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Budget alerts */}
          {showBudget && budgetAlerts.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                Budget Alerts
              </h3>
              {budgetAlerts.map((alert) => (
                <BudgetAlertCard
                  key={alert.id}
                  alert={alert}
                  onDismiss={onDismissBudgetAlert}
                />
              ))}
            </div>
          )}

          {/* Scheduling suggestions */}
          {showScheduling && schedulingSuggestions.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full" />
                Scheduling Suggestions
              </h3>
              {schedulingSuggestions.map((suggestion) => (
                <SchedulingSuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onApply={onApplyScheduleSuggestion}
                  onIgnore={onIgnoreScheduleSuggestion}
                />
              ))}
            </div>
          )}

          {/* Change order detections */}
          {showChangeOrders && changeOrderDetections.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full" />
                Change Order Alerts
              </h3>
              {changeOrderDetections.map((detection) => (
                <ChangeOrderAlert
                  key={detection.id}
                  detection={detection}
                  onCreateChangeOrder={onCreateChangeOrder}
                  onDismiss={onDismissChangeOrder}
                />
              ))}
            </div>
          )}

          {/* Reminders */}
          {showReminders && reminders.length > 0 && (
            <div className="lg:col-span-2">
              <IntelligentReminders
                reminders={reminders}
                onSnooze={onSnoozeReminder}
                onComplete={onCompleteReminder}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AutomationDashboard;
