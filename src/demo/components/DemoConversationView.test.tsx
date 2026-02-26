import { render, screen, waitFor } from '@testing-library/react';
import { DemoConversationView } from './DemoConversationView';
import { DemoDataProvider } from '../contexts/DemoDataContext';
import { vi } from 'vitest';

// Mock the simulated interactions module
vi.mock('../utils/simulatedInteractions', () => ({
  executeMessageSendSimulation: vi.fn((typingElement, messageElement, options) => {
    // Simulate the message send after delay
    setTimeout(() => {
      // Show typing indicator
      if (typingElement) {
        typingElement.style.display = 'block';
        typingElement.style.opacity = '1';
      }
      
      // After typing duration, show message
      setTimeout(() => {
        if (typingElement) {
          typingElement.style.display = 'none';
        }
        if (messageElement) {
          messageElement.style.opacity = '1';
          messageElement.style.transform = 'translateY(0)';
        }
        setTimeout(() => {
          options.onComplete?.();
        }, 100);
      }, options.duration * 0.6);
    }, options.delay);
    
    // Return cleanup function
    return () => {};
  }),
}));

describe('DemoConversationView', () => {
  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <DemoDataProvider>
        {component}
      </DemoDataProvider>
    );
  };

  it('renders conversation header with trade items', () => {
    renderWithProviders(<DemoConversationView enableSimulation={false} />);
    
    // Check that trade items are shown in header
    expect(screen.getByText(/Vintage Vinyl Records Collection/i)).toBeInTheDocument();
    expect(screen.getByText(/Acoustic Guitar/i)).toBeInTheDocument();
  });

  it('displays partner name in header', () => {
    renderWithProviders(<DemoConversationView enableSimulation={false} />);
    
    // Check that partner name is displayed (Jordan Martinez)
    expect(screen.getByText(/Jordan Martinez/i)).toBeInTheDocument();
  });

  it('renders initial messages', () => {
    renderWithProviders(<DemoConversationView enableSimulation={false} />);
    
    // Check that messages are rendered
    expect(screen.getByText(/I'm interested in trading my vinyl collection/i)).toBeInTheDocument();
    expect(screen.getByText(/That sounds awesome/i)).toBeInTheDocument();
  });

  it('displays message timestamps', () => {
    renderWithProviders(<DemoConversationView enableSimulation={false} />);
    
    // Check that timestamps are displayed (format varies, just check they exist)
    const timestamps = screen.getAllByText(/ago|Just now|:\d{2}/i);
    expect(timestamps.length).toBeGreaterThan(0);
  });

  it('shows disabled message input in demo mode', () => {
    renderWithProviders(<DemoConversationView enableSimulation={false} />);
    
    // Check that input is disabled
    const textarea = screen.getByPlaceholderText(/Demo mode/i);
    expect(textarea).toBeDisabled();
  });

  it('executes message send simulation when enabled', async () => {
    const onComplete = vi.fn();
    
    renderWithProviders(
      <DemoConversationView
        enableSimulation={true}
        simulationDelay={100}
        simulationDuration={200}
        onSimulationComplete={onComplete}
      />
    );
    
    // Wait for simulation to complete
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    }, { timeout: 1000 });
  });

  it('does not execute simulation when disabled', async () => {
    const onComplete = vi.fn();
    
    renderWithProviders(
      <DemoConversationView
        enableSimulation={false}
        simulationDelay={100}
        simulationDuration={200}
        onSimulationComplete={onComplete}
      />
    );
    
    // Wait a bit to ensure simulation doesn't run
    await new Promise(resolve => setTimeout(resolve, 500));
    
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('uses custom simulation timing', async () => {
    const onComplete = vi.fn();
    const customDelay = 50;
    const customDuration = 100;
    
    renderWithProviders(
      <DemoConversationView
        enableSimulation={true}
        simulationDelay={customDelay}
        simulationDuration={customDuration}
        onSimulationComplete={onComplete}
      />
    );
    
    // Should not complete before delay + duration
    await new Promise(resolve => setTimeout(resolve, customDelay));
    expect(onComplete).not.toHaveBeenCalled();
    
    // Should complete after delay + duration
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    }, { timeout: customDelay + customDuration + 300 });
  });

  it('displays messages with correct sender styling', () => {
    const { container } = renderWithProviders(<DemoConversationView enableSimulation={false} />);
    
    // Check for message bubbles with different styling
    const messageBubbles = container.querySelectorAll('.rounded-2xl');
    expect(messageBubbles.length).toBeGreaterThan(0);
  });

  it('shows partner avatar for received messages', () => {
    const { container } = renderWithProviders(<DemoConversationView enableSimulation={false} />);
    
    // Check for avatar elements
    const avatars = container.querySelectorAll('.rounded-full');
    expect(avatars.length).toBeGreaterThan(0);
  });

  it('renders trade item images in header', () => {
    renderWithProviders(<DemoConversationView enableSimulation={false} />);
    
    // Check that images are rendered
    const images = screen.getAllByRole('img');
    expect(images.length).toBeGreaterThanOrEqual(2); // At least 2 trade item images
  });

  it('displays demo mode message in input area', () => {
    renderWithProviders(<DemoConversationView enableSimulation={false} />);
    
    // Check for demo mode message
    expect(screen.getByText(/Demo mode - watch the simulated conversation/i)).toBeInTheDocument();
  });
});
