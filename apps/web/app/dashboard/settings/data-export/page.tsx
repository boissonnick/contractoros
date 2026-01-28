"use client";

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { exportToCSV, exportToExcel } from '@/lib/exports';
import { Card, Button } from '@/components/ui';
import { toast } from '@/components/ui/Toast';
import {
  ArrowDownTrayIcon,
  DocumentTextIcon,
  TableCellsIcon,
  BanknotesIcon,
  ReceiptPercentIcon,
  CurrencyDollarIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

type ExportType = 'invoices' | 'expenses' | 'estimates' | 'payments' | 'projects' | 'team';

interface ExportOption {
  type: ExportType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const EXPORT_OPTIONS: ExportOption[] = [
  {
    type: 'invoices',
    label: 'Invoices',
    description: 'All invoices with line items, status, and payment amounts',
    icon: DocumentTextIcon,
  },
  {
    type: 'expenses',
    label: 'Expenses',
    description: 'All expenses with categories, vendors, and approval status',
    icon: ReceiptPercentIcon,
  },
  {
    type: 'estimates',
    label: 'Estimates',
    description: 'All estimates with line items, totals, and win/loss status',
    icon: BanknotesIcon,
  },
  {
    type: 'payments',
    label: 'Payments',
    description: 'Payment records with methods and dates',
    icon: CurrencyDollarIcon,
  },
  {
    type: 'projects',
    label: 'Projects',
    description: 'Project list with budgets, status, and key dates',
    icon: TableCellsIcon,
  },
  {
    type: 'team',
    label: 'Team Members',
    description: 'Team roster with roles and contact info',
    icon: UsersIcon,
  },
];

export default function DataExportPage() {
  const { profile } = useAuth();
  const [exporting, setExporting] = useState<ExportType | null>(null);
  const [dateRange, setDateRange] = useState({
    start: format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  });
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel'>('csv');

  const handleExport = async (type: ExportType) => {
    if (!profile?.orgId) {
      toast.error('No organization found');
      return;
    }

    setExporting(type);
    try {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999);

      const dateStr = `${format(startDate, 'MMM-dd-yyyy')}_to_${format(endDate, 'MMM-dd-yyyy')}`;

      switch (type) {
        case 'invoices': {
          const snap = await getDocs(
            query(collection(db, 'invoices'), where('orgId', '==', profile.orgId))
          );
          const data = snap.docs.map((d) => {
            const inv = d.data();
            return {
              'Invoice #': inv.invoiceNumber || d.id,
              'Client': inv.clientName || '',
              'Project': inv.projectName || '',
              'Status': inv.status || '',
              'Issue Date': inv.issueDate ? format((inv.issueDate as Timestamp).toDate(), 'yyyy-MM-dd') : '',
              'Due Date': inv.dueDate ? format((inv.dueDate as Timestamp).toDate(), 'yyyy-MM-dd') : '',
              'Subtotal': inv.subtotal || 0,
              'Tax': inv.tax || 0,
              'Total': inv.total || 0,
              'Amount Paid': inv.amountPaid || 0,
              'Amount Due': inv.amountDue || 0,
            };
          });

          if (exportFormat === 'csv') {
            exportToCSV({
              filename: `invoices_${dateStr}`,
              headers: Object.keys(data[0] || {}),
              rows: data.map((d) => Object.values(d)),
            });
          } else {
            await exportToExcel({
              filename: `invoices_${dateStr}`,
              sheets: [{
                name: 'Invoices',
                columns: Object.keys(data[0] || {}).map((k) => ({ header: k, key: k, width: 15 })),
                data,
              }],
            });
          }
          toast.success(`Exported ${data.length} invoices`);
          break;
        }

        case 'expenses': {
          const snap = await getDocs(
            query(collection(db, 'expenses'), where('orgId', '==', profile.orgId))
          );
          const data = snap.docs.map((d) => {
            const exp = d.data();
            return {
              'Date': exp.date ? format((exp.date as Timestamp).toDate(), 'yyyy-MM-dd') : '',
              'Description': exp.description || '',
              'Category': exp.category || '',
              'Vendor': exp.vendor || '',
              'Amount': exp.amount || 0,
              'Status': exp.status || '',
              'Project ID': exp.projectId || '',
            };
          });

          if (exportFormat === 'csv') {
            exportToCSV({
              filename: `expenses_${dateStr}`,
              headers: Object.keys(data[0] || {}),
              rows: data.map((d) => Object.values(d)),
            });
          } else {
            await exportToExcel({
              filename: `expenses_${dateStr}`,
              sheets: [{
                name: 'Expenses',
                columns: Object.keys(data[0] || {}).map((k) => ({ header: k, key: k, width: 15 })),
                data,
              }],
            });
          }
          toast.success(`Exported ${data.length} expenses`);
          break;
        }

        case 'estimates': {
          const snap = await getDocs(
            query(collection(db, 'estimates'), where('orgId', '==', profile.orgId))
          );
          const data = snap.docs.map((d) => {
            const est = d.data();
            return {
              'Estimate #': est.estimateNumber || d.id,
              'Client': est.clientName || '',
              'Project': est.projectName || '',
              'Status': est.status || '',
              'Date': est.createdAt ? format((est.createdAt as Timestamp).toDate(), 'yyyy-MM-dd') : '',
              'Subtotal': est.subtotal || 0,
              'Tax': est.tax || 0,
              'Total': est.total || 0,
            };
          });

          if (exportFormat === 'csv') {
            exportToCSV({
              filename: `estimates_${dateStr}`,
              headers: Object.keys(data[0] || {}),
              rows: data.map((d) => Object.values(d)),
            });
          } else {
            await exportToExcel({
              filename: `estimates_${dateStr}`,
              sheets: [{
                name: 'Estimates',
                columns: Object.keys(data[0] || {}).map((k) => ({ header: k, key: k, width: 15 })),
                data,
              }],
            });
          }
          toast.success(`Exported ${data.length} estimates`);
          break;
        }

        case 'payments': {
          const snap = await getDocs(
            query(collection(db, 'payments'), where('orgId', '==', profile.orgId))
          );
          const data = snap.docs.map((d) => {
            const pay = d.data();
            return {
              'Date': pay.date ? format((pay.date as Timestamp).toDate(), 'yyyy-MM-dd') : '',
              'Invoice #': pay.invoiceNumber || '',
              'Client': pay.clientName || '',
              'Method': pay.method || '',
              'Amount': pay.amount || 0,
              'Reference': pay.referenceNumber || '',
            };
          });

          if (exportFormat === 'csv') {
            exportToCSV({
              filename: `payments_${dateStr}`,
              headers: Object.keys(data[0] || {}),
              rows: data.map((d) => Object.values(d)),
            });
          } else {
            await exportToExcel({
              filename: `payments_${dateStr}`,
              sheets: [{
                name: 'Payments',
                columns: Object.keys(data[0] || {}).map((k) => ({ header: k, key: k, width: 15 })),
                data,
              }],
            });
          }
          toast.success(`Exported ${data.length} payments`);
          break;
        }

        case 'projects': {
          const snap = await getDocs(
            query(collection(db, 'projects'), where('orgId', '==', profile.orgId))
          );
          const data = snap.docs.map((d) => {
            const proj = d.data();
            return {
              'Name': proj.name || '',
              'Client': proj.clientName || '',
              'Status': proj.status || '',
              'Budget': proj.budget || 0,
              'Start Date': proj.startDate ? format((proj.startDate as Timestamp).toDate(), 'yyyy-MM-dd') : '',
              'End Date': proj.endDate ? format((proj.endDate as Timestamp).toDate(), 'yyyy-MM-dd') : '',
              'Address': proj.address || '',
            };
          });

          if (exportFormat === 'csv') {
            exportToCSV({
              filename: `projects_${dateStr}`,
              headers: Object.keys(data[0] || {}),
              rows: data.map((d) => Object.values(d)),
            });
          } else {
            await exportToExcel({
              filename: `projects_${dateStr}`,
              sheets: [{
                name: 'Projects',
                columns: Object.keys(data[0] || {}).map((k) => ({ header: k, key: k, width: 18 })),
                data,
              }],
            });
          }
          toast.success(`Exported ${data.length} projects`);
          break;
        }

        case 'team': {
          const snap = await getDocs(
            query(collection(db, 'users'), where('orgId', '==', profile.orgId))
          );
          const data = snap.docs.map((d) => {
            const usr = d.data();
            return {
              'Name': `${usr.firstName || ''} ${usr.lastName || ''}`.trim(),
              'Email': usr.email || '',
              'Role': usr.role || '',
              'Phone': usr.phone || '',
              'Trade': usr.trade || '',
            };
          });

          if (exportFormat === 'csv') {
            exportToCSV({
              filename: `team_${dateStr}`,
              headers: Object.keys(data[0] || {}),
              rows: data.map((d) => Object.values(d)),
            });
          } else {
            await exportToExcel({
              filename: `team_${dateStr}`,
              sheets: [{
                name: 'Team',
                columns: Object.keys(data[0] || {}).map((k) => ({ header: k, key: k, width: 18 })),
                data,
              }],
            });
          }
          toast.success(`Exported ${data.length} team members`);
          break;
        }
      }
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Failed to export data');
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Data Export</h2>
        <p className="text-sm text-gray-500">
          Export your data as CSV or Excel for any accounting system.
        </p>
      </div>

      {/* Export Settings */}
      <Card className="p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Export Settings</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as 'csv' | 'excel')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="csv">CSV (.csv)</option>
              <option value="excel">Excel (.xlsx)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Export Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {EXPORT_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isExporting = exporting === opt.type;
          return (
            <Card key={opt.type} className="p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Icon className="h-5 w-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{opt.label}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{opt.description}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onClick={() => handleExport(opt.type)}
                    disabled={isExporting}
                  >
                    {isExporting ? (
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-1" />
                    ) : (
                      <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                    )}
                    {isExporting ? 'Exporting...' : `Export ${exportFormat.toUpperCase()}`}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
