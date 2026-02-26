import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { IntroSlide } from './IntroSlide';

describe('IntroSlide', () => {
  const defaultProps = {
    icon: '🔄',
    gradient: 'from-emerald-500 to-teal-600',
    title: 'Welcome to Circl\'d',
    description: 'Experience the future of trading',
  };

  it('renders with all props', () => {
    render(<IntroSlide {...defaultProps} />);
    
    expect(screen.getByText('🔄')).toBeInTheDocument();
    expect(screen.getByText('Welcome to Circl\'d')).toBeInTheDocument();
  });

  it('applies gradient classes correctly', () => {
    const { container } = render(<IntroSlide {...defaultProps} />);
    
    const gradientDiv = container.querySelector('.from-emerald-500.to-teal-600');
    expect(gradientDiv).toBeInTheDocument();
  });

  it('renders with instant mode', () => {
    render(<IntroSlide {...defaultProps} instant={true} />);
    
    // In instant mode, the full description should be visible immediately
    expect(screen.getByText('Experience the future of trading')).toBeInTheDocument();
  });

  it('calls onComplete callback when typing animation completes', async () => {
    const onComplete = vi.fn();
    render(<IntroSlide {...defaultProps} instant={true} onComplete={onComplete} />);
    
    // In instant mode, onComplete should be called immediately
    expect(onComplete).toHaveBeenCalled();
  });

  it('integrates with TypingAnimator', () => {
    const { container } = render(<IntroSlide {...defaultProps} />);
    
    // TypingAnimator should be present (it renders a span)
    const typingElement = container.querySelector('span');
    expect(typingElement).toBeInTheDocument();
  });

  it('applies correct styling classes', () => {
    const { container } = render(<IntroSlide {...defaultProps} />);
    
    const mainDiv = container.querySelector('.rounded-3xl.shadow-2xl.p-16.text-white');
    expect(mainDiv).toBeInTheDocument();
  });
});
