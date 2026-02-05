'use client';

import React from 'react';
import {
  ColumnMapping,
  ImportTarget,
  IMPORT_FIELD_DEFINITIONS,
} from '@/lib/import/types';
import {
  getAvailableFields,
  getUnmappedRequiredFields,
} from '@/lib/import/column-mapper';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

interface ColumnMapperProps {
  mappings: ColumnMapping[];
  target: ImportTarget;
  onMappingChange: (sourceColumn: string, targetField: string) => void;
  sampleData?: Record<string, string>; // First row of data for preview
}

export function ColumnMapper({
  mappings,
  target,
  onMappingChange,
  sampleData = {},
}: ColumnMapperProps) {
  const fields = IMPORT_FIELD_DEFINITIONS[target];
  const unmappedRequired = getUnmappedRequiredFields(mappings, target);
  const availableFields = getAvailableFields(mappings, target);

  return (
    <div className="space-y-6">
      {/* Required fields warning */}
      {unmappedRequired.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <ExclamationCircleIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                Missing required fields
              </p>
              <p className="text-sm text-amber-700 mt-1">
                Please map the following required fields:{' '}
                {unmappedRequired.map(f => f.label).join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mapping table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                CSV Column
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12">

              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Maps To
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sample Value
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {mappings.map((mapping, index) => {
              const isMapped = Boolean(mapping.targetField);
              const isRequired = mapping.required;
              const field = fields.find(f => f.name === mapping.targetField);

              return (
                <tr
                  key={index}
                  className={!isMapped && isRequired ? 'bg-red-50' : ''}
                >
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-gray-900">
                      {mapping.sourceColumn}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ArrowRightIcon className="h-4 w-4 text-gray-400 mx-auto" />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={mapping.targetField}
                      onChange={(e) => onMappingChange(mapping.sourceColumn, e.target.value)}
                      className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-brand-primary/20 focus:border-brand-primary"
                    >
                      <option value="">-- Skip this column --</option>
                      {/* Show current selection if mapped */}
                      {field && (
                        <option value={field.name}>
                          {field.label} {field.required ? '*' : ''}
                        </option>
                      )}
                      {/* Show available fields */}
                      {availableFields.map((f) => (
                        <option key={f.name} value={f.name}>
                          {f.label} {f.required ? '*' : ''}
                        </option>
                      ))}
                    </select>
                    {field?.description && (
                      <p className="text-xs text-gray-500 mt-1">{field.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-500 truncate block max-w-[200px]">
                      {sampleData[mapping.sourceColumn] || (
                        <span className="text-gray-300 italic">empty</span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {isMapped ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mx-auto" />
                    ) : (
                      <span className="text-xs text-gray-400">Skip</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="text-red-500">*</span> Required field
        </span>
        <span className="flex items-center gap-1">
          <CheckCircleIcon className="h-4 w-4 text-green-500" />
          Mapped
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-4 h-4 bg-red-100 rounded"></span>
          Missing required mapping
        </span>
      </div>
    </div>
  );
}

export default ColumnMapper;
