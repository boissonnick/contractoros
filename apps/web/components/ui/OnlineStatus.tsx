'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { WifiIcon, SignalSlashIcon } from '@heroicons/react/24/outline';
import { toast } from './Toast';

export interface OnlineStatusProps {
  /**
   * Show the indicator when online (by default, online state is hidden or subtle)
   */
  showWhenOnline?: boolean;
  /**
   * Show toast notifications when status changes
   */
  showToast?: boolean;
  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Style variant
   */
  variant?: 'dot' | 'badge' | 'icon';
  /**
   * Custom className
   */
  className?: string;
}

/**
 * OnlineStatus - A lightweight indicator component showing network connection state.
 *
 * Uses navigator.onLine and window online/offline events to detect connectivity.
 *
 * @example
 * // Simple dot indicator (shows only when offline)
 * <OnlineStatus />
 *
 * @example
 * // Badge with text, always visible
 * <OnlineStatus variant="badge" showWhenOnline />
 *
 * @example
 * // Icon variant with toast notifications
 * <OnlineStatus variant="icon" showToast />
 */
export default function OnlineStatus({
  showWhenOnline = false,
  showToast = false,
  size = 'md',
  variant = 'dot',
  className,
}: OnlineStatusProps) {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [mounted, setMounted] = useState(false);

  // Handle online status change
  const handleOnline = useCallback(() => {
    setIsOnline(true);
    if (showToast) {
      toast.success('Back online', 'Your connection has been restored.');
    }
  }, [showToast]);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    if (showToast) {
      toast.warning('You are offline', 'Some features may be unavailable.');
    }
  }, [showToast]);

  useEffect(() => {
    // Set initial state from navigator.onLine
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      setMounted(true);
    }

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  // Don't render anything during SSR
  if (!mounted) {
    return null;
  }

  // Hide when online unless explicitly requested
  if (isOnline && !showWhenOnline) {
    return null;
  }

  // Size classes
  const sizeClasses = {
    sm: {
      dot: 'h-2 w-2',
      badge: 'px-1.5 py-0.5 text-xs',
      icon: 'h-4 w-4',
    },
    md: {
      dot: 'h-2.5 w-2.5',
      badge: 'px-2 py-1 text-xs',
      icon: 'h-5 w-5',
    },
    lg: {
      dot: 'h-3 w-3',
      badge: 'px-2.5 py-1 text-sm',
      icon: 'h-6 w-6',
    },
  };

  // Render dot variant
  if (variant === 'dot') {
    return (
      <div
        className={cn(
          'rounded-full transition-colors',
          sizeClasses[size].dot,
          isOnline ? 'bg-green-500' : 'bg-red-500',
          !isOnline && 'animate-pulse',
          className
        )}
        role="status"
        aria-label={isOnline ? 'Online' : 'Offline'}
        title={isOnline ? 'Online' : 'Offline'}
      />
    );
  }

  // Render badge variant
  if (variant === 'badge') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full font-medium transition-colors',
          sizeClasses[size].badge,
          isOnline
            ? 'bg-green-100 text-green-700'
            : 'bg-red-100 text-red-700',
          className
        )}
        role="status"
        aria-label={isOnline ? 'Online' : 'Offline'}
      >
        <span
          className={cn(
            'rounded-full',
            size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2',
            isOnline ? 'bg-green-500' : 'bg-red-500',
            !isOnline && 'animate-pulse'
          )}
        />
        <span>{isOnline ? 'Online' : 'Offline'}</span>
      </div>
    );
  }

  // Render icon variant
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5',
        !isOnline && 'text-red-600',
        isOnline && 'text-green-600',
        className
      )}
      role="status"
      aria-label={isOnline ? 'Online' : 'Offline'}
      title={isOnline ? 'Online' : 'Offline'}
    >
      {isOnline ? (
        <WifiIcon className={cn(sizeClasses[size].icon)} />
      ) : (
        <>
          <SignalSlashIcon className={cn(sizeClasses[size].icon, 'animate-pulse')} />
          <span className="text-sm font-medium">Offline</span>
        </>
      )}
    </div>
  );
}

/**
 * Hook to get online status programmatically
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
