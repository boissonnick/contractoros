"use client";

import React from 'react';
import { Button } from '@/components/ui';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface ReportExportProps {
  data: Record<string, unknown>[];
  filename: string;
}

export default function ReportExport({ data, filename }: ReportExportProps) {
  const handleExport = () => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(h => {
        const val = row[h];
        const str = typeof val === 'number' ? val.toFixed(2) : String(val || '');
        return str.includes(',') ? `"${str}"` : str;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} icon={<ArrowDownTrayIcon className="h-4 w-4" />} disabled={data.length === 0}>
      Export CSV
    </Button>
  );
}
