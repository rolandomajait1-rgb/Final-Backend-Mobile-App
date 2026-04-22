/**
 * Category constants
 * Use these instead of hardcoding category names
 */

export const ALLOWED_CATEGORIES = [
  'News',
  'Literary',
  'Opinion',
  'Sports',
  'Features',
  'Specials',
  'Art',
];

export const CATEGORY_COLORS = {
  News: '#3b82f6',
  Literary: '#4ade80',
  Opinion: '#6b7280',
  Sports: '#ef4444',
  Features: '#f59e0b',
  Specials: '#a855f7',
  Art: '#06b6d4',
};

export const getCategoryColor = (categoryName) => {
  return CATEGORY_COLORS[categoryName] || '#6b7280';
};
