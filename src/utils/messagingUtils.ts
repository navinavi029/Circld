import { Conversation, ConversationSummary } from '../types/swipe-trading';

/**
 * Calculates the total unread message count for a user across all conversations.
 * 
 * @param conversations - Array of conversations
 * @param userId - ID of the user to calculate unread count for
 * @returns Total number of unread messages across all conversations
 */
export function calculateTotalUnreadCount(
  conversations: Conversation[],
  userId: string
): number {
  if (!userId || !conversations || conversations.length === 0) {
    return 0;
  }

  return conversations.reduce((total, conversation) => {
    const unreadForUser = conversation.unreadCount[userId] || 0;
    return total + unreadForUser;
  }, 0);
}

/**
 * Calculates the total unread message count from conversation summaries.
 * 
 * @param summaries - Array of conversation summaries
 * @returns Total number of unread messages across all conversation summaries
 */
export function calculateTotalUnreadCountFromSummaries(
  summaries: ConversationSummary[]
): number {
  if (!summaries || summaries.length === 0) {
    return 0;
  }

  return summaries.reduce((total, summary) => {
    return total + summary.unreadCount;
  }, 0);
}

/**
 * Formats an unread count for display, showing "9+" for counts greater than 9.
 * 
 * @param count - The unread count to format
 * @returns Formatted string representation of the count
 */
export function formatUnreadCount(count: number): string {
  if (count <= 0) {
    return '0';
  }
  return count > 9 ? '9+' : count.toString();
}
