/**
 * Direct Cloudinary Upload Service
 * Uploads images directly from mobile to Cloudinary without going through backend
 */

const CLOUDINARY_CLOUD_NAME = 'da9wvkqcl';
const CLOUDINARY_UPLOAD_PRESET = 'mobile_articles'; // Create this in Cloudinary dashboard as unsigned preset

/**
 * Upload image directly to Cloudinary
 * @param {string} imageUri - Local image URI from ImagePicker
 * @returns {Promise<string>} - Cloudinary image URL
 */
export const uploadImageToCloudinary = async (imageUri) => {
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
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Cloudinary upload failed:', error);
      throw new Error(error.error?.message || 'Upload failed');
    }
    
    const data = await response.json();
    console.log('Cloudinary upload success:', data.secure_url);
    
    return data.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};
