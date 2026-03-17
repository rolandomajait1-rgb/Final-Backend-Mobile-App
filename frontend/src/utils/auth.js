import axios from './axiosConfig';

export const isAdmin = () => {
  const token = localStorage.getItem('auth_token');
  const userRole = localStorage.getItem('user_role');
  return token && userRole === 'admin';
};

export const isModerator = () => {
  const token = localStorage.getItem('auth_token');
  const userRole = localStorage.getItem('user_role');
  return token && userRole === 'moderator';
};

export const getAuthToken = () => localStorage.getItem('auth_token');

export const getUserRole = () => localStorage.getItem('user_role');

export const editArticle = (articleId) => {
  window.location.href = `/admin/edit-article/${articleId}`;
};

export const deleteArticle = async (articleId) => {
  if (!window.confirm('Are you sure you want to delete this article?')) return false;
  try {
    const response = await axios.delete(`/api/articles/${articleId}`);
    if (response.status >= 200 && response.status < 300) {
      alert('Article deleted successfully');
      window.location.reload();
      return true;
    }
    alert('Failed to delete article');
    return false;
  } catch (error) {
    console.error('Error deleting article:', error);
    if (error.response?.status === 404) {
      alert('Article not found. It may have already been deleted.');
      window.location.reload();
      return true;
    }
    alert('Error deleting article');
    return false;
  }
};

/**
 * Returns the display author name for an article.
 * Prefers article.display_author_name (set by backend),
 * then article.author_name, then author.user.name.
 */
export const getAuthorName = (article) => {
  return article?.display_author_name
    || article?.author_name
    || article?.author?.user?.name
    || article?.author?.name
    || 'Unknown Author';
};
