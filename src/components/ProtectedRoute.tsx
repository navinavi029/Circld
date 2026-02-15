import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import { LoadingSpinner } from './ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: ReactNode;
  requireProfile?: boolean;
}

export function ProtectedRoute({ children, requireProfile = true }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { hasProfile, loading: profileLoading, profile } = useProfile();
  const location = useLocation();

  console.log('ProtectedRoute check:', {
    pathname: location.pathname,
    user: !!user,
    authLoading,
    profileLoading,
    hasProfile,
    requireProfile,
    profile: profile ? { 
      firstName: profile.firstName, 
      lastName: profile.lastName,
      name: (profile as any).name 
    } : null
  });

  // Show loading while checking auth or profile
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner message="Loading..." size="lg" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If on complete-profile page but profile is already complete, redirect to profile
  if (location.pathname === '/complete-profile' && hasProfile) {
    console.log('Redirecting to profile because profile is already complete');
    return <Navigate to="/profile" replace />;
  }

  // Redirect to complete profile if profile doesn't exist and we're not already on that page
  if (requireProfile && !hasProfile && location.pathname !== '/complete-profile') {
    console.log('Redirecting to complete-profile because hasProfile is false');
    return <Navigate to="/complete-profile" replace />;
  }

  return <>{children}</>;
}
