export const handleApiError = (error, defaultMessage = 'An error occurred') => {
  if (error.response) {
    const { status, data } = error.response;
    if (status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_email');
      localStorage.removeItem('user_role');
      window.location.href = '/login';
      return 'Session expired. Please login again.';
    }
    if (status === 403) return data.message || 'You do not have permission to perform this action.';
    if (status === 404) return data.message || 'The requested resource was not found.';
    if (status === 422 && data.errors) return Object.values(data.errors).flat().join(', ');
    if (data.message) return data.message;
    if (data.error) return data.error;
  }
  if (error.message) return error.message;
  return defaultMessage;
};

export const logError = (context, error) => {
  console.error(`[${context}]`, error);
  if (error.response) {
    console.error('Response data:', error.response.data);
    console.error('Response status:', error.response.status);
  }
};
