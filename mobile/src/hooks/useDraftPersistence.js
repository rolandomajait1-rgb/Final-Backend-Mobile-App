import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DRAFT_KEY = '@article_draft';
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

export const useDraftPersistence = (formData, isModified) => {
  const autoSaveTimerRef = useRef(null);
  const mountedRef = useRef(true); // Bug #9 Fix: Track mounted state

  // Auto-save draft
  useEffect(() => {
    if (!isModified) return;

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set new timer
    autoSaveTimerRef.current = setTimeout(async () => {
      // Bug #9 Fix: Only save if component is still mounted
      if (mountedRef.current) {
        try {
          await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
          console.log('Draft auto-saved');
        } catch (error) {
          console.error('Failed to save draft:', error);
        }
      }
    }, AUTO_SAVE_INTERVAL);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [formData, isModified]);

  // Bug #9 Fix: Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  // Load draft on mount
  const loadDraft = async () => {
    try {
      const draft = await AsyncStorage.getItem(DRAFT_KEY);
      return draft ? JSON.parse(draft) : null;
    } catch (error) {
      console.error('Failed to load draft:', error);
      return null;
    }
  };

  // Clear draft
  const clearDraft = async () => {
    try {
      await AsyncStorage.removeItem(DRAFT_KEY);
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  };

  return { loadDraft, clearDraft };
};
