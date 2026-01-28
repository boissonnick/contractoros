"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useExpenses } from '@/lib/hooks/useExpenses';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Button, Input, Textarea, Select, Card } from '@/components/ui';
import { toast } from '@/components/ui/Toast';
import { ExpenseCategory, Project } from '@/types';
import {
  ArrowLeftIcon,
  CameraIcon,
  ReceiptPercentIcon,
} from '@heroicons/react/24/outline';

const categoryOptions = [
  { value: 'materials', label: 'Materials' },
  { value: 'tools', label: 'Tools' },
  { value: 'equipment_rental', label: 'Equipment Rental' },
  { value: 'permits', label: 'Permits' },
  { value: 'travel', label: 'Travel' },
  { value: 'meals', label: 'Meals' },
  { value: 'other', label: 'Other' },
];

export default function NewExpensePage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { addExpense } = useExpenses();

  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [projectId, setProjectId] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('materials');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [vendor, setVendor] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch projects for the dropdown
  useEffect(() => {
    async function fetchProjects() {
      if (!profile?.orgId) return;
      const q = query(
        collection(db, 'projects'),
        where('orgId', '==', profile.orgId),
      );
      const snap = await getDocs(q);
      const items = snap.docs.map(d => ({
        id: d.id,
        name: d.data().name as string,
      }));
      setProjects(items);
    }
    fetchProjects();
  }, [profile?.orgId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !amount || !description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await addExpense({
        projectId,
        category,
        amount: parseFloat(amount),
        description: description.trim(),
        vendor: vendor.trim() || undefined,
        date: new Date(date),
        notes: notes.trim() || undefined,
      });
      toast.success('Expense created');
      router.push('/dashboard/expenses');
    } catch {
      toast.error('Failed to create expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Expense</h1>
          <p className="text-gray-500 mt-1">Log a project expense</p>
        </div>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Project */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Project <span className="text-red-500">*</span>
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a project</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Category & Amount */}
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              options={categoryOptions}
            />
            <Input
              label="Amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <Input
            label="Description"
            placeholder="What was this expense for?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />

          {/* Vendor & Date */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Vendor / Supplier"
              placeholder="e.g., Home Depot, Lowes..."
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
            />
            <Input
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* Receipt Upload Placeholder */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Receipt
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer">
              <CameraIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">Upload receipt photo</p>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</p>
            </div>
          </div>

          {/* Notes */}
          <Textarea
            label="Notes"
            placeholder="Any additional details..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={() => router.back()} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={loading}>
              <ReceiptPercentIcon className="h-4 w-4 mr-2" />
              Create Expense
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
