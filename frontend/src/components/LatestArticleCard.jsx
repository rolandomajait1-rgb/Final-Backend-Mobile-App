import React, { useState, useEffect } from 'react';
import ArticleCard from './ArticleCard';
import { Link } from 'react-router-dom';
import axios from '../utils/axiosConfig';

export default function LatestArticles() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLatestArticles = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get('/api/articles/public', {
          params: { latest: true, limit: 9 },
          timeout: 180000,
        });
        const articlesData = response.data.data || response.data || [];
        setArticles(Array.isArray(articlesData) ? articlesData : []);
      } catch (err) {
        console.error('Error fetching latest articles:', err);
        setError('Failed to load latest articles. Please try again later.');
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestArticles();
  }, []);

  return (
    <section id="articles" aria-labelledby="articles-heading" className="py-12 bg-gray-50 border-t border-gray-200 flex items-center justify-center min-h-screen">
      <div className="max-w-6xl mx-auto px-4 w-full">
        <h2 id="articles-heading" className="text-4xl  text-cyan-800 text-center font-serif">
          Latest Articles
        </h2>
        <p className="text-gray-600 text-center mt-2 mb-10 text-2xl">
          Sign in to read the full articles.
        </p>

        {loading ? (
          <div className="text-center text-gray-500">Loading latest articles...</div>
        ) : error ? (
          <div className="text-center text-red-600">{error}</div>
        ) : articles.length === 0 ? (
          <div className="text-center text-gray-500">No articles available.</div>
        ) : (
          <>
            {/* Article Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.map((article) => (
                <ArticleCard
                  key={article.id}
                  featured_image={article.featured_image_url || 'https://via.placeholder.com/300x200?text=No+Image'}
                  categories={article.categories}
                  published_at={article.published_at}
                  title={article.title}
                  excerpt={article.excerpt}
                  author={article.author}
                  onEdit={null}
                  onDelete={null}
                />
              ))}
            </div>

            {/* "Sign In" Button */}
            <div className="text-center mt-12">
              <Link
                to="/login"
                className="bg-cyan-700 text-white px-10 py-3.5 rounded-lg font-semibold text-lg hover:bg-cyan-800 transition-colors"
              >
                Sign in to Read More
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
