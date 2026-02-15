import { useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export interface ProfileUpdateData {
  firstName: string;
  lastName: string;
  location: string;
  coordinates: {
    latitude: number;
    longitude: number;
  } | null;
  eligible_to_match: boolean;
  photoUrl: string | null;
  previousPhotoUrl?: string | null; // Track if photo changed
  previousLocation?: string; // Track if location changed
  previousCoordinates?: {
    latitude: number;
    longitude: number;
  } | null; // Track if coordinates changed
}

interface UseProfileUpdateReturn {
  updateProfile: (data: ProfileUpdateData) => Promise<void>;
  loading: boolean;
  error: string | null;
  success: boolean;
}

export function useProfileUpdate(): UseProfileUpdateReturn {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const updateProfile = async (data: ProfileUpdateData): Promise<void> => {
    // Validate user is authenticated
    if (!user) {
      setError('You must be logged in to update your profile');
      setSuccess(false);
      return;
    }

    // Validate required fields are not empty
    if (!data.firstName.trim()) {
      setError('First name cannot be empty');
      setSuccess(false);
      setLoading(false);
      return;
    }

    if (!data.lastName.trim()) {
      setError('Last name cannot be empty');
      setSuccess(false);
      setLoading(false);
      return;
    }

    if (!data.location.trim()) {
      setError('Location cannot be empty');
      setSuccess(false);
      setLoading(false);
      return;
    }

    // Clear previous states
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      // Update Firestore document using authenticated user's uid
      const docRef = doc(db, 'users', user.uid);
      
      // Check if photo was updated
      const photoChanged = data.previousPhotoUrl !== data.photoUrl;
      
      // Check if location was updated
      const locationChanged = data.previousLocation !== data.location || 
                             JSON.stringify(data.previousCoordinates) !== JSON.stringify(data.coordinates);
      
      const updateData: any = {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        location: data.location.trim(),
        coordinates: data.coordinates,
        eligible_to_match: data.eligible_to_match,
        photoUrl: data.photoUrl
      };
      
      // Only update lastPhotoUpdate if photo changed
      if (photoChanged && data.photoUrl !== null) {
        updateData.lastPhotoUpdate = serverTimestamp();
      }
      
      // Only update lastLocationUpdate if location changed
      if (locationChanged) {
        updateData.lastLocationUpdate = serverTimestamp();
      }
      
      console.log('Updating profile with:', updateData);
      
      await updateDoc(docRef, updateData);

      setSuccess(true);
    } catch (err: any) {
      // Handle different error types
      if (err.code === 'permission-denied') {
        setError("You don't have permission to update this profile.");
      } else if (err.code === 'not-found') {
        setError('Profile not found. Please try logging in again.');
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Failed to save profile. Please try again.');
      }
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return {
    updateProfile,
    loading,
    error,
    success
  };
}
