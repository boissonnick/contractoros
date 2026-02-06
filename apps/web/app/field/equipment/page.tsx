"use client";

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useEquipment } from '@/lib/hooks/useEquipment';
import { toast } from '@/components/ui/Toast';
import { EquipmentItem } from '@/types';
import {
  WrenchScrewdriverIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowUturnLeftIcon,
  HashtagIcon,
  TagIcon,
  CalendarIcon,
  ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline';

type Tab = 'available' | 'my_checkouts';

const CONDITION_COLORS: Record<string, string> = {
  excellent: 'bg-green-100 text-green-800',
  good: 'bg-blue-100 text-blue-800',
  fair: 'bg-yellow-100 text-yellow-800',
  poor: 'bg-orange-100 text-orange-800',
  damaged: 'bg-red-100 text-red-800',
};

function formatCategory(category: string): string {
  return category
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function FieldEquipmentPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const orgId = profile?.orgId || '';

  const { equipment, loading, checkOut, returnEquipment, refresh } = useEquipment({ orgId });

  const [tab, setTab] = useState<Tab>('available');
  const [selectedItem, setSelectedItem] = useState<EquipmentItem | null>(null);
  const [showCheckoutPanel, setShowCheckoutPanel] = useState(false);
  const [showReturnPanel, setShowReturnPanel] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Checkout form state
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);

  // Return form state
  const [returnCondition, setReturnCondition] = useState<'excellent' | 'good' | 'fair' | 'poor' | 'damaged'>('good');
  const [returnNotes, setReturnNotes] = useState('');
  const [returnSubmitting, setReturnSubmitting] = useState(false);

  const availableEquipment = equipment.filter((e) => e.status === 'available' && e.isActive);
  const myCheckouts = equipment.filter((e) => e.checkedOutTo === user?.uid && e.status === 'checked_out');

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const openCheckout = (item: EquipmentItem) => {
    setSelectedItem(item);
    setCheckoutNotes('');
    setExpectedReturnDate('');
    setShowCheckoutPanel(true);
    setShowReturnPanel(false);
  };

  const openReturn = (item: EquipmentItem) => {
    setSelectedItem(item);
    setReturnCondition('good');
    setReturnNotes('');
    setShowReturnPanel(true);
    setShowCheckoutPanel(false);
  };

  const handleCheckout = async () => {
    if (!selectedItem || !user || !profile) return;
    setCheckoutSubmitting(true);
    try {
      await checkOut(selectedItem.id, {
        userId: user.uid,
        userName: profile.displayName || 'Unknown',
        notes: checkoutNotes || undefined,
        expectedReturnDate: expectedReturnDate || undefined,
      });
      toast.success(`${selectedItem.name} checked out`);
      setShowCheckoutPanel(false);
      setSelectedItem(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to check out equipment');
    } finally {
      setCheckoutSubmitting(false);
    }
  };

  const handleReturn = async () => {
    if (!selectedItem) return;
    setReturnSubmitting(true);
    try {
      await returnEquipment(selectedItem.id, {
        condition: returnCondition,
        notes: returnNotes || undefined,
      });
      toast.success(`${selectedItem.name} returned`);
      setShowReturnPanel(false);
      setSelectedItem(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to return equipment');
    } finally {
      setReturnSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <WrenchScrewdriverIcon className="h-6 w-6 text-brand-primary" />
            <h1 className="text-lg font-semibold tracking-tight">Equipment</h1>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 -mr-2 rounded-lg hover:bg-gray-100 active:bg-gray-200"
          >
            <ArrowPathIcon className={`h-6 w-6 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-t">
          <button
            onClick={() => setTab('available')}
            className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${
              tab === 'available'
                ? 'text-brand-primary border-b-2 border-brand-primary bg-brand-primary/5'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Available ({availableEquipment.length})
          </button>
          <button
            onClick={() => setTab('my_checkouts')}
            className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${
              tab === 'my_checkouts'
                ? 'text-brand-primary border-b-2 border-brand-primary bg-brand-primary/5'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            My Checkouts ({myCheckouts.length})
          </button>
        </div>
      </div>

      {/* Equipment List */}
      <div className="p-4 space-y-3">
        {tab === 'available' && (
          <>
            {availableEquipment.length === 0 ? (
              <div className="text-center py-12">
                <WrenchScrewdriverIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No equipment available</p>
                <p className="text-sm text-gray-400 mt-1">All equipment is currently checked out or in maintenance</p>
              </div>
            ) : (
              availableEquipment.map((item) => (
                <button
                  key={item.id}
                  onClick={() => openCheckout(item)}
                  className="w-full text-left bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md active:bg-gray-50 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <TagIcon className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-500">{formatCategory(item.category)}</span>
                      </div>
                      {item.serialNumber && (
                        <div className="flex items-center gap-2 mt-1">
                          <HashtagIcon className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-500 font-mono">{item.serialNumber}</span>
                        </div>
                      )}
                    </div>
                    <span className={`ml-3 px-2.5 py-1 rounded-full text-xs font-medium ${CONDITION_COLORS[item.condition] || 'bg-gray-100 text-gray-800'}`}>
                      {item.condition}
                    </span>
                  </div>
                </button>
              ))
            )}
          </>
        )}

        {tab === 'my_checkouts' && (
          <>
            {myCheckouts.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircleIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No equipment checked out</p>
                <p className="text-sm text-gray-400 mt-1">Browse available equipment to check something out</p>
              </div>
            ) : (
              myCheckouts.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <TagIcon className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-500">{formatCategory(item.category)}</span>
                      </div>
                      {item.serialNumber && (
                        <div className="flex items-center gap-2 mt-1">
                          <HashtagIcon className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-500 font-mono">{item.serialNumber}</span>
                        </div>
                      )}
                      {item.checkedOutAt && (
                        <div className="flex items-center gap-2 mt-1">
                          <CalendarIcon className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-500">
                            Checked out {new Date(item.checkedOutAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {item.expectedReturnDate && (
                        <div className="flex items-center gap-2 mt-0.5">
                          <ArrowUturnLeftIcon className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-500">
                            Due back {new Date(item.expectedReturnDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className={`ml-3 px-2.5 py-1 rounded-full text-xs font-medium ${CONDITION_COLORS[item.condition] || 'bg-gray-100 text-gray-800'}`}>
                      {item.condition}
                    </span>
                  </div>
                  <button
                    onClick={() => openReturn(item)}
                    className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-primary text-white rounded-xl font-medium text-sm hover:bg-brand-primary/90 active:bg-brand-primary/80 transition-colors"
                  >
                    <ArrowUturnLeftIcon className="h-5 w-5" />
                    Return Equipment
                  </button>
                </div>
              ))
            )}
          </>
        )}
      </div>

      {/* Checkout Panel (slide-up) */}
      {showCheckoutPanel && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowCheckoutPanel(false)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-t-2xl shadow-xl p-5 pb-8 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Check Out Equipment</h2>
              <button
                onClick={() => setShowCheckoutPanel(false)}
                className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 mb-4">
              <p className="font-medium text-gray-900">{selectedItem.name}</p>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                <span>{formatCategory(selectedItem.category)}</span>
                {selectedItem.serialNumber && (
                  <>
                    <span className="text-gray-300">|</span>
                    <span className="font-mono">{selectedItem.serialNumber}</span>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Return Date (optional)
                </label>
                <input
                  type="date"
                  value={expectedReturnDate}
                  onChange={(e) => setExpectedReturnDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={checkoutNotes}
                  onChange={(e) => setCheckoutNotes(e.target.value)}
                  placeholder="e.g., For foundation work at 123 Oak St"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary resize-none"
                />
              </div>

              <button
                onClick={handleCheckout}
                disabled={checkoutSubmitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-brand-primary text-white rounded-xl font-medium text-base hover:bg-brand-primary/90 active:bg-brand-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checkoutSubmitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  <>
                    <CheckCircleIcon className="h-5 w-5" />
                    Confirm Checkout
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Panel (slide-up) */}
      {showReturnPanel && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowReturnPanel(false)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-t-2xl shadow-xl p-5 pb-8 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Return Equipment</h2>
              <button
                onClick={() => setShowReturnPanel(false)}
                className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 mb-4">
              <p className="font-medium text-gray-900">{selectedItem.name}</p>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                <span>{formatCategory(selectedItem.category)}</span>
                {selectedItem.serialNumber && (
                  <>
                    <span className="text-gray-300">|</span>
                    <span className="font-mono">{selectedItem.serialNumber}</span>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condition
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['excellent', 'good', 'fair', 'poor', 'damaged'] as const).map((cond) => (
                    <button
                      key={cond}
                      onClick={() => setReturnCondition(cond)}
                      className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        returnCondition === cond
                          ? cond === 'damaged'
                            ? 'bg-red-600 text-white ring-2 ring-red-600 ring-offset-1'
                            : 'bg-brand-primary text-white ring-2 ring-brand-primary ring-offset-1'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
                      }`}
                    >
                      {cond.charAt(0).toUpperCase() + cond.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <div className="relative">
                  <ChatBubbleLeftIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <textarea
                    value={returnNotes}
                    onChange={(e) => setReturnNotes(e.target.value)}
                    placeholder="Any damage or issues to report?"
                    rows={3}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary resize-none"
                  />
                </div>
              </div>

              <button
                onClick={handleReturn}
                disabled={returnSubmitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-brand-primary text-white rounded-xl font-medium text-base hover:bg-brand-primary/90 active:bg-brand-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {returnSubmitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  <>
                    <ArrowUturnLeftIcon className="h-5 w-5" />
                    Confirm Return
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
