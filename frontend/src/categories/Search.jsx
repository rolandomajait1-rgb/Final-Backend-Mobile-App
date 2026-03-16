import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axiosConfig';
import { FaSearch } from 'react-icons/fa';
import Header from '../components/Header';
import Footer from '../components/Footer';
import HeaderLink from '../components/HeaderLink';
import ArticleCard from '../components/ArticleCard';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const performSearch = async (searchQuery) => {
      if (searchQuery.trim().length > 2) {
        if (searchQuery.startsWith('#')) {
          const tag = searchQuery.replace('#', '');
          navigate(`/tag/${tag}`);
          return;
        }
        
        setLoading(true);
        setError(null);
        try {
          const response = await axios.get('/api/articles/search', {
            params: { q: searchQuery }
          });
          setResults(response.data.data || []);
        } catch (err) {
          console.error('Error searching articles:', err);
          setError('Failed to search articles. Please try again.');
          setResults([]);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
        setLoading(false);
        setError(null);
      }
    };

    const debounceTimer = setTimeout(() => performSearch(query), 300);
    return () => clearTimeout(debounceTimer);
  }, [query, navigate]);

  const handleSearchClick = () => {
    if (query.trim().length > 2) {
      if (query.startsWith('#')) {
        const tag = query.replace('#', '');
        navigate(`/tag/${tag}`);
        return;
      }
      
      setLoading(true);
      setError(null);
      axios.get('/api/articles/search', {
        params: { q: query }
      }).then(response => {
        setResults(response.data.data || []);
      }).catch(err => {
        console.error('Error searching articles:', err);
        setError('Failed to search articles. Please try again.');
        setResults([]);
      }).finally(() => {
        setLoading(false);
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <HeaderLink />

      <main className="container mx-auto mt-8 px-50 py-10 grow">
          <h1 className="text-3xl font-bold text-black justify-center flex items-center h-full md-8">Search Articles</h1>

        <div className="mb-6 mt-8 m-50 relative">
          <input
            type="text"
            placeholder="Search for articles or hashtags (#tag)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black-500 focus:border-transparent text-lg"
            autoFocus
          />
          <FaSearch
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer hover:text-gray-600"
            onClick={handleSearchClick}
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="animate-pulse bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                <div className="bg-gray-200 h-48 rounded-lg"></div>
                <div className="mt-4 space-y-2">
                  <div className="bg-gray-200 h-4 rounded w-3/4"></div>
                  <div className="bg-gray-200 h-4 rounded w-full"></div>
                  <div className="bg-gray-200 h-3 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center text-red-600 py-8">{error}</div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {results.map((article) => (
              <ArticleCard
                key={article.id}
                articleId={article.id}
                imageUrl={article.featured_image || 'https://via.placeholder.com/300x200?text=No+Image'}
                title={article.title}
                excerpt={article.excerpt}
                snippet={article.excerpt}
                category={article.categories && article.categories.length > 0 ? article.categories[0].name : 'Uncategorized'}
                author={article.author && article.author.user ? article.author.user.name : 'Unknown Author'}
                date={new Date(article.published_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                }) + ' at ' + new Date(article.published_at).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}
                slug={article.slug}
                onClick={() => navigate(`/article/${article.slug}`)}
              />
            ))}
          </div>
        ) : query.trim().length > 2 ? (
          <section className="text-center text-gray-500 justify-center py-5 mt-20">
            <div className="flex justify-center mb-4">
              <img src="/images/logo.svg" alt="La Verdad Herald Logo" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              No articles found for "{query}"</h1>
            Try adjusting your search terms.
          </section>
        ) : (
          <section className="text-center text-gray-500 justify-center py-5 mt-20">
            <div className="flex justify-center mb-4">
              <img src="/images/logo.svg" alt="La Verdad Herald Logo" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Start Searching</h1>
            Enter keywords to find articles.
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}

