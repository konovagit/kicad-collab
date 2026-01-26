import { create } from 'zustand';

import type { Comment, Component, Result } from '@/types';
import { loadComponents as loadComponentsFromFile } from '@/utils/componentLoader';
import { getStoredAuthor, setStoredAuthor } from '@/utils/authorStorage';

// Pan/Zoom constants (Story 2.1)
export const MIN_ZOOM = 0.1; // 10%
export const MAX_ZOOM = 5.0; // 500%
export const DEFAULT_ZOOM = 1.0;
export const DEFAULT_PAN = { x: 0, y: 0 };

interface ViewerState {
  // Initialization
  isInitialized: boolean;
  setInitialized: (value: boolean) => void;

  // SVG state (Story 1.4)
  svg: string | null;
  isLoadingSvg: boolean;
  loadError: string | null;

  // SVG actions - returns Result type per architecture pattern
  loadSnapshot: () => Promise<Result<string, Error>>;
  clearError: () => void;

  // Pan/Zoom state (Story 2.1)
  zoom: number;
  pan: { x: number; y: number };

  // Pan/Zoom actions (Story 2.1)
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  resetView: () => void;

  // Component state (Story 2.2)
  components: Component[];
  componentIndex: Map<string, Component>;
  isLoadingComponents: boolean;
  loadComponentsError: string | null;

  // Component actions (Story 2.2)
  loadComponents: () => Promise<Result<Component[], Error>>;
  setComponentIndex: (index: Map<string, Component>) => void;
  getComponent: (ref: string) => Component | undefined;

  // Hover state (Story 2.3)
  hoveredRef: string | null;
  setHoveredRef: (ref: string | null) => void;

  // Selection state (Story 2.4)
  selectedRef: string | null;
  selectComponent: (ref: string | null) => void;
  clearSelection: () => void;

  // Comment state (Story 3.1)
  comments: Comment[];
  isLoadingComments: boolean;
  loadCommentsError: string | null;
  loadComments: () => Promise<Result<Comment[], Error>>;
  setComments: (comments: Comment[]) => void;

  // Add comment state (Story 3.2)
  authorName: string | null;
  setAuthorName: (name: string) => void;
  isAddingComment: boolean;
  addCommentError: string | null;
  addComment: (content: string, componentRef: string) => Promise<Result<Comment, Error>>;

  // Add general comment action (Story 3.3)
  addGeneralComment: (content: string) => Promise<Result<Comment, Error>>;

  // Comment status actions (Story 3.4)
  resolveComment: (id: string) => void;
  reopenComment: (id: string) => void;

  // Comment filter state (Story 3.4)
  commentFilter: 'all' | 'open' | 'resolved';
  setCommentFilter: (filter: 'all' | 'open' | 'resolved') => void;

  // Add reply action (Story 3.5)
  addReply: (parentId: string, content: string) => Promise<Result<Comment, Error>>;

  // Edit/Delete comment state (Story 3.6)
  isEditingComment: boolean;
  editCommentError: string | null;
  isDeletingComment: boolean;
  deleteCommentError: string | null;

  // Edit/Delete comment actions (Story 3.6)
  editComment: (id: string, newContent: string) => Result<Comment, Error>;
  deleteComment: (id: string) => Result<void, Error>;
}

export const useViewerStore = create<ViewerState>((set, get) => ({
  // Initialization
  isInitialized: false,
  setInitialized: (value) => set({ isInitialized: value }),

  // SVG state
  svg: null,
  isLoadingSvg: false,
  loadError: null,

  // SVG actions - returns Result type per architecture pattern
  loadSnapshot: async (): Promise<Result<string, Error>> => {
    // Prevent duplicate loads
    if (get().isLoadingSvg) {
      return { ok: false, error: new Error('Load already in progress') };
    }

    set({ isLoadingSvg: true, loadError: null });

    try {
      const response = await fetch('/fixtures/sample-schematic.svg');

      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}`);
        set({
          isLoadingSvg: false,
          loadError: `Failed to load schematic: HTTP ${response.status}`,
          svg: null,
        });
        return { ok: false, error };
      }

      const svgContent = await response.text();
      set({
        svg: svgContent,
        isLoadingSvg: false,
        loadError: null,
        isInitialized: true,
      });
      return { ok: true, data: svgContent };
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Unknown error occurred');
      set({
        isLoadingSvg: false,
        loadError: `Failed to load schematic: ${errorObj.message}`,
        svg: null,
      });
      return { ok: false, error: errorObj };
    }
  },

  clearError: () => set({ loadError: null }),

  // Pan/Zoom state (Story 2.1)
  zoom: DEFAULT_ZOOM,
  pan: DEFAULT_PAN,

  // Pan/Zoom actions (Story 2.1)
  setZoom: (zoom: number) => {
    // Clamp zoom to valid bounds
    const clampedZoom = Math.min(Math.max(zoom, MIN_ZOOM), MAX_ZOOM);
    set({ zoom: clampedZoom });
  },

  setPan: (pan: { x: number; y: number }) => {
    set({ pan });
  },

  resetView: () => {
    set({ zoom: DEFAULT_ZOOM, pan: DEFAULT_PAN });
  },

  // Component state (Story 2.2)
  components: [],
  componentIndex: new Map<string, Component>(),
  isLoadingComponents: false,
  loadComponentsError: null,

  // Component actions (Story 2.2)
  loadComponents: async (): Promise<Result<Component[], Error>> => {
    // Prevent duplicate loads
    if (get().isLoadingComponents) {
      return { ok: false, error: new Error('Load already in progress') };
    }

    set({ isLoadingComponents: true, loadComponentsError: null });

    const result = await loadComponentsFromFile();

    if (result.ok) {
      set({
        components: result.data,
        isLoadingComponents: false,
        loadComponentsError: null,
      });
    } else {
      set({
        isLoadingComponents: false,
        loadComponentsError: result.error.message,
      });
    }

    return result;
  },

  setComponentIndex: (index: Map<string, Component>) => {
    set({ componentIndex: index });
  },

  getComponent: (ref: string): Component | undefined => {
    return get().componentIndex.get(ref);
  },

  // Hover state (Story 2.3)
  hoveredRef: null,
  setHoveredRef: (ref: string | null) => set({ hoveredRef: ref }),

  // Selection state (Story 2.4)
  selectedRef: null,
  selectComponent: (ref: string | null) => set({ selectedRef: ref }),
  clearSelection: () => set({ selectedRef: null }),

  // Comment state (Story 3.1)
  comments: [],
  isLoadingComments: false,
  loadCommentsError: null,

  loadComments: async (): Promise<Result<Comment[], Error>> => {
    // Prevent duplicate loads
    if (get().isLoadingComments) {
      return { ok: false, error: new Error('Load already in progress') };
    }

    set({ isLoadingComments: true, loadCommentsError: null });

    try {
      const response = await fetch('/fixtures/comments.json');

      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}`);
        set({
          isLoadingComments: false,
          loadCommentsError: `Failed to load comments: HTTP ${response.status}`,
          comments: [],
        });
        return { ok: false, error };
      }

      const comments = (await response.json()) as Comment[];
      set({
        comments,
        isLoadingComments: false,
        loadCommentsError: null,
      });
      return { ok: true, data: comments };
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Unknown error occurred');
      set({
        isLoadingComments: false,
        loadCommentsError: `Failed to load comments: ${errorObj.message}`,
        comments: [],
      });
      return { ok: false, error: errorObj };
    }
  },

  setComments: (comments: Comment[]) => set({ comments }),

  // Add comment state (Story 3.2)
  authorName: getStoredAuthor(),

  setAuthorName: (name: string) => {
    setStoredAuthor(name);
    set({ authorName: name });
  },

  isAddingComment: false,
  addCommentError: null,

  addComment: async (content: string, componentRef: string): Promise<Result<Comment, Error>> => {
    const { authorName, comments } = get();

    if (!authorName) {
      return { ok: false, error: new Error('Author name is required') };
    }

    if (!content.trim()) {
      return { ok: false, error: new Error('Comment content is required') };
    }

    set({ isAddingComment: true, addCommentError: null });

    try {
      const newComment: Comment = {
        id: crypto.randomUUID(),
        author: authorName,
        content: content.trim(),
        createdAt: new Date().toISOString(),
        componentRef,
        status: 'open',
      };

      const updatedComments = [...comments, newComment];
      set({ comments: updatedComments, isAddingComment: false });

      return { ok: true, data: newComment };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add comment';
      set({ isAddingComment: false, addCommentError: errorMessage });
      return { ok: false, error: error instanceof Error ? error : new Error(errorMessage) };
    }
  },

  // Add general comment action (Story 3.3)
  addGeneralComment: async (content: string): Promise<Result<Comment, Error>> => {
    const { authorName, comments } = get();

    if (!authorName) {
      return { ok: false, error: new Error('Author name is required') };
    }

    if (!content.trim()) {
      return { ok: false, error: new Error('Comment content is required') };
    }

    set({ isAddingComment: true, addCommentError: null });

    try {
      const newComment: Comment = {
        id: crypto.randomUUID(),
        author: authorName,
        content: content.trim(),
        createdAt: new Date().toISOString(),
        status: 'open',
        // NOTE: No componentRef field for general comments!
      };

      const updatedComments = [...comments, newComment];
      set({ comments: updatedComments, isAddingComment: false });

      return { ok: true, data: newComment };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add comment';
      set({ isAddingComment: false, addCommentError: errorMessage });
      return { ok: false, error: error instanceof Error ? error : new Error(errorMessage) };
    }
  },

  // Comment status actions (Story 3.4)
  resolveComment: (id: string) => {
    set((state) => ({
      comments: state.comments.map((comment) =>
        comment.id === id
          ? { ...comment, status: 'resolved' as const, updatedAt: new Date().toISOString() }
          : comment
      ),
    }));
  },

  reopenComment: (id: string) => {
    set((state) => ({
      comments: state.comments.map((comment) =>
        comment.id === id
          ? { ...comment, status: 'open' as const, updatedAt: new Date().toISOString() }
          : comment
      ),
    }));
  },

  // Comment filter state (Story 3.4)
  commentFilter: 'all',
  setCommentFilter: (filter: 'all' | 'open' | 'resolved') => {
    set({ commentFilter: filter });
  },

  // Add reply action (Story 3.5)
  addReply: async (parentId: string, content: string): Promise<Result<Comment, Error>> => {
    const { authorName, comments } = get();

    if (!authorName) {
      return { ok: false, error: new Error('Author name is required') };
    }

    if (!content.trim()) {
      return { ok: false, error: new Error('Reply content is required') };
    }

    // Verify parent exists and is a root comment (not a reply itself)
    const parent = comments.find((c) => c.id === parentId);
    if (!parent) {
      return { ok: false, error: new Error('Parent comment not found') };
    }
    if (parent.parentId) {
      return { ok: false, error: new Error('Can only reply to root comments') };
    }

    set({ isAddingComment: true, addCommentError: null });

    try {
      const newReply: Comment = {
        id: crypto.randomUUID(),
        author: authorName,
        content: content.trim(),
        createdAt: new Date().toISOString(),
        status: 'open',
        parentId,
      };

      const updatedComments = [...comments, newReply];
      set({ comments: updatedComments, isAddingComment: false });

      return { ok: true, data: newReply };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add reply';
      set({ isAddingComment: false, addCommentError: errorMessage });
      return { ok: false, error: error instanceof Error ? error : new Error(errorMessage) };
    }
  },

  // Edit/Delete comment state (Story 3.6)
  isEditingComment: false,
  editCommentError: null,
  isDeletingComment: false,
  deleteCommentError: null,

  // Edit comment action (Story 3.6)
  editComment: (id: string, newContent: string): Result<Comment, Error> => {
    if (!newContent.trim()) {
      return { ok: false, error: new Error('Comment content is required') };
    }

    const { comments } = get();
    const commentIndex = comments.findIndex((c) => c.id === id);

    if (commentIndex === -1) {
      return { ok: false, error: new Error('Comment not found') };
    }

    set({ isEditingComment: true, editCommentError: null });

    try {
      const updatedComment: Comment = {
        ...comments[commentIndex],
        content: newContent.trim(),
        updatedAt: new Date().toISOString(),
      };

      const updatedComments = [...comments];
      updatedComments[commentIndex] = updatedComment;

      set({ comments: updatedComments, isEditingComment: false });
      return { ok: true, data: updatedComment };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to edit comment';
      set({ isEditingComment: false, editCommentError: errorMessage });
      return { ok: false, error: error instanceof Error ? error : new Error(errorMessage) };
    }
  },

  // Delete comment action (Story 3.6)
  deleteComment: (id: string): Result<void, Error> => {
    const { comments } = get();
    const comment = comments.find((c) => c.id === id);

    if (!comment) {
      return { ok: false, error: new Error('Comment not found') };
    }

    set({ isDeletingComment: true, deleteCommentError: null });

    try {
      // If deleting a root comment (no parentId), also delete all replies
      const isRootComment = !comment.parentId;
      const idsToDelete = new Set<string>([id]);

      if (isRootComment) {
        // Find all replies to this root comment
        comments.forEach((c) => {
          if (c.parentId === id) {
            idsToDelete.add(c.id);
          }
        });
      }

      const updatedComments = comments.filter((c) => !idsToDelete.has(c.id));
      set({ comments: updatedComments, isDeletingComment: false });

      return { ok: true, data: undefined };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete comment';
      set({ isDeletingComment: false, deleteCommentError: errorMessage });
      return { ok: false, error: error instanceof Error ? error : new Error(errorMessage) };
    }
  },
}));

// Computed selectors (Story 3.4)
// UPDATED for Story 3.5: Only filter root comments, replies follow their parent
export function selectFilteredComments(state: ViewerState): Comment[] {
  const { comments, commentFilter } = state;
  const rootComments = comments.filter((c) => !c.parentId);
  if (commentFilter === 'all') return rootComments;
  return rootComments.filter((c) => c.status === commentFilter);
}

// UPDATED for Story 3.5: Only count root comments
export function selectCommentCounts(state: ViewerState): {
  total: number;
  open: number;
  resolved: number;
} {
  const { comments } = state;
  const rootComments = comments.filter((c) => !c.parentId);
  return {
    total: rootComments.length,
    open: rootComments.filter((c) => c.status === 'open').length,
    resolved: rootComments.filter((c) => c.status === 'resolved').length,
  };
}

// Story 3.5: Thread helper selectors
export function selectRootComments(state: ViewerState): Comment[] {
  return state.comments.filter((c) => !c.parentId);
}

export function selectRepliesForComment(state: ViewerState, parentId: string): Comment[] {
  return state.comments.filter((c) => c.parentId === parentId);
}

export function selectRepliesForCommentSorted(state: ViewerState, parentId: string): Comment[] {
  return state.comments
    .filter((c) => c.parentId === parentId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}
