import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useComments } from './useComments';
import { useViewerStore } from '@/stores/viewerStore';
import type { Comment } from '@/types';

// Sample comments for testing
const mockComments: Comment[] = [
  {
    id: 'comment-001',
    author: 'Alice',
    content: 'Check this capacitor value',
    createdAt: '2026-01-23T10:00:00Z',
    componentRef: 'C1',
    status: 'open',
  },
  {
    id: 'comment-002',
    author: 'Bob',
    content: 'Overall looks good',
    createdAt: '2026-01-23T11:00:00Z',
    status: 'open',
  },
  {
    id: 'comment-003',
    author: 'Carol',
    content: 'First comment',
    createdAt: '2026-01-23T09:00:00Z',
    componentRef: 'R1',
    status: 'open',
  },
];

describe('useComments', () => {
  beforeEach(() => {
    // Reset store to initial state
    useViewerStore.setState({
      comments: [],
      isLoadingComments: false,
      loadCommentsError: null,
      selectedRef: null,
    });
    vi.restoreAllMocks();
  });

  describe('sortedComments', () => {
    it('returns empty array when no comments exist', () => {
      const { result } = renderHook(() => useComments());
      expect(result.current.sortedComments).toEqual([]);
    });

    it('returns comments sorted by createdAt ascending (oldest first)', () => {
      useViewerStore.getState().setComments(mockComments);

      const { result } = renderHook(() => useComments());

      expect(result.current.sortedComments).toHaveLength(3);
      // Carol's comment (09:00) should be first (oldest)
      expect(result.current.sortedComments[0].author).toBe('Carol');
      // Alice's comment (10:00) should be second
      expect(result.current.sortedComments[1].author).toBe('Alice');
      // Bob's comment (11:00) should be last (newest)
      expect(result.current.sortedComments[2].author).toBe('Bob');
    });

    it('preserves original comments array (does not mutate)', () => {
      const originalComments = [...mockComments];
      useViewerStore.getState().setComments(mockComments);

      renderHook(() => useComments());

      // Original store comments should be unchanged
      const storeComments = useViewerStore.getState().comments;
      expect(storeComments[0].author).toBe(originalComments[0].author);
    });
  });

  describe('handleCommentClick', () => {
    it('selects component when clicking anchored comment', () => {
      useViewerStore.getState().setComments(mockComments);

      const { result } = renderHook(() => useComments());

      act(() => {
        result.current.handleCommentClick(mockComments[0]); // C1 anchored
      });

      expect(useViewerStore.getState().selectedRef).toBe('C1');
    });

    it('pans to center the component when clicking anchored comment', () => {
      useViewerStore.getState().setComments(mockComments);
      // Set up component index with position data
      const componentIndex = new Map([
        ['C1', { ref: 'C1', value: '100nF', footprint: 'C_0805', posX: 200, posY: 150 }],
      ]);
      useViewerStore.setState({ componentIndex, pan: { x: 0, y: 0 } });

      const { result } = renderHook(() => useComments());

      act(() => {
        result.current.handleCommentClick(mockComments[0]); // C1 anchored
      });

      // Pan should be updated (not at default 0,0)
      const pan = useViewerStore.getState().pan;
      expect(pan.x).not.toBe(0);
      expect(pan.y).not.toBe(0);
    });

    it('does not pan when component is not in index', () => {
      useViewerStore.getState().setComments(mockComments);
      // Empty component index - component not found
      useViewerStore.setState({ componentIndex: new Map(), pan: { x: 0, y: 0 } });

      const { result } = renderHook(() => useComments());

      act(() => {
        result.current.handleCommentClick(mockComments[0]); // C1 anchored but not in index
      });

      // Selection should still happen
      expect(useViewerStore.getState().selectedRef).toBe('C1');
      // Pan should remain unchanged (component not found)
      const pan = useViewerStore.getState().pan;
      expect(pan.x).toBe(0);
      expect(pan.y).toBe(0);
    });

    it('does not change selection when clicking general comment', () => {
      useViewerStore.getState().setComments(mockComments);
      useViewerStore.setState({ selectedRef: 'R1' }); // Pre-set selection

      const { result } = renderHook(() => useComments());

      act(() => {
        result.current.handleCommentClick(mockComments[1]); // General comment (no componentRef)
      });

      // Selection should remain unchanged
      expect(useViewerStore.getState().selectedRef).toBe('R1');
    });

    it('clears selection when clicking comment without componentRef', () => {
      // Start with no selection
      useViewerStore.setState({ selectedRef: null });
      useViewerStore.getState().setComments(mockComments);

      const { result } = renderHook(() => useComments());

      act(() => {
        result.current.handleCommentClick(mockComments[1]); // General comment
      });

      // Selection should remain null
      expect(useViewerStore.getState().selectedRef).toBeNull();
    });
  });

  describe('loading and error states', () => {
    it('exposes isLoading state', () => {
      useViewerStore.setState({ isLoadingComments: true });

      const { result } = renderHook(() => useComments());

      expect(result.current.isLoading).toBe(true);
    });

    it('exposes error state', () => {
      useViewerStore.setState({ loadCommentsError: 'Network error' });

      const { result } = renderHook(() => useComments());

      expect(result.current.error).toBe('Network error');
    });
  });
});
