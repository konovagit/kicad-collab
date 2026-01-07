/**
 * Tests for component data loading utilities
 * Story 2.2: SVG Element to Component Mapping
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadComponents } from './componentLoader';

describe('componentLoader', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loadComponents', () => {
    it('loads components.json successfully', async () => {
      const mockComponents = [
        { ref: 'R1', value: '10k', footprint: 'Resistor_SMD:R_0805', posX: 130, posY: 110 },
        { ref: 'C1', value: '100nF', footprint: 'Capacitor_SMD:C_0805', posX: 255, posY: 110 },
      ];

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockComponents,
      } as Response);

      const result = await loadComponents();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0].ref).toBe('R1');
        expect(result.data[0].value).toBe('10k');
        expect(result.data[1].ref).toBe('C1');
      }
    });

    it('returns error on HTTP 404', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      const result = await loadComponents();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('404');
      }
    });

    it('returns error on HTTP 500', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      const result = await loadComponents();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('500');
      }
    });

    it('returns error on network failure', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'));

      const result = await loadComponents();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Network error');
      }
    });

    it('handles non-Error thrown values', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce('string error');

      const result = await loadComponents();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Unknown error');
      }
    });

    it('returns error on invalid JSON structure', async () => {
      // Missing required 'ref' field
      const invalidComponents = [{ value: '10k' }];

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => invalidComponents,
      } as Response);

      const result = await loadComponents();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('ref');
      }
    });

    it('returns empty array for empty components.json', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      const result = await loadComponents();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toHaveLength(0);
      }
    });

    it('accepts components with only required ref field', async () => {
      const minimalComponents = [{ ref: 'R1' }, { ref: 'C1' }];

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => minimalComponents,
      } as Response);

      const result = await loadComponents();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0].ref).toBe('R1');
        expect(result.data[0].value).toBeUndefined();
      }
    });
  });
});
