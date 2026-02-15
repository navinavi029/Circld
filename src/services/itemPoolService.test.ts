import { describe, it, expect, beforeEach, vi } from 'vitest';
import { buildItemPool, getLastDocument } from './itemPoolService';
import { Timestamp } from 'firebase/firestore';
import { SwipeRecord } from '../types/swipe-trading';

// Mock retry utility to avoid delays in tests
vi.mock('../utils/retryWithBackoff', () => ({
  retryWithBackoff: vi.fn((fn) => fn()),
}));

// Mock Firebase
vi.mock('../firebase', () => ({
  db: {},
}));

// Mock Firestore functions
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    startAfter: vi.fn(),
    getDocs: vi.fn(),
  };
});

describe('itemPoolService', () => {
  describe('buildItemPool', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should filter items by status="available"', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      const mockItems = [
        {
          id: 'item1',
          ownerId: 'user2',
          status: 'available',
          createdAt: Timestamp.now(),
        },
        {
          id: 'item2',
          ownerId: 'user3',
          status: 'available',
          createdAt: Timestamp.now(),
        },
      ];

      (getDocs as any).mockResolvedValue({
        docs: mockItems.map(item => ({
          id: item.id,
          data: () => item,
        })),
      });

      const result = await buildItemPool('user1', [], 20);
      
      expect(result).toHaveLength(2);
      expect(result.every(item => item.status === 'available')).toBe(true);
    });

    it('should exclude items owned by current user', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      const mockItems = [
        {
          id: 'item1',
          ownerId: 'user2',
          status: 'available',
          createdAt: Timestamp.now(),
        },
      ];

      (getDocs as any).mockResolvedValue({
        docs: mockItems.map(item => ({
          id: item.id,
          data: () => item,
        })),
      });

      const result = await buildItemPool('user1', [], 20);
      
      expect(result.every(item => item.ownerId !== 'user1')).toBe(true);
    });

    it('should exclude items in swipe history', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      const mockItems = [
        {
          id: 'item1',
          ownerId: 'user2',
          status: 'available',
          createdAt: Timestamp.now(),
        },
        {
          id: 'item2',
          ownerId: 'user3',
          status: 'available',
          createdAt: Timestamp.now(),
        },
        {
          id: 'item3',
          ownerId: 'user4',
          status: 'available',
          createdAt: Timestamp.now(),
        },
      ];

      (getDocs as any).mockResolvedValue({
        docs: mockItems.map(item => ({
          id: item.id,
          data: () => item,
        })),
      });

      const swipeHistory: SwipeRecord[] = [
        {
          itemId: 'item1',
          direction: 'left',
          timestamp: Timestamp.now(),
        },
        {
          itemId: 'item3',
          direction: 'right',
          timestamp: Timestamp.now(),
        },
      ];

      const result = await buildItemPool('user1', swipeHistory, 20);
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('item2');
      expect(result.every(item => !['item1', 'item3'].includes(item.id))).toBe(true);
    });

    it('should respect the limit parameter', async () => {
      const { getDocs, limit: firestoreLimit } = await import('firebase/firestore');
      
      const mockItems = Array.from({ length: 5 }, (_, i) => ({
        id: `item${i + 1}`,
        ownerId: `user${i + 2}`,
        status: 'available',
        createdAt: Timestamp.now(),
      }));

      (getDocs as any).mockResolvedValue({
        docs: mockItems.slice(0, 3).map(item => ({
          id: item.id,
          data: () => item,
        })),
      });

      await buildItemPool('user1', [], 3);
      
      expect(firestoreLimit).toHaveBeenCalledWith(3);
    });

    it('should return empty array when no items match criteria', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      (getDocs as any).mockResolvedValue({
        docs: [],
      });

      const result = await buildItemPool('user1', [], 20);
      
      expect(result).toEqual([]);
    });

    it('should handle pagination with lastDoc parameter', async () => {
      const { getDocs, startAfter } = await import('firebase/firestore');
      
      const mockLastDoc = { id: 'lastItem' } as any;
      const mockItems = [
        {
          id: 'item1',
          ownerId: 'user2',
          status: 'available',
          createdAt: Timestamp.now(),
        },
      ];

      (getDocs as any).mockResolvedValue({
        docs: mockItems.map(item => ({
          id: item.id,
          data: () => item,
        })),
      });

      await buildItemPool('user1', [], 20, mockLastDoc);
      
      expect(startAfter).toHaveBeenCalledWith(mockLastDoc);
    });
  });

  describe('getLastDocument', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should return the last document from query results', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      const mockDocs = [
        { id: 'item1', data: () => ({ id: 'item1' }) },
        { id: 'item2', data: () => ({ id: 'item2' }) },
        { id: 'item3', data: () => ({ id: 'item3' }) },
      ];

      (getDocs as any).mockResolvedValue({
        docs: mockDocs,
        empty: false,
      });

      const result = await getLastDocument('user1', 20);
      
      expect(result).toBe(mockDocs[2]);
    });

    it('should return undefined when query is empty', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      (getDocs as any).mockResolvedValue({
        docs: [],
        empty: true,
      });

      const result = await getLastDocument('user1', 20);
      
      expect(result).toBeUndefined();
    });
  });
});
