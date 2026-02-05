"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { SavedPaymentMethod } from '@/types';
import {
  CreditCardIcon,
  BanknotesIcon,
  TrashIcon,
  CheckIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

export interface SavedPaymentMethodsProps {
  methods: SavedPaymentMethod[];
  loading?: boolean;
  selectedId?: string;
  onSelect?: (method: SavedPaymentMethod) => void;
  onSetDefault?: (methodId: string) => void;
  onDelete?: (methodId: string) => void;
  className?: string;
  selectable?: boolean;
}

// Card brand logos/colors
const CARD_BRANDS: Record<string, { name: string; bg: string }> = {
  visa: { name: 'Visa', bg: 'bg-blue-600' },
  mastercard: { name: 'Mastercard', bg: 'bg-red-600' },
  amex: { name: 'Amex', bg: 'bg-blue-500' },
  discover: { name: 'Discover', bg: 'bg-orange-500' },
  default: { name: 'Card', bg: 'bg-gray-600' },
};

/**
 * SavedPaymentMethods - Display and manage saved payment methods
 *
 * Features:
 * - Card and bank account display
 * - Set default method
 * - Delete methods
 * - Selection for checkout
 */
export default function SavedPaymentMethods({
  methods,
  loading = false,
  selectedId,
  onSelect,
  onSetDefault,
  onDelete,
  className,
  selectable = false,
}: SavedPaymentMethodsProps) {
  if (loading) {
    return (
      <div className={cn('space-y-3', className)}>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-12 h-8 bg-gray-200 rounded" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="h-3 w-16 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (methods.length === 0) {
    return (
      <div className={cn('text-center py-8 bg-gray-50 rounded-lg', className)}>
        <CreditCardIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500">No saved payment methods</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {methods.map((method) => {
        const isSelected = selectedId === method.id;
        const brandInfo = CARD_BRANDS[method.brand?.toLowerCase() || 'default'] || CARD_BRANDS.default;

        return (
          <div
            key={method.id}
            onClick={selectable && onSelect ? () => onSelect(method) : undefined}
            className={cn(
              'border rounded-lg p-4 transition-all',
              selectable && 'cursor-pointer',
              isSelected
                ? 'border-brand-primary bg-brand-primary/5 ring-1 ring-brand-primary'
                : 'border-gray-200 hover:border-gray-300'
            )}
          >
            <div className="flex items-center gap-3">
              {/* Payment method icon */}
              {method.type === 'card' ? (
                <div className={cn('w-12 h-8 rounded flex items-center justify-center text-white text-xs font-bold', brandInfo.bg)}>
                  {brandInfo.name.slice(0, 4)}
                </div>
              ) : (
                <div className="w-12 h-8 rounded bg-gray-600 flex items-center justify-center">
                  <BanknotesIcon className="h-5 w-5 text-white" />
                </div>
              )}

              {/* Details */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">
                    {method.type === 'card'
                      ? `${brandInfo.name} ****${method.last4}`
                      : `${method.bankName || 'Bank'} ****${method.accountLast4}`}
                  </span>
                  {method.isDefault && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-primary/10 text-brand-primary text-xs rounded-full">
                      <StarIconSolid className="h-3 w-3" />
                      Default
                    </span>
                  )}
                </div>
                {method.type === 'card' && method.expMonth && method.expYear && (
                  <p className="text-sm text-gray-500">
                    Expires {method.expMonth}/{method.expYear}
                  </p>
                )}
                {method.type === 'ach' && method.accountType && (
                  <p className="text-sm text-gray-500 capitalize">
                    {method.accountType} account
                  </p>
                )}
                {method.nickname && (
                  <p className="text-xs text-gray-400">{method.nickname}</p>
                )}
              </div>

              {/* Selection indicator */}
              {selectable && (
                <div
                  className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                    isSelected
                      ? 'border-brand-primary bg-brand-primary'
                      : 'border-gray-300'
                  )}
                >
                  {isSelected && <CheckIcon className="h-3 w-3 text-white" />}
                </div>
              )}

              {/* Actions (only show when not in selection mode) */}
              {!selectable && (onSetDefault || onDelete) && (
                <div className="flex items-center gap-1">
                  {onSetDefault && !method.isDefault && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetDefault(method.id);
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                      title="Set as default"
                    >
                      <StarIcon className="h-4 w-4" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(method.id);
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      title="Remove"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * AddPaymentMethodCard - Button to add new payment method
 */
export function AddPaymentMethodCard({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full border-2 border-dashed border-gray-300 rounded-lg p-4',
        'flex items-center justify-center gap-2',
        'text-gray-600 hover:text-gray-900 hover:border-gray-400 transition-colors',
        className
      )}
    >
      <CreditCardIcon className="h-5 w-5" />
      <span className="font-medium">Add Payment Method</span>
    </button>
  );
}
