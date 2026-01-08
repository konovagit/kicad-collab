/**
 * Hook for SVG element to component mapping
 * Story 2.2: SVG Element to Component Mapping
 *
 * Orchestrates loading components.json, parsing SVG for data-ref elements,
 * and building the component index for O(1) lookup.
 */

import { useEffect, useMemo, useCallback, useRef } from 'react';

import { useViewerStore } from '@/stores/viewerStore';
import { extractDataRefs } from '@/utils/svgParser';
import { buildComponentIndex } from '@/utils/componentIndex';

/**
 * Hook for mapping SVG elements to component metadata.
 *
 * - Loads components.json when SVG becomes available
 * - Parses SVG for data-ref elements
 * - Builds component index with mapping
 * - Logs warnings for components without matching SVG elements (AC #3)
 * - Silently ignores SVG elements without matching components (AC #4)
 */
export function useComponentMapping() {
  // Store selectors
  const svg = useViewerStore((s) => s.svg);
  const components = useViewerStore((s) => s.components);
  const componentIndex = useViewerStore((s) => s.componentIndex);
  const isLoadingComponents = useViewerStore((s) => s.isLoadingComponents);
  const loadComponents = useViewerStore((s) => s.loadComponents);
  const setComponentIndex = useViewerStore((s) => s.setComponentIndex);
  const getComponent = useViewerStore((s) => s.getComponent);

  // Track if we've logged warnings to avoid duplicate logs
  const hasLoggedWarnings = useRef(false);

  // Track if we've attempted to load components (to prevent retries on empty array)
  const hasAttemptedLoad = useRef(false);

  // Load components when SVG becomes available
  useEffect(() => {
    // Don't load if: no SVG, already loading, already have components, or already attempted
    if (!svg || isLoadingComponents || components.length > 0 || hasAttemptedLoad.current) {
      return;
    }

    // Mark as attempted before loading
    hasAttemptedLoad.current = true;

    // Load components.json
    loadComponents();
  }, [svg, isLoadingComponents, components.length, loadComponents]);

  // Compute index and warnings once (memoized to avoid duplicate SVG parsing)
  const { warnings, isLoaded, computedIndex } = useMemo(() => {
    if (!svg || components.length === 0) {
      return { warnings: [], isLoaded: false, computedIndex: null };
    }

    // Parse SVG for data-ref elements (only once per svg/components change)
    const svgRefs = extractDataRefs(svg);

    // Build component index
    const index = buildComponentIndex(components, svgRefs);

    return { warnings: index.warnings, isLoaded: true, computedIndex: index.byRef };
  }, [svg, components]);

  // Update store with index when mapping changes (side effect)
  useEffect(() => {
    if (!computedIndex) {
      return;
    }

    // Update store with precomputed index
    setComponentIndex(computedIndex);

    // Log warnings to console (development only) - only once
    if (warnings.length > 0 && !hasLoggedWarnings.current && import.meta.env.DEV) {
      console.warn('[ComponentMapping] Warnings:', warnings);
      hasLoggedWarnings.current = true;
    }
  }, [computedIndex, warnings, setComponentIndex]);

  /**
   * Check if a component exists in the index
   */
  const hasComponent = useCallback(
    (ref: string): boolean => {
      return componentIndex.has(ref);
    },
    [componentIndex]
  );

  return {
    // State
    isLoaded,
    isLoadingComponents,
    warnings,
    componentCount: componentIndex.size,

    // Helpers
    getComponent,
    hasComponent,
  };
}
