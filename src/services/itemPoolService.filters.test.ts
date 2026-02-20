import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildItemPool } from './itemPoolService';
import { Timestamp } from 'firebase/firestore';

// Mock Firebase
vi.mock('../firebase', () => ({
  db: {},
}));

// Mock location utils
vi.mock('../utils/location', () => ({
  calculateDistance: vi.fn((coords1, coords2) => {
    // Simple mock distance calculation
    const latDiff = Math.abs(coords1.latitude - coords2.latitude);
    const lonDiff = Math.abs(coords1.longitude - coords2.longitude);
    return Math.sqrt(latDiff * latDiff + lonDiff * lonDiff) * 111; // Rough km conversion
  }),
}));

// Mock retry utility
vi.mock('../utils/retryWithBackoff', () => ({
  retryWithBackoff: vi.fn((fn) => fn()),
}));

describe('itemPoolService - Filters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should filter by category', async () => {
    const mockItems = [
      { id: '1', category: 'Electronics', ownerId: 'user2', status: 'available', createdAt: Timestamp.now() },
      { id: '2', category: 'Furniture', ownerId: 'user3', status: 'available', createdAt: Timestamp.now() },
      { id: '3', category: 'Electronics', ownerId: 'user4', status: 'available', createdAt: Timestamp.now() },
    ];

    // Mock getDocs to return our test items
    const mockGetDocs = vi.fn().mockResolvedValue({
      docs: mockItems.map(item => ({
        id: item.id,
        data: () => item,
      })),
      empty: false,
    });

    vi.doMock('firebase/firestore', async () => {
      const actual = await vi.importActual('firebase/firestore');
      return {
        ...actual,
        getDocs: mockGetDocs,
        collection: vi.fn(),
        query: vi.fn(),
        where: vi.fn(),
        orderBy: vi.fn(),
        limit: vi.fn(),
      };
    });

    const filters = {
      categories: ['Electronics'],
      maxDistance: null,
      maxItemAge: null,
    };

    const result = await buildItemPool('user1', [], 20, undefined, filters);
    
    // Should only return Electronics items
    expect(result.every(item => item.category === 'Electronics')).toBe(true);
  });

  it('should filter by item age', async () => {
    const now = Date.now();
    const oldDate = new Date(now - 40 * 24 * 60 * 60 * 1000); // 40 days ago
    const recentDate = new Date(now - 10 * 24 * 60 * 60 * 1000); // 10 days ago

    const mockItems = [
      { id: '1', category: 'Electronics', ownerId: 'user2', status: 'available', createdAt: Timestamp.fromDate(oldDate) },
      { id: '2', category: 'Furniture', ownerId: 'user3', status: 'available', createdAt: Timestamp.fromDate(recentDate) },
    ];

    const mockGetDocs = vi.fn().mockResolvedValue({
      docs: mockItems.map(item => ({
        id: item.id,
        data: () => item,
      })),
      empty: false,
    });

    vi.doMock('firebase/firestore', async () => {
      const actual = await vi.importActual('firebase/firestore');
      return {
        ...actual,
        getDocs: mockGetDocs,
        collection: vi.fn(),
        query: vi.fn(),
        where: vi.fn(),
        orderBy: vi.fn(),
        limit: vi.fn(),
      };
    });

    const filters = {
      categories: [],
      maxDistance: null,
      maxItemAge: 30, // Only items from last 30 days
    };

    const result = await buildItemPool('user1', [], 20, undefined, filters);
    
    // Should only return recent items
    expect(result.length).toBeLessThanOrEqual(1);
  });
});
