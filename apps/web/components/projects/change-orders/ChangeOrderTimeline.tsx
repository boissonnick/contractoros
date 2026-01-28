"use client";

import React from 'react';
import { ChangeOrder } from '@/types';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/lib/date-utils';

interface ChangeOrderTimelineProps {
  co: ChangeOrder;
}

export default function ChangeOrderTimeline({ co }: ChangeOrderTimelineProps) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-900">Audit Log</h4>
      <div className="relative">
        <div className="absolute left-3 top-0 bottom-0 w-px bg-gray-200" />
        <div className="space-y-4">
          {co.history.map((entry) => (
            <div key={entry.id} className="relative flex gap-3 pl-8">
              <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-white border-2 border-gray-300" />
              <div>
                <p className="text-sm text-gray-900">
                  <span className="font-medium">{entry.userName}</span>
                  {' '}{entry.action}
                </p>
                {entry.details && <p className="text-xs text-gray-500 mt-0.5">{entry.details}</p>}
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatDateTime(entry.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
