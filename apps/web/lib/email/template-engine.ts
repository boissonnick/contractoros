/**
 * Email Template Engine
 * Handles variable substitution in email templates
 */

/**
 * Substitute template variables with actual values
 * Variables are in the format {{variableName}}
 *
 * @param template - The template string with {{variables}}
 * @param variables - Object with variable names as keys and values to substitute
 * @returns The template with all variables replaced
 *
 * @example
 * const result = substituteVariables(
 *   'Hello {{clientName}}, your invoice {{invoiceNumber}} is due.',
 *   { clientName: 'John', invoiceNumber: 'INV-001' }
 * );
 * // Returns: 'Hello John, your invoice INV-001 is due.'
 */
export function substituteVariables(
  template: string,
  variables: Record<string, string | number | undefined>
): string {
  if (!template) return '';

  let result = template;

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    result = result.replace(regex, value?.toString() ?? '');
  }

  return result;
}

/**
 * Extract all variable names from a template
 *
 * @param template - The template string
 * @returns Array of unique variable names found
 *
 * @example
 * const vars = extractVariables('Hello {{clientName}}, invoice {{invoiceNumber}}');
 * // Returns: ['clientName', 'invoiceNumber']
 */
export function extractVariables(template: string): string[] {
  if (!template) return [];

  const regex = /\{\{\s*(\w+)\s*\}\}/g;
  const variables = new Set<string>();
  let match;

  while ((match = regex.exec(template)) !== null) {
    variables.add(match[1]);
  }

  return Array.from(variables);
}

/**
 * Validate that all required variables are provided
 *
 * @param template - The template string
 * @param variables - Object with variable values
 * @returns Object with isValid and any missing variable names
 */
export function validateVariables(
  template: string,
  variables: Record<string, string | number | undefined>
): { isValid: boolean; missing: string[] } {
  const required = extractVariables(template);
  const provided = Object.keys(variables);
  const missing = required.filter((v) => !provided.includes(v) || !variables[v]);

  return {
    isValid: missing.length === 0,
    missing,
  };
}

/**
 * Preview a template with sample data
 *
 * @param template - The template string
 * @returns Template with sample values for all variables
 */
export function previewTemplate(template: string): string {
  const sampleData: Record<string, string> = {
    clientName: 'John Smith',
    clientEmail: 'john@example.com',
    projectName: 'Kitchen Renovation',
    projectAddress: '123 Main St, Anytown, ST 12345',
    invoiceNumber: 'INV-001',
    invoiceAmount: '$5,000.00',
    invoiceDueDate: 'March 15, 2026',
    estimateNumber: 'EST-001',
    estimateAmount: '$10,000.00',
    companyName: 'ABC Construction',
    companyPhone: '(555) 123-4567',
    companyEmail: 'info@abcconstruction.com',
    paymentLink: 'https://app.contractoros.com/pay/abc123',
    viewLink: 'https://app.contractoros.com/view/abc123',
  };

  return substituteVariables(template, sampleData);
}
