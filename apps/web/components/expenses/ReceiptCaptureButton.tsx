'use client';

import React, { useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import {
  CameraIcon,
  XMarkIcon,
  DocumentMagnifyingGlassIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { fileToBase64 } from '@/lib/firebase/upload-helpers';
import { scanReceipt, ReceiptOCRResult, getConfidenceDisplay } from './ReceiptScanner';
import { useAuth } from '@/lib/auth';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface ReceiptCaptureButtonProps {
  onScanComplete: (result: ReceiptOCRResult) => void;
  onScanError?: (error: string) => void;
  projectId?: string;
  disabled?: boolean;
  className?: string;
}

type ScanState = 'idle' | 'preview' | 'scanning' | 'success' | 'error';

/**
 * ReceiptCaptureButton - Camera/file picker button that triggers OCR scanning
 *
 * Features:
 * - Click to open file picker (supports camera on mobile)
 * - Shows image preview before scanning
 * - Displays scanning progress
 * - Shows confidence indicator on success
 * - Auto-fills form via onScanComplete callback
 */
export function ReceiptCaptureButton({
  onScanComplete,
  onScanError,
  projectId,
  disabled = false,
  className,
}: ReceiptCaptureButtonProps) {
  const { profile } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  const [state, setState] = useState<ScanState>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ReceiptOCRResult | null>(null);

  const resetState = useCallback(() => {
    setState('idle');
    setSelectedFile(null);
    setScanResult(null);
    setError(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [previewUrl]);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Reset input so same file can be selected again
      e.target.value = '';

      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError('Please select a JPEG, PNG, or WebP image');
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        setError('Image must be smaller than 10MB');
        return;
      }

      setError(null);
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setState('preview');
    },
    []
  );

  const handleScan = useCallback(async () => {
    if (!selectedFile || !profile?.orgId) return;

    setState('scanning');
    setError(null);

    try {
      const base64 = await fileToBase64(selectedFile);
      const result = await scanReceipt(
        base64,
        selectedFile.type,
        profile.orgId,
        projectId
      );

      setScanResult(result);
      setState('success');
      onScanComplete(result);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to scan receipt';
      setError(errorMessage);
      setState('error');
      onScanError?.(errorMessage);
    }
  }, [selectedFile, profile?.orgId, projectId, onScanComplete, onScanError]);

  const handleClick = useCallback(() => {
    if (state === 'idle') {
      inputRef.current?.click();
    }
  }, [state]);

  // Render based on current state
  if (state === 'idle') {
    return (
      <div className={cn('relative', className)}>
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled || !profile?.orgId}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed',
            'transition-colors duration-200',
            disabled || !profile?.orgId
              ? 'border-gray-200 text-gray-400 cursor-not-allowed'
              : 'border-brand-300 text-brand-primary hover:border-brand-400 hover:bg-brand-50'
          )}
        >
          <CameraIcon className="h-5 w-5" />
          <span className="text-sm font-medium">Scan Receipt</span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />
        {error && (
          <p className="mt-1 text-xs text-red-600">{error}</p>
        )}
      </div>
    );
  }

  // Preview, scanning, success, or error states
  return (
    <div
      className={cn(
        'border rounded-lg overflow-hidden bg-gray-50',
        className
      )}
    >
      {/* Preview Image */}
      <div className="relative aspect-[4/3] max-h-48 bg-gray-100">
        {previewUrl && (
          <Image
            src={previewUrl}
            alt="Receipt preview"
            fill
            className="object-contain"
          />
        )}

        {/* Close button (always visible except during scanning) */}
        {state !== 'scanning' && (
          <button
            type="button"
            onClick={resetState}
            className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}

        {/* Scanning overlay */}
        {state === 'scanning' && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-center text-white">
              <ArrowPathIcon className="h-8 w-8 mx-auto animate-spin" />
              <p className="mt-2 text-sm font-medium">Scanning receipt...</p>
              <p className="text-xs text-gray-300">This may take a few seconds</p>
            </div>
          </div>
        )}

        {/* Success overlay */}
        {state === 'success' && scanResult && (
          <div className="absolute inset-0 bg-green-900/70 flex items-center justify-center">
            <div className="text-center text-white">
              <CheckCircleIcon className="h-10 w-10 mx-auto" />
              <p className="mt-2 text-sm font-medium">Receipt scanned!</p>
            </div>
          </div>
        )}

        {/* Error overlay */}
        {state === 'error' && (
          <div className="absolute inset-0 bg-red-900/70 flex items-center justify-center">
            <div className="text-center text-white px-4">
              <ExclamationTriangleIcon className="h-10 w-10 mx-auto" />
              <p className="mt-2 text-sm font-medium">Scan failed</p>
              <p className="text-xs text-gray-200 mt-1">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Action bar */}
      <div className="p-3 border-t bg-white">
        {state === 'preview' && (
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={resetState}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleScan}
              className="flex items-center gap-2 px-4 py-1.5 bg-brand-primary text-white text-sm font-medium rounded-md hover:bg-brand-900 transition-colors"
            >
              <DocumentMagnifyingGlassIcon className="h-4 w-4" />
              Scan Receipt
            </button>
          </div>
        )}

        {state === 'scanning' && (
          <div className="text-center text-sm text-gray-500">
            Processing with AI...
          </div>
        )}

        {state === 'success' && scanResult && (
          <div className="space-y-2">
            {/* Confidence indicator */}
            <div
              className={cn(
                'flex items-center justify-center gap-1 px-2 py-1 rounded text-xs font-medium',
                getConfidenceDisplay(scanResult.confidence).bgColor,
                getConfidenceDisplay(scanResult.confidence).color
              )}
            >
              {getConfidenceDisplay(scanResult.confidence).label}
              <span className="text-xs opacity-75">
                ({Math.round(scanResult.confidence * 100)}%)
              </span>
            </div>

            {/* Quick summary */}
            <div className="text-xs text-gray-600 text-center">
              {scanResult.vendor && (
                <span className="font-medium">{scanResult.vendor}</span>
              )}
              {scanResult.total != null && (
                <span>
                  {scanResult.vendor ? ' - ' : ''}${scanResult.total.toFixed(2)}
                </span>
              )}
              {scanResult.date && (
                <span className="text-gray-400"> ({scanResult.date})</span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={resetState}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Scan another
              </button>
              <span className="text-xs text-green-600 font-medium">
                Form auto-filled
              </span>
            </div>
          </div>
        )}

        {state === 'error' && (
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={resetState}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleScan}
              className="flex items-center gap-2 px-4 py-1.5 bg-brand-primary text-white text-sm font-medium rounded-md hover:bg-brand-900 transition-colors"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReceiptCaptureButton;
