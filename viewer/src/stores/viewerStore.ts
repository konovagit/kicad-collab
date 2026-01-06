import { create } from 'zustand';

interface ViewerState {
  // Initialization
  isInitialized: boolean;
  setInitialized: (value: boolean) => void;

  // SVG state (Story 1.4)
  svg: string | null;
  isLoadingSvg: boolean;
  loadError: string | null;

  // SVG actions
  loadSnapshot: () => Promise<void>;
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

  // SVG actions
  loadSnapshot: async () => {
    // Prevent duplicate loads
    if (get().isLoadingSvg) return;

    set({ isLoadingSvg: true, loadError: null });

    try {
      const response = await fetch('/fixtures/sample-schematic.svg');

      if (!response.ok) {
        set({
          isLoadingSvg: false,
          loadError: `Failed to load schematic: HTTP ${response.status}`,
          svg: null,
        });
        return;
      }

      const svgContent = await response.text();
      set({
        svg: svgContent,
        isLoadingSvg: false,
        loadError: null,
        isInitialized: true,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      set({
        isLoadingSvg: false,
        loadError: `Failed to load schematic: ${errorMessage}`,
        svg: null,
      });
    }
  },

  clearError: () => set({ loadError: null }),
}));
