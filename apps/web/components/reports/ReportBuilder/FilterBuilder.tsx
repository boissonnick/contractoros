'use client';

import React, { useMemo } from 'react';
import { PlusIcon, XMarkIcon, FunnelIcon } from '@heroicons/react/24/outline';
import {
  DataSourceType,
  ReportFilter,
  FilterOperator,
  DATA_SOURCES,
  FILTER_OPERATOR_OPTIONS,
  FieldType,
} from '@/lib/reports/report-builder';
import { cn } from '@/lib/utils';

interface FilterBuilderProps {
  dataSource: DataSourceType;
  filters: ReportFilter[];
  onFiltersChange: (filters: ReportFilter[]) => void;
  disabled?: boolean;
}

export function FilterBuilder({
  dataSource,
  filters,
  onFiltersChange,
  disabled = false,
}: FilterBuilderProps) {
  const availableFields = useMemo(() => {
    const source = DATA_SOURCES[dataSource];
    return source?.fields.filter((f) => f.filterable) || [];
  }, [dataSource]);

  const addFilter = () => {
    if (disabled || availableFields.length === 0) return;

    const firstField = availableFields[0];
    const newFilter: ReportFilter = {
      id: `filter_${Date.now()}`,
      field: firstField.source,
      operator: 'equals',
      value: '',
    };

    onFiltersChange([...filters, newFilter]);
  };

  const removeFilter = (filterId: string) => {
    if (disabled) return;
    onFiltersChange(filters.filter((f) => f.id !== filterId));
  };

  const updateFilter = (filterId: string, updates: Partial<ReportFilter>) => {
    if (disabled) return;
    onFiltersChange(
      filters.map((f) => (f.id === filterId ? { ...f, ...updates } : f))
    );
  };

  const getFieldType = (fieldSource: string): FieldType => {
    const field = availableFields.find((f) => f.source === fieldSource);
    return field?.type || 'string';
  };

  const getOperatorsForField = (fieldSource: string) => {
    const fieldType = getFieldType(fieldSource);
    return FILTER_OPERATOR_OPTIONS.filter((op) => op.types.includes(fieldType));
  };

  const renderValueInput = (filter: ReportFilter) => {
    const fieldType = getFieldType(filter.field);
    const operator = filter.operator;

    // For isNull/isNotNull, no value input needed
    if (operator === 'isNull' || operator === 'isNotNull') {
      return null;
    }

    // For 'between' operator, show two inputs
    if (operator === 'between') {
      return (
        <div className="flex items-center gap-1">
          {fieldType === 'date' ? (
            <>
              <input
                type="date"
                value={filter.value ? String(filter.value) : ''}
                onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                disabled={disabled}
                className="flex-1 text-sm border border-gray-200 rounded px-2 py-1"
              />
              <span className="text-gray-400 text-xs">to</span>
              <input
                type="date"
                value={filter.value2 ? String(filter.value2) : ''}
                onChange={(e) => updateFilter(filter.id, { value2: e.target.value })}
                disabled={disabled}
                className="flex-1 text-sm border border-gray-200 rounded px-2 py-1"
              />
            </>
          ) : (
            <>
              <input
                type="number"
                value={filter.value !== undefined ? String(filter.value) : ''}
                onChange={(e) => updateFilter(filter.id, { value: e.target.valueAsNumber || 0 })}
                disabled={disabled}
                placeholder="Min"
                className="w-20 text-sm border border-gray-200 rounded px-2 py-1"
              />
              <span className="text-gray-400 text-xs">to</span>
              <input
                type="number"
                value={filter.value2 !== undefined ? String(filter.value2) : ''}
                onChange={(e) => updateFilter(filter.id, { value2: e.target.valueAsNumber || 0 })}
                disabled={disabled}
                placeholder="Max"
                className="w-20 text-sm border border-gray-200 rounded px-2 py-1"
              />
            </>
          )}
        </div>
      );
    }

    // For 'in' operator, show text input (comma-separated)
    if (operator === 'in') {
      return (
        <input
          type="text"
          value={Array.isArray(filter.value) ? filter.value.join(', ') : String(filter.value || '')}
          onChange={(e) => {
            const values = e.target.value.split(',').map((v) => v.trim()).filter(Boolean);
            updateFilter(filter.id, { value: values });
          }}
          disabled={disabled}
          placeholder="Value1, Value2, ..."
          className="flex-1 text-sm border border-gray-200 rounded px-2 py-1"
        />
      );
    }

    // Standard inputs based on field type
    switch (fieldType) {
      case 'date':
        return (
          <input
            type="date"
            value={filter.value ? String(filter.value) : ''}
            onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
            disabled={disabled}
            className="flex-1 text-sm border border-gray-200 rounded px-2 py-1"
          />
        );
      case 'number':
      case 'currency':
        return (
          <input
            type="number"
            value={filter.value !== undefined ? String(filter.value) : ''}
            onChange={(e) => updateFilter(filter.id, { value: e.target.valueAsNumber || 0 })}
            disabled={disabled}
            placeholder="Enter value"
            className="flex-1 text-sm border border-gray-200 rounded px-2 py-1"
          />
        );
      case 'boolean':
        return (
          <select
            value={filter.value === true ? 'true' : filter.value === false ? 'false' : ''}
            onChange={(e) => updateFilter(filter.id, { value: e.target.value === 'true' })}
            disabled={disabled}
            className="flex-1 text-sm border border-gray-200 rounded px-2 py-1"
          >
            <option value="">Select...</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        );
      default:
        return (
          <input
            type="text"
            value={filter.value !== undefined ? String(filter.value) : ''}
            onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
            disabled={disabled}
            placeholder="Enter value"
            className="flex-1 text-sm border border-gray-200 rounded px-2 py-1"
          />
        );
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Filters
        </label>
        <button
          type="button"
          onClick={addFilter}
          disabled={disabled || availableFields.length === 0}
          className={cn(
            'flex items-center gap-1 text-sm text-brand-primary hover:text-brand-primary-dark transition-colors',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <PlusIcon className="h-4 w-4" />
          Add Filter
        </button>
      </div>

      {filters.length === 0 ? (
        <div className="bg-gray-50 rounded-lg border border-dashed border-gray-300 p-4 text-center">
          <FunnelIcon className="h-6 w-6 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">
            No filters applied. Click &quot;Add Filter&quot; to narrow your results.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filters.map((filter, index) => {
            const operators = getOperatorsForField(filter.field);

            return (
              <div
                key={filter.id}
                className="flex flex-wrap items-center gap-2 bg-gray-50 rounded-lg border border-gray-200 p-2"
              >
                {index > 0 && (
                  <span className="text-xs font-medium text-gray-500 uppercase">
                    AND
                  </span>
                )}

                {/* Field selector */}
                <select
                  value={filter.field}
                  onChange={(e) => {
                    const newOperators = getOperatorsForField(e.target.value);
                    const currentOpValid = newOperators.some((op) => op.value === filter.operator);
                    updateFilter(filter.id, {
                      field: e.target.value,
                      operator: currentOpValid ? filter.operator : 'equals',
                      value: '',
                      value2: undefined,
                    });
                  }}
                  disabled={disabled}
                  className="text-sm border border-gray-200 rounded px-2 py-1 bg-white"
                >
                  {availableFields.map((field) => (
                    <option key={field.id} value={field.source}>
                      {field.label}
                    </option>
                  ))}
                </select>

                {/* Operator selector */}
                <select
                  value={filter.operator}
                  onChange={(e) =>
                    updateFilter(filter.id, {
                      operator: e.target.value as FilterOperator,
                      value: '',
                      value2: undefined,
                    })
                  }
                  disabled={disabled}
                  className="text-sm border border-gray-200 rounded px-2 py-1 bg-white"
                >
                  {operators.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>

                {/* Value input */}
                {renderValueInput(filter)}

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeFilter(filter.id)}
                  disabled={disabled}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors ml-auto"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default FilterBuilder;
