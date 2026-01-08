import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useComponentSelection } from './useComponentSelection';
import { useViewerStore } from '@/stores/viewerStore';

describe('useComponentSelection', () => {
  beforeEach(() => {
    // Reset store to initial state
    useViewerStore.setState({
      selectedRef: null,
    });
  });

  describe('selectedRef', () => {
    it('returns null when no component is selected', () => {
      const { result } = renderHook(() => useComponentSelection());
      expect(result.current.selectedRef).toBeNull();
    });

    it('returns the current selectedRef from store', () => {
      useViewerStore.setState({ selectedRef: 'R1' });
      const { result } = renderHook(() => useComponentSelection());
      expect(result.current.selectedRef).toBe('R1');
    });
  });

  describe('handleClick', () => {
    it('selects a component when called with a ref', () => {
      const { result } = renderHook(() => useComponentSelection());

      act(() => {
        result.current.handleClick('R1');
      });

      expect(useViewerStore.getState().selectedRef).toBe('R1');
    });

    it('changes selection when called with different ref', () => {
      const { result } = renderHook(() => useComponentSelection());

      act(() => {
        result.current.handleClick('R1');
      });
      expect(useViewerStore.getState().selectedRef).toBe('R1');

      act(() => {
        result.current.handleClick('C1');
      });
      expect(useViewerStore.getState().selectedRef).toBe('C1');
    });

    it('clears selection when called with null', () => {
      useViewerStore.setState({ selectedRef: 'R1' });
      const { result } = renderHook(() => useComponentSelection());

      act(() => {
        result.current.handleClick(null);
      });

      expect(useViewerStore.getState().selectedRef).toBeNull();
    });
  });

  describe('handleClickOutside', () => {
    it('clears selection when called', () => {
      useViewerStore.setState({ selectedRef: 'R1' });
      const { result } = renderHook(() => useComponentSelection());

      act(() => {
        result.current.handleClickOutside();
      });

      expect(useViewerStore.getState().selectedRef).toBeNull();
    });

    it('does nothing when already null', () => {
      const { result } = renderHook(() => useComponentSelection());

      act(() => {
        result.current.handleClickOutside();
      });

      expect(useViewerStore.getState().selectedRef).toBeNull();
    });
  });

  describe('handler stability', () => {
    it('handleClick is stable across renders (useCallback)', () => {
      const { result, rerender } = renderHook(() => useComponentSelection());
      const firstHandler = result.current.handleClick;

      rerender();
      const secondHandler = result.current.handleClick;

      expect(firstHandler).toBe(secondHandler);
    });

    it('handleClickOutside is stable across renders (useCallback)', () => {
      const { result, rerender } = renderHook(() => useComponentSelection());
      const firstHandler = result.current.handleClickOutside;

      rerender();
      const secondHandler = result.current.handleClickOutside;

      expect(firstHandler).toBe(secondHandler);
    });
  });
});
