/**
 * Tests for component index mapping utilities
 * Story 2.2: SVG Element to Component Mapping
 */

import { describe, it, expect } from 'vitest';
import { buildComponentIndex } from './componentIndex';
import type { Component } from '@/types';

describe('componentIndex', () => {
  describe('buildComponentIndex', () => {
    it('builds index from components with matching SVG elements', () => {
      const components: Component[] = [
        { ref: 'R1', value: '10k' },
        { ref: 'C1', value: '100nF' },
      ];
      const svgRefs = new Map<string, Element>([
        ['R1', document.createElement('g')],
        ['C1', document.createElement('g')],
      ]);

      const index = buildComponentIndex(components, svgRefs);

      expect(index.byRef.size).toBe(2);
      expect(index.byRef.get('R1')?.value).toBe('10k');
      expect(index.byRef.get('C1')?.value).toBe('100nF');
      expect(index.warnings).toHaveLength(0);
    });

    it('warns for component without matching SVG element (AC #3)', () => {
      const components: Component[] = [{ ref: 'R1', value: '10k' }];
      const svgRefs = new Map<string, Element>(); // No SVG elements

      const index = buildComponentIndex(components, svgRefs);

      expect(index.byRef.size).toBe(1);
      expect(index.byRef.get('R1')).toBeDefined();
      expect(index.warnings).toHaveLength(1);
      expect(index.warnings[0]).toContain('R1');
      expect(index.warnings[0]).toContain('no matching SVG element');
    });

    it('silently ignores SVG elements without matching components (AC #4)', () => {
      const components: Component[] = [{ ref: 'R1' }];
      const svgRefs = new Map<string, Element>([
        ['R1', document.createElement('g')],
        ['ORPHAN', document.createElement('g')], // No matching component
      ]);

      const index = buildComponentIndex(components, svgRefs);

      expect(index.byRef.size).toBe(1);
      expect(index.byRef.has('ORPHAN')).toBe(false);
      expect(index.warnings).toHaveLength(0); // No warnings for orphan SVG elements
    });

    it('handles empty components array', () => {
      const components: Component[] = [];
      const svgRefs = new Map<string, Element>([['R1', document.createElement('g')]]);

      const index = buildComponentIndex(components, svgRefs);

      expect(index.byRef.size).toBe(0);
      expect(index.warnings).toHaveLength(0);
    });

    it('handles empty SVG refs map', () => {
      const components: Component[] = [{ ref: 'R1' }, { ref: 'C1' }];
      const svgRefs = new Map<string, Element>();

      const index = buildComponentIndex(components, svgRefs);

      expect(index.byRef.size).toBe(2);
      expect(index.warnings).toHaveLength(2);
    });

    it('handles both empty inputs', () => {
      const components: Component[] = [];
      const svgRefs = new Map<string, Element>();

      const index = buildComponentIndex(components, svgRefs);

      expect(index.byRef.size).toBe(0);
      expect(index.warnings).toHaveLength(0);
    });

    it('preserves all component fields in index', () => {
      const components: Component[] = [
        {
          ref: 'U1',
          value: 'ESP32-WROOM',
          footprint: 'Module:ESP32-WROOM-32',
          posX: 410,
          posY: 250,
        },
      ];
      const svgRefs = new Map<string, Element>([['U1', document.createElement('g')]]);

      const index = buildComponentIndex(components, svgRefs);

      const component = index.byRef.get('U1');
      expect(component).toBeDefined();
      expect(component?.ref).toBe('U1');
      expect(component?.value).toBe('ESP32-WROOM');
      expect(component?.footprint).toBe('Module:ESP32-WROOM-32');
      expect(component?.posX).toBe(410);
      expect(component?.posY).toBe(250);
    });

    it('generates multiple warnings for multiple missing SVG elements', () => {
      const components: Component[] = [{ ref: 'R1' }, { ref: 'R2' }, { ref: 'C1' }];
      const svgRefs = new Map<string, Element>([
        ['R1', document.createElement('g')],
        // R2 and C1 missing from SVG
      ]);

      const index = buildComponentIndex(components, svgRefs);

      expect(index.byRef.size).toBe(3);
      expect(index.warnings).toHaveLength(2);
      expect(index.warnings.some((w) => w.includes('R2'))).toBe(true);
      expect(index.warnings.some((w) => w.includes('C1'))).toBe(true);
    });

    it('handles components with only required ref field', () => {
      const components: Component[] = [{ ref: 'GND1' }, { ref: 'PWR1' }];
      const svgRefs = new Map<string, Element>([
        ['GND1', document.createElement('g')],
        ['PWR1', document.createElement('g')],
      ]);

      const index = buildComponentIndex(components, svgRefs);

      expect(index.byRef.size).toBe(2);
      expect(index.byRef.get('GND1')?.ref).toBe('GND1');
      expect(index.byRef.get('GND1')?.value).toBeUndefined();
      expect(index.warnings).toHaveLength(0);
    });
  });
});
