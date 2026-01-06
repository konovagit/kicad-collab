/**
 * Schema types for the viewer application
 *
 * Re-exports types from the shared schema (source of truth)
 * and adds viewer-specific type utilities.
 */

// Re-export all shared types
export type {
  Manifest,
  Component,
  Comment,
  ReviewStatus,
  CommentStatus,
  Result,
} from '../../../shared/schema/types';

// Import for use in this file
import type { Manifest, Component, Comment } from '../../../shared/schema/types';

/**
 * Snapshot data loaded from .kicad-collab folder
 */
export interface Snapshot {
  manifest: Manifest;
  components: Component[];
  svgContent: string;
  comments?: Comment[];
}

/**
 * Input type for creating a new comment (before ID/timestamp assignment)
 */
export interface NewComment {
  author: string;
  content: string;
  componentRef?: string;
}

/**
 * Input type for creating a reply to an existing comment
 */
export interface NewReply {
  author: string;
  content: string;
  parentId: string;
}
