'use client';

import React, { useState, useMemo } from 'react';
import {
  MaterialCategory,
  MaterialCategoryGroup,
  MATERIAL_CATEGORIES,
  MATERIAL_CATEGORY_GROUPS,
  getMaterialCategoriesByGroup,
} from '@/types';
import { ChevronDownIcon, PlusIcon } from '@heroicons/react/24/outline';

interface CategorySelectProps {
  value: MaterialCategory | string;
  onChange: (value: MaterialCategory | string, customLabel?: string) => void;
  customCategory?: string;
  onCustomCategoryChange?: (value: string) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export default function CategorySelect({
  value,
  onChange,
  customCategory = '',
  onCustomCategoryChange,
  error,
  disabled = false,
  className = '',
}: CategorySelectProps) {
  const [showCustomInput, setShowCustomInput] = useState(value === 'custom');
  const categoriesByGroup = useMemo(() => getMaterialCategoriesByGroup(), []);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value as MaterialCategory;
    onChange(newValue);
    setShowCustomInput(newValue === 'custom');
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onCustomCategoryChange) {
      onCustomCategoryChange(e.target.value);
    }
  };

  const getSelectedLabel = () => {
    if (value === 'custom' && customCategory) {
      return customCategory;
    }
    const category = MATERIAL_CATEGORIES.find((c) => c.value === value);
    return category?.label || 'Select category...';
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Category <span className="text-red-500">*</span>
      </label>

      {/* Grouped Select */}
      <select
        value={value}
        onChange={handleCategoryChange}
        disabled={disabled}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:bg-gray-50 disabled:cursor-not-allowed"
      >
        <option value="">Select category...</option>

        {MATERIAL_CATEGORY_GROUPS.map((group) => {
          const groupCategories = categoriesByGroup[group.value];
          if (groupCategories.length === 0) return null;

          return (
            <optgroup key={group.value} label={`── ${group.label} ──`}>
              {groupCategories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </optgroup>
          );
        })}
      </select>

      {/* Custom Category Input */}
      {showCustomInput && (
        <div className="mt-2">
          <input
            type="text"
            value={customCategory}
            onChange={handleCustomChange}
            placeholder="Enter custom category name..."
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
          />
          <p className="mt-1 text-xs text-gray-500">
            Custom categories help you organize materials specific to your business.
          </p>
        </div>
      )}

      {/* Category Description */}
      {value && value !== 'custom' && (
        <p className="mt-1 text-xs text-gray-500">
          {MATERIAL_CATEGORIES.find((c) => c.value === value)?.description}
        </p>
      )}

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

/**
 * Suggested categories based on project type
 */
export function getSuggestedCategories(projectType?: string): MaterialCategory[] {
  switch (projectType?.toLowerCase()) {
    case 'new_construction':
    case 'new construction':
      return ['lumber', 'framing', 'concrete', 'electrical', 'plumbing', 'hvac', 'roofing', 'drywall', 'insulation'];
    case 'remodel':
    case 'renovation':
      return ['drywall', 'paint', 'flooring', 'cabinets', 'countertops', 'fixtures', 'trim_molding', 'tile'];
    case 'addition':
      return ['lumber', 'framing', 'roofing', 'siding', 'windows', 'electrical', 'plumbing', 'drywall'];
    case 'kitchen':
    case 'kitchen_remodel':
      return ['cabinets', 'countertops', 'fixtures', 'appliances', 'tile', 'lighting', 'plumbing', 'flooring'];
    case 'bathroom':
    case 'bathroom_remodel':
      return ['tile', 'fixtures', 'plumbing', 'cabinets', 'countertops', 'ventilation', 'lighting', 'paint'];
    case 'roofing':
      return ['roofing', 'gutters', 'ventilation', 'fasteners', 'adhesives_sealants', 'lumber'];
    case 'electrical':
      return ['wiring', 'electrical_panels', 'switches_outlets', 'lighting', 'electrical'];
    case 'plumbing':
      return ['pipes_fittings', 'fixtures', 'water_heaters', 'drainage', 'plumbing'];
    case 'hvac':
      return ['ductwork', 'hvac_equipment', 'ventilation', 'hvac'];
    case 'deck':
    case 'outdoor':
      return ['decking', 'lumber', 'fasteners', 'hardware', 'landscaping', 'fencing'];
    case 'landscaping':
      return ['landscaping', 'irrigation', 'pavers', 'grading', 'fencing'];
    case 'painting':
      return ['paint', 'trim_molding', 'drywall', 'adhesives_sealants'];
    default:
      // Most common categories
      return ['lumber', 'electrical', 'plumbing', 'drywall', 'paint', 'flooring', 'hardware', 'fasteners'];
  }
}
