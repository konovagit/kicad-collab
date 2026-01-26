import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, beforeEach } from 'vitest';

import { useReplyToComment } from './useReplyToComment';
import { useViewerStore } from '@/stores/viewerStore';

describe('useReplyToComment', () => {
  beforeEach(() => {
    useViewerStore.setState({
      comments: [
        {
          id: 'parent-1',
          author: 'Alice',
          content: 'Parent comment',
          createdAt: '2026-01-01T00:00:00Z',
          status: 'open',
        },
      ],
      authorName: 'TestUser',
      isAddingComment: false,
      addCommentError: null,
    });
  });

  it('returns addReply function', () => {
    const { result } = renderHook(() => useReplyToComment());
    expect(typeof result.current.addReply).toBe('function');
  });

  it('returns isSubmitting state from store', () => {
    const { result } = renderHook(() => useReplyToComment());
    expect(result.current.isSubmitting).toBe(false);

    act(() => {
      useViewerStore.setState({ isAddingComment: true });
    });

    expect(result.current.isSubmitting).toBe(true);
  });

  it('returns error state from store', () => {
    const { result } = renderHook(() => useReplyToComment());
    expect(result.current.error).toBeNull();

    act(() => {
      useViewerStore.setState({ addCommentError: 'Test error' });
    });

    expect(result.current.error).toBe('Test error');
  });

  it('addReply creates a reply successfully', async () => {
    const { result } = renderHook(() => useReplyToComment());

    let replyResult;
    await act(async () => {
      replyResult = await result.current.addReply('parent-1', 'My reply');
    });

    expect(replyResult!.ok).toBe(true);
    if (replyResult!.ok) {
      expect(replyResult!.data.content).toBe('My reply');
      expect(replyResult!.data.parentId).toBe('parent-1');
    }
  });

  it('addReply returns error when parent not found', async () => {
    const { result } = renderHook(() => useReplyToComment());

    let replyResult;
    await act(async () => {
      replyResult = await result.current.addReply('nonexistent', 'Reply');
    });

    expect(replyResult!.ok).toBe(false);
    if (!replyResult!.ok) {
      expect(replyResult!.error.message).toBe('Parent comment not found');
    }
  });
});
