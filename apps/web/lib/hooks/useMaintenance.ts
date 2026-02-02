'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

export interface MaintenanceRecord {
  id: string;
  equipmentId: string;
  equipmentName: string;
  type: 'preventive' | 'repair' | 'inspection' | 'calibration';
  description: string;
  performedBy: string;
  performedByName: string;
  performedAt: Date;
  cost?: number;
  parts?: string[];
  notes?: string;
  nextMaintenanceDate?: Date;
  createdAt: Date;
  createdBy: string;
}

interface UseMaintenanceOptions {
  equipmentId?: string;
  orgId: string;
}

export function useMaintenance({ equipmentId, orgId }: UseMaintenanceOptions) {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (equipmentId) params.set('equipmentId', equipmentId);

      const res = await fetch(`/api/equipment/maintenance?${params}`);
      if (!res.ok) throw new Error('Failed to fetch maintenance records');

      const data = await res.json();
      setRecords(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [orgId, equipmentId]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const addMaintenanceRecord = async (data: Omit<MaintenanceRecord, 'id' | 'createdAt' | 'createdBy'>) => {
    const res = await fetch('/api/equipment/maintenance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add maintenance record');
    const newRecord = await res.json();
    setRecords(prev => [newRecord, ...prev]);
    return newRecord;
  };

  const updateMaintenanceRecord = async (recordId: string, data: Partial<MaintenanceRecord>) => {
    const res = await fetch(`/api/equipment/maintenance/${recordId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update maintenance record');
    await fetchRecords();
  };

  const upcomingMaintenance = useMemo(() => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return records
      .filter(r => r.nextMaintenanceDate && new Date(r.nextMaintenanceDate) <= thirtyDaysFromNow)
      .sort((a, b) =>
        new Date(a.nextMaintenanceDate!).getTime() - new Date(b.nextMaintenanceDate!).getTime()
      );
  }, [records]);

  const overdueMaintenance = useMemo(() => {
    const now = new Date();
    return records.filter(r => r.nextMaintenanceDate && new Date(r.nextMaintenanceDate) < now);
  }, [records]);

  const stats = {
    total: records.length,
    preventive: records.filter(r => r.type === 'preventive').length,
    repair: records.filter(r => r.type === 'repair').length,
    inspection: records.filter(r => r.type === 'inspection').length,
    calibration: records.filter(r => r.type === 'calibration').length,
    upcoming: upcomingMaintenance.length,
    overdue: overdueMaintenance.length,
  };

  return {
    records,
    loading,
    error,
    stats,
    upcomingMaintenance,
    overdueMaintenance,
    addMaintenanceRecord,
    updateMaintenanceRecord,
    refresh: fetchRecords,
  };
}
