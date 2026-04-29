import { Platform } from 'react-native';

const CLOUDINARY_CLOUD_NAME = 'da9wvkqcl';
const CLOUDINARY_UPLOAD_PRESET = 'mobile_articles';

export const uploadImageToCloudinary = (imageUri, onProgress = null) => {
  return new Promise((resolve, reject) => {
    try {
      console.log('[Cloudinary] Starting upload:', imageUri);
      const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

      const filename = imageUri.split('/').pop() || `upload-${Date.now()}.jpg`;
      let type = 'image/jpeg';
      if (filename.toLowerCase().endsWith('.png')) type = 'image/png';
      else if (filename.toLowerCase().endsWith('.gif')) type = 'image/gif';
      else if (filename.toLowerCase().endsWith('.webp')) type = 'image/webp';

      const cleanUri = Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri;

      const formData = new FormData();
      formData.append('file', { uri: cleanUri, type, name: filename });
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', 'presshub');

      const xhr = new XMLHttpRequest();
      
      // FIX: React Native's fetch throws "Network request failed" exactly after 10 seconds
      // because OkHttp times out. XHR lets us increase the timeout to 60 seconds.
      xhr.timeout = 60000;

      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded * 100) / event.total);
            onProgress(Math.min(progress, 99)); // Cap at 99 until finished
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (onProgress) onProgress(100);
            console.log('[Cloudinary] Upload success:', data.secure_url);
            resolve(data.secure_url);
          } catch (e) {
            reject(new Error('Invalid response from Cloudinary'));
          }
        } else {
          try {
            const data = JSON.parse(xhr.responseText);
            console.error('[Cloudinary] Upload rejected:', JSON.stringify(data, null, 2));
            reject(new Error(data.error?.message || `HTTP ${xhr.status}`));
          } catch (e) {
            reject(new Error(`HTTP Error ${xhr.status}`));
          }
        }
      });

      xhr.addEventListener('error', () => {
        console.error('[Cloudinary] XHR Network Error');
        reject(new Error('Network request failed. Please check your internet connection.'));
      });

      xhr.addEventListener('timeout', () => {
        console.error('[Cloudinary] XHR Timeout (took more than 60s)');
        reject(new Error('Upload timed out. Please try again on a faster connection.'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload aborted'));
      });

      xhr.open('POST', uploadUrl, true);
      // Let XHR automatically set Content-Type so boundary isn't lost
      xhr.send(formData);

    } catch (error) {
      reject(error);
    }
  });
};


