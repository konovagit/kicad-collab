import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useAddComment } from './useAddComment';
import { useViewerStore } from '@/stores/viewerStore';

describe('useAddComment', () => {
  beforeEach(() => {
    localStorage.clear();
    useViewerStore.setState({
      authorName: 'Test User',
      comments: [],
      isAddingComment: false,
      addCommentError: null,
    });
  });

  it('exposes isSubmitting state from store', () => {
    const { result } = renderHook(() => useAddComment());
    expect(result.current.isSubmitting).toBe(false);
  });

  it('exposes error state from store', () => {
    const { result } = renderHook(() => useAddComment());
    expect(result.current.error).toBeNull();
  });

  it('reflects isSubmitting state when store changes', () => {
    const { result } = renderHook(() => useAddComment());

    expect(result.current.isSubmitting).toBe(false);

    act(() => {
      useViewerStore.setState({ isAddingComment: true });
    });

    expect(result.current.isSubmitting).toBe(true);
  });

  it('reflects error state when store changes', () => {
    const { result } = renderHook(() => useAddComment());

    expect(result.current.error).toBeNull();

    act(() => {
      useViewerStore.setState({ addCommentError: 'Test error' });
    });

    expect(result.current.error).toBe('Test error');
  });

  it('submitComment returns ok:true on successful submission', async () => {
    const { result } = renderHook(() => useAddComment());

    let submitResult;
    await act(async () => {
      submitResult = await result.current.submitComment('Test content', 'C12');
    });

    expect(submitResult?.ok).toBe(true);
    if (submitResult?.ok) {
      expect(submitResult.data.content).toBe('Test content');
      expect(submitResult.data.componentRef).toBe('C12');
    }
  });

  it('submitComment returns ok:false when author not set', async () => {
    useViewerStore.setState({ authorName: null });
    const { result } = renderHook(() => useAddComment());

    let submitResult;
    await act(async () => {
      submitResult = await result.current.submitComment('Test content', 'C12');
    });

    expect(submitResult?.ok).toBe(false);
    if (!submitResult?.ok) {
      expect(submitResult.error.message).toBe('Author name is required');
    }
  });

  it('submitComment returns ok:false when content is empty', async () => {
    const { result } = renderHook(() => useAddComment());

    let submitResult;
    await act(async () => {
      submitResult = await result.current.submitComment('', 'C12');
    });

    expect(submitResult?.ok).toBe(false);
    if (!submitResult?.ok) {
      expect(submitResult.error.message).toBe('Comment content is required');
    }
  });

  it('submitComment adds comment to store on success', async () => {
    const { result } = renderHook(() => useAddComment());

    await act(async () => {
      await result.current.submitComment('New comment', 'R1');
    });

    const comments = useViewerStore.getState().comments;
    expect(comments).toHaveLength(1);
    expect(comments[0].content).toBe('New comment');
    expect(comments[0].componentRef).toBe('R1');
  });

  it('submitComment sets isAddingComment to false after completion', async () => {
    const { result } = renderHook(() => useAddComment());

    await act(async () => {
      await result.current.submitComment('Test', 'C12');
    });

    expect(useViewerStore.getState().isAddingComment).toBe(false);
  });
});
