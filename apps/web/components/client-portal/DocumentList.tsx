'use client';

import React from 'react';
import {
  DocumentTextIcon,
  DocumentIcon,
  PhotoIcon,
  ArrowDownTrayIcon,
  DocumentCheckIcon,
  ReceiptPercentIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export type DocumentType = 'contract' | 'change_order' | 'invoice' | 'warranty' | 'photo' | 'other';

export interface PortalDocument {
  id: string;
  name: string;
  type: DocumentType;
  url: string;
  size?: number;
  createdAt?: Date;
  description?: string;
}

interface DocumentListProps {
  documents: PortalDocument[];
  className?: string;
}

const TYPE_CONFIG: Record<
  DocumentType,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  contract: { label: 'Contract', icon: DocumentCheckIcon, color: 'text-blue-600 bg-blue-100' },
  change_order: { label: 'Change Order', icon: DocumentTextIcon, color: 'text-orange-600 bg-orange-100' },
  invoice: { label: 'Invoice', icon: ReceiptPercentIcon, color: 'text-green-600 bg-green-100' },
  warranty: { label: 'Warranty', icon: ShieldCheckIcon, color: 'text-purple-600 bg-purple-100' },
  photo: { label: 'Photo', icon: PhotoIcon, color: 'text-pink-600 bg-pink-100' },
  other: { label: 'Document', icon: DocumentIcon, color: 'text-gray-600 bg-gray-100' },
};

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentList({ documents, className }: DocumentListProps) {
  if (documents.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No documents available</p>
        <p className="text-sm text-gray-400 mt-1">Documents will appear here when shared</p>
      </div>
    );
  }

  // Group documents by type
  const grouped = documents.reduce(
    (acc, doc) => {
      const type = doc.type || 'other';
      if (!acc[type]) acc[type] = [];
      acc[type].push(doc);
      return acc;
    },
    {} as Record<DocumentType, PortalDocument[]>
  );

  const typeOrder: DocumentType[] = ['contract', 'change_order', 'invoice', 'warranty', 'other'];

  return (
    <div className={cn('space-y-6', className)}>
      {typeOrder.map((type) => {
        const docs = grouped[type];
        if (!docs || docs.length === 0) return null;

        const config = TYPE_CONFIG[type];

        return (
          <div key={type}>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <config.icon className="w-4 h-4" />
              {config.label}s ({docs.length})
            </h3>

            <div className="space-y-2">
              {docs.map((doc) => {
                const Icon = config.icon;

                return (
                  <div
                    key={doc.id}
                    className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-4"
                  >
                    {/* Icon */}
                    <div className={cn('p-2 rounded-lg', config.color)}>
                      <Icon className="w-5 h-5" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{doc.name}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        {doc.createdAt && (
                          <span>{format(new Date(doc.createdAt), 'MMM d, yyyy')}</span>
                        )}
                        {doc.size && <span>{formatFileSize(doc.size)}</span>}
                      </div>
                      {doc.description && (
                        <p className="text-sm text-gray-500 mt-1 truncate">{doc.description}</p>
                      )}
                    </div>

                    {/* Download button */}
                    <a
                      href={doc.url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <ArrowDownTrayIcon className="w-5 h-5" />
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default DocumentList;
