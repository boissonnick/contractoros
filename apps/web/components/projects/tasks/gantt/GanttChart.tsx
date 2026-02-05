"use client";

import React, { useEffect, useRef, useState } from 'react';
import type { GanttTask, GanttOptions } from 'frappe-gantt';
import type { GanttViewMode } from './GanttToolbar';

interface GanttChartProps {
  tasks: GanttTask[];
  viewMode: GanttViewMode;
  onTaskClick?: (task: GanttTask) => void;
  onDateChange?: (task: GanttTask, start: Date, end: Date) => void;
}

export default function GanttChart({ tasks, viewMode, onTaskClick, onDateChange }: GanttChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ganttRef = useRef<InstanceType<typeof import('frappe-gantt').default> | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Dynamic import of frappe-gantt (it uses DOM APIs, so must be client-only)
  useEffect(() => {
    if (!containerRef.current || tasks.length === 0) return;

    let cancelled = false;

    async function init() {
      try {
        // Dynamic import
        const mod = await import('frappe-gantt');
        // Load frappe-gantt base CSS from public dir
        if (!document.querySelector('link[data-gantt-css]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = '/css/frappe-gantt.css';
          link.setAttribute('data-gantt-css', '1');
          document.head.appendChild(link);
        }

        if (cancelled || !containerRef.current) return;

        const Gantt = mod.default;

        // Clear previous
        containerRef.current.innerHTML = '';

        const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        containerRef.current.appendChild(svgEl);

        const options: GanttOptions = {
          view_mode: viewMode,
          bar_height: 28,
          bar_corner_radius: 4,
          padding: 16,
          on_click: onTaskClick,
          on_date_change: onDateChange,
          custom_popup_html: (task: GanttTask) => {
            return `
              <div class="gantt-popup-wrapper" style="padding:12px;min-width:180px;">
                <div style="font-weight:600;font-size:13px;margin-bottom:4px;">${task.name}</div>
                <div style="font-size:12px;color:#6b7280;">
                  ${task.start} → ${task.end}
                </div>
                <div style="font-size:12px;color:#6b7280;margin-top:2px;">
                  Progress: ${task.progress}%
                </div>
              </div>
            `;
          },
        };

        ganttRef.current = new Gantt(svgEl, tasks, options);
        setLoaded(true);
      } catch (err) {
        console.error('Failed to load Gantt chart:', err);
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [tasks, onTaskClick, onDateChange, viewMode]); // Re-init when tasks or callbacks change

  // Update view mode without reinitializing
  useEffect(() => {
    if (ganttRef.current && loaded) {
      ganttRef.current.change_view_mode(viewMode);
    }
  }, [viewMode, loaded]);

  if (tasks.length === 0) {
    return (
      <div className="border border-gray-200 rounded-xl p-12 text-center text-gray-400 bg-gray-50">
        <p className="text-sm">No tasks with dates to display on the timeline.</p>
        <p className="text-xs mt-1">Add start/due dates to tasks to see them here.</p>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-x-auto bg-white">
      <style>{`
        .gantt .bar-wrapper .bar-label {
          font-size: 12px;
          font-weight: 500;
          text-overflow: ellipsis;
          overflow: hidden;
          white-space: nowrap;
        }
        .gantt .bar-wrapper {
          cursor: pointer;
        }
        .gantt .bar-wrapper:hover .bar-label {
          fill: #1f2937;
        }
        .gantt .bar-wrapper .bar {
          transition: fill 0.15s;
        }
        .gantt-priority-urgent .bar {
          fill: #ef4444 !important;
        }
        .gantt-priority-urgent .bar-progress {
          fill: #dc2626 !important;
        }
        .gantt-priority-high .bar {
          fill: #f97316 !important;
        }
        .gantt-priority-high .bar-progress {
          fill: #ea580c !important;
        }
        .gantt-priority-medium .bar {
          fill: #3b82f6 !important;
        }
        .gantt-priority-medium .bar-progress {
          fill: #2563eb !important;
        }
        .gantt-priority-low .bar {
          fill: #9ca3af !important;
        }
        .gantt-priority-low .bar-progress {
          fill: #6b7280 !important;
        }
        .gantt .grid-header {
          fill: #f9fafb;
        }
        .gantt .grid-row {
          fill: #ffffff;
        }
        .gantt .grid-row:nth-child(even) {
          fill: #f9fafb;
        }
        .gantt .lower-text, .gantt .upper-text {
          font-size: 11px;
          fill: #6b7280;
        }
        .gantt .arrow {
          stroke: #d1d5db;
          stroke-width: 1.5;
        }
        .popup-wrapper {
          border-radius: 8px !important;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,.1) !important;
        }
      `}</style>
      <div ref={containerRef} className="min-h-[300px]" />
    </div>
  );
}
