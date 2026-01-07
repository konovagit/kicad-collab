/**
 * SVG parser utilities for extracting data-ref attributes
 * Story 2.2: SVG Element to Component Mapping
 *
 * Parses SVG string and extracts elements with data-ref attributes
 * for component mapping.
 */

/**
 * Extract all elements with data-ref attributes from SVG string
 * Uses DOMParser for reliable XML parsing (not regex)
 *
 * @param svgString - SVG content as string
 * @returns Map of ref value to Element for O(1) lookup
 */
export function extractDataRefs(svgString: string): Map<string, Element> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');

  const refMap = new Map<string, Element>();
  const elements = doc.querySelectorAll('[data-ref]');

  elements.forEach((element) => {
    const ref = element.getAttribute('data-ref');
    // Only add non-empty refs
    if (ref) {
      refMap.set(ref, element);
    }
  });

  return refMap;
}
