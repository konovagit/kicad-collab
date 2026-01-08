import { useCallback } from 'react';

import { useViewerStore } from '@/stores/viewerStore';

/**
 * Hook for managing component selection state.
 * Uses event delegation pattern - do NOT attach to individual SVG elements.
 *
 * Story 2.4: Component Selection & Detail Panel
 *
 * @returns Object with:
 *   - selectedRef: Currently selected component ref (or null)
 *   - handleClick: Call when a component is clicked (or null for empty space)
 *   - handleClickOutside: Call when clicking on empty space (clears selection)
 */
export function useComponentSelection() {
  // Use selector to prevent re-renders on unrelated state changes
  const selectedRef = useViewerStore((s) => s.selectedRef);
  const selectComponent = useViewerStore((s) => s.selectComponent);
  const clearSelection = useViewerStore((s) => s.clearSelection);

  /**
   * Handle click on a component or empty space.
   * Call with ref to select, or null to clear selection.
   */
  const handleClick = useCallback(
    (ref: string | null) => {
      selectComponent(ref);
    },
    [selectComponent]
  );

  /**
   * Handle click outside all components.
   * Clears the current selection.
   */
  const handleClickOutside = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  return {
    selectedRef,
    handleClick,
    handleClickOutside,
  };
}
