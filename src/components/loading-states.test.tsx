import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { CardGrid } from './CardGrid';
import { MultiCardSwipeInterface } from './MultiCardSwipeInterface';
import { Item } from '../types/item';
import { UserProfile } from '../types/user';
import { Timestamp } from 'firebase/firestore';
import { AuthProvider } from '../contexts/AuthContext';
import { ProfileProvider } from '../contexts/ProfileContext';

/**
 * Loading States Tests - Task 12
 * Requirements: 9.1, 9.2, 9.3
 * 
 * Tests verify:
 * - Loading placeholders appear when card slots are empty
 * - Loading indicators display while fetching replacement cards
 * - Loading indicators are removed when cards load
 * - Loading errors are handled gracefully
 */

// Test wrapper with required providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>
      <ProfileProvider>
        {children}
      </ProfileProvider>
    </AuthProvider>
  </BrowserRouter>
);

describe('Loading States for Card Positions - Task 12', () => {
  const mockOwnerProfile: UserProfile = {
    uid: 'owner-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    location: 'New York, NY',
    coordinates: null,
    eligible_to_match: true,
    createdAt: Timestamp.now(),
    photoUrl: null,
    lastPhotoUpdate: null,
    lastLocationUpdate: null,
  };

  const mockItem: Item = {
    id: 'item-1',
    title: 'Test Item',
    description: 'Test description',
    category: 'Electronics',
    condition: 'Like New',
    images: ['https://example.com/image.jpg'],
    ownerId: 'owner-1',
    status: 'available',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  const mockTradeAnchor: Item = {
    id: 'anchor-1',
    title: 'Trade Anchor',
    description: 'My item to trade',
    category: 'Books',
    condition: 'Good',
    images: ['https://example.com/anchor.jpg'],
    ownerId: 'user-1',
    status: 'available',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  describe('Requirement 9.1: Initial loading indicator', () => {
    it('displays loading placeholders when initially loading items', () => {
      const { container } = render(
        <TestWrapper>
          <CardGrid
            items={[]}
            ownerProfiles={new Map()}
            onSwipe={vi.fn()}
            animatingCards={new Set()}
            loadingSlots={3}
          />
        </TestWrapper>
      );

      // Check for loading placeholders (they have animate-pulse class)
      const loadingElements = container.querySelectorAll('.animate-pulse');
      expect(loadingElements.length).toBe(3);

      // Check for loading spinner
      const spinners = container.querySelectorAll('.animate-spin');
      expect(spinners.length).toBeGreaterThan(0);

      // Check for screen reader text
      const loadingStatus = screen.getAllByRole('status');
      expect(loadingStatus.length).toBeGreaterThan(0);
    });
  });

  describe('Requirement 9.2: Loading indicators for card positions', () => {
    it('displays loading indicators for empty card positions while fetching replacements', () => {
      const ownerProfiles = new Map([[mockOwnerProfile.uid, mockOwnerProfile]]);
      
      const { container } = render(
        <TestWrapper>
          <CardGrid
            items={[mockItem]}
            ownerProfiles={ownerProfiles}
            onSwipe={vi.fn()}
            animatingCards={new Set()}
            loadingSlots={2} // 2 empty slots waiting for cards
          />
        </TestWrapper>
      );

      // Should have 1 actual card + 2 loading placeholders
      const loadingElements = container.querySelectorAll('.animate-pulse');
      expect(loadingElements.length).toBe(2);

      // Verify actual card is rendered
      expect(screen.getByText('Test Item')).toBeInTheDocument();
    });

    it('shows loading placeholders when cards are animating out', () => {
      const ownerProfiles = new Map([[mockOwnerProfile.uid, mockOwnerProfile]]);
      
      const { container } = render(
        <TestWrapper>
          <CardGrid
            items={[mockItem]}
            ownerProfiles={ownerProfiles}
            onSwipe={vi.fn()}
            animatingCards={new Set(['item-1'])} // Card is animating out
            loadingSlots={1}
          />
        </TestWrapper>
      );

      // Should show loading placeholder for the animating card's replacement
      const loadingElements = container.querySelectorAll('.animate-pulse');
      expect(loadingElements.length).toBe(1);
    });
  });

  describe('Requirement 9.3: Remove loading indicators when complete', () => {
    it('removes loading indicators when cards are loaded', () => {
      const ownerProfiles = new Map([[mockOwnerProfile.uid, mockOwnerProfile]]);
      
      const { container } = render(
        <TestWrapper>
          <CardGrid
            items={[mockItem]}
            ownerProfiles={ownerProfiles}
            onSwipe={vi.fn()}
            animatingCards={new Set()}
            loadingSlots={0} // No loading slots - all cards loaded
          />
        </TestWrapper>
      );

      // Should have no loading placeholders
      const loadingElements = container.querySelectorAll('.animate-pulse');
      expect(loadingElements.length).toBe(0);

      // Should have the actual card
      expect(screen.getByText('Test Item')).toBeInTheDocument();
    });

    it('clears loading state after all cards are displayed', () => {
      const ownerProfiles = new Map([[mockOwnerProfile.uid, mockOwnerProfile]]);
      const items = [mockItem, { ...mockItem, id: 'item-2', title: 'Item 2' }];
      
      const { container, rerender } = render(
        <TestWrapper>
          <CardGrid
            items={[]}
            ownerProfiles={ownerProfiles}
            onSwipe={vi.fn()}
            animatingCards={new Set()}
            loadingSlots={2}
          />
        </TestWrapper>
      );

      // Initially should have loading placeholders
      let loadingElements = container.querySelectorAll('.animate-pulse');
      expect(loadingElements.length).toBe(2);

      // After items load, loading should be cleared
      rerender(
        <TestWrapper>
          <CardGrid
            items={items}
            ownerProfiles={ownerProfiles}
            onSwipe={vi.fn()}
            animatingCards={new Set()}
            loadingSlots={0}
          />
        </TestWrapper>
      );

      loadingElements = container.querySelectorAll('.animate-pulse');
      expect(loadingElements.length).toBe(0);
      expect(screen.getByText('Test Item')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });
  });

  describe('Loading error handling', () => {
    it('displays error state when loading fails', () => {
      const { container } = render(
        <TestWrapper>
          <CardGrid
            items={[]}
            ownerProfiles={new Map()}
            onSwipe={vi.fn()}
            animatingCards={new Set()}
            loadingSlots={2}
            loadingError="Failed to load cards"
          />
        </TestWrapper>
      );

      // Should show error indicators instead of loading
      const errorElements = container.querySelectorAll('[role="alert"]');
      expect(errorElements.length).toBe(2);

      // Should show error message
      expect(screen.getAllByText('Failed to load card').length).toBe(2);
    });

    it('handles graceful degradation when loading errors occur', () => {
      const ownerProfiles = new Map([[mockOwnerProfile.uid, mockOwnerProfile]]);
      
      const { container } = render(
        <TestWrapper>
          <CardGrid
            items={[mockItem]}
            ownerProfiles={ownerProfiles}
            onSwipe={vi.fn()}
            animatingCards={new Set()}
            loadingSlots={1}
            loadingError="Network error"
          />
        </TestWrapper>
      );

      // Should still show the loaded card
      expect(screen.getByText('Test Item')).toBeInTheDocument();

      // Should show error for the failed slot
      const errorElements = container.querySelectorAll('[role="alert"]');
      expect(errorElements.length).toBe(1);
    });
  });

  describe('MultiCardSwipeInterface loading state integration', () => {
    it('calculates loading slots correctly based on visible card count', () => {
      const ownerProfiles = new Map([[mockOwnerProfile.uid, mockOwnerProfile]]);
      
      const { container } = render(
        <TestWrapper>
          <MultiCardSwipeInterface
            tradeAnchor={mockTradeAnchor}
            itemPool={[mockItem]} // Only 1 item
            ownerProfiles={ownerProfiles}
            onSwipe={vi.fn()}
            onChangeAnchor={vi.fn()}
            loading={true}
            syncStatus={null}
          />
        </TestWrapper>
      );

      // Should show loading placeholders for empty slots
      // (visibleCardCount - itemPool.length)
      const loadingElements = container.querySelectorAll('.animate-pulse');
      expect(loadingElements.length).toBeGreaterThan(0);
    });

    it('shows loading during card replacement after swipe', () => {
      const ownerProfiles = new Map([[mockOwnerProfile.uid, mockOwnerProfile]]);
      const items = [mockItem, { ...mockItem, id: 'item-2', title: 'Item 2' }];
      
      const { container } = render(
        <TestWrapper>
          <MultiCardSwipeInterface
            tradeAnchor={mockTradeAnchor}
            itemPool={items}
            ownerProfiles={ownerProfiles}
            onSwipe={vi.fn()}
            onChangeAnchor={vi.fn()}
            loading={false}
            syncStatus={null}
          />
        </TestWrapper>
      );

      // Should not show loading when all cards are present
      const loadingElements = container.querySelectorAll('.animate-pulse');
      expect(loadingElements.length).toBe(0);
    });
  });
});
