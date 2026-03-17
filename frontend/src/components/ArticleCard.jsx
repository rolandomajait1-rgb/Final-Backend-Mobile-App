import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPencilAlt, FaTrash, FaCalendar } from 'react-icons/fa';
import { Heart, Share2 } from 'lucide-react';
import DOMPurify from 'dompurify';
import axios from '../utils/axiosConfig';
import { isAdmin, isModerator, deleteArticle, getAuthToken, getUserRole } from '../utils/auth';
import { getStorageUrl } from '../utils/apiConfig';
import getCategoryColor from '../utils/getCategoryColor';

const ArticleCard = ({
  featured_image, categories, published_at, title, excerpt, author,
  imageUrl, category, date, snippet, isPublished = true, isLarge = false,
  isMedium = false, horizontal = false, className = '',
  onClick, onEdit, onDelete, articleId, slug, showRelated = false,
}) => {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(Math.floor(Math.random() * 50));
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [showAdminButtons, setShowAdminButtons] = useState(false);

  useEffect(() => {
    setShowAdminButtons(!!(getAuthToken() && (isAdmin() || isModerator())));
  }, []);

  const finalImageUrl = imageUrl ||
    (featured_image
      ? (featured_image.startsWith('http') ? featured_image : getStorageUrl(`/storage/${featured_image}`))
      : 'https://placehold.co/300x200/e2e8f0/64748b?text=No+Image');
  const finalCategory = category || (categories?.length > 0 ? categories[0].name : 'Uncategorized');
  const finalDate = date || (published_at ? new Date(published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '');
  const finalTime = published_at ? new Date(published_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '';
  const finalSnippet = DOMPurify.sanitize(snippet || excerpt || '');
  const finalAuthor = typeof author === 'string' ? author : (author?.display_author_name || author?.user?.name || author?.name || 'Unknown Author');

  useEffect(() => {
    if (!expanded || !showRelated || !finalCategory) return;
    const fetchRelated = async () => {
      try {
        const response = await axios.get('/api/articles', { params: { category: finalCategory.toLowerCase(), limit: 3 } });
        setRelatedArticles(response.data.data.filter(a => a.slug !== slug).slice(0, 3));
      } catch (error) {
        console.error('Error fetching related articles:', error);
      }
    };
    fetchRelated();
  }, [expanded, showRelated, finalCategory, slug]);

  const getImageHeight = () => {
    if (isLarge) return 'h-110';
    if (isMedium) return 'h-42';
    return 'h-50';
  };

  if (!isPublished) return null;

  const handleCardClick = (e) => {
    e.preventDefault();
    if (showRelated) { setExpanded(!expanded); return; }
    if (onClick) { try { onClick(); } catch (err) { console.error('ArticleCard onClick error:', err); } return; }
    if (slug) { navigate(`/article/${slug}`); return; }
    if (articleId) { navigate(`/article/${articleId}`); }
  };

  const handleEditClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/edit-article/${articleId}`);
  };

  const handleDeleteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete ? onDelete(articleId) : deleteArticle(articleId);
  };

  const handleLike = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setLiked(!liked);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
  };

  const handleShare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/article/${slug}`);
    alert('Article link copied to clipboard!');
  };

  const AdminButtons = () => (
    showAdminButtons && onEdit !== null && onDelete !== null ? (
      <div className="absolute top-3 right-3 flex space-x-2 z-20">
        <button onClick={handleEditClick} className="p-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700" title="Edit Article">
          <FaPencilAlt />
        </button>
        {getUserRole() === 'admin' && (
          <button onClick={handleDeleteClick} className="p-2 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700" title="Delete Article">
            <FaTrash />
          </button>
        )}
      </div>
    ) : null
  );

  const MetaRow = () => (
    <div className="flex justify-between items-start mb-2">
      <span
        className={`text-xs font-semibold uppercase px-2 py-1 rounded cursor-pointer hover:opacity-80 ${getCategoryColor(finalCategory)}`}
        onClick={(e) => { e.stopPropagation(); navigate(`/category/${finalCategory.toLowerCase()}`); }}
      >
        {finalCategory}
      </span>
      <span className="text-xs text-gray-500 text-right flex items-center">
        <FaCalendar className="mr-1" />{finalDate} {finalTime}
      </span>
    </div>
  );

  const AuthorRow = () => (
    <div className="flex justify-between items-center">
      <p className={`text-gray-700 italic font-semibold ${isLarge ? 'text-lg' : 'text-xs'}`}>
        By{' '}
        <span
          className="cursor-pointer hover:text-blue-600 hover:underline transition-colors"
          onClick={(e) => { e.stopPropagation(); navigate(`/author/${encodeURIComponent(finalAuthor)}`); }}
        >
          {finalAuthor}
        </span>
      </p>
      <div className="flex items-center space-x-2">
        <button onClick={handleLike} className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors ${liked ? 'text-red-600 hover:text-red-700' : 'text-gray-400 hover:text-red-500'}`}>
          <Heart size={isLarge ? 18 : 14} className={liked ? 'fill-current' : ''} />
          <span className={isLarge ? 'text-sm' : 'text-xs'}>{likeCount}</span>
        </button>
        <button onClick={handleShare} className="text-gray-400 hover:text-blue-500 transition-colors">
          <Share2 size={isLarge ? 18 : 14} />
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div
        className={`relative bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow ${isLarge ? 'min-h-144' : 'max-w-full'} ${className}`}
        onClick={handleCardClick}
      >
        {(showRelated || onClick || slug) && (
          <div role="presentation" onClick={handleCardClick} className="absolute inset-0 z-10 bg-transparent" />
        )}

        {horizontal ? (
          <div className="flex flex-col sm:flex-row">
            <div className="sm:w-1/3 relative overflow-hidden">
              <img src={finalImageUrl} alt={title} className={`w-full h-full object-cover ${getImageHeight()}`} />
              <AdminButtons />
            </div>
            <div className="p-3 sm:w-2/3 flex flex-col justify-between">
              <div>
                <MetaRow />
                <h3 className={`font-bold text-gray-900 mb-3 line-clamp-2 text-left ${isLarge ? 'text-4xl' : 'text-base'}`}>{title}</h3>
                <p className={`text-gray-600 mb-4 line-clamp-3 grow text-left ${isLarge ? 'text-xl' : 'text-xs'}`}>{finalSnippet}</p>
              </div>
              <AuthorRow />
            </div>
          </div>
        ) : (
          <>
            <div className="relative">
              <img src={finalImageUrl} alt={title} className={`w-full object-cover ${getImageHeight()}`} />
              <AdminButtons />
            </div>
            <div className={`flex flex-col grow ${isLarge ? 'p-6' : 'p-3'}`}>
              <MetaRow />
              <h3 className={`font-bold text-gray-900 mb-3 line-clamp-2 text-left ${isLarge ? 'text-4xl' : 'text-base'}`}>{title}</h3>
              <p className={`text-gray-600 mb-4 line-clamp-3 grow text-left ${isLarge ? 'text-xl' : 'text-xs'}`}>{finalSnippet}</p>
              <AuthorRow />
            </div>
          </>
        )}
      </div>

      {expanded && showRelated && relatedArticles.length > 0 && (
        <div className="mt-6 border-t-2 border-gray-200 pt-6">
          <h3 className="text-xl font-serif font-bold text-gray-900 mb-4">More from {finalCategory}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {relatedArticles.map((article) => (
              <div key={article.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-all" onClick={() => navigate(`/article/${article.slug}`)}>
                <div className="h-32 overflow-hidden">
                  <img src={article.featured_image_url || 'https://placehold.co/400x200/e2e8f0/64748b?text=No+Image'} alt={article.title} className="w-full h-full object-cover" />
                </div>
                <div className="p-3">
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded uppercase">
                    {article.categories?.length > 0 ? article.categories[0].name : 'Uncategorized'}
                  </span>
                  <h4 className="text-sm font-serif font-bold text-gray-900 mt-2 line-clamp-2">{article.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">{article.display_author_name || article.author?.user?.name || article.author?.name || 'Unknown Author'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default ArticleCard;
