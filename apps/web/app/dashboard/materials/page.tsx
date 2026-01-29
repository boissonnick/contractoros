'use client';

import React, { useState, useMemo } from 'react';
import {
  CubeIcon,
  WrenchScrewdriverIcon,
  BuildingStorefrontIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import {
  useMaterials,
  useEquipment,
  useSuppliers,
  usePurchaseOrders,
  useLowStockAlerts,
} from '@/lib/hooks/useMaterials';
import {
  MaterialItemCard,
  MaterialFormModal,
  EquipmentCard,
  EquipmentFormModal,
  EquipmentCheckoutModal,
  PurchaseOrderCard,
  PurchaseOrderFormModal,
  SupplierFormModal,
  LowStockAlertCard,
} from '@/components/materials';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge, { BadgeProps } from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/Toast';
import {
  MaterialItem,
  MaterialCategory,
  MaterialStatus,
  EquipmentItem,
  EquipmentCheckoutStatus,
  Supplier,
  MaterialPurchaseOrder,
  MaterialPurchaseOrderStatus,
  MATERIAL_CATEGORIES,
  MATERIAL_STATUSES,
  EQUIPMENT_STATUSES,
  MATERIAL_PURCHASE_ORDER_STATUSES,
} from '@/types';

type TabType = 'inventory' | 'equipment' | 'orders' | 'suppliers' | 'alerts';

export default function MaterialsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('inventory');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<MaterialCategory | ''>('');
  const [statusFilter, setStatusFilter] = useState<MaterialStatus | EquipmentCheckoutStatus | ''>('');

  // Material state
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialItem | undefined>();

  // Equipment state
  const [showEquipmentForm, setShowEquipmentForm] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<EquipmentItem | undefined>();
  const [checkoutEquipment, setCheckoutEquipment] = useState<EquipmentItem | undefined>();
  const [checkoutMode, setCheckoutMode] = useState<'checkout' | 'return'>('checkout');

  // Supplier state
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | undefined>();

  // Purchase order state
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<MaterialPurchaseOrder | undefined>();

  // Hooks
  const {
    materials,
    loading: materialsLoading,
    stats: materialStats,
    createMaterial,
    updateMaterial,
    deleteMaterial,
  } = useMaterials({
    searchTerm: activeTab === 'inventory' ? searchTerm : undefined,
    category: activeTab === 'inventory' && categoryFilter ? categoryFilter : undefined,
    status: activeTab === 'inventory' && statusFilter ? (statusFilter as MaterialStatus) : undefined,
  });

  const {
    equipment,
    loading: equipmentLoading,
    stats: equipmentStats,
    createEquipment,
    updateEquipment,
    checkoutEquipment: doCheckout,
    returnEquipment,
  } = useEquipment({
    searchTerm: activeTab === 'equipment' ? searchTerm : undefined,
    status: activeTab === 'equipment' && statusFilter ? (statusFilter as EquipmentCheckoutStatus) : undefined,
  });

  const {
    suppliers,
    loading: suppliersLoading,
    createSupplier,
    updateSupplier,
    deleteSupplier,
  } = useSuppliers();

  const {
    orders,
    loading: ordersLoading,
    stats: orderStats,
    createPurchaseOrder,
    updatePurchaseOrder,
    approvePurchaseOrder,
    receiveItems,
  } = usePurchaseOrders();

  const {
    alerts,
    loading: alertsLoading,
    acknowledgeAlert,
    resolveAlert,
  } = useLowStockAlerts();

  // Filtered data based on search
  const filteredSuppliers = useMemo(() => {
    if (!searchTerm) return suppliers;
    const search = searchTerm.toLowerCase();
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(search) ||
        s.contactName?.toLowerCase().includes(search) ||
        s.email?.toLowerCase().includes(search)
    );
  }, [suppliers, searchTerm]);

  const filteredOrders = useMemo(() => {
    if (!searchTerm) return orders;
    const search = searchTerm.toLowerCase();
    return orders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(search) ||
        o.supplierName.toLowerCase().includes(search) ||
        o.projectName?.toLowerCase().includes(search)
    );
  }, [orders, searchTerm]);

  // Handlers
  const handleCreateMaterial = async (data: Omit<MaterialItem, 'id' | 'orgId' | 'createdAt' | 'createdBy' | 'quantityAvailable'>) => {
    try {
      await createMaterial(data);
      toast.success('Material added successfully');
    } catch (error) {
      toast.error('Failed to add material');
      throw error;
    }
  };

  const handleUpdateMaterial = async (data: Omit<MaterialItem, 'id' | 'orgId' | 'createdAt' | 'createdBy' | 'quantityAvailable'>) => {
    if (!editingMaterial) return;
    try {
      await updateMaterial(editingMaterial.id, data);
      toast.success('Material updated successfully');
      setEditingMaterial(undefined);
    } catch (error) {
      toast.error('Failed to update material');
      throw error;
    }
  };

  const handleCreateEquipment = async (data: Omit<EquipmentItem, 'id' | 'orgId' | 'createdAt' | 'createdBy'>) => {
    try {
      await createEquipment(data);
      toast.success('Equipment added successfully');
    } catch (error) {
      toast.error('Failed to add equipment');
      throw error;
    }
  };

  const handleUpdateEquipment = async (data: Omit<EquipmentItem, 'id' | 'orgId' | 'createdAt' | 'createdBy'>) => {
    if (!editingEquipment) return;
    try {
      await updateEquipment(editingEquipment.id, data);
      toast.success('Equipment updated successfully');
      setEditingEquipment(undefined);
    } catch (error) {
      toast.error('Failed to update equipment');
      throw error;
    }
  };

  const handleCheckout = async (projectId?: string, projectName?: string, notes?: string) => {
    if (!checkoutEquipment) return;
    try {
      await doCheckout(checkoutEquipment.id, projectId, projectName, notes);
      toast.success('Equipment checked out successfully');
      setCheckoutEquipment(undefined);
    } catch (error) {
      toast.error('Failed to check out equipment');
      throw error;
    }
  };

  const handleReturn = async (condition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged', notes?: string) => {
    if (!checkoutEquipment) return;
    try {
      await returnEquipment(checkoutEquipment.id, condition, notes);
      toast.success('Equipment returned successfully');
      setCheckoutEquipment(undefined);
    } catch (error) {
      toast.error('Failed to return equipment');
      throw error;
    }
  };

  const handleCreateSupplier = async (data: Omit<Supplier, 'id' | 'orgId' | 'createdAt' | 'createdBy'>) => {
    try {
      await createSupplier(data);
      toast.success('Supplier added successfully');
    } catch (error) {
      toast.error('Failed to add supplier');
      throw error;
    }
  };

  const handleUpdateSupplier = async (data: Omit<Supplier, 'id' | 'orgId' | 'createdAt' | 'createdBy'>) => {
    if (!editingSupplier) return;
    try {
      await updateSupplier(editingSupplier.id, data);
      toast.success('Supplier updated successfully');
      setEditingSupplier(undefined);
    } catch (error) {
      toast.error('Failed to update supplier');
      throw error;
    }
  };

  const handleCreateOrder = async (data: Omit<MaterialPurchaseOrder, 'id' | 'orgId' | 'orderNumber' | 'createdAt' | 'createdBy'>) => {
    try {
      await createPurchaseOrder(data);
      toast.success('Purchase order created successfully');
    } catch (error) {
      toast.error('Failed to create purchase order');
      throw error;
    }
  };

  const handleUpdateOrder = async (data: Omit<MaterialPurchaseOrder, 'id' | 'orgId' | 'orderNumber' | 'createdAt' | 'createdBy'>) => {
    if (!editingOrder) return;
    try {
      await updatePurchaseOrder(editingOrder.id, data);
      toast.success('Purchase order updated successfully');
      setEditingOrder(undefined);
    } catch (error) {
      toast.error('Failed to update purchase order');
      throw error;
    }
  };

  const tabs = [
    { id: 'inventory' as TabType, label: 'Inventory', icon: CubeIcon, count: materialStats.totalItems },
    { id: 'equipment' as TabType, label: 'Equipment', icon: WrenchScrewdriverIcon, count: equipmentStats.totalEquipment },
    { id: 'orders' as TabType, label: 'Purchase Orders', icon: DocumentTextIcon, count: orderStats.openOrders },
    { id: 'suppliers' as TabType, label: 'Suppliers', icon: BuildingStorefrontIcon, count: suppliers.length },
    { id: 'alerts' as TabType, label: 'Alerts', icon: ExclamationTriangleIcon, count: alerts.length },
  ];

  const loading = materialsLoading || equipmentLoading || suppliersLoading || ordersLoading || alertsLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Materials & Equipment</h1>
          <p className="text-gray-500">Manage inventory, equipment, and purchase orders</p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === 'inventory' && (
            <Button onClick={() => setShowMaterialForm(true)}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Material
            </Button>
          )}
          {activeTab === 'equipment' && (
            <Button onClick={() => setShowEquipmentForm(true)}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Equipment
            </Button>
          )}
          {activeTab === 'orders' && (
            <Button onClick={() => setShowOrderForm(true)}>
              <PlusIcon className="w-4 h-4 mr-2" />
              New Order
            </Button>
          )}
          {activeTab === 'suppliers' && (
            <Button onClick={() => setShowSupplierForm(true)}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Supplier
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CubeIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Materials</p>
              <p className="text-2xl font-bold">{materialStats.totalItems}</p>
            </div>
          </div>
          {materialStats.lowStockItems > 0 && (
            <p className="mt-2 text-sm text-amber-600">
              {materialStats.lowStockItems} low stock
            </p>
          )}
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <WrenchScrewdriverIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Equipment</p>
              <p className="text-2xl font-bold">{equipmentStats.totalEquipment}</p>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            {equipmentStats.available} available, {equipmentStats.checkedOut} in use
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DocumentTextIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Open Orders</p>
              <p className="text-2xl font-bold">{orderStats.openOrders}</p>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            ${orderStats.totalValue.toLocaleString()} total value
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${alerts.length > 0 ? 'bg-amber-100' : 'bg-gray-100'}`}>
              <ExclamationTriangleIcon
                className={`w-6 h-6 ${alerts.length > 0 ? 'text-amber-600' : 'text-gray-400'}`}
              />
            </div>
            <div>
              <p className="text-sm text-gray-500">Alerts</p>
              <p className="text-2xl font-bold">{alerts.length}</p>
            </div>
          </div>
          {alerts.length > 0 && (
            <p className="mt-2 text-sm text-amber-600">
              {materialStats.outOfStockItems} out of stock
            </p>
          )}
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchTerm('');
                setCategoryFilter('');
                setStatusFilter('');
              }}
              className={`flex items-center gap-2 pb-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
              {tab.count > 0 && (
                <Badge
                  variant={
                    tab.id === 'alerts' && tab.count > 0
                      ? 'warning'
                      : activeTab === tab.id
                      ? 'primary'
                      : 'default'
                  }
                  size="sm"
                >
                  {tab.count}
                </Badge>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
          />
        </div>

        {(activeTab === 'inventory' || activeTab === 'equipment') && (
          <>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as MaterialCategory | '')}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            >
              <option value="">All Categories</option>
              {MATERIAL_CATEGORIES.filter((c) =>
                activeTab === 'equipment'
                  ? ['tools', 'equipment', 'rental', 'safety', 'other'].includes(c.value)
                  : true
              ).map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as MaterialStatus | EquipmentCheckoutStatus | '')}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            >
              <option value="">All Statuses</option>
              {(activeTab === 'inventory' ? MATERIAL_STATUSES : EQUIPMENT_STATUSES).map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      {/* Content */}
      <div>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        ) : (
          <>
            {/* Inventory Tab */}
            {activeTab === 'inventory' && (
              <div className="space-y-4">
                {materials.length === 0 ? (
                  <EmptyState
                    icon={<CubeIcon className="h-full w-full" />}
                    title="No materials found"
                    description={
                      searchTerm || categoryFilter || statusFilter
                        ? 'Try adjusting your filters'
                        : 'Add your first material to get started'
                    }
                    action={
                      !searchTerm && !categoryFilter && !statusFilter
                        ? {
                            label: 'Add Material',
                            onClick: () => setShowMaterialForm(true),
                          }
                        : undefined
                    }
                  />
                ) : (
                  materials.map((material) => (
                    <MaterialItemCard
                      key={material.id}
                      material={material}
                      onClick={() => {
                        setEditingMaterial(material);
                        setShowMaterialForm(true);
                      }}
                    />
                  ))
                )}
              </div>
            )}

            {/* Equipment Tab */}
            {activeTab === 'equipment' && (
              <div className="space-y-4">
                {equipment.length === 0 ? (
                  <EmptyState
                    icon={<WrenchScrewdriverIcon className="h-full w-full" />}
                    title="No equipment found"
                    description={
                      searchTerm || statusFilter
                        ? 'Try adjusting your filters'
                        : 'Add your first piece of equipment to get started'
                    }
                    action={
                      !searchTerm && !statusFilter
                        ? {
                            label: 'Add Equipment',
                            onClick: () => setShowEquipmentForm(true),
                          }
                        : undefined
                    }
                  />
                ) : (
                  equipment.map((item) => (
                    <EquipmentCard
                      key={item.id}
                      equipment={item}
                      onClick={() => {
                        if (item.status === 'available') {
                          setCheckoutMode('checkout');
                          setCheckoutEquipment(item);
                        } else if (item.status === 'checked_out') {
                          setCheckoutMode('return');
                          setCheckoutEquipment(item);
                        } else {
                          setEditingEquipment(item);
                          setShowEquipmentForm(true);
                        }
                      }}
                    />
                  ))
                )}
              </div>
            )}

            {/* Purchase Orders Tab */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                {filteredOrders.length === 0 ? (
                  <EmptyState
                    icon={<DocumentTextIcon className="h-full w-full" />}
                    title="No purchase orders found"
                    description={
                      searchTerm
                        ? 'Try adjusting your search'
                        : 'Create your first purchase order to get started'
                    }
                    action={
                      !searchTerm
                        ? {
                            label: 'New Order',
                            onClick: () => setShowOrderForm(true),
                          }
                        : undefined
                    }
                  />
                ) : (
                  filteredOrders.map((order) => (
                    <PurchaseOrderCard
                      key={order.id}
                      order={order}
                      onClick={() => {
                        setEditingOrder(order);
                        setShowOrderForm(true);
                      }}
                    />
                  ))
                )}
              </div>
            )}

            {/* Suppliers Tab */}
            {activeTab === 'suppliers' && (
              <div className="grid grid-cols-2 gap-4">
                {filteredSuppliers.length === 0 ? (
                  <div className="col-span-2">
                    <EmptyState
                      icon={<BuildingStorefrontIcon className="h-full w-full" />}
                      title="No suppliers found"
                      description={
                        searchTerm
                          ? 'Try adjusting your search'
                          : 'Add your first supplier to get started'
                      }
                      action={
                        !searchTerm
                          ? {
                              label: 'Add Supplier',
                              onClick: () => setShowSupplierForm(true),
                            }
                          : undefined
                      }
                    />
                  </div>
                ) : (
                  filteredSuppliers.map((supplier) => (
                    <Card
                      key={supplier.id}
                      className="p-4 hover:border-brand-primary cursor-pointer transition-colors"
                      onClick={() => {
                        setEditingSupplier(supplier);
                        setShowSupplierForm(true);
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{supplier.name}</h3>
                          {supplier.contactName && (
                            <p className="text-sm text-gray-500">{supplier.contactName}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {supplier.isPreferred && (
                            <Badge variant="success" size="sm">
                              Preferred
                            </Badge>
                          )}
                          {supplier.rating && (
                            <span className="text-sm text-gray-500">
                              {'★'.repeat(supplier.rating)}{'☆'.repeat(5 - supplier.rating)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 text-sm text-gray-500">
                        {supplier.email && <p>{supplier.email}</p>}
                        {supplier.phone && <p>{supplier.phone}</p>}
                      </div>
                      {supplier.categories && supplier.categories.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {supplier.categories.slice(0, 3).map((cat) => (
                            <span
                              key={cat}
                              className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                            >
                              {MATERIAL_CATEGORIES.find((c) => c.value === cat)?.label || cat}
                            </span>
                          ))}
                          {supplier.categories.length > 3 && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                              +{supplier.categories.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* Alerts Tab */}
            {activeTab === 'alerts' && (
              <div className="space-y-4">
                {alerts.length === 0 ? (
                  <EmptyState
                    icon={<ExclamationTriangleIcon className="h-full w-full" />}
                    title="No alerts"
                    description="All inventory levels are healthy"
                  />
                ) : (
                  alerts.map((alert) => (
                    <LowStockAlertCard
                      key={alert.id}
                      alert={alert}
                      onAcknowledge={() => {
                        acknowledgeAlert(alert.id);
                        toast.success('Alert acknowledged');
                      }}
                      onCreateOrder={() => {
                        // Pre-fill order with this material
                        setShowOrderForm(true);
                      }}
                    />
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <MaterialFormModal
        open={showMaterialForm}
        onClose={() => {
          setShowMaterialForm(false);
          setEditingMaterial(undefined);
        }}
        onSubmit={editingMaterial ? handleUpdateMaterial : handleCreateMaterial}
        material={editingMaterial}
        suppliers={suppliers}
      />

      <EquipmentFormModal
        open={showEquipmentForm}
        onClose={() => {
          setShowEquipmentForm(false);
          setEditingEquipment(undefined);
        }}
        onSubmit={editingEquipment ? handleUpdateEquipment : handleCreateEquipment}
        equipment={editingEquipment}
        suppliers={suppliers}
      />

      {checkoutEquipment && (
        <EquipmentCheckoutModal
          open={!!checkoutEquipment}
          onClose={() => setCheckoutEquipment(undefined)}
          equipment={checkoutEquipment}
          mode={checkoutMode}
          projects={[]} // TODO: Load projects
          onCheckout={handleCheckout}
          onReturn={handleReturn}
        />
      )}

      <SupplierFormModal
        open={showSupplierForm}
        onClose={() => {
          setShowSupplierForm(false);
          setEditingSupplier(undefined);
        }}
        onSubmit={editingSupplier ? handleUpdateSupplier : handleCreateSupplier}
        supplier={editingSupplier}
      />

      <PurchaseOrderFormModal
        open={showOrderForm}
        onClose={() => {
          setShowOrderForm(false);
          setEditingOrder(undefined);
        }}
        onSubmit={editingOrder ? handleUpdateOrder : handleCreateOrder}
        order={editingOrder}
        suppliers={suppliers}
        materials={materials}
        projects={[]} // TODO: Load projects
      />
    </div>
  );
}
