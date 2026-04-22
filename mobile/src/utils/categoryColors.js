import { CATEGORY_COLORS, getCategoryColor as getCentralizedColor } from '../constants/categories';

export const categoryColors = CATEGORY_COLORS;

// Get color for a category (case-insensitive)
export const getCategoryColor = (categoryName) => {
  if (!categoryName) return '#6b7280';
  // Attempt to get color using the centralized function
  return getCentralizedColor(categoryName);
};

// Get Tailwind class for category background (for NativeWind)
export const getCategoryBgClass = (categoryName) => {
  if (!categoryName) return 'bg-gray-500';
  const normalized = categoryName.toLowerCase();
  const classMap = {
    'news': 'bg-blue-600',
    'sports': 'bg-red-600',
    'opinion': 'bg-gray-600',
    'literary': 'bg-green-600',
    'features': 'bg-yellow-600',
    'specials': 'bg-indigo-600',
    'art': 'bg-purple-600',
  };
  return classMap[normalized] || 'bg-gray-500';
};
