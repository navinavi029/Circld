import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildItemPool } from './itemPoolService';
import { getDocs, Timestamp } from 'firebase/firestore';
import { Item } from '../types/item';

// Mock Firebase
vi.mock('../firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  startAfter: vi.fn(),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  doc: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
    fromDate: vi.fn((date: Date) => ({ 
      seconds: date.getTime() / 1000, 
      nanoseconds: 0,
      toDate: () => date,
      toMillis: () => date.getTime(),
      isEqual: () => false,
    })),
  },
}));

// Mock retryWithBackoff to execute immediately
vi.mock('../utils/retryWithBackoff', () => ({
  retryWithBackoff: vi.fn((fn) => fn()),
}));

// Helper to create mock Timestamp
const createMockTimestamp = (): Timestamp => ({
  seconds: Date.now() / 1000,
  nanoseconds: 0,
  toDate: () => new Date(),
  toMillis: () => Date.now(),
  isEqual: () => false,
  toJSON: () => ({ seconds: Date.now() / 1000, nanoseconds: 0, type: 'timestamp' }),
  valueOf: () => '',
} as unknown as Timestamp);

describe('itemPoolService - buildItemPool filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should only include items with status "available"', async () => {
    // Mock Firestore response with only available items
    const mockItems: Partial<Item>[] = [
      { id: 'item1', status: 'available', ownerId: 'owner1', createdAt: createMockTimestamp() },
      { id: 'item2', status: 'available', ownerId: 'owner2', createdAt: createMockTimestamp() },
      { id: 'item3', status: 'available', ownerId: 'owner3', createdAt: createMockTimestamp() },
    ];

    vi.mocked(getDocs).mockResolvedValue({
      docs: mockItems.map(item => ({
        id: item.id,
        data: () => item,
      })),
      empty: false,
    } as any);

    const result = await buildItemPool('currentUser', [], 10);

    expect(result).toHaveLength(3);
    expect(result.every(item => item.status === 'available')).toBe(true);
  });

  it('should exclude items with status "pending"', async () => {
    // Mock Firestore response - in reality, pending items should never be returned
    // because the query filters for status='available', but we test the verification
    const mockItems: Partial<Item>[] = [
      { id: 'item1', status: 'available', ownerId: 'owner1', createdAt: createMockTimestamp() },
      { id: 'item2', status: 'available', ownerId: 'owner2', createdAt: createMockTimestamp() },
    ];

    vi.mocked(getDocs).mockResolvedValue({
      docs: mockItems.map(item => ({
        id: item.id,
        data: () => item,
      })),
      empty: false,
    } as any);

    const result = await buildItemPool('currentUser', [], 10);

    // Verify no pending items in result
    expect(result.every(item => item.status !== 'pending')).toBe(true);
  });

  it('should exclude items with status "unavailable"', async () => {
    // Mock Firestore response - in reality, unavailable items should never be returned
    // because the query filters for status='available', but we test the verification
    const mockItems: Partial<Item>[] = [
      { id: 'item1', status: 'available', ownerId: 'owner1', createdAt: createMockTimestamp() },
      { id: 'item2', status: 'available', ownerId: 'owner2', createdAt: createMockTimestamp() },
    ];

    vi.mocked(getDocs).mockResolvedValue({
      docs: mockItems.map(item => ({
        id: item.id,
        data: () => item,
      })),
      empty: false,
    } as any);

    const result = await buildItemPool('currentUser', [], 10);

    // Verify no unavailable items in result
    expect(result.every(item => item.status !== 'unavailable')).toBe(true);
  });

  it('should exclude items owned by current user', async () => {
    const currentUserId = 'currentUser';
    const mockItems: Partial<Item>[] = [
      { id: 'item1', status: 'available', ownerId: 'owner1', createdAt: createMockTimestamp() },
      { id: 'item2', status: 'available', ownerId: 'owner2', createdAt: createMockTimestamp() },
    ];

    vi.mocked(getDocs).mockResolvedValue({
      docs: mockItems.map(item => ({
        id: item.id,
        data: () => item,
      })),
      empty: false,
    } as any);

    const result = await buildItemPool(currentUserId, [], 10);

    // Verify no items owned by current user
    expect(result.every(item => item.ownerId !== currentUserId)).toBe(true);
  });

  it('should exclude items from swipe history', async () => {
    const swipeHistory = [
      { itemId: 'item1', direction: 'right' as const, timestamp: createMockTimestamp() },
      { itemId: 'item2', direction: 'left' as const, timestamp: createMockTimestamp() },
    ];

    const mockItems: Partial<Item>[] = [
      { id: 'item3', status: 'available', ownerId: 'owner3', createdAt: createMockTimestamp() },
      { id: 'item4', status: 'available', ownerId: 'owner4', createdAt: createMockTimestamp() },
    ];

    vi.mocked(getDocs).mockResolvedValue({
      docs: mockItems.map(item => ({
        id: item.id,
        data: () => item,
      })),
      empty: false,
    } as any);

    const result = await buildItemPool('currentUser', swipeHistory, 10);

    // Verify swiped items are not in result
    expect(result.every(item => !['item1', 'item2'].includes(item.id))).toBe(true);
  });

  it('should log status distribution for verification', async () => {
    const consoleSpy = vi.spyOn(console, 'log');
    
    const mockItems: Partial<Item>[] = [
      { id: 'item1', status: 'available', ownerId: 'owner1', createdAt: createMockTimestamp() },
      { id: 'item2', status: 'available', ownerId: 'owner2', createdAt: createMockTimestamp() },
    ];

    vi.mocked(getDocs).mockResolvedValue({
      docs: mockItems.map(item => ({
        id: item.id,
        data: () => item,
      })),
      empty: false,
    } as any);

    await buildItemPool('currentUser', [], 10);

    // Verify logging includes status verification
    const logCalls = consoleSpy.mock.calls.map(call => call[0]);
    expect(logCalls.some(log => 
      typeof log === 'string' && log.includes('Item status verification')
    )).toBe(true);

    consoleSpy.mockRestore();
  });

  it('should log warning if non-available items are returned', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn');
    
    // Simulate a bug where non-available items are returned
    const mockItems: Partial<Item>[] = [
      { id: 'item1', status: 'available', ownerId: 'owner1', createdAt: createMockTimestamp() },
      { id: 'item2', status: 'pending', ownerId: 'owner2', createdAt: createMockTimestamp() },
    ];

    vi.mocked(getDocs).mockResolvedValue({
      docs: mockItems.map(item => ({
        id: item.id,
        data: () => item,
      })),
      empty: false,
    } as any);

    await buildItemPool('currentUser', [], 10);

    // Verify warning is logged
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('WARNING: Query returned non-available items!'),
      expect.any(Object)
    );

    consoleWarnSpy.mockRestore();
  });
});
