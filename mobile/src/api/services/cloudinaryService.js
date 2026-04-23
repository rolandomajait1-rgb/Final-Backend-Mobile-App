import * as FileSystem from 'expo-file-system/legacy';

const CLOUDINARY_CLOUD_NAME = 'da9wvkqcl';
const CLOUDINARY_UPLOAD_PRESET = 'mobile_articles';

/**
 * Upload image directly to Cloudinary with progress tracking
 * @param {string} imageUri - Local image URI from ImagePicker
 * @param {Function} onProgress - Callback for upload progress (0-100)
 * @returns {Promise<string>} - Cloudinary image URL
 */
export const uploadImageToCloudinary = async (imageUri, onProgress = null) => {
  try {
    console.log('Uploading image to Cloudinary using FileSystem.uploadAsync:', imageUri);
    
    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
    
    const uploadTask = FileSystem.createUploadTask(
      uploadUrl,
      imageUri,
      {
        httpMethod: 'POST',
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: 'file',
        parameters: {
          upload_preset: CLOUDINARY_UPLOAD_PRESET,
          folder: 'articles',
        },
      },
      (data) => {
        if (onProgress && data.totalBytesExpectedToSend > 0) {
          const progress = (data.totalBytesSent / data.totalBytesExpectedToSend) * 100;
          onProgress(progress);
        }
      }
    );

    const response = await uploadTask.uploadAsync();
    
    if (response.status === 200 || response.status === 201) {
      const data = JSON.parse(response.body);
      console.log('Cloudinary upload success:', data.secure_url);
      return data.secure_url;
    } else {
      let errorMessage = 'Upload failed';
      try {
        const errorData = JSON.parse(response.body);
        errorMessage = errorData.error?.message || `Status ${response.status}`;
      } catch {
        errorMessage = `Status ${response.status}`;
      }
      console.error('Cloudinary upload failed:', errorMessage);
      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};
