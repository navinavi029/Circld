import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ProfileProvider } from '../contexts/ProfileContext';
import { AuthProvider } from '../contexts/AuthContext';
import { HapticProvider } from '../contexts/HapticContext';
import { AudioProvider } from '../contexts/AudioContext';
import { UserProfile } from '../types/user';

// Mock user for testing
export const mockUser = {
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
};

// Mock profile for testing
export const mockProfile: UserProfile = {
  id: 'test-user-id',
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  location: 'Test City, TC',
  coordinates: {
    lat: 40.7128,
    lng: -74.0060,
  },
  photoUrl: 'https://example.com/photo.jpg',
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Mock owner profile for testing
export const mockOwnerProfile: UserProfile = {
  id: 'owner-user-id',
  firstName: 'Owner',
  lastName: 'User',
  email: 'owner@example.com',
  location: 'Owner City, OC',
  coordinates: {
    lat: 40.7580,
    lng: -73.9855,
  },
  photoUrl: 'https://example.com/owner-photo.jpg',
  createdAt: new Date(),
  updatedAt: new Date(),
};

interface TestWrapperProps {
  children: ReactNode;
  profile?: UserProfile | null;
}

export function TestWrapper({ children, profile = mockProfile }: TestWrapperProps) {
  return (
    <AuthProvider>
      <ProfileProvider>
        <HapticProvider>
          <AudioProvider>
            {children}
          </AudioProvider>
        </HapticProvider>
      </ProfileProvider>
    </AuthProvider>
  );
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { profile?: UserProfile | null }
) {
  const { profile, ...renderOptions } = options || {};
  
  return render(ui, {
    wrapper: ({ children }) => (
      <TestWrapper profile={profile}>
        {children}
      </TestWrapper>
    ),
    ...renderOptions,
  });
}
