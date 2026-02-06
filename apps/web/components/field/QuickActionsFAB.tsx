'use client';

import React, { useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  PlusIcon,
  XMarkIcon,
  ClockIcon,
  CameraIcon,
  DocumentTextIcon,
  MicrophoneIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/solid';

// ============================================================================
// TYPES
// ============================================================================

export interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  onClick?: () => void;
  href?: string;
}

export interface QuickActionsFABProps {
  /** Custom actions to show (overrides defaults) */
  actions?: QuickAction[];
  /** Callback when an action is selected */
  onAction?: (actionId: string) => void;
  /** Position offset from bottom (to account for bottom nav) */
  bottomOffset?: number;
  /** Whether to show the FAB */
  visible?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// DEFAULT ACTIONS
// ============================================================================

const DEFAULT_ACTIONS: QuickAction[] = [
  {
    id: 'log-time',
    label: 'Log Time',
    icon: ClockIcon,
    color: 'bg-blue-500',
    href: '/field/time',
  },
  {
    id: 'take-photo',
    label: 'Take Photo',
    icon: CameraIcon,
    color: 'bg-purple-500',
    href: '/field/photos?capture=true',
  },
  {
    id: 'add-note',
    label: 'Daily Log',
    icon: DocumentTextIcon,
    color: 'bg-green-500',
    href: '/field/daily-log',
  },
  {
    id: 'voice',
    label: 'Voice Note',
    icon: MicrophoneIcon,
    color: 'bg-orange-500',
    href: '/field/voice-logs',
  },
];

// Context-specific actions based on current page
const PAGE_ACTIONS: Record<string, QuickAction[]> = {
  '/field/time': [
    {
      id: 'quick-entry',
      label: 'Quick Entry',
      icon: ClockIcon,
      color: 'bg-blue-500',
    },
    {
      id: 'take-photo',
      label: 'Take Photo',
      icon: CameraIcon,
      color: 'bg-purple-500',
      href: '/field/photos?capture=true',
    },
  ],
  '/field/tasks': [
    {
      id: 'add-task',
      label: 'Add Task',
      icon: ClipboardDocumentCheckIcon,
      color: 'bg-green-500',
    },
    {
      id: 'log-time',
      label: 'Log Time',
      icon: ClockIcon,
      color: 'bg-blue-500',
      href: '/field/time',
    },
  ],
  '/field/photos': [
    {
      id: 'capture',
      label: 'Capture',
      icon: CameraIcon,
      color: 'bg-purple-500',
    },
    {
      id: 'add-note',
      label: 'Add Note',
      icon: DocumentTextIcon,
      color: 'bg-green-500',
      href: '/field/daily-log',
    },
  ],
};

// ============================================================================
// COMPONENT
// ============================================================================

export function QuickActionsFAB({
  actions,
  onAction,
  bottomOffset = 80,
  visible = true,
  className = '',
}: QuickActionsFABProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Get context-specific actions or use defaults
  const displayActions = actions || PAGE_ACTIONS[pathname || ''] || DEFAULT_ACTIONS;

  const handleToggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
    // Haptic feedback
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, []);

  const handleActionClick = useCallback((action: QuickAction) => {
    setIsExpanded(false);

    // Haptic feedback
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }

    if (action.onClick) {
      action.onClick();
    } else if (action.href) {
      router.push(action.href);
    }

    onAction?.(action.id);
  }, [router, onAction]);

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={() => setIsExpanded(false)}
          aria-hidden="true"
        />
      )}

      {/* Action buttons */}
      <div
        className={`fixed right-4 bottom-24 z-50 flex flex-col-reverse items-end gap-3 md:hidden ${className}`}
      >
        {/* Expanded actions */}
        {isExpanded && displayActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => handleActionClick(action)}
              className={`
                flex items-center gap-3 pr-4 pl-3 py-3
                rounded-full shadow-lg
                ${action.color} text-white
                transform transition-all duration-200
                hover:scale-105 active:scale-95
              `}
              style={{
                animation: `slideIn 0.2s ease-out ${index * 0.05}s both`,
              }}
            >
              <Icon className="h-5 w-5" />
              <span className="text-sm font-medium whitespace-nowrap">
                {action.label}
              </span>
            </button>
          );
        })}

        {/* Main FAB */}
        <button
          onClick={handleToggle}
          className={`
            w-14 h-14 rounded-full shadow-lg
            flex items-center justify-center
            transition-all duration-200
            ${isExpanded
              ? 'bg-gray-800 rotate-45'
              : 'bg-violet-600 hover:bg-violet-700'
            }
          `}
          aria-label={isExpanded ? 'Close quick actions' : 'Quick actions'}
          aria-expanded={isExpanded}
        >
          {isExpanded ? (
            <XMarkIcon className="h-6 w-6 text-white" />
          ) : (
            <PlusIcon className="h-6 w-6 text-white" />
          )}
        </button>
      </div>

      {/* Animation keyframes */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </>
  );
}

export default QuickActionsFAB;
