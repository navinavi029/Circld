import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, waitFor, act } from '@testing-library/react';
import { SwipeInterface } from './SwipeInterface';
import { renderWithProviders, mockOwnerProfile } from '../test/test-utils';
import { Item } from '../types/item';
import { BrowserRouter } from 'react-router-dom';
import { Timestamp } from 'firebase/firestore';

// Mock navigate function
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock trade anchor item
const mockTradeAnchor: Item = {
  id: 'trade-anchor-id',
  title: 'My Trade Item',
  description: 'Item I want to trade',
  category: 'electronics',
  condition: 'like-new',
  images: ['https://example.com/anchor.jpg'],
  ownerId: 'test-user-id',
  status: 'available',
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
};

// Mock current item
const mockCurrentItem: Item = {
  id: 'current-item-id',
  title: 'Available Item',
  description: 'Item available for trade',
  category: 'furniture',
  condition: 'good',
  images: ['https://example.com/item.jpg'],
  ownerId: 'owner-user-id',
  status: 'available',
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
};

describe('SwipeInterface', () => {
  let mockOnSwipe: ReturnType<typeof vi.fn<(direction: 'left' | 'right') => void>>;
  let mockOnChangeAnchor: ReturnType<typeof vi.fn<() => void>>;

  beforeEach(() => {
    mockOnSwipe = vi.fn<(direction: 'left' | 'right') => void>();
    mockOnChangeAnchor = vi.fn<() => void>();
    mockNavigate.mockClear();
    vi.clearAllMocks();
  });

  const renderSwipeInterface = (props = {}) => {
    return renderWithProviders(
      <BrowserRouter>
        <SwipeInterface
          tradeAnchor={mockTradeAnchor}
          currentItem={mockCurrentItem}
          ownerProfile={mockOwnerProfile}
          onSwipe={mockOnSwipe}
          onChangeAnchor={mockOnChangeAnchor}
          hasMoreItems={true}
          loading={false}
          {...props}
        />
      </BrowserRouter>
    );
  };

  describe('Button Interactions', () => {
    it('should call onSwipe with left when pass button is clicked', async () => {
      const { getByLabelText } = renderSwipeInterface();

      const passButton = getByLabelText('Pass on this item');
      fireEvent.click(passButton);

      await waitFor(() => {
        expect(mockOnSwipe).toHaveBeenCalledWith('left');
      }, { timeout: 500 });
    });

    it('should handle animation state with fake timers', async () => {
      vi.useFakeTimers();
      
      const { getByLabelText } = renderSwipeInterface();
      const passButton = getByLabelText('Pass on this item');
      const likeButton = getByLabelText('Like this item');
      
      // Buttons should be enabled initially
      expect(passButton).not.toBeDisabled();
      expect(likeButton).not.toBeDisabled();
      
      // Click the button to start animation
      fireEvent.click(passButton);
      
      // Buttons should be disabled during animation
      expect(passButton).toBeDisabled();
      expect(likeButton).toBeDisabled();
      
      // onSwipe should not be called immediately
      expect(mockOnSwipe).not.toHaveBeenCalled();
      
      // Advance timers by 450ms (animation duration) and wait for state updates
      await act(async () => {
        await vi.advanceTimersByTimeAsync(450);
      });
      
      // Now onSwipe should have been called
      expect(mockOnSwipe).toHaveBeenCalledWith('left');
      
      // Buttons should be re-enabled after animation
      expect(passButton).not.toBeDisabled();
      expect(likeButton).not.toBeDisabled();
      
      vi.useRealTimers();
    });

    it('should call onSwipe with right when like button is clicked', async () => {
      const { getByLabelText } = renderSwipeInterface();

      const likeButton = getByLabelText('Like this item');
      fireEvent.click(likeButton);

      await waitFor(() => {
        expect(mockOnSwipe).toHaveBeenCalledWith('right');
      }, { timeout: 500 });
    });

    it('should forward swipe events from SwipeCard to onSwipe callback', async () => {
      const { container } = renderSwipeInterface();

      // Find the SwipeCard element
      const card = container.querySelector('[role="button"]');
      expect(card).toBeInTheDocument();

      if (card) {
        // Simulate keyboard swipe on the card
        fireEvent.keyDown(card, { key: 'ArrowLeft' });
      }

      await waitFor(() => {
        expect(mockOnSwipe).toHaveBeenCalledWith('left');
      }, { timeout: 500 });
    });

    it('should verify callbacks are called after animation delay', async () => {
      const { getByLabelText } = renderSwipeInterface();

      const likeButton = getByLabelText('Like this item');
      const startTime = Date.now();
      
      fireEvent.click(likeButton);

      await waitFor(() => {
        expect(mockOnSwipe).toHaveBeenCalledWith('right');
        const elapsed = Date.now() - startTime;
        // Verify the callback was delayed by approximately 450ms
        expect(elapsed).toBeGreaterThanOrEqual(400);
      }, { timeout: 500 });
    });
  });

  describe('Empty State', () => {
    it('should show "No Matches Found" when no items available', () => {
      const { getByText } = renderSwipeInterface({
        currentItem: null,
        hasMoreItems: false,
      });

      expect(getByText('No Matches Found')).toBeInTheDocument();
      expect(getByText(/There are no available items to trade right now/i)).toBeInTheDocument();
    });

    it('should show change anchor button in empty state', () => {
      const { getByText } = renderSwipeInterface({
        currentItem: null,
        hasMoreItems: false,
      });

      const changeButton = getByText('Change Trade Anchor');
      expect(changeButton).toBeInTheDocument();
      
      fireEvent.click(changeButton);
      expect(mockOnChangeAnchor).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when loading is true', () => {
      const { getByText } = renderSwipeInterface({
        loading: true,
      });

      expect(getByText('Loading items...')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should navigate to listings when return button is clicked', () => {
      const { getByLabelText } = renderSwipeInterface();

      const returnButton = getByLabelText('Return to listings');
      fireEvent.click(returnButton);

      expect(mockNavigate).toHaveBeenCalledWith('/listings');
    });
  });

  describe('Tips Panel', () => {
    it('should toggle tips panel when tips button is clicked', () => {
      const { getByLabelText, getByText, queryByText } = renderSwipeInterface();

      const tipsButton = getByLabelText('Show tips');
      
      // Tips should not be visible initially
      expect(queryByText('Swipe Tips')).not.toBeInTheDocument();

      // Click to show tips
      fireEvent.click(tipsButton);
      expect(getByText('Swipe Tips')).toBeInTheDocument();

      // Click close button to hide tips
      const closeButton = getByLabelText('Close tips');
      fireEvent.click(closeButton);
      expect(queryByText('Swipe Tips')).not.toBeInTheDocument();
    });
  });
});
