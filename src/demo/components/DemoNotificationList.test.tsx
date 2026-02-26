import { render, screen, waitFor } from '@testing-library/react';
import { DemoNotificationList } from './DemoNotificationList';
import { DemoDataProvider } from '../contexts/DemoDataContext';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

// Mock the simulated interactions module
vi.mock('../utils/simulatedInteractions', () => ({
  executeNotificationAppearSimulation: vi.fn((element, options) => {
    // Simulate the appear animation after delay
    setTimeout(() => {
      if (element) {
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
      }
      setTimeout(() => {
        options.onComplete?.();
      }, options.duration);
    }, options.delay);
    
    // Return cleanup function
    return () => {};
  }),
}));

describe('DemoNotificationList', () => {
  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <BrowserRouter>
        <DemoDataProvider>
          {component}
        </DemoDataProvider>
      </BrowserRouter>
    );
  };

  it('renders notification with demo data', () => {
    renderWithProviders(<DemoNotificationList enableSimulation={false} />);
    
    // Check that the notification content is rendered
    expect(screen.getByText(/wants to trade with you/i)).toBeInTheDocument();
  });

  it('displays offering user name', () => {
    renderWithProviders(<DemoNotificationList enableSimulation={false} />);
    
    // Check that Alex Chen's name is rendered (from demo data)
    expect(screen.getByText(/Alex Chen/i)).toBeInTheDocument();
  });

  it('displays trade items', () => {
    renderWithProviders(<DemoNotificationList enableSimulation={false} />);
    
    // Check that both items are displayed
    expect(screen.getByText(/Vintage Vinyl Records Collection/i)).toBeInTheDocument();
    expect(screen.getByText(/Acoustic Guitar/i)).toBeInTheDocument();
  });

  it('displays action buttons', () => {
    renderWithProviders(<DemoNotificationList enableSimulation={false} />);
    
    // Check that action buttons are present
    expect(screen.getByText(/View Their Item/i)).toBeInTheDocument();
    expect(screen.getByText(/Start Conversation/i)).toBeInTheDocument();
  });

  it('executes appear simulation when enabled', async () => {
    const onComplete = vi.fn();
    
    renderWithProviders(
      <DemoNotificationList
        enableSimulation={true}
        simulationDelay={100}
        simulationDuration={100}
        onSimulationComplete={onComplete}
      />
    );
    
    // Wait for simulation to complete
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    }, { timeout: 500 });
  });

  it('does not execute simulation when disabled', async () => {
    const onComplete = vi.fn();
    
    renderWithProviders(
      <DemoNotificationList
        enableSimulation={false}
        simulationDelay={100}
        simulationDuration={100}
        onSimulationComplete={onComplete}
      />
    );
    
    // Wait a bit to ensure simulation doesn't run
    await new Promise(resolve => setTimeout(resolve, 300));
    
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('uses custom simulation timing', async () => {
    const onComplete = vi.fn();
    const customDelay = 50;
    const customDuration = 50;
    
    renderWithProviders(
      <DemoNotificationList
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
    }, { timeout: customDelay + customDuration + 100 });
  });

  it('shows unread indicator for unread notifications', () => {
    const { container } = renderWithProviders(<DemoNotificationList enableSimulation={false} />);
    
    // Check for unread indicator (blue dot) by class
    const unreadIndicator = container.querySelector('.bg-blue-600.rounded-full');
    expect(unreadIndicator).toBeInTheDocument();
  });

  it('displays notification date', () => {
    renderWithProviders(<DemoNotificationList enableSimulation={false} />);
    
    // Check that a date is displayed
    const dateElement = screen.getByText(/\d{1,2}\/\d{1,2}\/\d{4}/);
    expect(dateElement).toBeInTheDocument();
  });
});
