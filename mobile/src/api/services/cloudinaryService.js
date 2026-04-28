import * as FileSystem from 'expo-file-system';

const CLOUDINARY_CLOUD_NAME = 'da9wvkqcl';
const CLOUDINARY_UPLOAD_PRESET = 'mobile_articles';

/**
 * Upload image to Cloudinary using expo-file-system's uploadAsync.
 *
 * Why uploadAsync instead of fetch/axios:
 * - axios: throws "Network Error" on multipart/form-data in React Native (known bug)
 * - fetch + FormData: inconsistent file URI handling across Android versions
 * - FileSystem.uploadAsync: uses native HTTP multipart upload — the correct Expo approach
 *
 * @param {string} imageUri - Local image URI from ImagePicker / ImageManipulator
 * @param {Function} onProgress - Optional callback for progress (0-100) [simulated]
 * @returns {Promise<string>} - Cloudinary secure_url
 */
export const uploadImageToCloudinary = async (imageUri, onProgress = null) => {
  let progressInterval = null;

  try {
    console.log('[Cloudinary] Starting upload:', imageUri);
    console.log('[Cloudinary] Cloud:', CLOUDINARY_CLOUD_NAME, '| Preset:', CLOUDINARY_UPLOAD_PRESET);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

    // Simulate progress (FileSystem.uploadAsync doesn't expose native progress)
    if (onProgress) {
      let current = 10;
      onProgress(current);
      progressInterval = setInterval(() => {
        current = Math.min(current + 15, 85);
        onProgress(current);
      }, 500);
    }

    const result = await FileSystem.uploadAsync(uploadUrl, imageUri, {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: 'file',
      parameters: {
        upload_preset: CLOUDINARY_UPLOAD_PRESET,
        folder: 'presshub',
      },
      mimeType: 'image/jpeg',
    });

    console.log('[Cloudinary] HTTP status:', result.status);

    const data = JSON.parse(result.body);

    if (result.status < 200 || result.status >= 300) {
      console.error('[Cloudinary] Upload rejected:', JSON.stringify(data, null, 2));
      const msg = data?.error?.message || `HTTP ${result.status}`;
      throw new Error(`Cloudinary rejected upload: ${msg}`);
    }

    if (!data.secure_url) {
      throw new Error('Cloudinary returned no URL in response');
    }

    if (onProgress) onProgress(100);
    console.log('[Cloudinary] Upload success:', data.secure_url);
    return data.secure_url;

  } catch (error) {
    console.error('[Cloudinary] Upload failed:', error.message);
    throw new Error(error.message || 'Image upload failed. Please check your internet connection.');
  } finally {
    if (progressInterval !== null) {
      clearInterval(progressInterval);
    }
  }
};
