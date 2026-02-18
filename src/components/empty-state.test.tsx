import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { MultiCardSwipeInterface } from './MultiCardSwipeInterface';
import { Item } from '../types/item';
import { UserProfile } from '../types/user';
import { Timestamp } from 'firebase/firestore';
import { AuthProvider } from '../contexts/AuthContext';
import { ProfileProvider } from '../contexts/ProfileContext';

/**
 * Empty State Tests - Task 15
 * Requirements: 8.1, 8.2, 8.3
 * 
 * Tests verify:
 * - Empty state displays when item pool is exhausted
 * - "Change Trade Anchor" button is present in empty state
 * - Explanatory message explains why no items are available
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

describe('Empty State Handling - Task 15', () => {
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

  describe('Requirement 8.1: Display empty state when pool exhausted', () => {
    it('displays empty state message when item pool is empty', () => {
      render(
        <TestWrapper>
          <MultiCardSwipeInterface
            tradeAnchor={mockTradeAnchor}
            itemPool={[]} // Empty pool
            ownerProfiles={new Map()}
            onSwipe={vi.fn()}
            onChangeAnchor={vi.fn()}
            loading={false}
            syncStatus={null}
          />
        </TestWrapper>
      );

      // Check for empty state heading
      expect(screen.getByText('No Matches Found')).toBeInTheDocument();
    });

    it('does not display empty state when items are available', () => {
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

      render(
        <TestWrapper>
          <MultiCardSwipeInterface
            tradeAnchor={mockTradeAnchor}
            itemPool={[mockItem]}
            ownerProfiles={new Map([[mockOwnerProfile.uid, mockOwnerProfile]])}
            onSwipe={vi.fn()}
            onChangeAnchor={vi.fn()}
            loading={false}
            syncStatus={null}
          />
        </TestWrapper>
      );

      // Empty state should not be present
      expect(screen.queryByText('No Matches Found')).not.toBeInTheDocument();
      
      // Card should be displayed instead
      expect(screen.getByText('Test Item')).toBeInTheDocument();
    });

    it('does not display empty state during initial loading', () => {
      render(
        <TestWrapper>
          <MultiCardSwipeInterface
            tradeAnchor={mockTradeAnchor}
            itemPool={[]}
            ownerProfiles={new Map()}
            onSwipe={vi.fn()}
            onChangeAnchor={vi.fn()}
            loading={true} // Still loading
            syncStatus={null}
          />
        </TestWrapper>
      );

      // Empty state should not be shown while loading
      expect(screen.queryByText('No Matches Found')).not.toBeInTheDocument();
      
      // Loading indicators should be present instead
      const loadingElements = document.querySelectorAll('.animate-pulse');
      expect(loadingElements.length).toBeGreaterThan(0);
    });
  });

  describe('Requirement 8.2: Provide option to change trade anchor', () => {
    it('displays "Change Trade Anchor" button in empty state', () => {
      render(
        <TestWrapper>
          <MultiCardSwipeInterface
            tradeAnchor={mockTradeAnchor}
            itemPool={[]}
            ownerProfiles={new Map()}
            onSwipe={vi.fn()}
            onChangeAnchor={vi.fn()}
            loading={false}
            syncStatus={null}
          />
        </TestWrapper>
      );

      // Check for the button - use getAllByRole since there are two buttons
      const changeButtons = screen.getAllByRole('button', { name: /change trade anchor/i });
      expect(changeButtons.length).toBeGreaterThanOrEqual(1);
      
      // The empty state button should have specific text content
      const emptyStateButton = screen.getByText('Change Trade Anchor');
      expect(emptyStateButton).toBeInTheDocument();
    });

    it('calls onChangeAnchor when button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnChangeAnchor = vi.fn();

      render(
        <TestWrapper>
          <MultiCardSwipeInterface
            tradeAnchor={mockTradeAnchor}
            itemPool={[]}
            ownerProfiles={new Map()}
            onSwipe={vi.fn()}
            onChangeAnchor={mockOnChangeAnchor}
            loading={false}
            syncStatus={null}
          />
        </TestWrapper>
      );

      // Click the empty state button specifically (has text content)
      const changeButton = screen.getByText('Change Trade Anchor');
      await user.click(changeButton);

      expect(mockOnChangeAnchor).toHaveBeenCalledTimes(1);
    });

    it('button is accessible and properly labeled', () => {
      render(
        <TestWrapper>
          <MultiCardSwipeInterface
            tradeAnchor={mockTradeAnchor}
            itemPool={[]}
            ownerProfiles={new Map()}
            onSwipe={vi.fn()}
            onChangeAnchor={vi.fn()}
            loading={false}
            syncStatus={null}
          />
        </TestWrapper>
      );

      const changeButton = screen.getByText('Change Trade Anchor');
      
      // Button should be visible and enabled
      expect(changeButton).toBeVisible();
      expect(changeButton).toBeEnabled();
    });
  });

  describe('Requirement 8.3: Explain why no items are available', () => {
    it('displays explanatory message in empty state', () => {
      render(
        <TestWrapper>
          <MultiCardSwipeInterface
            tradeAnchor={mockTradeAnchor}
            itemPool={[]}
            ownerProfiles={new Map()}
            onSwipe={vi.fn()}
            onChangeAnchor={vi.fn()}
            loading={false}
            syncStatus={null}
          />
        </TestWrapper>
      );

      // Check for explanatory text
      const explanation = screen.getByText(/there are no available items to trade right now/i);
      expect(explanation).toBeInTheDocument();
      
      // Check that it mentions checking back later or changing anchor
      expect(explanation.textContent).toMatch(/check back later|changing your trade anchor/i);
    });

    it('empty state includes helpful icon', () => {
      const { container } = render(
        <TestWrapper>
          <MultiCardSwipeInterface
            tradeAnchor={mockTradeAnchor}
            itemPool={[]}
            ownerProfiles={new Map()}
            onSwipe={vi.fn()}
            onChangeAnchor={vi.fn()}
            loading={false}
            syncStatus={null}
          />
        </TestWrapper>
      );

      // Check for SVG icon (should have aria-hidden="true")
      const icon = container.querySelector('svg[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
    });

    it('empty state message is clear and user-friendly', () => {
      render(
        <TestWrapper>
          <MultiCardSwipeInterface
            tradeAnchor={mockTradeAnchor}
            itemPool={[]}
            ownerProfiles={new Map()}
            onSwipe={vi.fn()}
            onChangeAnchor={vi.fn()}
            loading={false}
            syncStatus={null}
          />
        </TestWrapper>
      );

      // Verify the heading is clear
      expect(screen.getByText('No Matches Found')).toBeInTheDocument();
      
      // Verify the message provides context
      const message = screen.getByText(/there are no available items/i);
      expect(message).toBeInTheDocument();
      
      // Verify it suggests actions - check for the paragraph text specifically
      expect(message.textContent).toMatch(/check back later/i);
      expect(message.textContent).toMatch(/changing your trade anchor/i);
    });
  });

  describe('Empty state layout and styling', () => {
    it('displays trade anchor in empty state', () => {
      render(
        <TestWrapper>
          <MultiCardSwipeInterface
            tradeAnchor={mockTradeAnchor}
            itemPool={[]}
            ownerProfiles={new Map()}
            onSwipe={vi.fn()}
            onChangeAnchor={vi.fn()}
            loading={false}
            syncStatus={null}
          />
        </TestWrapper>
      );

      // Trade anchor should still be visible
      expect(screen.getByText('Trade Anchor')).toBeInTheDocument();
    });

    it('empty state is centered and properly styled', () => {
      const { container } = render(
        <TestWrapper>
          <MultiCardSwipeInterface
            tradeAnchor={mockTradeAnchor}
            itemPool={[]}
            ownerProfiles={new Map()}
            onSwipe={vi.fn()}
            onChangeAnchor={vi.fn()}
            loading={false}
            syncStatus={null}
          />
        </TestWrapper>
      );

      // Check for centered layout classes
      const emptyStateContainer = container.querySelector('.text-center');
      expect(emptyStateContainer).toBeInTheDocument();
    });
  });
});
