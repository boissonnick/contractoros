'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { NavItem } from '@/types';
import { cn } from '@/lib/utils';

// Storage key for persisting section state
const STORAGE_KEY = 'contractoros-nav-sections';

// Get saved section states from localStorage
function getSavedSectionStates(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

// Save section state to localStorage
function saveSectionState(sectionId: string, isOpen: boolean) {
  if (typeof window === 'undefined') return;
  try {
    const current = getSavedSectionStates();
    current[sectionId] = isOpen;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Section configuration for grouping navigation items
 */
export interface NavSection {
  id: string;
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  defaultOpen?: boolean;
  items: NavItem[];
}

interface CollapsibleNavSectionProps {
  section: NavSection;
  renderNavItem: (item: NavItem, isActive: boolean) => React.ReactNode;
}

/**
 * CollapsibleNavSection
 *
 * Groups navigation items into a collapsible section with:
 * - Chevron toggle indicator
 * - localStorage persistence for open/closed state
 * - Automatic expansion when a child item is active
 */
export function CollapsibleNavSection({
  section,
  renderNavItem,
}: CollapsibleNavSectionProps) {
  const pathname = usePathname();
  const { id, title, icon: Icon, defaultOpen = true, items } = section;

  // Check if any item in this section is active
  const hasActiveItem = items.some(item => {
    const itemActive = pathname === item.href || pathname.startsWith(item.href + '/');
    const childActive = item.children?.some(
      child => pathname === child.href || pathname.startsWith(child.href + '/')
    );
    return itemActive || childActive;
  });

  // Initialize state from localStorage or default
  const [isOpen, setIsOpen] = useState(() => {
    const saved = getSavedSectionStates();
    // If we have a saved state, use it; otherwise use default or expand if active
    if (saved[id] !== undefined) {
      return saved[id];
    }
    return defaultOpen || hasActiveItem;
  });

  // Auto-expand section when an item becomes active
  useEffect(() => {
    if (hasActiveItem && !isOpen) {
      setIsOpen(true);
      saveSectionState(id, true);
    }
  }, [hasActiveItem, id, isOpen]);

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    saveSectionState(id, newState);
  };

  return (
    <div className="mb-1">
      {/* Section Header */}
      <button
        onClick={handleToggle}
        className={cn(
          'flex items-center w-full px-3 py-3 text-xs font-semibold uppercase tracking-wider rounded-md transition-colors',
          'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
          hasActiveItem && 'text-gray-700'
        )}
        aria-expanded={isOpen}
        aria-controls={`nav-section-${id}`}
      >
        {Icon && <Icon className="w-4 h-4 mr-2 text-gray-400" />}
        <span className="flex-1 text-left">{title}</span>
        <ChevronDownIcon
          className={cn(
            'w-4 h-4 text-gray-400 transition-transform duration-200',
            !isOpen && '-rotate-90'
          )}
        />
      </button>

      {/* Section Items */}
      <div
        id={`nav-section-${id}`}
        className={cn(
          'overflow-hidden transition-all duration-200',
          isOpen ? 'opacity-100 max-h-[1000px]' : 'opacity-0 max-h-0'
        )}
      >
        <div className="mt-2 space-y-1">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const isChildActive = item.children?.some(
              child => pathname === child.href || pathname.startsWith(child.href + '/')
            );
            return (
              <div key={item.href}>
                {renderNavItem(item, isActive || !!isChildActive)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to manage navigation section states
 * Returns functions to expand/collapse all sections
 */
export function useNavSections() {
  const expandAll = (sectionIds: string[]) => {
    sectionIds.forEach(id => saveSectionState(id, true));
    // Force re-render by dispatching storage event
    window.dispatchEvent(new Event('storage'));
  };

  const collapseAll = (sectionIds: string[]) => {
    sectionIds.forEach(id => saveSectionState(id, false));
    window.dispatchEvent(new Event('storage'));
  };

  const resetToDefaults = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new Event('storage'));
    }
  };

  return { expandAll, collapseAll, resetToDefaults };
}

export default CollapsibleNavSection;
