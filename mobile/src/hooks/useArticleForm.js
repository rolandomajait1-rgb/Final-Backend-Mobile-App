import { useState, useCallback } from 'react';

const initialState = {
  title: '',
  category: null,
  author: '',
  tags: [],
  coverImage: null,
  content: '',
  status: 'draft',
};

export const useArticleForm = () => {
  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState({});

  const updateField = useCallback((field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
  }, [errors]);

  const validateStep = useCallback((step) => {
    const newErrors = {};

    switch (step) {
      case 1: // Basic Info
        if (!formData.title.trim()) newErrors.title = 'Title is required';
        if (!formData.category) newErrors.category = 'Category is required';
        if (!formData.author.trim()) newErrors.author = 'Author is required';
        break;
      case 2: // Media
        // Bug #16 Fix: Add validation for cover image if required by business logic
        // Currently optional - uncomment if image becomes required
        // if (!formData.coverImage) newErrors.coverImage = 'Cover image is required';
        break;
      case 3: // Content
        if (!formData.content.trim()) newErrors.content = 'Content is required';
        // Bug #16 Fix: Add minimum content length validation
        else if (formData.content.trim().length < 50) {
          newErrors.content = 'Content must be at least 50 characters';
        }
        break;
      case 4: // Review
        // Final validation - check all required fields
        if (!formData.title.trim()) newErrors.title = 'Title is required';
        if (!formData.category) newErrors.category = 'Category is required';
        if (!formData.author.trim()) newErrors.author = 'Author is required';
        if (!formData.content.trim()) newErrors.content = 'Content is required';
        else if (formData.content.trim().length < 50) {
          newErrors.content = 'Content must be at least 50 characters';
        }
        // Bug #16 Fix: Validate tags if they exist
        if (formData.tags && formData.tags.length > 10) {
          newErrors.tags = 'Maximum 10 tags allowed';
        }
        break;
      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const reset = useCallback(() => {
    setFormData(initialState);
    setErrors({});
  }, []);

  return {
    formData,
    errors,
    updateField,
    validateStep,
    reset,
    setFormData,
  };
};
