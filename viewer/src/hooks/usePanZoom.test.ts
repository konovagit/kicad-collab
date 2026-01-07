import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  DEFAULT_PAN,
  DEFAULT_ZOOM,
  MAX_ZOOM,
  MIN_ZOOM,
  useViewerStore,
} from '@/stores/viewerStore';

import { usePanZoom } from './usePanZoom';

describe('usePanZoom', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useViewerStore.setState({
      zoom: DEFAULT_ZOOM,
      pan: DEFAULT_PAN,
    });
  });

  describe('initial state', () => {
    it('returns default zoom value', () => {
      const { result } = renderHook(() => usePanZoom());
      expect(result.current.zoom).toBe(DEFAULT_ZOOM);
      expect(result.current.zoom).toBe(1.0);
    });

    it('returns default pan value', () => {
      const { result } = renderHook(() => usePanZoom());
      expect(result.current.pan).toEqual(DEFAULT_PAN);
      expect(result.current.pan).toEqual({ x: 0, y: 0 });
    });

    it('is not dragging initially', () => {
      const { result } = renderHook(() => usePanZoom());
      expect(result.current.isDragging).toBe(false);
    });
  });

  describe('handleWheel - zoom centered on cursor', () => {
    const createWheelEvent = (
      deltaY: number,
      clientX: number,
      clientY: number
    ): React.WheelEvent<HTMLDivElement> => {
      return {
        preventDefault: () => {},
        deltaY,
        clientX,
        clientY,
        currentTarget: {
          getBoundingClientRect: () => ({
            left: 0,
            top: 0,
            width: 800,
            height: 600,
            right: 800,
            bottom: 600,
            x: 0,
            y: 0,
            toJSON: () => {},
          }),
        } as HTMLDivElement,
      } as React.WheelEvent<HTMLDivElement>;
    };

    it('zooms in on wheel scroll up (negative deltaY)', () => {
      const { result } = renderHook(() => usePanZoom());
      const initialZoom = result.current.zoom;

      act(() => {
        result.current.handleWheel(createWheelEvent(-100, 400, 300));
      });

      expect(result.current.zoom).toBeGreaterThan(initialZoom);
      expect(result.current.zoom).toBeCloseTo(1.1, 2);
    });

    it('zooms out on wheel scroll down (positive deltaY)', () => {
      const { result } = renderHook(() => usePanZoom());
      const initialZoom = result.current.zoom;

      act(() => {
        result.current.handleWheel(createWheelEvent(100, 400, 300));
      });

      expect(result.current.zoom).toBeLessThan(initialZoom);
      expect(result.current.zoom).toBeCloseTo(0.9, 2);
    });

    it('does not exceed maximum zoom', () => {
      useViewerStore.setState({ zoom: MAX_ZOOM - 0.1 });
      const { result } = renderHook(() => usePanZoom());

      act(() => {
        // Multiple zoom-in attempts
        for (let i = 0; i < 10; i++) {
          result.current.handleWheel(createWheelEvent(-100, 400, 300));
        }
      });

      expect(result.current.zoom).toBeLessThanOrEqual(MAX_ZOOM);
    });

    it('does not go below minimum zoom', () => {
      useViewerStore.setState({ zoom: MIN_ZOOM + 0.05 });
      const { result } = renderHook(() => usePanZoom());

      act(() => {
        // Multiple zoom-out attempts
        for (let i = 0; i < 10; i++) {
          result.current.handleWheel(createWheelEvent(100, 400, 300));
        }
      });

      expect(result.current.zoom).toBeGreaterThanOrEqual(MIN_ZOOM);
    });

    it('adjusts pan to keep cursor position stable during zoom', () => {
      const { result } = renderHook(() => usePanZoom());

      // Initial state: zoom = 1.0, pan = { x: 0, y: 0 }
      // Cursor at (400, 300)

      act(() => {
        result.current.handleWheel(createWheelEvent(-100, 400, 300));
      });

      // Pan should be adjusted so cursor point stays stable
      // With zoom 1.0 → 1.1, the pan should compensate
      // newPanX = cursorX - (cursorX - pan.x) * scale
      // newPanX = 400 - (400 - 0) * 1.1 = 400 - 440 = -40
      expect(result.current.pan.x).toBeCloseTo(-40, 0);
      expect(result.current.pan.y).toBeCloseTo(-30, 0);
    });
  });

  describe('handleMouseDown - start drag', () => {
    const createMouseEvent = (
      button: number,
      clientX: number,
      clientY: number
    ): React.MouseEvent<HTMLDivElement> => {
      return {
        button,
        clientX,
        clientY,
      } as React.MouseEvent<HTMLDivElement>;
    };

    it('starts dragging on left click', () => {
      const { result } = renderHook(() => usePanZoom());

      act(() => {
        result.current.handleMouseDown(createMouseEvent(0, 100, 100));
      });

      expect(result.current.isDragging).toBe(true);
    });

    it('ignores right click', () => {
      const { result } = renderHook(() => usePanZoom());

      act(() => {
        result.current.handleMouseDown(createMouseEvent(2, 100, 100));
      });

      expect(result.current.isDragging).toBe(false);
    });

    it('ignores middle click', () => {
      const { result } = renderHook(() => usePanZoom());

      act(() => {
        result.current.handleMouseDown(createMouseEvent(1, 100, 100));
      });

      expect(result.current.isDragging).toBe(false);
    });
  });

  describe('handleMouseMove - pan during drag', () => {
    const createMouseEvent = (
      clientX: number,
      clientY: number
    ): React.MouseEvent<HTMLDivElement> => {
      return {
        clientX,
        clientY,
      } as React.MouseEvent<HTMLDivElement>;
    };

    it('updates pan during drag', () => {
      const { result } = renderHook(() => usePanZoom());

      // Start dragging from (100, 100) with initial pan (0, 0)
      act(() => {
        result.current.handleMouseDown({
          button: 0,
          clientX: 100,
          clientY: 100,
        } as React.MouseEvent<HTMLDivElement>);
      });

      // Move to (200, 150) - delta is (100, 50)
      act(() => {
        result.current.handleMouseMove(createMouseEvent(200, 150));
      });

      expect(result.current.pan).toEqual({ x: 100, y: 50 });
    });

    it('does not update pan when not dragging', () => {
      const { result } = renderHook(() => usePanZoom());
      const initialPan = { ...result.current.pan };

      act(() => {
        result.current.handleMouseMove(createMouseEvent(200, 150));
      });

      expect(result.current.pan).toEqual(initialPan);
    });
  });

  describe('handleMouseUp - end drag', () => {
    it('stops dragging on mouse up', () => {
      const { result } = renderHook(() => usePanZoom());

      // Start dragging
      act(() => {
        result.current.handleMouseDown({
          button: 0,
          clientX: 100,
          clientY: 100,
        } as React.MouseEvent<HTMLDivElement>);
      });
      expect(result.current.isDragging).toBe(true);

      // End dragging
      act(() => {
        result.current.handleMouseUp();
      });

      expect(result.current.isDragging).toBe(false);
    });
  });

  describe('handleMouseLeave - cancel drag', () => {
    it('stops dragging when mouse leaves container', () => {
      const { result } = renderHook(() => usePanZoom());

      // Start dragging
      act(() => {
        result.current.handleMouseDown({
          button: 0,
          clientX: 100,
          clientY: 100,
        } as React.MouseEvent<HTMLDivElement>);
      });
      expect(result.current.isDragging).toBe(true);

      // Mouse leaves
      act(() => {
        result.current.handleMouseLeave();
      });

      expect(result.current.isDragging).toBe(false);
    });
  });

  describe('resetView', () => {
    it('resets zoom and pan to defaults', () => {
      // Set non-default values
      useViewerStore.setState({
        zoom: 2.5,
        pan: { x: 150, y: -200 },
      });

      const { result } = renderHook(() => usePanZoom());

      expect(result.current.zoom).toBe(2.5);
      expect(result.current.pan).toEqual({ x: 150, y: -200 });

      act(() => {
        result.current.resetView();
      });

      expect(result.current.zoom).toBe(DEFAULT_ZOOM);
      expect(result.current.pan).toEqual(DEFAULT_PAN);
    });
  });
});
