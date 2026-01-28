"use client";

import React, { useState, useEffect } from 'react';
import { PayrollConfig } from '@/types';
import { Button, Input } from '@/components/ui';

interface PayrollConfigFormProps {
  config: PayrollConfig | null;
  onSave: (data: Partial<PayrollConfig>) => Promise<void>;
}

export default function PayrollConfigForm({ config, onSave }: PayrollConfigFormProps) {
  const [payPeriod, setPayPeriod] = useState<PayrollConfig['payPeriod']>(config?.payPeriod || 'biweekly');
  const [overtimeThreshold, setOvertimeThreshold] = useState(config?.overtimeThresholdHours || 40);
  const [overtimeMultiplier, setOvertimeMultiplier] = useState(config?.overtimeMultiplier || 1.5);
  const [defaultRate, setDefaultRate] = useState(config?.defaultHourlyRate || 25);
  const [payDay, setPayDay] = useState(config?.payDay || 'Friday');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (config) {
      setPayPeriod(config.payPeriod);
      setOvertimeThreshold(config.overtimeThresholdHours);
      setOvertimeMultiplier(config.overtimeMultiplier);
      setDefaultRate(config.defaultHourlyRate);
      setPayDay(config.payDay);
    }
  }, [config]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        payPeriod,
        overtimeThresholdHours: overtimeThreshold,
        overtimeMultiplier,
        defaultHourlyRate: defaultRate,
        payDay,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Pay Period</label>
        <select value={payPeriod} onChange={e => setPayPeriod(e.target.value as PayrollConfig['payPeriod'])} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option value="weekly">Weekly</option>
          <option value="biweekly">Biweekly</option>
          <option value="semimonthly">Semi-monthly (1st & 15th)</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>
      <Input label="Pay Day" value={payDay} onChange={e => setPayDay(e.target.value)} placeholder="e.g. Friday or 1st and 15th" />
      <div className="grid grid-cols-3 gap-3">
        <Input label="Default Hourly Rate ($)" type="number" value={String(defaultRate)} onChange={e => setDefaultRate(Number(e.target.value))} />
        <Input label="OT Threshold (hrs/week)" type="number" value={String(overtimeThreshold)} onChange={e => setOvertimeThreshold(Number(e.target.value))} />
        <Input label="OT Multiplier" type="number" value={String(overtimeMultiplier)} onChange={e => setOvertimeMultiplier(Number(e.target.value))} step="0.1" />
      </div>
      <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>Save Configuration</Button>
    </div>
  );
}
