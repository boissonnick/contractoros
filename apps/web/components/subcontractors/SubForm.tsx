"use client";

import React, { useState } from 'react';
import { Subcontractor } from '@/types';
import { Button, Input, Textarea } from '@/components/ui';
import { useAuth } from '@/lib/auth';

interface SubFormProps {
  initialData?: Partial<Subcontractor>;
  onSubmit: (data: Omit<Subcontractor, 'id' | 'createdAt' | 'updatedAt' | 'metrics'>) => Promise<void>;
  onCancel: () => void;
}

export default function SubForm({ initialData, onSubmit, onCancel }: SubFormProps) {
  const { profile } = useAuth();
  const [companyName, setCompanyName] = useState(initialData?.companyName || '');
  const [contactName, setContactName] = useState(initialData?.contactName || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [trade, setTrade] = useState(initialData?.trade || '');
  const [licenseNumber, setLicenseNumber] = useState(initialData?.licenseNumber || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !contactName.trim() || !email.trim() || !trade.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        orgId: profile?.orgId || '',
        companyName: companyName.trim(),
        contactName: contactName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        trade: trade.trim(),
        licenseNumber: licenseNumber.trim() || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
        documents: initialData?.documents || [],
        isActive: initialData?.isActive !== false,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Input label="Company Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
        <Input label="Contact Name" value={contactName} onChange={(e) => setContactName(e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Trade" value={trade} onChange={(e) => setTrade(e.target.value)} required placeholder="e.g. Electrician" />
        <Input label="License Number" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} />
      </div>
      <Input label="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
      <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" size="sm" type="button" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" size="sm" type="submit" disabled={saving || !companyName.trim()}>
          {saving ? 'Saving...' : initialData?.id ? 'Update' : 'Add Subcontractor'}
        </Button>
      </div>
    </form>
  );
}
