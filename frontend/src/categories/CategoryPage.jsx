import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArticleGrid } from '../components/GridLayout';
import Header from '../components/Header';
import HeaderLink from '../components/HeaderLink';
import Footer from '../components/Footer';
import axios from '../utils/axiosConfig';

const CategoryPage = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  const categoryColors = {
    'news': 'bg-blue-600',
    'sports': 'bg-red-600', 
    'opinion': 'bg-gray-600',
    'literary': 'bg-green-600',
    'features': 'bg-yellow-600',
    'specials': 'bg-indigo-600',
    'art': 'bg-purple-600'
  };

  useEffect(() => {
    const fetchCategoryArticles = async () => {
      try {
        const response = await axios.get(`/api/categories/${category}/articles`);
        setArticles(response.data.data || []);
      } catch (error) {
        console.error('Error fetching articles:', error);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryArticles();
  }, [category]);

  const formatArticleData = (article) => ({
    id: article.id,
    title: article.title,
    excerpt: article.excerpt,
    category: article.categories?.[0]?.name || category.toUpperCase(),
    date: new Date(article.published_at).toLocaleDateString(),
    author: article.author?.user?.name || 'Unknown Author',
    imageUrl: article.featured_image,
    slug: article.slug
  });

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-100">
        <Header />
        <HeaderLink />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Loading {category} articles...</div>
        </div>
        <Footer />
      </div>
    );
  }

  const formattedArticles = articles.map(formatArticleData);
  const mainFeatured = formattedArticles[0] || {};
  const subFeatured = formattedArticles.slice(1, 3);
  const latests = formattedArticles.slice(3, 7);
  const mostViewed = formattedArticles.slice(0, 6);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <HeaderLink />
      
      <main className="grow">
        <div className="container mx-auto px-4 md:px-12 py-8">
          {/* Category Header */}
          <div className="flex justify-center mb-8">
            <div className={`${categoryColors[category] || 'bg-gray-600'} text-white px-12 py-2 rounded shadow-md`}>
              <h2 className="text-3xl font-serif font-bold tracking-wide">{category.toUpperCase()}</h2>
            </div>
          </div>

          {articles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No {category} articles available.</p>
            </div>
          ) : (
            <ArticleGrid
              mainFeatured={mainFeatured}
              subFeatured={subFeatured}
              latests={latests}
              mostViewed={mostViewed}
              onEdit={(id) => navigate(`/admin/edit-article/${id}`)}
            />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CategoryPage;
