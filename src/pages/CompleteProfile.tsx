import { useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { ThemeToggle } from '../components/ThemeToggle';
import { MapPicker } from '../components/MapPicker';
import { type Coordinates } from '../utils/location';

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
    <div className="min-h-screen bg-background dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="relative bg-white dark:bg-gray-800 backdrop-blur-sm rounded-2xl shadow-2xl p-8 max-w-md w-full transform transition-all hover:scale-[1.01] animate-fadeIn">
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
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm flex items-start shadow-sm animate-fadeInFast">
              <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="bg-info-light dark:bg-info-dark/20 border-l-4 border-info dark:border-info-light p-4 rounded">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-info-dark dark:text-info-light mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm text-info-dark dark:text-info-light">
                  Your profile information helps us provide a better experience and connect you with others.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-text dark:text-gray-200 mb-2">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-border dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-text dark:text-gray-100 focus:ring-2 focus:ring-accent focus:border-accent transition-all outline-none placeholder:text-text/40 dark:placeholder:text-gray-500"
              placeholder="John"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-text dark:text-gray-200 mb-2">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-border dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-text dark:text-gray-100 focus:ring-2 focus:ring-accent focus:border-accent transition-all outline-none placeholder:text-text/40 dark:placeholder:text-gray-500"
              placeholder="Doe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-text dark:text-gray-200 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-4 py-3 border-2 border-border dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            />
            <p className="text-xs text-text-secondary dark:text-gray-400 mt-1">This is your login email and cannot be changed here</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-text dark:text-gray-200 mb-2">
              Location <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-3 pr-12 border-2 border-border dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-text dark:text-gray-100 focus:ring-2 focus:ring-accent focus:border-accent transition-all outline-none placeholder:text-text/40 dark:placeholder:text-gray-500"
                placeholder="New York, USA"
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
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary-light active:bg-primary-dark disabled:bg-border disabled:bg-border/50 text-white font-semibold py-3 rounded-xl transition-colors duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating profile...
                </>
              ) : 'Complete Profile'}
            </button>
          </div>
        </form>
      </div>

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
