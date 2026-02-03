'use client';

import React, { useState, useMemo } from 'react';
import {
  PlusIcon,
  XMarkIcon,
  Bars3Icon,
  HashtagIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import {
  DataSourceType,
  DataSourceField,
  ReportField,
  DATA_SOURCES,
  AggregationType,
  AGGREGATION_OPTIONS,
  FieldType,
} from '@/lib/reports/report-builder';
import { cn } from '@/lib/utils';

interface FieldSelectorProps {
  dataSource: DataSourceType;
  selectedFields: ReportField[];
  onFieldsChange: (fields: ReportField[]) => void;
  disabled?: boolean;
}

const FIELD_TYPE_ICONS: Record<FieldType, React.ElementType> = {
  string: Bars3Icon,
  number: HashtagIcon,
  date: CalendarIcon,
  currency: CurrencyDollarIcon,
  boolean: CheckCircleIcon,
};

export function FieldSelector({
  dataSource,
  selectedFields,
  onFieldsChange,
  disabled = false,
}: FieldSelectorProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const availableFields = useMemo(() => {
    const source = DATA_SOURCES[dataSource];
    return source?.fields || [];
  }, [dataSource]);

  const groupedFields = useMemo(() => {
    const groups: Record<string, DataSourceField[]> = {};
    for (const field of availableFields) {
      const category = field.category || 'Other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(field);
    }
    return groups;
  }, [availableFields]);

  const selectedFieldIds = useMemo(
    () => new Set(selectedFields.map((f) => f.id)),
    [selectedFields]
  );

  const addField = (field: DataSourceField) => {
    if (selectedFieldIds.has(field.id) || disabled) return;

    const newField: ReportField = {
      id: field.id,
      source: field.source,
      label: field.label,
      type: field.type,
      aggregation: undefined,
    };

    onFieldsChange([...selectedFields, newField]);
  };

  const removeField = (fieldId: string) => {
    if (disabled) return;
    onFieldsChange(selectedFields.filter((f) => f.id !== fieldId));
  };

  const updateFieldAggregation = (fieldId: string, aggregation: AggregationType) => {
    if (disabled) return;
    onFieldsChange(
      selectedFields.map((f) =>
        f.id === fieldId ? { ...f, aggregation: aggregation === 'none' ? undefined : aggregation } : f
      )
    );
  };

  const updateFieldLabel = (fieldId: string, label: string) => {
    if (disabled) return;
    onFieldsChange(
      selectedFields.map((f) =>
        f.id === fieldId ? { ...f, label } : f
      )
    );
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    if (disabled) return;
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index || disabled) return;

    const newFields = [...selectedFields];
    const [draggedField] = newFields.splice(draggedIndex, 1);
    newFields.splice(index, 0, draggedField);
    onFieldsChange(newFields);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-4">
      {/* Available Fields */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Available Fields
        </label>
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 max-h-64 overflow-y-auto">
          {Object.entries(groupedFields).map(([category, fields]) => (
            <div key={category} className="mb-3 last:mb-0">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                {category}
              </h4>
              <div className="space-y-1">
                {fields.map((field) => {
                  const Icon = FIELD_TYPE_ICONS[field.type];
                  const isSelected = selectedFieldIds.has(field.id);

                  return (
                    <button
                      key={field.id}
                      type="button"
                      onClick={() => addField(field)}
                      disabled={isSelected || disabled}
                      className={cn(
                        'w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left transition-colors',
                        isSelected
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-white hover:bg-brand-primary/5 text-gray-700 hover:text-brand-primary',
                        disabled && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{field.label}</span>
                      {!isSelected && (
                        <PlusIcon className="h-4 w-4 ml-auto flex-shrink-0 opacity-50" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Fields */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Selected Fields ({selectedFields.length})
        </label>
        {selectedFields.length === 0 ? (
          <div className="bg-gray-50 rounded-lg border border-dashed border-gray-300 p-4 text-center">
            <p className="text-sm text-gray-500">
              Click on fields above to add them to your report
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {selectedFields.map((field, index) => {
              const sourceField = availableFields.find((f) => f.id === field.id);
              const Icon = FIELD_TYPE_ICONS[field.type];
              const canAggregate = sourceField?.aggregatable;

              return (
                <div
                  key={field.id}
                  draggable={!disabled}
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    'flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-2',
                    draggedIndex === index && 'opacity-50',
                    !disabled && 'cursor-move'
                  )}
                >
                  <Bars3Icon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <Icon className="h-4 w-4 text-gray-500 flex-shrink-0" />

                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => updateFieldLabel(field.id, e.target.value)}
                    disabled={disabled}
                    className="flex-1 text-sm bg-transparent border-0 p-0 focus:ring-0 min-w-0"
                    placeholder="Field label"
                  />

                  {canAggregate && (
                    <select
                      value={field.aggregation || 'none'}
                      onChange={(e) =>
                        updateFieldAggregation(field.id, e.target.value as AggregationType)
                      }
                      disabled={disabled}
                      className="text-xs border border-gray-200 rounded px-1.5 py-1 bg-gray-50"
                    >
                      {AGGREGATION_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}

                  <button
                    type="button"
                    onClick={() => removeField(field.id)}
                    disabled={disabled}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default FieldSelector;
