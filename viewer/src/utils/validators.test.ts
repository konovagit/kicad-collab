/**
 * Unit tests for validators
 *
 * Tests validation functions using Result type pattern.
 * Verifies that fixture files pass validation.
 */

import { describe, it, expect } from 'vitest';
import {
  validateManifest,
  validateComponents,
  validateComments,
  formatValidationError,
  isOk,
  isErr,
} from './validators';

// Import fixture data
import manifestFixture from '@/fixtures/manifest.json';
import componentsFixture from '@/fixtures/components.json';
import commentsFixture from '@/fixtures/comments.json';

// ============================================================================
// Manifest Validation Tests
// ============================================================================

describe('validateManifest', () => {
  it('should validate fixture manifest.json successfully', () => {
    const result = validateManifest(manifestFixture);

    expect(result.ok).toBe(true);
    if (isOk(result)) {
      expect(result.data.formatVersion).toBe('1.0');
      expect(result.data.projectName).toBe('Sample Schematic');
      expect(result.data.reviewStatus).toBe('pending');
    }
  });

  it('should validate a complete valid manifest', () => {
    const validManifest = {
      formatVersion: '1.0',
      generatedAt: '2026-01-06T10:30:00Z',
      kicadVersion: '9.0.0',
      projectName: 'Test Project',
      reviewStatus: 'in_progress',
      reviewStartedAt: '2026-01-06T11:00:00Z',
    };

    const result = validateManifest(validManifest);

    expect(result.ok).toBe(true);
    if (isOk(result)) {
      expect(result.data.reviewStatus).toBe('in_progress');
    }
  });

  it('should validate manifest with minimal required fields', () => {
    const minimalManifest = {
      formatVersion: '2.5',
      generatedAt: '2026-01-01T00:00:00Z',
      projectName: 'Minimal',
    };

    const result = validateManifest(minimalManifest);

    expect(result.ok).toBe(true);
    if (isOk(result)) {
      expect(result.data.reviewStatus).toBe('pending'); // default
    }
  });

  it('should return error for missing required fields', () => {
    const invalidManifest = {
      formatVersion: '1.0',
      // missing generatedAt and projectName
    };

    const result = validateManifest(invalidManifest);

    expect(result.ok).toBe(false);
    if (isErr(result)) {
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });

  it('should return error for invalid formatVersion pattern', () => {
    const invalidManifest = {
      formatVersion: 'v1', // should be "X.Y"
      generatedAt: '2026-01-06T10:30:00Z',
      projectName: 'Test',
    };

    const result = validateManifest(invalidManifest);

    expect(result.ok).toBe(false);
    if (isErr(result)) {
      const errorMsg = formatValidationError(result.error);
      expect(errorMsg).toContain('formatVersion');
    }
  });

  it('should return error for invalid date format', () => {
    const invalidManifest = {
      formatVersion: '1.0',
      generatedAt: '2026/01/06', // wrong format, should be ISO 8601
      projectName: 'Test',
    };

    const result = validateManifest(invalidManifest);

    expect(result.ok).toBe(false);
    if (isErr(result)) {
      const errorMsg = formatValidationError(result.error);
      expect(errorMsg).toContain('generatedAt');
    }
  });

  it('should return error for invalid reviewStatus', () => {
    const invalidManifest = {
      formatVersion: '1.0',
      generatedAt: '2026-01-06T10:30:00Z',
      projectName: 'Test',
      reviewStatus: 'invalid_status',
    };

    const result = validateManifest(invalidManifest);

    expect(result.ok).toBe(false);
  });

  it('should not throw error - returns Result instead', () => {
    const invalidData = null;

    // Should not throw
    expect(() => validateManifest(invalidData)).not.toThrow();

    const result = validateManifest(invalidData);
    expect(result.ok).toBe(false);
  });
});

// ============================================================================
// Components Validation Tests
// ============================================================================

describe('validateComponents', () => {
  it('should validate fixture components.json successfully', () => {
    const result = validateComponents(componentsFixture);

    expect(result.ok).toBe(true);
    if (isOk(result)) {
      expect(result.data).toHaveLength(7);
      expect(result.data[0].ref).toBe('R1');
      expect(result.data[3].ref).toBe('U1');
      expect(result.data[5].ref).toBe('PWR1');
      expect(result.data[6].ref).toBe('GND1');
    }
  });

  it('should validate an array with complete component data', () => {
    const components = [
      {
        ref: 'C1',
        value: '100uF',
        footprint: 'Capacitor_SMD:C_0805',
        posX: 150.5,
        posY: 75.2,
      },
    ];

    const result = validateComponents(components);

    expect(result.ok).toBe(true);
    if (isOk(result)) {
      expect(result.data[0].posX).toBe(150.5);
    }
  });

  it('should validate component with only required ref field', () => {
    const components = [{ ref: 'R1' }];

    const result = validateComponents(components);

    expect(result.ok).toBe(true);
    if (isOk(result)) {
      expect(result.data[0].value).toBeUndefined();
    }
  });

  it('should validate an empty components array', () => {
    const result = validateComponents([]);

    expect(result.ok).toBe(true);
    if (isOk(result)) {
      expect(result.data).toHaveLength(0);
    }
  });

  it('should return error for missing ref field', () => {
    const invalidComponents = [
      {
        value: '10k', // missing ref
        footprint: 'Resistor_SMD:R_0805',
      },
    ];

    const result = validateComponents(invalidComponents);

    expect(result.ok).toBe(false);
    if (isErr(result)) {
      const errorMsg = formatValidationError(result.error);
      expect(errorMsg).toContain('ref');
    }
  });

  it('should return error for invalid posX type', () => {
    const invalidComponents = [
      {
        ref: 'R1',
        posX: 'not-a-number',
      },
    ];

    const result = validateComponents(invalidComponents);

    expect(result.ok).toBe(false);
  });

  it('should return error when data is not an array', () => {
    const invalidData = { ref: 'R1' }; // object instead of array

    const result = validateComponents(invalidData);

    expect(result.ok).toBe(false);
  });
});

// ============================================================================
// Comments Validation Tests
// ============================================================================

describe('validateComments', () => {
  it('should validate fixture comments.json successfully', () => {
    const result = validateComments(commentsFixture);

    expect(result.ok).toBe(true);
    if (isOk(result)) {
      expect(result.data).toHaveLength(3);
      expect(result.data[0].author).toBe('Reviewer');
      expect(result.data[0].componentRef).toBe('C1');
      expect(result.data[1].parentId).toBe('550e8400-e29b-41d4-a716-446655440001');
      expect(result.data[2].status).toBe('resolved');
    }
  });

  it('should validate a complete valid comment', () => {
    const comments = [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        author: 'Reviewer',
        content: 'This capacitor value seems too low.',
        createdAt: '2026-01-06T10:30:00Z',
        componentRef: 'C1',
        status: 'open' as const,
      },
    ];

    const result = validateComments(comments);

    expect(result.ok).toBe(true);
    if (isOk(result)) {
      expect(result.data[0].author).toBe('Reviewer');
      expect(result.data[0].status).toBe('open');
    }
  });

  it('should validate a general comment without componentRef', () => {
    const comments = [
      {
        id: '123',
        author: 'Designer',
        content: 'Overall looks good!',
        createdAt: '2026-01-06T12:00:00Z',
        status: 'resolved' as const,
      },
    ];

    const result = validateComments(comments);

    expect(result.ok).toBe(true);
    if (isOk(result)) {
      expect(result.data[0].componentRef).toBeUndefined();
    }
  });

  it('should validate a reply comment with parentId', () => {
    const comments = [
      {
        id: 'reply-1',
        author: 'Designer',
        content: 'Good point, will fix.',
        createdAt: '2026-01-06T11:00:00Z',
        status: 'open' as const,
        parentId: 'parent-comment-id',
      },
    ];

    const result = validateComments(comments);

    expect(result.ok).toBe(true);
    if (isOk(result)) {
      expect(result.data[0].parentId).toBe('parent-comment-id');
    }
  });

  it('should validate an empty comments array', () => {
    const result = validateComments([]);

    expect(result.ok).toBe(true);
    if (isOk(result)) {
      expect(result.data).toHaveLength(0);
    }
  });

  it('should return error for missing required fields', () => {
    const invalidComments = [
      {
        id: '123',
        // missing author, content, createdAt, status
      },
    ];

    const result = validateComments(invalidComments);

    expect(result.ok).toBe(false);
    if (isErr(result)) {
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });

  it('should return error for invalid status value', () => {
    const invalidComments = [
      {
        id: '123',
        author: 'Test',
        content: 'Test',
        createdAt: '2026-01-06T10:00:00Z',
        status: 'pending', // invalid, should be 'open' or 'resolved'
      },
    ];

    const result = validateComments(invalidComments);

    expect(result.ok).toBe(false);
  });

  it('should return error for invalid createdAt format', () => {
    const invalidComments = [
      {
        id: '123',
        author: 'Test',
        content: 'Test',
        createdAt: 'yesterday', // invalid format
        status: 'open',
      },
    ];

    const result = validateComments(invalidComments);

    expect(result.ok).toBe(false);
  });
});

// ============================================================================
// Utility Function Tests
// ============================================================================

describe('formatValidationError', () => {
  it('should format errors with paths', () => {
    const result = validateManifest({ formatVersion: 'invalid' });

    if (isErr(result)) {
      const formatted = formatValidationError(result.error);
      expect(typeof formatted).toBe('string');
      expect(formatted.length).toBeGreaterThan(0);
    }
  });
});

describe('isOk and isErr type guards', () => {
  it('isOk returns true for successful result', () => {
    const result = validateComponents([{ ref: 'R1' }]);
    expect(isOk(result)).toBe(true);
    expect(isErr(result)).toBe(false);
  });

  it('isErr returns true for error result', () => {
    const result = validateComponents('not-an-array');
    expect(isErr(result)).toBe(true);
    expect(isOk(result)).toBe(false);
  });
});
