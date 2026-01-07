/**
 * Tests for useComponentMapping hook
 * Story 2.2: SVG Element to Component Mapping
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useComponentMapping } from './useComponentMapping';
import { useViewerStore } from '@/stores/viewerStore';
import type { Component } from '@/types';

// Mock components
const mockComponents: Component[] = [
  { ref: 'R1', value: '10k', footprint: 'Resistor_SMD:R_0805', posX: 130, posY: 110 },
  { ref: 'C1', value: '100nF', footprint: 'Capacitor_SMD:C_0805', posX: 255, posY: 110 },
];

// Mock SVG with data-ref attributes
const mockSvg = `<svg xmlns="http://www.w3.org/2000/svg">
  <g data-ref="R1" data-value="10k"></g>
  <g data-ref="C1" data-value="100nF"></g>
</svg>`;

describe('useComponentMapping', () => {
  beforeEach(() => {
    // Reset store
    useViewerStore.setState({
      svg: null,
      components: [],
      componentIndex: new Map(),
      isLoadingComponents: false,
      loadComponentsError: null,
    });
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('starts with empty component index', () => {
      const { result } = renderHook(() => useComponentMapping());

      expect(result.current.isLoaded).toBe(false);
      expect(result.current.hasComponent('R1')).toBe(false);
    });

    it('returns zero component count initially', () => {
      const { result } = renderHook(() => useComponentMapping());

      expect(result.current.componentCount).toBe(0);
    });
  });

  describe('loading and mapping', () => {
    it('builds component index when components and SVG are available', async () => {
      // Directly set the store state to simulate loaded state
      const componentIndex = new Map<string, Component>([
        ['R1', mockComponents[0]],
        ['C1', mockComponents[1]],
      ]);

      useViewerStore.setState({
        svg: mockSvg,
        components: mockComponents,
        componentIndex,
      });

      const { result } = renderHook(() => useComponentMapping());

      // With index set, hasComponent should work
      expect(result.current.hasComponent('R1')).toBe(true);
      expect(result.current.hasComponent('C1')).toBe(true);
      expect(result.current.hasComponent('NONEXISTENT')).toBe(false);
    });

    it('provides getComponent helper', () => {
      const componentIndex = new Map<string, Component>([
        ['R1', mockComponents[0]],
        ['C1', mockComponents[1]],
      ]);

      useViewerStore.setState({
        svg: mockSvg,
        components: mockComponents,
        componentIndex,
      });

      const { result } = renderHook(() => useComponentMapping());

      const component = result.current.getComponent('R1');
      expect(component).toBeDefined();
      expect(component?.ref).toBe('R1');
      expect(component?.value).toBe('10k');
    });

    it('returns undefined for non-existent component', () => {
      useViewerStore.setState({
        svg: mockSvg,
        components: mockComponents,
        componentIndex: new Map([['R1', mockComponents[0]]]),
      });

      const { result } = renderHook(() => useComponentMapping());

      const component = result.current.getComponent('NONEXISTENT');
      expect(component).toBeUndefined();
    });
  });

  describe('component count', () => {
    it('returns correct component count', () => {
      const componentIndex = new Map<string, Component>([
        ['R1', mockComponents[0]],
        ['C1', mockComponents[1]],
      ]);

      useViewerStore.setState({
        svg: mockSvg,
        components: mockComponents,
        componentIndex,
      });

      const { result } = renderHook(() => useComponentMapping());

      expect(result.current.componentCount).toBe(2);
    });
  });

  describe('loading state', () => {
    it('exposes isLoadingComponents from store', () => {
      useViewerStore.setState({ isLoadingComponents: true });

      const { result } = renderHook(() => useComponentMapping());

      expect(result.current.isLoadingComponents).toBe(true);
    });
  });

  describe('effect behavior - loading components', () => {
    it('calls loadComponents when SVG is available and components not loaded', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockComponents),
      } as Response);

      // Set SVG but no components yet
      useViewerStore.setState({ svg: mockSvg, components: [] });

      renderHook(() => useComponentMapping());

      // Wait for the effect to run and fetch to be called
      await waitFor(
        () => {
          expect(global.fetch).toHaveBeenCalledWith('/fixtures/components.json');
        },
        { timeout: 1000 }
      );
    });
  });

  describe('effect behavior - building index', () => {
    it('builds index and sets warnings when both SVG and components are present', async () => {
      // SVG only has R1
      const svgWithOnlyR1 = `<svg xmlns="http://www.w3.org/2000/svg">
        <g data-ref="R1"></g>
      </svg>`;

      // Start with SVG and components already loaded
      useViewerStore.setState({
        svg: svgWithOnlyR1,
        components: mockComponents, // R1 and C1
      });

      const { result } = renderHook(() => useComponentMapping());

      // Wait for the effect to run
      await waitFor(
        () => {
          expect(result.current.isLoaded).toBe(true);
        },
        { timeout: 1000 }
      );

      // C1 should have a warning
      expect(result.current.warnings).toHaveLength(1);
      expect(result.current.warnings[0]).toContain('C1');
    });

    it('has no warnings when all components have SVG elements', async () => {
      useViewerStore.setState({
        svg: mockSvg,
        components: mockComponents,
      });

      const { result } = renderHook(() => useComponentMapping());

      await waitFor(
        () => {
          expect(result.current.isLoaded).toBe(true);
        },
        { timeout: 1000 }
      );

      expect(result.current.warnings).toHaveLength(0);
    });
  });
});
