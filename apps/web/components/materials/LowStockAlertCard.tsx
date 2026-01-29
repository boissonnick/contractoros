'use client';

import React from 'react';
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ShoppingCartIcon,
} from '@heroicons/react/24/outline';
import { LowStockAlert, MATERIAL_CATEGORIES, LINE_ITEM_UNITS } from '@/types';
import Button from '@/components/ui/Button';

export interface LowStockAlertCardProps {
  alert: LowStockAlert;
  onAcknowledge?: () => void;
  onCreateOrder?: () => void;
}

export default function LowStockAlertCard({
  alert,
  onAcknowledge,
  onCreateOrder,
}: LowStockAlertCardProps) {
  const categoryInfo = MATERIAL_CATEGORIES.find((c) => c.value === alert.category);
  const unitInfo = LINE_ITEM_UNITS.find((u) => u.value === alert.unit);

  const isOutOfStock = alert.currentQuantity <= 0;

  return (
    <div
      className={`p-4 rounded-lg border ${
        isOutOfStock
          ? 'bg-red-50 border-red-200'
          : 'bg-amber-50 border-amber-200'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-full ${
              isOutOfStock ? 'bg-red-100' : 'bg-amber-100'
            }`}
          >
            <ExclamationTriangleIcon
              className={`w-5 h-5 ${isOutOfStock ? 'text-red-600' : 'text-amber-600'}`}
            />
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{alert.materialName}</h4>
            <p className="text-sm text-gray-500">{categoryInfo?.label}</p>
            <div className="mt-2 flex items-center gap-4 text-sm">
              <span className={isOutOfStock ? 'text-red-600 font-medium' : 'text-amber-700'}>
                Current: {alert.currentQuantity} {unitInfo?.abbr}
              </span>
              <span className="text-gray-500">
                Reorder Point: {alert.reorderPoint} {unitInfo?.abbr}
              </span>
              <span className="text-gray-500">
                Reorder Qty: {alert.reorderQuantity} {unitInfo?.abbr}
              </span>
            </div>
            {alert.preferredSupplierName && (
              <p className="mt-1 text-sm text-gray-600">
                Supplier: {alert.preferredSupplierName}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {alert.status === 'active' && (
            <>
              {onAcknowledge && (
                <Button size="sm" variant="secondary" onClick={onAcknowledge}>
                  <CheckCircleIcon className="w-4 h-4 mr-1" />
                  Acknowledge
                </Button>
              )}
              {onCreateOrder && (
                <Button size="sm" onClick={onCreateOrder}>
                  <ShoppingCartIcon className="w-4 h-4 mr-1" />
                  Order
                </Button>
              )}
            </>
          )}
          {alert.status === 'acknowledged' && (
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
              Acknowledged
            </span>
          )}
          {alert.status === 'ordered' && (
            <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded">
              Order Placed
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
