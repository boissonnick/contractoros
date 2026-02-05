"use client";

import React, { useState, useCallback } from 'react';
import { Subcontractor, CONSTRUCTION_TRADES, Certification } from '@/types';
import { Button, Input, Textarea } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { PlusIcon, TrashIcon, CheckIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

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
  const [trades, setTrades] = useState<string[]>((initialData as any)?.trades || []);
  const [licenseNumber, setLicenseNumber] = useState(initialData?.licenseNumber || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [insuranceExpiry, setInsuranceExpiry] = useState((initialData as any)?.insuranceExpiry || '');
  const [certifications, setCertifications] = useState<Certification[]>((initialData as any)?.certifications || []);
  const [taxClassification, setTaxClassification] = useState<string>((initialData as any)?.taxClassification || '1099');
  const [showTradeSelector, setShowTradeSelector] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggleTrade = useCallback((t: string) => {
    setTrades(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
    setTrade(prevTrade => prevTrade || t);
  }, []);

  const addCert = useCallback(() => {
    setCertifications(prev => [...prev, { name: '', number: '', expiryDate: '' }]);
  }, []);

  const removeCert = useCallback((idx: number) => {
    setCertifications(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const updateCert = useCallback((idx: number, field: keyof Certification, value: string) => {
    setCertifications(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !contactName.trim() || !email.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        orgId: profile?.orgId || '',
        companyName: companyName.trim(),
        contactName: contactName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        trade: trade.trim() || trades[0] || '',
        licenseNumber: licenseNumber.trim() || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
        documents: initialData?.documents || [],
        isActive: initialData?.isActive !== false,
        ...(trades.length > 0 && { trades }),
        ...(insuranceExpiry && { insuranceExpiry }),
        ...(certifications.length > 0 && { certifications: certifications.filter(c => c.name.trim()) }),
        ...(taxClassification && { taxClassification }),
      } as any);
    } finally {
      setSaving(false);
    }
  }, [companyName, contactName, email, phone, trade, trades, licenseNumber, address, notes, insuranceExpiry, certifications, taxClassification, profile?.orgId, initialData?.documents, initialData?.isActive, onSubmit]);

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

      {/* Multi-trade selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Trades</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {trades.map(t => (
            <span key={t} className="inline-flex items-center gap-1 bg-brand-100 text-brand-primary text-xs px-2 py-1 rounded-full">
              {t}
              <button type="button" onClick={() => toggleTrade(t)} className="hover:text-brand-600">&times;</button>
            </span>
          ))}
        </div>
        <button type="button" onClick={() => setShowTradeSelector(!showTradeSelector)} className="text-sm text-brand-600 hover:text-brand-700">
          {showTradeSelector ? 'Hide trades' : '+ Select trades'}
        </button>
        {showTradeSelector && (
          <div className="grid grid-cols-3 gap-1.5 mt-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
            {CONSTRUCTION_TRADES.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => toggleTrade(t)}
                className={cn(
                  'flex items-center gap-1 text-xs px-2 py-1 rounded border transition-all text-left',
                  trades.includes(t) ? 'border-brand-primary bg-brand-50 text-brand-primary' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                )}
              >
                {trades.includes(t) && <CheckIcon className="h-3 w-3 flex-shrink-0" />}
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input label="License Number" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} />
        <Input label="Insurance Expiry" type="date" value={insuranceExpiry} onChange={(e) => setInsuranceExpiry(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tax Classification</label>
          <select
            value={taxClassification}
            onChange={(e) => setTaxClassification(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
          >
            <option value="1099">1099 - Independent Contractor</option>
            <option value="W2">W2 - Employee</option>
          </select>
        </div>
      </div>

      {/* Certifications */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Certifications</label>
        {certifications.map((cert, idx) => (
          <div key={idx} className="border border-gray-200 rounded-lg p-2 mb-2 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Cert {idx + 1}</span>
              <button type="button" onClick={() => removeCert(idx)} className="text-gray-400 hover:text-red-500"><TrashIcon className="h-3.5 w-3.5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input label="Name" value={cert.name} onChange={(e) => updateCert(idx, 'name', e.target.value)} placeholder="OSHA 30" />
              <Input label="Expiry" type="date" value={cert.expiryDate || ''} onChange={(e) => updateCert(idx, 'expiryDate', e.target.value)} />
            </div>
          </div>
        ))}
        <button type="button" onClick={addCert} className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700">
          <PlusIcon className="h-3.5 w-3.5" /> Add certification
        </button>
      </div>

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
