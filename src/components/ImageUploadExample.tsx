import { useState } from 'react';
import { uploadToCloudinary, UploadResult, UploadError } from '../utils/cloudinary';

/**
 * Example component demonstrating Cloudinary image upload integration
 * 
 * This component shows:
 * - File input integration
 * - Async/await usage pattern
 * - Error handling
 * - Upload progress states
 * - Display of uploaded image
 * 
 * Requirements: 3.4, 6.4
 */
export function ImageUploadExample() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<UploadResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle file selection from input
   */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setError(null);
    setUploadedImage(null);

    // Create preview URL for selected file
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);
  };

  /**
   * Handle image upload with error handling
   * Demonstrates async/await pattern and error handling (Requirements: 3.4, 6.4)
   */
  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Upload image with optional transformations
      const result = await uploadToCloudinary(selectedFile, {
        folder: 'example-uploads',
        transformation: {
          width: 800,
          height: 600,
          crop: 'limit'
        }
      });

      // Handle successful upload
      setUploadedImage(result);
      console.log('Upload successful:', result);
    } catch (err) {
      // Handle upload errors (Requirement: 6.4)
      const uploadError = err as UploadError;
      setError(uploadError.message || 'Upload failed. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Reset the component state
   */
  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadedImage(null);
    setError(null);
    
    // Clean up preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md border-2 border-border">
      <h2 className="text-2xl font-bold text-primary mb-4">
        Image Upload Example
      </h2>
      <p className="text-text mb-6">
        This example demonstrates how to use the uploadToCloudinary function
      </p>

      {/* File Input */}
      <div className="mb-6">
        <label htmlFor="image-upload" className="block text-sm font-medium text-text mb-2">
          Select Image
        </label>
        <input
          id="image-upload"
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileSelect}
          disabled={isUploading}
          className="block w-full text-sm text-text file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 disabled:opacity-50"
        />
      </div>

      {/* Preview */}
      {previewUrl && !uploadedImage && (
        <div className="mb-6">
          <p className="text-sm font-medium text-text mb-2">Preview:</p>
          <img
            src={previewUrl}
            alt="Preview"
            className="max-w-full h-auto rounded-lg border-2 border-border"
          />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Upload Button */}
      {selectedFile && !uploadedImage && (
        <div className="mb-6">
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full bg-primary hover:bg-primary-light disabled:bg-border disabled:bg-border/50 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            {isUploading ? 'Uploading...' : 'Upload to Cloudinary'}
          </button>
        </div>
      )}

      {/* Upload Result */}
      {uploadedImage && (
        <div className="mb-6">
          <div className="bg-accent/10 border border-accent text-accent-dark px-4 py-3 rounded-lg mb-4">
            <p className="text-sm font-semibold">Upload Successful!</p>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-text mb-2">Uploaded Image:</p>
              <img
                src={uploadedImage.url}
                alt="Uploaded"
                className="max-w-full h-auto rounded-lg border-2 border-accent"
              />
            </div>

            <div className="bg-background p-4 rounded-lg border border-border">
              <p className="text-sm font-medium text-text mb-2">Image Details:</p>
              <dl className="space-y-1 text-sm">
                <div className="flex">
                  <dt className="font-medium text-text-secondary w-24">Public ID:</dt>
                  <dd className="text-text break-all">{uploadedImage.publicId}</dd>
                </div>
                <div className="flex">
                  <dt className="font-medium text-text-secondary w-24">Dimensions:</dt>
                  <dd className="text-text">{uploadedImage.width} × {uploadedImage.height}</dd>
                </div>
                <div className="flex">
                  <dt className="font-medium text-text-secondary w-24">Format:</dt>
                  <dd className="text-text">{uploadedImage.format}</dd>
                </div>
                <div className="flex">
                  <dt className="font-medium text-text-secondary w-24">URL:</dt>
                  <dd className="text-text break-all text-xs">{uploadedImage.url}</dd>
                </div>
              </dl>
            </div>

            <button
              onClick={handleReset}
              className="w-full bg-border hover:bg-border-dark text-text font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Upload Another Image
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
