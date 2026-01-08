import { create } from 'zustand';

import type { Component, Result } from '@/types';
import { loadComponents as loadComponentsFromFile } from '@/utils/componentLoader';

// Pan/Zoom constants (Story 2.1)
export const MIN_ZOOM = 0.1; // 10%
export const MAX_ZOOM = 5.0; // 500%
export const DEFAULT_ZOOM = 1.0;
export const DEFAULT_PAN = { x: 0, y: 0 };

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

  // Pan/Zoom state (Story 2.1)
  zoom: number;
  pan: { x: number; y: number };

  // Pan/Zoom actions (Story 2.1)
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  resetView: () => void;

  // Component state (Story 2.2)
  components: Component[];
  componentIndex: Map<string, Component>;
  isLoadingComponents: boolean;
  loadComponentsError: string | null;

  // Component actions (Story 2.2)
  loadComponents: () => Promise<Result<Component[], Error>>;
  setComponentIndex: (index: Map<string, Component>) => void;
  getComponent: (ref: string) => Component | undefined;

  // Hover state (Story 2.3)
  hoveredRef: string | null;
  setHoveredRef: (ref: string | null) => void;
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

  // Pan/Zoom state (Story 2.1)
  zoom: DEFAULT_ZOOM,
  pan: DEFAULT_PAN,

  // Pan/Zoom actions (Story 2.1)
  setZoom: (zoom: number) => {
    // Clamp zoom to valid bounds
    const clampedZoom = Math.min(Math.max(zoom, MIN_ZOOM), MAX_ZOOM);
    set({ zoom: clampedZoom });
  },

  setPan: (pan: { x: number; y: number }) => {
    set({ pan });
  },

  resetView: () => {
    set({ zoom: DEFAULT_ZOOM, pan: DEFAULT_PAN });
  },

  // Component state (Story 2.2)
  components: [],
  componentIndex: new Map<string, Component>(),
  isLoadingComponents: false,
  loadComponentsError: null,

  // Component actions (Story 2.2)
  loadComponents: async (): Promise<Result<Component[], Error>> => {
    // Prevent duplicate loads
    if (get().isLoadingComponents) {
      return { ok: false, error: new Error('Load already in progress') };
    }

    set({ isLoadingComponents: true, loadComponentsError: null });

    const result = await loadComponentsFromFile();

    if (result.ok) {
      set({
        components: result.data,
        isLoadingComponents: false,
        loadComponentsError: null,
      });
    } else {
      set({
        isLoadingComponents: false,
        loadComponentsError: result.error.message,
      });
    }

    return result;
  },

  setComponentIndex: (index: Map<string, Component>) => {
    set({ componentIndex: index });
  },

  getComponent: (ref: string): Component | undefined => {
    return get().componentIndex.get(ref);
  },

  // Hover state (Story 2.3)
  hoveredRef: null,
  setHoveredRef: (ref: string | null) => set({ hoveredRef: ref }),
}));
