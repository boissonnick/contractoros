/**
 * Maps expense categories to job costing cost categories.
 * ExpenseCategory (from expense tracking) → CostCategory (for profitability).
 */

export type CostCategory =
  | 'labor_internal'
  | 'labor_subcontractor'
  | 'materials'
  | 'equipment_rental'
  | 'permits_fees'
  | 'overhead'
  | 'other';

const EXPENSE_TO_COST_CATEGORY: Record<string, CostCategory> = {
  materials: 'materials',
  tools: 'materials',
  subcontractor: 'labor_subcontractor',
  equipment_rental: 'equipment_rental',
  permits: 'permits_fees',
  labor: 'labor_internal',
  office: 'overhead',
  insurance: 'overhead',
  utilities: 'overhead',
  marketing: 'overhead',
  fuel: 'other',
  vehicle: 'other',
  travel: 'other',
  meals: 'other',
  other: 'other',
};

export function mapExpenseCategory(expenseCategory: string): CostCategory {
  return EXPENSE_TO_COST_CATEGORY[expenseCategory] || 'other';
}
