'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  BellIcon,
  ClockIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

export type ReminderPriority = 'urgent' | 'normal' | 'low';
export type ReminderCategory = 'invoices' | 'tasks' | 'follow-ups' | 'deadlines' | 'general';

export interface IntelligentReminder {
  id: string;
  title: string;
  description: string;
  priority: ReminderPriority;
  category: ReminderCategory;
  dueDate?: Date;
  actionUrl?: string;
  actionLabel?: string;
  relatedEntity?: {
    type: string;
    id: string;
    name: string;
  };
  aiGenerated: boolean;
  createdAt: Date;
}

interface IntelligentRemindersProps {
  reminders: IntelligentReminder[];
  onSnooze?: (reminderId: string, duration: 'hour' | 'day' | 'week') => void;
  onComplete?: (reminderId: string) => void;
  onDismiss?: (reminderId: string) => void;
  defaultCollapsed?: boolean;
}

const PRIORITY_CONFIG: Record<ReminderPriority, {
  label: string;
  color: string;
  bgColor: string;
  dotColor: string;
}> = {
  urgent: { label: 'Urgent', color: 'text-red-700', bgColor: 'bg-red-100', dotColor: 'bg-red-500' },
  normal: { label: 'Normal', color: 'text-blue-700', bgColor: 'bg-blue-100', dotColor: 'bg-blue-500' },
  low: { label: 'Low', color: 'text-gray-600', bgColor: 'bg-gray-100', dotColor: 'bg-gray-400' },
};

const CATEGORY_ICONS: Record<ReminderCategory, React.ElementType> = {
  invoices: CurrencyDollarIcon,
  tasks: ClipboardDocumentCheckIcon,
  'follow-ups': UserGroupIcon,
  deadlines: ClockIcon,
  general: DocumentTextIcon,
};

function formatDueDate(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs < 0) {
    return 'Overdue';
  }
  if (diffHours < 1) {
    return 'Due soon';
  }
  if (diffHours < 24) {
    return `${diffHours}h left`;
  }
  if (diffDays === 1) {
    return 'Tomorrow';
  }
  return `${diffDays} days`;
}

export function IntelligentReminders({
  reminders,
  onSnooze,
  onComplete,
  onDismiss: _onDismiss,
  defaultCollapsed = false,
}: IntelligentRemindersProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [activeCategory, setActiveCategory] = useState<ReminderCategory | 'all'>('all');
  const [showSnoozeMenu, setShowSnoozeMenu] = useState<string | null>(null);

  // Group reminders by category
  const groupedReminders = useMemo(() => {
    const groups: Record<ReminderCategory, IntelligentReminder[]> = {
      invoices: [],
      tasks: [],
      'follow-ups': [],
      deadlines: [],
      general: [],
    };
    reminders.forEach((r) => {
      groups[r.category].push(r);
    });
    return groups;
  }, [reminders]);

  // Filter reminders
  const filteredReminders = useMemo(() => {
    if (activeCategory === 'all') return reminders;
    return reminders.filter((r) => r.category === activeCategory);
  }, [reminders, activeCategory]);

  // Sort by priority then due date
  const sortedReminders = useMemo(() => {
    const priorityOrder: Record<ReminderPriority, number> = { urgent: 0, normal: 1, low: 2 };
    return [...filteredReminders].sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      if (a.dueDate && b.dueDate) {
        return a.dueDate.getTime() - b.dueDate.getTime();
      }
      return 0;
    });
  }, [filteredReminders]);

  const urgentCount = reminders.filter((r) => r.priority === 'urgent').length;

  if (reminders.length === 0) {
    return null;
  }

  return (
    <div className="border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BellIcon className="h-5 w-5 text-gray-600" />
          <span className="text-sm font-medium text-gray-900">Smart Reminders</span>
          {urgentCount > 0 && (
            <span className="flex items-center justify-center h-5 min-w-5 px-1.5 text-xs font-medium text-white bg-red-500 rounded-full">
              {urgentCount}
            </span>
          )}
        </div>
        {isCollapsed ? (
          <ChevronDownIcon className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronUpIcon className="h-4 w-4 text-gray-500" />
        )}
      </button>

      {/* Content */}
      {!isCollapsed && (
        <div className="p-3">
          {/* Category filters */}
          <div className="flex items-center gap-1 mb-3 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                activeCategory === 'all'
                  ? 'bg-gray-200 text-gray-900'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              All ({reminders.length})
            </button>
            {(Object.keys(groupedReminders) as ReminderCategory[]).map((cat) => {
              const count = groupedReminders[cat].length;
              if (count === 0) return null;
              const Icon = CATEGORY_ICONS[cat];
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                    activeCategory === cat
                      ? 'bg-gray-200 text-gray-900'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  <span className="capitalize">{cat}</span>
                  <span className="opacity-60">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Reminders list */}
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {sortedReminders.map((reminder) => {
              const priorityConfig = PRIORITY_CONFIG[reminder.priority];
              const _CategoryIcon = CATEGORY_ICONS[reminder.category];

              return (
                <div
                  key={reminder.id}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 group"
                >
                  {/* Priority dot */}
                  <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-1.5 ${priorityConfig.dotColor}`} />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {reminder.title}
                          </p>
                          {reminder.aiGenerated && (
                            <span className="text-[10px] px-1 py-0.5 bg-violet-100 text-violet-700 rounded">
                              AI
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                          {reminder.description}
                        </p>
                      </div>

                      {/* Due date */}
                      {reminder.dueDate && (
                        <span className={`flex-shrink-0 text-[10px] font-medium ${
                          reminder.dueDate < new Date() ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          {formatDueDate(reminder.dueDate)}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onComplete && (
                        <button
                          onClick={() => onComplete(reminder.id)}
                          className="inline-flex items-center gap-1 text-[10px] text-green-600 hover:text-green-700 font-medium"
                        >
                          <CheckIcon className="h-3 w-3" />
                          Complete
                        </button>
                      )}
                      {onSnooze && (
                        <div className="relative">
                          <button
                            onClick={() => setShowSnoozeMenu(showSnoozeMenu === reminder.id ? null : reminder.id)}
                            className="inline-flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-700 font-medium"
                          >
                            <ClockIcon className="h-3 w-3" />
                            Snooze
                          </button>
                          {showSnoozeMenu === reminder.id && (
                            <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
                              {(['hour', 'day', 'week'] as const).map((duration) => (
                                <button
                                  key={duration}
                                  onClick={() => {
                                    onSnooze(reminder.id, duration);
                                    setShowSnoozeMenu(null);
                                  }}
                                  className="block w-full px-3 py-1 text-left text-xs text-gray-700 hover:bg-gray-50"
                                >
                                  {duration === 'hour' ? '1 hour' : duration === 'day' ? '1 day' : '1 week'}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      {reminder.actionUrl && (
                        <Link
                          href={reminder.actionUrl}
                          className="text-[10px] text-violet-600 hover:text-violet-700 font-medium"
                        >
                          {reminder.actionLabel || 'View'}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default IntelligentReminders;
