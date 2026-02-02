'use client';

import React, { useState, useRef, useCallback } from 'react';
import { CheckIcon, TrashIcon, ArchiveBoxIcon } from '@heroicons/react/24/solid';

// ============================================================================
// TYPES
// ============================================================================

export type SwipeAction = 'complete' | 'delete' | 'archive' | 'custom';

export interface SwipeableCardProps {
  /** Children to render as card content */
  children: React.ReactNode;
  /** Callback when swiped right (complete action) */
  onSwipeRight?: () => void;
  /** Callback when swiped left (delete/archive action) */
  onSwipeLeft?: () => void;
  /** Right action type (default: complete) */
  rightAction?: SwipeAction;
  /** Left action type (default: delete) */
  leftAction?: SwipeAction;
  /** Custom right action label */
  rightLabel?: string;
  /** Custom left action label */
  leftLabel?: string;
  /** Threshold to trigger action (default: 100) */
  threshold?: number;
  /** Whether swipe actions are disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// ACTION CONFIGS
// ============================================================================

const ACTION_CONFIGS = {
  complete: {
    icon: CheckIcon,
    bgClass: 'bg-green-500',
    label: 'Complete',
  },
  delete: {
    icon: TrashIcon,
    bgClass: 'bg-red-500',
    label: 'Delete',
  },
  archive: {
    icon: ArchiveBoxIcon,
    bgClass: 'bg-yellow-500',
    label: 'Archive',
  },
  custom: {
    icon: CheckIcon,
    bgClass: 'bg-gray-500',
    label: 'Action',
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function SwipeableCard({
  children,
  onSwipeRight,
  onSwipeLeft,
  rightAction = 'complete',
  leftAction = 'delete',
  rightLabel,
  leftLabel,
  threshold = 100,
  disabled = false,
  className = '',
}: SwipeableCardProps) {
  const [translateX, setTranslateX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const rightConfig = ACTION_CONFIGS[rightAction];
  const leftConfig = ACTION_CONFIGS[leftAction];
  const RightIcon = rightConfig.icon;
  const LeftIcon = leftConfig.icon;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || isAnimating) return;
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    setIsSwiping(true);
  }, [disabled, isAnimating]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isSwiping || disabled || isAnimating) return;

    const diffX = e.touches[0].clientX - startXRef.current;
    const diffY = e.touches[0].clientY - startYRef.current;

    // If vertical scroll is dominant, don't swipe
    if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(translateX) < 10) {
      setIsSwiping(false);
      setTranslateX(0);
      return;
    }

    // Apply resistance at edges
    const maxSwipe = 150;
    let newTranslate = diffX;

    // Only allow right swipe if handler exists
    if (newTranslate > 0 && !onSwipeRight) {
      newTranslate = 0;
    }
    // Only allow left swipe if handler exists
    if (newTranslate < 0 && !onSwipeLeft) {
      newTranslate = 0;
    }

    // Apply resistance
    if (Math.abs(newTranslate) > maxSwipe) {
      const overflow = Math.abs(newTranslate) - maxSwipe;
      const resistance = 1 - overflow / (overflow + 50);
      newTranslate = Math.sign(newTranslate) * (maxSwipe + overflow * resistance);
    }

    setTranslateX(newTranslate);

    // Prevent scroll when swiping horizontally
    if (Math.abs(diffX) > 10) {
      e.preventDefault();
    }
  }, [isSwiping, disabled, isAnimating, translateX, onSwipeRight, onSwipeLeft]);

  const handleTouchEnd = useCallback(() => {
    if (!isSwiping || disabled) return;

    setIsSwiping(false);

    if (translateX > threshold && onSwipeRight) {
      // Swipe right action
      setIsAnimating(true);
      setTranslateX(300);

      setTimeout(() => {
        onSwipeRight();
        setTranslateX(0);
        setIsAnimating(false);
      }, 200);
    } else if (translateX < -threshold && onSwipeLeft) {
      // Swipe left action
      setIsAnimating(true);
      setTranslateX(-300);

      setTimeout(() => {
        onSwipeLeft();
        setTranslateX(0);
        setIsAnimating(false);
      }, 200);
    } else {
      // Snap back
      setTranslateX(0);
    }
  }, [isSwiping, disabled, translateX, threshold, onSwipeRight, onSwipeLeft]);

  // Calculate action visibility
  const rightProgress = Math.min(Math.max(translateX / threshold, 0), 1);
  const leftProgress = Math.min(Math.max(-translateX / threshold, 0), 1);
  const showRightAction = translateX > 20;
  const showLeftAction = translateX < -20;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
    >
      {/* Right action background (swipe right to complete) */}
      {onSwipeRight && (
        <div
          className={`
            absolute inset-y-0 left-0 flex items-center px-4
            ${rightConfig.bgClass}
            transition-opacity
          `}
          style={{
            width: Math.max(translateX, 0),
            opacity: showRightAction ? 1 : 0,
          }}
        >
          <div
            className="flex items-center gap-2 text-white"
            style={{
              opacity: rightProgress,
              transform: `scale(${0.5 + rightProgress * 0.5})`,
            }}
          >
            <RightIcon className="h-6 w-6" />
            <span className="font-medium text-sm whitespace-nowrap">
              {rightLabel || rightConfig.label}
            </span>
          </div>
        </div>
      )}

      {/* Left action background (swipe left to delete) */}
      {onSwipeLeft && (
        <div
          className={`
            absolute inset-y-0 right-0 flex items-center justify-end px-4
            ${leftConfig.bgClass}
            transition-opacity
          `}
          style={{
            width: Math.max(-translateX, 0),
            opacity: showLeftAction ? 1 : 0,
          }}
        >
          <div
            className="flex items-center gap-2 text-white"
            style={{
              opacity: leftProgress,
              transform: `scale(${0.5 + leftProgress * 0.5})`,
            }}
          >
            <span className="font-medium text-sm whitespace-nowrap">
              {leftLabel || leftConfig.label}
            </span>
            <LeftIcon className="h-6 w-6" />
          </div>
        </div>
      )}

      {/* Card content */}
      <div
        className={`
          relative bg-white
          ${isSwiping ? '' : 'transition-transform duration-200'}
        `}
        style={{
          transform: `translateX(${translateX}px)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// SWIPEABLE TASK CARD
// ============================================================================

export interface SwipeableTaskCardProps {
  task: {
    id: string;
    title: string;
    status: string;
    priority?: string;
    estimatedHours?: number;
  };
  onComplete?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onClick?: (taskId: string) => void;
}

export function SwipeableTaskCard({
  task,
  onComplete,
  onDelete,
  onClick,
}: SwipeableTaskCardProps) {
  return (
    <SwipeableCard
      onSwipeRight={onComplete ? () => onComplete(task.id) : undefined}
      onSwipeLeft={onDelete ? () => onDelete(task.id) : undefined}
      rightAction="complete"
      leftAction="delete"
    >
      <div
        className="p-4 border-b border-gray-100 cursor-pointer active:bg-gray-50"
        onClick={() => onClick?.(task.id)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">{task.title}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`
                px-2 py-0.5 text-xs rounded-full
                ${task.status === 'in_progress'
                  ? 'bg-blue-100 text-blue-700'
                  : task.status === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }
              `}>
                {task.status.replace('_', ' ')}
              </span>
              {task.estimatedHours && (
                <span className="text-xs text-gray-500">
                  {task.estimatedHours}h
                </span>
              )}
            </div>
          </div>
          {task.priority && (
            <span className={`
              px-2 py-1 text-xs font-medium rounded-full
              ${task.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                task.priority === 'low' ? 'bg-gray-100 text-gray-600' :
                'bg-yellow-100 text-yellow-700'
              }
            `}>
              {task.priority}
            </span>
          )}
        </div>
      </div>
    </SwipeableCard>
  );
}

export default SwipeableCard;
