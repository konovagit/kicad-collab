import { useEffect } from 'react';

import { useViewerStore } from '@/stores/viewerStore';

/**
 * Hook for loading and accessing the schematic SVG.
 * Handles async loading with loading/error states.
 *
 * Uses Zustand store for state management and selectors
 * to prevent unnecessary re-renders.
 */
export function useSchematic() {
  // Use specific selectors to prevent unnecessary re-renders
  const svg = useViewerStore((s) => s.svg);
  const isLoadingSvg = useViewerStore((s) => s.isLoadingSvg);
  const loadError = useViewerStore((s) => s.loadError);
  const loadSnapshot = useViewerStore((s) => s.loadSnapshot);

  // Load SVG on mount
  useEffect(() => {
    // Only load if not already loaded and not currently loading
    if (!svg && !isLoadingSvg && !loadError) {
      loadSnapshot();
    }
  }, [svg, isLoadingSvg, loadError, loadSnapshot]);

  return {
    svg,
    isLoadingSvg,
    loadError,
    reload: loadSnapshot,
  };
}
