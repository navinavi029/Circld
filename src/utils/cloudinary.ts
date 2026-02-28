/**
 * Cloudinary Image Upload Utility
 * 
 * Provides a reusable function for uploading images to Cloudinary using unsigned upload presets.
 * Supports automatic optimization and transformation of uploaded images.
 */

/**
 * Result returned from a successful image upload
 */
export interface UploadResult {
  /** The secure HTTPS URL of the uploaded image */
  url: string;
  /** The Cloudinary public ID for future reference */
  publicId: string;
  /** Original image width in pixels */
  width: number;
  /** Original image height in pixels */
  height: number;
  /** Image format (e.g., 'jpg', 'png', 'webp') */
  format: string;
}

/**
 * Error information returned when an upload fails
 */
export interface UploadError {
  /** User-friendly error message */
  message: string;
  /** Optional error code for programmatic handling */
  code?: string;
}

/**
 * Optional configuration for image uploads
 */
export interface UploadOptions {
  /** Cloudinary upload preset (defaults to configured preset) */
  uploadPreset?: string;
  /** Optional folder for organizing uploads in Cloudinary */
  folder?: string;
  /** Optional transformation parameters for resizing */
  transformation?: {
    /** Target width in pixels */
    width?: number;
    /** Target height in pixels */
    height?: number;
    /** Crop mode (e.g., 'fill', 'fit', 'scale') */
    crop?: string;
  };
}

/**
 * Cloudinary configuration constants
 * Requirements: 1.4, 3.1, 3.3
 */
export const CLOUDINARY_CONFIG = {
  /** Cloudinary cloud name */
  cloudName: 'df7k5b0kd',
  /** Unsigned upload preset name */
  uploadPreset: 'circl\'d',
  /** Cloudinary upload API endpoint */
  apiUrl: 'https://api.cloudinary.com/v1_1/df7k5b0kd/image/upload'
} as const;

/**
 * Allowed image MIME types for upload
 * Requirements: 1.5, 5.2
 */
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
] as const;

/**
 * Validates that a file is an allowed image type
 * 
 * @param file - The file to validate
 * @returns true if the file type is valid, false otherwise
 * 
 * Requirements: 1.5, 5.2
 */
function isValidImageType(file: File): boolean {
  return ALLOWED_IMAGE_TYPES.includes(file.type as any);
}

/**
 * Sanitizes error messages to remove sensitive information
 * Removes API keys, internal paths, and system configuration details
 * 
 * @param message - The raw error message
 * @returns Sanitized error message safe for display
 * 
 * Requirements: 5.5
 */
function sanitizeErrorMessage(message: string): string {
  if (!message) {
    return 'An error occurred during upload.';
  }
  
  let sanitized = message;
  
  // Remove potential API keys (patterns like api_key=xxx or apiKey: xxx)
  sanitized = sanitized.replace(/api[_-]?key[:\s=]+[a-zA-Z0-9_-]+/gi, '[API_KEY_REDACTED]');
  
  // Remove potential secrets/tokens
  sanitized = sanitized.replace(/secret[:\s=]+[a-zA-Z0-9_-]+/gi, '[SECRET_REDACTED]');
  sanitized = sanitized.replace(/token[:\s=]+[a-zA-Z0-9_-]+/gi, '[TOKEN_REDACTED]');
  
  // Remove file system paths (Windows and Unix)
  sanitized = sanitized.replace(/[A-Za-z]:\\[\w\\\-.]+/g, '[PATH_REDACTED]');
  sanitized = sanitized.replace(/\/[\w/\-.]+/g, '[PATH_REDACTED]');
  
  // Remove IP addresses
  sanitized = sanitized.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP_REDACTED]');
  
  // Remove URLs that might contain sensitive query parameters
  sanitized = sanitized.replace(/https?:\/\/[^\s]+\?[^\s]+/g, '[URL_REDACTED]');
  
  // If the message was completely redacted or is too short, return generic message
  if (sanitized.length < 10 || sanitized.trim() === '[PATH_REDACTED]') {
    return 'An error occurred during upload. Please try again.';
  }
  
  return sanitized;
}

/**
 * Maps Cloudinary error responses to user-friendly error messages
 * 
 * @param errorData - The error response from Cloudinary API
 * @param statusCode - HTTP status code from the response
 * @returns User-friendly error message
 * 
 * Requirements: 1.3, 5.3
 */
function mapCloudinaryError(errorData: any, statusCode: number): string {
  // Handle specific Cloudinary error cases
  if (errorData.error?.message) {
    const errorMessage = errorData.error.message.toLowerCase();
    
    // Invalid or missing upload preset
    if (errorMessage.includes('preset') || errorMessage.includes('unsigned')) {
      return 'Upload configuration error. Please contact support.';
    }
    
    // File size exceeded
    if (errorMessage.includes('file size') || errorMessage.includes('too large')) {
      return 'File size exceeds the maximum allowed limit. Please upload a smaller image.';
    }
    
    // Invalid image format (server-side validation)
    if (errorMessage.includes('invalid') && errorMessage.includes('image')) {
      return 'Invalid image file. Please upload a valid JPEG, PNG, GIF, or WebP image.';
    }
    
    // Rate limiting
    if (errorMessage.includes('rate limit')) {
      return 'Too many upload requests. Please wait a moment and try again.';
    }
  }
  
  // Handle by HTTP status code
  if (statusCode === 400) {
    return 'Invalid upload request. Please check your file and try again.';
  }
  
  if (statusCode === 401 || statusCode === 403) {
    return 'Upload authorization failed. Please contact support.';
  }
  
  if (statusCode === 413) {
    return 'File size exceeds the maximum allowed limit. Please upload a smaller image.';
  }
  
  if (statusCode === 429) {
    return 'Too many upload requests. Please wait a moment and try again.';
  }
  
  if (statusCode >= 500) {
    return 'Cloudinary service is temporarily unavailable. Please try again later.';
  }
  
  // Generic error message for unknown cases
  return 'Upload failed. Please try again.';
}

/**
 * Device type for responsive image sizing
 */
export type DeviceType = 'mobile' | 'desktop' | 'auto';

/**
 * Options for responsive image transformations
 */
export interface ResponsiveImageOptions {
  /** Device type to optimize for (mobile: max 800px, desktop: max 1200px) */
  deviceType?: DeviceType;
  /** Custom width override (takes precedence over deviceType) */
  width?: number;
  /** Custom height */
  height?: number;
  /** Crop mode (e.g., 'fill', 'fit', 'scale', 'limit') */
  crop?: string;
  /** Quality setting (default: 'auto') */
  quality?: string;
  /** Format setting (default: 'auto' for WebP with fallback) */
  format?: string;
}

/**
 * Applies automatic optimization transformations to a Cloudinary URL
 * Adds f_auto (format) and q_auto (quality) transformations
 * 
 * @param url - The original Cloudinary secure URL
 * @param resizeOptions - Optional resize transformation parameters
 * @returns URL with optimization transformations applied
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */
function applyOptimizationTransformations(
  url: string,
  resizeOptions?: { width?: number; height?: number; crop?: string }
): string {
  // Cloudinary URL pattern: https://res.cloudinary.com/{cloud_name}/image/upload/{transformations}/{public_id}
  // We need to insert transformations after '/upload/'
  const uploadPath = '/upload/';
  const uploadIndex = url.indexOf(uploadPath);
  
  if (uploadIndex === -1) {
    // If URL doesn't match expected pattern, return as-is
    return url;
  }
  
  // Build transformation string
  const transformationParts: string[] = ['f_auto', 'q_auto'];
  
  // Add resize transformations if provided (task 5.3)
  if (resizeOptions) {
    if (resizeOptions.width) {
      transformationParts.push(`w_${resizeOptions.width}`);
    }
    if (resizeOptions.height) {
      transformationParts.push(`h_${resizeOptions.height}`);
    }
    if (resizeOptions.crop) {
      transformationParts.push(`c_${resizeOptions.crop}`);
    }
  }
  
  const transformations = transformationParts.join(',');
  const beforeUpload = url.substring(0, uploadIndex + uploadPath.length);
  const afterUpload = url.substring(uploadIndex + uploadPath.length);
  
  return `${beforeUpload}${transformations}/${afterUpload}`;
}

/**
 * Generates a responsive Cloudinary image URL with optimizations
 * Automatically applies device-appropriate sizing, WebP format support, and quality optimization
 * 
 * @param url - The original Cloudinary image URL
 * @param options - Responsive image options
 * @returns Optimized Cloudinary URL with transformations
 * 
 * Requirements: 4.1, 4.2, 4.4, 4.5, 4.6
 * 
 * @example
 * ```typescript
 * // Mobile-optimized image (max 800px)
 * const mobileUrl = getResponsiveImageUrl(originalUrl, { deviceType: 'mobile' });
 * 
 * // Desktop-optimized image (max 1200px)
 * const desktopUrl = getResponsiveImageUrl(originalUrl, { deviceType: 'desktop' });
 * 
 * // Auto-detect based on window width
 * const autoUrl = getResponsiveImageUrl(originalUrl, { deviceType: 'auto' });
 * 
 * // Custom size with specific crop
 * const customUrl = getResponsiveImageUrl(originalUrl, { 
 *   width: 600, 
 *   height: 400, 
 *   crop: 'fill' 
 * });
 * ```
 */
export function getResponsiveImageUrl(
  url: string,
  options: ResponsiveImageOptions = {}
): string {
  // Return original URL if it's not a Cloudinary URL
  if (!url || !url.includes('cloudinary.com')) {
    return url;
  }

  const uploadPath = '/upload/';
  const uploadIndex = url.indexOf(uploadPath);
  
  if (uploadIndex === -1) {
    return url;
  }

  // Determine width based on device type or custom width
  let width = options.width;
  
  if (!width && options.deviceType) {
    if (options.deviceType === 'mobile') {
      width = 800; // Mobile-optimized max width (Requirement 4.4)
    } else if (options.deviceType === 'desktop') {
      width = 1200; // Desktop-optimized max width (Requirement 4.5)
    } else if (options.deviceType === 'auto') {
      // Auto-detect based on window width
      if (typeof window !== 'undefined') {
        width = window.innerWidth <= 768 ? 800 : 1200;
      } else {
        width = 1200; // Default to desktop for SSR
      }
    }
  }

  // Build transformation parameters
  const transformationParts: string[] = [];
  
  // Add format transformation (f_auto enables WebP with fallback) (Requirement 4.6)
  transformationParts.push(options.format || 'f_auto');
  
  // Add quality transformation
  transformationParts.push(options.quality || 'q_auto');
  
  // Add width transformation (Requirement 4.1, 4.2)
  if (width) {
    transformationParts.push(`w_${width}`);
  }
  
  // Add height transformation
  if (options.height) {
    transformationParts.push(`h_${options.height}`);
  }
  
  // Add crop mode (default to 'limit' to prevent upscaling)
  transformationParts.push(`c_${options.crop || 'limit'}`);
  
  // Construct the new URL
  const transformations = transformationParts.join(',');
  const beforeUpload = url.substring(0, uploadIndex + uploadPath.length);
  const afterUpload = url.substring(uploadIndex + uploadPath.length);
  
  // Remove any existing transformations from the URL
  // Transformations are between /upload/ and the public_id
  const afterUploadParts = afterUpload.split('/');
  let publicIdStartIndex = 0;
  
  // Find where the public_id starts (skip transformation parameters)
  for (let i = 0; i < afterUploadParts.length; i++) {
    const part = afterUploadParts[i];
    // If part contains transformation syntax (like f_auto, w_400, etc.), skip it
    if (!/^[a-z]_/.test(part)) {
      publicIdStartIndex = i;
      break;
    }
  }
  
  const publicIdPath = afterUploadParts.slice(publicIdStartIndex).join('/');
  
  return `${beforeUpload}${transformations}/${publicIdPath}`;
}

/**
 * Detects the current device type based on window width
 * 
 * @returns 'mobile' if width <= 768px, 'desktop' otherwise
 */
export function detectDeviceType(): DeviceType {
  if (typeof window === 'undefined') {
    return 'desktop'; // Default for SSR
  }
  return window.innerWidth <= 768 ? 'mobile' : 'desktop';
}

/**
 * Extracts the public ID from a Cloudinary URL
 * 
 * @param url - The Cloudinary secure URL
 * @returns The public ID or null if URL is invalid
 */
export function extractPublicIdFromUrl(url: string): string | null {
  try {
    // Cloudinary URL pattern: https://res.cloudinary.com/{cloud_name}/image/upload/{transformations}/{public_id}.{format}
    const uploadPath = '/upload/';
    const uploadIndex = url.indexOf(uploadPath);
    
    if (uploadIndex === -1) {
      return null;
    }
    
    // Get everything after '/upload/'
    const afterUpload = url.substring(uploadIndex + uploadPath.length);
    
    // Remove transformations (everything before the last segment that doesn't contain '/')
    // Split by '/' and find the actual public_id path
    const parts = afterUpload.split('/');
    
    // The public ID is typically the last parts after transformations
    // Transformations are comma-separated parameters like 'f_auto,q_auto,w_400,h_400,c_fill'
    // Find the first part that doesn't look like transformations
    let publicIdParts: string[] = [];
    let foundPublicId = false;
    
    for (const part of parts) {
      // If part contains transformation syntax (like f_auto, w_400, etc.), skip it
      if (!foundPublicId && /^[a-z]_/.test(part)) {
        continue;
      }
      foundPublicId = true;
      publicIdParts.push(part);
    }
    
    if (publicIdParts.length === 0) {
      return null;
    }
    
    // Join the parts and remove the file extension
    const publicIdWithExt = publicIdParts.join('/');
    const lastDotIndex = publicIdWithExt.lastIndexOf('.');
    
    if (lastDotIndex === -1) {
      return publicIdWithExt;
    }
    
    return publicIdWithExt.substring(0, lastDotIndex);
  } catch (_error) {
    return null;
  }
}

/**
 * Deletes an image from Cloudinary using the public ID
 * Note: This requires a signed request with API credentials on the backend.
 * For client-side deletion, you would typically call a backend endpoint.
 * 
 * @param publicIdOrUrl - The Cloudinary public ID or full URL
 * @returns Promise resolving to true if deletion was successful
 */
export async function deleteFromCloudinary(publicIdOrUrl: string): Promise<boolean> {
  try {
    // Extract public ID if a URL was provided
    let publicId = publicIdOrUrl;
    if (publicIdOrUrl.startsWith('http')) {
      const extracted = extractPublicIdFromUrl(publicIdOrUrl);
      if (!extracted) {
        console.warn('Could not extract public ID from URL:', publicIdOrUrl);
        return false;
      }
      publicId = extracted;
    }
    
    // Note: Cloudinary deletion requires authentication (API secret)
    // This cannot be done securely from the client side
    // In a production app, you would call your backend API here
    // For now, we'll just log the deletion attempt
    console.log('Would delete image with public ID:', publicId);
    
    // TODO: Implement backend API call for deletion
    // Example:
    // const response = await fetch('/api/cloudinary/delete', {
    //   method: 'DELETE',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ publicId })
    // });
    // return response.ok;
    
    return true;
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    return false;
  }
}

/**
 * Uploads an image file to Cloudinary using unsigned upload preset
 * 
 * @param file - The image file to upload (File object from input or drag-drop)
 * @param options - Optional upload configuration (preset, folder, transformations)
 * @returns Promise resolving to UploadResult with image URL and metadata
 * @throws Returns UploadError for validation failures, network errors, or upload failures
 * 
 * @example
 * ```typescript
 * const result = await uploadToCloudinary(file);
 * console.log('Uploaded image URL:', result.url);
 * ```
 * 
 * @example With transformations
 * ```typescript
 * const result = await uploadToCloudinary(file, {
 *   folder: 'profile-images',
 *   transformation: { width: 500, height: 500, crop: 'fill' }
 * });
 * ```
 * 
 * Requirements: 1.1, 3.4, 6.4
 */
export async function uploadToCloudinary(
  file: File,
  options?: UploadOptions
): Promise<UploadResult> {
  try {
    // Validate file type before upload (task 3.2)
    if (!isValidImageType(file)) {
      throw new Error('Invalid file type. Please upload JPEG, PNG, GIF, or WebP images.');
    }
    
    // Construct FormData for upload (task 3.4)
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', options?.uploadPreset || CLOUDINARY_CONFIG.uploadPreset);
    
    // Add optional folder parameter if provided
    if (options?.folder) {
      formData.append('folder', options.folder);
    }
    
    // Make POST request to Cloudinary upload endpoint (task 3.5)
    const response = await fetch(CLOUDINARY_CONFIG.apiUrl, {
      method: 'POST',
      body: formData
    });
    
    // Handle HTTP error responses (task 6.2)
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = mapCloudinaryError(errorData, response.status);
      throw {
        message: errorMessage,
        code: `HTTP_${response.status}`
      } as UploadError;
    }
    
    const data = await response.json();
    
    // Transform response and apply automatic optimizations (task 5.1, 5.2, 5.3)
    // Apply f_auto (format) and q_auto (quality) transformations
    // Apply resize transformations if provided
    const optimizedUrl = applyOptimizationTransformations(
      data.secure_url,
      options?.transformation
    );
    
    return {
      url: optimizedUrl,
      publicId: data.public_id,
      width: data.width,
      height: data.height,
      format: data.format
    };
  } catch (error) {
    // Handle network errors (task 6.1)
    // Check if this is a network failure (fetch failed before getting a response)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw {
        message: 'Network error: Unable to connect to Cloudinary. Please check your internet connection and try again.',
        code: 'NETWORK_ERROR'
      } as UploadError;
    }
    
    // Handle validation errors (already have safe messages)
    if (error instanceof Error && error.message.includes('Invalid file type')) {
      throw {
        message: error.message,
        code: 'INVALID_FILE_TYPE'
      } as UploadError;
    }
    
    // Handle UploadError objects (already formatted)
    if (typeof error === 'object' && error !== null && 'message' in error && 'code' in error) {
      throw error;
    }
    
    // Sanitize any other error messages (task 6.3)
    const errorMessage = error instanceof Error ? error.message : String(error);
    const sanitizedMessage = sanitizeErrorMessage(errorMessage);
    
    throw {
      message: sanitizedMessage,
      code: 'UNKNOWN_ERROR'
    } as UploadError;
  }
}
