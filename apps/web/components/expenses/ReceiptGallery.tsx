'use client';

import { useState, useCallback, useEffect } from 'react';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { cn, formatFileSize } from '@/lib/utils';
import { ExpenseReceipt } from '@/types';

interface ReceiptGalleryProps {
  receipts: ExpenseReceipt[];
  className?: string;
}

export default function ReceiptGallery({ receipts, className }: ReceiptGalleryProps) {
  const [selectedReceipt, setSelectedReceipt] = useState<ExpenseReceipt | null>(null);

  const closeLightbox = useCallback(() => {
    setSelectedReceipt(null);
  }, []);

  // Close on Escape key
  useEffect(() => {
    if (!selectedReceipt) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        closeLightbox();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedReceipt, closeLightbox]);

  if (receipts.length === 0) {
    return (
      <div className={cn('rounded-xl border border-gray-200 bg-white p-8 text-center', className)}>
        <PhotoIcon className="mx-auto h-10 w-10 text-gray-300" />
        <p className="mt-2 text-sm text-gray-500">No receipts attached</p>
      </div>
    );
  }

  return (
    <>
      <div className={cn('grid grid-cols-2 md:grid-cols-3 gap-3', className)}>
        {receipts.map((receipt) => (
          <button
            key={receipt.id}
            type="button"
            onClick={() => setSelectedReceipt(receipt)}
            className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <img
              src={receipt.thumbnailUrl || receipt.url}
              alt={receipt.fileName}
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
              <p className="text-xs text-white truncate">{receipt.fileName}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox overlay */}
      {selectedReceipt && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={closeLightbox}
              className="absolute -top-2 -right-2 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>

            {/* Full-size image */}
            <img
              src={selectedReceipt.url}
              alt={selectedReceipt.fileName}
              className="max-h-[80vh] max-w-full object-contain rounded-lg"
            />

            {/* File info */}
            <div className="mt-3 text-center">
              <p className="text-sm text-white font-medium">{selectedReceipt.fileName}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {formatFileSize(selectedReceipt.fileSize)}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
