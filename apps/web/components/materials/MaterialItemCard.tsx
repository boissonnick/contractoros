'use client';

import React from 'react';
import Image from 'next/image';
import {
  CubeIcon,
  ExclamationTriangleIcon,
  TagIcon,
  MapPinIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline';
import { MaterialItem, MaterialStatus, MATERIAL_STATUSES, MATERIAL_CATEGORIES, LINE_ITEM_UNITS } from '@/types';
import Badge, { BadgeProps } from '@/components/ui/Badge';

// Map material status to badge variant
const statusVariantMap: Record<MaterialStatus, BadgeProps['variant']> = {
  in_stock: 'success',
  low_stock: 'warning',
  out_of_stock: 'danger',
  on_order: 'primary',
  on_site: 'info',
  consumed: 'default',
  returned: 'default',
};

export interface MaterialItemCardProps {
  material: MaterialItem;
  onClick?: () => void;
  compact?: boolean;
}

export default function MaterialItemCard({
  material,
  onClick,
  compact = false,
}: MaterialItemCardProps) {
  const statusInfo = MATERIAL_STATUSES.find((s) => s.value === material.status);
  const categoryInfo = MATERIAL_CATEGORIES.find((c) => c.value === material.category);
  const unitInfo = LINE_ITEM_UNITS.find((u) => u.value === material.unit);
  const statusVariant = statusVariantMap[material.status] || 'default';

  const isLowStock = material.status === 'low_stock' || material.status === 'out_of_stock';

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={`flex items-center justify-between p-3 bg-white rounded-lg border hover:border-brand-primary hover:shadow-sm cursor-pointer transition-all ${
          isLowStock ? 'border-amber-200 bg-amber-50' : 'border-gray-200'
        }`}
      >
        <div className="flex items-center gap-3">
          {material.imageUrl ? (
            <Image
              src={material.imageUrl}
              alt={material.name}
              width={40}
              height={40}
              className="w-10 h-10 rounded object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
              <CubeIcon className="w-5 h-5 text-gray-400" />
            </div>
          )}
          <div>
            <p className="font-medium text-gray-900">{material.name}</p>
            <p className="text-sm text-gray-500">
              {material.sku && <span className="mr-2">SKU: {material.sku}</span>}
              {categoryInfo?.label}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-semibold text-gray-900">
              {material.quantityOnHand} {unitInfo?.abbr}
            </p>
            <p className="text-sm text-gray-500">${material.unitCost.toFixed(2)}/ea</p>
          </div>
          <Badge variant={statusVariant} size="sm">
            {statusInfo?.label || material.status}
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`p-4 bg-white rounded-lg border hover:border-brand-primary hover:shadow-md cursor-pointer transition-all ${
        isLowStock ? 'border-amber-200' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start gap-4">
        {material.imageUrl ? (
          <Image
            src={material.imageUrl}
            alt={material.name}
            width={64}
            height={64}
            className="w-16 h-16 rounded-lg object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
            <CubeIcon className="w-8 h-8 text-gray-400" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 truncate">{material.name}</h3>
              {material.description && (
                <p className="text-sm text-gray-500 line-clamp-1">{material.description}</p>
              )}
            </div>
            <Badge variant={statusVariant} size="sm">
              {statusInfo?.label || material.status}
            </Badge>
          </div>

          <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
            {material.sku && (
              <span className="flex items-center gap-1">
                <TagIcon className="w-4 h-4" />
                {material.sku}
              </span>
            )}
            <span className="flex items-center gap-1">
              <CubeIcon className="w-4 h-4" />
              {categoryInfo?.label}
            </span>
            {material.defaultLocation && (
              <span className="flex items-center gap-1">
                <MapPinIcon className="w-4 h-4" />
                {material.defaultLocation}
              </span>
            )}
          </div>

          <div className="mt-3 grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500">On Hand</p>
              <p className="font-semibold text-gray-900">
                {material.quantityOnHand} {unitInfo?.abbr}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Reserved</p>
              <p className="font-medium text-gray-700">
                {material.quantityReserved} {unitInfo?.abbr}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Available</p>
              <p className="font-medium text-green-600">
                {material.quantityAvailable} {unitInfo?.abbr}
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-500">
                Unit Cost: <span className="font-medium text-gray-900">${material.unitCost.toFixed(2)}</span>
              </span>
              {material.preferredSupplierName && (
                <span className="flex items-center gap-1 text-gray-500">
                  <BuildingStorefrontIcon className="w-4 h-4" />
                  {material.preferredSupplierName}
                </span>
              )}
            </div>

            {isLowStock && (
              <div className="flex items-center gap-1 text-amber-600">
                <ExclamationTriangleIcon className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {material.status === 'out_of_stock' ? 'Out of Stock' : 'Low Stock'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
