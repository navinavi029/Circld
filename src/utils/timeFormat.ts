/**
 * Time formatting utilities for displaying relative time and dates
 */

import { Timestamp } from 'firebase/firestore';

/**
 * Format a timestamp as relative time (e.g., "2 hours ago", "3 days ago")
 * @param timestamp - Firebase Timestamp to format
 * @returns Formatted relative time string
 */
export function formatTimeAgo(timestamp: Timestamp): string {
  const now = Date.now();
  const date = timestamp.toDate();
  const diffMs = now - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  // Handle edge case: very recent times (< 1 minute)
  if (diffSeconds < 60) {
    return 'just now';
  }

  // Minutes
  if (diffMinutes < 60) {
    return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
  }

  // Hours
  if (diffHours < 24) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  }

  // Days
  if (diffDays < 30) {
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  }

  // Months
  if (diffMonths < 12) {
    return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`;
  }

  // Years
  if (diffYears === 1) {
    return '1 year ago';
  } else if (diffYears < 5) {
    return `${diffYears} years ago`;
  }

  // For very old dates (5+ years), show the actual date
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
}

/**
 * Format a timestamp as "Member since" date (e.g., "Member since Jan 2024")
 * @param timestamp - Firebase Timestamp to format
 * @returns Formatted member since string
 */
export function formatMemberSince(timestamp: Timestamp): string {
  const date = timestamp.toDate();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  return `Member since ${month} ${year}`;
}
