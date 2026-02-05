'use client';

/**
 * OfflinePhotoCapture Component
 * Camera component that works offline - captures photos, stores locally, syncs when online
 */

import React, { useState, useRef, useCallback } from 'react';
import { CameraIcon, PhotoIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/utils';
import { getOfflinePhotoService, PhotoCategory } from '@/lib/offline/offline-photos';
import { getCurrentLocation } from '@/lib/photo-processing';
import { useAuth } from '@/lib/auth';
import { toast } from '@/components/ui/Toast';

interface OfflinePhotoCaptureProps {
  projectId: string;
  orgId: string;
  onCapture: (localId: string) => void;
  defaultCategory?: PhotoCategory;
  phaseId?: string;
  albumId?: string;
  taskId?: string;
  className?: string;
}

const CATEGORY_OPTIONS = [
  { label: 'Progress', value: 'progress' },
  { label: 'Issue', value: 'issue' },
  { label: 'Before', value: 'before' },
  { label: 'After', value: 'after' },
  { label: 'Inspection', value: 'inspection' },
  { label: 'Safety', value: 'safety' },
  { label: 'Material', value: 'material' },
];

export default function OfflinePhotoCapture({
  projectId,
  orgId,
  onCapture,
  defaultCategory = 'progress',
  phaseId,
  albumId,
  taskId,
  className,
}: OfflinePhotoCaptureProps) {
  const { user, profile } = useAuth();
  const [capturedImage, setCapturedImage] = useState<{ blob: Blob; preview: string } | null>(null);
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState<PhotoCategory>(defaultCategory);
  const [saving, setSaving] = useState(false);
  const [captureMode, setCaptureMode] = useState<'idle' | 'camera' | 'preview'>('idle');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Clean up camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Start camera for live capture
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Prefer back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCaptureMode('camera');
    } catch (error) {
      console.error('Camera access denied:', error);
      toast.error('Camera access denied. Please use file upload instead.');
      // Fall back to file input
      fileInputRef.current?.click();
    }
  }, []);

  // Capture photo from camera
  const captureFromCamera = useCallback(() => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const preview = canvas.toDataURL('image/jpeg', 0.8);
          setCapturedImage({ blob, preview });
          setCaptureMode('preview');
          stopCamera();
        }
      },
      'image/jpeg',
      0.9
    );
  }, [stopCamera]);

  // Handle file selection
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    const preview = URL.createObjectURL(file);
    setCapturedImage({ blob: file, preview });
    setCaptureMode('preview');

    // Reset input so same file can be selected again
    event.target.value = '';
  }, []);

  // Cancel and reset
  const handleCancel = useCallback(() => {
    stopCamera();
    if (capturedImage?.preview) {
      URL.revokeObjectURL(capturedImage.preview);
    }
    setCapturedImage(null);
    setCaption('');
    setCategory(defaultCategory);
    setCaptureMode('idle');
  }, [stopCamera, capturedImage, defaultCategory]);

  // Save photo to offline queue
  const handleSave = useCallback(async () => {
    if (!capturedImage || !user || !profile) {
      toast.error('Unable to save photo');
      return;
    }

    setSaving(true);

    try {
      // Try to get location
      const location = await getCurrentLocation();

      const service = getOfflinePhotoService();
      const localId = await service.queuePhoto({
        projectId,
        orgId,
        userId: user.uid,
        userName: profile.displayName || profile.email || 'Unknown',
        blob: capturedImage.blob,
        thumbnail: '', // Will be generated by service
        filename: `photo_${Date.now()}.jpg`,
        caption: caption.trim() || undefined,
        category,
        takenAt: Date.now(),
        location: location || undefined,
        phaseId,
        albumId,
        taskId,
      });

      toast.success('Photo saved! Will upload when online.');
      onCapture(localId);
      handleCancel();
    } catch (error) {
      console.error('Failed to save photo:', error);
      toast.error('Failed to save photo');
    } finally {
      setSaving(false);
    }
  }, [capturedImage, user, profile, projectId, orgId, caption, category, phaseId, albumId, taskId, onCapture, handleCancel]);

  // Idle state - show capture buttons
  if (captureMode === 'idle') {
    return (
      <div className={cn('flex flex-col gap-3', className)}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={startCamera}
            icon={<CameraIcon className="h-5 w-5" />}
            className="flex-col h-24 gap-1"
          >
            <span>Camera</span>
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => fileInputRef.current?.click()}
            icon={<PhotoIcon className="h-5 w-5" />}
            className="flex-col h-24 gap-1"
          >
            <span>Gallery</span>
          </Button>
        </div>
      </div>
    );
  }

  // Camera mode - show live preview
  if (captureMode === 'camera') {
    return (
      <div className={cn('flex flex-col gap-3', className)}>
        <div className="relative aspect-[4/3] bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={handleCancel} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={captureFromCamera}
            icon={<CameraIcon className="h-5 w-5" />}
            className="flex-1"
          >
            Capture
          </Button>
        </div>
      </div>
    );
  }

  // Preview mode - show captured image with options
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Image preview */}
      <div className="relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={capturedImage?.preview}
          alt="Captured"
          className="w-full h-full object-cover"
        />
        <button
          onClick={handleCancel}
          className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Caption input */}
      <div>
        <label htmlFor="caption" className="block text-sm font-medium text-gray-700 mb-1">
          Caption (optional)
        </label>
        <input
          id="caption"
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Add a description..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
        />
      </div>

      {/* Category selection */}
      <Select
        label="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value as PhotoCategory)}
        options={CATEGORY_OPTIONS}
      />

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={handleCancel} className="flex-1">
          Retake
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          loading={saving}
          icon={<CheckIcon className="h-5 w-5" />}
          className="flex-1"
        >
          Save Photo
        </Button>
      </div>
    </div>
  );
}
