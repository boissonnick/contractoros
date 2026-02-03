// ============================================
// Equipment & Tool Types
// Extracted from types/index.ts
// ============================================

// ============================================
// Equipment Types (Sprint 35)
// ============================================

export type EquipmentStatus = 'available' | 'checked_out' | 'maintenance' | 'retired';
export type EquipmentCategory = 'power_tool' | 'hand_tool' | 'heavy_equipment' | 'safety' | 'measuring' | 'vehicle' | 'other';

export interface Equipment {
  id: string;
  orgId: string;
  name: string;
  category: EquipmentCategory;
  status: EquipmentStatus;
  serialNumber?: string;
  description?: string;
  photoUrl?: string;
  purchaseDate?: Date;
  purchasePrice?: number;
  currentValue?: number;
  currentLocation?: string;
  currentProjectId?: string;
  checkedOutTo?: string;
  checkedOutToName?: string;
  checkedOutAt?: Date;
  expectedReturnDate?: Date;
  maintenanceSchedule?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface EquipmentCheckout {
  id: string;
  equipmentId: string;
  equipmentName: string;
  userId: string;
  userName: string;
  projectId?: string;
  projectName?: string;
  checkedOutAt: Date;
  expectedReturnDate?: Date;
  returnedAt?: Date;
  notes?: string;
}

export interface MaintenanceRecord {
  id: string;
  equipmentId: string;
  type: 'routine' | 'repair' | 'inspection';
  description: string;
  cost?: number;
  performedBy: string;
  performedAt: Date;
  nextScheduledDate?: Date;
}

// ============================================
// Tools & Equipment Types (Sprint 16)
// ============================================

export type ToolStatus = 'available' | 'checked_out' | 'maintenance' | 'retired';

export interface Tool {
  id: string;
  orgId: string;
  name: string;
  serialNumber?: string;
  barcode?: string;
  category: string;
  purchaseDate?: Date;
  purchaseCost?: number;
  currentValue?: number;
  status: ToolStatus;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  assignedTo?: string;
  assignedToName?: string;
  assignedProjectId?: string;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  notes?: string;
  imageURL?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ToolCheckout {
  id: string;
  toolId: string;
  orgId: string;
  userId: string;
  userName: string;
  projectId?: string;
  projectName?: string;
  checkedOutAt: Date;
  expectedReturnDate?: Date;
  returnedAt?: Date;
  conditionOnReturn?: string;
  notes?: string;
}

// ============================================
// Material & Equipment Tracking Types
// ============================================

export type MaterialStatus = 'ordered' | 'in_transit' | 'delivered' | 'installed' | 'returned' | 'damaged';
export type DeliveryStatus = 'scheduled' | 'in_transit' | 'delivered' | 'partial' | 'failed';

export interface MaterialItem {
  id: string;
  orgId: string;
  projectId: string;
  name: string;
  description?: string;
  category?: string;
  sku?: string;
  quantity: number;
  unit: string;
  unitCost?: number;
  totalCost?: number;
  status: MaterialStatus;
  vendorId?: string;
  vendorName?: string;
  purchaseOrderId?: string;
  deliveryId?: string;
  location?: string;
  installedAt?: Date;
  installedBy?: string;
  phaseId?: string;
  taskId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface MaterialDelivery {
  id: string;
  orgId: string;
  projectId: string;
  purchaseOrderId?: string;
  vendorId?: string;
  vendorName?: string;
  status: DeliveryStatus;
  scheduledDate: Date;
  actualDate?: Date;
  items: MaterialDeliveryItem[];
  receivedBy?: string;
  receivedByName?: string;
  notes?: string;
  photos?: string[];
  signatureUrl?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface MaterialDeliveryItem {
  id: string;
  materialId?: string;
  name: string;
  orderedQuantity: number;
  receivedQuantity?: number;
  unit: string;
  condition?: 'good' | 'damaged' | 'missing';
  notes?: string;
}

// ============================================
// Equipment Status Labels
// ============================================

export const EQUIPMENT_STATUS_LABELS: Record<EquipmentStatus, { label: string; color: string }> = {
  available: { label: 'Available', color: 'green' },
  checked_out: { label: 'Checked Out', color: 'blue' },
  maintenance: { label: 'In Maintenance', color: 'yellow' },
  retired: { label: 'Retired', color: 'gray' },
};

export const EQUIPMENT_CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  power_tool: 'Power Tool',
  hand_tool: 'Hand Tool',
  heavy_equipment: 'Heavy Equipment',
  safety: 'Safety Equipment',
  measuring: 'Measuring Tool',
  vehicle: 'Vehicle',
  other: 'Other',
};

export const TOOL_STATUS_LABELS: Record<ToolStatus, string> = {
  available: 'Available',
  checked_out: 'Checked Out',
  maintenance: 'In Maintenance',
  retired: 'Retired',
};

export const MATERIAL_STATUS_LABELS: Record<MaterialStatus, string> = {
  ordered: 'Ordered',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  installed: 'Installed',
  returned: 'Returned',
  damaged: 'Damaged',
};

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  scheduled: 'Scheduled',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  partial: 'Partial Delivery',
  failed: 'Failed',
};
