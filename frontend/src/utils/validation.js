export const validateArticleForm = (formData) => {
  const errors = {};
  
  if (!formData.title || !formData.title.trim()) {
    errors.title = 'Title is required';
  } else if (formData.title.length > 255) {
    errors.title = 'Title must not exceed 255 characters';
  }
  
  if (!formData.content || !formData.content.trim()) {
    errors.content = 'Content is required';
  }
  
  if (!formData.category) {
    errors.category = 'Category is required';
  }
  
  if (!formData.authorName || !formData.authorName.trim()) {
    errors.authorName = 'Author name is required';
  }
  
  if (!formData.tags || formData.tags.length === 0) {
    errors.tags = 'At least one tag is required';
  }
  
  if (formData.image && formData.image.size) {
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (formData.image.size > maxSize) {
      errors.image = 'Image size must not exceed 5MB';
    }
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(formData.image.type)) {
      errors.image = 'Image must be JPEG, PNG, or JPG format';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return 'Email is required';
  if (!emailRegex.test(email)) return 'Invalid email format';
  if (!email.endsWith('@laverdad.edu.ph')) return 'Only @laverdad.edu.ph emails are allowed';
  return null;
};

export const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
  return null;
};
