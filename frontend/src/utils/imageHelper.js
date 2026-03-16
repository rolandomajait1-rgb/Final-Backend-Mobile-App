import { API_BASE_URL } from './apiConfig';

export const getAssetUrl = (filename) => {
  if (!filename) return null;
  return `/images/${filename}`;
};

export const getStorageUrl = (path) => {
  if (!path) return 'https://placehold.co/400x250/e2e8f0/64748b?text=No+Image';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path.replace('http://localhost:8000', API_BASE_URL);
  }
  return `${API_BASE_URL}${path}`;
};

export const getPlaceholderUrl = (text = 'No Image', width = 400, height = 250) =>
  `https://placehold.co/${width}x${height}/e2e8f0/64748b?text=${encodeURIComponent(text)}`;

export const getAvatarUrl = (avatarUrl, name = 'User') =>
  avatarUrl
    ? getStorageUrl(avatarUrl)
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D47A1&color=fff&size=128`;

export default { getAssetUrl, getStorageUrl, getPlaceholderUrl, getAvatarUrl };
