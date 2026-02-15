import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SwipeCard } from './SwipeCard';
import { Item } from '../types/item';
import { UserProfile } from '../types/user';
import { Timestamp } from 'firebase/firestore';

describe('SwipeCard', () => {
  const mockItem: Item = {
    id: 'item1',
    ownerId: 'user1',
    title: 'Test Item',
    description: 'This is a test item description',
    category: 'electronics',
    condition: 'like-new',
    images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    status: 'available',
    createdAt: Timestamp.now(),
  };

  const mockOwnerProfile: UserProfile = {
    uid: 'user1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    location: 'New York, NY',
    coordinates: { latitude: 40.7128, longitude: -74.0060 },
    eligible_to_match: true,
    createdAt: Timestamp.now(),
    photoUrl: 'https://example.com/photo.jpg',
    lastPhotoUpdate: null,
    lastLocationUpdate: null,
  };

  const mockOnSwipeLeft = vi.fn();
  const mockOnSwipeRight = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders item details correctly', () => {
    render(
      <SwipeCard
        item={mockItem}
        ownerProfile={mockOwnerProfile}
        onSwipeLeft={mockOnSwipeLeft}
        onSwipeRight={mockOnSwipeRight}
      />
    );

    expect(screen.getByText('Test Item')).toBeInTheDocument();
    expect(screen.getByText('This is a test item description')).toBeInTheDocument();
    expect(screen.getByText('like-new')).toBeInTheDocument();
    expect(screen.getByText('electronics')).toBeInTheDocument();
  });

  it('displays owner information', () => {
    render(
      <SwipeCard
        item={mockItem}
        ownerProfile={mockOwnerProfile}
        onSwipeLeft={mockOnSwipeLeft}
        onSwipeRight={mockOnSwipeRight}
      />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('New York, NY')).toBeInTheDocument();
    expect(screen.getByAltText('John Doe')).toHaveAttribute('src', 'https://example.com/photo.jpg');
  });

  it('displays owner initials when no photo available', () => {
    const profileWithoutPhoto = { ...mockOwnerProfile, photoUrl: null };
    render(
      <SwipeCard
        item={mockItem}
        ownerProfile={profileWithoutPhoto}
        onSwipeLeft={mockOnSwipeLeft}
        onSwipeRight={mockOnSwipeRight}
      />
    );

    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('displays image counter when multiple images exist', () => {
    render(
      <SwipeCard
        item={mockItem}
        ownerProfile={mockOwnerProfile}
        onSwipeLeft={mockOnSwipeLeft}
        onSwipeRight={mockOnSwipeRight}
      />
    );

    expect(screen.getByText('1 / 2')).toBeInTheDocument();
  });

  it('does not display image counter for single image', () => {
    const itemWithOneImage = { ...mockItem, images: ['https://example.com/image1.jpg'] };
    render(
      <SwipeCard
        item={itemWithOneImage}
        ownerProfile={mockOwnerProfile}
        onSwipeLeft={mockOnSwipeLeft}
        onSwipeRight={mockOnSwipeRight}
      />
    );

    expect(screen.queryByText(/\/ 1/)).not.toBeInTheDocument();
  });

  it('displays placeholder when no images available', () => {
    const itemWithoutImages = { ...mockItem, images: [] };
    render(
      <SwipeCard
        item={itemWithoutImages}
        ownerProfile={mockOwnerProfile}
        onSwipeLeft={mockOnSwipeLeft}
        onSwipeRight={mockOnSwipeRight}
      />
    );

    // Check for SVG placeholder
    const svg = screen.getByRole('button').querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('handles keyboard left arrow key press', async () => {
    render(
      <SwipeCard
        item={mockItem}
        ownerProfile={mockOwnerProfile}
        onSwipeLeft={mockOnSwipeLeft}
        onSwipeRight={mockOnSwipeRight}
      />
    );

    const card = screen.getByRole('button');
    fireEvent.keyDown(card, { key: 'ArrowLeft' });

    await waitFor(() => {
      expect(mockOnSwipeLeft).toHaveBeenCalledTimes(1);
    }, { timeout: 500 });
  });

  it('handles keyboard right arrow key press', async () => {
    render(
      <SwipeCard
        item={mockItem}
        ownerProfile={mockOwnerProfile}
        onSwipeLeft={mockOnSwipeLeft}
        onSwipeRight={mockOnSwipeRight}
      />
    );

    const card = screen.getByRole('button');
    fireEvent.keyDown(card, { key: 'ArrowRight' });

    await waitFor(() => {
      expect(mockOnSwipeRight).toHaveBeenCalledTimes(1);
    }, { timeout: 500 });
  });

  it('handles mouse drag to the right', async () => {
    render(
      <SwipeCard
        item={mockItem}
        ownerProfile={mockOwnerProfile}
        onSwipeLeft={mockOnSwipeLeft}
        onSwipeRight={mockOnSwipeRight}
      />
    );

    const card = screen.getByRole('button');
    
    // Simulate mouse drag
    fireEvent.mouseDown(card, { clientX: 200, clientY: 200 });
    fireEvent(window, new MouseEvent('mousemove', { clientX: 350, clientY: 200 }));
    fireEvent(window, new MouseEvent('mouseup'));

    await waitFor(() => {
      expect(mockOnSwipeRight).toHaveBeenCalledTimes(1);
    }, { timeout: 500 });
  });

  it('handles mouse drag to the left', async () => {
    render(
      <SwipeCard
        item={mockItem}
        ownerProfile={mockOwnerProfile}
        onSwipeLeft={mockOnSwipeLeft}
        onSwipeRight={mockOnSwipeRight}
      />
    );

    const card = screen.getByRole('button');
    
    // Simulate mouse drag
    fireEvent.mouseDown(card, { clientX: 200, clientY: 200 });
    fireEvent(window, new MouseEvent('mousemove', { clientX: 50, clientY: 200 }));
    fireEvent(window, new MouseEvent('mouseup'));

    await waitFor(() => {
      expect(mockOnSwipeLeft).toHaveBeenCalledTimes(1);
    }, { timeout: 500 });
  });

  it('resets card position when drag is below threshold', async () => {
    render(
      <SwipeCard
        item={mockItem}
        ownerProfile={mockOwnerProfile}
        onSwipeLeft={mockOnSwipeLeft}
        onSwipeRight={mockOnSwipeRight}
      />
    );

    const card = screen.getByRole('button');
    
    // Simulate small drag (below threshold)
    fireEvent.mouseDown(card, { clientX: 200, clientY: 200 });
    fireEvent(window, new MouseEvent('mousemove', { clientX: 250, clientY: 200 }));
    fireEvent(window, new MouseEvent('mouseup'));

    // Wait a bit to ensure no callback is triggered
    await new Promise(resolve => setTimeout(resolve, 400));
    
    expect(mockOnSwipeLeft).not.toHaveBeenCalled();
    expect(mockOnSwipeRight).not.toHaveBeenCalled();
  });

  it('handles touch swipe to the right', async () => {
    render(
      <SwipeCard
        item={mockItem}
        ownerProfile={mockOwnerProfile}
        onSwipeLeft={mockOnSwipeLeft}
        onSwipeRight={mockOnSwipeRight}
      />
    );

    const card = screen.getByRole('button');
    
    // Simulate touch swipe
    fireEvent.touchStart(card, {
      touches: [{ clientX: 200, clientY: 200 }],
    });
    fireEvent.touchMove(card, {
      touches: [{ clientX: 350, clientY: 200 }],
    });
    fireEvent.touchEnd(card);

    await waitFor(() => {
      expect(mockOnSwipeRight).toHaveBeenCalledTimes(1);
    }, { timeout: 500 });
  });

  it('handles touch swipe to the left', async () => {
    render(
      <SwipeCard
        item={mockItem}
        ownerProfile={mockOwnerProfile}
        onSwipeLeft={mockOnSwipeLeft}
        onSwipeRight={mockOnSwipeRight}
      />
    );

    const card = screen.getByRole('button');
    
    // Simulate touch swipe
    fireEvent.touchStart(card, {
      touches: [{ clientX: 200, clientY: 200 }],
    });
    fireEvent.touchMove(card, {
      touches: [{ clientX: 50, clientY: 200 }],
    });
    fireEvent.touchEnd(card);

    await waitFor(() => {
      expect(mockOnSwipeLeft).toHaveBeenCalledTimes(1);
    }, { timeout: 500 });
  });

  it('has proper accessibility attributes', () => {
    render(
      <SwipeCard
        item={mockItem}
        ownerProfile={mockOwnerProfile}
        onSwipeLeft={mockOnSwipeLeft}
        onSwipeRight={mockOnSwipeRight}
      />
    );

    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('tabIndex', '0');
    expect(card).toHaveAttribute('aria-label');
  });

  it('displays condition badge with correct styling', () => {
    render(
      <SwipeCard
        item={mockItem}
        ownerProfile={mockOwnerProfile}
        onSwipeLeft={mockOnSwipeLeft}
        onSwipeRight={mockOnSwipeRight}
      />
    );

    const conditionBadge = screen.getByText('like-new');
    expect(conditionBadge).toHaveClass('capitalize');
  });
});
