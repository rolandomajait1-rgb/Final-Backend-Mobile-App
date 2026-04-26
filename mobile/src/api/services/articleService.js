import client from '../client';
import ENDPOINTS from '../endpoints';

export const createArticle = (formData) =>
  client.post(ENDPOINTS.ARTICLES, formData);

export const getArticles = (params = {}) =>
  client.get(ENDPOINTS.ARTICLES_PUBLIC, { params });

export const getArticleById = (id) =>
  client.get(ENDPOINTS.ARTICLE_BY_ID(id));

export const getArticleBySlug = (slug) =>
  client.get(ENDPOINTS.ARTICLE_BY_SLUG(slug));

export const searchArticles = (query, params = {}) =>
  client.get(ENDPOINTS.ARTICLES_SEARCH, { params: { q: query, ...params } });

export const getArticlesByCategory = (categoryId, params = {}) =>
  client.get(ENDPOINTS.CATEGORY_ARTICLES(categoryId), { params });

export const getLatestArticles = (config = {}) =>
  client.get(ENDPOINTS.LATEST_ARTICLES, config);

// Bug #1 Fix: Remove explicit Content-Type header - client interceptor handles FormData automatically
export const updateArticle = (id, formData) =>
  client.post(ENDPOINTS.ARTICLE_UPDATE(id), formData);

export const deleteArticle = (id) =>
  client.delete(ENDPOINTS.ARTICLE_DELETE(id));

export const shareArticle = (id) =>
  client.post(ENDPOINTS.ARTICLE_SHARE(id));

// User interaction methods
export const getLikedArticles = (params = {}) =>
  client.get('/api/user/liked-articles', { params });

export const getSharedArticles = (params = {}) =>
  client.get('/api/user/shared-articles', { params });

export const getUserInteractions = (articleIds) =>
  client.post('/api/user/interactions', { article_ids: articleIds });
