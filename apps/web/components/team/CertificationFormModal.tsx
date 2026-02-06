"use client";

import React, { useState } from 'react';
import { BaseModal, Button, toast } from '@/components/ui';
import { UserProfile, CertificationCategory } from '@/types';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';
import { logger } from '@/lib/utils/logger';

interface CertificationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: UserProfile[];
  /** Pre-selected member (for editing context) */
  preSelectedUserId?: string;
}

const CATEGORY_OPTIONS: { value: CertificationCategory; label: string }[] = [
  { value: 'license', label: 'License' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'training', label: 'Training' },
  { value: 'safety', label: 'Safety' },
  { value: 'other', label: 'Other' },
];

export function CertificationFormModal({
  isOpen,
  onClose,
  members,
  preSelectedUserId,
}: CertificationFormModalProps) {
  const [userId, setUserId] = useState(preSelectedUserId || '');
  const [name, setName] = useState('');
  const [issuingBody, setIssuingBody] = useState('');
  const [number, setNumber] = useState('');
  const [category, setCategory] = useState<CertificationCategory>('license');
  const [expiryDate, setExpiryDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      toast.error('Please select a team member');
      return;
    }
    if (!name.trim()) {
      toast.error('Certification name is required');
      return;
    }

    setSubmitting(true);

    try {
      let fileURL: string | undefined;

      // Upload file if provided
      if (file) {
        const fileRef = ref(storage, `certifications/${userId}/${Date.now()}-${file.name}`);
        const uploadTask = uploadBytesResumable(fileRef, file);

        fileURL = await new Promise<string>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
              setUploadProgress(progress);
            },
            (error) => reject(error),
            async () => {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(url);
            }
          );
        });
      }

      const newCert = {
        name: name.trim(),
        ...(issuingBody.trim() && { issuingBody: issuingBody.trim() }),
        ...(number.trim() && { number: number.trim() }),
        category,
        ...(expiryDate && { expiryDate }),
        ...(fileURL && { fileURL }),
      };

      await updateDoc(doc(db, 'users', userId), {
        certifications: arrayUnion(newCert),
      });

      toast.success('Certification added successfully');
      onClose();
    } catch (error) {
      logger.error('Error adding certification', { error, component: 'CertificationFormModal' });
      toast.error('Failed to add certification');
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  return (
    <BaseModal
      open={isOpen}
      onClose={onClose}
      title="Add Certification"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Employee Select */}
        <div>
          <label htmlFor="cert-employee" className="block text-sm font-medium text-gray-700 mb-1">
            Employee <span className="text-red-500">*</span>
          </label>
          <select
            id="cert-employee"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
            disabled={!!preSelectedUserId}
          >
            <option value="">Select team member...</option>
            {members.map((m) => (
              <option key={m.uid} value={m.uid}>
                {m.displayName || m.email || m.uid}
              </option>
            ))}
          </select>
        </div>

        {/* Certification Name */}
        <div>
          <label htmlFor="cert-name" className="block text-sm font-medium text-gray-700 mb-1">
            Certification Name <span className="text-red-500">*</span>
          </label>
          <input
            id="cert-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., General Contractor License"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
          />
        </div>

        {/* Issuing Body */}
        <div>
          <label htmlFor="cert-issuer" className="block text-sm font-medium text-gray-700 mb-1">
            Issuing Body
          </label>
          <input
            id="cert-issuer"
            type="text"
            value={issuingBody}
            onChange={(e) => setIssuingBody(e.target.value)}
            placeholder="e.g., State Licensing Board"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Number */}
          <div>
            <label htmlFor="cert-number" className="block text-sm font-medium text-gray-700 mb-1">
              Certificate Number
            </label>
            <input
              id="cert-number"
              type="text"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="e.g., LIC-12345"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="cert-category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="cert-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as CertificationCategory)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Expiry Date */}
        <div>
          <label htmlFor="cert-expiry" className="block text-sm font-medium text-gray-700 mb-1">
            Expiry Date
          </label>
          <input
            id="cert-expiry"
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
          />
        </div>

        {/* File Upload */}
        <div>
          <label htmlFor="cert-file" className="block text-sm font-medium text-gray-700 mb-1">
            Upload Document
          </label>
          <input
            id="cert-file"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
          />
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mt-2">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-primary rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Uploading... {uploadProgress}%</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={submitting}>
            {submitting ? 'Adding...' : 'Add Certification'}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
}

export default CertificationFormModal;
