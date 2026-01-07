/**
 * Tests for SVG parser utilities
 * Story 2.2: SVG Element to Component Mapping
 */

import { describe, it, expect } from 'vitest';
import { extractDataRefs } from './svgParser';

describe('svgParser', () => {
  describe('extractDataRefs', () => {
    it('extracts all data-ref elements', () => {
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg">
          <g data-ref="R1" data-value="10k"></g>
          <g data-ref="C1" data-value="100nF"></g>
        </svg>
      `;
      const refs = extractDataRefs(svg);

      expect(refs.size).toBe(2);
      expect(refs.has('R1')).toBe(true);
      expect(refs.has('C1')).toBe(true);
    });

    it('handles SVG with no data-ref elements', () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg"><g></g><rect></rect></svg>';
      const refs = extractDataRefs(svg);

      expect(refs.size).toBe(0);
    });

    it('handles empty SVG', () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
      const refs = extractDataRefs(svg);

      expect(refs.size).toBe(0);
    });

    it('extracts nested data-ref elements', () => {
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg">
          <g id="layer1">
            <g data-ref="U1" data-value="ESP32">
              <rect></rect>
            </g>
          </g>
        </svg>
      `;
      const refs = extractDataRefs(svg);

      expect(refs.size).toBe(1);
      expect(refs.has('U1')).toBe(true);
    });

    it('ignores elements with empty data-ref attribute', () => {
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg">
          <g data-ref="R1"></g>
          <g data-ref=""></g>
        </svg>
      `;
      const refs = extractDataRefs(svg);

      expect(refs.size).toBe(1);
      expect(refs.has('R1')).toBe(true);
      expect(refs.has('')).toBe(false);
    });

    it('handles multiple element types with data-ref', () => {
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg">
          <g data-ref="R1"></g>
          <text data-ref="LABEL1">Label</text>
          <path data-ref="NET1" d="M0 0 L10 10"></path>
        </svg>
      `;
      const refs = extractDataRefs(svg);

      expect(refs.size).toBe(3);
      expect(refs.has('R1')).toBe(true);
      expect(refs.has('LABEL1')).toBe(true);
      expect(refs.has('NET1')).toBe(true);
    });

    it('returns the element reference for each ref', () => {
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg">
          <g data-ref="R1" data-value="10k"></g>
        </svg>
      `;
      const refs = extractDataRefs(svg);

      const element = refs.get('R1');
      expect(element).toBeDefined();
      expect(element?.tagName.toLowerCase()).toBe('g');
      expect(element?.getAttribute('data-value')).toBe('10k');
    });

    it('handles duplicate data-ref values (last wins)', () => {
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg">
          <g data-ref="R1" data-value="first"></g>
          <g data-ref="R1" data-value="second"></g>
        </svg>
      `;
      const refs = extractDataRefs(svg);

      expect(refs.size).toBe(1);
      const element = refs.get('R1');
      expect(element?.getAttribute('data-value')).toBe('second');
    });

    it('parses fixture-like SVG structure correctly', () => {
      // Note: SVG loaded via fetch comes without XML declaration
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
          <title>Sample KiCad Schematic</title>
          <rect width="800" height="600" fill="#fafafa"/>
          <g data-ref="R1" data-value="10k">
            <rect x="100" y="100" width="60" height="20" fill="none" stroke="#000"/>
            <text x="130" y="95">R1</text>
          </g>
          <g data-ref="U1" data-value="ESP32-WROOM">
            <rect x="350" y="150" width="120" height="200" fill="#f5f5f5" stroke="#000"/>
          </g>
        </svg>`;
      const refs = extractDataRefs(svg);

      expect(refs.size).toBe(2);
      expect(refs.has('R1')).toBe(true);
      expect(refs.has('U1')).toBe(true);
    });
  });
});
