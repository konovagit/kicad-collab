import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useEditComment } from './useEditComment';
import { useViewerStore } from '@/stores/viewerStore';

describe('useEditComment', () => {
  beforeEach(() => {
    useViewerStore.setState({
      comments: [
        {
          id: 'c1',
          author: 'Alice',
          content: 'Original content',
          createdAt: '2026-01-01T00:00:00Z',
          status: 'open',
        },
      ],
      isEditingComment: false,
      editCommentError: null,
    });
  });

  it('returns editComment function', () => {
    const { result } = renderHook(() => useEditComment());
    expect(typeof result.current.editComment).toBe('function');
  });

  it('returns isEditing state', () => {
    const { result } = renderHook(() => useEditComment());
    expect(result.current.isEditing).toBe(false);
  });

  it('returns error state', () => {
    const { result } = renderHook(() => useEditComment());
    expect(result.current.error).toBeNull();
  });

  it('editComment updates comment content', () => {
    const { result } = renderHook(() => useEditComment());

    act(() => {
      const editResult = result.current.editComment('c1', 'Updated content');
      expect(editResult.ok).toBe(true);
    });

    const comment = useViewerStore.getState().comments.find((c) => c.id === 'c1');
    expect(comment?.content).toBe('Updated content');
  });

  it('editComment returns error for empty content', () => {
    const { result } = renderHook(() => useEditComment());

    act(() => {
      const editResult = result.current.editComment('c1', '   ');
      expect(editResult.ok).toBe(false);
      if (!editResult.ok) {
        expect(editResult.error.message).toBe('Comment content is required');
      }
    });
  });

  it('editComment returns error for non-existent comment', () => {
    const { result } = renderHook(() => useEditComment());

    act(() => {
      const editResult = result.current.editComment('nonexistent', 'Content');
      expect(editResult.ok).toBe(false);
      if (!editResult.ok) {
        expect(editResult.error.message).toBe('Comment not found');
      }
    });
  });

  it('editComment sets updatedAt on comment', () => {
    const { result } = renderHook(() => useEditComment());

    act(() => {
      result.current.editComment('c1', 'Updated');
    });

    const comment = useViewerStore.getState().comments.find((c) => c.id === 'c1');
    expect(comment?.updatedAt).toBeDefined();
  });
});
