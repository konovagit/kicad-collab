import { create } from 'zustand';

interface ViewerState {
  // Placeholder - expanded in future stories
  isInitialized: boolean;
  setInitialized: (value: boolean) => void;
}

export const useViewerStore = create<ViewerState>((set) => ({
  isInitialized: false,
  setInitialized: (value) => set({ isInitialized: value }),
}));
