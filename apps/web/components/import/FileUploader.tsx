'use client';

import React, { useCallback, useState } from 'react';
import {
  ArrowUpTrayIcon,
  DocumentTextIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  acceptedTypes?: string[];
  maxSize?: number; // in bytes
  disabled?: boolean;
}

export function FileUploader({
  onFileSelect,
  acceptedTypes = ['.csv', '.txt'],
  maxSize = 10 * 1024 * 1024, // 10MB default
  disabled = false,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback(
    (file: File): string | null => {
      // Check file type
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!acceptedTypes.some(type => type.toLowerCase() === extension)) {
        return `Invalid file type. Accepted types: ${acceptedTypes.join(', ')}`;
      }

      // Check file size
      if (file.size > maxSize) {
        const maxSizeMB = (maxSize / 1024 / 1024).toFixed(1);
        return `File too large. Maximum size: ${maxSizeMB}MB`;
      }

      return null;
    },
    [acceptedTypes, maxSize]
  );

  const handleFile = useCallback(
    (file: File) => {
      const validationError = validateFile(file);

      if (validationError) {
        setError(validationError);
        setSelectedFile(null);
        return;
      }

      setError(null);
      setSelectedFile(file);
      onFileSelect(file);
    },
    [validateFile, onFileSelect]
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
    [disabled, handleFile]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) {
        setIsDragging(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleClear = useCallback(() => {
    setSelectedFile(null);
    setError(null);
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="w-full">
      {selectedFile ? (
        // Selected file display
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <DocumentTextIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600"
              disabled={disabled}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : (
        // Drop zone
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <input
            type="file"
            onChange={handleFileInput}
            accept={acceptedTypes.join(',')}
            className="hidden"
            id="file-input"
            disabled={disabled}
          />
          <label
            htmlFor="file-input"
            className={`flex flex-col items-center ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <ArrowUpTrayIcon className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-900 mb-1">
              Drop your file here, or click to browse
            </p>
            <p className="text-xs text-gray-500">
              Supported formats: {acceptedTypes.join(', ')} (max {(maxSize / 1024 / 1024).toFixed(0)}MB)
            </p>
          </label>
        </div>
      )}

      {error && (
        <div className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <XMarkIcon className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  );
}

export default FileUploader;
