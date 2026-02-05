/**
 * MobileNav Component
 *
 * Mobile-first navigation components including:
 * - MobileBottomNav: Fixed bottom navigation with 5 primary items
 * - MobileHeader: Sticky header with hamburger menu
 * - MobileDrawer: Full-screen slide-in navigation drawer
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NavItem } from '@/types';
import {
  Bars3Icon,
  XMarkIcon,
  ChevronRightIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';
import { useNetworkStatus } from '@/lib/offline/network-status';

// ============================================
// MobileBottomNav - Fixed bottom navigation
// ============================================

interface MobileBottomNavProps {
  items: NavItem[];
  /** Number of items to show (default 5) */
  maxItems?: number;
  /** Show "More" button to access remaining items */
  showMore?: boolean;
  onMoreClick?: () => void;
}

export function MobileBottomNav({
  items,
  maxItems = 5,
  showMore = false,
  onMoreClick,
}: MobileBottomNavProps) {
  const pathname = usePathname();
  const visibleItems = items.slice(0, showMore ? maxItems - 1 : maxItems);

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-40 pb-safe"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex justify-around items-center h-16">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex flex-col items-center justify-center
                w-full h-full min-w-[64px] min-h-[44px]
                transition-colors
                ${isActive
                  ? 'text-brand-primary'
                  : 'text-gray-500 active:text-gray-700'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-6 w-6" />
              <span className="text-[10px] mt-0.5 font-medium truncate max-w-[60px]">
                {item.label}
              </span>
            </Link>
          );
        })}

        {showMore && (
          <button
            onClick={onMoreClick}
            className="flex flex-col items-center justify-center w-full h-full min-w-[64px] min-h-[44px] text-gray-500 active:text-gray-700"
          >
            <Bars3Icon className="h-6 w-6" />
            <span className="text-[10px] mt-0.5 font-medium">More</span>
          </button>
        )}
      </div>
    </nav>
  );
}

// ============================================
// MobileHeader - Sticky header with hamburger
// ============================================

interface MobileHeaderProps {
  title?: string;
  logoHref?: string;
  onMenuClick: () => void;
  rightContent?: React.ReactNode;
}

export function MobileHeader({
  title = 'ContractorOS',
  logoHref = '/dashboard',
  onMenuClick,
  rightContent,
}: MobileHeaderProps) {
  return (
    <header className="md:hidden sticky top-0 z-30 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-4 h-14">
        <Link
          href={logoHref}
          className="font-bold text-lg text-brand-primary hover:opacity-80 transition-opacity"
        >
          {title}
        </Link>
        <div className="flex items-center gap-2">
          {rightContent}
          <button
            onClick={onMenuClick}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Open menu"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>
      </div>
    </header>
  );
}

// ============================================
// MobileDrawer - Full-screen navigation drawer
// ============================================

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: NavItem[];
  userDisplayName?: string;
  userAvatar?: React.ReactNode;
  onSignOut: () => void;
  /** Additional content at the bottom of the drawer */
  footer?: React.ReactNode;
}

export function MobileDrawer({
  isOpen,
  onClose,
  items,
  userDisplayName,
  userAvatar,
  onSignOut,
  footer,
}: MobileDrawerProps) {
  const pathname = usePathname();
  const { isOnline } = useNetworkStatus();
  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Handle open/close with animation
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsClosing(false);
      document.body.style.overflow = 'hidden';
    } else if (isVisible) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setIsClosing(false);
      }, 250);
      document.body.style.overflow = '';
      return () => clearTimeout(timer);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 250);
  };

  if (!isVisible) return null;

  return (
    <div className="md:hidden fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-250 ${
          isClosing ? 'opacity-0' : 'animate-fade-in'
        }`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={`absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-white shadow-xl flex flex-col transition-transform duration-250 ease-out ${
          isClosing ? 'translate-x-full' : 'animate-slide-in-right'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-gray-200">
          <span className="font-bold text-lg text-brand-primary">Menu</span>
          <button
            onClick={handleClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            aria-label="Close menu"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* User Info */}
        {userDisplayName && (
          <div className="px-4 py-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="relative">
                {userAvatar || (
                  <div className="h-10 w-10 rounded-full bg-brand-primary-light flex items-center justify-center text-brand-primary font-bold">
                    {userDisplayName.charAt(0).toUpperCase()}
                  </div>
                )}
                {/* Online status indicator */}
                <span
                  className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-gray-50 ${
                    isOnline ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                  title={isOnline ? 'Online' : 'Offline'}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{userDisplayName}</p>
                <p className="text-sm text-gray-500">{isOnline ? 'Online' : 'Offline'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleClose}
                className={`
                  flex items-center gap-3 px-4 py-3 min-h-[48px]
                  transition-colors
                  ${isActive
                    ? 'bg-brand-primary-light text-brand-primary'
                    : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                  }
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-brand-primary' : 'text-gray-400'}`} />
                <span className="font-medium">{item.label}</span>
                <ChevronRightIcon className="h-4 w-4 ml-auto text-gray-400" />
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 space-y-3">
          {footer}
          <button
            onClick={() => {
              handleClose();
              onSignOut();
            }}
            className="w-full min-h-[44px] px-4 py-3 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MobilePageHeader - Page title with back button
// ============================================

interface MobilePageHeaderProps {
  title: string;
  backHref?: string;
  onBack?: () => void;
  rightContent?: React.ReactNode;
  subtitle?: string;
}

export function MobilePageHeader({
  title,
  backHref,
  onBack,
  rightContent,
  subtitle,
}: MobilePageHeaderProps) {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backHref) {
      window.location.href = backHref;
    } else {
      window.history.back();
    }
  };

  return (
    <div className="md:hidden sticky top-14 z-20 bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center gap-3">
        {(backHref || onBack) && (
          <button
            onClick={handleBack}
            className="min-w-[44px] min-h-[44px] -ml-2 flex items-center justify-center text-gray-500"
          >
            <ChevronRightIcon className="h-5 w-5 rotate-180" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-gray-900 truncate">{title}</h1>
          {subtitle && (
            <p className="text-sm text-gray-500 truncate">{subtitle}</p>
          )}
        </div>
        {rightContent && (
          <div className="flex-shrink-0">
            {rightContent}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// MobileFAB - Floating Action Button
// ============================================

interface MobileFABProps {
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  position?: 'bottom-right' | 'bottom-center';
}

export function MobileFAB({
  onClick,
  icon: Icon,
  label,
  position = 'bottom-right',
}: MobileFABProps) {
  const positionClasses = {
    'bottom-right': 'right-4 bottom-20',
    'bottom-center': 'left-1/2 -translate-x-1/2 bottom-20',
  };

  return (
    <button
      onClick={onClick}
      className={`
        md:hidden fixed ${positionClasses[position]}
        w-14 h-14 rounded-full bg-brand-primary text-white
        shadow-lg hover:shadow-xl active:scale-95
        flex items-center justify-center
        transition-all z-30
      `}
      aria-label={label}
    >
      <Icon className="h-6 w-6" />
    </button>
  );
}

// ============================================
// MobilePullToRefresh - Pull to refresh indicator
// ============================================

interface MobilePullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export function MobilePullToRefresh({
  onRefresh,
  children,
}: MobilePullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const threshold = 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling) return;
    const distance = e.touches[0].clientY - (e.currentTarget as HTMLElement).getBoundingClientRect().top;
    if (distance > 0) {
      setPullDistance(Math.min(distance * 0.5, threshold * 1.5));
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    setIsPulling(false);
    setPullDistance(0);
  };

  return (
    <div
      className="md:hidden relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      {(isPulling || isRefreshing) && (
        <div
          className="absolute left-0 right-0 flex justify-center"
          style={{ top: -40 + pullDistance }}
        >
          <div
            className={`
              w-8 h-8 rounded-full bg-white shadow-md
              flex items-center justify-center
              ${isRefreshing ? 'animate-spin' : ''}
            `}
          >
            <svg
              className="w-5 h-5 text-brand-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isRefreshing ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  style={{
                    transform: `rotate(${Math.min(pullDistance / threshold * 180, 180)}deg)`,
                    transformOrigin: 'center',
                  }}
                />
              )}
            </svg>
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

export default {
  MobileBottomNav,
  MobileHeader,
  MobileDrawer,
  MobilePageHeader,
  MobileFAB,
  MobilePullToRefresh,
};
