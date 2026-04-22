/**
 * Direct Cloudinary Upload Service
 * Uploads images directly from mobile to Cloudinary without going through backend
 */

const CLOUDINARY_CLOUD_NAME = 'da9wvkqcl';
const CLOUDINARY_UPLOAD_PRESET = 'mobile_articles'; // Create this in Cloudinary dashboard as unsigned preset

/**
 * Upload image directly to Cloudinary with progress tracking
 * @param {string} imageUri - Local image URI from ImagePicker
 * @param {Function} onProgress - Callback for upload progress (0-100)
 * @returns {Promise<string>} - Cloudinary image URL
 */
export const uploadImageToCloudinary = async (imageUri, onProgress = null) => {
  try {
    console.log('Uploading image to Cloudinary:', imageUri);
    
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: `article-${Date.now()}.jpg`,
    });
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'articles');
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            onProgress(percentComplete);
          }
        });
      }
      
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText);
          console.log('Cloudinary upload success:', data.secure_url);
          resolve(data.secure_url);
        } else {
          const error = JSON.parse(xhr.responseText);
          console.error('Cloudinary upload failed:', error);
          reject(new Error(error.error?.message || 'Upload failed'));
        }
      });
      
      xhr.addEventListener('error', () => {
        console.error('Network error during upload');
        reject(new Error('Network error during upload'));
      });
      
      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'));
      });
      
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`);
      xhr.send(formData);
    });
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};
