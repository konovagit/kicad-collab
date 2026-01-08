import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useComponentHover } from './useComponentHover';
import { useViewerStore } from '@/stores/viewerStore';

describe('useComponentHover', () => {
  beforeEach(() => {
    // Reset store to initial state
    useViewerStore.setState({
      hoveredRef: null,
    });
  });

  describe('hoveredRef', () => {
    it('returns null when no component is hovered', () => {
      const { result } = renderHook(() => useComponentHover());
      expect(result.current.hoveredRef).toBeNull();
    });

    it('returns the current hoveredRef from store', () => {
      useViewerStore.setState({ hoveredRef: 'R1' });
      const { result } = renderHook(() => useComponentHover());
      expect(result.current.hoveredRef).toBe('R1');
    });
  });

  describe('handleMouseEnter', () => {
    it('sets hoveredRef when called with a ref', () => {
      const { result } = renderHook(() => useComponentHover());

      act(() => {
        result.current.handleMouseEnter('R1');
      });

      expect(useViewerStore.getState().hoveredRef).toBe('R1');
    });

    it('updates hoveredRef when called with different ref', () => {
      const { result } = renderHook(() => useComponentHover());

      act(() => {
        result.current.handleMouseEnter('R1');
      });
      expect(useViewerStore.getState().hoveredRef).toBe('R1');

      act(() => {
        result.current.handleMouseEnter('C1');
      });
      expect(useViewerStore.getState().hoveredRef).toBe('C1');
    });
  });

  describe('handleMouseLeave', () => {
    it('clears hoveredRef when called', () => {
      useViewerStore.setState({ hoveredRef: 'R1' });
      const { result } = renderHook(() => useComponentHover());

      act(() => {
        result.current.handleMouseLeave();
      });

      expect(useViewerStore.getState().hoveredRef).toBeNull();
    });

    it('does nothing when already null', () => {
      const { result } = renderHook(() => useComponentHover());

      act(() => {
        result.current.handleMouseLeave();
      });

      expect(useViewerStore.getState().hoveredRef).toBeNull();
    });
  });

  describe('handler stability', () => {
    it('handleMouseEnter is stable across renders (useCallback)', () => {
      const { result, rerender } = renderHook(() => useComponentHover());
      const firstHandler = result.current.handleMouseEnter;

      rerender();
      const secondHandler = result.current.handleMouseEnter;

      expect(firstHandler).toBe(secondHandler);
    });

    it('handleMouseLeave is stable across renders (useCallback)', () => {
      const { result, rerender } = renderHook(() => useComponentHover());
      const firstHandler = result.current.handleMouseLeave;

      rerender();
      const secondHandler = result.current.handleMouseLeave;

      expect(firstHandler).toBe(secondHandler);
    });
  });
});
