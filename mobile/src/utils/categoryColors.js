export const categoryColors = {
  'news': '#3b82f6',      // blue-500
  'sports': '#ef4444',    // red-500
  'opinion': '#6b7280',   // gray-500
  'literary': '#10b981',  // green-500
  'features': '#f59e0b',  // amber-500
  'specials': '#6366f1',  // indigo-500
  'art': '#c026d3',       // fuchsia-600
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
