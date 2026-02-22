import { describe, it, expect, vi, beforeEach } from 'vitest';
import { acceptTradeOffer } from './tradeOfferService';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';

// Mock Firebase
vi.mock('../firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({ id: 'mock-doc-ref' })),
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
  serverTimestamp: vi.fn(() => 'server-timestamp'),
  Timestamp: {
    now: vi.fn(() => ({ seconds: 1234567890, nanoseconds: 0 })),
  },
}));

// Mock retry utility
vi.mock('../utils/retryWithBackoff', () => ({
  retryWithBackoff: vi.fn((fn) => fn()),
}));

describe('acceptTradeOffer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should accept a trade offer when user is the target item owner', async () => {
    const offerId = 'offer-123';
    const userId = 'user-target';
    const mockOfferData = {
      id: offerId,
      tradeAnchorId: 'item-1',
      tradeAnchorOwnerId: 'user-offering',
      targetItemId: 'item-2',
      targetItemOwnerId: userId,
      offeringUserId: 'user-offering',
      status: 'pending',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => mockOfferData,
    } as any);

    const result = await acceptTradeOffer(offerId, userId);

    expect(getDoc).toHaveBeenCalled();
    expect(updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      {
        status: 'accepted',
        updatedAt: 'server-timestamp',
      }
    );
    expect(result.status).toBe('accepted');
    expect(result.id).toBe(offerId);
  });

  it('should throw error when trade offer not found', async () => {
    const offerId = 'nonexistent-offer';
    const userId = 'user-123';

    vi.mocked(getDoc).mockResolvedValue({
      exists: () => false,
    } as any);

    await expect(acceptTradeOffer(offerId, userId)).rejects.toThrow(
      'Trade offer not found'
    );
  });

  it('should throw error when user is not the target item owner', async () => {
    const offerId = 'offer-123';
    const userId = 'wrong-user';
    const mockOfferData = {
      id: offerId,
      tradeAnchorId: 'item-1',
      tradeAnchorOwnerId: 'user-offering',
      targetItemId: 'item-2',
      targetItemOwnerId: 'correct-user',
      offeringUserId: 'user-offering',
      status: 'pending',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => mockOfferData,
    } as any);

    await expect(acceptTradeOffer(offerId, userId)).rejects.toThrow(
      'Only the target item owner can accept this trade offer'
    );
  });

  it('should throw error when offerId or userId is missing', async () => {
    await expect(acceptTradeOffer('', 'user-123')).rejects.toThrow(
      'Invalid input: Offer ID and User ID are required'
    );

    await expect(acceptTradeOffer('offer-123', '')).rejects.toThrow(
      'Invalid input: Offer ID and User ID are required'
    );
  });
});
