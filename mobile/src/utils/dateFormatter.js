/**
 * Standardized date formatting utility
 * Use this across all screens for consistent date display
 */

export const formatDate = (dateString, format = 'short') => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  switch (format) {
    case 'short':
      // "Apr 18, 2026"
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    
    case 'long':
      // "April 18, 2026"
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    
    case 'time':
      // "8:58 AM"
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    
    case 'datetime':
      // "Apr 18, 2026, 8:58 AM"
      return `${formatDate(dateString, 'short')}, ${formatDate(dateString, 'time')}`;
    
    case 'full':
      // "April 18, 2026 at 8:58 AM"
      return `${formatDate(dateString, 'long')} at ${formatDate(dateString, 'time')}`;
    
    default:
      return date.toLocaleDateString();
  }
};

export const formatDateWithTime = (dateString) => {
  return formatDate(dateString, 'datetime');
};

export const formatDateFull = (dateString) => {
  return formatDate(dateString, 'full');
};
