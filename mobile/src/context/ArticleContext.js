import React, { createContext, useState, useCallback, useEffect } from 'react';
import { getArticles } from '../api/services/articleService';

export const ArticleContext = createContext();

export function ArticleProvider({ children }) {
  const [latestArticles, setLatestArticles] = useState([]);
  const [historicalArticles, setHistoricalArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLatestArticles = useCallback(async () => {
    try {
      const res = await getArticles({ limit: 5, page: 1 });
      const data = res.data?.data ?? res.data ?? [];
      setLatestArticles(data.slice(0, 1));
    } catch (err) {
      setError('Failed to fetch latest articles');
      console.error(err);
    }
  }, []);

  const fetchHistoricalArticles = useCallback(async () => {
    try {
      const res = await getArticles({ limit: 10, page: 1 });
      const data = res.data?.data ?? res.data ?? [];
      setHistoricalArticles(data.slice(1, 3));
    } catch (err) {
      setError('Failed to fetch historical articles');
      console.error(err);
    }
  }, []);

  const refreshArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchLatestArticles(), fetchHistoricalArticles()]);
    } finally {
      setLoading(false);
    }
  }, [fetchLatestArticles, fetchHistoricalArticles]);

  useEffect(() => {
    refreshArticles();
  }, [refreshArticles]);

  const value = {
    latestArticles,
    historicalArticles,
    loading,
    error,
    refreshArticles,
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
