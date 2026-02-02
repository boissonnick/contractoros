'use client';

import React from 'react';
import {
  CurrencyDollarIcon,
  FolderIcon,
  ClipboardDocumentListIcon,
  BellIcon,
  CalendarIcon,
  BoltIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { WidgetType, WidgetDefinition } from '@/lib/dashboard-widgets/types';
import { getAvailableWidgets } from '@/lib/dashboard-widgets/widget-registry';

interface AddWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWidget: (type: WidgetType) => void;
  existingWidgetTypes: WidgetType[];
}

// Icon mapping
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  CurrencyDollarIcon,
  FolderIcon,
  ClipboardDocumentListIcon,
  BellIcon,
  CalendarIcon,
  BoltIcon,
};

function getIcon(iconName: string): React.ComponentType<{ className?: string }> {
  return ICON_MAP[iconName] || FolderIcon;
}

export function AddWidgetModal({
  isOpen,
  onClose,
  onAddWidget,
  existingWidgetTypes,
}: AddWidgetModalProps) {
  if (!isOpen) return null;

  const availableWidgets = getAvailableWidgets();

  const handleAddWidget = (type: WidgetType) => {
    onAddWidget(type);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-25 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Add Widget</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <p className="text-sm text-gray-600 mb-4">
              Select a widget to add to your dashboard
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {availableWidgets.map((widget) => {
                const Icon = getIcon(widget.icon);
                const isAlreadyAdded = existingWidgetTypes.includes(widget.type);

                return (
                  <button
                    key={widget.type}
                    onClick={() => !isAlreadyAdded && handleAddWidget(widget.type)}
                    disabled={isAlreadyAdded}
                    className={`
                      text-left p-4 rounded-lg border-2 transition-all
                      ${
                        isAlreadyAdded
                          ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                          : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer'
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`
                          p-2 rounded-lg
                          ${isAlreadyAdded ? 'bg-gray-200' : 'bg-blue-100'}
                        `}
                      >
                        <Icon
                          className={`
                            h-5 w-5
                            ${isAlreadyAdded ? 'text-gray-400' : 'text-blue-600'}
                          `}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-gray-900">
                            {widget.title}
                          </h3>
                          {isAlreadyAdded && (
                            <span className="text-xs text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">
                              Added
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {widget.description}
                        </p>
                        <div className="mt-2">
                          <span className="text-xs text-gray-400">
                            Size: {widget.defaultSize}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddWidgetModal;
