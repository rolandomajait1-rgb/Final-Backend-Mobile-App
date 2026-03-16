import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Pencil, Trash2 } from 'lucide-react';
import Header from '../components/Header';
import Navigation from '../components/HeaderLink';
import { isAdmin, isModerator } from '../utils/auth';
import axios from '../utils/axiosConfig';

const AuthorHero = ({ author, articles }) => (
  <div className="relative w-full h-80 md:h-60 bg-[#3a6080] overflow-hidden flex items-center">
    <div className="absolute inset-0">
      <img
        src="/images/bg.jpg"
        alt="Background"
        className="w-full h-full object-cover opacity-40 mix-blend-overlay"
      />
      <div className="absolute inset-0 bg-gradient-to-right from-[#2d5472] via-[#3a6080] to-[#2d5472] opacity-20"></div>
    </div>
    <div className="container mx-auto px-4 md:px-12 relative z-10 flex flex-col md:flex-row items-center justify-between w-full">
      <div className="flex items-center gap-6 mb-4 md:mb-0">
        <img
          src="/images/logo.svg"
          alt="Logo"
          className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-[#d4af37] shadow-2xl object-cover"
        />
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-white drop-shadow-lg tracking-wide">
          {author?.name || 'Author Name'}
        </h1>
      </div>
      <div className="text-white font-bold text-lg md:text-xl tracking-wide mt-4 md:mt-0">
        Articles Found: {articles?.length || 0}
      </div>
    </div>
  </div>
);

const ArticleCard = ({ article, onClick, navigate }) => (
  <div
    className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden flex flex-col group cursor-pointer hover:shadow-lg transition-all"
    onClick={onClick}
  >
    <div className="relative h-48 overflow-hidden">
      <img
        src={article.image_url || 'https://placehold.co/400x250/e2e8f0/64748b?text=Article+Image'}
        alt={article.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      {(isAdmin() || isModerator()) && (
        <div className="absolute top-2 right-2 flex gap-1">
          <button
            className="p-1.5 bg-blue-500 text-white rounded shadow hover:bg-blue-600"
            onClick={(e) => { e.stopPropagation(); navigate(`/admin/edit-article/${article.id}`); }}
          >
            <Pencil size={14} />
          </button>
          {isAdmin() && (
            <button
              className="p-1.5 bg-red-500 text-white rounded shadow hover:bg-red-600"
              onClick={(e) => e.stopPropagation()}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}
    </div>
    <div className="p-5 flex flex-col grow text-left">
      <div className="flex justify-between items-center mb-3">
        <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2 py-1 rounded uppercase">
          {article.category}
        </span>
        <div className="flex items-center text-gray-400 text-[11px]">
          <Calendar size={12} className="mr-1" />
          {new Date(article.created_at).toLocaleDateString()}
        </div>
      </div>
      <h3 className="text-lg font-serif font-bold text-gray-900 mb-3 leading-snug group-hover:text-blue-800 transition-colors">
        {article.title}
      </h3>
      <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed">
        {article.excerpt || article.content?.substring(0, 150) + '...'}
      </p>
      <p className="text-xs text-gray-500 mt-auto pt-4 border-t border-gray-100">
        {article.author}
      </p>
    </div>
  </div>
);

export default function AuthorProfile() {
  const { authorName } = useParams();
  const navigate = useNavigate();
  const [author, setAuthor] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authorName) return;
    const fetchAuthorData = async () => {
      try {
        const response = await axios.get(`/api/authors/${encodeURIComponent(authorName)}`);
        setAuthor(response.data.author);
        setArticles(response.data.articles);
      } catch (error) {
        console.error('Error fetching author data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAuthorData();
  }, [authorName]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-100">
        <Header />
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-xl">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 font-sans">
      <Header />
      <Navigation />
      <AuthorHero author={author} articles={articles} />
      <main className="grow container mx-auto px-4 md:px-12 py-12">
        <h2 className="text-3xl font-serif font-normal text-gray-800 mb-6 pb-4 border-b text-left border-gray-300">
          Latest Articles
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {articles.map((article, idx) => (
            <ArticleCard
              key={article.id || idx}
              article={article}
              onClick={() => navigate(`/article/${article.slug}`)}
              navigate={navigate}
            />
          ))}
        </div>
        {articles.length === 0 && (
          <div className="text-center text-gray-500 py-10">
            No articles found for this author: {authorName}
          </div>
        )}
      </main>
    </div>
  );
}
