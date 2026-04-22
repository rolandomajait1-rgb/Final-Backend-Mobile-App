/**
 * Utility functions for date formatting
 */

/**
 * Formats an article date to a standardized string
 * Example: "Apr 22, 2026, 07:03 PM"
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date string
 */
export const formatArticleDate = (date) => {
  if (!date) return 'Recently';
  
  try {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Recently';
  }
};

/**
 * Formats time elapsed since the given date
 * @param {string|Date} dateString - The date to format
 * @returns {string} e.g. "5 min ago", "2 hr ago", "3 days ago"
 */
export const formatTimeAgo = (dateString) => {
  if (!dateString) return 'Unknown';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  
  if (isNaN(diffMs)) return 'Unknown';
  
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hr ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};
