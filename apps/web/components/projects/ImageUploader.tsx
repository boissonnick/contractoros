"use client";

import React, { useCallback, useRef, useState } from 'react';
import { uploadInspirationImage } from '@/lib/firebase/upload-helpers';
import { Button } from '@/components/ui';
import {
  PhotoIcon,
  XMarkIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface InspirationImage {
  url: string;
  uploadedAt: Date;
}

interface ImageUploaderProps {
  images: InspirationImage[];
  onImagesChange: (images: InspirationImage[]) => void;
  projectId: string;
  maxImages?: number;
}

interface UploadingFile {
  id: string;
  name: string;
  progress: number;
}

export default function ImageUploader({
  images,
  onImagesChange,
  projectId,
  maxImages = 20,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      setError(null);
      const fileArr = Array.from(files);
      const remaining = maxImages - images.length;

      if (fileArr.length > remaining) {
        setError(`You can only upload ${remaining} more image${remaining !== 1 ? 's' : ''}.`);
        return;
      }

      const newUploading: UploadingFile[] = fileArr.map((f) => ({
        id: crypto.randomUUID(),
        name: f.name,
        progress: 0,
      }));
      setUploading((prev) => [...prev, ...newUploading]);

      const results: InspirationImage[] = [];

      for (let i = 0; i < fileArr.length; i++) {
        const file = fileArr[i];
        const uploadId = newUploading[i].id;

        try {
          const url = await uploadInspirationImage(projectId, file, (percent) => {
            setUploading((prev) =>
              prev.map((u) => (u.id === uploadId ? { ...u, progress: percent } : u))
            );
          });
          results.push({ url, uploadedAt: new Date() });
        } catch (err: any) {
          setError(err.message || 'Upload failed');
        } finally {
          setUploading((prev) => prev.filter((u) => u.id !== uploadId));
        }
      }

      if (results.length > 0) {
        onImagesChange([...images, ...results]);
      }
    },
    [images, onImagesChange, projectId, maxImages]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleRemove = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    onImagesChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
          dragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400 bg-gray-50'
        )}
      >
        <ArrowUpTrayIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm font-medium text-gray-700">
          Drop images here or click to browse
        </p>
        <p className="text-xs text-gray-500 mt-1">
          JPEG, PNG, or WebP · Max 10MB per file · {images.length}/{maxImages} uploaded
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>
      )}

      {/* Uploading progress */}
      {uploading.length > 0 && (
        <div className="space-y-2">
          {uploading.map((u) => (
            <div key={u.id} className="flex items-center gap-3 text-sm">
              <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${u.progress}%` }}
                />
              </div>
              <span className="text-gray-500 w-12 text-right">{u.progress}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Thumbnail grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {images.map((img, i) => (
            <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100">
              <img
                src={img.url}
                alt={`Inspiration ${i + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(i);
                }}
                className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
