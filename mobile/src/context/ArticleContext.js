import React, { createContext, useState, useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLatestArticles } from '../api/services/articleService';
import { BASE_URL } from '../constants/config';

export const ArticleContext = createContext();

const CACHE_KEY = 'cached_latest_articles';
const MIN_REFETCH_INTERVAL_MS = 500; // Reduced from 3000ms for faster updates
const RETRY_DELAY_MS = 3000;

// FIX: Reduce backend wake-up timeout and make it non-blocking
// 3 seconds is enough for most cases, and we don't want to block app startup
const wakeUpBackend = () => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000); // Reduced from 5s to 3s

  fetch(`${BASE_URL}/api/health`, {
    method: 'GET',
    signal: controller.signal,
    // FIX: Add cache-bust to avoid cached responses
    cache: 'no-store',
  })
    .then(() => {
      clearTimeout(timeoutId);
      console.log('[ArticleContext] Backend is awake ✅');
    })
    .catch((err) => {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        console.log('[ArticleContext] Backend wake-up timed out (server may be cold starting)');
      }
      // Silent fail - we don't want to block app startup
    });
};

export function ArticleProvider({ children }) {
  const [latestArticles, setLatestArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchingRef = useRef(false);
  const lastFetchRef = useRef(0);
  const abortControllerRef = useRef(null); // Bug #4 Fix: Add abort controller for request cancellation

  // ─── Load cached articles from AsyncStorage instantly ─────────────────────
  const loadCache = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        if (Array.isArray(cached) && cached.length > 0) {
          setLatestArticles(cached);
          setLoading(false); // show cached data — no spinner
        }
      }
    } catch (_) {}
  }, []);

  // ─── Persist articles to cache ────────────────────────────────────────────
  const saveCache = useCallback(async (data) => {
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (_) {}
  }, []);

  // Bug #4 & #11 Fix: Improved fetch with abort controller and smart retry logic
  const fetchLatestArticles = useCallback(async (retries = 1, bypassCooldown = false) => {
    if (fetchingRef.current) {
      // Cancel previous request if still in flight
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }

    const now = Date.now();
    if (!bypassCooldown && now - lastFetchRef.current < MIN_REFETCH_INTERVAL_MS && retries === 1) {
      return; // cooldown only for initial calls, not retries
    }

    fetchingRef.current = true;
    abortControllerRef.current = new AbortController();

    try {
      // FIX: Add timeout to the actual API call (30 seconds max)
      const res = await Promise.race([
        getLatestArticles({ signal: abortControllerRef.current.signal }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('API timeout')), 30000)),
      ]);
      const data = res.data ?? [];
      setLatestArticles(data);
      setError(null);
      lastFetchRef.current = Date.now();
      saveCache(data); // update local cache silently
    } catch (err) {
      // Ignore abort errors
      if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
        return;
      }

      // FIX: Only retry once, and only for network errors
      const shouldRetry = () => {
        if (retries <= 0) return false;

        // Network errors - retry once
        if (
          err.message === 'Network Error' ||
          err.code === 'ERR_NETWORK' ||
          err.code === 'ECONNABORTED' ||
          err.message?.includes('timeout')
        ) {
          return true;
        }

        // HTTP errors - only retry 5xx (server errors)
        if (err.response?.status) {
          const status = err.response.status;
          return status >= 500 && status < 600;
        }

        return false;
      };

      if (shouldRetry()) {
        console.log(`[ArticleContext] Retrying... (${retries} left)`);
        fetchingRef.current = false;
        setTimeout(() => fetchLatestArticles(retries - 1, true), RETRY_DELAY_MS);
        return;
      }

      // Keep showing cached data — don't clear it on error
      console.warn('[ArticleContext] Fetch failed:', err.message);
      // Only show error if we have no cached data
      if (latestArticles.length === 0) {
        setError('Unable to load articles. Please check your connection.');
      }
    } finally {
      fetchingRef.current = false;
      abortControllerRef.current = null;
    }
  }, [saveCache, latestArticles.length]);

  // ─── Public: refresh (with spinner only if no data) ───────────────────────
  const refreshArticles = useCallback(async () => {
    setError(null);
    const hadNoData = latestArticles.length === 0;
    if (hadNoData) setLoading(true);
    try {
      await fetchLatestArticles();
    } finally {
      setLoading(false);
    }
  }, [fetchLatestArticles, latestArticles.length]);

  // ─── Public: force refresh (after edit/create — bypasses cooldown) ────────
  const forceRefreshArticles = useCallback(async () => {
    lastFetchRef.current = 0;
    await refreshArticles();
  }, [refreshArticles]);

  // ─── Public: update article locally (for instant UI feedback on likes) ──
  const updateArticleLocally = useCallback((articleId, updates) => {
    setLatestArticles(prev => {
      const newArticles = prev.map(a => a.id === articleId ? { ...a, ...updates } : a);
      saveCache(newArticles);
      return newArticles;
    });
  }, [saveCache]);

  // ─── Public: remove article from cache (after delete) ──────────────────────
  const removeArticleLocally = useCallback((articleId) => {
    setLatestArticles(prev => {
      const newArticles = prev.filter(a => a.id !== articleId);
      saveCache(newArticles);
      return newArticles;
    });
  }, [saveCache]);

  // ─── On mount: wake backend → load cache → fetch fresh in background ──────
  useEffect(() => {
    wakeUpBackend();   // fire-and-forget wake-up ping
    const init = async () => {
      await loadCache();       // ← instant: show cached data
      fetchLatestArticles();   // ← background: silently update
    };
    init();
    
    // Cleanup: abort any pending requests on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const value = {
    latestArticles,
    loading,
    error,
    refreshArticles,
    forceRefreshArticles,
    updateArticleLocally,
    removeArticleLocally,
  };

  return (
    <ArticleContext.Provider value={value}>
      {children}
    </ArticleContext.Provider>
  );
}

export function useArticles() {
  const context = React.useContext(ArticleContext);
  if (!context) {
    throw new Error('useArticles must be used within an ArticleProvider');
  }
  return context;
}
