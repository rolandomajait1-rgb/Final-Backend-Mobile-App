/**
 * Debounce utility to prevent excessive function calls
 * Useful for search, API calls, etc.
 */

export const debounce = (func, delay = 500) => {
  let timeoutId;
  
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

/**
 * Throttle utility to limit function calls
 * Useful for scroll events, resize, etc.
 */
export const throttle = (func, limit = 500) => {
  let inThrottle;
  
  return (...args) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};
