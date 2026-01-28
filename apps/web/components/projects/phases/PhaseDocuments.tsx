"use client";

import React, { useRef, useState } from 'react';
import { ProjectPhase, PhaseDocument } from '@/types';
import { Button } from '@/components/ui';
import { DocumentArrowUpIcon, TrashIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth';

interface PhaseDocumentsProps {
  phase: ProjectPhase;
  projectId: string;
  onUpdate: (documents: PhaseDocument[]) => void;
}

export default function PhaseDocuments({ phase, projectId, onUpdate }: PhaseDocumentsProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    setProgress(0);

    const storagePath = `projects/${projectId}/phases/${phase.id}/${Date.now()}_${file.name}`;
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
        const newDoc: PhaseDocument = {
          id: Date.now().toString(),
          name: file.name,
          url,
          type: file.type,
          size: file.size,
          uploadedBy: user.uid,
          uploadedAt: new Date(),
        };
        onUpdate([...phase.documents, newDoc]);
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    );
  };

  const removeDoc = (docId: string) => {
    onUpdate(phase.documents.filter(d => d.id !== docId));
  };

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900">Documents</h4>
        <Button
          variant="secondary"
          size="sm"
          icon={<DocumentArrowUpIcon className="h-4 w-4" />}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          Upload
        </Button>
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
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

      {phase.documents.length === 0 && !uploading && (
        <p className="text-xs text-gray-400">No documents uploaded yet.</p>
      )}

      <div className="space-y-2">
        {phase.documents.map((doc) => (
          <div key={doc.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 truncate">{doc.name}</p>
              <p className="text-xs text-gray-500">{formatSize(doc.size)}</p>
            </div>
            <div className="flex items-center gap-1 ml-2">
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 text-gray-400 hover:text-blue-600"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
              </a>
              <button onClick={() => removeDoc(doc.id)} className="p-1 text-gray-400 hover:text-red-500">
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
