"use client";

import React, { useRef, useState } from 'react';
import { Subcontractor, SubcontractorDocument } from '@/types';
import { Button } from '@/components/ui';
import { DocumentArrowUpIcon, TrashIcon, ArrowDownTrayIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

interface SubDocumentsProps {
  sub: Subcontractor;
  onUpdate: (documents: SubcontractorDocument[]) => void;
}

const DOC_TYPES: { value: SubcontractorDocument['type']; label: string }[] = [
  { value: 'license', label: 'License' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'w9', label: 'W-9' },
  { value: 'contract', label: 'Contract' },
  { value: 'other', label: 'Other' },
];

export default function SubDocuments({ sub, onUpdate }: SubDocumentsProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [docType, setDocType] = useState<SubcontractorDocument['type']>('other');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    setProgress(0);

    const storagePath = `subcontractors/${sub.id}/docs/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snap) => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      (err) => {
        console.error('Upload error:', err);
        setUploading(false);
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        const newDoc: SubcontractorDocument = {
          id: Date.now().toString(),
          type: docType,
          name: file.name,
          url,
          uploadedAt: new Date(),
        };
        onUpdate([...sub.documents, newDoc]);
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    );
  };

  const removeDoc = (docId: string) => {
    onUpdate(sub.documents.filter(d => d.id !== docId));
  };

  const now = new Date();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900">Documents</h4>
        <div className="flex items-center gap-2">
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value as SubcontractorDocument['type'])}
            className="border border-gray-300 rounded-lg px-2 py-1 text-xs"
          >
            {DOC_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading} icon={<DocumentArrowUpIcon className="h-4 w-4" />}>
            Upload
          </Button>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
        </div>
      </div>

      {uploading && (
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex justify-between text-xs text-blue-700 mb-1">
            <span>Uploading...</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-blue-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {sub.documents.length === 0 && !uploading && (
        <p className="text-xs text-gray-400">No documents uploaded yet.</p>
      )}

      <div className="space-y-2">
        {sub.documents.map((doc) => {
          const expired = doc.expiresAt && doc.expiresAt < now;
          return (
            <div key={doc.id} className={cn('flex items-center justify-between px-3 py-2 rounded-lg', expired ? 'bg-red-50' : 'bg-gray-50')}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded uppercase">{doc.type}</span>
                  <p className="text-sm text-gray-900 truncate">{doc.name}</p>
                </div>
                {doc.expiresAt && (
                  <p className={cn('text-xs mt-0.5', expired ? 'text-red-500' : 'text-gray-500')}>
                    {expired && <ExclamationTriangleIcon className="inline h-3 w-3 mr-0.5" />}
                    Expires {doc.expiresAt.toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 ml-2">
                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="p-1 text-gray-400 hover:text-blue-600">
                  <ArrowDownTrayIcon className="h-4 w-4" />
                </a>
                <button onClick={() => removeDoc(doc.id)} className="p-1 text-gray-400 hover:text-red-500">
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
