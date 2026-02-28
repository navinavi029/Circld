import { useState, useCallback } from 'react';
import { Item } from '../types/item';
import { UserProfile } from '../types/user';
import { removeSwipe } from '../services/swipeHistoryService';
import { createLogger } from '../utils/logger';

const logger = createLogger('useSwipeUndo');

/**
 * Represents a swipe action that can be undone
 */
export interface UndoableSwipe {
  item: Item;
  ownerProfile: UserProfile;
  direction: 'left' | 'right';
  sessionId: string;
  userId: string;
  timestamp: number;
}

/**
 * Custom hook for managing swipe undo functionality
 * Stores last 10 swipe decisions and provides undo capability
 * 
 * Requirements: 6.1, 6.3, 6.7, 9.4
 */
export function useSwipeUndo() {
  const [undoStack, setUndoStack] = useState<UndoableSwipe[]>([]);

  /**
   * Adds a swipe to the undo stack
   * Maintains maximum of 10 swipes in the stack
   */
  const addSwipe = useCallback((swipe: UndoableSwipe) => {
    setUndoStack((prev) => {
      const newStack = [...prev, swipe];
      // Keep only last 10 swipes (Requirement 9.4)
      if (newStack.length > 10) {
        return newStack.slice(-10);
      }
      return newStack;
    });
  }, []);

  /**
   * Undoes the most recent swipe
   * Removes the swipe from database and returns the item to restore
   * 
   * @returns The undone swipe or null if stack is empty
   */
  const undo = useCallback(async (): Promise<UndoableSwipe | null> => {
    if (undoStack.length === 0) {
      return null;
    }

    const lastSwipe = undoStack[undoStack.length - 1];

    try {
      // Remove swipe from database
      await removeSwipe(
        lastSwipe.sessionId,
        lastSwipe.userId,
        lastSwipe.item.id
      );

      // Remove from undo stack
      setUndoStack((prev) => prev.slice(0, -1));

      logger.info('Swipe undone successfully', {
        itemId: lastSwipe.item.id,
        direction: lastSwipe.direction,
        sessionId: lastSwipe.sessionId,
      });

      return lastSwipe;
    } catch (error) {
      logger.error('Failed to undo swipe', {
        itemId: lastSwipe.item.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }, [undoStack]);

  /**
   * Clears the undo stack
   * Useful when changing trade anchor or starting new session
   */
  const clearUndoStack = useCallback(() => {
    setUndoStack([]);
  }, []);

  return {
    undoStack,
    canUndo: undoStack.length > 0,
    undoCount: undoStack.length,
    addSwipe,
    undo,
    clearUndoStack,
  };
}
