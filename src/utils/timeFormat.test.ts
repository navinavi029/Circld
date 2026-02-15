import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatTimeAgo, formatMemberSince } from './timeFormat';
import { Timestamp } from 'firebase/firestore';

// Mock Firebase
vi.mock('../firebase', () => ({
  db: {},
}));

describe('timeFormat utilities', () => {
  let originalNow: () => number;

  beforeEach(() => {
    // Save original Date.now
    originalNow = Date.now;
    // Mock Date.now to return a fixed timestamp (Jan 15, 2024, 12:00:00 UTC)
    const fixedTime = new Date('2024-01-15T12:00:00Z').getTime();
    Date.now = vi.fn(() => fixedTime);
  });

  afterEach(() => {
    // Restore original Date.now
    Date.now = originalNow;
  });

  describe('formatTimeAgo', () => {
    describe('various time ranges', () => {
      it('should format times less than 1 minute as "just now"', () => {
        // 30 seconds ago
        const timestamp = Timestamp.fromDate(new Date('2024-01-15T11:59:30Z'));
        expect(formatTimeAgo(timestamp)).toBe('just now');

        // 0 seconds ago (edge case)
        const timestamp2 = Timestamp.fromDate(new Date('2024-01-15T12:00:00Z'));
        expect(formatTimeAgo(timestamp2)).toBe('just now');

        // 59 seconds ago
        const timestamp3 = Timestamp.fromDate(new Date('2024-01-15T11:59:01Z'));
        expect(formatTimeAgo(timestamp3)).toBe('just now');
      });

      it('should format times in minutes', () => {
        // 1 minute ago
        const timestamp1 = Timestamp.fromDate(new Date('2024-01-15T11:59:00Z'));
        expect(formatTimeAgo(timestamp1)).toBe('1 minute ago');

        // 5 minutes ago
        const timestamp2 = Timestamp.fromDate(new Date('2024-01-15T11:55:00Z'));
        expect(formatTimeAgo(timestamp2)).toBe('5 minutes ago');

        // 30 minutes ago
        const timestamp3 = Timestamp.fromDate(new Date('2024-01-15T11:30:00Z'));
        expect(formatTimeAgo(timestamp3)).toBe('30 minutes ago');

        // 59 minutes ago
        const timestamp4 = Timestamp.fromDate(new Date('2024-01-15T11:01:00Z'));
        expect(formatTimeAgo(timestamp4)).toBe('59 minutes ago');
      });

      it('should format times in hours', () => {
        // 1 hour ago
        const timestamp1 = Timestamp.fromDate(new Date('2024-01-15T11:00:00Z'));
        expect(formatTimeAgo(timestamp1)).toBe('1 hour ago');

        // 2 hours ago
        const timestamp2 = Timestamp.fromDate(new Date('2024-01-15T10:00:00Z'));
        expect(formatTimeAgo(timestamp2)).toBe('2 hours ago');

        // 12 hours ago
        const timestamp3 = Timestamp.fromDate(new Date('2024-01-15T00:00:00Z'));
        expect(formatTimeAgo(timestamp3)).toBe('12 hours ago');

        // 23 hours ago
        const timestamp4 = Timestamp.fromDate(new Date('2024-01-14T13:00:00Z'));
        expect(formatTimeAgo(timestamp4)).toBe('23 hours ago');
      });

      it('should format times in days', () => {
        // 1 day ago
        const timestamp1 = Timestamp.fromDate(new Date('2024-01-14T12:00:00Z'));
        expect(formatTimeAgo(timestamp1)).toBe('1 day ago');

        // 3 days ago
        const timestamp2 = Timestamp.fromDate(new Date('2024-01-12T12:00:00Z'));
        expect(formatTimeAgo(timestamp2)).toBe('3 days ago');

        // 7 days ago
        const timestamp3 = Timestamp.fromDate(new Date('2024-01-08T12:00:00Z'));
        expect(formatTimeAgo(timestamp3)).toBe('7 days ago');

        // 29 days ago
        const timestamp4 = Timestamp.fromDate(new Date('2023-12-17T12:00:00Z'));
        expect(formatTimeAgo(timestamp4)).toBe('29 days ago');
      });

      it('should format times in months', () => {
        // 1 month ago (30 days)
        const timestamp1 = Timestamp.fromDate(new Date('2023-12-16T12:00:00Z'));
        expect(formatTimeAgo(timestamp1)).toBe('1 month ago');

        // 2 months ago (60 days)
        const timestamp2 = Timestamp.fromDate(new Date('2023-11-16T12:00:00Z'));
        expect(formatTimeAgo(timestamp2)).toBe('2 months ago');

        // 6 months ago (180 days)
        const timestamp3 = Timestamp.fromDate(new Date('2023-07-19T12:00:00Z'));
        expect(formatTimeAgo(timestamp3)).toBe('6 months ago');

        // 11 months ago (330 days)
        const timestamp4 = Timestamp.fromDate(new Date('2023-02-19T12:00:00Z'));
        expect(formatTimeAgo(timestamp4)).toBe('11 months ago');
      });

      it('should format times in years', () => {
        // 1 year ago (365 days)
        const timestamp1 = Timestamp.fromDate(new Date('2023-01-15T12:00:00Z'));
        expect(formatTimeAgo(timestamp1)).toBe('1 year ago');

        // 2 years ago (730 days)
        const timestamp2 = Timestamp.fromDate(new Date('2022-01-15T12:00:00Z'));
        expect(formatTimeAgo(timestamp2)).toBe('2 years ago');

        // 4 years ago
        const timestamp3 = Timestamp.fromDate(new Date('2020-01-15T12:00:00Z'));
        expect(formatTimeAgo(timestamp3)).toBe('4 years ago');
      });

      it('should format very old dates (5+ years) as absolute date', () => {
        // 5 years ago
        const timestamp1 = Timestamp.fromDate(new Date('2019-01-15T12:00:00Z'));
        expect(formatTimeAgo(timestamp1)).toBe('Jan 15, 2019');

        // 10 years ago
        const timestamp2 = Timestamp.fromDate(new Date('2014-03-22T12:00:00Z'));
        expect(formatTimeAgo(timestamp2)).toBe('Mar 22, 2014');

        // 20 years ago
        const timestamp3 = Timestamp.fromDate(new Date('2004-12-31T12:00:00Z'));
        expect(formatTimeAgo(timestamp3)).toBe('Dec 31, 2004');
      });
    });

    describe('edge cases', () => {
      it('should handle 0 seconds (current time)', () => {
        const timestamp = Timestamp.fromDate(new Date('2024-01-15T12:00:00Z'));
        expect(formatTimeAgo(timestamp)).toBe('just now');
      });

      it('should handle boundary between minutes and hours', () => {
        // Exactly 60 minutes ago
        const timestamp = Timestamp.fromDate(new Date('2024-01-15T11:00:00Z'));
        expect(formatTimeAgo(timestamp)).toBe('1 hour ago');
      });

      it('should handle boundary between hours and days', () => {
        // Exactly 24 hours ago
        const timestamp = Timestamp.fromDate(new Date('2024-01-14T12:00:00Z'));
        expect(formatTimeAgo(timestamp)).toBe('1 day ago');
      });

      it('should handle boundary between days and months', () => {
        // Exactly 30 days ago
        const timestamp = Timestamp.fromDate(new Date('2023-12-16T12:00:00Z'));
        expect(formatTimeAgo(timestamp)).toBe('1 month ago');
      });

      it('should handle boundary between months and years', () => {
        // Exactly 365 days ago
        const timestamp = Timestamp.fromDate(new Date('2023-01-15T12:00:00Z'));
        expect(formatTimeAgo(timestamp)).toBe('1 year ago');
      });

      it('should handle very old dates correctly', () => {
        // 100 years ago
        const timestamp = Timestamp.fromDate(new Date('1924-01-15T12:00:00Z'));
        expect(formatTimeAgo(timestamp)).toBe('Jan 15, 1924');
      });
    });
  });

  describe('formatMemberSince', () => {
    it('should format timestamp as "Member since Month Year"', () => {
      const timestamp1 = Timestamp.fromDate(new Date('2024-01-15T12:00:00Z'));
      expect(formatMemberSince(timestamp1)).toBe('Member since Jan 2024');

      const timestamp2 = Timestamp.fromDate(new Date('2023-06-22T08:30:00Z'));
      expect(formatMemberSince(timestamp2)).toBe('Member since Jun 2023');

      const timestamp3 = Timestamp.fromDate(new Date('2020-12-01T00:00:00Z'));
      expect(formatMemberSince(timestamp3)).toBe('Member since Dec 2020');
    });

    it('should handle all months correctly', () => {
      const months = [
        { date: '2024-01-01', expected: 'Member since Jan 2024' },
        { date: '2024-02-01', expected: 'Member since Feb 2024' },
        { date: '2024-03-01', expected: 'Member since Mar 2024' },
        { date: '2024-04-01', expected: 'Member since Apr 2024' },
        { date: '2024-05-01', expected: 'Member since May 2024' },
        { date: '2024-06-01', expected: 'Member since Jun 2024' },
        { date: '2024-07-01', expected: 'Member since Jul 2024' },
        { date: '2024-08-01', expected: 'Member since Aug 2024' },
        { date: '2024-09-01', expected: 'Member since Sep 2024' },
        { date: '2024-10-01', expected: 'Member since Oct 2024' },
        { date: '2024-11-01', expected: 'Member since Nov 2024' },
        { date: '2024-12-01', expected: 'Member since Dec 2024' },
      ];

      months.forEach(({ date, expected }) => {
        const timestamp = Timestamp.fromDate(new Date(date));
        expect(formatMemberSince(timestamp)).toBe(expected);
      });
    });

    it('should handle very old dates', () => {
      const timestamp = Timestamp.fromDate(new Date('1990-05-15T12:00:00Z'));
      expect(formatMemberSince(timestamp)).toBe('Member since May 1990');
    });

    it('should handle recent dates', () => {
      const timestamp = Timestamp.fromDate(new Date('2024-01-01T00:00:00Z'));
      expect(formatMemberSince(timestamp)).toBe('Member since Jan 2024');
    });
  });
});
