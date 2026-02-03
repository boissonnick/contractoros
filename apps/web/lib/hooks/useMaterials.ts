'use client';

/**
 * Materials Management Hooks - Facade Module
 *
 * This file re-exports all materials-related hooks from the split modules
 * in lib/hooks/materials/ for backward compatibility.
 *
 * The original 1344-line file has been split into focused, single-responsibility hooks:
 * - useMaterialsCore.ts (223 lines) - Core materials CRUD with filtering and stats
 * - useEquipment.ts (238 lines) - Equipment checkout/return management
 * - useSuppliers.ts (100 lines) - Supplier CRUD operations
 * - usePurchaseOrders.ts (273 lines) - Purchase order management
 * - useMaterialAllocations.ts (212 lines) - Project allocations
 * - useStorageLocations.ts (81 lines) - Storage location management
 * - useLowStockAlerts.ts (88 lines) - Low stock alert handling
 * - useMaterialTransactions.ts (67 lines) - Transaction history
 *
 * Import directly from the split modules for better tree-shaking:
 * import { useMaterialsCore } from '@/lib/hooks/materials/useMaterialsCore';
 *
 * Or use this facade for full backward compatibility:
 * import { useMaterials, useEquipment } from '@/lib/hooks/useMaterials';
 */

// Re-export everything from the split modules
export {
  convertTimestamp,
  useMaterialsCore,
  useEquipment,
  useSuppliers,
  usePurchaseOrders,
  useMaterialAllocations,
  useStorageLocations,
  useLowStockAlerts,
  useMaterialTransactions,
} from './materials';

// Re-export types
export type {
  UseMaterialsOptions,
  UseEquipmentOptions,
  UsePurchaseOrdersOptions,
} from './materials';

// Backward compatibility: alias useMaterialsCore as useMaterials
// This maintains the original API for existing code
import { useMaterialsCore, UseMaterialsOptions } from './materials';
export function useMaterials(options: UseMaterialsOptions = {}) {
  return useMaterialsCore(options);
}
