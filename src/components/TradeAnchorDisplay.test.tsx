import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TradeAnchorDisplay } from './TradeAnchorDisplay';
import { Item } from '../types/item';
import { Timestamp } from 'firebase/firestore';

describe('TradeAnchorDisplay', () => {
  const mockItem: Item = {
    id: 'item-1',
    ownerId: 'user-1',
    title: 'Vintage Camera',
    description: 'A classic film camera',
    category: 'electronics',
    condition: 'good',
    images: ['https://example.com/camera.jpg'],
    status: 'available',
    createdAt: Timestamp.now(),
  };

  it('displays the item title', () => {
    const onChangeClick = vi.fn();
    render(<TradeAnchorDisplay item={mockItem} onChangeClick={onChangeClick} />);
    
    expect(screen.getByText('Vintage Camera')).toBeInTheDocument();
  });

  it('displays the item primary image', () => {
    const onChangeClick = vi.fn();
    render(<TradeAnchorDisplay item={mockItem} onChangeClick={onChangeClick} />);
    
    const image = screen.getByAltText('Vintage Camera');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/camera.jpg');
  });

  it('displays "Trading Away" label', () => {
    const onChangeClick = vi.fn();
    render(<TradeAnchorDisplay item={mockItem} onChangeClick={onChangeClick} />);
    
    expect(screen.getByText('Trading Away')).toBeInTheDocument();
  });

  it('displays change button', () => {
    const onChangeClick = vi.fn();
    render(<TradeAnchorDisplay item={mockItem} onChangeClick={onChangeClick} />);
    
    const changeButton = screen.getByRole('button', { name: /change trade anchor/i });
    expect(changeButton).toBeInTheDocument();
  });

  it('calls onChangeClick when change button is clicked', () => {
    const onChangeClick = vi.fn();
    render(<TradeAnchorDisplay item={mockItem} onChangeClick={onChangeClick} />);
    
    const changeButton = screen.getByRole('button', { name: /change trade anchor/i });
    fireEvent.click(changeButton);
    
    expect(onChangeClick).toHaveBeenCalledTimes(1);
  });

  it('displays placeholder icon when item has no images', () => {
    const itemWithoutImages: Item = {
      ...mockItem,
      images: [],
    };
    const onChangeClick = vi.fn();
    const { container } = render(<TradeAnchorDisplay item={itemWithoutImages} onChangeClick={onChangeClick} />);
    
    // Check that the SVG placeholder is rendered
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('uses first image when multiple images are available', () => {
    const itemWithMultipleImages: Item = {
      ...mockItem,
      images: [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
        'https://example.com/image3.jpg',
      ],
    };
    const onChangeClick = vi.fn();
    render(<TradeAnchorDisplay item={itemWithMultipleImages} onChangeClick={onChangeClick} />);
    
    const image = screen.getByAltText('Vintage Camera');
    expect(image).toHaveAttribute('src', 'https://example.com/image1.jpg');
  });

  it('truncates long titles', () => {
    const itemWithLongTitle: Item = {
      ...mockItem,
      title: 'This is a very long title that should be truncated to fit in the display area without wrapping',
    };
    const onChangeClick = vi.fn();
    render(
      <TradeAnchorDisplay item={itemWithLongTitle} onChangeClick={onChangeClick} />
    );
    
    const titleElement = screen.getByText(itemWithLongTitle.title);
    expect(titleElement).toHaveClass('truncate');
  });

  it('has fixed positioning', () => {
    const onChangeClick = vi.fn();
    const { container } = render(
      <TradeAnchorDisplay item={mockItem} onChangeClick={onChangeClick} />
    );
    
    const fixedContainer = container.querySelector('.fixed');
    expect(fixedContainer).toBeInTheDocument();
    expect(fixedContainer).toHaveClass('top-4');
  });

  it('has distinct visual styling with border', () => {
    const onChangeClick = vi.fn();
    const { container } = render(
      <TradeAnchorDisplay item={mockItem} onChangeClick={onChangeClick} />
    );
    
    const innerContainer = container.querySelector('.border-2');
    expect(innerContainer).toBeInTheDocument();
    expect(innerContainer).toHaveClass('border-accent');
  });
});
