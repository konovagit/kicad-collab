/**
 * Component data loading utilities
 * Story 2.2: SVG Element to Component Mapping
 *
 * Loads components.json and validates against the Component schema.
 * Uses Result type pattern for error handling.
 */

import type { Component, Result } from '@/types';
import { validateComponents, formatValidationError } from './validators';

/**
 * Load components from components.json fixture
 * @returns Result with validated Component[] or Error
 */
export async function loadComponents(): Promise<Result<Component[], Error>> {
  try {
    const response = await fetch('/fixtures/components.json');

    if (!response.ok) {
      return {
        ok: false,
        error: new Error(`HTTP ${response.status}`),
      };
    }

    const data = await response.json();

    // Validate against Component schema
    const validationResult = validateComponents(data);

    if (!validationResult.ok) {
      return {
        ok: false,
        error: new Error(formatValidationError(validationResult.error)),
      };
    }

    return { ok: true, data: validationResult.data };
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error('Unknown error');
    return { ok: false, error: errorObj };
  }
}
