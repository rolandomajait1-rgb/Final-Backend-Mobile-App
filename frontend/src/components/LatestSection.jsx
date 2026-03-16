import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from '../utils/axiosConfig';
import ArticleCard from './ArticleCard';
import { PLACEHOLDER_IMAGE } from '../utils/placeholder';

export default function LatestSection({ onEdit, onDelete }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [latestArticles, setLatestArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLatestArticles = async () => {
      try {
        const response = await axios.get('/api/latest-articles', { timeout: 60000 });
        setLatestArticles(response.data);
      } catch (err) {
        console.error('Error fetching latest articles:', err);
        setError('Failed to load latest articles');
      } finally {
        setLoading(false);
      }
    };

    fetchLatestArticles();
  }, []);

  const [publishedToast, setPublishedToast] = useState(false);

  useEffect(() => {
    if (location.state?.published) {
      setPublishedToast(true);
      setTimeout(() => setPublishedToast(false), 5000);
    }
  }, [location.state]);

  if (loading) {
    return (
      <section className="mb-12">
        <h2 className="text-3xl font-bold text-gray-800 mb-5">Latest</h2>
        <div className="text-center text-gray-500">Loading latest articles...</div>
      </section>
    );
  }

  if (error || latestArticles.length === 0) {
    return (
      <section className="mb-12">
        <h2 className="text-3xl font-bold text-gray-800 mb-5">Latest</h2>
        <div className="text-center text-gray-500">
          {error || 'No latest articles available'}
        </div>
      </section>
    );
  }

  const featuredArticle = latestArticles[0] ? {
    imageUrl: latestArticles[0].featured_image || PLACEHOLDER_IMAGE,
    category: latestArticles[0].categories && latestArticles[0].categories.length > 0 ? latestArticles[0].categories[0].name : 'Latest',
    date: new Date(latestArticles[0].published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) + ' at ' + new Date(latestArticles[0].published_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    title: latestArticles[0].title,
    snippet: latestArticles[0].excerpt,
    author: latestArticles[0].author && latestArticles[0].author.user ? latestArticles[0].author.user.name : 'Unknown Author',
    published_at: latestArticles[0].published_at,
    isLarge: true,
    slug: latestArticles[0].slug,
    onEdit,
    onDelete,
    articleId: latestArticles[0].id,
    // intentionally do not set onClick here; we'll wrap the card with a clickable container
  } : null;

  const sideArticles = latestArticles.slice(1, 3).map(article => ({
    imageUrl: article.featured_image || PLACEHOLDER_IMAGE,
    category: article.categories && article.categories.length > 0 ? article.categories[0].name : 'Latest',
    date: new Date(article.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) + ' at ' + new Date(article.published_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    title: article.title,
    snippet: article.excerpt,
    author: article.author && article.author.user ? article.author.user.name : 'Unknown Author',
    published_at: article.published_at,
    isMedium: true,
    slug: article.slug,
    onClick: () => article.slug && navigate(`/article/${article.slug}`),
    onEdit,
    onDelete,
    articleId: article.id
  }));

  return (
    <section className="mb-12">
      {publishedToast && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-800 rounded">
          Article published successfully and is now live on the homepage.
        </div>
      )}
      <h2 className="text-3xl font-bold text-gray-800 text-left  mb-5">Latest</h2>
        <hr className="mb-6" />
        
      {/* 3. Articles Layout */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* 3a. Featured Article (Left) */}
        <div className="w-full lg:w-2/3">
          {featuredArticle && (
            <div
              className="cursor-pointer"
              onClick={() => featuredArticle.slug && navigate(`/article/${featuredArticle.slug}`)}
            >
              <ArticleCard {...featuredArticle} />
            </div>
          )}
        </div>

        {/* 3b. Side Articles (Right) */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          {sideArticles.map((article, index) => (
            <ArticleCard key={latestArticles[index + 1].id || index} {...article} />
          ))}
        </div>

      </div>
    </section>
  );
}
