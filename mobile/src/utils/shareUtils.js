import { Share } from 'react-native';
import { showAuditToast } from './toastNotification';

// Consistent article URL generation
export const getArticleUrl = (article) => {
  const baseUrl = 'https://laverdadherald.com';
  const slug = article.slug || article.id;
  return `${baseUrl}/articles/${slug}`;
};

// Extract first 80 characters of article content as gist
export const extractGist = (htmlContent) => {
  if (!htmlContent) return '';
  
  // Remove HTML tags and normalize whitespace (removes newlines)
  const plainText = htmlContent
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Get first 80 characters as gist
  return plainText.length > 80 
    ? plainText.substring(0, 80).trim() + '...' 
    : plainText;
};

// Consistent share functionality
export const handleArticleShare = async (article, onShareSuccess) => {
  if (!article) return;
  
  try {
    const gist = extractGist(article.content);
    const url = getArticleUrl(article);
    const shareMessage = gist 
      ? `Check out: ${article.title}\n\n"${gist}"\n\n${url}`
      : `Check out: ${article.title}\n\n${url}`;
    
    const result = await Share.share({
      title: article.title,
      message: shareMessage,
    });

    if (result.action === Share.sharedAction) {
      if (onShareSuccess) {
        await onShareSuccess();
      }
      showAuditToast('success', 'Article shared successfully!');
      return true;
    }
    return false;
  } catch (err) {
    console.error('Error sharing article:', err);
    if (err.message !== 'User did not share') {
      showAuditToast('error', 'Failed to share article.');
    }
    return false;
  }
};
