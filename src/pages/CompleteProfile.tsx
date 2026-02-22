import { useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { ThemeToggle } from '../components/ThemeToggle';
import { MapPicker } from '../components/MapPicker';
import { type Coordinates } from '../utils/location';
import { Button, Input, Alert, Card } from '../components/ui';

export function CompleteProfile() {
  const { user } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedLocation = location.trim();

    if (!trimmedFirstName) {
      setError('First name is required');
      return;
    }

    if (!trimmedLastName) {
      setError('Last name is required');
      return;
    }

    if (!trimmedLocation) {
      setError('Location is required');
      return;
    }

    if (!user) {
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    try {
      // Create user profile document
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        email: user.email || '',
        location: trimmedLocation,
        coordinates: coordinates,
        eligible_to_match: false,
        createdAt: serverTimestamp(),
        photoUrl: null,
        lastPhotoUpdate: null,
        lastLocationUpdate: serverTimestamp()
      });

      console.log('Profile created successfully with:', {
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        location: trimmedLocation
      });

      // Force a small delay to ensure Firestore has processed the write
      await new Promise(resolve => setTimeout(resolve, 500));

      // Redirect to profile page - force reload to refresh profile data
      window.location.href = '/profile';
    } catch (error: any) {
      console.error('Profile creation error:', error);
      setError(error.message || 'Failed to create profile');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card variant="glass" className="max-w-md w-full animate-fadeIn shadow-2xl border-white/20 dark:border-gray-700/50">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-primary dark:bg-primary-light rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-primary dark:text-primary-light mb-2 text-center">
          Complete Your Profile
        </h1>
        <p className="text-text-secondary dark:text-gray-400 text-center mb-8">
          We need a few more details to set up your account
        </p>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <Alert variant="error">
              {error}
            </Alert>
          )}

          <Alert variant="info">
            Your profile information helps us provide a better experience and connect you with others.
          </Alert>

          <Input
            type="text"
            label="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="John"
            required
            autoFocus
          />

          <Input
            type="text"
            label="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Doe"
            required
          />

          <Input
            type="email"
            label="Email Address"
            value={user?.email || ''}
            disabled
            helperText="This is your login email and cannot be changed here"
          />

          <div>
            <label className="block text-sm font-medium text-text dark:text-gray-200 mb-2">
              Location <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={location}
                readOnly
                className="w-full px-4 py-2.5 rounded-lg border-2 bg-background-light dark:bg-gray-700 text-text dark:text-gray-100 placeholder-text-disabled dark:placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer border-border dark:border-gray-600 hover:border-primary dark:hover:border-primary-light"
                placeholder="Click map icon to select location"
                onClick={() => setShowMapPicker(true)}
                required
              />
              <button
                type="button"
                onClick={() => setShowMapPicker(true)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary dark:text-primary-light hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                title="Pick on map"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-text-secondary dark:text-gray-400 mt-1">
              Click the map icon to pick your location on a map
            </p>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full"
            >
              {isLoading ? 'Creating profile...' : 'Complete Profile'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Map Picker Modal */}
      {showMapPicker && (
        <MapPicker
          initialCoordinates={coordinates}
          onLocationSelect={(coords, addr) => {
            setCoordinates(coords);
            setLocation(addr);
          }}
          onClose={() => setShowMapPicker(false)}
        />
      )}
    </div>
  );
}
