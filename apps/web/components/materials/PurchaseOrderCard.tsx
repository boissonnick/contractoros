'use client';

import React from 'react';
import {
  DocumentTextIcon,
  BuildingStorefrontIcon,
  CalendarIcon,
  TruckIcon,
} from '@heroicons/react/24/outline';
import { MaterialPurchaseOrder, MaterialPurchaseOrderStatus, MATERIAL_PURCHASE_ORDER_STATUSES } from '@/types';
import Badge, { BadgeProps } from '@/components/ui/Badge';

// Map purchase order status to badge variant
const getStatusVariant = (status: MaterialPurchaseOrderStatus): BadgeProps['variant'] => {
  switch (status) {
    case 'draft':
      return 'default';
    case 'pending':
      return 'warning';
    case 'approved':
      return 'primary';
    case 'ordered':
      return 'info';
    case 'partial':
      return 'warning';
    case 'received':
      return 'success';
    case 'cancelled':
      return 'danger';
    default:
      return 'default';
  }
};

export interface PurchaseOrderCardProps {
  order: MaterialPurchaseOrder;
  onClick?: () => void;
  compact?: boolean;
}

export default function PurchaseOrderCard({
  order,
  onClick,
  compact = false,
}: PurchaseOrderCardProps) {
  const statusInfo = MATERIAL_PURCHASE_ORDER_STATUSES.find((s) => s.value === order.status);

  const isLate =
    order.expectedDeliveryDate &&
    !order.actualDeliveryDate &&
    new Date(order.expectedDeliveryDate) < new Date() &&
    ['ordered', 'partial'].includes(order.status);

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={`flex items-center justify-between p-3 bg-white rounded-lg border hover:border-brand-primary hover:shadow-sm cursor-pointer transition-all ${
          isLate ? 'border-red-200 bg-red-50' : 'border-gray-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
            <DocumentTextIcon className="w-5 h-5 text-gray-400" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{order.orderNumber}</p>
            <p className="text-sm text-gray-500">{order.supplierName}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-semibold text-gray-900">${order.total.toLocaleString()}</span>
          <Badge variant={getStatusVariant(order.status)} size="sm">
            {statusInfo?.label || order.status}
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`p-4 bg-white rounded-lg border hover:border-brand-primary hover:shadow-md cursor-pointer transition-all ${
        isLate ? 'border-red-200' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">{order.orderNumber}</h3>
            <Badge variant={getStatusVariant(order.status)} size="sm">
              {statusInfo?.label || order.status}
            </Badge>
          </div>
          <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
            <BuildingStorefrontIcon className="w-4 h-4" />
            {order.supplierName}
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900 tracking-tight">
            ${order.total.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">
            {order.lineItems.length} item{order.lineItems.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-6 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          <CalendarIcon className="w-4 h-4" />
          Ordered: {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A'}
        </span>
        {order.expectedDeliveryDate && (
          <span className={`flex items-center gap-1 ${isLate ? 'text-red-600 font-medium' : ''}`}>
            <TruckIcon className="w-4 h-4" />
            Expected: {new Date(order.expectedDeliveryDate).toLocaleDateString()}
            {isLate && ' (LATE)'}
          </span>
        )}
        {order.projectName && (
          <span className="text-gray-700">
            Project: <strong>{order.projectName}</strong>
          </span>
        )}
      </div>

      {/* Line items preview */}
      <div className="mt-4 pt-4 border-t">
        <div className="space-y-2">
          {order.lineItems.slice(0, 3).map((item, index) => (
            <div key={item.id || index} className="flex items-center justify-between text-sm">
              <span className="text-gray-700">
                {item.name}
                {item.sku && <span className="text-gray-400 ml-1">({item.sku})</span>}
              </span>
              <span className="text-gray-500">
                {item.quantityReceived} / {item.quantityOrdered} received
              </span>
            </div>
          ))}
          {order.lineItems.length > 3 && (
            <p className="text-sm text-gray-400">
              +{order.lineItems.length - 3} more items...
            </p>
          )}
        </div>
      </div>

      {/* Progress bar for partial orders */}
      {['ordered', 'partial'].includes(order.status) && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Received Progress</span>
            <span>
              {order.lineItems.reduce((sum, item) => sum + item.quantityReceived, 0)} /{' '}
              {order.lineItems.reduce((sum, item) => sum + item.quantityOrdered, 0)} items
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-primary rounded-full transition-all"
              style={{
                width: `${
                  (order.lineItems.reduce((sum, item) => sum + item.quantityReceived, 0) /
                    order.lineItems.reduce((sum, item) => sum + item.quantityOrdered, 0)) *
                  100
                }%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
