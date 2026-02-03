import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';

// Mock Auth Context
export const mockAuthContext = {
  user: {
    uid: 'test-user-id',
    email: 'test@example.com',
  },
  orgId: 'test-org-id',
  userProfile: {
    id: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
    role: 'OWNER' as const,
    orgId: 'test-org-id',
  },
  loading: false,
};

// Mock organization
export const mockOrganization = {
  id: 'test-org-id',
  name: 'Test Organization',
  email: 'org@example.com',
  phone: '555-123-4567',
  createdAt: new Date(),
};

// Mock project
export const mockProject = {
  id: 'test-project-id',
  name: 'Test Project',
  status: 'active',
  clientId: 'test-client-id',
  orgId: 'test-org-id',
  createdAt: new Date(),
};

// Mock client
export const mockClient = {
  id: 'test-client-id',
  name: 'Test Client',
  email: 'client@example.com',
  phone: '555-987-6543',
  status: 'active',
  orgId: 'test-org-id',
};

// Mock invoice
export const mockInvoice = {
  id: 'test-invoice-id',
  number: 'INV-001',
  status: 'draft',
  total: 1000,
  clientId: 'test-client-id',
  orgId: 'test-org-id',
  createdAt: new Date(),
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
};

// Custom render with providers
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { ...options });
}

// Helper to create mock Firestore timestamp
export function createMockTimestamp(date: Date = new Date()) {
  return {
    toDate: () => date,
    toMillis: () => date.getTime(),
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: 0,
  };
}

// Helper to create mock Firestore document snapshot
export function createMockDocSnapshot<T>(id: string, data: T | undefined) {
  return {
    id,
    exists: data !== undefined,
    data: () => data,
    ref: {
      id,
      path: `collection/${id}`,
    },
  };
}

// Helper to create mock Firestore query snapshot
export function createMockQuerySnapshot<T>(docs: Array<{ id: string; data: T }>) {
  return {
    docs: docs.map(doc => createMockDocSnapshot(doc.id, doc.data)),
    empty: docs.length === 0,
    size: docs.length,
    forEach: (callback: (doc: ReturnType<typeof createMockDocSnapshot>) => void) => {
      docs.forEach(doc => callback(createMockDocSnapshot(doc.id, doc.data)));
    },
  };
}

export * from '@testing-library/react';
export { customRender as render };
