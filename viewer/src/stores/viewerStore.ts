import { create } from 'zustand';

import type { Result } from '@/types';

interface ViewerState {
  // Initialization
  isInitialized: boolean;
  setInitialized: (value: boolean) => void;

  // SVG state (Story 1.4)
  svg: string | null;
  isLoadingSvg: boolean;
  loadError: string | null;

  // SVG actions - returns Result type per architecture pattern
  loadSnapshot: () => Promise<Result<string, Error>>;
  clearError: () => void;
}

export const useViewerStore = create<ViewerState>((set, get) => ({
  // Initialization
  isInitialized: false,
  setInitialized: (value) => set({ isInitialized: value }),

  // SVG state
  svg: null,
  isLoadingSvg: false,
  loadError: null,

  // SVG actions - returns Result type per architecture pattern
  loadSnapshot: async (): Promise<Result<string, Error>> => {
    // Prevent duplicate loads
    if (get().isLoadingSvg) {
      return { ok: false, error: new Error('Load already in progress') };
    }

    set({ isLoadingSvg: true, loadError: null });

    try {
      const response = await fetch('/fixtures/sample-schematic.svg');

      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}`);
        set({
          isLoadingSvg: false,
          loadError: `Failed to load schematic: HTTP ${response.status}`,
          svg: null,
        });
        return { ok: false, error };
      }

      const svgContent = await response.text();
      set({
        svg: svgContent,
        isLoadingSvg: false,
        loadError: null,
        isInitialized: true,
      });
      return { ok: true, data: svgContent };
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Unknown error occurred');
      set({
        isLoadingSvg: false,
        loadError: `Failed to load schematic: ${errorObj.message}`,
        svg: null,
      });
      return { ok: false, error: errorObj };
    }
  },

  clearError: () => set({ loadError: null }),
}));
