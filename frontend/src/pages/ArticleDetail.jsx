import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../utils/axiosConfig';
import DOMPurify from 'dompurify';
import { Pencil, Trash2, Heart, Share2, Link } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import HeaderLink from '../components/HeaderLink';
import { isAdmin, isModerator, getUserRole } from '../utils/auth';
import getCategoryColor from '../utils/getCategoryColor';
import { getStorageUrl } from '../utils/apiConfig';
import { sanitizeImageSrc } from '../utils/safeUrl';

const RelatedCard = ({ article, onClick, navigate }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col group cursor-pointer hover:shadow-md transition-all" onClick={onClick}>
    <div className="relative h-44 overflow-hidden">
      <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      {(isAdmin() || getUserRole() === 'moderator') && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="p-1.5 bg-blue-500 text-white rounded shadow hover:bg-blue-600" onClick={(e) => e.stopPropagation()}><Pencil size={12}/></button>
          {getUserRole() === 'admin' && (
            <button className="p-1.5 bg-red-500 text-white rounded shadow hover:bg-red-600" onClick={(e) => e.stopPropagation()}><Trash2 size={12}/></button>
          )}
        </div>
      )}
    </div>
    <div className="p-4 flex flex-col grow">
      <div className="flex justify-between items-start mb-2">
        <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${getCategoryColor(article.category)}`}>{article.category}</span>
        <span className="text-gray-500 text-[10px] font-medium">{article.date}</span>
      </div>
      <h3 className="text-base font-serif font-bold text-gray-900 mb-2 leading-tight group-hover:text-blue-800 transition-colors line-clamp-3 text-left">
        {article.title}
      </h3>
      {article.excerpt && (
        <p className="text-xs text-gray-600 mb-2 line-clamp-2 leading-relaxed text-left">
          {article.excerpt}
        </p>
      )}
      <div className="mt-auto text-right">
        <p
          className="text-xs text-gray-500 font-medium cursor-pointer hover:text-blue-600 hover:underline transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/author/${encodeURIComponent(article.author)}`);
          }}
        >
          {article.author}
        </p>
      </div>
    </div>
  </div>
);

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
  const fallbackImage = 'https://placehold.co/400x250/e2e8f0/64748b?text=No+Image';


  useEffect(() => {
    const fetchArticle = async () => {
      try {
        let response;
        let articleData;

        // If identifier is numeric, fetch by id; otherwise fetch by slug
        if (identifier && /^\d+$/.test(identifier)) {
          response = await axios.get(`/api/articles/id/${identifier}`);
          articleData = response.data;
        } else {
          response = await axios.get(`/api/articles/by-slug/${identifier}`);
          articleData = response.data;
        }

        setArticle(articleData);
        setLikeCount(articleData.likes_count || 0);
        setLiked(articleData.is_liked || false);

        // Author article count is intentionally not fetched for public display

        // Fetch related articles from the same category
        if (articleData.categories && articleData.categories.length > 0) {
          const categoryName = articleData.categories[0].name;
          const relatedResponse = await axios.get('/api/articles', {
            params: { category: categoryName.toLowerCase(), limit: 6 }
          });
          const filtered = relatedResponse.data.data.filter(a => a.id !== articleData.id).slice(0, 6);
          setRelatedArticles(filtered);
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

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <HeaderLink />
        <main className="container mx-auto px-4 py-8 grow">
          <div className="text-center">Loading article...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <HeaderLink />
        <main className="container mx-auto px-4 py-8 grow">
          <div className="text-center text-red-600">{error || 'Article not found'}</div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleLike = async () => {
    try {
      const response = await axios.post(`/api/articles/${article.id}/like`);
      setLiked(response.data.liked);
      setLikeCount(response.data.likes_count);
    } catch (error) {
      console.error('Error liking article:', error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this article? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`/api/articles/${article.id}`);
      alert('Article deleted successfully!');
      navigate('/');
    } catch (error) {
      console.error('Error deleting article:', error);
      alert(`Error: ${error.response?.data?.error || error.response?.data?.message || error.message}`);
    }
  };

  const handleShare = (platform) => {
    const url = window.location.href;
    const title = article.title;

    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(url).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
        break;
    }
  };



  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <HeaderLink />

      <div className="min-h-screen bg-gray-200 p-4 md:p-12 font-sans">
        <article className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
          
          {/* Header Section: Title, Meta, Buttons */}
          <header className="p-6 md:p-10">
            
            {/* Top row: Category and Buttons */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <span className={`text-sm font-bold uppercase px-3 py-1 rounded-full ${
                  article.categories?.length > 0 
                    ? getCategoryColor(article.categories[0].name)
                    : 'text-gray-700 bg-gray-100'
                }`}>
                  {article.categories?.length > 0 ? article.categories[0].name : 'UNCATEGORIZED'}
                </span>
              </div>
              {(isAdmin() || isModerator()) && (
                <div className="flex space-x-2">
                  <button 
                    onClick={() => navigate(`/admin/edit-article/${article.id}`)}
                    className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors"
                  >
                    <Pencil size={16} className="mr-1.5" />
                    Edit
                  </button>
                  {isAdmin() && (
                    <button 
                      onClick={handleDelete}
                      className="flex items-center bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors"
                    >
                      <Trash2 size={16} className="mr-1.5" />
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
            
            {/* Title */}
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 text-left">
              {article.title}
            </h1>
            
            {/* Author/Date and Tags on same line */}
            <div className="flex justify-between items-start mb-6">
              {/* Author and Date - Left side */}
              <div className="text-sm text-gray-600 text-left">
                <div>
                  <span>Written by </span>
                  <span 
                    className="font-semibold text-gray-800 cursor-pointer hover:text-blue-600 hover:underline transition-colors"
                    onClick={() => navigate(`/author/${encodeURIComponent(article.author?.user?.name || 'Unknown Author')}`)}
                  >
                    {article.author?.user?.name || 'Unknown Author'}
                  </span>
                </div>
                <div className="mt-1">
                  {new Date(article.published_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })} at {new Date(article.published_at).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}
                </div>
              </div>
              
              {/* Tags - Right side */}
              {article.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {article.tags.map(tag => (
                    <span 
                      key={tag.id} 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/tag/${tag.name}`);
                      }}
                      className="text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 cursor-pointer hover:bg-blue-100 hover:border-blue-300 transition-colors"
                    >
                      #{tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
          </header>

          {/* Image Section */}
          {article.featured_image && (
            <div className="w-full bg-gray-100 p-4 md:p-10">
              <div className="w-full rounded-lg overflow-hidden shadow-inner">
                <img
                  src={sanitizeImageSrc(getStorageUrl(article.featured_image), fallbackImage)}
                  alt={article.title}
                  className="w-full object-contain"
                  style={{ height: '500px' }}
                />
              </div>
            </div>
          )}

          {/* Article Body Content */}
          <div className="p-6 md:p-10">
            <div className="prose prose-lg max-w-none text-gray-800">
              <div className="whitespace-pre-line leading-relaxed" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.content) }} />
            </div>
            
            {/* Like and Share Section */}
            <div className="max-w-3xl mx-auto mt-12 pt-8 border-t border-gray-200 flex gap-4">
              <button 
                onClick={handleLike}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                  liked 
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {likeCount} {liked ? 'Liked' : 'Like'}
              </button>
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-sm font-bold text-gray-700">
                {article.view_count || 0} Views
              </div>
              <button 
                onClick={() => handleShare('facebook')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-sm font-bold text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Share on Facebook <Share2 size={16} />
              </button>
              <button 
                onClick={() => handleShare('copy')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-sm font-bold text-gray-700 hover:bg-gray-200 transition-colors"
              >
                {copied ? 'Copied!' : 'Copy Link'} <Link size={16} />
              </button>
            </div>
          </div>

        </article>
        
        {/* Related Articles Section */}
        {relatedArticles.length > 0 && (
          <div className="max-w-4xl mx-auto mt-12 px-4">
            <div className="border-t-2 border-gray-200 pt-8">
              <h2 className="text-3xl font-serif font-bold text-gray-900 mb-8 text-left">More from this Category</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedArticles.map((relatedArticle) => (
                  <RelatedCard 
                    key={relatedArticle.id} 
                    article={{
                      title: relatedArticle.title,
                      category: relatedArticle.categories && relatedArticle.categories.length > 0 ? relatedArticle.categories[0].name : 'Uncategorized',
                      date: new Date(relatedArticle.published_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) + ' at ' + new Date(relatedArticle.published_at).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      }),
                      author: relatedArticle.author && relatedArticle.author.user ? relatedArticle.author.user.name : 'Unknown Author',
                      imageUrl: sanitizeImageSrc(getStorageUrl(relatedArticle.featured_image), fallbackImage),
                      excerpt: relatedArticle.excerpt
                    }}
                    onClick={() => navigate('/article/' + relatedArticle.slug)}
                    navigate={navigate}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
