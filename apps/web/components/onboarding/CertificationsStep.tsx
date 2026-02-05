"use client";

import React, { useState } from 'react';
import { Certification } from '@/types';
import { Button, Input } from '@/components/ui';
import { ArrowRightIcon, ArrowLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface CertificationsStepProps {
  initialCerts?: Certification[];
  onNext: (certs: Certification[]) => void;
  onBack: () => void;
}

export default function CertificationsStep({ initialCerts = [], onNext, onBack }: CertificationsStepProps) {
  const [certs, setCerts] = useState<Certification[]>(initialCerts.length > 0 ? initialCerts : [{ name: '', issuingBody: '', number: '', expiryDate: '' }]);

  const updateCert = (idx: number, field: keyof Certification, value: string) => {
    setCerts(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  };

  const addCert = () => setCerts(prev => [...prev, { name: '', issuingBody: '', number: '', expiryDate: '' }]);
  const removeCert = (idx: number) => setCerts(prev => prev.filter((_, i) => i !== idx));

  const validCerts = certs.filter(c => c.name.trim());

  return (
    <div>
      <p className="text-gray-500 mb-6">Add any licenses, certifications, or insurance. You can skip this and add later.</p>
      <div className="space-y-4 max-h-64 overflow-y-auto">
        {certs.map((cert, idx) => (
          <div key={idx} className="border border-gray-200 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Certification {idx + 1}</span>
              {certs.length > 1 && (
                <button onClick={() => removeCert(idx)} className="text-gray-400 hover:text-red-500">
                  <TrashIcon className="h-4 w-4" />
                </button>
              )}
            </div>
            <Input label="Name" value={cert.name} onChange={(e) => updateCert(idx, 'name', e.target.value)} placeholder="e.g. Electrical License" />
            <div className="grid grid-cols-2 gap-2">
              <Input label="Issuing Body" value={cert.issuingBody || ''} onChange={(e) => updateCert(idx, 'issuingBody', e.target.value)} placeholder="State Board" />
              <Input label="License #" value={cert.number || ''} onChange={(e) => updateCert(idx, 'number', e.target.value)} />
            </div>
            <Input label="Expiry Date" type="date" value={cert.expiryDate || ''} onChange={(e) => updateCert(idx, 'expiryDate', e.target.value)} />
          </div>
        ))}
      </div>
      <button onClick={addCert} className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 mt-3">
        <PlusIcon className="h-4 w-4" /> Add another
      </button>
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={onBack} icon={<ArrowLeftIcon className="h-4 w-4" />}>Back</Button>
        <Button variant="primary" onClick={() => onNext(validCerts)} icon={<ArrowRightIcon className="h-4 w-4" />} iconPosition="right">
          {validCerts.length > 0 ? 'Continue' : 'Skip'}
        </Button>
      </div>
    </div>
  );
}
