import { BASE_URL } from '../constants/config';
const FALLBACK = 'https://via.placeholder.com/400x300/e2e8f0/64748b?text=No+Image';

/**
 * Ensures an image path is a valid URI for React Native.
 * Handles Cloudinary URLs, local file URIs, relative storage paths, and fallbacks.
 */
export const getImageUri = (image) => {
  if (!image) return FALLBACK;

  // If it's already a full URL (http/https) or local file URI (file://), return it
  if (image.startsWith('http') || image.startsWith('file://') || image.startsWith('content://')) {
    return image;
  }

  // If it's a relative path from the backend storage
  // Prepend base URL and storage prefix if needed
  const cleanPath = image.startsWith('/') ? image : `/${image}`;
  
  // Checking if 'storage' is already in the path
  if (cleanPath.startsWith('/storage/')) {
    return `${BASE_URL}${cleanPath}`;
  }

  return `${BASE_URL}/storage${cleanPath}`;
};
