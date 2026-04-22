/**
 * Central app configuration constants.
 * All environment-sensitive values should be sourced here.
 * Issue #5 Fix: Single source of truth for BASE_URL.
 */

export const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  'https://final-backend-mobile-app-2-4sfz.onrender.com';

export const API_URL = `${BASE_URL}/api`;

export const CLOUDINARY_CLOUD_NAME = 'da9wvkqcl';
export const CLOUDINARY_UPLOAD_PRESET = 'mobile_articles';
