import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { clearStoredAuthor, getStoredAuthor, setStoredAuthor } from './authorStorage';

describe('authorStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('getStoredAuthor', () => {
    it('returns null when no author is stored', () => {
      expect(getStoredAuthor()).toBeNull();
    });

    it('returns stored author name', () => {
      localStorage.setItem('kicad-collab-author-name', 'Alice');
      expect(getStoredAuthor()).toBe('Alice');
    });

    it('returns null when localStorage throws an error', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('localStorage unavailable');
      });
      expect(getStoredAuthor()).toBeNull();
    });
  });

  describe('setStoredAuthor', () => {
    it('stores author name in localStorage', () => {
      setStoredAuthor('Bob');
      expect(localStorage.getItem('kicad-collab-author-name')).toBe('Bob');
    });

    it('overwrites existing author name', () => {
      localStorage.setItem('kicad-collab-author-name', 'Alice');
      setStoredAuthor('Bob');
      expect(localStorage.getItem('kicad-collab-author-name')).toBe('Bob');
    });

    it('does not throw when localStorage is unavailable', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('localStorage unavailable');
      });
      expect(() => setStoredAuthor('Alice')).not.toThrow();
    });
  });

  describe('clearStoredAuthor', () => {
    it('removes author name from localStorage', () => {
      localStorage.setItem('kicad-collab-author-name', 'Alice');
      clearStoredAuthor();
      expect(localStorage.getItem('kicad-collab-author-name')).toBeNull();
    });

    it('does not throw when no author is stored', () => {
      expect(() => clearStoredAuthor()).not.toThrow();
    });

    it('does not throw when localStorage is unavailable', () => {
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('localStorage unavailable');
      });
      expect(() => clearStoredAuthor()).not.toThrow();
    });
  });
});
