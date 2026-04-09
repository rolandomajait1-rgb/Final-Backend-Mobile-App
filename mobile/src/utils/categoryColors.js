// Category color mapping based on Tailwind colors
export const categoryColors = {
  'news': '#2563eb',      // blue-600
  'sports': '#dc2626',    // red-600
  'opinion': '#4b5563',   // gray-600
  'literary': '#16a34a',  // green-600
  'features': '#ca8a04',  // yellow-600
  'specials': '#4f46e5',  // indigo-600
  'art': '#9333ea',       // purple-600
};

// Get color for a category (case-insensitive)
export const getCategoryColor = (categoryName) => {
  if (!categoryName) return '#6b7280'; // gray-500 as default
  const normalized = categoryName.toLowerCase();
  return categoryColors[normalized] || '#6b7280';
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
