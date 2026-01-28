"use client";

import React, { useState } from 'react';
import { SubAssignment, SubPaymentScheduleItem } from '@/types';
import { Button, Input } from '@/components/ui';
import { PlusIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils';

interface SubPaymentTrackerProps {
  assignment: SubAssignment;
  onUpdate: (data: Partial<SubAssignment>) => void;
}

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export default function SubPaymentTracker({ assignment, onUpdate }: SubPaymentTrackerProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');

  const totalScheduled = assignment.paymentSchedule.reduce((sum, p) => sum + p.amount, 0);
  const totalPaid = assignment.paymentSchedule.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);

  const addPayment = () => {
    if (!desc.trim() || !amount) return;
    const item: SubPaymentScheduleItem = {
      id: Date.now().toString(),
      description: desc.trim(),
      amount: parseFloat(amount),
      dueDate: dueDate ? new Date(dueDate) : undefined,
      status: 'pending',
    };
    onUpdate({
      paymentSchedule: [...assignment.paymentSchedule, item],
    });
    setShowAdd(false);
    setDesc('');
    setAmount('');
    setDueDate('');
  };

  const markPaid = (paymentId: string) => {
    const updated = assignment.paymentSchedule.map(p =>
      p.id === paymentId ? { ...p, status: 'paid' as const, paidAt: new Date() } : p
    );
    const newPaidAmount = updated.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
    onUpdate({ paymentSchedule: updated, paidAmount: newPaidAmount });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900">Payments</h4>
        <Button variant="secondary" size="sm" onClick={() => setShowAdd(true)} icon={<PlusIcon className="h-3.5 w-3.5" />}>
          Add Payment
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 text-center text-xs">
        <div className="bg-gray-50 rounded-lg py-2">
          <p className="font-semibold text-gray-900">{fmt(assignment.agreedAmount)}</p>
          <p className="text-gray-500">Agreed</p>
        </div>
        <div className="bg-gray-50 rounded-lg py-2">
          <p className="font-semibold text-green-600">{fmt(totalPaid)}</p>
          <p className="text-gray-500">Paid</p>
        </div>
        <div className="bg-gray-50 rounded-lg py-2">
          <p className="font-semibold text-gray-900">{fmt(assignment.agreedAmount - totalPaid)}</p>
          <p className="text-gray-500">Remaining</p>
        </div>
      </div>

      {/* Payment schedule */}
      <div className="space-y-2">
        {assignment.paymentSchedule.map((p) => {
          const isPaid = p.status === 'paid';
          const isOverdue = !isPaid && p.dueDate && p.dueDate < new Date();
          return (
            <div key={p.id} className={cn('flex items-center gap-3 px-3 py-2 rounded-lg', isPaid ? 'bg-green-50' : isOverdue ? 'bg-red-50' : 'bg-gray-50')}>
              {isPaid ? (
                <CheckCircleSolid className="h-5 w-5 text-green-500 flex-shrink-0" />
              ) : (
                <button onClick={() => markPaid(p.id)} className="flex-shrink-0">
                  <CheckCircleIcon className="h-5 w-5 text-gray-300 hover:text-green-500" />
                </button>
              )}
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm', isPaid ? 'text-gray-400 line-through' : 'text-gray-900')}>{p.description}</p>
                {p.dueDate && (
                  <p className={cn('text-xs', isOverdue ? 'text-red-500' : 'text-gray-500')}>
                    Due {formatDate(p.dueDate)}
                    {isPaid && p.paidAt && ` · Paid ${formatDate(p.paidAt)}`}
                  </p>
                )}
              </div>
              <span className={cn('text-sm font-medium', isPaid ? 'text-green-600' : 'text-gray-900')}>
                {fmt(p.amount)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="border border-blue-200 rounded-lg p-3 bg-blue-50/50 space-y-2">
          <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description" />
          <div className="flex gap-2">
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" min={0} step="0.01" className="flex-1" />
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-36" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={addPayment} disabled={!desc.trim() || !amount}>Add</Button>
          </div>
        </div>
      )}
    </div>
  );
}
