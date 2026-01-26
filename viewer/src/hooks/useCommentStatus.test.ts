import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, beforeEach } from 'vitest';

import { useCommentStatus } from './useCommentStatus';
import { useViewerStore } from '@/stores/viewerStore';

describe('useCommentStatus', () => {
  beforeEach(() => {
    useViewerStore.setState({
      comments: [
        {
          id: 'c1',
          author: 'Alice',
          content: 'Test',
          createdAt: '2026-01-01T00:00:00Z',
          status: 'open',
        },
        {
          id: 'c2',
          author: 'Bob',
          content: 'Another',
          createdAt: '2026-01-01T00:00:00Z',
          status: 'resolved',
        },
      ],
    });
  });

  it('resolveComment updates comment status to resolved', () => {
    const { result } = renderHook(() => useCommentStatus());

    act(() => {
      result.current.resolveComment('c1');
    });

    const comments = useViewerStore.getState().comments;
    expect(comments.find((c) => c.id === 'c1')?.status).toBe('resolved');
  });

  it('reopenComment updates comment status to open', () => {
    const { result } = renderHook(() => useCommentStatus());

    act(() => {
      result.current.reopenComment('c2');
    });

    const comments = useViewerStore.getState().comments;
    expect(comments.find((c) => c.id === 'c2')?.status).toBe('open');
  });

  it('resolveComment sets updatedAt timestamp', () => {
    const { result } = renderHook(() => useCommentStatus());

    act(() => {
      result.current.resolveComment('c1');
    });

    const comment = useViewerStore.getState().comments.find((c) => c.id === 'c1');
    expect(comment?.updatedAt).toBeDefined();
  });

  it('reopenComment sets updatedAt timestamp', () => {
    const { result } = renderHook(() => useCommentStatus());

    act(() => {
      result.current.reopenComment('c2');
    });

    const comment = useViewerStore.getState().comments.find((c) => c.id === 'c2');
    expect(comment?.updatedAt).toBeDefined();
  });
});
