import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useDeleteComment } from './useDeleteComment';
import { useViewerStore } from '@/stores/viewerStore';

describe('useDeleteComment', () => {
  beforeEach(() => {
    useViewerStore.setState({
      comments: [
        {
          id: 'root1',
          author: 'Alice',
          content: 'Root comment',
          createdAt: '2026-01-01T00:00:00Z',
          status: 'open',
        },
        {
          id: 'reply1',
          author: 'Bob',
          content: 'Reply to root',
          createdAt: '2026-01-02T00:00:00Z',
          status: 'open',
          parentId: 'root1',
        },
        {
          id: 'root2',
          author: 'Charlie',
          content: 'Another root',
          createdAt: '2026-01-03T00:00:00Z',
          status: 'open',
        },
      ],
      isDeletingComment: false,
      deleteCommentError: null,
    });
  });

  it('returns deleteComment function', () => {
    const { result } = renderHook(() => useDeleteComment());
    expect(typeof result.current.deleteComment).toBe('function');
  });

  it('returns isDeleting state', () => {
    const { result } = renderHook(() => useDeleteComment());
    expect(result.current.isDeleting).toBe(false);
  });

  it('returns error state', () => {
    const { result } = renderHook(() => useDeleteComment());
    expect(result.current.error).toBeNull();
  });

  it('deleteComment removes comment from store', () => {
    const { result } = renderHook(() => useDeleteComment());

    act(() => {
      const deleteResult = result.current.deleteComment('root2');
      expect(deleteResult.ok).toBe(true);
    });

    const comments = useViewerStore.getState().comments;
    expect(comments.find((c) => c.id === 'root2')).toBeUndefined();
  });

  it('deleteComment returns error for non-existent comment', () => {
    const { result } = renderHook(() => useDeleteComment());

    act(() => {
      const deleteResult = result.current.deleteComment('nonexistent');
      expect(deleteResult.ok).toBe(false);
      if (!deleteResult.ok) {
        expect(deleteResult.error.message).toBe('Comment not found');
      }
    });
  });

  it('deleteComment cascade deletes replies when deleting root', () => {
    const { result } = renderHook(() => useDeleteComment());

    act(() => {
      result.current.deleteComment('root1');
    });

    const comments = useViewerStore.getState().comments;
    expect(comments).toHaveLength(1);
    expect(comments[0].id).toBe('root2');
  });

  it('deleteComment only removes reply when deleting reply', () => {
    const { result } = renderHook(() => useDeleteComment());

    act(() => {
      result.current.deleteComment('reply1');
    });

    const comments = useViewerStore.getState().comments;
    expect(comments).toHaveLength(2);
    expect(comments.find((c) => c.id === 'root1')).toBeDefined();
    expect(comments.find((c) => c.id === 'reply1')).toBeUndefined();
  });
});
