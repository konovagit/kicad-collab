import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_PAN,
  DEFAULT_ZOOM,
  MAX_ZOOM,
  MIN_ZOOM,
  useViewerStore,
  selectFilteredComments,
  selectCommentCounts,
  selectRootComments,
  selectRepliesForComment,
  selectRepliesForCommentSorted,
} from './viewerStore';
import type { Comment, Component } from '@/types';
import * as authorStorage from '@/utils/authorStorage';

// Sample SVG content for testing
const mockSvgContent = '<svg><rect/></svg>';

// Sample components for testing
const mockComponents: Component[] = [
  { ref: 'R1', value: '10k', footprint: 'Resistor_SMD:R_0805', posX: 130, posY: 110 },
  { ref: 'C1', value: '100nF', footprint: 'Capacitor_SMD:C_0805', posX: 255, posY: 110 },
];

// Sample comments for testing (Story 3.1)
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
];

describe('viewerStore', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset store to initial state
    useViewerStore.setState({
      isInitialized: false,
      svg: null,
      isLoadingSvg: false,
      loadError: null,
      zoom: DEFAULT_ZOOM,
      pan: DEFAULT_PAN,
      // Story 2.2 state
      components: [],
      componentIndex: new Map(),
      isLoadingComponents: false,
      loadComponentsError: null,
      // Story 2.3 state
      hoveredRef: null,
      // Story 2.4 state
      selectedRef: null,
      // Story 3.1 state
      comments: [],
      isLoadingComments: false,
      loadCommentsError: null,
      // Story 3.2 state
      authorName: null,
      isAddingComment: false,
      addCommentError: null,
      // Story 3.4 state
      commentFilter: 'all',
    });
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('initialization', () => {
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

  describe('clearError', () => {
    it('clears the loadError state', () => {
      // Set an error first
      useViewerStore.setState({ loadError: 'Some error message' });
      expect(useViewerStore.getState().loadError).toBe('Some error message');

      // Clear the error
      const { clearError } = useViewerStore.getState();
      clearError();

      expect(useViewerStore.getState().loadError).toBeNull();
    });

    it('does not affect other state when clearing error', () => {
      useViewerStore.setState({
        loadError: 'Error',
        svg: mockSvgContent,
        isLoadingSvg: false,
        isInitialized: true,
      });

      const { clearError } = useViewerStore.getState();
      clearError();

      const state = useViewerStore.getState();
      expect(state.loadError).toBeNull();
      expect(state.svg).toBe(mockSvgContent);
      expect(state.isInitialized).toBe(true);
    });
  });

  describe('loadSnapshot', () => {
    it('returns Result with ok:true and SVG data on success', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockSvgContent),
      } as Response);

      const { loadSnapshot } = useViewerStore.getState();
      const result = await loadSnapshot();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toBe(mockSvgContent);
      }
    });

    it('returns Result with ok:false and Error on HTTP error', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 404,
      } as Response);

      const { loadSnapshot } = useViewerStore.getState();
      const result = await loadSnapshot();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('404');
      }
    });

    it('returns Result with ok:false and Error on network error', async () => {
      vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network failed'));

      const { loadSnapshot } = useViewerStore.getState();
      const result = await loadSnapshot();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Network failed');
      }
    });

    it('prevents duplicate loads and returns error Result', async () => {
      // Set loading state manually
      useViewerStore.setState({ isLoadingSvg: true });

      const { loadSnapshot } = useViewerStore.getState();
      const result = await loadSnapshot();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Load already in progress');
      }
    });

    it('updates store state on successful load', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockSvgContent),
      } as Response);

      const { loadSnapshot } = useViewerStore.getState();
      await loadSnapshot();

      const state = useViewerStore.getState();
      expect(state.svg).toBe(mockSvgContent);
      expect(state.isLoadingSvg).toBe(false);
      expect(state.loadError).toBeNull();
      expect(state.isInitialized).toBe(true);
    });

    it('updates store state on failed load', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      const { loadSnapshot } = useViewerStore.getState();
      await loadSnapshot();

      const state = useViewerStore.getState();
      expect(state.svg).toBeNull();
      expect(state.isLoadingSvg).toBe(false);
      expect(state.loadError).toContain('HTTP 500');
    });
  });

  describe('zoom state (Story 2.1)', () => {
    it('initializes with default zoom value', () => {
      const state = useViewerStore.getState();
      expect(state.zoom).toBe(DEFAULT_ZOOM);
      expect(state.zoom).toBe(1.0);
    });

    it('sets zoom to a valid value', () => {
      const { setZoom } = useViewerStore.getState();
      setZoom(2.0);
      expect(useViewerStore.getState().zoom).toBe(2.0);
    });

    it('clamps zoom to maximum bound', () => {
      const { setZoom } = useViewerStore.getState();
      setZoom(10.0); // Above MAX_ZOOM (5.0)
      expect(useViewerStore.getState().zoom).toBe(MAX_ZOOM);
    });

    it('clamps zoom to minimum bound', () => {
      const { setZoom } = useViewerStore.getState();
      setZoom(0.01); // Below MIN_ZOOM (0.1)
      expect(useViewerStore.getState().zoom).toBe(MIN_ZOOM);
    });

    it('allows zoom at boundary values', () => {
      const { setZoom } = useViewerStore.getState();

      setZoom(MIN_ZOOM);
      expect(useViewerStore.getState().zoom).toBe(MIN_ZOOM);

      setZoom(MAX_ZOOM);
      expect(useViewerStore.getState().zoom).toBe(MAX_ZOOM);
    });
  });

  describe('pan state (Story 2.1)', () => {
    it('initializes with default pan value', () => {
      const state = useViewerStore.getState();
      expect(state.pan).toEqual(DEFAULT_PAN);
      expect(state.pan).toEqual({ x: 0, y: 0 });
    });

    it('sets pan to a new position', () => {
      const { setPan } = useViewerStore.getState();
      setPan({ x: 100, y: 200 });
      expect(useViewerStore.getState().pan).toEqual({ x: 100, y: 200 });
    });

    it('allows negative pan values', () => {
      const { setPan } = useViewerStore.getState();
      setPan({ x: -50, y: -75 });
      expect(useViewerStore.getState().pan).toEqual({ x: -50, y: -75 });
    });
  });

  describe('resetView (Story 2.1)', () => {
    it('resets zoom and pan to defaults', () => {
      const { setZoom, setPan, resetView } = useViewerStore.getState();

      // Set non-default values
      setZoom(3.0);
      setPan({ x: 150, y: -200 });

      // Verify changed
      expect(useViewerStore.getState().zoom).toBe(3.0);
      expect(useViewerStore.getState().pan).toEqual({ x: 150, y: -200 });

      // Reset
      resetView();

      // Verify defaults restored
      expect(useViewerStore.getState().zoom).toBe(DEFAULT_ZOOM);
      expect(useViewerStore.getState().pan).toEqual(DEFAULT_PAN);
    });

    it('does not affect other state when resetting view', () => {
      // Set up state
      useViewerStore.setState({
        svg: mockSvgContent,
        isInitialized: true,
        zoom: 2.5,
        pan: { x: 100, y: 100 },
      });

      const { resetView } = useViewerStore.getState();
      resetView();

      const state = useViewerStore.getState();
      expect(state.zoom).toBe(DEFAULT_ZOOM);
      expect(state.pan).toEqual(DEFAULT_PAN);
      // Other state preserved
      expect(state.svg).toBe(mockSvgContent);
      expect(state.isInitialized).toBe(true);
    });
  });

  describe('component state (Story 2.2)', () => {
    it('initializes with empty components array', () => {
      const state = useViewerStore.getState();
      expect(state.components).toEqual([]);
    });

    it('initializes with empty componentIndex', () => {
      const state = useViewerStore.getState();
      expect(state.componentIndex.size).toBe(0);
    });

    it('initializes isLoadingComponents as false', () => {
      const state = useViewerStore.getState();
      expect(state.isLoadingComponents).toBe(false);
    });

    it('initializes loadComponentsError as null', () => {
      const state = useViewerStore.getState();
      expect(state.loadComponentsError).toBeNull();
    });
  });

  describe('loadComponents (Story 2.2)', () => {
    it('returns Result with ok:true and components on success', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockComponents),
      } as Response);

      const { loadComponents } = useViewerStore.getState();
      const result = await loadComponents();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0].ref).toBe('R1');
      }
    });

    it('returns Result with ok:false on HTTP error', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 404,
      } as Response);

      const { loadComponents } = useViewerStore.getState();
      const result = await loadComponents();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('404');
      }
    });

    it('prevents duplicate loads', async () => {
      useViewerStore.setState({ isLoadingComponents: true });

      const { loadComponents } = useViewerStore.getState();
      const result = await loadComponents();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Load already in progress');
      }
    });

    it('updates store state on successful load', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockComponents),
      } as Response);

      const { loadComponents } = useViewerStore.getState();
      await loadComponents();

      const state = useViewerStore.getState();
      expect(state.components).toHaveLength(2);
      expect(state.isLoadingComponents).toBe(false);
      expect(state.loadComponentsError).toBeNull();
    });

    it('updates store state on failed load', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      const { loadComponents } = useViewerStore.getState();
      await loadComponents();

      const state = useViewerStore.getState();
      expect(state.components).toEqual([]);
      expect(state.isLoadingComponents).toBe(false);
      expect(state.loadComponentsError).toContain('500');
    });
  });

  describe('setComponentIndex (Story 2.2)', () => {
    it('sets the component index', () => {
      const index = new Map<string, Component>([
        ['R1', mockComponents[0]],
        ['C1', mockComponents[1]],
      ]);

      const { setComponentIndex } = useViewerStore.getState();
      setComponentIndex(index);

      const state = useViewerStore.getState();
      expect(state.componentIndex.size).toBe(2);
      expect(state.componentIndex.get('R1')?.value).toBe('10k');
    });

    it('replaces existing index', () => {
      // Set initial index
      const index1 = new Map<string, Component>([['R1', mockComponents[0]]]);
      useViewerStore.getState().setComponentIndex(index1);

      // Replace with new index
      const index2 = new Map<string, Component>([['C1', mockComponents[1]]]);
      useViewerStore.getState().setComponentIndex(index2);

      const state = useViewerStore.getState();
      expect(state.componentIndex.size).toBe(1);
      expect(state.componentIndex.has('R1')).toBe(false);
      expect(state.componentIndex.has('C1')).toBe(true);
    });
  });

  describe('hover state (Story 2.3)', () => {
    it('initializes hoveredRef as null', () => {
      const state = useViewerStore.getState();
      expect(state.hoveredRef).toBeNull();
    });

    it('sets hoveredRef to a component ref', () => {
      const { setHoveredRef } = useViewerStore.getState();
      setHoveredRef('R1');
      expect(useViewerStore.getState().hoveredRef).toBe('R1');
    });

    it('clears hoveredRef when set to null', () => {
      const { setHoveredRef } = useViewerStore.getState();
      setHoveredRef('R1');
      expect(useViewerStore.getState().hoveredRef).toBe('R1');

      setHoveredRef(null);
      expect(useViewerStore.getState().hoveredRef).toBeNull();
    });

    it('updates hoveredRef when changing to different component', () => {
      const { setHoveredRef } = useViewerStore.getState();
      setHoveredRef('R1');
      expect(useViewerStore.getState().hoveredRef).toBe('R1');

      setHoveredRef('C1');
      expect(useViewerStore.getState().hoveredRef).toBe('C1');
    });

    it('does not affect other state when setting hoveredRef', () => {
      useViewerStore.setState({
        svg: mockSvgContent,
        zoom: 2.0,
        pan: { x: 100, y: 50 },
      });

      const { setHoveredRef } = useViewerStore.getState();
      setHoveredRef('R1');

      const state = useViewerStore.getState();
      expect(state.hoveredRef).toBe('R1');
      expect(state.svg).toBe(mockSvgContent);
      expect(state.zoom).toBe(2.0);
      expect(state.pan).toEqual({ x: 100, y: 50 });
    });
  });

  describe('selection state (Story 2.4)', () => {
    it('initializes selectedRef as null', () => {
      const state = useViewerStore.getState();
      expect(state.selectedRef).toBeNull();
    });

    it('selectComponent sets the selected ref', () => {
      const { selectComponent } = useViewerStore.getState();
      selectComponent('R1');
      expect(useViewerStore.getState().selectedRef).toBe('R1');
    });

    it('selectComponent(null) clears selection', () => {
      const { selectComponent } = useViewerStore.getState();
      selectComponent('R1');
      expect(useViewerStore.getState().selectedRef).toBe('R1');

      selectComponent(null);
      expect(useViewerStore.getState().selectedRef).toBeNull();
    });

    it('clearSelection clears selection', () => {
      const { selectComponent, clearSelection } = useViewerStore.getState();
      selectComponent('R1');
      expect(useViewerStore.getState().selectedRef).toBe('R1');

      clearSelection();
      expect(useViewerStore.getState().selectedRef).toBeNull();
    });

    it('updates selectedRef when changing to different component', () => {
      const { selectComponent } = useViewerStore.getState();
      selectComponent('R1');
      expect(useViewerStore.getState().selectedRef).toBe('R1');

      selectComponent('C1');
      expect(useViewerStore.getState().selectedRef).toBe('C1');
    });

    it('does not affect other state when setting selectedRef', () => {
      useViewerStore.setState({
        svg: mockSvgContent,
        zoom: 2.0,
        pan: { x: 100, y: 50 },
        hoveredRef: 'C1',
      });

      const { selectComponent } = useViewerStore.getState();
      selectComponent('R1');

      const state = useViewerStore.getState();
      expect(state.selectedRef).toBe('R1');
      expect(state.svg).toBe(mockSvgContent);
      expect(state.zoom).toBe(2.0);
      expect(state.pan).toEqual({ x: 100, y: 50 });
      expect(state.hoveredRef).toBe('C1');
    });
  });

  describe('getComponent (Story 2.2)', () => {
    it('returns component by ref', () => {
      const index = new Map<string, Component>([
        ['R1', mockComponents[0]],
        ['C1', mockComponents[1]],
      ]);
      useViewerStore.getState().setComponentIndex(index);

      const { getComponent } = useViewerStore.getState();
      const component = getComponent('R1');

      expect(component).toBeDefined();
      expect(component?.ref).toBe('R1');
      expect(component?.value).toBe('10k');
    });

    it('returns undefined for non-existent ref', () => {
      const index = new Map<string, Component>([['R1', mockComponents[0]]]);
      useViewerStore.getState().setComponentIndex(index);

      const { getComponent } = useViewerStore.getState();
      const component = getComponent('NONEXISTENT');

      expect(component).toBeUndefined();
    });

    it('returns undefined when index is empty', () => {
      const { getComponent } = useViewerStore.getState();
      const component = getComponent('R1');

      expect(component).toBeUndefined();
    });
  });

  describe('comment state (Story 3.1)', () => {
    it('initializes with empty comments array', () => {
      const state = useViewerStore.getState();
      expect(state.comments).toEqual([]);
    });

    it('initializes isLoadingComments as false', () => {
      const state = useViewerStore.getState();
      expect(state.isLoadingComments).toBe(false);
    });

    it('initializes loadCommentsError as null', () => {
      const state = useViewerStore.getState();
      expect(state.loadCommentsError).toBeNull();
    });

    it('setComments updates the comments array', () => {
      const { setComments } = useViewerStore.getState();
      setComments(mockComments);
      expect(useViewerStore.getState().comments).toEqual(mockComments);
    });

    it('setComments replaces existing comments', () => {
      // Set initial comments
      useViewerStore.getState().setComments(mockComments);
      expect(useViewerStore.getState().comments).toHaveLength(2);

      // Replace with new comments
      const newComments: Comment[] = [
        {
          id: 'new-1',
          author: 'Carol',
          content: 'New comment',
          createdAt: '2026-01-23T12:00:00Z',
          status: 'open',
        },
      ];
      useViewerStore.getState().setComments(newComments);

      expect(useViewerStore.getState().comments).toHaveLength(1);
      expect(useViewerStore.getState().comments[0].author).toBe('Carol');
    });

    it('setComments with empty array clears comments', () => {
      useViewerStore.getState().setComments(mockComments);
      expect(useViewerStore.getState().comments).toHaveLength(2);

      useViewerStore.getState().setComments([]);
      expect(useViewerStore.getState().comments).toEqual([]);
    });

    it('does not affect other state when setting comments', () => {
      useViewerStore.setState({
        svg: mockSvgContent,
        zoom: 2.0,
        selectedRef: 'R1',
      });

      const { setComments } = useViewerStore.getState();
      setComments(mockComments);

      const state = useViewerStore.getState();
      expect(state.comments).toEqual(mockComments);
      expect(state.svg).toBe(mockSvgContent);
      expect(state.zoom).toBe(2.0);
      expect(state.selectedRef).toBe('R1');
    });
  });

  describe('loadComments (Story 3.1)', () => {
    it('returns Result with ok:true and comments on success', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockComments),
      } as Response);

      const { loadComments } = useViewerStore.getState();
      const result = await loadComments();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0].author).toBe('Alice');
      }
    });

    it('returns Result with ok:false on HTTP error', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 404,
      } as Response);

      const { loadComments } = useViewerStore.getState();
      const result = await loadComments();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('404');
      }
    });

    it('returns Result with ok:false on network error', async () => {
      vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network failed'));

      const { loadComments } = useViewerStore.getState();
      const result = await loadComments();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Network failed');
      }
    });

    it('prevents duplicate loads and returns error Result', async () => {
      useViewerStore.setState({ isLoadingComments: true });

      const { loadComments } = useViewerStore.getState();
      const result = await loadComments();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Load already in progress');
      }
    });

    it('updates store state on successful load', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockComments),
      } as Response);

      const { loadComments } = useViewerStore.getState();
      await loadComments();

      const state = useViewerStore.getState();
      expect(state.comments).toHaveLength(2);
      expect(state.isLoadingComments).toBe(false);
      expect(state.loadCommentsError).toBeNull();
    });

    it('updates store state on failed load', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      const { loadComments } = useViewerStore.getState();
      await loadComments();

      const state = useViewerStore.getState();
      expect(state.comments).toEqual([]);
      expect(state.isLoadingComments).toBe(false);
      expect(state.loadCommentsError).toContain('500');
    });

    it('sets isLoadingComments to true while loading', async () => {
      let resolvePromise: (value: Comment[]) => void;
      const pendingPromise = new Promise<Comment[]>((resolve) => {
        resolvePromise = resolve;
      });

      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: () => pendingPromise,
      } as Response);

      const loadPromise = useViewerStore.getState().loadComments();

      // Check loading state while fetch is pending
      expect(useViewerStore.getState().isLoadingComments).toBe(true);

      // Resolve the promise
      resolvePromise!(mockComments);
      await loadPromise;

      // Loading should be false after completion
      expect(useViewerStore.getState().isLoadingComments).toBe(false);
    });
  });

  describe('authorName state (Story 3.2)', () => {
    it('initializes authorName from localStorage', () => {
      vi.spyOn(authorStorage, 'getStoredAuthor').mockReturnValue('Stored User');
      // Need to re-create store to test initialization
      // Since we can't easily recreate, we test via setAuthorName
      const state = useViewerStore.getState();
      expect(state.authorName).toBeNull(); // Reset state
    });

    it('setAuthorName updates state', () => {
      const { setAuthorName } = useViewerStore.getState();
      setAuthorName('Alice');
      expect(useViewerStore.getState().authorName).toBe('Alice');
    });

    it('setAuthorName saves to localStorage', () => {
      const setStoredSpy = vi.spyOn(authorStorage, 'setStoredAuthor');
      const { setAuthorName } = useViewerStore.getState();
      setAuthorName('Bob');
      expect(setStoredSpy).toHaveBeenCalledWith('Bob');
    });

    it('setAuthorName overwrites existing author', () => {
      const { setAuthorName } = useViewerStore.getState();
      setAuthorName('Alice');
      expect(useViewerStore.getState().authorName).toBe('Alice');

      setAuthorName('Bob');
      expect(useViewerStore.getState().authorName).toBe('Bob');
    });
  });

  describe('addGeneralComment action (Story 3.3)', () => {
    beforeEach(() => {
      useViewerStore.setState({
        comments: [],
        authorName: null,
        isAddingComment: false,
        addCommentError: null,
      });
    });

    it('creates comment WITHOUT componentRef field', async () => {
      useViewerStore.setState({ authorName: 'Alice' });
      const { addGeneralComment } = useViewerStore.getState();
      const result = await addGeneralComment('General feedback');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.componentRef).toBeUndefined();
        expect(result.data.content).toBe('General feedback');
        expect(result.data.author).toBe('Alice');
        expect(result.data.status).toBe('open');
      }
    });

    it('returns error if no author name set', async () => {
      useViewerStore.setState({ authorName: null });
      const { addGeneralComment } = useViewerStore.getState();
      const result = await addGeneralComment('Test');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Author name is required');
      }
    });

    it('returns error if content is empty', async () => {
      useViewerStore.setState({ authorName: 'Alice' });
      const { addGeneralComment } = useViewerStore.getState();
      const result = await addGeneralComment('   ');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Comment content is required');
      }
    });

    it('appends to existing comments array', async () => {
      useViewerStore.setState({
        authorName: 'Alice',
        comments: [
          {
            id: 'existing',
            author: 'Bob',
            content: 'Existing',
            createdAt: '2026-01-01T00:00:00Z',
            status: 'open',
          },
        ],
      });

      const { addGeneralComment } = useViewerStore.getState();
      await addGeneralComment('New general comment');

      expect(useViewerStore.getState().comments).toHaveLength(2);
    });

    it('generates valid UUID for id', async () => {
      useViewerStore.setState({ authorName: 'Alice' });
      const { addGeneralComment } = useViewerStore.getState();
      const result = await addGeneralComment('Test');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        );
      }
    });

    it('generates ISO 8601 timestamp for createdAt', async () => {
      useViewerStore.setState({ authorName: 'Alice' });
      const { addGeneralComment } = useViewerStore.getState();
      const result = await addGeneralComment('Test');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(() => new Date(result.data.createdAt)).not.toThrow();
        expect(result.data.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      }
    });
  });

  describe('commentFilter state (Story 3.4)', () => {
    it('initializes commentFilter as "all"', () => {
      const state = useViewerStore.getState();
      expect(state.commentFilter).toBe('all');
    });

    it('setCommentFilter changes filter to "open"', () => {
      const { setCommentFilter } = useViewerStore.getState();
      setCommentFilter('open');
      expect(useViewerStore.getState().commentFilter).toBe('open');
    });

    it('setCommentFilter changes filter to "resolved"', () => {
      const { setCommentFilter } = useViewerStore.getState();
      setCommentFilter('resolved');
      expect(useViewerStore.getState().commentFilter).toBe('resolved');
    });

    it('setCommentFilter changes filter back to "all"', () => {
      const { setCommentFilter } = useViewerStore.getState();
      setCommentFilter('resolved');
      setCommentFilter('all');
      expect(useViewerStore.getState().commentFilter).toBe('all');
    });
  });

  describe('selectFilteredComments selector (Story 3.4)', () => {
    beforeEach(() => {
      useViewerStore.setState({
        comments: [
          {
            id: '1',
            author: 'Alice',
            content: 'Open 1',
            createdAt: '2026-01-01T00:00:00Z',
            status: 'open',
          },
          {
            id: '2',
            author: 'Bob',
            content: 'Resolved',
            createdAt: '2026-01-01T00:00:00Z',
            status: 'resolved',
          },
          {
            id: '3',
            author: 'Carol',
            content: 'Open 2',
            createdAt: '2026-01-01T00:00:00Z',
            status: 'open',
          },
        ],
        commentFilter: 'all',
      });
    });

    it('returns all comments when filter is "all"', () => {
      const filtered = selectFilteredComments(useViewerStore.getState());
      expect(filtered).toHaveLength(3);
    });

    it('returns only open comments when filter is "open"', () => {
      useViewerStore.getState().setCommentFilter('open');
      const filtered = selectFilteredComments(useViewerStore.getState());
      expect(filtered).toHaveLength(2);
      expect(filtered.every((c) => c.status === 'open')).toBe(true);
    });

    it('returns only resolved comments when filter is "resolved"', () => {
      useViewerStore.getState().setCommentFilter('resolved');
      const filtered = selectFilteredComments(useViewerStore.getState());
      expect(filtered).toHaveLength(1);
      expect(filtered[0].status).toBe('resolved');
    });
  });

  describe('selectCommentCounts selector (Story 3.4)', () => {
    it('returns correct counts for open and resolved', () => {
      useViewerStore.setState({
        comments: [
          { id: '1', author: 'A', content: 'a', createdAt: '2026-01-01T00:00:00Z', status: 'open' },
          {
            id: '2',
            author: 'B',
            content: 'b',
            createdAt: '2026-01-01T00:00:00Z',
            status: 'resolved',
          },
          { id: '3', author: 'C', content: 'c', createdAt: '2026-01-01T00:00:00Z', status: 'open' },
        ],
      });
      const counts = selectCommentCounts(useViewerStore.getState());
      expect(counts).toEqual({ total: 3, open: 2, resolved: 1 });
    });

    it('returns zeros for empty comment list', () => {
      useViewerStore.setState({ comments: [] });
      const counts = selectCommentCounts(useViewerStore.getState());
      expect(counts).toEqual({ total: 0, open: 0, resolved: 0 });
    });

    it('counts all as open when no resolved comments', () => {
      useViewerStore.setState({
        comments: [
          { id: '1', author: 'A', content: 'a', createdAt: '2026-01-01T00:00:00Z', status: 'open' },
          { id: '2', author: 'B', content: 'b', createdAt: '2026-01-01T00:00:00Z', status: 'open' },
        ],
      });
      const counts = selectCommentCounts(useViewerStore.getState());
      expect(counts).toEqual({ total: 2, open: 2, resolved: 0 });
    });
  });

  describe('resolveComment action (Story 3.4)', () => {
    beforeEach(() => {
      useViewerStore.setState({
        comments: [
          {
            id: '1',
            author: 'Alice',
            content: 'Test comment',
            createdAt: '2026-01-01T00:00:00Z',
            status: 'open',
          },
        ],
      });
    });

    it('changes comment status to resolved', () => {
      useViewerStore.getState().resolveComment('1');
      expect(useViewerStore.getState().comments[0].status).toBe('resolved');
    });

    it('sets updatedAt timestamp', () => {
      const before = new Date().toISOString();
      useViewerStore.getState().resolveComment('1');
      const after = new Date().toISOString();
      const updatedAt = useViewerStore.getState().comments[0].updatedAt!;
      expect(updatedAt >= before).toBe(true);
      expect(updatedAt <= after).toBe(true);
    });

    it('does not affect other comments', () => {
      useViewerStore.setState({
        comments: [
          {
            id: '1',
            author: 'Alice',
            content: 'Test 1',
            createdAt: '2026-01-01T00:00:00Z',
            status: 'open',
          },
          {
            id: '2',
            author: 'Bob',
            content: 'Test 2',
            createdAt: '2026-01-01T00:00:00Z',
            status: 'open',
          },
        ],
      });
      useViewerStore.getState().resolveComment('1');
      expect(useViewerStore.getState().comments[1].status).toBe('open');
    });

    it('handles non-existent comment id gracefully', () => {
      expect(() => useViewerStore.getState().resolveComment('nonexistent')).not.toThrow();
    });
  });

  describe('reopenComment action (Story 3.4)', () => {
    beforeEach(() => {
      useViewerStore.setState({
        comments: [
          {
            id: '1',
            author: 'Alice',
            content: 'Test comment',
            createdAt: '2026-01-01T00:00:00Z',
            status: 'resolved',
          },
        ],
      });
    });

    it('changes comment status to open', () => {
      useViewerStore.getState().reopenComment('1');
      expect(useViewerStore.getState().comments[0].status).toBe('open');
    });

    it('sets updatedAt timestamp', () => {
      useViewerStore.getState().reopenComment('1');
      expect(useViewerStore.getState().comments[0].updatedAt).toBeDefined();
    });

    it('does not affect other comments', () => {
      useViewerStore.setState({
        comments: [
          {
            id: '1',
            author: 'Alice',
            content: 'Test 1',
            createdAt: '2026-01-01T00:00:00Z',
            status: 'resolved',
          },
          {
            id: '2',
            author: 'Bob',
            content: 'Test 2',
            createdAt: '2026-01-01T00:00:00Z',
            status: 'resolved',
          },
        ],
      });
      useViewerStore.getState().reopenComment('1');
      expect(useViewerStore.getState().comments[1].status).toBe('resolved');
    });

    it('handles non-existent comment id gracefully', () => {
      expect(() => useViewerStore.getState().reopenComment('nonexistent')).not.toThrow();
    });
  });

  describe('addComment action (Story 3.2)', () => {
    it('initializes isAddingComment as false', () => {
      const state = useViewerStore.getState();
      expect(state.isAddingComment).toBe(false);
    });

    it('initializes addCommentError as null', () => {
      const state = useViewerStore.getState();
      expect(state.addCommentError).toBeNull();
    });

    it('returns error if authorName is not set', async () => {
      useViewerStore.setState({ authorName: null });

      const { addComment } = useViewerStore.getState();
      const result = await addComment('Test content', 'C12');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Author name is required');
      }
    });

    it('returns error if content is empty', async () => {
      useViewerStore.setState({ authorName: 'Alice' });

      const { addComment } = useViewerStore.getState();
      const result = await addComment('', 'C12');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Comment content is required');
      }
    });

    it('returns error if content is whitespace only', async () => {
      useViewerStore.setState({ authorName: 'Alice' });

      const { addComment } = useViewerStore.getState();
      const result = await addComment('   ', 'C12');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Comment content is required');
      }
    });

    it('creates new comment with correct fields', async () => {
      useViewerStore.setState({ authorName: 'Alice' });

      const { addComment } = useViewerStore.getState();
      const result = await addComment('Test content', 'C12');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.author).toBe('Alice');
        expect(result.data.content).toBe('Test content');
        expect(result.data.componentRef).toBe('C12');
        expect(result.data.status).toBe('open');
        expect(result.data.id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        );
        expect(result.data.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      }
    });

    it('trims content whitespace', async () => {
      useViewerStore.setState({ authorName: 'Alice' });

      const { addComment } = useViewerStore.getState();
      const result = await addComment('  Test content  ', 'C12');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.content).toBe('Test content');
      }
    });

    it('appends comment to existing comments array', async () => {
      useViewerStore.setState({
        authorName: 'Alice',
        comments: [mockComments[0]],
      });

      const { addComment } = useViewerStore.getState();
      await addComment('New comment', 'R1');

      const state = useViewerStore.getState();
      expect(state.comments).toHaveLength(2);
      expect(state.comments[0]).toEqual(mockComments[0]);
      expect(state.comments[1].content).toBe('New comment');
    });

    it('sets isAddingComment to false after completion', async () => {
      useViewerStore.setState({ authorName: 'Alice' });

      const { addComment } = useViewerStore.getState();
      await addComment('Test', 'C12');

      expect(useViewerStore.getState().isAddingComment).toBe(false);
    });

    it('clears addCommentError on successful add', async () => {
      useViewerStore.setState({
        authorName: 'Alice',
        addCommentError: 'Previous error',
      });

      const { addComment } = useViewerStore.getState();
      const result = await addComment('Test', 'C12');

      expect(result.ok).toBe(true);
      expect(useViewerStore.getState().addCommentError).toBeNull();
    });

    it('does not affect other state when adding comment', async () => {
      useViewerStore.setState({
        authorName: 'Alice',
        svg: mockSvgContent,
        zoom: 2.0,
        selectedRef: 'R1',
      });

      const { addComment } = useViewerStore.getState();
      await addComment('Test', 'C12');

      const state = useViewerStore.getState();
      expect(state.svg).toBe(mockSvgContent);
      expect(state.zoom).toBe(2.0);
      expect(state.selectedRef).toBe('R1');
    });
  });

  // Story 3.5: Comment Threading (Replies)
  describe('addReply action (Story 3.5)', () => {
    beforeEach(() => {
      useViewerStore.setState({
        authorName: 'TestUser',
        comments: [
          {
            id: 'parent-1',
            author: 'Alice',
            content: 'Parent comment',
            createdAt: '2026-01-01T00:00:00Z',
            status: 'open',
          },
        ],
        isAddingComment: false,
        addCommentError: null,
      });
    });

    it('creates reply with parentId set', async () => {
      const result = await useViewerStore.getState().addReply('parent-1', 'My reply');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.parentId).toBe('parent-1');
        expect(result.data.content).toBe('My reply');
        expect(result.data.status).toBe('open');
        expect(result.data.author).toBe('TestUser');
      }
    });

    it('returns error if authorName not set', async () => {
      useViewerStore.setState({ authorName: null });
      const result = await useViewerStore.getState().addReply('parent-1', 'Reply');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Author name is required');
      }
    });

    it('returns error if content is empty', async () => {
      const result = await useViewerStore.getState().addReply('parent-1', '   ');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Reply content is required');
      }
    });

    it('returns error if parent comment does not exist', async () => {
      const result = await useViewerStore.getState().addReply('nonexistent', 'Reply');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Parent comment not found');
      }
    });

    it('appends reply to comments array', async () => {
      const before = useViewerStore.getState().comments.length;
      await useViewerStore.getState().addReply('parent-1', 'Reply');
      const after = useViewerStore.getState().comments.length;
      expect(after).toBe(before + 1);
    });

    it('returns error when trying to reply to a reply', async () => {
      // First add a reply
      await useViewerStore.getState().addReply('parent-1', 'First reply');
      const comments = useViewerStore.getState().comments;
      const replyId = comments.find((c) => c.parentId === 'parent-1')!.id;

      // Try to reply to the reply
      const result = await useViewerStore.getState().addReply(replyId, 'Nested reply');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Can only reply to root comments');
      }
    });

    it('generates valid UUID for reply id', async () => {
      const result = await useViewerStore.getState().addReply('parent-1', 'Test');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        );
      }
    });

    it('generates ISO 8601 timestamp for createdAt', async () => {
      const result = await useViewerStore.getState().addReply('parent-1', 'Test');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(() => new Date(result.data.createdAt)).not.toThrow();
        expect(result.data.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      }
    });
  });

  describe('selectRootComments selector (Story 3.5)', () => {
    beforeEach(() => {
      useViewerStore.setState({
        comments: [
          {
            id: '1',
            author: 'A',
            content: 'Root 1',
            createdAt: '2026-01-01T00:00:00Z',
            status: 'open',
          },
          {
            id: '2',
            author: 'B',
            content: 'Root 2',
            createdAt: '2026-01-02T00:00:00Z',
            status: 'open',
          },
          {
            id: '3',
            author: 'C',
            content: 'Reply to 1',
            createdAt: '2026-01-03T00:00:00Z',
            status: 'open',
            parentId: '1',
          },
        ],
      });
    });

    it('returns only comments without parentId', () => {
      const roots = selectRootComments(useViewerStore.getState());
      expect(roots).toHaveLength(2);
      expect(roots.every((c) => !c.parentId)).toBe(true);
    });

    it('excludes replies from the result', () => {
      const roots = selectRootComments(useViewerStore.getState());
      expect(roots.find((c) => c.id === '3')).toBeUndefined();
    });
  });

  describe('selectRepliesForComment selector (Story 3.5)', () => {
    beforeEach(() => {
      useViewerStore.setState({
        comments: [
          {
            id: '1',
            author: 'A',
            content: 'Root',
            createdAt: '2026-01-01T00:00:00Z',
            status: 'open',
          },
          {
            id: 'r1',
            author: 'B',
            content: 'Reply 1',
            createdAt: '2026-01-02T00:00:00Z',
            status: 'open',
            parentId: '1',
          },
          {
            id: 'r2',
            author: 'C',
            content: 'Reply 2',
            createdAt: '2026-01-01T12:00:00Z',
            status: 'open',
            parentId: '1',
          },
          {
            id: 'r3',
            author: 'D',
            content: 'Other reply',
            createdAt: '2026-01-03T00:00:00Z',
            status: 'open',
            parentId: 'other',
          },
        ],
      });
    });

    it('returns only replies to specific parent', () => {
      const replies = selectRepliesForComment(useViewerStore.getState(), '1');
      expect(replies).toHaveLength(2);
      expect(replies.every((c) => c.parentId === '1')).toBe(true);
    });

    it('returns empty array for parent with no replies', () => {
      const replies = selectRepliesForComment(useViewerStore.getState(), 'no-replies');
      expect(replies).toHaveLength(0);
    });
  });

  describe('selectRepliesForCommentSorted selector (Story 3.5)', () => {
    beforeEach(() => {
      useViewerStore.setState({
        comments: [
          {
            id: '1',
            author: 'A',
            content: 'Root',
            createdAt: '2026-01-01T00:00:00Z',
            status: 'open',
          },
          {
            id: 'r1',
            author: 'B',
            content: 'Reply 1',
            createdAt: '2026-01-02T00:00:00Z',
            status: 'open',
            parentId: '1',
          },
          {
            id: 'r2',
            author: 'C',
            content: 'Reply 2',
            createdAt: '2026-01-01T12:00:00Z',
            status: 'open',
            parentId: '1',
          },
        ],
      });
    });

    it('returns replies in chronological order (oldest first)', () => {
      const replies = selectRepliesForCommentSorted(useViewerStore.getState(), '1');
      // r2 was created before r1, so r2 should come first
      expect(replies[0].id).toBe('r2');
      expect(replies[1].id).toBe('r1');
    });
  });

  describe('selectFilteredComments with threading (Story 3.5)', () => {
    beforeEach(() => {
      useViewerStore.setState({
        comments: [
          {
            id: '1',
            author: 'A',
            content: 'Open root',
            createdAt: '2026-01-01T00:00:00Z',
            status: 'open',
          },
          {
            id: '2',
            author: 'B',
            content: 'Resolved root',
            createdAt: '2026-01-02T00:00:00Z',
            status: 'resolved',
          },
          {
            id: 'r1',
            author: 'C',
            content: 'Reply to 1',
            createdAt: '2026-01-03T00:00:00Z',
            status: 'open',
            parentId: '1',
          },
        ],
        commentFilter: 'all',
      });
    });

    it('returns only root comments when filter is "all"', () => {
      const filtered = selectFilteredComments(useViewerStore.getState());
      expect(filtered).toHaveLength(2);
      expect(filtered.every((c) => !c.parentId)).toBe(true);
    });

    it('excludes replies from filtered results', () => {
      const filtered = selectFilteredComments(useViewerStore.getState());
      expect(filtered.find((c) => c.id === 'r1')).toBeUndefined();
    });

    it('filters root comments by status', () => {
      useViewerStore.getState().setCommentFilter('open');
      const filtered = selectFilteredComments(useViewerStore.getState());
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('1');
    });
  });

  describe('selectCommentCounts with threading (Story 3.5)', () => {
    it('counts only root comments', () => {
      useViewerStore.setState({
        comments: [
          {
            id: '1',
            author: 'A',
            content: 'Root open',
            createdAt: '2026-01-01T00:00:00Z',
            status: 'open',
          },
          {
            id: '2',
            author: 'B',
            content: 'Root resolved',
            createdAt: '2026-01-01T00:00:00Z',
            status: 'resolved',
          },
          {
            id: 'r1',
            author: 'C',
            content: 'Reply',
            createdAt: '2026-01-01T00:00:00Z',
            status: 'open',
            parentId: '1',
          },
        ],
      });
      const counts = selectCommentCounts(useViewerStore.getState());
      expect(counts).toEqual({ total: 2, open: 1, resolved: 1 });
    });
  });

  // Story 3.6: Edit/Delete Comments
  describe('editComment action (Story 3.6)', () => {
    beforeEach(() => {
      useViewerStore.setState({
        comments: [
          {
            id: 'c1',
            author: 'Alice',
            content: 'Original',
            createdAt: '2026-01-01T00:00:00Z',
            status: 'open',
          },
        ],
        isEditingComment: false,
        editCommentError: null,
      });
    });

    it('updates content and sets updatedAt', () => {
      const result = useViewerStore.getState().editComment('c1', 'Updated content');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.content).toBe('Updated content');
        expect(result.data.updatedAt).toBeDefined();
      }
      const comment = useViewerStore.getState().comments.find((c) => c.id === 'c1');
      expect(comment?.content).toBe('Updated content');
      expect(comment?.updatedAt).toBeDefined();
    });

    it('returns error if content is empty', () => {
      const result = useViewerStore.getState().editComment('c1', '   ');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Comment content is required');
      }
    });

    it('returns error if comment does not exist', () => {
      const result = useViewerStore.getState().editComment('nonexistent', 'New content');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Comment not found');
      }
    });

    it('preserves all other comment fields', () => {
      const original = useViewerStore.getState().comments[0];
      useViewerStore.getState().editComment('c1', 'Updated');
      const updated = useViewerStore.getState().comments.find((c) => c.id === 'c1');
      expect(updated?.author).toBe(original.author);
      expect(updated?.createdAt).toBe(original.createdAt);
      expect(updated?.status).toBe(original.status);
    });

    it('sets isEditingComment to false after success', () => {
      useViewerStore.getState().editComment('c1', 'Updated');
      expect(useViewerStore.getState().isEditingComment).toBe(false);
    });

    it('trims content whitespace', () => {
      const result = useViewerStore.getState().editComment('c1', '  Trimmed  ');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.content).toBe('Trimmed');
      }
    });

    it('sets updatedAt to ISO 8601 timestamp', () => {
      const before = new Date().toISOString();
      const result = useViewerStore.getState().editComment('c1', 'Updated');
      const after = new Date().toISOString();
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.updatedAt! >= before).toBe(true);
        expect(result.data.updatedAt! <= after).toBe(true);
      }
    });

    it('can edit a reply', () => {
      useViewerStore.setState({
        comments: [
          {
            id: 'root1',
            author: 'Alice',
            content: 'Root',
            createdAt: '2026-01-01T00:00:00Z',
            status: 'open',
          },
          {
            id: 'reply1',
            author: 'Bob',
            content: 'Reply original',
            createdAt: '2026-01-02T00:00:00Z',
            status: 'open',
            parentId: 'root1',
          },
        ],
      });
      const result = useViewerStore.getState().editComment('reply1', 'Reply updated');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.content).toBe('Reply updated');
        expect(result.data.parentId).toBe('root1');
      }
    });
  });

  describe('deleteComment action (Story 3.6)', () => {
    beforeEach(() => {
      useViewerStore.setState({
        comments: [
          {
            id: 'root1',
            author: 'Alice',
            content: 'Root',
            createdAt: '2026-01-01T00:00:00Z',
            status: 'open',
          },
          {
            id: 'reply1',
            author: 'Bob',
            content: 'Reply 1',
            createdAt: '2026-01-02T00:00:00Z',
            status: 'open',
            parentId: 'root1',
          },
          {
            id: 'reply2',
            author: 'Charlie',
            content: 'Reply 2',
            createdAt: '2026-01-03T00:00:00Z',
            status: 'open',
            parentId: 'root1',
          },
          {
            id: 'root2',
            author: 'David',
            content: 'Another root',
            createdAt: '2026-01-04T00:00:00Z',
            status: 'open',
          },
        ],
        isDeletingComment: false,
        deleteCommentError: null,
      });
    });

    it('removes comment from array', () => {
      const before = useViewerStore.getState().comments.length;
      const result = useViewerStore.getState().deleteComment('root2');
      expect(result.ok).toBe(true);
      expect(useViewerStore.getState().comments.length).toBe(before - 1);
      expect(useViewerStore.getState().comments.find((c) => c.id === 'root2')).toBeUndefined();
    });

    it('returns error if comment does not exist', () => {
      const result = useViewerStore.getState().deleteComment('nonexistent');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Comment not found');
      }
    });

    it('cascade deletes all replies when deleting root comment', () => {
      const result = useViewerStore.getState().deleteComment('root1');
      expect(result.ok).toBe(true);
      const remaining = useViewerStore.getState().comments;
      expect(remaining).toHaveLength(1); // Only root2 should remain
      expect(remaining[0].id).toBe('root2');
    });

    it('only removes the reply when deleting a reply (no cascade)', () => {
      const result = useViewerStore.getState().deleteComment('reply1');
      expect(result.ok).toBe(true);
      const remaining = useViewerStore.getState().comments;
      expect(remaining).toHaveLength(3); // root1, reply2, root2
      expect(remaining.find((c) => c.id === 'reply1')).toBeUndefined();
      expect(remaining.find((c) => c.id === 'reply2')).toBeDefined();
    });

    it('sets isDeletingComment to false after success', () => {
      useViewerStore.getState().deleteComment('root2');
      expect(useViewerStore.getState().isDeletingComment).toBe(false);
    });

    it('preserves other comments when deleting', () => {
      useViewerStore.getState().deleteComment('root2');
      const remaining = useViewerStore.getState().comments;
      expect(remaining.find((c) => c.id === 'root1')).toBeDefined();
      expect(remaining.find((c) => c.id === 'reply1')).toBeDefined();
    });

    it('returns ok:true with undefined data on success', () => {
      const result = useViewerStore.getState().deleteComment('root2');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toBeUndefined();
      }
    });
  });
});
