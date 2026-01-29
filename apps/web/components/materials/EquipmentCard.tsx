'use client';

import React from 'react';
import {
  WrenchScrewdriverIcon,
  UserIcon,
  MapPinIcon,
  CalendarIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { EquipmentItem, EQUIPMENT_STATUSES, MATERIAL_CATEGORIES, EquipmentCheckoutStatus } from '@/types';
import Badge, { BadgeProps } from '@/components/ui/Badge';
import { formatRelative } from '@/lib/date-utils';

// Map equipment status to badge variant
const getStatusVariant = (status: EquipmentCheckoutStatus): BadgeProps['variant'] => {
  switch (status) {
    case 'available':
      return 'success';
    case 'checked_out':
      return 'warning';
    case 'maintenance':
      return 'danger';
    case 'retired':
      return 'default';
    default:
      return 'default';
  }
};

export interface EquipmentCardProps {
  equipment: EquipmentItem;
  onClick?: () => void;
  compact?: boolean;
}

export default function EquipmentCard({
  equipment,
  onClick,
  compact = false,
}: EquipmentCardProps) {
  const statusInfo = EQUIPMENT_STATUSES.find((s) => s.value === equipment.status);
  const categoryInfo = MATERIAL_CATEGORIES.find((c) => c.value === equipment.category);

  const isOverdue =
    equipment.status === 'checked_out' &&
    equipment.expectedReturnDate &&
    new Date(equipment.expectedReturnDate) < new Date();

  const needsMaintenance =
    equipment.nextMaintenanceDate && new Date(equipment.nextMaintenanceDate) < new Date();

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={`flex items-center justify-between p-3 bg-white rounded-lg border hover:border-brand-primary hover:shadow-sm cursor-pointer transition-all ${
          isOverdue ? 'border-red-200 bg-red-50' : 'border-gray-200'
        }`}
      >
        <div className="flex items-center gap-3">
          {equipment.imageUrl ? (
            <img
              src={equipment.imageUrl}
              alt={equipment.name}
              className="w-10 h-10 rounded object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
              <WrenchScrewdriverIcon className="w-5 h-5 text-gray-400" />
            </div>
          )}
          <div>
            <p className="font-medium text-gray-900">{equipment.name}</p>
            <p className="text-sm text-gray-500">
              {equipment.serialNumber && <span className="mr-2">SN: {equipment.serialNumber}</span>}
              {categoryInfo?.label}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {equipment.checkedOutToName && (
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <UserIcon className="w-4 h-4" />
              {equipment.checkedOutToName}
            </span>
          )}
          <Badge variant={getStatusVariant(equipment.status)} size="sm">
            {statusInfo?.label || equipment.status}
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`p-4 bg-white rounded-lg border hover:border-brand-primary hover:shadow-md cursor-pointer transition-all ${
        isOverdue ? 'border-red-200' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start gap-4">
        {equipment.imageUrl ? (
          <img
            src={equipment.imageUrl}
            alt={equipment.name}
            className="w-16 h-16 rounded-lg object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
            <WrenchScrewdriverIcon className="w-8 h-8 text-gray-400" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 truncate">{equipment.name}</h3>
              {equipment.make && equipment.model && (
                <p className="text-sm text-gray-500">
                  {equipment.make} {equipment.model} {equipment.year && `(${equipment.year})`}
                </p>
              )}
            </div>
            <Badge variant={getStatusVariant(equipment.status)} size="sm">
              {statusInfo?.label || equipment.status}
            </Badge>
          </div>

          <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
            {equipment.serialNumber && (
              <span>SN: {equipment.serialNumber}</span>
            )}
            {equipment.assetTag && (
              <span>Tag: {equipment.assetTag}</span>
            )}
            <span className="flex items-center gap-1">
              <WrenchScrewdriverIcon className="w-4 h-4" />
              {categoryInfo?.label}
            </span>
          </div>

          {equipment.status === 'checked_out' && (
            <div className="mt-3 p-2 bg-amber-50 rounded-md">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-amber-800">
                  <UserIcon className="w-4 h-4" />
                  Checked out to: <strong>{equipment.checkedOutToName}</strong>
                </span>
                {equipment.checkedOutAt && (
                  <span className="text-amber-600">
                    {formatRelative(equipment.checkedOutAt)}
                  </span>
                )}
              </div>
              {equipment.currentProjectName && (
                <p className="text-sm text-amber-700 mt-1">
                  <MapPinIcon className="w-4 h-4 inline mr-1" />
                  {equipment.currentProjectName}
                </p>
              )}
              {equipment.expectedReturnDate && (
                <p className={`text-sm mt-1 ${isOverdue ? 'text-red-600 font-medium' : 'text-amber-600'}`}>
                  <CalendarIcon className="w-4 h-4 inline mr-1" />
                  Expected return: {new Date(equipment.expectedReturnDate).toLocaleDateString()}
                  {isOverdue && ' (OVERDUE)'}
                </p>
              )}
            </div>
          )}

          <div className="mt-3 flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              {equipment.currentValue && (
                <span className="text-gray-500">
                  Value: <span className="font-medium text-gray-900">${equipment.currentValue.toLocaleString()}</span>
                </span>
              )}
              <span className="text-gray-500">
                Condition:{' '}
                <span
                  className={`font-medium ${
                    equipment.condition === 'excellent'
                      ? 'text-green-600'
                      : equipment.condition === 'good'
                      ? 'text-blue-600'
                      : equipment.condition === 'fair'
                      ? 'text-amber-600'
                      : 'text-red-600'
                  }`}
                >
                  {equipment.condition.charAt(0).toUpperCase() + equipment.condition.slice(1)}
                </span>
              </span>
            </div>

            {needsMaintenance && (
              <div className="flex items-center gap-1 text-red-600">
                <ExclamationCircleIcon className="w-4 h-4" />
                <span className="font-medium">Maintenance Due</span>
              </div>
            )}

            {equipment.isRental && (
              <Badge variant="info" size="sm">
                Rental
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
