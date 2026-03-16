const DEFAULT_IMAGE_FALLBACK = 'https://placehold.co/400x250/e2e8f0/64748b?text=No+Image';

/**
 * Restrict image sources to safe URL schemes and path formats.
 */
export const sanitizeImageSrc = (value, fallback = DEFAULT_IMAGE_FALLBACK) => {
  if (typeof value !== 'string') return fallback;

  const src = value.trim();
  if (!src) return fallback;

  // Allow local object URLs and data URLs generated from user-selected images.
  if (/^blob:/i.test(src)) return src;
  if (/^data:image\/[a-z0-9.+-]+;base64,[a-z0-9+/=]+$/i.test(src)) return src;

  // Allow explicit HTTP(S) URLs.
  if (/^https?:\/\//i.test(src)) return src;

  // Allow root-relative app paths.
  if (src.startsWith('/')) return src;

  // Allow plain relative asset paths and normalize with a leading slash.
  if (/^[a-z0-9._/-]+$/i.test(src) && !src.includes('..')) {
    return `/${src.replace(/^\/+/, '')}`;
  }

  return fallback;
};

export default sanitizeImageSrc;
