const ENDPOINTS = {
  // Auth
  LOGIN: '/api/login',
  REGISTER: '/api/register',
  LOGOUT: '/api/logout',
  FORGOT_PASSWORD: '/api/forgot-password',
  CHANGE_PASSWORD: '/api/change-password',

  // Articles
  ARTICLES: '/api/articles',
  ARTICLES_PUBLIC: '/api/articles/public',
  ARTICLES_SEARCH: '/api/articles/search',
  ARTICLE_BY_SLUG: (slug) => `/api/articles/by-slug/${slug}`,
  ARTICLE_BY_ID: (id) => `/api/articles/id/${id}`,
  ARTICLE_UPDATE: (id) => `/api/articles/${id}`,
  ARTICLE_DELETE: (id) => `/api/articles/${id}`,
  ARTICLE_LIKE: (id) => `/api/articles/${id}/like`,
  ARTICLE_SHARE: (id) => `/api/articles/${id}/share`,
  ARTICLES_BY_AUTHOR: (authorId) => `/api/articles/author-public/${authorId}`,
  LATEST_ARTICLES: '/api/latest-articles',

  // Categories
  CATEGORIES: '/api/categories',
  CATEGORY_ARTICLES: (categoryId) => `/api/categories/${categoryId}/articles`,

  // Tags
  TAGS: '/api/tags',

  // User
  CURRENT_USER: '/api/user',
  UPDATE_PROFILE: '/api/user/profile',
  LIKED_ARTICLES: '/api/user/liked-articles',
  SHARED_ARTICLES: '/api/user/shared-articles',

  // Audit Logs
  AUDIT_LOGS: '/api/admin/audit-logs',
  AUDIT_LOG_BY_ID: (id) => `/api/admin/audit-logs/${id}`,
};

export default ENDPOINTS;
