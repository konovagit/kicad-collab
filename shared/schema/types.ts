/**
 * KiCad Collab Shared Types
 *
 * Source of truth for the data contract between plugin and viewer.
 * ALL JSON fields use camelCase - this is mandatory.
 */

// ============================================================================
// Manifest Types
// ============================================================================

/**
 * Review status for a schematic snapshot
 */
export type ReviewStatus = 'pending' | 'in_progress' | 'completed';

/**
 * Manifest file containing snapshot metadata
 */
export interface Manifest {
  /** Schema version for migrations (e.g., '1.0') */
  formatVersion: string;
  /** ISO 8601 timestamp when snapshot was generated */
  generatedAt: string;
  /** KiCad version that generated the snapshot */
  kicadVersion?: string;
  /** Name of the KiCad project */
  projectName: string;
  /** Current review status */
  reviewStatus?: ReviewStatus;
  /** ISO 8601 timestamp when review was started */
  reviewStartedAt?: string;
  /** ISO 8601 timestamp when review was completed */
  reviewCompletedAt?: string;
}

// ============================================================================
// Component Types
// ============================================================================

/**
 * Component metadata extracted from KiCad schematic
 */
export interface Component {
  /** Component reference designator (e.g., 'C12', 'R1', 'U1') */
  ref: string;
  /** Component value (e.g., '100uF', '10k', 'ESP32-WROOM') */
  value?: string;
  /** Footprint name (e.g., 'Capacitor_SMD:C_0805') */
  footprint?: string;
  /** X position in schematic units */
  posX?: number;
  /** Y position in schematic units */
  posY?: number;
}

// ============================================================================
// Comment Types
// ============================================================================

/**
 * Comment status
 */
export type CommentStatus = 'open' | 'resolved';

/**
 * Review comment for a schematic
 */
export interface Comment {
  /** Unique comment ID (UUID format recommended) */
  id: string;
  /** Name of the comment author */
  author: string;
  /** Comment text content */
  content: string;
  /** ISO 8601 timestamp when comment was created */
  createdAt: string;
  /** ISO 8601 timestamp when comment was last updated */
  updatedAt?: string;
  /** Reference of anchored component (undefined for general comments) */
  componentRef?: string;
  /** Comment status */
  status: CommentStatus;
  /** Parent comment ID for threaded replies */
  parentId?: string;
}

// ============================================================================
// Result Type for Validation
// ============================================================================

/**
 * Result type for fallible operations - use instead of throwing errors
 */
export type Result<T, E = Error> =
  | { ok: true; data: T }
  | { ok: false; error: E };
