"use client";

import React, { useState } from 'react';
import { EmergencyContact } from '@/types';
import { Button, Input } from '@/components/ui';
import { ArrowRightIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

interface EmergencyContactStepProps {
  initialData?: EmergencyContact;
  onNext: (data: EmergencyContact) => void;
  onBack: () => void;
}

export default function EmergencyContactStep({ initialData, onNext, onBack }: EmergencyContactStepProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [relationship, setRelationship] = useState(initialData?.relationship || '');
  const [phone, setPhone] = useState(initialData?.phone || '');

  return (
    <div>
      <p className="text-gray-500 mb-6">Who should we contact in case of an emergency on the job site?</p>
      <div className="space-y-4">
        <Input label="Contact Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" autoFocus />
        <Input label="Relationship" value={relationship} onChange={(e) => setRelationship(e.target.value)} placeholder="Spouse, Parent, etc." />
        <Input label="Phone Number" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(512) 555-1234" />
      </div>
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={onBack} icon={<ArrowLeftIcon className="h-4 w-4" />}>Back</Button>
        <Button variant="primary" onClick={() => onNext({ name: name.trim(), relationship: relationship.trim(), phone: phone.trim() })} disabled={!name.trim() || !phone.trim()} icon={<ArrowRightIcon className="h-4 w-4" />} iconPosition="right">Continue</Button>
      </div>
    </div>
  );
}
