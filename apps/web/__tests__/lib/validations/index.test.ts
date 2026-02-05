import {
  emailSchema,
  phoneSchema,
  requiredString,
  optionalString,
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  companySetupSchema,
  projectSchema,
  taskSchema,
  timeEntrySchema,
  inviteSchema,
  subcontractorSchema,
  scopeChangeSchema,
  changeOrderSchema,
  dailyLogSchema,
  estimateLineItemSchema,
  estimateSchema,
  invoiceSchema,
  payrollConfigSchema,
} from '@/lib/validations';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Shorthand: assert parse succeeded and optionally check data */
function expectSuccess<T>(result: { success: boolean; data?: T }, expected?: Partial<T>) {
  expect(result.success).toBe(true);
  if (expected && result.success) {
    expect(result.data).toMatchObject(expected);
  }
}

/** Shorthand: assert parse failed and optionally check a specific field error */
function expectError(result: { success: boolean; error?: { issues: Array<{ path: (string | number)[]; message: string }> } }, path?: string, messagePart?: string) {
  expect(result.success).toBe(false);
  if (path && result.error) {
    const fieldErrors = result.error.issues.filter((i) => i.path.join('.') === path);
    expect(fieldErrors.length).toBeGreaterThan(0);
    if (messagePart) {
      expect(fieldErrors.some((e) => e.message.toLowerCase().includes(messagePart.toLowerCase()))).toBe(true);
    }
  }
}

// ===========================================================================
// Primitive / reusable schemas
// ===========================================================================

describe('emailSchema', () => {
  it('accepts a valid email', () => {
    expectSuccess(emailSchema.safeParse('user@example.com'));
  });

  it('rejects an empty string', () => {
    expectError(emailSchema.safeParse(''));
  });

  it('rejects a string without @', () => {
    const result = emailSchema.safeParse('not-an-email');
    expect(result.success).toBe(false);
  });

  it('rejects a string missing domain', () => {
    expectError(emailSchema.safeParse('user@'));
  });

  it('provides the correct error message', () => {
    const result = emailSchema.safeParse('bad');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Please enter a valid email address');
    }
  });
});

describe('phoneSchema', () => {
  it('accepts a valid US phone number', () => {
    expectSuccess(phoneSchema.safeParse('555-123-4567'));
  });

  it('accepts digits with spaces, parens, dashes, plus', () => {
    expectSuccess(phoneSchema.safeParse('+1 (555) 123-4567'));
  });

  it('accepts an empty string (optional)', () => {
    expectSuccess(phoneSchema.safeParse(''));
  });

  it('accepts undefined (optional)', () => {
    expectSuccess(phoneSchema.safeParse(undefined));
  });

  it('rejects letters', () => {
    const result = phoneSchema.safeParse('abc-def-ghij');
    expect(result.success).toBe(false);
  });

  it('rejects special characters not in the allowed set', () => {
    expectError(phoneSchema.safeParse('555@123#4567'));
  });
});

describe('requiredString', () => {
  it('accepts a non-empty string', () => {
    expectSuccess(requiredString.safeParse('hello'));
  });

  it('rejects an empty string', () => {
    const result = requiredString.safeParse('');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('This field is required');
    }
  });

  it('rejects undefined', () => {
    expectError(requiredString.safeParse(undefined));
  });
});

describe('optionalString', () => {
  it('accepts a non-empty string', () => {
    expectSuccess(optionalString.safeParse('hello'));
  });

  it('accepts an empty string', () => {
    expectSuccess(optionalString.safeParse(''));
  });

  it('accepts undefined', () => {
    expectSuccess(optionalString.safeParse(undefined));
  });
});

// ===========================================================================
// Auth schemas
// ===========================================================================

describe('loginSchema', () => {
  const valid = { email: 'user@example.com', password: 'secret123' };

  it('accepts valid credentials', () => {
    expectSuccess(loginSchema.safeParse(valid));
  });

  it('rejects missing email', () => {
    expectError(loginSchema.safeParse({ password: 'secret123' }), 'email');
  });

  it('rejects invalid email', () => {
    expectError(loginSchema.safeParse({ ...valid, email: 'bad' }), 'email');
  });

  it('rejects password shorter than 6 characters', () => {
    const result = loginSchema.safeParse({ ...valid, password: '12345' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const pwErr = result.error.issues.find((i) => i.path.includes('password'));
      expect(pwErr?.message).toBe('Password must be at least 6 characters');
    }
  });

  it('accepts exactly 6-character password', () => {
    expectSuccess(loginSchema.safeParse({ ...valid, password: '123456' }));
  });

  it('rejects missing password', () => {
    expectError(loginSchema.safeParse({ email: 'user@example.com' }), 'password');
  });
});

describe('registerSchema', () => {
  const valid = {
    name: 'Jane Doe',
    email: 'jane@example.com',
    password: 'password123',
    confirmPassword: 'password123',
  };

  it('accepts valid registration data', () => {
    expectSuccess(registerSchema.safeParse(valid));
  });

  it('rejects name shorter than 2 characters', () => {
    expectError(registerSchema.safeParse({ ...valid, name: 'J' }), 'name');
  });

  it('rejects empty name', () => {
    expectError(registerSchema.safeParse({ ...valid, name: '' }), 'name');
  });

  it('rejects invalid email', () => {
    expectError(registerSchema.safeParse({ ...valid, email: 'not-email' }), 'email');
  });

  it('rejects password shorter than 8 characters', () => {
    const result = registerSchema.safeParse({ ...valid, password: '1234567', confirmPassword: '1234567' });
    expect(result.success).toBe(false);
  });

  it('accepts exactly 8-character password', () => {
    expectSuccess(registerSchema.safeParse({ ...valid, password: '12345678', confirmPassword: '12345678' }));
  });

  it('rejects mismatched passwords', () => {
    const result = registerSchema.safeParse({ ...valid, confirmPassword: 'different123' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const matchErr = result.error.issues.find((i) => i.path.includes('confirmPassword'));
      expect(matchErr?.message).toBe("Passwords don't match");
    }
  });

  it('rejects missing confirmPassword', () => {
    expectError(registerSchema.safeParse({ name: 'Jane', email: 'jane@example.com', password: 'password123' }));
  });
});

describe('forgotPasswordSchema', () => {
  it('accepts valid email', () => {
    expectSuccess(forgotPasswordSchema.safeParse({ email: 'user@example.com' }));
  });

  it('rejects invalid email', () => {
    expectError(forgotPasswordSchema.safeParse({ email: 'bad' }), 'email');
  });

  it('rejects missing email', () => {
    expectError(forgotPasswordSchema.safeParse({}), 'email');
  });
});

// ===========================================================================
// Company / Organization schemas
// ===========================================================================

describe('companySetupSchema', () => {
  const valid = {
    companyName: 'Acme Construction',
    companyPhone: '555-123-4567',
    companyEmail: 'info@acme.com',
    companyAddress: '123 Main St',
    primaryColor: '#FF5500',
    secondaryColor: '#00AA33',
    accentColor: '#0055FF',
  };

  it('accepts valid company data', () => {
    expectSuccess(companySetupSchema.safeParse(valid));
  });

  it('rejects companyName shorter than 2 characters', () => {
    expectError(companySetupSchema.safeParse({ ...valid, companyName: 'A' }), 'companyName');
  });

  it('rejects empty companyName', () => {
    expectError(companySetupSchema.safeParse({ ...valid, companyName: '' }), 'companyName');
  });

  it('accepts optional empty companyPhone', () => {
    expectSuccess(companySetupSchema.safeParse({ ...valid, companyPhone: '' }));
  });

  it('accepts optional empty companyEmail', () => {
    expectSuccess(companySetupSchema.safeParse({ ...valid, companyEmail: '' }));
  });

  it('rejects invalid companyEmail when provided', () => {
    expectError(companySetupSchema.safeParse({ ...valid, companyEmail: 'not-email' }), 'companyEmail');
  });

  it('accepts optional empty companyAddress', () => {
    expectSuccess(companySetupSchema.safeParse({ ...valid, companyAddress: '' }));
  });

  it('rejects invalid hex color for primaryColor', () => {
    const result = companySetupSchema.safeParse({ ...valid, primaryColor: 'red' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const err = result.error.issues.find((i) => i.path.includes('primaryColor'));
      expect(err?.message).toBe('Please enter a valid hex color');
    }
  });

  it('rejects short hex color (3-digit)', () => {
    expectError(companySetupSchema.safeParse({ ...valid, primaryColor: '#F00' }), 'primaryColor');
  });

  it('rejects hex color without hash', () => {
    expectError(companySetupSchema.safeParse({ ...valid, secondaryColor: 'FF5500' }), 'secondaryColor');
  });

  it('accepts lowercase hex colors', () => {
    expectSuccess(companySetupSchema.safeParse({ ...valid, primaryColor: '#ff5500' }));
  });

  it('accepts mixed-case hex colors', () => {
    expectSuccess(companySetupSchema.safeParse({ ...valid, accentColor: '#aAbBcC' }));
  });
});

// ===========================================================================
// Project schema
// ===========================================================================

describe('projectSchema', () => {
  const valid = {
    name: 'Kitchen Remodel',
    description: 'Full kitchen renovation',
    clientName: 'John Smith',
    clientEmail: 'john@example.com',
    clientPhone: '555-000-1111',
    address: '456 Oak Ave',
    city: 'Portland',
    state: 'OR',
    zip: '97201',
    startDate: '2025-03-01',
    endDate: '2025-06-30',
    budget: 50000,
    status: 'active' as const,
  };

  it('accepts valid project data', () => {
    expectSuccess(projectSchema.safeParse(valid));
  });

  it('rejects name shorter than 2 characters', () => {
    expectError(projectSchema.safeParse({ ...valid, name: 'K' }), 'name');
  });

  it('rejects empty name', () => {
    expectError(projectSchema.safeParse({ ...valid, name: '' }), 'name');
  });

  it('applies default status of planning', () => {
    const { status, ...rest } = valid;
    const result = projectSchema.safeParse(rest);
    expectSuccess(result, { status: 'planning' });
  });

  it('accepts all valid status values', () => {
    const statuses = ['lead', 'bidding', 'planning', 'active', 'on_hold', 'completed', 'cancelled'] as const;
    for (const s of statuses) {
      expectSuccess(projectSchema.safeParse({ ...valid, status: s }));
    }
  });

  it('rejects invalid status', () => {
    expectError(projectSchema.safeParse({ ...valid, status: 'invalid' }), 'status');
  });

  it('accepts optional fields as empty strings', () => {
    expectSuccess(projectSchema.safeParse({
      ...valid,
      description: '',
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      address: '',
      city: '',
      state: '',
      zip: '',
    }));
  });

  it('accepts optional fields as undefined', () => {
    expectSuccess(projectSchema.safeParse({ name: 'Test Project' }));
  });

  it('coerces string budget to number', () => {
    const result = projectSchema.safeParse({ ...valid, budget: '25000' });
    expectSuccess(result, { budget: 25000 });
  });

  it('rejects negative budget', () => {
    expectError(projectSchema.safeParse({ ...valid, budget: -100 }), 'budget');
  });

  it('accepts zero budget', () => {
    expectSuccess(projectSchema.safeParse({ ...valid, budget: 0 }), { budget: 0 });
  });

  it('accepts budget as undefined (optional)', () => {
    const { budget, ...rest } = valid;
    expectSuccess(projectSchema.safeParse(rest));
  });
});

// ===========================================================================
// Task schema
// ===========================================================================

describe('taskSchema', () => {
  const valid = {
    title: 'Install cabinets',
    description: 'Upper and lower kitchen cabinets',
    status: 'in_progress' as const,
    priority: 'high' as const,
    assigneeId: 'user-123',
    dueDate: '2025-04-15',
    estimatedHours: 8,
    phaseId: 'phase-1',
  };

  it('accepts valid task data', () => {
    expectSuccess(taskSchema.safeParse(valid));
  });

  it('rejects title shorter than 2 characters', () => {
    expectError(taskSchema.safeParse({ ...valid, title: 'I' }), 'title');
  });

  it('rejects empty title', () => {
    expectError(taskSchema.safeParse({ ...valid, title: '' }), 'title');
  });

  it('applies default status of pending', () => {
    const { status, ...rest } = valid;
    const result = taskSchema.safeParse(rest);
    expectSuccess(result, { status: 'pending' });
  });

  it('applies default priority of medium', () => {
    const { priority, ...rest } = valid;
    const result = taskSchema.safeParse(rest);
    expectSuccess(result, { priority: 'medium' });
  });

  it('accepts all valid status values', () => {
    const statuses = ['pending', 'assigned', 'in_progress', 'blocked', 'review', 'completed'] as const;
    for (const s of statuses) {
      expectSuccess(taskSchema.safeParse({ ...valid, status: s }));
    }
  });

  it('accepts all valid priority values', () => {
    const priorities = ['low', 'medium', 'high', 'urgent'] as const;
    for (const p of priorities) {
      expectSuccess(taskSchema.safeParse({ ...valid, priority: p }));
    }
  });

  it('rejects invalid status', () => {
    expectError(taskSchema.safeParse({ ...valid, status: 'done' }), 'status');
  });

  it('rejects invalid priority', () => {
    expectError(taskSchema.safeParse({ ...valid, priority: 'critical' }), 'priority');
  });

  it('coerces string estimatedHours to number', () => {
    const result = taskSchema.safeParse({ ...valid, estimatedHours: '4' });
    expectSuccess(result, { estimatedHours: 4 });
  });

  it('rejects negative estimatedHours', () => {
    expectError(taskSchema.safeParse({ ...valid, estimatedHours: -1 }), 'estimatedHours');
  });

  it('accepts zero estimatedHours', () => {
    expectSuccess(taskSchema.safeParse({ ...valid, estimatedHours: 0 }));
  });

  it('accepts minimal required data only', () => {
    expectSuccess(taskSchema.safeParse({ title: 'Do something' }));
  });
});

// ===========================================================================
// Time entry schema
// ===========================================================================

describe('timeEntrySchema', () => {
  const valid = {
    projectId: 'project-1',
    taskId: 'task-1',
    description: 'Framing work',
    hours: 4,
    date: '2025-04-15',
    billable: true,
  };

  it('accepts valid time entry data', () => {
    expectSuccess(timeEntrySchema.safeParse(valid));
  });

  it('rejects missing projectId', () => {
    const { projectId, ...rest } = valid;
    expectError(timeEntrySchema.safeParse(rest), 'projectId');
  });

  it('rejects empty projectId', () => {
    expectError(timeEntrySchema.safeParse({ ...valid, projectId: '' }), 'projectId');
  });

  it('rejects hours below 0.25 (minimum 15 minutes)', () => {
    const result = timeEntrySchema.safeParse({ ...valid, hours: 0.1 });
    expect(result.success).toBe(false);
    if (!result.success) {
      const err = result.error.issues.find((i) => i.path.includes('hours'));
      expect(err?.message).toBe('Minimum 15 minutes');
    }
  });

  it('accepts exactly 0.25 hours', () => {
    expectSuccess(timeEntrySchema.safeParse({ ...valid, hours: 0.25 }));
  });

  it('rejects hours above 24', () => {
    const result = timeEntrySchema.safeParse({ ...valid, hours: 25 });
    expect(result.success).toBe(false);
    if (!result.success) {
      const err = result.error.issues.find((i) => i.path.includes('hours'));
      expect(err?.message).toBe('Maximum 24 hours');
    }
  });

  it('accepts exactly 24 hours', () => {
    expectSuccess(timeEntrySchema.safeParse({ ...valid, hours: 24 }));
  });

  it('coerces string hours to number', () => {
    const result = timeEntrySchema.safeParse({ ...valid, hours: '8' });
    expectSuccess(result, { hours: 8 });
  });

  it('applies default billable as true', () => {
    const { billable, ...rest } = valid;
    const result = timeEntrySchema.safeParse(rest);
    expectSuccess(result, { billable: true });
  });

  it('accepts billable as false', () => {
    expectSuccess(timeEntrySchema.safeParse({ ...valid, billable: false }), { billable: false });
  });

  it('accepts optional taskId as empty string', () => {
    expectSuccess(timeEntrySchema.safeParse({ ...valid, taskId: '' }));
  });

  it('accepts optional description as undefined', () => {
    const { description, ...rest } = valid;
    expectSuccess(timeEntrySchema.safeParse(rest));
  });

  it('rejects missing date', () => {
    const { date, ...rest } = valid;
    expectError(timeEntrySchema.safeParse(rest), 'date');
  });
});

// ===========================================================================
// Invite schema
// ===========================================================================

describe('inviteSchema', () => {
  const valid = {
    name: 'Bob Builder',
    email: 'bob@example.com',
    role: 'PM' as const,
    message: 'Welcome aboard!',
  };

  it('accepts valid invite data', () => {
    expectSuccess(inviteSchema.safeParse(valid));
  });

  it('rejects name shorter than 2 characters', () => {
    expectError(inviteSchema.safeParse({ ...valid, name: 'B' }), 'name');
  });

  it('rejects empty name', () => {
    expectError(inviteSchema.safeParse({ ...valid, name: '' }), 'name');
  });

  it('rejects invalid email', () => {
    expectError(inviteSchema.safeParse({ ...valid, email: 'not-email' }), 'email');
  });

  it('accepts all valid roles', () => {
    const roles = ['PM', 'EMPLOYEE', 'CONTRACTOR', 'SUB', 'CLIENT'] as const;
    for (const role of roles) {
      expectSuccess(inviteSchema.safeParse({ ...valid, role }));
    }
  });

  it('rejects invalid role', () => {
    expectError(inviteSchema.safeParse({ ...valid, role: 'ADMIN' }), 'role');
  });

  it('accepts optional message as empty string', () => {
    expectSuccess(inviteSchema.safeParse({ ...valid, message: '' }));
  });

  it('accepts optional message as undefined', () => {
    const { message, ...rest } = valid;
    expectSuccess(inviteSchema.safeParse(rest));
  });
});

// ===========================================================================
// Subcontractor schema
// ===========================================================================

describe('subcontractorSchema', () => {
  const valid = {
    companyName: 'Best Electric LLC',
    contactName: 'Mike Sparks',
    email: 'mike@bestelectric.com',
    phone: '555-987-6543',
    trade: 'Electrical',
    licenseNumber: 'EL-12345',
    insuranceExpiry: '2026-01-01',
    notes: 'Preferred vendor',
  };

  it('accepts valid subcontractor data', () => {
    expectSuccess(subcontractorSchema.safeParse(valid));
  });

  it('rejects companyName shorter than 2 characters', () => {
    expectError(subcontractorSchema.safeParse({ ...valid, companyName: 'B' }), 'companyName');
  });

  it('rejects empty companyName', () => {
    expectError(subcontractorSchema.safeParse({ ...valid, companyName: '' }), 'companyName');
  });

  it('rejects contactName shorter than 2 characters', () => {
    expectError(subcontractorSchema.safeParse({ ...valid, contactName: 'M' }), 'contactName');
  });

  it('rejects invalid email', () => {
    expectError(subcontractorSchema.safeParse({ ...valid, email: 'bad' }), 'email');
  });

  it('rejects invalid phone characters', () => {
    expectError(subcontractorSchema.safeParse({ ...valid, phone: 'abc' }), 'phone');
  });

  it('accepts optional phone as empty string', () => {
    expectSuccess(subcontractorSchema.safeParse({ ...valid, phone: '' }));
  });

  it('rejects empty trade (required)', () => {
    expectError(subcontractorSchema.safeParse({ ...valid, trade: '' }), 'trade');
  });

  it('accepts optional licenseNumber as empty string', () => {
    expectSuccess(subcontractorSchema.safeParse({ ...valid, licenseNumber: '' }));
  });

  it('accepts optional insuranceExpiry as undefined', () => {
    const { insuranceExpiry, ...rest } = valid;
    expectSuccess(subcontractorSchema.safeParse(rest));
  });

  it('accepts optional notes as empty string', () => {
    expectSuccess(subcontractorSchema.safeParse({ ...valid, notes: '' }));
  });

  it('accepts minimal required fields', () => {
    expectSuccess(subcontractorSchema.safeParse({
      companyName: 'Best Electric LLC',
      contactName: 'Mike Sparks',
      email: 'mike@bestelectric.com',
      trade: 'Electrical',
    }));
  });
});

// ===========================================================================
// Scope change schema
// ===========================================================================

describe('scopeChangeSchema', () => {
  const valid = {
    type: 'add' as const,
    phaseId: 'phase-1',
    originalDescription: 'Original scope',
    proposedDescription: 'Added new scope item',
    costImpact: 5000,
  };

  it('accepts valid scope change data', () => {
    expectSuccess(scopeChangeSchema.safeParse(valid));
  });

  it('accepts all valid types', () => {
    for (const type of ['add', 'remove', 'modify'] as const) {
      expectSuccess(scopeChangeSchema.safeParse({ ...valid, type }));
    }
  });

  it('rejects invalid type', () => {
    expectError(scopeChangeSchema.safeParse({ ...valid, type: 'delete' }), 'type');
  });

  it('rejects empty proposedDescription', () => {
    const result = scopeChangeSchema.safeParse({ ...valid, proposedDescription: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const err = result.error.issues.find((i) => i.path.includes('proposedDescription'));
      expect(err?.message).toBe('Description is required');
    }
  });

  it('coerces string costImpact to number', () => {
    const result = scopeChangeSchema.safeParse({ ...valid, costImpact: '3000' });
    expectSuccess(result, { costImpact: 3000 });
  });

  it('accepts negative costImpact (cost reduction)', () => {
    expectSuccess(scopeChangeSchema.safeParse({ ...valid, costImpact: -2000 }), { costImpact: -2000 });
  });

  it('accepts zero costImpact', () => {
    expectSuccess(scopeChangeSchema.safeParse({ ...valid, costImpact: 0 }), { costImpact: 0 });
  });

  it('accepts optional phaseId as empty string', () => {
    expectSuccess(scopeChangeSchema.safeParse({ ...valid, phaseId: '' }));
  });

  it('accepts optional originalDescription as empty string', () => {
    expectSuccess(scopeChangeSchema.safeParse({ ...valid, originalDescription: '' }));
  });
});

// ===========================================================================
// Change order schema
// ===========================================================================

describe('changeOrderSchema', () => {
  const validScopeChange = {
    type: 'add' as const,
    proposedDescription: 'Add new scope item',
    costImpact: 5000,
  };

  const valid = {
    title: 'Add bathroom',
    description: 'Customer requested additional half bathroom on first floor',
    reason: 'Client request',
    scopeChanges: [validScopeChange],
    costImpact: 5000,
    scheduleImpact: 14,
  };

  it('accepts valid change order data', () => {
    expectSuccess(changeOrderSchema.safeParse(valid));
  });

  it('rejects title shorter than 2 characters', () => {
    expectError(changeOrderSchema.safeParse({ ...valid, title: 'A' }), 'title');
  });

  it('rejects description shorter than 10 characters', () => {
    const result = changeOrderSchema.safeParse({ ...valid, description: 'Short' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const err = result.error.issues.find((i) => i.path.includes('description'));
      expect(err?.message).toBe('Please provide a detailed description');
    }
  });

  it('accepts description with exactly 10 characters', () => {
    expectSuccess(changeOrderSchema.safeParse({ ...valid, description: '1234567890' }));
  });

  it('rejects reason shorter than 2 characters', () => {
    expectError(changeOrderSchema.safeParse({ ...valid, reason: 'R' }), 'reason');
  });

  it('accepts empty scopeChanges array', () => {
    expectSuccess(changeOrderSchema.safeParse({ ...valid, scopeChanges: [] }));
  });

  it('validates nested scopeChanges items', () => {
    const result = changeOrderSchema.safeParse({
      ...valid,
      scopeChanges: [{ type: 'add', proposedDescription: '', costImpact: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it('coerces string costImpact to number', () => {
    const result = changeOrderSchema.safeParse({ ...valid, costImpact: '10000' });
    expectSuccess(result, { costImpact: 10000 });
  });

  it('accepts negative scheduleImpact (ahead of schedule)', () => {
    expectSuccess(changeOrderSchema.safeParse({ ...valid, scheduleImpact: -30 }));
  });

  it('rejects scheduleImpact below -365', () => {
    expectError(changeOrderSchema.safeParse({ ...valid, scheduleImpact: -366 }), 'scheduleImpact');
  });

  it('rejects scheduleImpact above 365', () => {
    expectError(changeOrderSchema.safeParse({ ...valid, scheduleImpact: 366 }), 'scheduleImpact');
  });

  it('accepts boundary scheduleImpact values', () => {
    expectSuccess(changeOrderSchema.safeParse({ ...valid, scheduleImpact: -365 }));
    expectSuccess(changeOrderSchema.safeParse({ ...valid, scheduleImpact: 365 }));
    expectSuccess(changeOrderSchema.safeParse({ ...valid, scheduleImpact: 0 }));
  });

  it('rejects non-integer scheduleImpact', () => {
    expectError(changeOrderSchema.safeParse({ ...valid, scheduleImpact: 14.5 }), 'scheduleImpact');
  });

  it('coerces string scheduleImpact to integer', () => {
    const result = changeOrderSchema.safeParse({ ...valid, scheduleImpact: '7' });
    expectSuccess(result, { scheduleImpact: 7 });
  });
});

// ===========================================================================
// Daily log schema
// ===========================================================================

describe('dailyLogSchema', () => {
  const valid = {
    date: '2025-04-15',
    weather: 'sunny' as const,
    temperature: 72,
    workerCount: 5,
    workPerformed: 'Completed framing for north wall section',
    materialsUsed: '2x4 lumber, nails',
    equipmentUsed: 'Nail gun, saw',
    delays: 'None',
    safetyNotes: 'All workers wore PPE',
  };

  it('accepts valid daily log data', () => {
    expectSuccess(dailyLogSchema.safeParse(valid));
  });

  it('applies default weather of sunny', () => {
    const { weather, ...rest } = valid;
    const result = dailyLogSchema.safeParse(rest);
    expectSuccess(result, { weather: 'sunny' });
  });

  it('accepts all valid weather values', () => {
    for (const w of ['sunny', 'cloudy', 'rainy', 'stormy'] as const) {
      expectSuccess(dailyLogSchema.safeParse({ ...valid, weather: w }));
    }
  });

  it('rejects invalid weather value', () => {
    expectError(dailyLogSchema.safeParse({ ...valid, weather: 'snowy' }), 'weather');
  });

  it('applies default workerCount of 0', () => {
    const { workerCount, ...rest } = valid;
    const result = dailyLogSchema.safeParse(rest);
    expectSuccess(result, { workerCount: 0 });
  });

  it('rejects negative workerCount', () => {
    expectError(dailyLogSchema.safeParse({ ...valid, workerCount: -1 }), 'workerCount');
  });

  it('rejects non-integer workerCount', () => {
    expectError(dailyLogSchema.safeParse({ ...valid, workerCount: 3.5 }), 'workerCount');
  });

  it('coerces string workerCount to integer', () => {
    const result = dailyLogSchema.safeParse({ ...valid, workerCount: '10' });
    expectSuccess(result, { workerCount: 10 });
  });

  it('rejects workPerformed shorter than 10 characters', () => {
    const result = dailyLogSchema.safeParse({ ...valid, workPerformed: 'Short' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const err = result.error.issues.find((i) => i.path.includes('workPerformed'));
      expect(err?.message).toBe('Please describe work performed');
    }
  });

  it('rejects empty workPerformed', () => {
    expectError(dailyLogSchema.safeParse({ ...valid, workPerformed: '' }), 'workPerformed');
  });

  it('accepts optional temperature as undefined', () => {
    const { temperature, ...rest } = valid;
    expectSuccess(dailyLogSchema.safeParse(rest));
  });

  it('coerces string temperature to number', () => {
    const result = dailyLogSchema.safeParse({ ...valid, temperature: '85' });
    expectSuccess(result, { temperature: 85 });
  });

  it('accepts negative temperature', () => {
    expectSuccess(dailyLogSchema.safeParse({ ...valid, temperature: -5 }));
  });

  it('accepts optional fields as empty strings', () => {
    expectSuccess(dailyLogSchema.safeParse({
      ...valid,
      materialsUsed: '',
      equipmentUsed: '',
      delays: '',
      safetyNotes: '',
    }));
  });

  it('rejects missing date', () => {
    const { date, ...rest } = valid;
    expectError(dailyLogSchema.safeParse(rest), 'date');
  });
});

// ===========================================================================
// Estimate line item schema
// ===========================================================================

describe('estimateLineItemSchema', () => {
  const valid = {
    description: 'Drywall sheets',
    quantity: 50,
    unit: 'sheets',
    unitPrice: 12.50,
    category: 'material' as const,
  };

  it('accepts valid line item data', () => {
    expectSuccess(estimateLineItemSchema.safeParse(valid));
  });

  it('rejects empty description', () => {
    expectError(estimateLineItemSchema.safeParse({ ...valid, description: '' }), 'description');
  });

  it('rejects quantity of zero', () => {
    expectError(estimateLineItemSchema.safeParse({ ...valid, quantity: 0 }), 'quantity');
  });

  it('rejects negative quantity', () => {
    expectError(estimateLineItemSchema.safeParse({ ...valid, quantity: -1 }), 'quantity');
  });

  it('accepts small positive quantity (0.01)', () => {
    expectSuccess(estimateLineItemSchema.safeParse({ ...valid, quantity: 0.01 }));
  });

  it('coerces string quantity to number', () => {
    const result = estimateLineItemSchema.safeParse({ ...valid, quantity: '25' });
    expectSuccess(result, { quantity: 25 });
  });

  it('applies default unit of ea', () => {
    const { unit, ...rest } = valid;
    const result = estimateLineItemSchema.safeParse(rest);
    expectSuccess(result, { unit: 'ea' });
  });

  it('rejects negative unitPrice', () => {
    expectError(estimateLineItemSchema.safeParse({ ...valid, unitPrice: -5 }), 'unitPrice');
  });

  it('accepts zero unitPrice', () => {
    expectSuccess(estimateLineItemSchema.safeParse({ ...valid, unitPrice: 0 }));
  });

  it('coerces string unitPrice to number', () => {
    const result = estimateLineItemSchema.safeParse({ ...valid, unitPrice: '15.99' });
    expectSuccess(result, { unitPrice: 15.99 });
  });

  it('applies default category of material', () => {
    const { category, ...rest } = valid;
    const result = estimateLineItemSchema.safeParse(rest);
    expectSuccess(result, { category: 'material' });
  });

  it('accepts all valid categories', () => {
    for (const c of ['labor', 'material', 'equipment', 'subcontractor', 'other'] as const) {
      expectSuccess(estimateLineItemSchema.safeParse({ ...valid, category: c }));
    }
  });

  it('rejects invalid category', () => {
    expectError(estimateLineItemSchema.safeParse({ ...valid, category: 'overhead' }), 'category');
  });
});

// ===========================================================================
// Estimate schema
// ===========================================================================

describe('estimateSchema', () => {
  const validLineItem = {
    description: 'Drywall sheets',
    quantity: 50,
    unitPrice: 12.50,
  };

  const valid = {
    name: 'Kitchen Estimate',
    projectId: 'project-1',
    validUntil: '2025-06-01',
    notes: 'Includes labor and materials',
    terms: 'Net 30',
    lineItems: [validLineItem],
  };

  it('accepts valid estimate data', () => {
    expectSuccess(estimateSchema.safeParse(valid));
  });

  it('rejects name shorter than 2 characters', () => {
    expectError(estimateSchema.safeParse({ ...valid, name: 'K' }), 'name');
  });

  it('rejects empty name', () => {
    expectError(estimateSchema.safeParse({ ...valid, name: '' }), 'name');
  });

  it('rejects empty lineItems array', () => {
    const result = estimateSchema.safeParse({ ...valid, lineItems: [] });
    expect(result.success).toBe(false);
    if (!result.success) {
      const err = result.error.issues.find((i) => i.path.includes('lineItems'));
      expect(err?.message).toBe('At least one line item is required');
    }
  });

  it('accepts multiple line items', () => {
    expectSuccess(estimateSchema.safeParse({
      ...valid,
      lineItems: [
        validLineItem,
        { description: 'Labor', quantity: 40, unitPrice: 65, category: 'labor' },
      ],
    }));
  });

  it('validates nested line items', () => {
    const result = estimateSchema.safeParse({
      ...valid,
      lineItems: [{ description: '', quantity: 0, unitPrice: -1 }],
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional projectId as empty string', () => {
    expectSuccess(estimateSchema.safeParse({ ...valid, projectId: '' }));
  });

  it('accepts optional validUntil as undefined', () => {
    const { validUntil, ...rest } = valid;
    expectSuccess(estimateSchema.safeParse(rest));
  });

  it('accepts optional notes as empty string', () => {
    expectSuccess(estimateSchema.safeParse({ ...valid, notes: '' }));
  });

  it('accepts optional terms as empty string', () => {
    expectSuccess(estimateSchema.safeParse({ ...valid, terms: '' }));
  });
});

// ===========================================================================
// Invoice schema
// ===========================================================================

describe('invoiceSchema', () => {
  const valid = {
    projectId: 'project-1',
    number: 'INV-001',
    clientName: 'John Smith',
    clientEmail: 'john@example.com',
    dueDate: '2025-05-01',
    type: 'standard' as const,
    paymentTerms: 'Net 30',
    taxRate: 8.25,
    retainage: 10,
    notes: 'Thank you for your business',
  };

  it('accepts valid invoice data', () => {
    expectSuccess(invoiceSchema.safeParse(valid));
  });

  it('rejects empty number', () => {
    expectError(invoiceSchema.safeParse({ ...valid, number: '' }), 'number');
  });

  it('rejects empty clientName', () => {
    expectError(invoiceSchema.safeParse({ ...valid, clientName: '' }), 'clientName');
  });

  it('rejects invalid clientEmail when provided', () => {
    expectError(invoiceSchema.safeParse({ ...valid, clientEmail: 'not-email' }), 'clientEmail');
  });

  it('accepts empty clientEmail', () => {
    expectSuccess(invoiceSchema.safeParse({ ...valid, clientEmail: '' }));
  });

  it('rejects missing dueDate', () => {
    const { dueDate, ...rest } = valid;
    expectError(invoiceSchema.safeParse(rest), 'dueDate');
  });

  it('applies default type of standard', () => {
    const { type, ...rest } = valid;
    const result = invoiceSchema.safeParse(rest);
    expectSuccess(result, { type: 'standard' });
  });

  it('accepts all valid invoice types', () => {
    const types = ['standard', 'progress', 'aia_g702', 'deposit', 'final', 'change_order'] as const;
    for (const t of types) {
      expectSuccess(invoiceSchema.safeParse({ ...valid, type: t }));
    }
  });

  it('rejects invalid type', () => {
    expectError(invoiceSchema.safeParse({ ...valid, type: 'recurring' }), 'type');
  });

  it('applies default paymentTerms of Net 30', () => {
    const { paymentTerms, ...rest } = valid;
    const result = invoiceSchema.safeParse(rest);
    expectSuccess(result, { paymentTerms: 'Net 30' });
  });

  it('coerces string taxRate to number', () => {
    const result = invoiceSchema.safeParse({ ...valid, taxRate: '8.25' });
    expectSuccess(result, { taxRate: 8.25 });
  });

  it('rejects taxRate below 0', () => {
    expectError(invoiceSchema.safeParse({ ...valid, taxRate: -1 }), 'taxRate');
  });

  it('rejects taxRate above 100', () => {
    expectError(invoiceSchema.safeParse({ ...valid, taxRate: 101 }), 'taxRate');
  });

  it('accepts boundary taxRate values', () => {
    expectSuccess(invoiceSchema.safeParse({ ...valid, taxRate: 0 }));
    expectSuccess(invoiceSchema.safeParse({ ...valid, taxRate: 100 }));
  });

  it('rejects retainage below 0', () => {
    expectError(invoiceSchema.safeParse({ ...valid, retainage: -1 }), 'retainage');
  });

  it('rejects retainage above 100', () => {
    expectError(invoiceSchema.safeParse({ ...valid, retainage: 101 }), 'retainage');
  });

  it('accepts boundary retainage values', () => {
    expectSuccess(invoiceSchema.safeParse({ ...valid, retainage: 0 }));
    expectSuccess(invoiceSchema.safeParse({ ...valid, retainage: 100 }));
  });

  it('coerces string retainage to number', () => {
    const result = invoiceSchema.safeParse({ ...valid, retainage: '10' });
    expectSuccess(result, { retainage: 10 });
  });

  it('accepts optional projectId as empty string', () => {
    expectSuccess(invoiceSchema.safeParse({ ...valid, projectId: '' }));
  });

  it('accepts optional taxRate as undefined', () => {
    const { taxRate, ...rest } = valid;
    expectSuccess(invoiceSchema.safeParse(rest));
  });

  it('accepts optional retainage as undefined', () => {
    const { retainage, ...rest } = valid;
    expectSuccess(invoiceSchema.safeParse(rest));
  });

  it('accepts optional notes as empty string', () => {
    expectSuccess(invoiceSchema.safeParse({ ...valid, notes: '' }));
  });
});

// ===========================================================================
// Payroll config schema
// ===========================================================================

describe('payrollConfigSchema', () => {
  const valid = {
    payPeriod: 'biweekly' as const,
    overtimeThreshold: 40,
    overtimeMultiplier: 1.5,
    payDayOfWeek: 5,
  };

  it('accepts valid payroll config', () => {
    expectSuccess(payrollConfigSchema.safeParse(valid));
  });

  it('applies all defaults when empty object provided', () => {
    const result = payrollConfigSchema.safeParse({});
    expectSuccess(result, {
      payPeriod: 'biweekly',
      overtimeThreshold: 40,
      overtimeMultiplier: 1.5,
      payDayOfWeek: 5,
    });
  });

  it('accepts all valid payPeriod values', () => {
    for (const p of ['weekly', 'biweekly', 'semimonthly', 'monthly'] as const) {
      expectSuccess(payrollConfigSchema.safeParse({ ...valid, payPeriod: p }));
    }
  });

  it('rejects invalid payPeriod', () => {
    expectError(payrollConfigSchema.safeParse({ ...valid, payPeriod: 'daily' }), 'payPeriod');
  });

  it('rejects overtimeThreshold below 0', () => {
    expectError(payrollConfigSchema.safeParse({ ...valid, overtimeThreshold: -1 }), 'overtimeThreshold');
  });

  it('rejects overtimeThreshold above 168', () => {
    expectError(payrollConfigSchema.safeParse({ ...valid, overtimeThreshold: 169 }), 'overtimeThreshold');
  });

  it('accepts boundary overtimeThreshold values', () => {
    expectSuccess(payrollConfigSchema.safeParse({ ...valid, overtimeThreshold: 0 }));
    expectSuccess(payrollConfigSchema.safeParse({ ...valid, overtimeThreshold: 168 }));
  });

  it('coerces string overtimeThreshold to number', () => {
    const result = payrollConfigSchema.safeParse({ ...valid, overtimeThreshold: '45' });
    expectSuccess(result, { overtimeThreshold: 45 });
  });

  it('rejects overtimeMultiplier below 1', () => {
    expectError(payrollConfigSchema.safeParse({ ...valid, overtimeMultiplier: 0.5 }), 'overtimeMultiplier');
  });

  it('rejects overtimeMultiplier above 3', () => {
    expectError(payrollConfigSchema.safeParse({ ...valid, overtimeMultiplier: 3.5 }), 'overtimeMultiplier');
  });

  it('accepts boundary overtimeMultiplier values', () => {
    expectSuccess(payrollConfigSchema.safeParse({ ...valid, overtimeMultiplier: 1 }));
    expectSuccess(payrollConfigSchema.safeParse({ ...valid, overtimeMultiplier: 3 }));
  });

  it('coerces string overtimeMultiplier to number', () => {
    const result = payrollConfigSchema.safeParse({ ...valid, overtimeMultiplier: '2' });
    expectSuccess(result, { overtimeMultiplier: 2 });
  });

  it('rejects payDayOfWeek below 0', () => {
    expectError(payrollConfigSchema.safeParse({ ...valid, payDayOfWeek: -1 }), 'payDayOfWeek');
  });

  it('rejects payDayOfWeek above 6', () => {
    expectError(payrollConfigSchema.safeParse({ ...valid, payDayOfWeek: 7 }), 'payDayOfWeek');
  });

  it('accepts boundary payDayOfWeek values (0=Sunday, 6=Saturday)', () => {
    expectSuccess(payrollConfigSchema.safeParse({ ...valid, payDayOfWeek: 0 }));
    expectSuccess(payrollConfigSchema.safeParse({ ...valid, payDayOfWeek: 6 }));
  });

  it('rejects non-integer payDayOfWeek', () => {
    expectError(payrollConfigSchema.safeParse({ ...valid, payDayOfWeek: 3.5 }), 'payDayOfWeek');
  });

  it('coerces string payDayOfWeek to integer', () => {
    const result = payrollConfigSchema.safeParse({ ...valid, payDayOfWeek: '3' });
    expectSuccess(result, { payDayOfWeek: 3 });
  });
});
