import { render, screen, waitFor } from '@testing-library/react';
import { DemoSwipeCard } from './DemoSwipeCard';
import { DemoDataProvider } from '../contexts/DemoDataContext';
import { vi } from 'vitest';

// Mock the AuthContext
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'test-user-id' },
    loading: false,
  }),
}));

// Mock the ProfileContext
vi.mock('../../contexts/ProfileContext', () => ({
  useProfile: () => ({
    profile: {
      uid: 'test-user-id',
      firstName: 'Test',
      lastName: 'User',
      coordinates: { latitude: 37.7749, longitude: -122.4194 },
    },
    loading: false,
  }),
}));

// Mock the simulated interactions module
vi.mock('../utils/simulatedInteractions', () => ({
  executeSwipeSimulation: vi.fn((element, options) => {
    // Simulate the swipe after delay
    setTimeout(() => {
      if (element) {
        element.style.transform = 'translateX(150%) rotate(20deg)';
        element.style.opacity = '0';
      }
      setTimeout(() => {
        options.onComplete?.();
      }, options.duration);
    }, options.delay);
    
    // Return cleanup function
    return () => {};
  }),
}));

describe('DemoSwipeCard', () => {
  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <DemoDataProvider>
        {component}
      </DemoDataProvider>
    );
  };

  it('renders SwipeCard with demo data', () => {
    renderWithProviders(<DemoSwipeCard enableSimulation={false} />);
    
    // Check that the guitar item is rendered (from demo data) - use heading role
    expect(screen.getByRole('heading', { name: /Acoustic Guitar/i })).toBeInTheDocument();
  });

  it('renders owner profile information', () => {
    renderWithProviders(<DemoSwipeCard enableSimulation={false} />);
    
    // Check that Jordan's name is rendered (from demo data)
    expect(screen.getByText(/Jordan Martinez/i)).toBeInTheDocument();
  });

  it('executes swipe simulation when enabled', async () => {
    const onComplete = vi.fn();
    
    renderWithProviders(
      <DemoSwipeCard
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
      <DemoSwipeCard
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
      <DemoSwipeCard
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

  it('renders with same styling as production SwipeCard', () => {
    const { container } = renderWithProviders(<DemoSwipeCard enableSimulation={false} />);
    
    // Check for key styling classes from SwipeCard
    expect(container.querySelector('.rounded-3xl')).toBeInTheDocument();
    expect(container.querySelector('.shadow-2xl')).toBeInTheDocument();
  });
});
