import { describe, it, expect, beforeEach } from 'vitest';
import { useViewerStore } from './viewerStore';

describe('viewerStore', () => {
  beforeEach(() => {
    useViewerStore.setState({ isInitialized: false });
  });

  it('initializes with isInitialized as false', () => {
    const state = useViewerStore.getState();
    expect(state.isInitialized).toBe(false);
  });

  it('sets isInitialized to true', () => {
    const { setInitialized } = useViewerStore.getState();
    setInitialized(true);
    expect(useViewerStore.getState().isInitialized).toBe(true);
  });

  it('sets isInitialized to false', () => {
    useViewerStore.setState({ isInitialized: true });
    const { setInitialized } = useViewerStore.getState();
    setInitialized(false);
    expect(useViewerStore.getState().isInitialized).toBe(false);
  });
});
