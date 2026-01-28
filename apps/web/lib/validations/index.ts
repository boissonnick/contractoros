import { z } from 'zod';

// Common validation patterns
export const emailSchema = z.string().email('Please enter a valid email address');
export const phoneSchema = z.string().regex(/^[\d\s\-+()]*$/, 'Please enter a valid phone number').optional().or(z.literal(''));
export const requiredString = z.string().min(1, 'This field is required');
export const optionalString = z.string().optional().or(z.literal(''));

// Auth schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: requiredString.min(2, 'Name must be at least 2 characters'),
  email: emailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});
export type RegisterFormData = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// Company / Organization schemas
export const companySetupSchema = z.object({
  companyName: requiredString.min(2, 'Company name must be at least 2 characters'),
  companyPhone: phoneSchema,
  companyEmail: emailSchema.optional().or(z.literal('')),
  companyAddress: optionalString,
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Please enter a valid hex color'),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Please enter a valid hex color'),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Please enter a valid hex color'),
});
export type CompanySetupFormData = z.infer<typeof companySetupSchema>;

// Project schemas
export const projectSchema = z.object({
  name: requiredString.min(2, 'Project name must be at least 2 characters'),
  description: optionalString,
  clientName: optionalString,
  clientEmail: emailSchema.optional().or(z.literal('')),
  clientPhone: phoneSchema,
  address: optionalString,
  city: optionalString,
  state: optionalString,
  zip: optionalString,
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budget: z.coerce.number().min(0, 'Budget must be positive').optional(),
  status: z.enum(['lead', 'bidding', 'planning', 'active', 'on_hold', 'completed', 'cancelled']).default('planning'),
});
export type ProjectFormData = z.infer<typeof projectSchema>;

// Task schemas
export const taskSchema = z.object({
  title: requiredString.min(2, 'Task title must be at least 2 characters'),
  description: optionalString,
  status: z.enum(['pending', 'assigned', 'in_progress', 'blocked', 'review', 'completed']).default('pending'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  assigneeId: optionalString,
  dueDate: z.string().optional(),
  estimatedHours: z.coerce.number().min(0).optional(),
  phaseId: optionalString,
});
export type TaskFormData = z.infer<typeof taskSchema>;

// Time entry schemas
export const timeEntrySchema = z.object({
  projectId: requiredString,
  taskId: optionalString,
  description: optionalString,
  hours: z.coerce.number().min(0.25, 'Minimum 15 minutes').max(24, 'Maximum 24 hours'),
  date: z.string(),
  billable: z.boolean().default(true),
});
export type TimeEntryFormData = z.infer<typeof timeEntrySchema>;

// Invite schemas
export const inviteSchema = z.object({
  name: requiredString.min(2, 'Name must be at least 2 characters'),
  email: emailSchema,
  role: z.enum(['PM', 'EMPLOYEE', 'CONTRACTOR', 'SUB', 'CLIENT']),
  message: optionalString,
});
export type InviteFormData = z.infer<typeof inviteSchema>;

// Subcontractor schemas
export const subcontractorSchema = z.object({
  companyName: requiredString.min(2, 'Company name must be at least 2 characters'),
  contactName: requiredString.min(2, 'Contact name must be at least 2 characters'),
  email: emailSchema,
  phone: phoneSchema,
  trade: requiredString,
  licenseNumber: optionalString,
  insuranceExpiry: z.string().optional(),
  notes: optionalString,
});
export type SubcontractorFormData = z.infer<typeof subcontractorSchema>;

// Change order schemas
export const changeOrderSchema = z.object({
  title: requiredString.min(2, 'Title must be at least 2 characters'),
  description: requiredString.min(10, 'Please provide a detailed description'),
  reason: z.enum(['client_request', 'unforeseen_conditions', 'design_change', 'code_requirement', 'other']),
  costImpact: z.coerce.number(),
  scheduleImpact: z.coerce.number().int().min(-365).max(365).default(0),
});
export type ChangeOrderFormData = z.infer<typeof changeOrderSchema>;

// Daily log schemas
export const dailyLogSchema = z.object({
  date: z.string(),
  weather: z.enum(['sunny', 'cloudy', 'rainy', 'stormy']).default('sunny'),
  temperature: z.coerce.number().optional(),
  workerCount: z.coerce.number().int().min(0).default(0),
  workPerformed: requiredString.min(10, 'Please describe work performed'),
  materialsUsed: optionalString,
  equipmentUsed: optionalString,
  delays: optionalString,
  safetyNotes: optionalString,
});
export type DailyLogFormData = z.infer<typeof dailyLogSchema>;

// Estimate / Quote schemas
export const estimateLineItemSchema = z.object({
  description: requiredString,
  quantity: z.coerce.number().min(0.01, 'Quantity must be greater than 0'),
  unit: z.string().default('ea'),
  unitPrice: z.coerce.number().min(0, 'Unit price must be positive'),
  category: z.enum(['labor', 'material', 'equipment', 'subcontractor', 'other']).default('material'),
});
export type EstimateLineItemFormData = z.infer<typeof estimateLineItemSchema>;

export const estimateSchema = z.object({
  name: requiredString.min(2, 'Estimate name must be at least 2 characters'),
  projectId: optionalString,
  validUntil: z.string().optional(),
  notes: optionalString,
  terms: optionalString,
  lineItems: z.array(estimateLineItemSchema).min(1, 'At least one line item is required'),
});
export type EstimateFormData = z.infer<typeof estimateSchema>;

// Invoice schemas
export const invoiceSchema = z.object({
  projectId: optionalString,
  number: requiredString,
  clientName: requiredString,
  clientEmail: z.string().email().optional().or(z.literal('')),
  dueDate: z.string(),
  type: z.enum(['standard', 'progress', 'aia_g702', 'deposit', 'final', 'change_order']).default('standard'),
  paymentTerms: z.string().default('Net 30'),
  taxRate: z.coerce.number().min(0).max(100).optional(),
  retainage: z.coerce.number().min(0).max(100).optional(),
  notes: optionalString,
});
export type InvoiceFormData = z.infer<typeof invoiceSchema>;

// Payroll config schemas
export const payrollConfigSchema = z.object({
  payPeriod: z.enum(['weekly', 'biweekly', 'semimonthly', 'monthly']).default('biweekly'),
  overtimeThreshold: z.coerce.number().min(0).max(168).default(40),
  overtimeMultiplier: z.coerce.number().min(1).max(3).default(1.5),
  payDayOfWeek: z.coerce.number().int().min(0).max(6).default(5),
});
export type PayrollConfigFormData = z.infer<typeof payrollConfigSchema>;
