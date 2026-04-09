import client from '../client';
import ENDPOINTS from '../endpoints';

export const createArticle = (formData) =>
  client.post(ENDPOINTS.ARTICLES, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

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

export const getLatestArticles = () =>
  client.get(ENDPOINTS.LATEST_ARTICLES);

export const updateArticle = (id, formData) =>
  client.post(ENDPOINTS.ARTICLE_UPDATE(id), formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const deleteArticle = (id) =>
  client.delete(ENDPOINTS.ARTICLE_DELETE(id));
