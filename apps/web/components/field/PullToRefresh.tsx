'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

// ============================================================================
// TYPES
// ============================================================================

export interface PullToRefreshProps {
  /** Callback to execute on refresh */
  onRefresh: () => Promise<void>;
  /** Children to render */
  children: React.ReactNode;
  /** Minimum pull distance to trigger refresh (default: 80) */
  pullThreshold?: number;
  /** Maximum pull distance (default: 120) */
  maxPull?: number;
  /** Whether refresh is disabled */
  disabled?: boolean;
  /** Custom spinner content */
  spinnerContent?: React.ReactNode;
  /** Additional CSS classes for the container */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PullToRefresh({
  onRefresh,
  children,
  pullThreshold = 80,
  maxPull = 120,
  disabled = false,
  spinnerContent,
  className = '',
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const currentYRef = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;

    // Only trigger if at top of scroll
    const container = containerRef.current;
    if (container && container.scrollTop > 0) return;

    startYRef.current = e.touches[0].clientY;
    currentYRef.current = e.touches[0].clientY;
    setIsPulling(true);
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || disabled || isRefreshing) return;

    currentYRef.current = e.touches[0].clientY;
    const diff = currentYRef.current - startYRef.current;

    if (diff > 0) {
      // Apply resistance
      const resistance = Math.min(diff * 0.5, maxPull);
      setPullDistance(resistance);

      // Prevent default scroll when pulling
      if (containerRef.current && containerRef.current.scrollTop === 0) {
        e.preventDefault();
      }
    }
  }, [isPulling, disabled, isRefreshing, maxPull]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling || disabled) return;

    setIsPulling(false);

    if (pullDistance >= pullThreshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(60); // Keep some height for spinner

      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [isPulling, disabled, pullDistance, pullThreshold, isRefreshing, onRefresh]);

  // Calculate progress for visual feedback
  const progress = Math.min(pullDistance / pullThreshold, 1);
  const readyToRefresh = progress >= 1;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-auto ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: isPulling ? 'none' : 'auto' }}
    >
      {/* Pull indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center overflow-hidden transition-all duration-200 ease-out"
        style={{
          height: `${pullDistance}px`,
          opacity: pullDistance > 10 ? 1 : 0,
        }}
      >
        <div
          className={`
            flex items-center justify-center
            w-10 h-10 rounded-full
            ${isRefreshing ? 'bg-violet-100' : readyToRefresh ? 'bg-green-100' : 'bg-gray-100'}
            transition-colors
          `}
        >
          {spinnerContent || (
            <ArrowPathIcon
              className={`
                h-5 w-5 transition-all
                ${isRefreshing
                  ? 'text-violet-600 animate-spin'
                  : readyToRefresh
                    ? 'text-green-600'
                    : 'text-gray-400'
                }
              `}
              style={{
                transform: isRefreshing
                  ? undefined
                  : `rotate(${progress * 180}deg)`,
              }}
            />
          )}
        </div>
      </div>

      {/* Content */}
      <div
        className="transition-transform duration-200 ease-out"
        style={{
          transform: `translateY(${pullDistance}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// HOOK VERSION
// ============================================================================

export interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  pullThreshold?: number;
  maxPull?: number;
}

export interface UsePullToRefreshReturn {
  isRefreshing: boolean;
  pullDistance: number;
  progress: number;
  readyToRefresh: boolean;
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
  };
  containerStyle: React.CSSProperties;
  contentStyle: React.CSSProperties;
}

export function usePullToRefresh({
  onRefresh,
  pullThreshold = 80,
  maxPull = 120,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const startYRef = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isRefreshing) return;
    startYRef.current = e.touches[0].clientY;
    setIsPulling(true);
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;

    const diff = e.touches[0].clientY - startYRef.current;
    if (diff > 0) {
      const resistance = Math.min(diff * 0.5, maxPull);
      setPullDistance(resistance);
    }
  }, [isPulling, isRefreshing, maxPull]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;

    setIsPulling(false);

    if (pullDistance >= pullThreshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(60);

      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [isPulling, pullDistance, pullThreshold, isRefreshing, onRefresh]);

  const progress = Math.min(pullDistance / pullThreshold, 1);
  const readyToRefresh = progress >= 1;

  return {
    isRefreshing,
    pullDistance,
    progress,
    readyToRefresh,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    containerStyle: {
      touchAction: isPulling ? 'none' : 'auto',
    },
    contentStyle: {
      transform: `translateY(${pullDistance}px)`,
      transition: isPulling ? undefined : 'transform 0.2s ease-out',
    },
  };
}

export default PullToRefresh;
