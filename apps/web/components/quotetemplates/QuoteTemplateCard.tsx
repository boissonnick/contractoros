'use client';

import { useState } from 'react';
import {
  DocumentDuplicateIcon,
  PencilIcon,
  TrashIcon,
  StarIcon,
  EllipsisVerticalIcon,
  CheckIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import Badge from '@/components/ui/Badge';
import { QuotePdfTemplate, QUOTE_PDF_LAYOUTS } from '@/types';
import { formatRelative } from '@/lib/date-utils';

interface QuoteTemplateCardProps {
  template: QuotePdfTemplate;
  onEdit: (template: QuotePdfTemplate) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onSetDefault: (id: string) => void;
}

export function QuoteTemplateCard({
  template,
  onEdit,
  onDelete,
  onDuplicate,
  onSetDefault,
}: QuoteTemplateCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const layoutInfo = QUOTE_PDF_LAYOUTS.find((l) => l.value === template.layout);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      {/* Color Preview Header */}
      <div
        className="h-16 rounded-t-lg relative overflow-hidden"
        style={{ backgroundColor: template.primaryColor }}
      >
        {/* Pattern overlay for visual interest */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `linear-gradient(45deg, ${template.secondaryColor} 25%, transparent 25%),
                            linear-gradient(-45deg, ${template.secondaryColor} 25%, transparent 25%),
                            linear-gradient(45deg, transparent 75%, ${template.secondaryColor} 75%),
                            linear-gradient(-45deg, transparent 75%, ${template.secondaryColor} 75%)`,
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
          }}
        />

        {/* Default badge */}
        {template.isDefault && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-white/90 rounded px-2 py-0.5 text-xs font-medium text-gray-700">
            <StarIconSolid className="h-3 w-3 text-yellow-500" />
            Default
          </div>
        )}

        {/* Layout badge */}
        <div className="absolute top-2 right-2 bg-black/30 rounded px-2 py-0.5 text-xs font-medium text-white">
          {layoutInfo?.label || 'Custom'}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{template.name}</h3>
            {template.description && (
              <p className="text-sm text-gray-500 truncate">{template.description}</p>
            )}
          </div>

          {/* Menu */}
          <div className="relative ml-2">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded hover:bg-gray-100"
            >
              <EllipsisVerticalIcon className="h-5 w-5 text-gray-400" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        onEdit(template);
                        setShowMenu(false);
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <PencilIcon className="h-4 w-4" />
                      Edit Template
                    </button>
                    <button
                      onClick={() => {
                        onDuplicate(template.id);
                        setShowMenu(false);
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <DocumentDuplicateIcon className="h-4 w-4" />
                      Duplicate
                    </button>
                    {!template.isDefault && (
                      <button
                        onClick={() => {
                          onSetDefault(template.id);
                          setShowMenu(false);
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        <StarIcon className="h-4 w-4" />
                        Set as Default
                      </button>
                    )}
                    {!template.isDefault && (
                      <button
                        onClick={() => {
                          onDelete(template.id);
                          setShowMenu(false);
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                      >
                        <TrashIcon className="h-4 w-4" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Template Details */}
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge variant="default" className="text-xs">
            {template.font}
          </Badge>
          <Badge variant="default" className="text-xs">
            {template.headerStyle.replace(/-/g, ' ')}
          </Badge>
        </div>

        {/* Color Swatches */}
        <div className="flex items-center gap-1 mt-3">
          <div
            className="h-5 w-5 rounded-full border border-gray-200"
            style={{ backgroundColor: template.primaryColor }}
            title="Primary"
          />
          <div
            className="h-5 w-5 rounded-full border border-gray-200"
            style={{ backgroundColor: template.secondaryColor }}
            title="Secondary"
          />
          <div
            className="h-5 w-5 rounded-full border border-gray-200"
            style={{ backgroundColor: template.textColor }}
            title="Text"
          />
          <div
            className="h-5 w-5 rounded-full border border-gray-200"
            style={{ backgroundColor: template.tableHeaderBg }}
            title="Table Header"
          />
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <DocumentTextIcon className="h-3.5 w-3.5" />
            {template.usageCount} uses
          </span>
          {template.lastUsedAt && (
            <span>Last used {formatRelative(template.lastUsedAt)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
