/**
 * Column Mapper
 *
 * Auto-detects and suggests column mappings based on header names.
 * Handles fuzzy matching and common aliases.
 */

import {
  ColumnMapping,
  FieldDefinition,
  ImportTarget,
  IMPORT_FIELD_DEFINITIONS,
  HEADER_ALIASES,
  ColumnDataType,
} from './types';

/**
 * Calculate similarity between two strings (Levenshtein distance based)
 */
function stringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    return 0.8;
  }

  // Levenshtein distance
  const matrix: number[][] = [];

  for (let i = 0; i <= s1.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s2.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  const distance = matrix[s1.length][s2.length];
  const maxLength = Math.max(s1.length, s2.length);

  return 1 - distance / maxLength;
}

/**
 * Find the best matching field for a CSV header
 */
export function findBestMatch(
  header: string,
  target: ImportTarget
): { field: FieldDefinition | null; confidence: number } {
  const normalizedHeader = header.toLowerCase().trim();
  const fields = IMPORT_FIELD_DEFINITIONS[target];

  let bestMatch: FieldDefinition | null = null;
  let bestConfidence = 0;

  // First, check exact matches with aliases
  for (const [fieldName, aliases] of Object.entries(HEADER_ALIASES)) {
    if (aliases.some(alias => alias.toLowerCase() === normalizedHeader)) {
      const field = fields.find(f => f.name === fieldName);
      if (field) {
        return { field, confidence: 1 };
      }
    }
  }

  // Then, check similarity with field names and labels
  for (const field of fields) {
    // Check similarity with field name
    const nameSimlarity = stringSimilarity(normalizedHeader, field.name);
    if (nameSimlarity > bestConfidence) {
      bestConfidence = nameSimlarity;
      bestMatch = field;
    }

    // Check similarity with label
    const labelSimilarity = stringSimilarity(normalizedHeader, field.label);
    if (labelSimilarity > bestConfidence) {
      bestConfidence = labelSimilarity;
      bestMatch = field;
    }

    // Check aliases
    const aliases = HEADER_ALIASES[field.name] || [];
    for (const alias of aliases) {
      const aliasSimilarity = stringSimilarity(normalizedHeader, alias);
      if (aliasSimilarity > bestConfidence) {
        bestConfidence = aliasSimilarity;
        bestMatch = field;
      }
    }
  }

  // Only return matches with reasonable confidence
  if (bestConfidence < 0.5) {
    return { field: null, confidence: 0 };
  }

  return { field: bestMatch, confidence: bestConfidence };
}

/**
 * Generate suggested column mappings for CSV headers
 */
export function generateMappings(
  headers: string[],
  target: ImportTarget
): ColumnMapping[] {
  const _fields = IMPORT_FIELD_DEFINITIONS[target];
  const usedFields = new Set<string>();
  const mappings: ColumnMapping[] = [];

  // First pass: Find best matches for each header
  const matches = headers.map(header => {
    const match = findBestMatch(header, target);
    return { header, ...match };
  });

  // Sort by confidence (highest first)
  matches.sort((a, b) => b.confidence - a.confidence);

  // Assign mappings, avoiding duplicates
  for (const match of matches) {
    if (match.field && !usedFields.has(match.field.name) && match.confidence >= 0.5) {
      usedFields.add(match.field.name);
      mappings.push({
        sourceColumn: match.header,
        targetField: match.field.name,
        dataType: match.field.type,
        required: match.field.required,
        enumValues: match.field.enumValues,
      });
    } else {
      // No match found, add unmapped column
      mappings.push({
        sourceColumn: match.header,
        targetField: '',
        dataType: 'string',
        required: false,
      });
    }
  }

  // Re-sort to match original header order
  const headerOrder = new Map(headers.map((h, i) => [h, i]));
  mappings.sort((a, b) => (headerOrder.get(a.sourceColumn) ?? 0) - (headerOrder.get(b.sourceColumn) ?? 0));

  return mappings;
}

/**
 * Get unmapped required fields
 */
export function getUnmappedRequiredFields(
  mappings: ColumnMapping[],
  target: ImportTarget
): FieldDefinition[] {
  const fields = IMPORT_FIELD_DEFINITIONS[target];
  const mappedFields = new Set(mappings.map(m => m.targetField));

  return fields.filter(f => f.required && !mappedFields.has(f.name));
}

/**
 * Get available fields that haven't been mapped yet
 */
export function getAvailableFields(
  mappings: ColumnMapping[],
  target: ImportTarget
): FieldDefinition[] {
  const fields = IMPORT_FIELD_DEFINITIONS[target];
  const mappedFields = new Set(mappings.map(m => m.targetField));

  return fields.filter(f => !mappedFields.has(f.name));
}

/**
 * Update a mapping's target field
 */
export function updateMapping(
  mappings: ColumnMapping[],
  sourceColumn: string,
  targetField: string,
  target: ImportTarget
): ColumnMapping[] {
  const fields = IMPORT_FIELD_DEFINITIONS[target];
  const field = fields.find(f => f.name === targetField);

  return mappings.map(m => {
    if (m.sourceColumn === sourceColumn) {
      return {
        ...m,
        targetField,
        dataType: field?.type || 'string',
        required: field?.required || false,
        enumValues: field?.enumValues,
      };
    }
    // Clear any other mapping that had this target field
    if (targetField && m.targetField === targetField) {
      return {
        ...m,
        targetField: '',
        dataType: 'string' as ColumnDataType,
        required: false,
        enumValues: undefined,
      };
    }
    return m;
  });
}

/**
 * Validate that all required fields are mapped
 */
export function validateMappings(
  mappings: ColumnMapping[],
  target: ImportTarget
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const unmappedRequired = getUnmappedRequiredFields(mappings, target);

  if (unmappedRequired.length > 0) {
    errors.push(`Missing required fields: ${unmappedRequired.map(f => f.label).join(', ')}`);
  }

  // Check for duplicate mappings
  const mappedTargets = mappings.filter(m => m.targetField).map(m => m.targetField);
  const duplicates = mappedTargets.filter((t, i) => mappedTargets.indexOf(t) !== i);
  if (duplicates.length > 0) {
    errors.push(`Duplicate mappings for: ${Array.from(new Set(duplicates)).join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
