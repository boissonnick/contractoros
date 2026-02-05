/**
 * Tests for auto-number utility functions
 * Tests pure functions: formatDocumentNumber, previewNextNumber, DEFAULT_NUMBERING_CONFIG
 */

// Mock Firebase dependencies so the module can be imported
jest.mock('@/lib/firebase/config', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  runTransaction: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ toDate: () => new Date() })),
    fromDate: jest.fn((date: Date) => ({ toDate: () => date })),
  },
}));

import {
  formatDocumentNumber,
  previewNextNumber,
  DEFAULT_NUMBERING_CONFIG,
  NumberingConfig,
} from '@/lib/utils/auto-number';

describe('formatDocumentNumber', () => {
  it('formats default estimate config with counter 1', () => {
    const config: NumberingConfig = { prefix: 'EST-', padLength: 5, startFrom: 1 };
    expect(formatDocumentNumber(config, 1)).toBe('EST-00001');
  });

  it('formats default invoice config with counter 42', () => {
    const config: NumberingConfig = { prefix: 'INV-', padLength: 5, startFrom: 1 };
    expect(formatDocumentNumber(config, 42)).toBe('INV-00042');
  });

  it('formats custom prefix with shorter padLength', () => {
    const config: NumberingConfig = { prefix: 'QUO-', padLength: 3, startFrom: 1 };
    expect(formatDocumentNumber(config, 1)).toBe('QUO-001');
  });

  it('formats large counter value', () => {
    const config: NumberingConfig = { prefix: 'INV-', padLength: 5, startFrom: 1 };
    expect(formatDocumentNumber(config, 99999)).toBe('INV-99999');
  });

  it('does not truncate counter exceeding padLength', () => {
    const config: NumberingConfig = { prefix: 'INV-', padLength: 5, startFrom: 1 };
    expect(formatDocumentNumber(config, 100000)).toBe('INV-100000');
  });

  it('formats counter 0', () => {
    const config: NumberingConfig = { prefix: 'EST-', padLength: 5, startFrom: 1 };
    expect(formatDocumentNumber(config, 0)).toBe('EST-00000');
  });

  it('formats project config correctly', () => {
    const config: NumberingConfig = { prefix: 'PRJ-', padLength: 5, startFrom: 1 };
    expect(formatDocumentNumber(config, 7)).toBe('PRJ-00007');
  });

  it('formats change order config correctly', () => {
    const config: NumberingConfig = { prefix: 'CO-', padLength: 5, startFrom: 1 };
    expect(formatDocumentNumber(config, 15)).toBe('CO-00015');
  });
});

describe('previewNextNumber', () => {
  it('returns startFrom when counter is 0 and startFrom is 1', () => {
    const config: NumberingConfig = { prefix: 'EST-', padLength: 5, startFrom: 1 };
    const result = previewNextNumber(config, 0);
    // counter + 1 = 1, startFrom = 1, max(1, 1) = 1
    expect(result).toBe('EST-00001');
  });

  it('increments counter when counter exceeds startFrom', () => {
    const config: NumberingConfig = { prefix: 'INV-', padLength: 5, startFrom: 1 };
    const result = previewNextNumber(config, 5);
    // counter + 1 = 6, startFrom = 1, max(6, 1) = 6
    expect(result).toBe('INV-00006');
  });

  it('uses startFrom when it exceeds counter + 1', () => {
    const config: NumberingConfig = { prefix: 'PRJ-', padLength: 5, startFrom: 100 };
    const result = previewNextNumber(config, 0);
    // counter + 1 = 1, startFrom = 100, max(1, 100) = 100
    expect(result).toBe('PRJ-00100');
  });

  it('increments counter when counter is well past startFrom', () => {
    const config: NumberingConfig = { prefix: 'CO-', padLength: 5, startFrom: 1 };
    const result = previewNextNumber(config, 50);
    // counter + 1 = 51, startFrom = 1, max(51, 1) = 51
    expect(result).toBe('CO-00051');
  });

  it('handles startFrom equal to counter + 1', () => {
    const config: NumberingConfig = { prefix: 'EST-', padLength: 5, startFrom: 10 };
    const result = previewNextNumber(config, 9);
    // counter + 1 = 10, startFrom = 10, max(10, 10) = 10
    expect(result).toBe('EST-00010');
  });

  it('uses formatDocumentNumber internally with correct value', () => {
    const config: NumberingConfig = { prefix: 'QUO-', padLength: 3, startFrom: 1 };
    const result = previewNextNumber(config, 4);
    // counter + 1 = 5, startFrom = 1, max(5, 1) = 5
    expect(result).toBe('QUO-005');
  });
});

describe('DEFAULT_NUMBERING_CONFIG', () => {
  it('has all four document types', () => {
    expect(DEFAULT_NUMBERING_CONFIG).toHaveProperty('estimate');
    expect(DEFAULT_NUMBERING_CONFIG).toHaveProperty('invoice');
    expect(DEFAULT_NUMBERING_CONFIG).toHaveProperty('project');
    expect(DEFAULT_NUMBERING_CONFIG).toHaveProperty('change_order');
  });

  it('estimate config has correct defaults', () => {
    expect(DEFAULT_NUMBERING_CONFIG.estimate).toEqual({
      prefix: 'EST-',
      padLength: 5,
      startFrom: 1,
    });
  });

  it('invoice config has correct defaults', () => {
    expect(DEFAULT_NUMBERING_CONFIG.invoice).toEqual({
      prefix: 'INV-',
      padLength: 5,
      startFrom: 1,
    });
  });

  it('project config has correct defaults', () => {
    expect(DEFAULT_NUMBERING_CONFIG.project).toEqual({
      prefix: 'PRJ-',
      padLength: 5,
      startFrom: 1,
    });
  });

  it('change_order config has correct defaults', () => {
    expect(DEFAULT_NUMBERING_CONFIG.change_order).toEqual({
      prefix: 'CO-',
      padLength: 5,
      startFrom: 1,
    });
  });

  it('all configs have padLength 5', () => {
    const types = ['estimate', 'invoice', 'project', 'change_order'] as const;
    types.forEach((type) => {
      expect(DEFAULT_NUMBERING_CONFIG[type].padLength).toBe(5);
    });
  });

  it('all configs have startFrom 1', () => {
    const types = ['estimate', 'invoice', 'project', 'change_order'] as const;
    types.forEach((type) => {
      expect(DEFAULT_NUMBERING_CONFIG[type].startFrom).toBe(1);
    });
  });

  it('does not have updatedAt by default', () => {
    expect(DEFAULT_NUMBERING_CONFIG.updatedAt).toBeUndefined();
  });
});
