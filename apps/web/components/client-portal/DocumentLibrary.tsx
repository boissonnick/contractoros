'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';

interface Document {
  id: string;
  name: string;
  url?: string;
  fileType?: string;
  fileSize?: number;
  category?: string;
  createdAt?: Date;
}
import {
  DocumentTextIcon,
  DocumentIcon,
  PhotoIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  XMarkIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

type DocumentCategory = 'contracts' | 'plans' | 'permits' | 'invoices' | 'reports' | 'other';

const CATEGORY_CONFIG: Record<DocumentCategory, { label: string; color: string }> = {
  contracts: { label: 'Contracts', color: 'bg-purple-100 text-purple-700' },
  plans: { label: 'Plans', color: 'bg-blue-100 text-blue-700' },
  permits: { label: 'Permits', color: 'bg-green-100 text-green-700' },
  invoices: { label: 'Invoices', color: 'bg-orange-100 text-orange-700' },
  reports: { label: 'Reports', color: 'bg-gray-100 text-gray-700' },
  other: { label: 'Other', color: 'bg-gray-100 text-gray-500' },
};

function getFileIcon(fileType?: string) {
  if (!fileType) return DocumentIcon;
  if (fileType.includes('pdf')) return DocumentTextIcon;
  if (fileType.includes('image')) return PhotoIcon;
  return DocumentIcon;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface DocumentLibraryProps {
  documents: Document[];
  onDownload?: (doc: Document) => void;
}

export function DocumentLibrary({ documents, onDownload }: DocumentLibraryProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<DocumentCategory | 'all'>('all');
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);

  // Get categories with documents
  const categories = useMemo(() => {
    const cats = new Set<DocumentCategory>();
    documents.forEach((d) => {
      if (d.category) cats.add(d.category as DocumentCategory);
    });
    return Array.from(cats);
  }, [documents]);

  // Filter documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      if (search && !doc.name.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (categoryFilter !== 'all' && doc.category !== categoryFilter) {
        return false;
      }
      return true;
    });
  }, [documents, search, categoryFilter]);

  const handleDownload = (doc: Document) => {
    if (onDownload) {
      onDownload(doc);
    } else if (doc.url) {
      window.open(doc.url, '_blank');
    }
  };

  const canPreview = (doc: Document) => {
    const type = doc.fileType?.toLowerCase() || '';
    return type.includes('pdf') || type.includes('image');
  };

  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <DocumentIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No documents yet</p>
        <p className="text-sm text-gray-400 mt-1">Documents will appear here as they are added</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Documents</h3>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by filename..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <FunnelIcon className="h-4 w-4 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as DocumentCategory | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_CONFIG[cat]?.label || cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Document List */}
      <div className="divide-y divide-gray-100">
        {filteredDocuments.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No documents match your search</p>
          </div>
        ) : (
          filteredDocuments.map((doc) => {
            const FileIcon = getFileIcon(doc.fileType);
            const category = doc.category as DocumentCategory;

            return (
              <div
                key={doc.id}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
              >
                {/* Icon */}
                <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
                  <FileIcon className="h-6 w-6 text-gray-500" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{doc.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {category && CATEGORY_CONFIG[category] && (
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${CATEGORY_CONFIG[category].color}`}>
                        {CATEGORY_CONFIG[category].label}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      {doc.createdAt && new Date(doc.createdAt).toLocaleDateString()}
                    </span>
                    {doc.fileSize && (
                      <span className="text-xs text-gray-400">
                        {formatFileSize(doc.fileSize)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {canPreview(doc) && (
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      title="Preview"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDownload(doc)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    title="Download"
                  >
                    <ArrowDownTrayIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-medium text-gray-900 truncate pr-4">{previewDoc.name}</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(previewDoc)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-4 bg-gray-100">
              {previewDoc.fileType?.includes('pdf') ? (
                <iframe
                  src={previewDoc.url}
                  className="w-full h-full min-h-[60vh] rounded"
                  title={previewDoc.name}
                />
              ) : previewDoc.fileType?.includes('image') ? (
                <Image
                  src={previewDoc.url || ''}
                  alt={previewDoc.name}
                  width={800}
                  height={600}
                  className="max-w-full max-h-[70vh] mx-auto rounded"
                />
              ) : (
                <div className="flex items-center justify-center h-64">
                  <p className="text-gray-500">Preview not available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DocumentLibrary;
