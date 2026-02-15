import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SwipeInterface } from './SwipeInterface';
import { Item } from '../types/item';
import { UserProfile } from '../types/user';
import { Timestamp } from 'firebase/firestore';

// Mock child components
vi.mock('./SwipeCard', () => ({
  SwipeCard: ({ onSwipeLeft, onSwipeRight }: any) => (
    <div data-testid="swipe-card">
      <button onClick={onSwipeLeft} data-testid="mock-swipe-left">Swipe Left</button>
      <button onClick={onSwipeRight} data-testid="mock-swipe-right">Swipe Right</button>
    </div>
  ),
}));

vi.mock('./TradeAnchorDisplay', () => ({
  TradeAnchorDisplay: ({ item, onChangeClick }: any) => (
    <div data-testid="trade-anchor-display">
      <span>{item.title}</span>
      <button onClick={onChangeClick} data-testid="change-anchor">Change</button>
    </div>
  ),
}));

describe('SwipeInterface', () => {
  const mockTradeAnchor: Item = {
    id: 'anchor-1',
    title: 'My Trade Item',
    description: 'Item to trade away',
    category: 'electronics',
    condition: 'good',
    status: 'available',
    images: ['https://example.com/anchor.jpg'],
    ownerId: 'user-1',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  const mockCurrentItem: Item = {
    id: 'item-1',
    title: 'Test Item',
    description: 'Test description',
    category: 'electronics',
    condition: 'good',
    status: 'available',
    images: ['https://example.com/item.jpg'],
    ownerId: 'user-2',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  const mockOwnerProfile: UserProfile = {
    uid: 'user-2',
    email: 'owner@example.com',
    firstName: 'John',
    lastName: 'Doe',
    location: 'New York, NY',
    coordinates: { latitude: 40.7128, longitude: -74.0060 },
    eligible_to_match: true,
    createdAt: Timestamp.now(),
  };

  let mockOnSwipe: ReturnType<typeof vi.fn>;
  let mockOnChangeAnchor: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnSwipe = vi.fn();
    mockOnChangeAnchor = vi.fn();
  });

  it('displays trade anchor and current item when available', () => {
    render(
      <SwipeInterface
        tradeAnchor={mockTradeAnchor}
        currentItem={mockCurrentItem}
        ownerProfile={mockOwnerProfile}
        onSwipe={mockOnSwipe}
        onChangeAnchor={mockOnChangeAnchor}
        hasMoreItems={true}
      />
    );

    expect(screen.getByTestId('trade-anchor-display')).toBeInTheDocument();
    expect(screen.getByText('My Trade Item')).toBeInTheDocument();
    expect(screen.getByTestId('swipe-card')).toBeInTheDocument();
  });

  it('shows empty state when no items available and pool exhausted', () => {
    render(
      <SwipeInterface
        tradeAnchor={mockTradeAnchor}
        currentItem={null}
        ownerProfile={null}
        onSwipe={mockOnSwipe}
        onChangeAnchor={mockOnChangeAnchor}
        hasMoreItems={false}
        loading={false}
      />
    );

    expect(screen.getByText('No More Items')).toBeInTheDocument();
    expect(screen.getByText(/You've seen all available items/i)).toBeInTheDocument();
    expect(screen.queryByTestId('swipe-card')).not.toBeInTheDocument();
  });

  it('shows loading state when loading prop is true', () => {
    render(
      <SwipeInterface
        tradeAnchor={mockTradeAnchor}
        currentItem={null}
        ownerProfile={null}
        onSwipe={mockOnSwipe}
        onChangeAnchor={mockOnChangeAnchor}
        hasMoreItems={true}
        loading={true}
      />
    );

    expect(screen.getByText('Loading items...')).toBeInTheDocument();
    expect(screen.queryByTestId('swipe-card')).not.toBeInTheDocument();
  });

  it('provides pass button that triggers left swipe', () => {
    render(
      <SwipeInterface
        tradeAnchor={mockTradeAnchor}
        currentItem={mockCurrentItem}
        ownerProfile={mockOwnerProfile}
        onSwipe={mockOnSwipe}
        onChangeAnchor={mockOnChangeAnchor}
        hasMoreItems={true}
      />
    );

    const passButton = screen.getByLabelText('Pass on this item');
    fireEvent.click(passButton);

    expect(mockOnSwipe).toHaveBeenCalledWith('left');
  });

  it('provides like button that triggers right swipe', () => {
    render(
      <SwipeInterface
        tradeAnchor={mockTradeAnchor}
        currentItem={mockCurrentItem}
        ownerProfile={mockOwnerProfile}
        onSwipe={mockOnSwipe}
        onChangeAnchor={mockOnChangeAnchor}
        hasMoreItems={true}
      />
    );

    const likeButton = screen.getByLabelText('Like this item and send trade offer');
    fireEvent.click(likeButton);

    expect(mockOnSwipe).toHaveBeenCalledWith('right');
  });

  it('calls onChangeAnchor when change button clicked', () => {
    render(
      <SwipeInterface
        tradeAnchor={mockTradeAnchor}
        currentItem={mockCurrentItem}
        ownerProfile={mockOwnerProfile}
        onSwipe={mockOnSwipe}
        onChangeAnchor={mockOnChangeAnchor}
        hasMoreItems={true}
      />
    );

    const changeButton = screen.getByTestId('change-anchor');
    fireEvent.click(changeButton);

    expect(mockOnChangeAnchor).toHaveBeenCalled();
  });

  it('calls onChangeAnchor from empty state', () => {
    render(
      <SwipeInterface
        tradeAnchor={mockTradeAnchor}
        currentItem={null}
        ownerProfile={null}
        onSwipe={mockOnSwipe}
        onChangeAnchor={mockOnChangeAnchor}
        hasMoreItems={false}
        loading={false}
      />
    );

    const changeButton = screen.getByText('Change Trade Anchor');
    fireEvent.click(changeButton);

    expect(mockOnChangeAnchor).toHaveBeenCalled();
  });

  it('forwards swipe events from SwipeCard to onSwipe handler', () => {
    render(
      <SwipeInterface
        tradeAnchor={mockTradeAnchor}
        currentItem={mockCurrentItem}
        ownerProfile={mockOwnerProfile}
        onSwipe={mockOnSwipe}
        onChangeAnchor={mockOnChangeAnchor}
        hasMoreItems={true}
      />
    );

    // Simulate swipe left from card
    const mockSwipeLeft = screen.getByTestId('mock-swipe-left');
    fireEvent.click(mockSwipeLeft);
    expect(mockOnSwipe).toHaveBeenCalledWith('left');

    // Simulate swipe right from card
    const mockSwipeRight = screen.getByTestId('mock-swipe-right');
    fireEvent.click(mockSwipeRight);
    expect(mockOnSwipe).toHaveBeenCalledWith('right');
  });

  it('disables buttons during animation', async () => {
    vi.useFakeTimers();
    
    render(
      <SwipeInterface
        tradeAnchor={mockTradeAnchor}
        currentItem={mockCurrentItem}
        ownerProfile={mockOwnerProfile}
        onSwipe={mockOnSwipe}
        onChangeAnchor={mockOnChangeAnchor}
        hasMoreItems={true}
      />
    );

    const passButton = screen.getByLabelText('Pass on this item');
    const likeButton = screen.getByLabelText('Like this item and send trade offer');

    // Click pass button
    fireEvent.click(passButton);
    
    // Buttons should be disabled during animation
    expect(passButton).toBeDisabled();
    expect(likeButton).toBeDisabled();

    // Fast-forward animation
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Buttons should be enabled again
    expect(passButton).not.toBeDisabled();
    expect(likeButton).not.toBeDisabled();

    vi.useRealTimers();
  });

  it('does not call onSwipe when buttons clicked during animation', () => {
    vi.useFakeTimers();
    
    render(
      <SwipeInterface
        tradeAnchor={mockTradeAnchor}
        currentItem={mockCurrentItem}
        ownerProfile={mockOwnerProfile}
        onSwipe={mockOnSwipe}
        onChangeAnchor={mockOnChangeAnchor}
        hasMoreItems={true}
      />
    );

    const passButton = screen.getByLabelText('Pass on this item');
    const likeButton = screen.getByLabelText('Like this item and send trade offer');

    // Click pass button
    fireEvent.click(passButton);
    expect(mockOnSwipe).toHaveBeenCalledTimes(1);

    // Try to click like button during animation
    fireEvent.click(likeButton);
    
    // Should not call onSwipe again
    expect(mockOnSwipe).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('shows loading state when currentItem is null but hasMoreItems is true', () => {
    render(
      <SwipeInterface
        tradeAnchor={mockTradeAnchor}
        currentItem={null}
        ownerProfile={null}
        onSwipe={mockOnSwipe}
        onChangeAnchor={mockOnChangeAnchor}
        hasMoreItems={true}
        loading={false}
      />
    );

    expect(screen.getByText('Loading items...')).toBeInTheDocument();
  });

  it('shows loading state when ownerProfile is null', () => {
    render(
      <SwipeInterface
        tradeAnchor={mockTradeAnchor}
        currentItem={mockCurrentItem}
        ownerProfile={null}
        onSwipe={mockOnSwipe}
        onChangeAnchor={mockOnChangeAnchor}
        hasMoreItems={true}
        loading={false}
      />
    );

    expect(screen.getByText('Loading items...')).toBeInTheDocument();
  });
});
