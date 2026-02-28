import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Conversation } from '../types/swipe-trading';

/**
 * Result of message validation
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedMessage?: string;
}

/**
 * Sanitizes message content by removing HTML and script tags.
 * 
 * @param text - The message text to sanitize
 * @returns Sanitized message text
 */
export function sanitizeMessage(text: string): string {
  // Remove script tags and their content
  let sanitized = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove all HTML tags
  sanitized = sanitized.replace(/<[^>]+>/g, '');
  
  return sanitized;
}

/**
 * Validates message length and content.
 * 
 * @param text - The message text to validate
 * @returns Validation result with error message if invalid
 */
export function validateMessageContent(text: string): ValidationResult {
  // Trim whitespace
  const trimmedText = text.trim();
  
  // Check for empty or whitespace-only messages
  if (trimmedText.length === 0) {
    return {
      isValid: false,
      error: 'Message cannot be empty or contain only whitespace'
    };
  }
  
  // Check minimum length
  if (trimmedText.length < 1) {
    return {
      isValid: false,
      error: 'Message must be at least 1 character long'
    };
  }
  
  // Check maximum length (1000 characters as per requirements)
  if (trimmedText.length > 1000) {
    return {
      isValid: false,
      error: 'Message cannot exceed 1000 characters'
    };
  }
  
  // Sanitize the message
  const sanitizedMessage = sanitizeMessage(trimmedText);
  
  return {
    isValid: true,
    sanitizedMessage
  };
}

/**
 * Validates that a conversation exists and the user is a participant.
 * 
 * @param conversationId - ID of the conversation
 * @param userId - ID of the user attempting to send the message
 * @returns Validation result with error message if invalid
 */
export async function validateConversationAccess(
  conversationId: string,
  userId: string
): Promise<ValidationResult> {
  try {
    // Check for required parameters
    if (!conversationId) {
      return {
        isValid: false,
        error: 'Conversation ID is required'
      };
    }
    
    if (!userId) {
      return {
        isValid: false,
        error: 'User ID is required'
      };
    }
    
    // Fetch conversation from database
    const conversationDoc = await getDoc(doc(db, 'conversations', conversationId));
    
    // Check if conversation exists
    if (!conversationDoc.exists()) {
      return {
        isValid: false,
        error: 'Conversation not found'
      };
    }
    
    const conversation = conversationDoc.data() as Conversation;
    
    // Verify user is a participant
    if (!conversation.participantIds || !conversation.participantIds.includes(userId)) {
      return {
        isValid: false,
        error: 'You are not authorized to send messages in this conversation'
      };
    }
    
    return {
      isValid: true
    };
  } catch (error) {
    console.error('Error validating conversation access:', error);
    return {
      isValid: false,
      error: 'Unable to validate conversation access. Please try again.'
    };
  }
}

/**
 * Performs complete message validation including content and conversation access.
 * 
 * @param text - The message text to validate
 * @param conversationId - ID of the conversation
 * @param userId - ID of the user attempting to send the message
 * @returns Validation result with sanitized message if valid, or error message if invalid
 */
export async function validateMessage(
  text: string,
  conversationId: string,
  userId: string
): Promise<ValidationResult> {
  // First validate message content
  const contentValidation = validateMessageContent(text);
  if (!contentValidation.isValid) {
    return contentValidation;
  }
  
  // Then validate conversation access
  const accessValidation = await validateConversationAccess(conversationId, userId);
  if (!accessValidation.isValid) {
    return accessValidation;
  }
  
  // Return success with sanitized message
  return {
    isValid: true,
    sanitizedMessage: contentValidation.sanitizedMessage
  };
}
