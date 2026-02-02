import type { EquipmentItem, EquipmentCheckoutStatus, MaterialCategory } from '@/types';

export const EQUIPMENT_STATUS_LABELS: Record<EquipmentCheckoutStatus, string> = {
  available: 'Available',
  checked_out: 'Checked Out',
  maintenance: 'In Maintenance',
  retired: 'Retired',
};

export const EQUIPMENT_STATUS_COLORS: Record<EquipmentCheckoutStatus, string> = {
  available: 'bg-green-100 text-green-800',
  checked_out: 'bg-blue-100 text-blue-800',
  maintenance: 'bg-yellow-100 text-yellow-800',
  retired: 'bg-gray-100 text-gray-800',
};

export const EQUIPMENT_CONDITION_LABELS: Record<EquipmentItem['condition'], string> = {
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
};

export const EQUIPMENT_CONDITION_COLORS: Record<EquipmentItem['condition'], string> = {
  excellent: 'bg-green-100 text-green-800',
  good: 'bg-blue-100 text-blue-800',
  fair: 'bg-yellow-100 text-yellow-800',
  poor: 'bg-red-100 text-red-800',
};

export const EQUIPMENT_CATEGORY_LABELS: Partial<Record<MaterialCategory, string>> = {
  electrical: 'Electrical Tools',
  plumbing: 'Plumbing Tools',
  hardware: 'Hardware',
  safety: 'Safety Equipment',
  hvac: 'HVAC Equipment',
};

export const EQUIPMENT_CATEGORY_ICONS: Partial<Record<MaterialCategory, string>> = {
  electrical: 'BoltIcon',
  plumbing: 'WrenchIcon',
  hardware: 'WrenchScrewdriverIcon',
  safety: 'ShieldCheckIcon',
  hvac: 'FireIcon',
};

export function calculateDepreciation(equipment: EquipmentItem): number {
  if (!equipment.purchasePrice || !equipment.purchaseDate) return 0;

  const depreciationRate = equipment.depreciationRate || 0.2; // Default 20% per year
  const purchaseDate = new Date(equipment.purchaseDate);
  const now = new Date();
  const yearsOwned = (now.getTime() - purchaseDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);

  // Straight-line depreciation
  const totalDepreciation = equipment.purchasePrice * depreciationRate * yearsOwned;
  const currentValue = Math.max(0, equipment.purchasePrice - totalDepreciation);

  return Math.round(currentValue * 100) / 100;
}

export function isMaintenanceDue(equipment: EquipmentItem): boolean {
  if (!equipment.nextMaintenanceDate) return false;
  return new Date(equipment.nextMaintenanceDate) <= new Date();
}

export function isMaintenanceUpcoming(equipment: EquipmentItem, daysAhead: number = 30): boolean {
  if (!equipment.nextMaintenanceDate) return false;
  const now = new Date();
  const maintenanceDate = new Date(equipment.nextMaintenanceDate);
  const threshold = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  return maintenanceDate > now && maintenanceDate <= threshold;
}

export function sortEquipment(
  equipment: EquipmentItem[],
  sortBy: 'name' | 'status' | 'condition' | 'date' = 'name'
): EquipmentItem[] {
  const statusOrder: Record<EquipmentCheckoutStatus, number> = {
    available: 0,
    checked_out: 1,
    maintenance: 2,
    retired: 3,
  };

  const conditionOrder: Record<EquipmentItem['condition'], number> = {
    excellent: 0,
    good: 1,
    fair: 2,
    poor: 3,
  };

  return [...equipment].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'status') {
      return statusOrder[a.status] - statusOrder[b.status];
    }
    if (sortBy === 'condition') {
      return conditionOrder[a.condition] - conditionOrder[b.condition];
    }
    if (sortBy === 'date') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return 0;
  });
}

export function filterEquipment(
  equipment: EquipmentItem[],
  filters: {
    status?: EquipmentCheckoutStatus;
    condition?: EquipmentItem['condition'];
    category?: MaterialCategory;
    search?: string;
    isRental?: boolean;
  }
): EquipmentItem[] {
  return equipment.filter(item => {
    if (filters.status && item.status !== filters.status) return false;
    if (filters.condition && item.condition !== filters.condition) return false;
    if (filters.category && item.category !== filters.category) return false;
    if (filters.isRental !== undefined && item.isRental !== filters.isRental) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        item.name.toLowerCase().includes(searchLower) ||
        item.serialNumber?.toLowerCase().includes(searchLower) ||
        item.assetTag?.toLowerCase().includes(searchLower) ||
        item.make?.toLowerCase().includes(searchLower) ||
        item.model?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });
}

export function getEquipmentDisplayName(equipment: EquipmentItem): string {
  const parts = [equipment.name];
  if (equipment.make) parts.push(equipment.make);
  if (equipment.model) parts.push(equipment.model);
  return parts.join(' - ');
}
