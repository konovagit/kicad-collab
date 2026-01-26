import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, beforeEach } from 'vitest';

import { useAddGeneralComment } from './useAddGeneralComment';
import { useViewerStore } from '@/stores/viewerStore';

describe('useAddGeneralComment', () => {
  beforeEach(() => {
    useViewerStore.setState({
      comments: [],
      authorName: null,
      isAddingComment: false,
      addCommentError: null,
    });
  });

  it('exposes submitGeneralComment function', () => {
    const { result } = renderHook(() => useAddGeneralComment());
    expect(typeof result.current.submitGeneralComment).toBe('function');
  });

  it('exposes isSubmitting boolean', () => {
    const { result } = renderHook(() => useAddGeneralComment());
    expect(typeof result.current.isSubmitting).toBe('boolean');
  });

  it('exposes error state', () => {
    const { result } = renderHook(() => useAddGeneralComment());
    expect(result.current.error).toBeNull();
  });

  it('submitGeneralComment creates comment WITHOUT componentRef', async () => {
    useViewerStore.setState({ authorName: 'Alice' });
    const { result } = renderHook(() => useAddGeneralComment());

    let submitResult: Awaited<ReturnType<typeof result.current.submitGeneralComment>>;
    await act(async () => {
      submitResult = await result.current.submitGeneralComment('General feedback');
    });

    expect(submitResult!.ok).toBe(true);
    if (submitResult!.ok) {
      expect(submitResult!.data.componentRef).toBeUndefined();
      expect(submitResult!.data.content).toBe('General feedback');
    }
  });

  it('submitGeneralComment returns error if no author name', async () => {
    useViewerStore.setState({ authorName: null });
    const { result } = renderHook(() => useAddGeneralComment());

    let submitResult: Awaited<ReturnType<typeof result.current.submitGeneralComment>>;
    await act(async () => {
      submitResult = await result.current.submitGeneralComment('Test');
    });

    expect(submitResult!.ok).toBe(false);
  });

  it('reflects isSubmitting state from store', () => {
    useViewerStore.setState({ isAddingComment: true });
    const { result } = renderHook(() => useAddGeneralComment());
    expect(result.current.isSubmitting).toBe(true);
  });
});
