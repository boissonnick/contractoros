'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  ClockIcon,
  ClipboardDocumentCheckIcon,
  CameraIcon,
  EllipsisHorizontalIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  ClockIcon as ClockIconSolid,
  ClipboardDocumentCheckIcon as ClipboardDocumentCheckIconSolid,
  CameraIcon as CameraIconSolid,
} from '@heroicons/react/24/solid';

// ============================================================================
// TYPES
// ============================================================================

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  activeIcon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

export interface BottomNavigationProps {
  /** Additional CSS classes */
  className?: string;
  /** Whether to show labels */
  showLabels?: boolean;
  /** Callback when more button is clicked */
  onMoreClick?: () => void;
}

// ============================================================================
// NAV ITEMS
// ============================================================================

const navItems: NavItem[] = [
  {
    label: 'Home',
    href: '/field',
    icon: HomeIcon,
    activeIcon: HomeIconSolid,
  },
  {
    label: 'Time',
    href: '/field/time',
    icon: ClockIcon,
    activeIcon: ClockIconSolid,
  },
  {
    label: 'Tasks',
    href: '/field/tasks',
    icon: ClipboardDocumentCheckIcon,
    activeIcon: ClipboardDocumentCheckIconSolid,
  },
  {
    label: 'Photos',
    href: '/field/photos',
    icon: CameraIcon,
    activeIcon: CameraIconSolid,
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function BottomNavigation({
  className = '',
  showLabels = true,
  onMoreClick,
}: BottomNavigationProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/field') {
      return pathname === '/field';
    }
    return pathname?.startsWith(href);
  };

  return (
    <nav
      className={`
        fixed bottom-0 left-0 right-0 z-40
        bg-white border-t border-gray-200
        md:hidden
        ${className}
      `}
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = active ? item.activeIcon : item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex flex-col items-center justify-center
                min-w-[64px] min-h-[48px] px-3 py-2
                rounded-lg transition-colors
                ${active
                  ? 'text-violet-600'
                  : 'text-gray-500 hover:text-gray-900 active:bg-gray-100'
                }
              `}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="h-6 w-6" />
              {showLabels && (
                <span className={`text-xs mt-1 font-medium ${active ? 'text-violet-600' : ''}`}>
                  {item.label}
                </span>
              )}
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-violet-600 rounded-b-full" />
              )}
            </Link>
          );
        })}

        {/* More button */}
        <button
          onClick={onMoreClick}
          className={`
            flex flex-col items-center justify-center
            min-w-[64px] min-h-[48px] px-3 py-2
            rounded-lg transition-colors
            text-gray-500 hover:text-gray-900 active:bg-gray-100
          `}
          aria-label="More options"
        >
          <EllipsisHorizontalIcon className="h-6 w-6" />
          {showLabels && (
            <span className="text-xs mt-1 font-medium">More</span>
          )}
        </button>
      </div>
    </nav>
  );
}

// ============================================================================
// MORE MENU SHEET
// ============================================================================

export interface MoreMenuSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MoreMenuSheet({ isOpen, onClose }: MoreMenuSheetProps) {
  if (!isOpen) return null;

  const menuItems = [
    { label: 'Daily Log', href: '/field/daily-log', icon: '📝' },
    { label: 'Schedule', href: '/field/schedule', icon: '📅' },
    { label: 'Voice Logs', href: '/field/voice-logs', icon: '🎤' },
    { label: 'Settings', href: '/dashboard/settings', icon: '⚙️' },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden animate-slide-up"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="bg-white rounded-t-2xl shadow-xl">
          {/* Handle */}
          <div className="flex justify-center py-3">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

          {/* Menu Items */}
          <div className="px-4 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">More</h3>
            <div className="grid grid-cols-2 gap-3">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="font-medium text-gray-900">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================================================
// COMBINED COMPONENT WITH STATE
// ============================================================================

export function BottomNavigationWithMenu(props: Omit<BottomNavigationProps, 'onMoreClick'>) {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <>
      <BottomNavigation
        {...props}
        onMoreClick={() => setIsMenuOpen(true)}
      />
      <MoreMenuSheet
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
    </>
  );
}

export default BottomNavigation;
