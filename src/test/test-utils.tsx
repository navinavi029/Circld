import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { User } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';
import { UserProfile } from '../types/user';

// Mock user for testing
export const mockUser: Partial<User> = {
  uid: 'test-user-id',
  email: 'test@example.com',
  emailVerified: true,
  displayName: 'Test User',
  photoURL: null,
  phoneNumber: null,
  providerId: 'firebase',
  metadata: {
    creationTime: new Date().toISOString(),
    lastSignInTime: new Date().toISOString(),
  },
} as Partial<User>;

// Mock profile for testing
export const mockProfile: UserProfile = {
  uid: 'test-user-id',
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  location: 'Test City, Test State',
  coordinates: {
    latitude: 40.7128,
    longitude: -74.0060,
  },
  eligible_to_match: true,
  createdAt: Timestamp.fromDate(new Date()),
  photoUrl: null,
  lastPhotoUpdate: null,
  lastLocationUpdate: null,
};

// Mock AuthContext
const MockAuthContext = ({ children, user = mockUser }: { children: ReactNode; user?: Partial<User> | null }) => {
  return children;
};

// Mock ProfileContext
const MockProfileContext = ({ children, profile = mockProfile }: { children: ReactNode; profile?: UserProfile | null }) => {
  return children;
};

/**
 * Test wrapper that provides all necessary context providers
 */
export function TestWrapper({ children }: { children: ReactNode }) {
  return (
    <MockAuthContext user={mockUser}>
      <MockProfileContext profile={mockProfile}>
        {children}
      </MockProfileContext>
    </MockAuthContext>
  );
}

/**
 * Custom render function that wraps components with all necessary providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: TestWrapper, ...options });
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';
