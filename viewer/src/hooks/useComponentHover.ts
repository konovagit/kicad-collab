import { useCallback } from 'react';

import { useViewerStore } from '@/stores/viewerStore';

/**
 * Hook for managing component hover state.
 * Uses event delegation pattern - do NOT attach to individual SVG elements.
 *
 * Story 2.3: Component Hover Highlight
 *
 * @returns Object with:
 *   - hoveredRef: Currently hovered component ref (or null)
 *   - handleMouseEnter: Call when mouse enters a component
 *   - handleMouseLeave: Call when mouse leaves all components
 */
export function useComponentHover() {
  // Use selector to prevent re-renders on unrelated state changes
  const hoveredRef = useViewerStore((s) => s.hoveredRef);
  const setHoveredRef = useViewerStore((s) => s.setHoveredRef);

  /**
   * Handle mouse entering a component.
   * Call this when a data-ref element is hovered.
   */
  const handleMouseEnter = useCallback(
    (ref: string) => {
      setHoveredRef(ref);
    },
    [setHoveredRef]
  );

  /**
   * Handle mouse leaving all components.
   * Call this when the mouse leaves all data-ref elements.
   */
  const handleMouseLeave = useCallback(() => {
    setHoveredRef(null);
  }, [setHoveredRef]);

  return {
    hoveredRef,
    handleMouseEnter,
    handleMouseLeave,
  };
}
