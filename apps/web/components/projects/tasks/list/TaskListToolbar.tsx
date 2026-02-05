"use client";

import React from 'react';
import { GroupBy, SortBy } from './TaskList';

interface TaskListToolbarProps {
  groupBy: GroupBy;
  sortBy: SortBy;
  sortOrder: 'asc' | 'desc';
  onGroupByChange: (groupBy: GroupBy) => void;
  onSortByChange: (sortBy: SortBy) => void;
  onSortOrderChange: (order: 'asc' | 'desc') => void;
}

export default function TaskListToolbar({
  groupBy,
  sortBy,
  sortOrder,
  onGroupByChange,
  onSortByChange,
  onSortOrderChange,
}: TaskListToolbarProps) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="flex items-center gap-1.5">
        <span className="text-gray-500 text-xs font-medium">Group:</span>
        <select
          value={groupBy}
          onChange={(e) => onGroupByChange(e.target.value as GroupBy)}
          className="border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
        >
          <option value="phase">Phase</option>
          <option value="status">Status</option>
          <option value="priority">Priority</option>
          <option value="none">None</option>
        </select>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-gray-500 text-xs font-medium">Sort:</span>
        <select
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value as SortBy)}
          className="border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
        >
          <option value="dueDate">Due Date</option>
          <option value="priority">Priority</option>
          <option value="createdAt">Created</option>
          <option value="title">Title</option>
        </select>
        <button
          onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="text-xs text-gray-500 hover:text-gray-700 px-1"
          title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
        >
          {sortOrder === 'asc' ? '↑' : '↓'}
        </button>
      </div>
    </div>
  );
}
