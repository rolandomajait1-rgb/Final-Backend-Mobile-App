import { Platform } from 'react-native';

const CLOUDINARY_CLOUD_NAME = 'da9wvkqcl';
const CLOUDINARY_UPLOAD_PRESET = 'mobile_articles';

/**
 * Upload image directly to Cloudinary using fetch (NOT axios).
 * Axios has a known React Native bug where multipart/form-data throws
 * "Network Error" even when credentials and connectivity are valid.
 * fetch() handles RN FormData correctly.
 *
 * @param {string} imageUri - Local image URI from ImagePicker
 * @param {Function} onProgress - Callback for upload progress (0-100) [simulated]
 * @returns {Promise<string>} - Cloudinary secure_url
 */
export const uploadImageToCloudinary = async (imageUri, onProgress = null) => {
  // Declare outside try so finally can always clear it
  let progressInterval = null;

  try {
    console.log('[Cloudinary] Starting upload:', imageUri);
    console.log('[Cloudinary] Cloud name:', CLOUDINARY_CLOUD_NAME);
    console.log('[Cloudinary] Upload preset:', CLOUDINARY_UPLOAD_PRESET);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

    // Determine file extension and MIME type
    const filename = imageUri.split('/').pop() || `upload-${Date.now()}.jpg`;
    const match = /\.(\w+)$/.exec(filename.toLowerCase());
    let type = 'image/jpeg';
    if (match) {
      if (match[1] === 'png')  type = 'image/png';
      else if (match[1] === 'gif')  type = 'image/gif';
      else if (match[1] === 'webp') type = 'image/webp';
    }

    // iOS: strip file:// prefix — Android keeps content:// or file:// as-is
    const cleanUri = Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri;

    console.log('[Cloudinary] File info:', { cleanUri, type, filename });

    const formData = new FormData();
    formData.append('file', { uri: cleanUri, type, name: filename });
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'presshub');

    // Simulate upload progress with a plain counter (fetch has no native progress events)
    // onProgress is a plain callback (not a React setState), so pass direct values.
    if (onProgress) {
      let currentProgress = 10;
      onProgress(currentProgress);
      progressInterval = setInterval(() => {
        currentProgress = Math.min(currentProgress + 15, 85);
        onProgress(currentProgress);
      }, 500);
    }

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
      // Do NOT set Content-Type manually — fetch auto-sets it with the correct boundary
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Cloudinary] Upload rejected by server:', JSON.stringify(data, null, 2));
      const cloudinaryMsg = data?.error?.message || `HTTP ${response.status}`;
      throw new Error(`Cloudinary rejected upload: ${cloudinaryMsg}`);
    }

    if (onProgress) onProgress(100);
    console.log('[Cloudinary] Upload success:', data.secure_url);
    return data.secure_url;

  } catch (error) {
    console.error('[Cloudinary] Upload failed:', error.message);
    throw new Error(error.message || 'Image upload failed. Please check your internet connection.');
  } finally {
    // Always clear the interval — whether upload succeeded, failed, or timed out
    if (progressInterval !== null) {
      clearInterval(progressInterval);
    }
  }
};
