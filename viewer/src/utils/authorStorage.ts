/**
 * Author name persistence utilities for localStorage
 */

const AUTHOR_KEY = 'kicad-collab-author-name';

/**
 * Retrieves the stored author name from localStorage
 * @returns The stored author name or null if not found/unavailable
 */
export function getStoredAuthor(): string | null {
  try {
    return localStorage.getItem(AUTHOR_KEY);
  } catch {
    // localStorage may not be available (SSR, privacy mode)
    return null;
  }
}

/**
 * Stores the author name in localStorage
 * @param name - The author name to store
 */
export function setStoredAuthor(name: string): void {
  try {
    localStorage.setItem(AUTHOR_KEY, name);
  } catch {
    // Silently fail if localStorage unavailable
  }
}

/**
 * Clears the stored author name from localStorage
 */
export function clearStoredAuthor(): void {
  try {
    localStorage.removeItem(AUTHOR_KEY);
  } catch {
    // Silently fail if localStorage unavailable
  }
}
