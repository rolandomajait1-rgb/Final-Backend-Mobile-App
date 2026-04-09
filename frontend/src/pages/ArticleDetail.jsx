import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../utils/axiosConfig';
import DOMPurify from 'dompurify';
import { ArrowLeft, MoreVertical, ThumbsUp, Share2 } from 'lucide-react';
import Footer from '../components/Footer';
import { isAdmin, isModerator, getUserRole } from '../utils/auth';
import getCategoryColor from '../utils/getCategoryColor';
import { getStorageUrl } from '../utils/apiConfig';
import { sanitizeImageSrc } from '../utils/safeUrl';

const fallbackImage = 'https://placehold.co/800x500/e2e8f0/64748b?text=No+Image';

export default function ArticleDetail() {
  const { identifier } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const isNumeric = identifier && /^\d+$/.test(identifier);
        const response = await axios.get(
          isNumeric ? `/api/articles/id/${identifier}` : `/api/articles/by-slug/${identifier}`
        );
        const data = response.data;
        setArticle(data);
        setLikeCount(data.likes_count || 0);
        setLiked(data.is_liked || false);

        if (data.categories?.length > 0) {
          const cat = data.categories[0].name;
          const rel = await axios.get('/api/articles', { params: { category: cat.toLowerCase(), limit: 6 } });
          setRelatedArticles(rel.data.data.filter(a => a.id !== data.id).slice(0, 3));
        }
      } catch (err) {
        console.error('Error fetching article:', err);
        setError('Article not found');
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [identifier]);

  const handleLike = async () => {
    try {
      const response = await axios.post(`/api/articles/${article.id}/like`);
      setLiked(response.data.liked);
      setLikeCount(response.data.likes_count);
    } catch (err) {
      console.error('Error liking article:', err);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this article?')) return;
    try {
      await axios.delete(`/api/articles/${article.id}`);
      navigate(-1);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete article');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading article...</p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">{error || 'Article not found'}</p>
      </div>
    );
  }

  const heroImage = sanitizeImageSrc(getStorageUrl(article.featured_image), fallbackImage);
  const categoryName = article.categories?.[0]?.name || 'Uncategorized';
  const authorName = article.author?.user?.name || 'Unknown Author';
  const publishedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) +
      ' at ' +
      new Date(article.published_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    : '';

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans">

      {/* ── HERO IMAGE with overlay ── */}
      <div className="relative w-full" style={{ minHeight: '320px' }}>
        <img
          src={heroImage}
          alt={article.title}
          className="w-full object-cover"
          style={{ height: '360px' }}
        />
        {/* dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition"
        >
          <ArrowLeft size={20} />
        </button>

        {/* 3-dot menu */}
        {(isAdmin() || isModerator()) && (
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition"
            >
              <MoreVertical size={20} />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg overflow-hidden text-sm">
                <button
                  onClick={() => navigate(`/admin/edit-article/${article.id}`)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  Edit Article
                </button>
                {getUserRole() === 'admin' && (
                  <button
                    onClick={handleDelete}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                  >
                    Delete Article
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Category + Title + Author + Date over image */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
          <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${getCategoryColor(categoryName)}`}>
            {categoryName}
          </span>
          <h1 className="text-2xl font-bold text-white mt-2 leading-tight">
            {article.title}
          </h1>
          <p className="text-sm mt-2">
            <span className="text-gray-300">by </span>
            <span
              className="text-yellow-400 font-semibold cursor-pointer hover:underline"
              onClick={() => navigate(`/author/${encodeURIComponent(authorName)}`)}
            >
              {authorName}
            </span>
          </p>
          <p className="text-gray-400 text-xs mt-0.5">{publishedDate}</p>
        </div>
      </div>

      {/* ── TAGS ── */}
      {article.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 py-3 border-b border-gray-100">
          {article.tags.map(tag => (
            <span
              key={tag.id}
              onClick={() => navigate(`/tag/${tag.name}`)}
              className="text-xs text-gray-500 border border-gray-300 px-3 py-1 rounded-full cursor-pointer hover:bg-gray-100 transition"
            >
              #{tag.name}
            </span>
          ))}
        </div>
      )}

      {/* ── LIKE + SHARE ── */}
      <div className="flex items-center gap-6 px-4 py-3 border-b border-gray-100">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 text-sm font-medium transition ${liked ? 'text-blue-600' : 'text-gray-500 hover:text-blue-500'}`}
        >
          <ThumbsUp size={18} className={liked ? 'fill-current' : ''} />
          <span>{likeCount}</span>
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-500 transition"
        >
          <Share2 size={18} />
          <span>{copied ? 'Copied!' : 'Share'}</span>
        </button>
      </div>

      {/* ── ARTICLE CONTENT ── */}
      <div className="px-4 py-6 max-w-2xl mx-auto w-full">
        <div
          className="prose prose-base max-w-none text-gray-800 leading-relaxed whitespace-pre-line"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.content) }}
        />
      </div>

      {/* ── RELATED ARTICLES ── */}
      {relatedArticles.length > 0 && (
        <div className="px-4 pb-10 max-w-2xl mx-auto w-full">
          <h2 className="text-lg font-bold text-gray-900 mb-4 border-t border-gray-200 pt-6">
            More from {categoryName}
          </h2>
          <div className="flex flex-col gap-4">
            {relatedArticles.map(rel => (
              <div
                key={rel.id}
                onClick={() => navigate(`/article/${rel.slug}`)}
                className="flex gap-3 cursor-pointer group"
              >
                <img
                  src={sanitizeImageSrc(getStorageUrl(rel.featured_image), fallbackImage)}
                  alt={rel.title}
                  className="w-24 h-16 object-cover rounded-lg flex-shrink-0"
                />
                <div className="flex flex-col justify-center">
                  <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded w-fit ${getCategoryColor(rel.categories?.[0]?.name || '')}`}>
                    {rel.categories?.[0]?.name || 'Uncategorized'}
                  </span>
                  <h3 className="text-sm font-semibold text-gray-900 mt-1 line-clamp-2 group-hover:text-blue-700 transition">
                    {rel.title}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {rel.author?.user?.name || 'Unknown'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
