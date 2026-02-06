'use client';

import { useState, useEffect, useCallback } from 'react';
import type { EquipmentItem, EquipmentCheckoutStatus } from '@/types';
import { toast } from '@/components/ui/Toast';

interface UseEquipmentOptions {
  orgId: string;
  projectId?: string;
  status?: EquipmentCheckoutStatus;
}

export function useEquipment({ orgId, projectId, status }: UseEquipmentOptions) {
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEquipment = useCallback(async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (projectId) params.set('projectId', projectId);
      if (status) params.set('status', status);

      const res = await fetch(`/api/equipment?${params}`);
      if (!res.ok) throw new Error('Failed to fetch equipment');

      const data = await res.json();
      setEquipment(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [orgId, projectId, status]);

  useEffect(() => { fetchEquipment(); }, [fetchEquipment]);

  const createEquipment = async (data: Partial<EquipmentItem>) => {
    const res = await fetch('/api/equipment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create equipment');
    const newItem = await res.json();
    setEquipment(prev => [newItem, ...prev]);
    toast.success("Equipment created");
    return newItem;
  };

  const updateEquipment = async (equipmentId: string, data: Partial<EquipmentItem>) => {
    const res = await fetch(`/api/equipment/${equipmentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update equipment');
    await fetchEquipment();
    toast.success('Equipment updated');
  };

  const deleteEquipment = async (equipmentId: string) => {
    const res = await fetch(`/api/equipment/${equipmentId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete equipment');
    setEquipment(prev => prev.filter(e => e.id !== equipmentId));
    toast.success('Equipment deleted');
  };

  const checkOut = async (equipmentId: string, data: {
    userId: string;
    userName: string;
    projectId?: string;
    projectName?: string;
    expectedReturnDate?: string;
    notes?: string;
  }) => {
    const res = await fetch(`/api/equipment/${equipmentId}/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to check out equipment');
    await fetchEquipment();
    toast.success('Equipment checked out');
  };

  const returnEquipment = async (equipmentId: string, data: {
    condition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
    notes?: string;
  }) => {
    const res = await fetch(`/api/equipment/${equipmentId}/return`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to return equipment');
    await fetchEquipment();
    toast.success('Equipment returned');
  };

  const stats = {
    total: equipment.length,
    available: equipment.filter(e => e.status === 'available').length,
    checkedOut: equipment.filter(e => e.status === 'checked_out').length,
    maintenance: equipment.filter(e => e.status === 'maintenance').length,
    retired: equipment.filter(e => e.status === 'retired').length,
  };

  return {
    equipment,
    loading,
    error,
    stats,
    createEquipment,
    updateEquipment,
    deleteEquipment,
    checkOut,
    returnEquipment,
    refresh: fetchEquipment,
  };
}
