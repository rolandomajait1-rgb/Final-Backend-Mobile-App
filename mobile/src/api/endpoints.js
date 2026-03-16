const ENDPOINTS = {
  // Auth
  LOGIN: '/api/login',
  REGISTER: '/api/register',
  LOGOUT: '/api/logout',
  FORGOT_PASSWORD: '/api/forgot-password',

  // Articles
  ARTICLES_PUBLIC: '/api/articles/public',
  ARTICLES_SEARCH: '/api/articles/search',
  ARTICLE_BY_SLUG: (slug) => `/api/articles/by-slug/${slug}`,
  ARTICLE_BY_ID: (id) => `/api/articles/id/${id}`,
  ARTICLES_BY_AUTHOR: (authorId) => `/api/articles/author-public/${authorId}`,
  LATEST_ARTICLES: '/api/latest-articles',

  // Categories
  CATEGORIES: '/api/categories',
  CATEGORY_ARTICLES: (categoryId) => `/api/categories/${categoryId}/articles`,

  // Tags
  TAGS: '/api/tags',

  // User
  CURRENT_USER: '/api/user',
  LIKED_ARTICLES: '/api/user/liked-articles',
};

export default ENDPOINTS;
