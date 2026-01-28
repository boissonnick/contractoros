"use client";

import React, { useRef, useState } from 'react';
import { TaskAttachment } from '@/types';
import { storage } from '@/lib/firebase/config';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui';
import {
  PaperClipIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  DocumentIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return PhotoIcon;
  return DocumentIcon;
}

interface TaskAttachmentsProps {
  taskId: string;
  projectId: string;
  attachments: TaskAttachment[];
  onAttachmentsChange: (attachments: TaskAttachment[]) => void;
  readOnly?: boolean;
}

export default function TaskAttachments({
  taskId,
  projectId,
  attachments,
  onAttachmentsChange,
  readOnly = false,
}: TaskAttachmentsProps) {
  const { user, profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user || !profile?.orgId) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const newAttachments: TaskAttachment[] = [];

      for (const file of Array.from(files)) {
        const path = `${profile.orgId}/${projectId}/tasks/${taskId}/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, path);
        const uploadTask = uploadBytesResumable(storageRef, file);

        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              setUploadProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
            },
            reject,
            async () => {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              newAttachments.push({
                id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
                name: file.name,
                url,
                type: file.type,
                size: file.size,
                uploadedBy: user.uid,
                uploadedAt: new Date(),
              });
              resolve();
            }
          );
        });
      }

      onAttachmentsChange([...attachments, ...newAttachments]);
    } catch (err) {
      console.error('Error uploading file:', err);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = (attachmentId: string) => {
    onAttachmentsChange(attachments.filter((a) => a.id !== attachmentId));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Attachments ({attachments.length})
      </label>

      {/* File list */}
      {attachments.length > 0 && (
        <div className="space-y-1.5 mb-2">
          {attachments.map((att) => {
            const Icon = getFileIcon(att.type);
            return (
              <div
                key={att.id}
                className="flex items-center gap-2 bg-gray-50 rounded-md px-3 py-2 text-sm group"
              >
                <Icon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="flex-1 truncate text-gray-700">{att.name}</span>
                <span className="text-xs text-gray-400 flex-shrink-0">{formatFileSize(att.size)}</span>
                <a
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-blue-500"
                  title="Download"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                </a>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => handleRemove(att.id)}
                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Upload button */}
      {!readOnly && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleUpload}
          />
          {uploading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <span>{uploadProgress}%</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <PaperClipIcon className="h-3.5 w-3.5" />
              Attach files
            </button>
          )}
        </div>
      )}
    </div>
  );
}
