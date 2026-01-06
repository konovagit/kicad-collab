import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useViewerStore } from './viewerStore';

// Sample SVG content for testing
const mockSvgContent = '<svg><rect/></svg>';

describe('viewerStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useViewerStore.setState({
      isInitialized: false,
      svg: null,
      isLoadingSvg: false,
      loadError: null,
    });
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('initializes with isInitialized as false', () => {
      const state = useViewerStore.getState();
      expect(state.isInitialized).toBe(false);
    });

    it('sets isInitialized to true', () => {
      const { setInitialized } = useViewerStore.getState();
      setInitialized(true);
      expect(useViewerStore.getState().isInitialized).toBe(true);
    });

    it('sets isInitialized to false', () => {
      useViewerStore.setState({ isInitialized: true });
      const { setInitialized } = useViewerStore.getState();
      setInitialized(false);
      expect(useViewerStore.getState().isInitialized).toBe(false);
    });
  });

  describe('clearError', () => {
    it('clears the loadError state', () => {
      // Set an error first
      useViewerStore.setState({ loadError: 'Some error message' });
      expect(useViewerStore.getState().loadError).toBe('Some error message');

      // Clear the error
      const { clearError } = useViewerStore.getState();
      clearError();

      expect(useViewerStore.getState().loadError).toBeNull();
    });

    it('does not affect other state when clearing error', () => {
      useViewerStore.setState({
        loadError: 'Error',
        svg: mockSvgContent,
        isLoadingSvg: false,
        isInitialized: true,
      });

      const { clearError } = useViewerStore.getState();
      clearError();

      const state = useViewerStore.getState();
      expect(state.loadError).toBeNull();
      expect(state.svg).toBe(mockSvgContent);
      expect(state.isInitialized).toBe(true);
    });
  });

  describe('loadSnapshot', () => {
    it('returns Result with ok:true and SVG data on success', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockSvgContent),
      } as Response);

      const { loadSnapshot } = useViewerStore.getState();
      const result = await loadSnapshot();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toBe(mockSvgContent);
      }
    });

    it('returns Result with ok:false and Error on HTTP error', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 404,
      } as Response);

      const { loadSnapshot } = useViewerStore.getState();
      const result = await loadSnapshot();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('404');
      }
    });

    it('returns Result with ok:false and Error on network error', async () => {
      vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network failed'));

      const { loadSnapshot } = useViewerStore.getState();
      const result = await loadSnapshot();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Network failed');
      }
    });

    it('prevents duplicate loads and returns error Result', async () => {
      // Set loading state manually
      useViewerStore.setState({ isLoadingSvg: true });

      const { loadSnapshot } = useViewerStore.getState();
      const result = await loadSnapshot();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Load already in progress');
      }
    });

    it('updates store state on successful load', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockSvgContent),
      } as Response);

      const { loadSnapshot } = useViewerStore.getState();
      await loadSnapshot();

      const state = useViewerStore.getState();
      expect(state.svg).toBe(mockSvgContent);
      expect(state.isLoadingSvg).toBe(false);
      expect(state.loadError).toBeNull();
      expect(state.isInitialized).toBe(true);
    });

    it('updates store state on failed load', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      const { loadSnapshot } = useViewerStore.getState();
      await loadSnapshot();

      const state = useViewerStore.getState();
      expect(state.svg).toBeNull();
      expect(state.isLoadingSvg).toBe(false);
      expect(state.loadError).toContain('HTTP 500');
    });
  });
});
