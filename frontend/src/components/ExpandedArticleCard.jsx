import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Pencil, Trash2, ThumbsUp, Share2, Link as LinkIcon } from 'lucide-react';
import axios from '../utils/axiosConfig';
import { isAdmin, isModerator } from '../utils/auth';
import { sanitizeHtml } from '../utils/sanitize';

const ArticleHeader = ({ article, navigate }) => (
  <div className="mb-8">
    <div className="flex justify-between items-start mb-4">
      <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 uppercase rounded">
        {article.categories && article.categories.length > 0 ? article.categories[0].name : 'UNCATEGORIZED'}
      </span>
      {(isAdmin() || isModerator()) && (
        <div className="flex gap-2">
          <button onClick={() => navigate(`/admin/edit-article/${article.id}`)} className="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded hover:bg-blue-600 transition-colors">Edit</button>
          {isAdmin() && <button className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded hover:bg-red-600 transition-colors">Delete</button>}
        </div>
      )}
    </div>

    <h1 className="text-3xl md:text-5xl font-serif font-bold text-gray-900 mb-4">
      {article.title}
    </h1>

    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-6">
      <div className="text-sm text-gray-600">
        <p>Written by <span className="font-bold text-blue-600">
          {article.author && article.author.user ? article.author.user.name : 'Unknown Author'}
        </span></p>
        <p className="text-gray-500 text-xs mt-1">
          {new Date(article.published_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })} at {new Date(article.published_at).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          })}
        </p>
      </div>
    </div>
  </div>
);

const ArticleBody = ({ article }) => (
  <article className="prose prose-lg max-w-none text-gray-800 font-serif leading-relaxed">
    {article.featured_image && (
      <div className="mb-8 bg-blue-50 rounded-xl p-4 md:p-8 flex flex-col items-center">
        <img 
          src={article.featured_image} 
          alt="Featured Illustration" 
          className="w-full max-w-2xl h-auto rounded shadow-sm mb-2"
        />
      </div>
    )}

    <div className="max-w-3xl mx-auto space-y-6 text-center md:text-left">
      {article.excerpt && (
        <p className="italic text-gray-600">
          {article.excerpt}
        </p>
      )}
      
      <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content) }} />
    </div>
  </article>
);

const ActionButtons = ({ likes }) => (
  <div className="max-w-3xl mx-auto mt-12 pt-8 border-t border-gray-200 flex gap-4">
    <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-sm font-bold text-gray-700 hover:bg-gray-200 transition-colors">
      {likes} Likes <ThumbsUp size={16} />
    </button>
    <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-sm font-bold text-gray-700 hover:bg-gray-200 transition-colors">
      Share on Facebook <Share2 size={16} />
    </button>
    <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-sm font-bold text-gray-700 hover:bg-gray-200 transition-colors">
      Copy Link <LinkIcon size={16} />
    </button>
  </div>
);

const RelatedCard = ({ article, onClick, navigate }) => (
  <div onClick={onClick} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col group cursor-pointer hover:shadow-md transition-all">
    <div className="relative h-48 overflow-hidden">
      <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      {(isAdmin() || isModerator()) && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="p-1.5 bg-blue-500 text-white rounded shadow hover:bg-blue-600" onClick={(e) => { e.stopPropagation(); navigate(`/admin/edit-article/${article.id}`); }}><Pencil size={12}/></button>
          {isAdmin() && <button className="p-1.5 bg-red-500 text-white rounded shadow hover:bg-red-600" onClick={(e) => e.stopPropagation()}><Trash2 size={12}/></button>}
        </div>
      )}
    </div>
    <div className="p-4 flex flex-col grow">
      <div className="flex justify-between items-center mb-2">
        <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">{article.category}</span>
        <span className="text-gray-400 text-[10px]">{article.date}</span>
      </div>
      <h3 className="text-md font-serif font-bold text-gray-900 mb-2 leading-snug group-hover:text-blue-800 transition-colors line-clamp-2">
        {article.title}
      </h3>
      <p className="text-xs text-gray-500 mt-auto">{article.author}</p>
    </div>
  </div>
);

export default function ExpandedArticleCard() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [currentArticle, setCurrentArticle] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const response = await axios.get('/api/articles/by-slug/' + slug);
        const article = response.data;
        setCurrentArticle(article);
        
        if (article.categories && article.categories.length > 0) {
          const categoryName = article.categories[0].name;
          const relatedResponse = await axios.get('/api/articles', {
            params: { category: categoryName.toLowerCase(), limit: 6 }
          });
          const filtered = relatedResponse.data.data.filter(a => a.id !== article.id).slice(0, 6);
          setRelatedArticles(filtered);
        }
      } catch (error) {
        console.error('Error fetching article:', error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchArticle();
    }
  }, [slug]);

  if (loading) {
    return <div className="text-center py-12">Loading article...</div>;
  }

  if (!currentArticle) {
    return <div className="text-center py-12">Article not found</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 font-sans">
      <main className="grow container mx-auto px-4 md:px-12 py-12">
        <div className="bg-white p-6 md:p-12 rounded-xl shadow-sm mb-16">
          <ArticleHeader article={currentArticle} navigate={navigate} />
          <ArticleBody article={currentArticle} />
          <ActionButtons likes={0} />
        </div>

        <div className="border-t-2 border-gray-200 pt-8">
          <h2 className="text-3xl font-serif font-bold text-gray-900 mb-8">More from this Category</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedArticles.map((article) => (
              <RelatedCard 
                key={article.id} 
                article={{
                  id: article.id,
                  title: article.title,
                  category: article.categories && article.categories.length > 0 ? article.categories[0].name : 'Uncategorized',
                  date: new Date(article.published_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  }),
                  author: article.author && article.author.user ? article.author.user.name : 'Unknown Author',
                  imageUrl: article.featured_image || 'https://placehold.co/400x250/e2e8f0/64748b?text=No+Image'
                }}
                onClick={() => navigate('/article/' + article.slug)}
                navigate={navigate}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
