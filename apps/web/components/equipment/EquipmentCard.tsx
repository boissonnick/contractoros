'use client';

import Image from 'next/image';
import { Equipment, EquipmentStatus, EquipmentCategory } from '@/types';
import {
  WrenchScrewdriverIcon,
  MapPinIcon,
  UserIcon,
  CalendarIcon,
  ArrowRightStartOnRectangleIcon,
  ArrowLeftEndOnRectangleIcon,
} from '@heroicons/react/24/outline';

const STATUS_COLORS: Record<EquipmentStatus, string> = {
  available: 'bg-green-100 text-green-800',
  checked_out: 'bg-blue-100 text-blue-800',
  maintenance: 'bg-yellow-100 text-yellow-800',
  retired: 'bg-gray-100 text-gray-800',
};

const STATUS_LABELS: Record<EquipmentStatus, string> = {
  available: 'Available',
  checked_out: 'Checked Out',
  maintenance: 'In Maintenance',
  retired: 'Retired',
};

const CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  power_tool: 'Power Tool',
  hand_tool: 'Hand Tool',
  heavy_equipment: 'Heavy Equipment',
  safety: 'Safety Equipment',
  measuring: 'Measuring',
  vehicle: 'Vehicle',
  other: 'Other',
};

interface EquipmentCardProps {
  equipment: Equipment;
  onCheckOut?: (equipment: Equipment) => void;
  onReturn?: (equipment: Equipment) => void;
  onView?: (equipment: Equipment) => void;
}

export function EquipmentCard({ equipment, onCheckOut, onReturn, onView }: EquipmentCardProps) {
  const lastMaintenance = equipment.lastMaintenanceDate
    ? new Date(equipment.lastMaintenanceDate).toLocaleDateString()
    : 'Never';

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onView?.(equipment)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <WrenchScrewdriverIcon className="h-5 w-5 text-gray-400" />
          <span className="text-xs text-gray-500">{CATEGORY_LABELS[equipment.category]}</span>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[equipment.status]}`}>
          {STATUS_LABELS[equipment.status]}
        </span>
      </div>

      {/* Photo or placeholder */}
      {equipment.photoUrl ? (
        <div className="relative w-full h-32 mb-3 rounded-md overflow-hidden bg-gray-100">
          <Image
            src={equipment.photoUrl}
            alt={equipment.name}
            fill
            className="object-cover"
          />
        </div>
      ) : (
        <div className="w-full h-32 mb-3 rounded-md bg-gray-100 flex items-center justify-center">
          <WrenchScrewdriverIcon className="h-12 w-12 text-gray-300" />
        </div>
      )}

      {/* Name */}
      <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-1">
        {equipment.name}
      </h3>
      {equipment.serialNumber && (
        <p className="text-xs text-gray-500 mb-3">SN: {equipment.serialNumber}</p>
      )}

      {/* Meta Info */}
      <div className="space-y-2 mb-4">
        {equipment.currentLocation && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPinIcon className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{equipment.currentLocation}</span>
          </div>
        )}

        {equipment.checkedOutToName && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <UserIcon className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{equipment.checkedOutToName}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <CalendarIcon className="h-4 w-4 flex-shrink-0" />
          <span>Last maintenance: {lastMaintenance}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
        {equipment.status === 'available' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCheckOut?.(equipment);
            }}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
          >
            <ArrowRightStartOnRectangleIcon className="h-4 w-4" />
            Check Out
          </button>
        )}

        {equipment.status === 'checked_out' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onReturn?.(equipment);
            }}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-green-700 hover:bg-green-50 rounded-md transition-colors"
          >
            <ArrowLeftEndOnRectangleIcon className="h-4 w-4" />
            Return
          </button>
        )}
      </div>
    </div>
  );
}

export default EquipmentCard;
