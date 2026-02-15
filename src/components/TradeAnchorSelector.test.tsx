import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TradeAnchorSelector } from './TradeAnchorSelector';
import { Item } from '../types/item';
import { Timestamp } from 'firebase/firestore';

describe('TradeAnchorSelector', () => {
  const mockTimestamp = Timestamp.now();

  const createMockItem = (overrides: Partial<Item> = {}): Item => ({
    id: 'item-1',
    ownerId: 'user-1',
    title: 'Test Item',
    description: 'Test description',
    category: 'Electronics',
    condition: 'good',
    images: ['https://example.com/image.jpg'],
    status: 'available',
    createdAt: mockTimestamp,
    ...overrides,
  });

  describe('Empty State', () => {
    it('should display empty state when no available items', () => {
      render(
        <TradeAnchorSelector
          userItems={[]}
          onSelect={vi.fn()}
          selectedItemId={null}
        />
      );

      expect(screen.getByText('No Available Items')).toBeInTheDocument();
      expect(screen.getByText(/You need to create a listing first/)).toBeInTheDocument();
    });

    it('should display empty state when all items are unavailable', () => {
      const unavailableItems = [
        createMockItem({ id: 'item-1', status: 'pending' }),
        createMockItem({ id: 'item-2', status: 'unavailable' }),
      ];

      render(
        <TradeAnchorSelector
          userItems={unavailableItems}
          onSelect={vi.fn()}
          selectedItemId={null}
        />
      );

      expect(screen.getByText('No Available Items')).toBeInTheDocument();
    });
  });

  describe('Available Items Display', () => {
    it('should display only available items', () => {
      const items = [
        createMockItem({ id: 'item-1', title: 'Available Item 1', status: 'available' }),
        createMockItem({ id: 'item-2', title: 'Pending Item', status: 'pending' }),
        createMockItem({ id: 'item-3', title: 'Available Item 2', status: 'available' }),
        createMockItem({ id: 'item-4', title: 'Unavailable Item', status: 'unavailable' }),
      ];

      render(
        <TradeAnchorSelector
          userItems={items}
          onSelect={vi.fn()}
          selectedItemId={null}
        />
      );

      expect(screen.getByText('Available Item 1')).toBeInTheDocument();
      expect(screen.getByText('Available Item 2')).toBeInTheDocument();
      expect(screen.queryByText('Pending Item')).not.toBeInTheDocument();
      expect(screen.queryByText('Unavailable Item')).not.toBeInTheDocument();
    });

    it('should display item details correctly', () => {
      const item = createMockItem({
        title: 'Gaming Laptop',
        description: 'High-performance gaming laptop',
        category: 'Electronics',
        condition: 'like-new',
      });

      render(
        <TradeAnchorSelector
          userItems={[item]}
          onSelect={vi.fn()}
          selectedItemId={null}
        />
      );

      expect(screen.getByText('Gaming Laptop')).toBeInTheDocument();
      expect(screen.getByText('High-performance gaming laptop')).toBeInTheDocument();
      expect(screen.getByText('Electronics')).toBeInTheDocument();
      expect(screen.getByText('like new')).toBeInTheDocument();
    });
  });

  describe('Item Selection', () => {
    it('should call onSelect when item is clicked', () => {
      const onSelect = vi.fn();
      const item = createMockItem({ id: 'item-1', title: 'Test Item' });

      render(
        <TradeAnchorSelector
          userItems={[item]}
          onSelect={onSelect}
          selectedItemId={null}
        />
      );

      const itemCard = screen.getByRole('button', { name: /Select Test Item as trade anchor/ });
      fireEvent.click(itemCard);

      expect(onSelect).toHaveBeenCalledWith(item);
      expect(onSelect).toHaveBeenCalledTimes(1);
    });

    it('should call onSelect when Enter key is pressed', () => {
      const onSelect = vi.fn();
      const item = createMockItem({ id: 'item-1', title: 'Test Item' });

      render(
        <TradeAnchorSelector
          userItems={[item]}
          onSelect={onSelect}
          selectedItemId={null}
        />
      );

      const itemCard = screen.getByRole('button', { name: /Select Test Item as trade anchor/ });
      fireEvent.keyDown(itemCard, { key: 'Enter', code: 'Enter' });

      expect(onSelect).toHaveBeenCalledWith(item);
    });

    it('should call onSelect when Space key is pressed', () => {
      const onSelect = vi.fn();
      const item = createMockItem({ id: 'item-1', title: 'Test Item' });

      render(
        <TradeAnchorSelector
          userItems={[item]}
          onSelect={onSelect}
          selectedItemId={null}
        />
      );

      const itemCard = screen.getByRole('button', { name: /Select Test Item as trade anchor/ });
      fireEvent.keyDown(itemCard, { key: ' ', code: 'Space' });

      expect(onSelect).toHaveBeenCalledWith(item);
    });
  });

  describe('Selected Item Highlighting', () => {
    it('should highlight selected item', () => {
      const items = [
        createMockItem({ id: 'item-1', title: 'Item 1' }),
        createMockItem({ id: 'item-2', title: 'Item 2' }),
      ];

      render(
        <TradeAnchorSelector
          userItems={items}
          onSelect={vi.fn()}
          selectedItemId="item-1"
        />
      );

      const selectedCard = screen.getByRole('button', { name: /Select Item 1 as trade anchor/ });
      expect(selectedCard).toHaveAttribute('aria-pressed', 'true');
      expect(selectedCard.className).toContain('ring-2');
    });

    it('should show checkmark icon on selected item', () => {
      const item = createMockItem({ id: 'item-1', title: 'Selected Item' });

      const { container } = render(
        <TradeAnchorSelector
          userItems={[item]}
          onSelect={vi.fn()}
          selectedItemId="item-1"
        />
      );

      // Check for the checkmark SVG
      const checkmark = container.querySelector('svg path[fill-rule="evenodd"]');
      expect(checkmark).toBeInTheDocument();
    });

    it('should not highlight unselected items', () => {
      const items = [
        createMockItem({ id: 'item-1', title: 'Item 1' }),
        createMockItem({ id: 'item-2', title: 'Item 2' }),
      ];

      render(
        <TradeAnchorSelector
          userItems={items}
          onSelect={vi.fn()}
          selectedItemId="item-1"
        />
      );

      const unselectedCard = screen.getByRole('button', { name: /Select Item 2 as trade anchor/ });
      expect(unselectedCard).toHaveAttribute('aria-pressed', 'false');
      expect(unselectedCard.className).not.toContain('ring-2');
    });
  });

  describe('Image Display', () => {
    it('should display item image when available', () => {
      const item = createMockItem({
        title: 'Item with Image',
        images: ['https://example.com/image.jpg'],
      });

      render(
        <TradeAnchorSelector
          userItems={[item]}
          onSelect={vi.fn()}
          selectedItemId={null}
        />
      );

      const image = screen.getByAltText('Item with Image');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
    });

    it('should display placeholder when no images', () => {
      const item = createMockItem({
        title: 'Item without Image',
        images: [],
      });

      const { container } = render(
        <TradeAnchorSelector
          userItems={[item]}
          onSelect={vi.fn()}
          selectedItemId={null}
        />
      );

      // Check for placeholder SVG
      const placeholder = container.querySelector('svg path[d*="M4 16l4.586"]');
      expect(placeholder).toBeInTheDocument();
    });

    it('should show image count indicator for multiple images', () => {
      const item = createMockItem({
        title: 'Item with Multiple Images',
        images: ['image1.jpg', 'image2.jpg', 'image3.jpg'],
      });

      render(
        <TradeAnchorSelector
          userItems={[item]}
          onSelect={vi.fn()}
          selectedItemId={null}
        />
      );

      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should not show image count indicator for single image', () => {
      const item = createMockItem({
        title: 'Item with Single Image',
        images: ['image1.jpg'],
      });

      const { container } = render(
        <TradeAnchorSelector
          userItems={[item]}
          onSelect={vi.fn()}
          selectedItemId={null}
        />
      );

      // The number "1" should not appear as an image count
      const imageCountElements = container.querySelectorAll('.bg-black\\/60');
      expect(imageCountElements.length).toBe(0);
    });
  });

  describe('Grid Layout', () => {
    it('should display multiple items in grid', () => {
      const items = [
        createMockItem({ id: 'item-1', title: 'Item 1' }),
        createMockItem({ id: 'item-2', title: 'Item 2' }),
        createMockItem({ id: 'item-3', title: 'Item 3' }),
      ];

      render(
        <TradeAnchorSelector
          userItems={items}
          onSelect={vi.fn()}
          selectedItemId={null}
        />
      );

      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('Item 3')).toBeInTheDocument();
    });
  });
});
