import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { CompletionSlide } from './CompletionSlide';

describe('CompletionSlide', () => {
  const defaultProps = {
    icon: '✅',
    gradient: 'from-green-500 to-emerald-600',
    title: 'Complete the Trade',
    description: 'After meeting up and exchanging items, both parties confirm completion.',
  };

  it('renders with all props', () => {
    render(<CompletionSlide {...defaultProps} />);
    
    expect(screen.getByText('✅')).toBeInTheDocument();
    expect(screen.getByText('Complete the Trade')).toBeInTheDocument();
  });

  it('renders restart button when onRestart is provided', () => {
    const onRestart = vi.fn();
    render(<CompletionSlide {...defaultProps} onRestart={onRestart} />);
    
    const restartButton = screen.getByText('Restart Demo');
    expect(restartButton).toBeInTheDocument();
  });

  it('does not render restart button when onRestart is not provided', () => {
    render(<CompletionSlide {...defaultProps} />);
    
    expect(screen.queryByText('Restart Demo')).not.toBeInTheDocument();
  });

  it('calls onRestart when restart button is clicked', () => {
    const onRestart = vi.fn();
    render(<CompletionSlide {...defaultProps} onRestart={onRestart} />);
    
    const restartButton = screen.getByText('Restart Demo');
    fireEvent.click(restartButton);
    
    expect(onRestart).toHaveBeenCalledTimes(1);
  });

  it('applies gradient classes correctly', () => {
    const { container } = render(<CompletionSlide {...defaultProps} />);
    
    const gradientDiv = container.querySelector('.from-green-500.to-emerald-600');
    expect(gradientDiv).toBeInTheDocument();
  });

  it('renders with instant mode', () => {
    render(<CompletionSlide {...defaultProps} instant={true} />);
    
    // In instant mode, the full description should be visible immediately
    expect(screen.getByText('After meeting up and exchanging items, both parties confirm completion.')).toBeInTheDocument();
  });

  it('calls onComplete callback when typing animation completes', async () => {
    const onComplete = vi.fn();
    render(<CompletionSlide {...defaultProps} instant={true} onComplete={onComplete} />);
    
    // In instant mode, onComplete should be called immediately
    expect(onComplete).toHaveBeenCalled();
  });

  it('integrates with TypingAnimator', () => {
    const { container } = render(<CompletionSlide {...defaultProps} />);
    
    // TypingAnimator should be present (it renders a span)
    const typingElement = container.querySelector('span');
    expect(typingElement).toBeInTheDocument();
  });

  it('applies correct styling classes', () => {
    const { container } = render(<CompletionSlide {...defaultProps} />);
    
    const mainDiv = container.querySelector('.rounded-3xl.shadow-2xl.p-16.text-white');
    expect(mainDiv).toBeInTheDocument();
  });

  it('restart button has correct styling classes', () => {
    const onRestart = vi.fn();
    render(<CompletionSlide {...defaultProps} onRestart={onRestart} />);
    
    const restartButton = screen.getByText('Restart Demo');
    expect(restartButton).toHaveClass('bg-white/20', 'hover:bg-white/30', 'rounded-full');
  });
});
