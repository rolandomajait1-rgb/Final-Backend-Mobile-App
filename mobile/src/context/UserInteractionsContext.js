import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserInteractions } from '../api/services/articleService';

const UserInteractionsContext = createContext();

// Cache TTL: 5 minutes
const CACHE_TTL = 5 * 60 * 1000;
// Batch delay: 500ms (collect article IDs before fetching)
const BATCH_DELAY = 500;

export const UserInteractionsProvider = ({ children }) => {
  const [likedArticles, setLikedArticles] = useState(new Set());
  const [sharedArticles, setSharedArticles] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  
  // Cache management
  const lastSyncTime = useRef(0);
  const pendingArticleIds = useRef(new Set());
  const batchTimeoutRef = useRef(null);
  const isSyncing = useRef(false);

  // Load interactions from AsyncStorage on mount
  useEffect(() => {
    loadInteractionsFromStorage();
    
    // Cleanup on unmount
    return () => {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
    };
  }, []);

  const loadInteractionsFromStorage = async () => {
    try {
      const [liked, shared, syncTime] = await Promise.all([
        AsyncStorage.getItem('liked_articles'),
        AsyncStorage.getItem('shared_articles'),
        AsyncStorage.getItem('interactions_sync_time'),
      ]);

      if (liked) {
        setLikedArticles(new Set(JSON.parse(liked)));
      }
      if (shared) {
        setSharedArticles(new Set(JSON.parse(shared)));
      }
      if (syncTime) {
        lastSyncTime.current = parseInt(syncTime, 10);
      }
    } catch (error) {
      console.error('Error loading interactions from storage:', error);
    }
  };

  const saveInteractionsToStorage = async (liked, shared) => {
    try {
      await Promise.all([
        AsyncStorage.setItem('liked_articles', JSON.stringify(Array.from(liked))),
        AsyncStorage.setItem('shared_articles', JSON.stringify(Array.from(shared))),
        AsyncStorage.setItem('interactions_sync_time', Date.now().toString()),
      ]);
    } catch (error) {
      console.error('Error saving interactions to storage:', error);
    }
  };

  // Batch fetch with debouncing
  const processBatch = useCallback(async () => {
    if (isSyncing.current || pendingArticleIds.current.size === 0) return;

    const articleIds = Array.from(pendingArticleIds.current);
    pendingArticleIds.current.clear();

    // Check if cache is still valid
    const now = Date.now();
    if (now - lastSyncTime.current < CACHE_TTL) {
      // Cache is fresh, skip fetch
      return;
    }

    isSyncing.current = true;
    setIsLoading(true);

    try {
      const response = await getUserInteractions(articleIds);
      const interactions = response.data.interactions;

      let updatedLiked;
      let updatedShared;

      setLikedArticles((prev) => {
        const newLiked = new Set(prev);
        Object.entries(interactions).forEach(([articleId, status]) => {
          const id = parseInt(articleId, 10);
          if (status.liked) {
            newLiked.add(id);
          } else {
            newLiked.delete(id);
          }
        });
        updatedLiked = newLiked;
        return newLiked;
      });

      setSharedArticles((prev) => {
        const newShared = new Set(prev);
        Object.entries(interactions).forEach(([articleId, status]) => {
          const id = parseInt(articleId, 10);
          if (status.shared) {
            newShared.add(id);
          } else {
            newShared.delete(id);
          }
        });
        updatedShared = newShared;
        return newShared;
      });

      lastSyncTime.current = now;
      
      // Save to storage with updated state (don't await)
      if (updatedLiked && updatedShared) {
        saveInteractionsToStorage(updatedLiked, updatedShared);
      }
    } catch (error) {
      console.error('Error fetching interactions:', error);
    } finally {
      isSyncing.current = false;
      setIsLoading(false);
    }
  }, []); // Remove dependencies to avoid stale closure

  // Fetch interactions with batching and debouncing
  const fetchInteractions = useCallback((articleIds) => {
    if (!articleIds || articleIds.length === 0) return;

    // Add to pending batch
    articleIds.forEach((id) => pendingArticleIds.current.add(id));

    // Clear existing timeout
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }

    // Set new timeout to process batch
    batchTimeoutRef.current = setTimeout(() => {
      processBatch();
    }, BATCH_DELAY);
  }, [processBatch]);

  // Force immediate sync (for login/refresh scenarios)
  const forceSyncInteractions = useCallback(async (articleIds) => {
    if (!articleIds || articleIds.length === 0) return;

    // Clear cache to force fetch
    lastSyncTime.current = 0;
    pendingArticleIds.current = new Set(articleIds);
    
    // Clear any pending batch timeout
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }
    
    await processBatch();
  }, [processBatch]);

  // Toggle like status locally (optimistic update)
  const toggleLike = useCallback((articleId) => {
    setLikedArticles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(articleId)) {
        newSet.delete(articleId);
      } else {
        newSet.add(articleId);
      }
      return newSet;
    });
    
    // Save to storage after state update
    // Use setTimeout to ensure state has updated
    setTimeout(() => {
      setLikedArticles((liked) => {
        setSharedArticles((shared) => {
          saveInteractionsToStorage(liked, shared);
          return shared;
        });
        return liked;
      });
    }, 0);
  }, []);

  // Mark article as shared locally (optimistic update)
  const markAsShared = useCallback((articleId) => {
    setSharedArticles((prev) => {
      const newSet = new Set(prev);
      newSet.add(articleId);
      return newSet;
    });
    
    // Save to storage after state update
    setTimeout(() => {
      setLikedArticles((liked) => {
        setSharedArticles((shared) => {
          saveInteractionsToStorage(liked, shared);
          return shared;
        });
        return liked;
      });
    }, 0);
  }, []);

  // Clear all interactions (on logout)
  const clearInteractions = useCallback(async () => {
    setLikedArticles(new Set());
    setSharedArticles(new Set());
    lastSyncTime.current = 0;
    pendingArticleIds.current.clear();
    
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }
    
    try {
      await Promise.all([
        AsyncStorage.removeItem('liked_articles'),
        AsyncStorage.removeItem('shared_articles'),
        AsyncStorage.removeItem('interactions_sync_time'),
      ]);
    } catch (error) {
      console.error('Error clearing interactions:', error);
    }
  }, []);

  // Memoized check functions
  const isLiked = useCallback((articleId) => {
    return likedArticles.has(articleId);
  }, [likedArticles]);

  const isShared = useCallback((articleId) => {
    return sharedArticles.has(articleId);
  }, [sharedArticles]);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    likedArticles,
    sharedArticles,
    isLoading,
    fetchInteractions,
    forceSyncInteractions,
    toggleLike,
    markAsShared,
    clearInteractions,
    isLiked,
    isShared,
  }), [
    likedArticles,
    sharedArticles,
    isLoading,
    fetchInteractions,
    forceSyncInteractions,
    toggleLike,
    markAsShared,
    clearInteractions,
    isLiked,
    isShared,
  ]);

  return (
    <UserInteractionsContext.Provider value={value}>
      {children}
    </UserInteractionsContext.Provider>
  );
};

export const useUserInteractions = () => {
  const context = useContext(UserInteractionsContext);
  if (!context) {
    throw new Error('useUserInteractions must be used within UserInteractionsProvider');
  }
  return context;
};
