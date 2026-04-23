/**
 * Sanitized logging utility to prevent token exposure in logs
 * Bug Fix: Security #1 - Token Exposure in Logs
 */

/**
 * Sanitize error object to remove sensitive information
 * @param {Error} error - Error object to sanitize
 * @returns {Object} Sanitized error object
 */
export const sanitizeError = (error) => {
  if (!error) return error;
  
  const sanitized = { ...error };
  
  // Remove sensitive headers
  if (sanitized.config?.headers) {
    const headers = { ...sanitized.config.headers };
    if (headers.Authorization) {
      headers.Authorization = '[REDACTED]';
    }
    if (headers.authorization) {
      headers.authorization = '[REDACTED]';
    }
    sanitized.config.headers = headers;
  }
  
  // Remove sensitive request data
  if (sanitized.config?.data) {
    try {
      const data = typeof sanitized.config.data === 'string' 
        ? JSON.parse(sanitized.config.data) 
        : sanitized.config.data;
      
      if (data.password) data.password = '[REDACTED]';
      if (data.password_confirmation) data.password_confirmation = '[REDACTED]';
      if (data.token) data.token = '[REDACTED]';
      if (data.refresh_token) data.refresh_token = '[REDACTED]';
      
      sanitized.config.data = JSON.stringify(data);
    } catch {
      // Data is not JSON or FormData, leave as is
    }
  }
  
  // Remove sensitive response data
  if (sanitized.response?.data) {
    const responseData = { ...sanitized.response.data };
    if (responseData.token) responseData.token = '[REDACTED]';
    if (responseData.refresh_token) responseData.refresh_token = '[REDACTED]';
    sanitized.response.data = responseData;
  }
  
  return sanitized;
};

/**
 * Log error with sanitization in production
 * @param {string} message - Error message
 * @param {Error} error - Error object
 */
export const logError = (message, error) => {
  if (__DEV__) {
    // In development, log full error for debugging
    console.error(message, error);
  } else {
    // In production, sanitize sensitive data
    console.error(message, sanitizeError(error));
  }
};

/**
 * Log warning with sanitization in production
 * @param {string} message - Warning message
 * @param {any} data - Data to log
 */
export const logWarning = (message, data) => {
  if (__DEV__) {
    console.warn(message, data);
  } else {
    console.warn(message, typeof data === 'object' ? sanitizeError(data) : data);
  }
};

/**
 * Log info (no sanitization needed for info logs)
 * @param {string} message - Info message
 * @param {any} data - Data to log
 */
export const logInfo = (message, data) => {
  console.log(message, data);
};
