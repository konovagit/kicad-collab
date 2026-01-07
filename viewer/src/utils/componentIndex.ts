/**
 * Component index mapping utilities
 * Story 2.2: SVG Element to Component Mapping
 *
 * Builds a mapping between component metadata and SVG elements
 * for O(1) lookup during interactions.
 */

import type { Component } from '@/types';

/**
 * Component index with ref-based lookup and validation warnings
 */
export interface ComponentIndex {
  /** Map of component ref to Component for O(1) lookup */
  byRef: Map<string, Component>;
  /** Warnings for components without matching SVG elements */
  warnings: string[];
}

/**
 * Build component index from components and SVG data-ref elements
 *
 * - Indexes all components by ref (AC #2)
 * - Warns for components without matching SVG element (AC #3)
 * - Silently ignores SVG elements without matching components (AC #4)
 *
 * @param components - Array of Component from components.json
 * @param svgRefs - Map of ref to Element from SVG parsing
 * @returns ComponentIndex with byRef map and warnings
 */
export function buildComponentIndex(
  components: Component[],
  svgRefs: Map<string, Element>
): ComponentIndex {
  const byRef = new Map<string, Component>();
  const warnings: string[] = [];

  // Index all components
  for (const component of components) {
    byRef.set(component.ref, component);

    // Warn if no matching SVG element (AC #3)
    if (!svgRefs.has(component.ref)) {
      warnings.push(`Component ${component.ref} has no matching SVG element`);
    }
  }

  // SVG elements without components are silently ignored (AC #4)
  // No action needed - they just won't be interactive

  return { byRef, warnings };
}
