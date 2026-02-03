/**
 * Materials Management Hooks
 *
 * This module provides specialized hooks for managing materials, equipment,
 * suppliers, purchase orders, allocations, storage locations, alerts, and transactions.
 *
 * Split from the original useMaterials.ts (1344 lines) into focused, single-responsibility hooks.
 */

// Shared utilities
export { convertTimestamp } from './utils';

// Core materials management
export { useMaterialsCore } from './useMaterialsCore';
export type { UseMaterialsOptions } from './useMaterialsCore';

// Equipment checkout/return
export { useEquipment } from './useEquipment';
export type { UseEquipmentOptions } from './useEquipment';

// Supplier management
export { useSuppliers } from './useSuppliers';

// Purchase order management
export { usePurchaseOrders } from './usePurchaseOrders';
export type { UsePurchaseOrdersOptions } from './usePurchaseOrders';

// Material allocations for projects
export { useMaterialAllocations } from './useMaterialAllocations';

// Storage location management
export { useStorageLocations } from './useStorageLocations';

// Low stock alerts
export { useLowStockAlerts } from './useLowStockAlerts';

// Material transaction history
export { useMaterialTransactions } from './useMaterialTransactions';
