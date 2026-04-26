import { Share } from 'react-native';
import { showAuditToast } from './toastNotification';
import { BASE_URL } from '../constants/config';

// Consistent article URL generation
export const getArticleUrl = (article) => {
  // Security: Validate article object
  if (!article || !article.slug) {
    console.error('Invalid article object for URL generation:', article);
    return null;
  }
  
  // Security: Sanitize slug to prevent injection
  const slug = String(article.slug).replace(/[^a-z0-9-]/gi, '');
  
  if (!slug) {
    console.error('Invalid article slug after sanitization');
    return null;
  }
  
  // Use the same BASE_URL as the API client
  const url = `${BASE_URL}/articles/${encodeURIComponent(slug)}`;
  console.log('Generated share URL:', url);
  return url;
};

// Extract first 80 characters of article content as gist
export const extractGist = (htmlContent) => {
  if (!htmlContent) return '';
  
  // Security: Sanitize HTML content to prevent XSS
  const plainText = String(htmlContent)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  
  // Get first 80 characters as gist
  return plainText.length > 80 
    ? plainText.substring(0, 80).trim() + '...' 
    : plainText;
};

// Consistent share functionality
export const handleArticleShare = async (article, onShareSuccess) => {
  if (!article) {
    console.error('No article provided for sharing');
    return false;
  }
  
  console.log('Attempting to share article:', article.title, 'slug:', article.slug);
  
  try {
    const url = getArticleUrl(article);
    
    // Security: Validate URL before sharing
    if (!url) {
      console.error('Failed to generate share URL');
      showAuditToast('error', 'Unable to generate share link');
      return false;
    }
    
    const title = String(article.title || 'Article').substring(0, 100); // Limit title length
    
    // Share only the URL so that social media platforms (Messenger, Facebook, WhatsApp)
    // will fetch and display the Open Graph meta tags from the backend
    console.log('Share message prepared, opening share dialog...');
    
    const result = await Share.share({
      title: title,
      message: url, // Only share the URL for proper meta tag preview
    });

    console.log('Share result:', result);

    // Only show success if actually shared (not dismissed/cancelled)
    if (result.action === Share.sharedAction) {
      console.log('Article shared successfully');
      // Call the success callback to increment share count
      if (onShareSuccess) {
        await onShareSuccess();
      }
      // Don't show toast - sharing UI already provides feedback
      return true;
    }
    
    console.log('User dismissed share dialog');
    // User dismissed/cancelled - no action needed
    return false;
  } catch (err) {
    console.error('Error sharing article:', err);
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      article: { id: article.id, slug: article.slug, title: article.title }
    });
    // Only show error if it's not a user cancellation
    if (err.message !== 'User did not share') {
      showAuditToast('error', 'Failed to share article.');
    }
    return false;
  }
};
