'use client';

import { cn, formatCurrencyCompact } from '@/lib/utils';

interface LineItem {
  description: string;
  quantity: number | null;
  unitPrice: number | null;
  totalPrice: number | null;
}

interface LineItemsTableProps {
  lineItems: LineItem[];
  className?: string;
}

function formatValue(value: number | null): string {
  if (value == null) return '\u2013';
  return formatCurrencyCompact(value);
}

function formatQty(value: number | null): string {
  if (value == null) return '\u2013';
  return value.toString();
}

export default function LineItemsTable({ lineItems, className }: LineItemsTableProps) {
  if (lineItems.length === 0) {
    return (
      <div className={cn('rounded-xl border border-gray-200 bg-white p-6 text-center', className)}>
        <p className="text-sm text-gray-500">No line items extracted</p>
      </div>
    );
  }

  const grandTotal = lineItems.reduce((sum, item) => sum + (item.totalPrice ?? 0), 0);

  return (
    <div className={cn('rounded-xl border border-gray-200 bg-white overflow-hidden', className)}>
      {/* Desktop table (md and up) */}
      <div className="hidden md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs font-medium uppercase">
              <th className="px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-right w-20">Qty</th>
              <th className="px-4 py-3 text-right w-28">Unit Price</th>
              <th className="px-4 py-3 text-right w-28">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {lineItems.map((item, index) => (
              <tr key={index} className="text-gray-900">
                <td className="px-4 py-3">{item.description}</td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-600">
                  {formatQty(item.quantity)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-600">
                  {formatValue(item.unitPrice)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-medium">
                  {formatValue(item.totalPrice)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-200 bg-gray-50">
              <td colSpan={3} className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                Grand Total
              </td>
              <td className="px-4 py-3 text-right tabular-nums font-semibold text-gray-900">
                {formatCurrencyCompact(grandTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Mobile stacked cards (below md) */}
      <div className="md:hidden divide-y divide-gray-100">
        {lineItems.map((item, index) => (
          <div key={index} className="p-4 space-y-2">
            <p className="text-sm font-medium text-gray-900">{item.description}</p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-4">
                <span>
                  Qty: <span className="tabular-nums text-gray-700">{formatQty(item.quantity)}</span>
                </span>
                <span>
                  Unit: <span className="tabular-nums text-gray-700">{formatValue(item.unitPrice)}</span>
                </span>
              </div>
              <span className="text-sm tabular-nums font-medium text-gray-900">
                {formatValue(item.totalPrice)}
              </span>
            </div>
          </div>
        ))}
        <div className="p-4 bg-gray-50 flex items-center justify-between">
          <span className="text-xs font-medium uppercase text-gray-500">Grand Total</span>
          <span className="text-sm tabular-nums font-semibold text-gray-900">
            {formatCurrencyCompact(grandTotal)}
          </span>
        </div>
      </div>
    </div>
  );
}
