import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_PAN, DEFAULT_ZOOM, MAX_ZOOM, MIN_ZOOM, useViewerStore } from './viewerStore';

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
      zoom: DEFAULT_ZOOM,
      pan: DEFAULT_PAN,
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

  describe('zoom state (Story 2.1)', () => {
    it('initializes with default zoom value', () => {
      const state = useViewerStore.getState();
      expect(state.zoom).toBe(DEFAULT_ZOOM);
      expect(state.zoom).toBe(1.0);
    });

    it('sets zoom to a valid value', () => {
      const { setZoom } = useViewerStore.getState();
      setZoom(2.0);
      expect(useViewerStore.getState().zoom).toBe(2.0);
    });

    it('clamps zoom to maximum bound', () => {
      const { setZoom } = useViewerStore.getState();
      setZoom(10.0); // Above MAX_ZOOM (5.0)
      expect(useViewerStore.getState().zoom).toBe(MAX_ZOOM);
    });

    it('clamps zoom to minimum bound', () => {
      const { setZoom } = useViewerStore.getState();
      setZoom(0.01); // Below MIN_ZOOM (0.1)
      expect(useViewerStore.getState().zoom).toBe(MIN_ZOOM);
    });

    it('allows zoom at boundary values', () => {
      const { setZoom } = useViewerStore.getState();

      setZoom(MIN_ZOOM);
      expect(useViewerStore.getState().zoom).toBe(MIN_ZOOM);

      setZoom(MAX_ZOOM);
      expect(useViewerStore.getState().zoom).toBe(MAX_ZOOM);
    });
  });

  describe('pan state (Story 2.1)', () => {
    it('initializes with default pan value', () => {
      const state = useViewerStore.getState();
      expect(state.pan).toEqual(DEFAULT_PAN);
      expect(state.pan).toEqual({ x: 0, y: 0 });
    });

    it('sets pan to a new position', () => {
      const { setPan } = useViewerStore.getState();
      setPan({ x: 100, y: 200 });
      expect(useViewerStore.getState().pan).toEqual({ x: 100, y: 200 });
    });

    it('allows negative pan values', () => {
      const { setPan } = useViewerStore.getState();
      setPan({ x: -50, y: -75 });
      expect(useViewerStore.getState().pan).toEqual({ x: -50, y: -75 });
    });
  });

  describe('resetView (Story 2.1)', () => {
    it('resets zoom and pan to defaults', () => {
      const { setZoom, setPan, resetView } = useViewerStore.getState();

      // Set non-default values
      setZoom(3.0);
      setPan({ x: 150, y: -200 });

      // Verify changed
      expect(useViewerStore.getState().zoom).toBe(3.0);
      expect(useViewerStore.getState().pan).toEqual({ x: 150, y: -200 });

      // Reset
      resetView();

      // Verify defaults restored
      expect(useViewerStore.getState().zoom).toBe(DEFAULT_ZOOM);
      expect(useViewerStore.getState().pan).toEqual(DEFAULT_PAN);
    });

    it('does not affect other state when resetting view', () => {
      // Set up state
      useViewerStore.setState({
        svg: mockSvgContent,
        isInitialized: true,
        zoom: 2.5,
        pan: { x: 100, y: 100 },
      });

      const { resetView } = useViewerStore.getState();
      resetView();

      const state = useViewerStore.getState();
      expect(state.zoom).toBe(DEFAULT_ZOOM);
      expect(state.pan).toEqual(DEFAULT_PAN);
      // Other state preserved
      expect(state.svg).toBe(mockSvgContent);
      expect(state.isInitialized).toBe(true);
    });
  });
});
