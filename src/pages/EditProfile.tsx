import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../contexts/ProfileContext';
import { useProfileUpdate } from '../hooks/useProfileUpdate';
import { ProfilePhotoUpload } from '../components/ProfilePhotoUpload';
import { ThemeToggle } from '../components/ThemeToggle';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { MapPicker } from '../components/MapPicker';
import { type Coordinates } from '../utils/location';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinary';

/**
 * EditProfile Page Component
 * 
 * Provides interface for users to edit their profile information including:
 * - Name
 * - Location
 * - Eligible to match status
 * - Profile photo
 * 
 * Features:
 * - Form validation for required fields
 * - Change tracking to enable/disable save button
 * - Success/error message display
 * - Navigation back to Dashboard
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 6.1, 6.2, 7.1, 7.2, 7.3, 7.4
 */
export function EditProfile() {
  const navigate = useNavigate();
  const { profile, loading: profileLoading, error: profileError } = useProfile();
  const { updateProfile, loading: updateLoading, error: updateError, success } = useProfileUpdate();

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [eligibleToMatch, setEligibleToMatch] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  // New photo state for deferred upload
  const [newPhotoBlob, setNewPhotoBlob] = useState<Blob | null>(null);
  const [newPhotoFileName, setNewPhotoFileName] = useState<string | null>(null);
  const [newPhotoPreviewUrl, setNewPhotoPreviewUrl] = useState<string | null>(null);

  // Validation and UI state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);

  // Check if user can update location (14-day cooldown)
  const canUpdateLocation = () => {
    if (!profile?.lastLocationUpdate) return true;
    
    const twoWeeksInMs = 14 * 24 * 60 * 60 * 1000;
    const lastUpdateTime = profile.lastLocationUpdate.toMillis();
    const now = Date.now();
    
    return (now - lastUpdateTime) >= twoWeeksInMs;
  };

  const getRemainingLocationCooldown = () => {
    if (!profile?.lastLocationUpdate) return '';
    
    const twoWeeksInMs = 14 * 24 * 60 * 60 * 1000;
    const lastUpdateTime = profile.lastLocationUpdate.toMillis();
    const now = Date.now();
    const remaining = twoWeeksInMs - (now - lastUpdateTime);
    
    if (remaining <= 0) return '';
    
    const days = Math.ceil(remaining / (24 * 60 * 60 * 1000));
    return `${days} day${days !== 1 ? 's' : ''}`;
  };

  const locationCooldownActive = !canUpdateLocation();
  const locationCooldownRemaining = getRemainingLocationCooldown();

  // Track original values to detect changes
  const [originalValues, setOriginalValues] = useState({
    firstName: '',
    lastName: '',
    location: '',
    coordinates: null as Coordinates | null,
    eligibleToMatch: false,
    photoUrl: null as string | null
  });

  /**
   * Load profile data and populate form fields
   * Requirements: 2.2
   */
  useEffect(() => {
    if (profile) {
      // Handle migration from old format (name) to new format (firstName, lastName)
      let firstName = profile.firstName || '';
      let lastName = profile.lastName || '';
      
      // If old format exists but new format doesn't, split the name
      if (!firstName && !lastName && (profile as any).name) {
        const nameParts = (profile as any).name.split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      }
      
      const values = {
        firstName,
        lastName,
        location: profile.location,
        coordinates: profile.coordinates,
        eligibleToMatch: profile.eligible_to_match,
        photoUrl: profile.photoUrl
      };
      
      setFirstName(values.firstName);
      setLastName(values.lastName);
      setLocation(values.location);
      setCoordinates(values.coordinates);
      setEligibleToMatch(values.eligibleToMatch);
      setPhotoUrl(values.photoUrl);
      setOriginalValues(values);
    }
    
    // Cleanup preview URL on unmount
    return () => {
      if (newPhotoPreviewUrl) {
        URL.revokeObjectURL(newPhotoPreviewUrl);
      }
    };
  }, [profile, newPhotoPreviewUrl]);

  /**
   * Track changes to form fields
   * Requirements: 7.3, 7.4
   */
  useEffect(() => {
    const changed = 
      firstName !== originalValues.firstName ||
      lastName !== originalValues.lastName ||
      location !== originalValues.location ||
      coordinates !== originalValues.coordinates ||
      eligibleToMatch !== originalValues.eligibleToMatch ||
      photoUrl !== originalValues.photoUrl ||
      newPhotoBlob !== null; // New photo selected
    
    setHasChanges(changed);
  }, [firstName, lastName, location, coordinates, eligibleToMatch, photoUrl, newPhotoBlob, originalValues]);

  /**
   * Validate first name field
   * Requirements: 2.3, 7.1
   */
  const validateFirstName = (value: string): string | null => {
    if (!value || value.trim() === '') {
      return 'First name is required';
    }
    return null;
  };

  /**
   * Validate last name field
   * Requirements: 2.3, 7.1
   */
  const validateLastName = (value: string): string | null => {
    if (!value || value.trim() === '') {
      return 'Last name is required';
    }
    return null;
  };

  /**
   * Validate location field
   * Requirements: 2.4, 7.2
   */
  const validateLocation = (value: string): string | null => {
    if (!value || value.trim() === '') {
      return 'Location is required';
    }
    return null;
  };

  /**
   * Handle first name field change
   * Requirements: 2.3, 7.1
   */
  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFirstName(value);
    
    // Clear validation error when user modifies the field
    const error = validateFirstName(value);
    setValidationErrors(prev => {
      const next = { ...prev };
      if (error) {
        next.firstName = error;
      } else {
        delete next.firstName;
      }
      return next;
    });
  };

  /**
   * Handle last name field change
   * Requirements: 2.3, 7.1
   */
  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLastName(value);
    
    // Clear validation error when user modifies the field
    const error = validateLastName(value);
    setValidationErrors(prev => {
      const next = { ...prev };
      if (error) {
        next.lastName = error;
      } else {
        delete next.lastName;
      }
      return next;
    });
  };

  /**
   * Handle location field change
   * Requirements: 2.4, 7.2
   */
  // @ts-expect-error - Function defined for future use
  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocation(value);
    
    // Clear validation error when user modifies the field
    const error = validateLocation(value);
    setValidationErrors(prev => {
      const next = { ...prev };
      if (error) {
        next.location = error;
      } else {
        delete next.location;
      }
      return next;
    });
  };

  /**
   * Handle eligible to match toggle
   * Requirements: 2.5
   */
  const handleEligibleToMatchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEligibleToMatch(e.target.checked);
  };

  /**
   * Handle photo prepared (cropped but not uploaded yet)
   */
  const handlePhotoPrepared = (blob: Blob | null, fileName: string | null) => {
    setNewPhotoBlob(blob);
    setNewPhotoFileName(fileName);
    
    // Create preview URL for the new photo
    if (blob) {
      // Clean up old preview URL
      if (newPhotoPreviewUrl) {
        URL.revokeObjectURL(newPhotoPreviewUrl);
      }
      const previewUrl = URL.createObjectURL(blob);
      setNewPhotoPreviewUrl(previewUrl);
    } else {
      // Clean up preview URL when blob is cleared
      if (newPhotoPreviewUrl) {
        URL.revokeObjectURL(newPhotoPreviewUrl);
      }
      setNewPhotoPreviewUrl(null);
    }
  };

  /**
   * Handle photo upload success
   * Requirements: 3.6
   */
  const handlePhotoUploaded = (url: string) => {
    // This is no longer used for local preview, only for actual Cloudinary URLs
    setPhotoUrl(url);
    setPhotoError(null);
  };

  /**
   * Handle photo upload error
   * Requirements: 3.7, 6.5
   */
  const handlePhotoError = (error: string) => {
    setPhotoError(error);
  };

  /**
   * Handle form submission
   * Requirements: 2.6, 5.1, 5.3, 5.4, 6.2, 6.6
   */
  const handleSave = async () => {
    // Clear photo error on save attempt BEFORE validation (Requirements: 6.6)
    // This ensures errors are cleared when user retries, even if validation fails
    setPhotoError(null);

    // Validate all fields before saving
    const firstNameError = validateFirstName(firstName);
    const lastNameError = validateLastName(lastName);
    const locationError = validateLocation(location);
    
    const errors: Record<string, string> = {};
    if (firstNameError) errors.firstName = firstNameError;
    if (lastNameError) errors.lastName = lastNameError;
    if (locationError) errors.location = locationError;
    
    setValidationErrors(errors);
    
    // Don't save if validation errors exist
    if (Object.keys(errors).length > 0) {
      return;
    }

    // Upload new photo if one was selected
    let finalPhotoUrl = photoUrl;
    if (newPhotoBlob && newPhotoFileName) {
      try {
        // Delete the old photo from Cloudinary if it exists
        if (originalValues.photoUrl) {
          await deleteFromCloudinary(originalValues.photoUrl);
        }

        // Create a File object from the cropped blob
        const croppedFile = new File([newPhotoBlob], newPhotoFileName, {
          type: 'image/jpeg',
          lastModified: Date.now()
        });

        // Upload to Cloudinary
        const result = await uploadToCloudinary(croppedFile, {
          folder: 'profile-photos',
          transformation: {
            width: 400,
            height: 400,
            crop: 'fill'
          }
        });

        finalPhotoUrl = result.url;
        
        // Clean up the preview URL
        if (newPhotoPreviewUrl) {
          URL.revokeObjectURL(newPhotoPreviewUrl);
          setNewPhotoPreviewUrl(null);
        }
      } catch (err: any) {
        setPhotoError(err.message || 'Failed to upload photo. Please try again.');
        return;
      }
    }

    // Call updateProfile hook
    await updateProfile({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      location: location.trim(),
      coordinates: coordinates,
      eligible_to_match: eligibleToMatch,
      photoUrl: finalPhotoUrl,
      previousPhotoUrl: originalValues.photoUrl,
      previousLocation: originalValues.location,
      previousCoordinates: originalValues.coordinates
    });
  };

  /**
   * Handle cancel button
   * Requirements: 2.7
   */
  const handleCancel = () => {
    navigate('/profile');
  };

  /**
   * Determine if save button should be disabled
   * Requirements: 7.3, 7.4
   */
  const isSaveDisabled = 
    Object.keys(validationErrors).length > 0 || 
    !hasChanges || 
    updateLoading;

  // Show loading state while profile is loading
  // Requirements: 6.1
  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner message="Loading profile..." size="lg" />
      </div>
    );
  }

  // Show error if profile failed to load
  if (profileError) {
    return (
      <div className="min-h-screen bg-background dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-xl max-w-md">
          <div className="text-red-600 dark:text-red-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-text dark:text-gray-100 text-center mb-2">Error Loading Profile</h2>
          <p className="text-text-secondary dark:text-gray-400 text-center mb-4">{profileError}</p>
          <button
            onClick={handleCancel}
            className="w-full bg-primary hover:bg-primary-light dark:bg-primary-light dark:hover:bg-primary text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900">
      {/* Navigation Bar */}
      <nav className="bg-primary/90 dark:bg-primary-dark/90 backdrop-blur-md border-b border-white/20 dark:border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary dark:bg-primary-light rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white">Circl'd</h1>
            </div>
            <div className="flex items-center space-x-3">
              <ThemeToggle />
              <button
                onClick={handleCancel}
                className="bg-primary-light hover:bg-primary dark:bg-primary dark:hover:bg-primary-light text-white font-semibold px-4 py-2 rounded-lg transition-all"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border-2 border-border dark:border-gray-700 animate-scaleIn">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-primary dark:text-primary-light mb-2">
              Edit Profile
            </h2>
            <p className="text-text dark:text-gray-300">Update your profile information</p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 dark:border-green-400 p-4 rounded animate-fadeInFast">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 dark:text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-green-700 dark:text-green-300 font-medium">Profile updated successfully!</p>
              </div>
            </div>
          )}

          {/* Update Error Message */}
          {updateError && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-400 p-4 rounded animate-fadeInFast">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 dark:text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-red-700 dark:text-red-300 font-medium">{updateError}</p>
              </div>
            </div>
          )}

          {/* Photo Error Message */}
          {photoError && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-400 p-4 rounded animate-fadeInFast">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 dark:text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-red-700 dark:text-red-300 font-medium">{photoError}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <div className="space-y-6">
            {/* Profile Photo Upload */}
            <ProfilePhotoUpload
              currentPhotoUrl={newPhotoPreviewUrl || photoUrl}
              lastPhotoUpdate={profile?.lastPhotoUpdate || null}
              onPhotoUploaded={handlePhotoUploaded}
              onError={handlePhotoError}
              onPhotoPrepared={handlePhotoPrepared}
            />

            {/* First Name Field */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-text dark:text-gray-200 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="firstName"
                value={firstName}
                onChange={handleFirstNameChange}
                className={`w-full px-4 py-2 border-2 rounded-md bg-white dark:bg-gray-700 text-text dark:text-gray-100 focus:ring-2 focus:ring-accent focus:border-accent ${
                  validationErrors.firstName ? 'border-red-500' : 'border-border dark:border-gray-600'
                }`}
                placeholder="Enter your first name"
              />
              {validationErrors.firstName && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.firstName}</p>
              )}
            </div>

            {/* Last Name Field */}
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-text dark:text-gray-200 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="lastName"
                value={lastName}
                onChange={handleLastNameChange}
                className={`w-full px-4 py-2 border-2 rounded-md bg-white dark:bg-gray-700 text-text dark:text-gray-100 focus:ring-2 focus:ring-accent focus:border-accent ${
                  validationErrors.lastName ? 'border-red-500' : 'border-border dark:border-gray-600'
                }`}
                placeholder="Enter your last name"
              />
              {validationErrors.lastName && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.lastName}</p>
              )}
            </div>

            {/* Location Field */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-text dark:text-gray-200 mb-1">
                Location <span className="text-red-500">*</span>
              </label>
              
              {/* Location Cooldown Warning */}
              {locationCooldownActive && (
                <div className="mb-2 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-500 p-3 rounded">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-yellow-400 dark:text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      You can update your location in {locationCooldownRemaining}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="relative">
                <input
                  type="text"
                  id="location"
                  value={location}
                  readOnly
                  disabled={locationCooldownActive}
                  className={`w-full px-4 py-2 pr-12 border-2 rounded-md bg-white dark:bg-gray-700 text-text dark:text-gray-100 focus:ring-2 focus:ring-accent focus:border-accent disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer ${
                    validationErrors.location ? 'border-red-500' : 'border-border dark:border-gray-600'
                  }`}
                  placeholder="Click map icon to select location"
                  onClick={() => !locationCooldownActive && setShowMapPicker(true)}
                />
                <button
                  type="button"
                  onClick={() => setShowMapPicker(true)}
                  disabled={locationCooldownActive}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary dark:text-primary-light hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={locationCooldownActive ? `Location locked for ${locationCooldownRemaining}` : "Pick on map"}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </button>
              </div>
              {validationErrors.location && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.location}</p>
              )}
              <p className="mt-1 text-xs text-text-secondary dark:text-gray-400">
                {locationCooldownActive 
                  ? `Location is locked for ${locationCooldownRemaining}. You can update once every 14 days.`
                  : 'Click the map icon to pick your location on a map. You can update once every 14 days.'
                }
              </p>
            </div>

            {/* Eligible to Match Toggle */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="eligibleToMatch"
                checked={eligibleToMatch}
                onChange={handleEligibleToMatchChange}
                className="w-4 h-4 text-accent border-border dark:border-gray-600 rounded focus:ring-accent"
              />
              <label htmlFor="eligibleToMatch" className="ml-2 block text-sm text-text dark:text-gray-200">
                Eligible to match
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-4">
              <button
                onClick={handleSave}
                disabled={isSaveDisabled}
                className="flex-1 bg-accent hover:bg-accent-light disabled:bg-border dark:disabled:bg-gray-600 text-white font-medium py-3 px-6 rounded-md transition-colors disabled:cursor-not-allowed flex items-center justify-center"
              >
                {updateLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving changes...
                  </>
                ) : 'Save Changes'}
              </button>
              <button
                onClick={handleCancel}
                disabled={updateLoading}
                className="flex-1 bg-border hover:bg-border-dark dark:bg-gray-600 dark:hover:bg-gray-500 disabled:bg-border/50 dark:disabled:bg-gray-700 text-text dark:text-gray-100 font-medium py-3 px-6 rounded-md transition-colors disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
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
