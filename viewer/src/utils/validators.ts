/**
 * Zod validation schemas for snapshot data
 *
 * Provides runtime validation at viewer load using Result type pattern.
 * Schemas match JSON schemas in shared/schema/*.schema.json
 */

import { z } from 'zod';
import type { Manifest, Component, Comment, Result } from '@/types';

// ============================================================================
// Zod Schemas
// ============================================================================

/**
 * Schema for manifest.json validation
 */
export const manifestSchema = z.object({
  formatVersion: z
    .string()
    .regex(/^\d+\.\d+$/, 'formatVersion must match pattern X.Y (e.g., "1.0")'),
  generatedAt: z.string().datetime({ message: 'generatedAt must be ISO 8601 datetime' }),
  kicadVersion: z.string().optional(),
  projectName: z.string().min(1, 'projectName is required'),
  reviewStatus: z.enum(['pending', 'in_progress', 'completed']).optional().default('pending'),
  reviewStartedAt: z.string().datetime().optional(),
  reviewCompletedAt: z.string().datetime().optional(),
});

/**
 * Schema for a single component
 */
export const componentSchema = z.object({
  ref: z.string().min(1, 'ref is required'),
  value: z.string().optional(),
  footprint: z.string().optional(),
  posX: z.number().optional(),
  posY: z.number().optional(),
});

/**
 * Schema for components.json validation (array of components)
 */
export const componentsSchema = z.array(componentSchema);

/**
 * Schema for a single comment
 */
export const commentSchema = z.object({
  id: z.string().min(1, 'id is required'),
  author: z.string().min(1, 'author is required'),
  content: z.string().min(1, 'content is required'),
  createdAt: z.string().datetime({ message: 'createdAt must be ISO 8601 datetime' }),
  updatedAt: z.string().datetime().optional(),
  componentRef: z.string().optional(),
  status: z.enum(['open', 'resolved']),
  parentId: z.string().optional(),
});

/**
 * Schema for comments.json validation (array of comments)
 */
export const commentsSchema = z.array(commentSchema);

// ============================================================================
// Inferred Types (for internal use)
// ============================================================================

export type ManifestInput = z.input<typeof manifestSchema>;
export type ComponentInput = z.input<typeof componentSchema>;
export type CommentInput = z.input<typeof commentSchema>;

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate manifest data
 * @param data - Unknown data to validate
 * @returns Result with validated Manifest or ZodError
 */
export function validateManifest(data: unknown): Result<Manifest, z.ZodError> {
  const result = manifestSchema.safeParse(data);
  if (result.success) {
    return { ok: true, data: result.data as Manifest };
  }
  return { ok: false, error: result.error };
}

/**
 * Validate components array
 * @param data - Unknown data to validate
 * @returns Result with validated Component[] or ZodError
 */
export function validateComponents(data: unknown): Result<Component[], z.ZodError> {
  const result = componentsSchema.safeParse(data);
  if (result.success) {
    return { ok: true, data: result.data as Component[] };
  }
  return { ok: false, error: result.error };
}

/**
 * Validate comments array
 * @param data - Unknown data to validate
 * @returns Result with validated Comment[] or ZodError
 */
export function validateComments(data: unknown): Result<Comment[], z.ZodError> {
  const result = commentsSchema.safeParse(data);
  if (result.success) {
    return { ok: true, data: result.data as Comment[] };
  }
  return { ok: false, error: result.error };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format Zod validation errors into a human-readable string
 * @param error - ZodError from validation
 * @returns Formatted error message
 */
export function formatValidationError(error: z.ZodError): string {
  return error.issues
    .map((e) => {
      const path = e.path.join('.');
      return path ? `${path}: ${e.message}` : e.message;
    })
    .join('; ');
}

/**
 * Check if a Result is successful
 * @param result - Result to check
 * @returns Type guard for successful result
 */
export function isOk<T, E>(result: Result<T, E>): result is { ok: true; data: T } {
  return result.ok;
}

/**
 * Check if a Result is an error
 * @param result - Result to check
 * @returns Type guard for error result
 */
export function isErr<T, E>(result: Result<T, E>): result is { ok: false; error: E } {
  return !result.ok;
}
