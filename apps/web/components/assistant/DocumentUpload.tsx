'use client';

import React, { useCallback, useState, useRef } from 'react';
import {
  DocumentIcon,
  PhotoIcon,
  XMarkIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { DocumentAnalysis, DocumentType, DocumentAnalysisStatus } from '@/lib/assistant/types';

interface DocumentUploadProps {
  /** Callback when file is uploaded */
  onUpload: (file: File) => Promise<void>;
  /** Callback when analysis completes */
  onAnalysisComplete: (result: DocumentAnalysis) => void;
  /** Maximum file size in MB (default 10) */
  maxSizeMB?: number;
  /** Currently analyzing document */
  currentAnalysis?: DocumentAnalysis | null;
  /** Whether upload is disabled */
  disabled?: boolean;
}

const ACCEPTED_TYPES: Record<string, DocumentType> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'docx',
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/webp': 'image',
  'image/heic': 'image',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'spreadsheet',
  'application/vnd.ms-excel': 'spreadsheet',
};

const ACCEPTED_EXTENSIONS = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.heic,.xlsx,.xls';

export function DocumentUpload({
  onUpload,
  onAnalysisComplete,
  maxSizeMB = 10,
  currentAnalysis,
  disabled = false,
}: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const getFileType = (file: File): DocumentType | null => {
    return ACCEPTED_TYPES[file.type] || null;
  };

  const validateFile = (file: File): string | null => {
    if (!getFileType(file)) {
      return 'Unsupported file type. Please upload PDF, DOCX, images, or spreadsheets.';
    }
    if (file.size > maxSizeBytes) {
      return `File too large. Maximum size is ${maxSizeMB}MB.`;
    }
    return null;
  };

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      try {
        // Simulate upload progress
        setUploadProgress(0);
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return prev;
            }
            return prev + 10;
          });
        }, 100);

        await onUpload(file);

        clearInterval(progressInterval);
        setUploadProgress(100);

        // Reset progress after a delay
        setTimeout(() => setUploadProgress(0), 1000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
        setUploadProgress(0);
      }
    },
    [onUpload, maxSizeBytes]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled) return;

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile, disabled]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    // Reset input so the same file can be selected again
    e.target.value = '';
  };

  const getStatusIcon = (status: DocumentAnalysisStatus) => {
    switch (status) {
      case 'uploading':
        return <ArrowUpTrayIcon className="h-5 w-5 text-blue-500 animate-pulse" />;
      case 'analyzing':
        return (
          <div className="h-5 w-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        );
      case 'complete':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'error':
        return <ExclamationCircleIcon className="h-5 w-5 text-red-500" />;
    }
  };

  const getFileIcon = (type: DocumentType) => {
    switch (type) {
      case 'image':
        return <PhotoIcon className="h-8 w-8 text-gray-400" />;
      default:
        return <DocumentIcon className="h-8 w-8 text-gray-400" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // If we have an active analysis, show the status
  if (currentAnalysis) {
    return (
      <div className="border border-gray-200 rounded-lg p-3 bg-white">
        <div className="flex items-start gap-3">
          {/* File icon or thumbnail */}
          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
            {currentAnalysis.thumbnailUrl ? (
              <img
                src={currentAnalysis.thumbnailUrl}
                alt={currentAnalysis.fileName}
                className="w-full h-full object-cover"
              />
            ) : (
              getFileIcon(currentAnalysis.fileType)
            )}
          </div>

          {/* File info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-900 truncate">
                {currentAnalysis.fileName}
              </p>
              {getStatusIcon(currentAnalysis.status)}
            </div>
            <p className="text-xs text-gray-500">
              {formatFileSize(currentAnalysis.fileSize)}
            </p>

            {/* Status text */}
            <p className="text-xs text-gray-600 mt-1">
              {currentAnalysis.status === 'uploading' && 'Uploading...'}
              {currentAnalysis.status === 'analyzing' && 'Analyzing document...'}
              {currentAnalysis.status === 'complete' && 'Analysis complete'}
              {currentAnalysis.status === 'error' && (
                <span className="text-red-600">{currentAnalysis.error || 'Analysis failed'}</span>
              )}
            </p>

            {/* Summary preview */}
            {currentAnalysis.status === 'complete' && currentAnalysis.summary && (
              <p className="text-xs text-gray-700 mt-2 line-clamp-2">
                {currentAnalysis.summary}
              </p>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {(currentAnalysis.status === 'uploading' || currentAnalysis.status === 'analyzing') && (
          <div className="mt-2">
            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500 transition-all duration-300"
                style={{
                  width:
                    currentAnalysis.status === 'uploading'
                      ? `${uploadProgress}%`
                      : '100%',
                  animation:
                    currentAnalysis.status === 'analyzing'
                      ? 'pulse 2s infinite'
                      : 'none',
                }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Drop zone */}
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer
          transition-colors duration-200
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${isDragging
            ? 'border-violet-500 bg-violet-50'
            : 'border-gray-300 hover:border-violet-400 hover:bg-gray-50'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />

        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <DocumentIcon className="h-6 w-6 text-gray-400" />
            <PhotoIcon className="h-6 w-6 text-gray-400" />
          </div>
          <div>
            <p className="text-sm text-gray-600">
              {isDragging ? (
                <span className="text-violet-600 font-medium">Drop file here</span>
              ) : (
                <>
                  <span className="text-violet-600 font-medium">Upload a file</span>
                  <span> or drag and drop</span>
                </>
              )}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PDF, DOCX, images up to {maxSizeMB}MB
            </p>
          </div>
        </div>

        {/* Upload progress overlay */}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-600">Uploading... {uploadProgress}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          <ExclamationCircleIcon className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto p-0.5 hover:bg-red-100 rounded"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default DocumentUpload;
