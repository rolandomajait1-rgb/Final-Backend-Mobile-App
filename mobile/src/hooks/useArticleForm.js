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
        // Optional step, but validate if image is provided
        break;
      case 3: // Content
        if (!formData.content.trim()) newErrors.content = 'Content is required';
        break;
      case 4: // Review
        // Final validation
        if (!formData.title.trim()) newErrors.title = 'Title is required';
        if (!formData.category) newErrors.category = 'Category is required';
        if (!formData.author.trim()) newErrors.author = 'Author is required';
        if (!formData.content.trim()) newErrors.content = 'Content is required';
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
