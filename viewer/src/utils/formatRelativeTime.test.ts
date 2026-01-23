import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { formatRelativeTime } from './formatRelativeTime';

describe('formatRelativeTime', () => {
  beforeEach(() => {
    // Mock Date.now() to return a fixed timestamp: 2026-01-23T12:00:00Z
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-23T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "just now" for very recent times (< 60 seconds)', () => {
    const now = new Date().toISOString();
    expect(formatRelativeTime(now)).toBe('just now');

    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000).toISOString();
    expect(formatRelativeTime(thirtySecondsAgo)).toBe('just now');
  });

  it('returns "1 minute ago" for times around 1 minute', () => {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    expect(formatRelativeTime(oneMinuteAgo)).toMatch(/1 minute ago/);
  });

  it('returns "X minutes ago" for recent times (< 60 minutes)', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(formatRelativeTime(fiveMinutesAgo)).toMatch(/5 minutes ago/);

    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    expect(formatRelativeTime(thirtyMinutesAgo)).toMatch(/30 minutes ago/);
  });

  it('returns "1 hour ago" for times around 1 hour', () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(oneHourAgo)).toMatch(/1 hour ago/);
  });

  it('returns "X hours ago" for today (< 24 hours)', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(twoHoursAgo)).toMatch(/2 hours ago/);

    const tenHoursAgo = new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(tenHoursAgo)).toMatch(/10 hours ago/);
  });

  it('returns "yesterday" for times around 1 day ago', () => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(oneDayAgo)).toMatch(/yesterday/);
  });

  it('returns "X days ago" for this week (< 30 days)', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(threeDaysAgo)).toMatch(/3 days ago/);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(sevenDaysAgo)).toMatch(/7 days ago/);
  });

  it('returns formatted date for old comments (> 30 days)', () => {
    const oldDate = '2025-06-15T10:00:00Z';
    const result = formatRelativeTime(oldDate);
    // Should contain month and day in some format
    expect(result).toMatch(/Jun.*15.*2025|15.*Jun.*2025/);
  });

  it('handles invalid date strings gracefully', () => {
    // Should not throw
    expect(() => formatRelativeTime('invalid')).not.toThrow();
    // Should return a fallback value
    const result = formatRelativeTime('invalid');
    expect(typeof result).toBe('string');
  });

  it('handles future dates gracefully', () => {
    const futureDate = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour in future
    // Should not throw and should return something reasonable
    expect(() => formatRelativeTime(futureDate)).not.toThrow();
    const result = formatRelativeTime(futureDate);
    expect(typeof result).toBe('string');
  });

  it('handles edge case at exactly 60 seconds', () => {
    const exactlyOneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    expect(formatRelativeTime(exactlyOneMinuteAgo)).toMatch(/1 minute ago/);
  });
});
