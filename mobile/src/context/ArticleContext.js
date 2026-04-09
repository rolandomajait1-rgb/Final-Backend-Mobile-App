import React, { createContext, useState, useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLatestArticles } from '../api/services/articleService';
import client from '../api/client';

export const ArticleContext = createContext();

const CACHE_KEY = 'cached_latest_articles';
const MIN_REFETCH_INTERVAL_MS = 3000;
const RETRY_DELAY_MS = 3000;
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://final-backend-mobile-app-2-4sfz.onrender.com';

// ─── Wake up Render backend silently ─────────────────────────────────────────
// Fires a lightweight ping to /api/health so the server is warm before
// the real article fetch. Called once on app mount.
const wakeUpBackend = () => {
  fetch(`${BASE_URL}/api/health`, { method: 'GET' })
    .then(() => console.log('[ArticleContext] Backend is awake ✅'))
    .catch(() => console.log('[ArticleContext] Backend wake-up ping sent (may still be starting)'));
};

export function ArticleProvider({ children }) {
  const [latestArticles, setLatestArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchingRef = useRef(false);
  const lastFetchRef = useRef(0);

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

  // ─── Core fetch with retry ────────────────────────────────────────────────
  const fetchLatestArticles = useCallback(async (retries = 2) => {
    if (fetchingRef.current) return; // prevent duplicate in-flight requests

    const now = Date.now();
    if (now - lastFetchRef.current < MIN_REFETCH_INTERVAL_MS) return; // cooldown

    fetchingRef.current = true;
    try {
      const res = await getLatestArticles();
      const data = res.data ?? [];
      setLatestArticles(data);
      setError(null);
      lastFetchRef.current = Date.now();
      saveCache(data); // update local cache silently
    } catch (err) {
      const isNetworkError =
        err.message === 'Network Error' ||
        err.code === 'ERR_NETWORK' ||
        err.message?.includes('timeout');

      if (isNetworkError && retries > 0) {
        console.log(`[ArticleContext] Network error — retrying in ${RETRY_DELAY_MS / 1000}s… (${retries} left)`);
        fetchingRef.current = false;
        setTimeout(() => fetchLatestArticles(retries - 1), RETRY_DELAY_MS);
        return;
      }

      // Keep showing cached data — don't clear it on error
      console.error('[ArticleContext] Fetch failed:', err.message);
      if (latestArticles.length === 0) {
        setError('Unable to load articles. Please check your connection.');
      }
    } finally {
      fetchingRef.current = false;
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

  // ─── On mount: wake backend → load cache → fetch fresh in background ──────
  useEffect(() => {
    wakeUpBackend();   // fire-and-forget wake-up ping
    const init = async () => {
      await loadCache();       // ← instant: show cached data
      fetchLatestArticles();   // ← background: silently update
    };
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const value = {
    latestArticles,
    loading,
    error,
    refreshArticles,
    forceRefreshArticles,
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
