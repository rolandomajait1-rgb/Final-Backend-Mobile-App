import client from '../client';
import ENDPOINTS from '../endpoints';

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
