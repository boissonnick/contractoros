'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth';
import { logger } from '@/lib/utils/logger';

// ============================================================================
// Types
// ============================================================================

interface TeamMemberInfo {
  id: string;
  displayName: string;
  email: string;
  role: string;
  avatar?: string;
  userId: string;
}

export interface MentionAutocompleteProps {
  /** The text after @ being typed */
  query: string;
  /** Whether the dropdown is open */
  isOpen: boolean;
  /** Called when a user selects a mention */
  onSelect: (userId: string, displayName: string) => void;
  /** Called when the dropdown should close */
  onClose: () => void;
  /** Position relative to parent container */
  position?: { top: number; left: number };
  /** Additional CSS class names */
  className?: string;
}

// ============================================================================
// Internal Hook: useTeamMembersList
// ============================================================================

function useTeamMembersList() {
  const { profile } = useAuth();
  const [members, setMembers] = useState<TeamMemberInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.orgId) {
      setLoading(false);
      return;
    }

    // Query top-level 'users' collection (consistent with rest of codebase)
    const q = query(
      collection(db, 'users'),
      where('orgId', '==', profile.orgId),
      where('isActive', '==', true)
    );

    getDocs(q)
      .then((snap) => {
        const items: TeamMemberInfo[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            displayName: (data.displayName as string) || (data.email as string) || 'Unknown',
            email: (data.email as string) || '',
            role: (data.role as string) || 'EMPLOYEE',
            avatar: data.photoURL as string | undefined,
            userId: d.id,
          };
        });
        setMembers(items);
        setLoading(false);
      })
      .catch((err) => {
        logger.error('Failed to load team members for mentions', {
          error: err,
          component: 'MentionAutocomplete',
        });
        setLoading(false);
      });
  }, [profile?.orgId]);

  return { members, loading };
}

// ============================================================================
// Role Badge Component
// ============================================================================

const ROLE_COLORS: Record<string, string> = {
  OWNER: 'bg-purple-100 text-purple-700',
  PM: 'bg-blue-100 text-blue-700',
  EMPLOYEE: 'bg-green-100 text-green-700',
  SUBCONTRACTOR: 'bg-orange-100 text-orange-700',
  CLIENT: 'bg-gray-100 text-gray-700',
};

function RoleBadge({ role }: { role: string }) {
  const colorClass = ROLE_COLORS[role] || 'bg-gray-100 text-gray-600';
  const label = role.charAt(0) + role.slice(1).toLowerCase();

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none',
        colorClass
      )}
    >
      {label}
    </span>
  );
}

// ============================================================================
// Avatar Initial Component
// ============================================================================

function AvatarInitial({ name, avatar }: { name: string; avatar?: string }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className="h-7 w-7 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700">
      {initials}
    </div>
  );
}

// ============================================================================
// MentionAutocomplete Component
// ============================================================================

const MAX_RESULTS = 5;

export function MentionAutocomplete({
  query: searchQuery,
  isOpen,
  onSelect,
  onClose,
  position,
  className,
}: MentionAutocompleteProps) {
  const { members, loading } = useTeamMembersList();
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);

  // Filter members by search query with relevance scoring
  // Priority: starts-with > contains (case-insensitive)
  const filteredMembers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return members.slice(0, MAX_RESULTS);

    const scored = members
      .map((m) => {
        const name = m.displayName.toLowerCase();
        let score = 0;
        if (name.startsWith(q)) score = 2;
        else if (name.includes(q)) score = 1;
        return { member: m, score };
      })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored.map((s) => s.member).slice(0, MAX_RESULTS);
  }, [members, searchQuery]);

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(0);
  }, [filteredMembers.length, searchQuery]);

  // Scroll active item into view
  useEffect(() => {
    const item = itemRefs.current[activeIndex];
    if (item) {
      item.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  // Keyboard navigation handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen || filteredMembers.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex((prev) =>
            prev < filteredMembers.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex((prev) =>
            prev > 0 ? prev - 1 : filteredMembers.length - 1
          );
          break;
        case 'Enter':
        case 'Tab': {
          e.preventDefault();
          const selected = filteredMembers[activeIndex];
          if (selected) {
            onSelect(selected.userId, selected.displayName);
          }
          break;
        }
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    },
    [isOpen, filteredMembers, activeIndex, onSelect, onClose]
  );

  // Attach keyboard listener
  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, handleKeyDown]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (listRef.current && !listRef.current.contains(e.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const positionStyle = position
    ? { top: position.top, left: position.left }
    : undefined;

  return (
    <div
      className={cn(
        'absolute z-50 w-64 rounded-lg border border-gray-200 bg-white shadow-lg',
        className
      )}
      style={positionStyle}
    >
      {loading ? (
        <div className="px-3 py-2 text-sm text-gray-500">Loading...</div>
      ) : filteredMembers.length === 0 ? (
        <div className="px-3 py-2 text-sm text-gray-500">No matching team members</div>
      ) : (
        <ul ref={listRef} className="max-h-52 overflow-y-auto py-1" role="listbox">
          {filteredMembers.map((member, index) => (
            <li
              key={member.id}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              role="option"
              aria-selected={index === activeIndex}
              className={cn(
                'flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm transition-colors',
                index === activeIndex
                  ? 'bg-blue-50 text-gray-900'
                  : 'text-gray-700 hover:bg-gray-50'
              )}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={(e) => {
                // Use mouseDown instead of click to fire before input blur
                e.preventDefault();
                onSelect(member.userId, member.displayName);
              }}
            >
              <AvatarInitial name={member.displayName} avatar={member.avatar} />
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span className="truncate font-medium">{member.displayName}</span>
                <RoleBadge role={member.role} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default MentionAutocomplete;
