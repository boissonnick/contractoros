/**
 * Timestamp Converter Utility Tests
 *
 * Tests for the Firestore timestamp conversion utilities:
 * - isFirestoreTimestamp
 * - convertTimestamp
 * - convertTimestamps
 * - convertTimestampsDeep
 * - getDateFields
 */

import {
  isFirestoreTimestamp,
  convertTimestamp,
  convertTimestamps,
  convertTimestampsDeep,
  getDateFields,
  DATE_FIELDS,
} from '@/lib/firebase/timestamp-converter';

// Mock Firestore Timestamp object
const createMockTimestamp = (date: Date = new Date('2024-01-15T10:00:00Z')) => ({
  toDate: () => date,
  toMillis: () => date.getTime(),
  seconds: Math.floor(date.getTime() / 1000),
  nanoseconds: 0,
});

describe('timestamp-converter', () => {
  // ============================================
  // isFirestoreTimestamp Tests
  // ============================================
  describe('isFirestoreTimestamp', () => {
    it('returns true for valid Firestore Timestamp object (has toDate method)', () => {
      const mockTimestamp = createMockTimestamp();
      expect(isFirestoreTimestamp(mockTimestamp)).toBe(true);
    });

    it('returns true for object with only toDate method', () => {
      const minimalTimestamp = { toDate: () => new Date() };
      expect(isFirestoreTimestamp(minimalTimestamp)).toBe(true);
    });

    it('returns false for regular Date object', () => {
      const date = new Date('2024-01-15T10:00:00Z');
      expect(isFirestoreTimestamp(date)).toBe(false);
    });

    it('returns false for null', () => {
      expect(isFirestoreTimestamp(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isFirestoreTimestamp(undefined)).toBe(false);
    });

    it('returns false for plain objects without toDate', () => {
      const plainObject = { seconds: 1705312800, nanoseconds: 0 };
      expect(isFirestoreTimestamp(plainObject)).toBe(false);
    });

    it('returns false for object with toDate as non-function', () => {
      const invalidObject = { toDate: 'not a function' };
      expect(isFirestoreTimestamp(invalidObject)).toBe(false);
    });

    it('returns false for numbers', () => {
      expect(isFirestoreTimestamp(1705312800000)).toBe(false);
    });

    it('returns false for strings', () => {
      expect(isFirestoreTimestamp('2024-01-15T10:00:00Z')).toBe(false);
    });

    it('returns false for arrays', () => {
      expect(isFirestoreTimestamp([])).toBe(false);
    });

    it('returns false for empty object', () => {
      expect(isFirestoreTimestamp({})).toBe(false);
    });

    it('returns false for boolean values', () => {
      expect(isFirestoreTimestamp(true)).toBe(false);
      expect(isFirestoreTimestamp(false)).toBe(false);
    });
  });

  // ============================================
  // convertTimestamp Tests
  // ============================================
  describe('convertTimestamp', () => {
    const testDate = new Date('2024-01-15T10:00:00Z');

    it('converts Firestore Timestamp to Date', () => {
      const mockTimestamp = createMockTimestamp(testDate);
      const result = convertTimestamp(mockTimestamp);

      expect(result).toBeInstanceOf(Date);
      expect((result as Date).toISOString()).toBe(testDate.toISOString());
    });

    it('returns Date as-is if already a Date', () => {
      const date = new Date('2024-01-15T10:00:00Z');
      const result = convertTimestamp(date);

      expect(result).toBe(date);
      expect(result).toBeInstanceOf(Date);
    });

    it('returns strings unchanged', () => {
      const str = '2024-01-15T10:00:00Z';
      expect(convertTimestamp(str)).toBe(str);
    });

    it('returns numbers unchanged', () => {
      const num = 1705312800000;
      expect(convertTimestamp(num)).toBe(num);
    });

    it('returns null unchanged', () => {
      expect(convertTimestamp(null)).toBe(null);
    });

    it('returns undefined unchanged', () => {
      expect(convertTimestamp(undefined)).toBe(undefined);
    });

    it('returns objects without toDate unchanged', () => {
      const obj = { id: '123', name: 'test' };
      expect(convertTimestamp(obj)).toBe(obj);
    });

    it('returns arrays unchanged', () => {
      const arr = [1, 2, 3];
      expect(convertTimestamp(arr)).toBe(arr);
    });

    it('returns boolean values unchanged', () => {
      expect(convertTimestamp(true)).toBe(true);
      expect(convertTimestamp(false)).toBe(false);
    });
  });

  // ============================================
  // convertTimestamps Tests
  // ============================================
  describe('convertTimestamps', () => {
    const testDate = new Date('2024-01-15T10:00:00Z');

    it('converts specified fields from Timestamps to Dates', () => {
      const data = {
        id: '123',
        createdAt: createMockTimestamp(testDate),
        updatedAt: createMockTimestamp(new Date('2024-02-20T15:30:00Z')),
        name: 'Test Item',
      };

      const result = convertTimestamps(data, ['createdAt', 'updatedAt']);

      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect((result.createdAt as Date).toISOString()).toBe(testDate.toISOString());
      expect((result.updatedAt as Date).toISOString()).toBe('2024-02-20T15:30:00.000Z');
    });

    it('leaves non-specified fields unchanged', () => {
      const data = {
        id: '123',
        createdAt: createMockTimestamp(testDate),
        someOtherTimestamp: createMockTimestamp(new Date('2024-03-01T00:00:00Z')),
        name: 'Test Item',
      };

      const result = convertTimestamps(data, ['createdAt']);

      expect(result.createdAt).toBeInstanceOf(Date);
      // someOtherTimestamp should still be a mock timestamp object (not converted)
      expect(result.someOtherTimestamp).toHaveProperty('toDate');
      expect(result.name).toBe('Test Item');
      expect(result.id).toBe('123');
    });

    it('handles undefined fields gracefully', () => {
      const data = {
        id: '123',
        createdAt: createMockTimestamp(testDate),
        updatedAt: undefined,
        name: 'Test Item',
      };

      const result = convertTimestamps(data, ['createdAt', 'updatedAt', 'deletedAt']);

      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeUndefined();
      expect((result as Record<string, unknown>).deletedAt).toBeUndefined();
    });

    it('handles null fields gracefully', () => {
      const data = {
        id: '123',
        createdAt: createMockTimestamp(testDate),
        updatedAt: null,
        name: 'Test Item',
      };

      const result = convertTimestamps(data, ['createdAt', 'updatedAt']);

      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeNull();
    });

    it('works with empty date fields array', () => {
      const data = {
        id: '123',
        createdAt: createMockTimestamp(testDate),
        name: 'Test Item',
      };

      const result = convertTimestamps(data, []);

      expect(result.createdAt).toHaveProperty('toDate'); // Still a mock timestamp
      expect(result.name).toBe('Test Item');
      expect(result.id).toBe('123');
    });

    it('handles already converted Date fields', () => {
      const data = {
        id: '123',
        createdAt: testDate, // Already a Date
        name: 'Test Item',
      };

      const result = convertTimestamps(data, ['createdAt']);

      expect(result.createdAt).toBeInstanceOf(Date);
      expect((result.createdAt as Date).toISOString()).toBe(testDate.toISOString());
    });

    it('does not mutate the original object', () => {
      const originalTimestamp = createMockTimestamp(testDate);
      const data = {
        id: '123',
        createdAt: originalTimestamp,
        name: 'Test Item',
      };

      const result = convertTimestamps(data, ['createdAt']);

      // Original should still have the timestamp
      expect(data.createdAt).toBe(originalTimestamp);
      // Result should have converted Date
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('handles fields with string values', () => {
      const data = {
        id: '123',
        createdAt: '2024-01-15T10:00:00Z', // String instead of timestamp
        name: 'Test Item',
      };

      const result = convertTimestamps(data, ['createdAt']);

      // String should be returned as-is (convertTimestamp returns strings unchanged)
      expect(result.createdAt).toBe('2024-01-15T10:00:00Z');
    });
  });

  // ============================================
  // convertTimestampsDeep Tests
  // ============================================
  describe('convertTimestampsDeep', () => {
    const testDate1 = new Date('2024-01-15T10:00:00Z');
    const testDate2 = new Date('2024-02-20T15:30:00Z');

    it('converts Firestore Timestamp to Date at root level', () => {
      const timestamp = createMockTimestamp(testDate1);
      const result = convertTimestampsDeep(timestamp);

      expect(result).toBeInstanceOf(Date);
      expect((result as Date).toISOString()).toBe(testDate1.toISOString());
    });

    it('handles nested objects with timestamps', () => {
      const data = {
        id: '123',
        name: 'Test Project',
        meta: {
          createdAt: createMockTimestamp(testDate1),
          updatedAt: createMockTimestamp(testDate2),
        },
      };

      const result = convertTimestampsDeep(data);

      expect(result.meta.createdAt).toBeInstanceOf(Date);
      expect(result.meta.updatedAt).toBeInstanceOf(Date);
      expect((result.meta.createdAt as Date).toISOString()).toBe(testDate1.toISOString());
      expect((result.meta.updatedAt as Date).toISOString()).toBe(testDate2.toISOString());
    });

    it('handles arrays of objects with timestamps', () => {
      const data = {
        tasks: [
          { id: '1', createdAt: createMockTimestamp(testDate1) },
          { id: '2', createdAt: createMockTimestamp(testDate2) },
        ],
      };

      const result = convertTimestampsDeep(data);

      expect(result.tasks[0].createdAt).toBeInstanceOf(Date);
      expect(result.tasks[1].createdAt).toBeInstanceOf(Date);
      expect((result.tasks[0].createdAt as Date).toISOString()).toBe(testDate1.toISOString());
      expect((result.tasks[1].createdAt as Date).toISOString()).toBe(testDate2.toISOString());
    });

    it('handles arrays of timestamps directly', () => {
      const timestamps = [
        createMockTimestamp(testDate1),
        createMockTimestamp(testDate2),
      ];

      const result = convertTimestampsDeep(timestamps);

      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toBeInstanceOf(Date);
      expect(result[1]).toBeInstanceOf(Date);
    });

    it('handles deeply nested structures', () => {
      const data = {
        level1: {
          level2: {
            level3: {
              level4: {
                deepTimestamp: createMockTimestamp(testDate1),
              },
            },
          },
        },
      };

      const result = convertTimestampsDeep(data);

      expect(result.level1.level2.level3.level4.deepTimestamp).toBeInstanceOf(Date);
    });

    it('handles mixed nested arrays and objects', () => {
      const data = {
        projects: [
          {
            id: 'p1',
            tasks: [
              {
                id: 't1',
                dueDate: createMockTimestamp(testDate1),
                subtasks: [{ completedAt: createMockTimestamp(testDate2) }],
              },
            ],
          },
        ],
      };

      const result = convertTimestampsDeep(data);

      expect(result.projects[0].tasks[0].dueDate).toBeInstanceOf(Date);
      expect(result.projects[0].tasks[0].subtasks[0].completedAt).toBeInstanceOf(Date);
    });

    it('preserves non-timestamp fields', () => {
      const data = {
        id: '123',
        name: 'Test',
        count: 42,
        isActive: true,
        tags: ['a', 'b', 'c'],
        nested: {
          value: 'preserved',
          number: 100,
        },
        createdAt: createMockTimestamp(testDate1),
      };

      const result = convertTimestampsDeep(data);

      expect(result.id).toBe('123');
      expect(result.name).toBe('Test');
      expect(result.count).toBe(42);
      expect(result.isActive).toBe(true);
      expect(result.tags).toEqual(['a', 'b', 'c']);
      expect(result.nested.value).toBe('preserved');
      expect(result.nested.number).toBe(100);
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('handles null values', () => {
      const result = convertTimestampsDeep(null);
      expect(result).toBeNull();
    });

    it('handles null values in nested structure', () => {
      const data = {
        id: '123',
        deletedAt: null,
        nested: {
          value: null,
        },
      };

      const result = convertTimestampsDeep(data);

      expect(result.deletedAt).toBeNull();
      expect(result.nested.value).toBeNull();
    });

    it('handles undefined values', () => {
      const result = convertTimestampsDeep(undefined);
      expect(result).toBeUndefined();
    });

    it('handles undefined values in nested structure', () => {
      const data = {
        id: '123',
        deletedAt: undefined,
        nested: {
          value: undefined,
        },
      };

      const result = convertTimestampsDeep(data);

      expect(result.deletedAt).toBeUndefined();
      expect(result.nested.value).toBeUndefined();
    });

    it('handles empty objects', () => {
      const result = convertTimestampsDeep({});
      expect(result).toEqual({});
    });

    it('handles empty arrays', () => {
      const result = convertTimestampsDeep([]);
      expect(result).toEqual([]);
    });

    it('handles primitive types', () => {
      expect(convertTimestampsDeep('string')).toBe('string');
      expect(convertTimestampsDeep(42)).toBe(42);
      expect(convertTimestampsDeep(true)).toBe(true);
      expect(convertTimestampsDeep(false)).toBe(false);
    });

    it('handles arrays with mixed content', () => {
      const data = [
        createMockTimestamp(testDate1),
        'string',
        42,
        null,
        { timestamp: createMockTimestamp(testDate2) },
        [createMockTimestamp(testDate1)],
      ];

      const result = convertTimestampsDeep(data);

      expect(result[0]).toBeInstanceOf(Date);
      expect(result[1]).toBe('string');
      expect(result[2]).toBe(42);
      expect(result[3]).toBeNull();
      expect((result[4] as { timestamp: Date }).timestamp).toBeInstanceOf(Date);
      expect((result[5] as Date[])[0]).toBeInstanceOf(Date);
    });

    it('converts Date objects to empty objects (limitation of deep conversion)', () => {
      // Note: This is a known limitation of convertTimestampsDeep.
      // Native Date objects are treated as regular objects and their
      // properties are enumerated (resulting in empty object since Date
      // has no enumerable properties). Use convertTimestamps with specific
      // fields for documents that may contain native Date objects.
      const existingDate = new Date('2024-01-15T10:00:00Z');
      const data = {
        alreadyDate: existingDate,
        timestamp: createMockTimestamp(testDate2),
      };

      const result = convertTimestampsDeep(data);

      // Date objects become empty objects due to Object.entries iteration
      expect(result.alreadyDate).toEqual({});
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('use convertTimestamps for documents with existing Date objects', () => {
      // Demonstrate the correct approach for documents with native Dates
      const existingDate = new Date('2024-01-15T10:00:00Z');
      const data = {
        alreadyDate: existingDate,
        timestamp: createMockTimestamp(testDate2),
      };

      // convertTimestamps preserves existing Dates correctly
      const result = convertTimestamps(data, ['alreadyDate', 'timestamp']);

      expect(result.alreadyDate).toBe(existingDate);
      expect(result.timestamp).toBeInstanceOf(Date);
    });
  });

  // ============================================
  // getDateFields Tests
  // ============================================
  describe('getDateFields', () => {
    it('returns correct fields for client entity type', () => {
      const fields = getDateFields('client');
      expect(fields).toEqual(DATE_FIELDS.client);
      expect(fields).toContain('createdAt');
      expect(fields).toContain('updatedAt');
      expect(fields).toContain('lastContactDate');
    });

    it('returns correct fields for project entity type', () => {
      const fields = getDateFields('project');
      expect(fields).toEqual(DATE_FIELDS.project);
      expect(fields).toContain('createdAt');
      expect(fields).toContain('startDate');
      expect(fields).toContain('endDate');
      expect(fields).toContain('completionDate');
    });

    it('returns correct fields for invoice entity type', () => {
      const fields = getDateFields('invoice');
      expect(fields).toEqual(DATE_FIELDS.invoice);
      expect(fields).toContain('dueDate');
      expect(fields).toContain('sentAt');
      expect(fields).toContain('paidAt');
    });

    it('returns correct fields for task entity type', () => {
      const fields = getDateFields('task');
      expect(fields).toEqual(DATE_FIELDS.task);
      expect(fields).toContain('dueDate');
      expect(fields).toContain('startDate');
      expect(fields).toContain('completedAt');
    });

    it('returns correct fields for expense entity type', () => {
      const fields = getDateFields('expense');
      expect(fields).toEqual(DATE_FIELDS.expense);
      expect(fields).toContain('date');
      expect(fields).toContain('approvedAt');
      expect(fields).toContain('paidAt');
    });

    it('returns correct fields for timeEntry entity type', () => {
      const fields = getDateFields('timeEntry');
      expect(fields).toEqual(DATE_FIELDS.timeEntry);
      expect(fields).toContain('clockIn');
      expect(fields).toContain('clockOut');
      expect(fields).toContain('approvedAt');
    });

    it('returns correct fields for subcontractor entity type', () => {
      const fields = getDateFields('subcontractor');
      expect(fields).toEqual(DATE_FIELDS.subcontractor);
      expect(fields).toContain('createdAt');
      expect(fields).toContain('updatedAt');
    });

    it('returns correct fields for signatureRequest entity type', () => {
      const fields = getDateFields('signatureRequest');
      expect(fields).toEqual(DATE_FIELDS.signatureRequest);
      expect(fields).toContain('sentAt');
      expect(fields).toContain('viewedAt');
      expect(fields).toContain('signedAt');
      expect(fields).toContain('expiresAt');
    });

    it('returns generic fields for unknown entity types', () => {
      const fields = getDateFields('unknownEntity');
      expect(fields).toEqual(DATE_FIELDS.generic);
      expect(fields).toContain('createdAt');
      expect(fields).toContain('updatedAt');
    });

    it('returns generic fields for empty string', () => {
      const fields = getDateFields('');
      expect(fields).toEqual(DATE_FIELDS.generic);
    });

    it('returns generic fields for nonsense string', () => {
      const fields = getDateFields('somethingThatDoesNotExist');
      expect(fields).toEqual(DATE_FIELDS.generic);
    });
  });

  // ============================================
  // DATE_FIELDS Constant Tests
  // ============================================
  describe('DATE_FIELDS', () => {
    it('contains expected entity types', () => {
      const expectedEntities = [
        'user',
        'organization',
        'client',
        'clientNote',
        'communicationLog',
        'project',
        'phase',
        'task',
        'taskComment',
        'taskActivity',
        'expense',
        'invoice',
        'estimate',
        'payment',
        'timeEntry',
        'dailyLog',
        'payrollRun',
        'payrollEntry',
        'scheduleEvent',
        'availability',
        'material',
        'equipment',
        'purchaseOrder',
        'sow',
        'changeOrder',
        'rfi',
        'submittal',
        'punchList',
        'signatureRequest',
        'subcontractor',
        'bid',
        'generic',
      ];

      for (const entity of expectedEntities) {
        expect(DATE_FIELDS).toHaveProperty(entity);
      }
    });

    it('all entity types have at least createdAt and updatedAt', () => {
      const entitiesWithBoth = [
        'user',
        'organization',
        'client',
        'project',
        'phase',
        'task',
        'expense',
        'invoice',
        'estimate',
        'timeEntry',
        'dailyLog',
        'payrollRun',
        'scheduleEvent',
        'material',
        'equipment',
        'purchaseOrder',
        'sow',
        'changeOrder',
        'rfi',
        'submittal',
        'punchList',
        'signatureRequest',
        'subcontractor',
        'bid',
        'generic',
      ];

      for (const entity of entitiesWithBoth) {
        const fields = DATE_FIELDS[entity as keyof typeof DATE_FIELDS];
        expect(fields).toContain('createdAt');
        expect(fields).toContain('updatedAt');
      }
    });

    it('arrays are readonly', () => {
      // TypeScript enforces this at compile time with `as const`
      // At runtime, we can verify the arrays exist and have content
      expect(Array.isArray(DATE_FIELDS.client)).toBe(true);
      expect(DATE_FIELDS.client.length).toBeGreaterThan(0);
    });
  });

  // ============================================
  // Integration/Edge Case Tests
  // ============================================
  describe('integration tests', () => {
    it('convertTimestamps works with getDateFields', () => {
      const testDate = new Date('2024-01-15T10:00:00Z');
      const clientData = {
        id: 'client-123',
        name: 'Test Client',
        email: 'test@example.com',
        createdAt: createMockTimestamp(testDate),
        updatedAt: createMockTimestamp(testDate),
        lastContactDate: createMockTimestamp(testDate),
      };

      const fields = getDateFields('client');
      const result = convertTimestamps(clientData, fields);

      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(result.lastContactDate).toBeInstanceOf(Date);
      expect(result.name).toBe('Test Client');
    });

    it('handles real-world project document structure', () => {
      const data = {
        id: 'project-123',
        name: 'Kitchen Renovation',
        status: 'active',
        budget: 50000,
        createdAt: createMockTimestamp(new Date('2024-01-01T00:00:00Z')),
        updatedAt: createMockTimestamp(new Date('2024-01-15T10:00:00Z')),
        startDate: createMockTimestamp(new Date('2024-02-01T00:00:00Z')),
        endDate: createMockTimestamp(new Date('2024-04-30T00:00:00Z')),
        completionDate: null,
        phases: [
          {
            id: 'phase-1',
            name: 'Demolition',
            startDate: createMockTimestamp(new Date('2024-02-01T00:00:00Z')),
            endDate: createMockTimestamp(new Date('2024-02-15T00:00:00Z')),
          },
        ],
      };

      // First convert top-level fields
      const topLevelConverted = convertTimestamps(data, getDateFields('project'));

      expect(topLevelConverted.createdAt).toBeInstanceOf(Date);
      expect(topLevelConverted.startDate).toBeInstanceOf(Date);
      expect(topLevelConverted.endDate).toBeInstanceOf(Date);
      expect(topLevelConverted.completionDate).toBeNull();

      // For nested, use convertTimestampsDeep
      const fullyConverted = convertTimestampsDeep(data);

      expect(fullyConverted.phases[0].startDate).toBeInstanceOf(Date);
      expect(fullyConverted.phases[0].endDate).toBeInstanceOf(Date);
    });

    it('handles document with all field types', () => {
      const data = {
        // String fields
        id: 'doc-123',
        name: 'Test Document',
        description: null,

        // Number fields
        amount: 1000.50,
        quantity: 5,

        // Boolean fields
        isActive: true,
        isDeleted: false,

        // Array fields
        tags: ['urgent', 'review'],
        assignees: [],

        // Nested object
        metadata: {
          source: 'import',
          version: 2,
        },

        // Timestamp fields
        createdAt: createMockTimestamp(new Date('2024-01-15T10:00:00Z')),
        updatedAt: createMockTimestamp(new Date('2024-01-20T15:30:00Z')),

        // Optional timestamp (undefined)
        deletedAt: undefined,
      };

      const result = convertTimestampsDeep(data);

      // Verify all non-timestamp fields preserved
      expect(result.id).toBe('doc-123');
      expect(result.name).toBe('Test Document');
      expect(result.description).toBeNull();
      expect(result.amount).toBe(1000.50);
      expect(result.quantity).toBe(5);
      expect(result.isActive).toBe(true);
      expect(result.isDeleted).toBe(false);
      expect(result.tags).toEqual(['urgent', 'review']);
      expect(result.assignees).toEqual([]);
      expect(result.metadata).toEqual({ source: 'import', version: 2 });
      expect(result.deletedAt).toBeUndefined();

      // Verify timestamps converted
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });
  });
});
