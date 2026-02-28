import { useState, useEffect, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Timestamp } from 'firebase/firestore';

/**
 * Props for the ProfilePhotoUpload component
 */
export interface ProfilePhotoUploadProps {
  /** Current profile photo URL, or null if no photo exists */
  currentPhotoUrl: string | null;
  /** Last time the photo was updated */
  lastPhotoUpdate: Timestamp | null;
  /** Callback invoked when a photo is selected and cropped (passes local preview URL) */
  onPhotoUploaded: (url: string) => void;
  /** Callback invoked when an upload error occurs */
  onError: (error: string) => void;
  /** Callback to provide the cropped image blob for upload */
  onPhotoPrepared?: (blob: Blob | null, fileName: string | null) => void;
}

/**
 * Crop area from react-easy-crop
 */
interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Creates a cropped image from the original file
 */
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas is empty'));
        return;
      }
      resolve(blob);
    }, 'image/jpeg', 0.95);
  });
}

/**
 * Creates an image element from a URL
 */
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });
}

/**
 * Checks if the user can update their photo (2-week cooldown)
 */
function canUpdatePhoto(lastPhotoUpdate: Timestamp | null): boolean {
  if (!lastPhotoUpdate) return true;
  
  const twoWeeksInMs = 14 * 24 * 60 * 60 * 1000;
  const lastUpdateTime = lastPhotoUpdate.toMillis();
  const now = Date.now();
  
  return (now - lastUpdateTime) >= twoWeeksInMs;
}

/**
 * Gets the remaining time until the user can update their photo again
 */
function getRemainingCooldown(lastPhotoUpdate: Timestamp | null): string {
  if (!lastPhotoUpdate) return '';
  
  const twoWeeksInMs = 14 * 24 * 60 * 60 * 1000;
  const lastUpdateTime = lastPhotoUpdate.toMillis();
  const now = Date.now();
  const remaining = twoWeeksInMs - (now - lastUpdateTime);
  
  if (remaining <= 0) return '';
  
  const days = Math.ceil(remaining / (24 * 60 * 60 * 1000));
  return `${days} day${days !== 1 ? 's' : ''}`;
}

/**
 * ProfilePhotoUpload Component
 * 
 * Handles profile photo selection with preview and cropping functionality.
 * The photo is NOT uploaded immediately - it's held locally until the parent
 * form is submitted (when "Save Changes" is clicked).
 * Enforces a 2-week cooldown period between photo updates.
 * 
 * Features:
 * - File input for selecting images
 * - Image cropping with preview
 * - 2-week cooldown period enforcement
 * - Local preview without immediate upload
 * - Error handling and display
 * - Automatic cleanup of preview URLs
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7
 */
export function ProfilePhotoUpload({
  currentPhotoUrl,
  lastPhotoUpdate,
  onError,
  onPhotoPrepared
}: ProfilePhotoUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Cropping state
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);

  // Check if user can update photo
  const canUpdate = canUpdatePhoto(lastPhotoUpdate);
  const remainingCooldown = getRemainingCooldown(lastPhotoUpdate);

  /**
   * Clean up preview URLs on unmount
   * Requirements: 3.7
   */
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      if (croppedImageUrl) {
        URL.revokeObjectURL(croppedImageUrl);
      }
    };
  }, [previewUrl, croppedImageUrl]);

  /**
   * Handle crop complete
   */
  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  /**
   * Handle file selection from input
   * Requirements: 3.2, 3.3, 3.4
   */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('File selected:', file.name, file.type);

    // Check cooldown period
    if (!canUpdate) {
      onError(`You can only update your profile photo once every 2 weeks. Please wait ${remainingCooldown} before updating again.`);
      e.target.value = '';
      return;
    }

    // Clean up previous preview URLs
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    if (croppedImageUrl) {
      URL.revokeObjectURL(croppedImageUrl);
    }

    // Validate file type before generating preview
    // Requirements: 3.2, 3.3
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      onError('Invalid file type. Please upload JPEG, PNG, GIF, or WebP images.');
      setSelectedFile(null);
      setPreviewUrl(null);
      e.target.value = '';
      return;
    }

    setSelectedFile(file);

    // Generate preview URL using URL.createObjectURL
    // Requirements: 3.4
    const preview = URL.createObjectURL(file);
    console.log('Preview URL created:', preview);
    setPreviewUrl(preview);
    console.log('Setting showCropper to true');
    setShowCropper(true);
    setCroppedImageUrl(null);
  };

  /**
   * Handle crop confirmation - stores cropped image locally
   */
  const handleCropConfirm = async () => {
    if (!previewUrl || !croppedAreaPixels || !selectedFile) return;

    try {
      const croppedBlob = await getCroppedImg(previewUrl, croppedAreaPixels);
      
      // Create a URL for preview
      const croppedUrl = URL.createObjectURL(croppedBlob);
      setCroppedImageUrl(croppedUrl);
      
      // Don't update parent's photoUrl yet - just provide the blob for later upload
      // The parent will handle uploading and updating the photoUrl
      
      // Provide the blob to parent for later upload
      if (onPhotoPrepared) {
        onPhotoPrepared(croppedBlob, selectedFile.name);
      }
      
      setShowCropper(false);
    } catch (_error) {
      onError('Failed to crop image. Please try again.');
    }
  };

  /**
   * Handle crop cancel
   */
  const handleCropCancel = () => {
    setShowCropper(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    if (croppedImageUrl) {
      URL.revokeObjectURL(croppedImageUrl);
      setCroppedImageUrl(null);
    }
  };

  // Determine which photo to display
  const displayPhotoUrl = croppedImageUrl || currentPhotoUrl;

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-text dark:text-gray-200">
        Profile Photo
      </label>

      {/* Cooldown Warning */}
      {!canUpdate && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-500 p-3 rounded">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-400 dark:text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              You can update your profile photo in {remainingCooldown}
            </p>
          </div>
        </div>
      )}

      {/* Cropper Modal */}
      {showCropper && previewUrl && (
        <div className="fixed inset-0 bg-black/75 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6">
            <h3 className="text-lg font-semibold mb-4 text-text dark:text-gray-100">Crop Your Photo</h3>
            
            <div className="relative w-full h-96 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
              <Cropper
                image={previewUrl}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-text dark:text-gray-200 mb-2">
                Zoom
              </label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-accent"
              />
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCropConfirm}
                className="flex-1 bg-accent hover:bg-accent-light active:bg-accent-dark text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Confirm Crop
              </button>
              <button
                onClick={handleCropCancel}
                className="flex-1 bg-border hover:bg-border-dark dark:bg-gray-600 dark:hover:bg-gray-500 text-text dark:text-gray-100 font-medium py-2 px-4 rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Display */}
      <div className="flex items-center space-x-6">
        <div className="flex-shrink-0">
          {displayPhotoUrl ? (
            <img
              src={displayPhotoUrl}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-2 border-border dark:border-gray-600"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-2 border-border dark:border-gray-600">
              <svg
                className="w-12 h-12 text-gray-400 dark:text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* File Input */}
        <div className="flex-1">
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileSelect}
            disabled={!canUpdate}
            className="block w-full text-sm text-text-secondary dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 dark:file:bg-primary-light/20 file:text-primary dark:file:text-primary-light hover:file:bg-primary/20 dark:hover:file:bg-primary-light/30 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-text-secondary dark:text-gray-400">
            JPEG, PNG, GIF, or WebP. Max 10MB. Photo will be uploaded when you click "Save Changes".
          </p>
        </div>
      </div>
    </div>
  );
}
