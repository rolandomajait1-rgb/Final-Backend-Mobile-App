import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LIKED_ARTICLES_KEY = 'liked_articles';

/**
 * Hook to sync article like states with AsyncStorage
 * This ensures like states are consistent across all screens
 */
export function useLikedArticles(articles) {
  const [syncedArticles, setSyncedArticles] = useState(articles);

  useEffect(() => {
    const syncLikeStates = async () => {
      try {
        const stored = await AsyncStorage.getItem(LIKED_ARTICLES_KEY);
        const likedArticles = stored ? JSON.parse(stored) : {};
        
        // Update articles with stored like states
        const updated = articles.map(article => {
          if (likedArticles[article.id]) {
            return {
              ...article,
              user_liked: true,
              likes_count: likedArticles[article.id].count,
              like_count: likedArticles[article.id].count,
            };
          }
          return article;
        });
        
        setSyncedArticles(updated);
      } catch (err) {
        console.error('Error syncing like states:', err);
        setSyncedArticles(articles);
      }
    };

    if (articles && articles.length > 0) {
      syncLikeStates();
    } else {
      setSyncedArticles(articles);
    }
  }, [articles]);

  return syncedArticles;
}

/**
 * Get liked state for a single article
 */
export async function getArticleLikedState(articleId) {
  try {
    const stored = await AsyncStorage.getItem(LIKED_ARTICLES_KEY);
    const likedArticles = stored ? JSON.parse(stored) : {};
    return likedArticles[articleId] || null;
  } catch (err) {
    console.error('Error getting liked state:', err);
    return null;
  }
}

/**
 * Save liked state for an article
 */
export async function saveArticleLikedState(articleId, liked, count) {
  try {
    const stored = await AsyncStorage.getItem(LIKED_ARTICLES_KEY);
    const likedArticles = stored ? JSON.parse(stored) : {};
    
    if (liked) {
      likedArticles[articleId] = { liked: true, count };
    } else {
      delete likedArticles[articleId];
    }
    
    await AsyncStorage.setItem(LIKED_ARTICLES_KEY, JSON.stringify(likedArticles));
  } catch (err) {
    console.error('Error saving liked state:', err);
  }
}
