import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ContentSection from '../components/ContentSection';
import ArticleCard from '../components/ArticleCard';
import LatestSection from '../components/LatestSection';
import EmptyState from '../components/EmptyState';
import Navigation from '../components/HeaderLink';
import { PLACEHOLDER_IMAGE } from '../utils/placeholder';
import { getUserRole } from '../utils/auth';
import { FiExternalLink } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axiosConfig';

export default function HomePage() {
  const navigate = useNavigate();
  const userRole = getUserRole();
  
  const [newsArticles, setNewsArticles] = useState([]);
  const [literaryArticles, setLiteraryArticles] = useState([]);
  const [specialsArticles, setSpecialsArticles] = useState([]);
  const [opinionArticles, setOpinionArticles] = useState([]);
  const [artArticles, setArtArticles] = useState([]);
  const [featuresArticles, setFeaturesArticles] = useState([]);
  const [sportsArticles, setSportsArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleOpenAdminDashboard = () => {
    navigate('/admin/statistics');
  };

  useEffect(() => {
    let isMounted = true;
    
    const fetchHomePageArticles = async () => {
      setLoading(true);
      setError(null);
      try {
        const categories = ['news', 'literary', 'specials', 'opinion', 'art', 'features', 'sports'];
        const promises = categories.map(category =>
          axios.get(`/api/categories/${category}/articles`)
            .then(response => response.data)
        );

        const responses = await Promise.all(promises);

        if (isMounted) {
          setNewsArticles(responses[0].data || []);
          setLiteraryArticles(responses[1].data || []);
          setSpecialsArticles(responses[2].data || []);
          setOpinionArticles(responses[3].data || []);
          setArtArticles(responses[4].data || []);
          setFeaturesArticles(responses[5].data || []);
          setSportsArticles(responses[6].data || []);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching home page articles:', err);
          console.error('Error details:', err.response?.data || err.message);
          setError(`Failed to load articles: ${err.response?.status || err.message}`);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchHomePageArticles();
    
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <Navigation />

      <main className="container mx-auto px-12 py-8 grow">
        
        {(userRole === 'admin' || userRole === 'moderator') && (
          <header className="bg-cyan-700 text-white p-2 flex justify-between items-center shadow-md mb-6">
            <h1 className="text-2xl font-serif">Welcome, Admin</h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleOpenAdminDashboard}
                className="flex items-center space-x-2 px-4 py-2 text-1xl font-medium text-white hover:text-blue-300"
              >
                <span>OPEN ADMIN DASHBOARD</span>
                <FiExternalLink />
              </button>
            </div>
          </header>
        )}

        <LatestSection />
        
        <ContentSection title="NEWS" bgColor="bg-blue-600" viewAllUrl="/category/news">
          {loading ? (
            <div className="text-center text-gray-500 mt-4">Loading news articles...</div>
          ) : error ? (
            <div className="text-center text-red-600 mt-4">{error}</div>
          ) : newsArticles.length === 0 ? (
            <div className="text-center text-gray-500 mt-4">No news articles available.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
              {newsArticles.map(article => (
                <ArticleCard
                  key={article.id}
                  articleId={article.id}
                  imageUrl={article.featured_image || PLACEHOLDER_IMAGE}
                  title={article.title}
                  excerpt={article.excerpt}
                  category={article.categories && article.categories.length > 0 ? article.categories[0].name : 'News'}
                  slug={article.slug}
                  onClick={() => navigate(`/article/${article.slug}`)}
                />
              ))}
            </div>
          )}
        </ContentSection>
        
        <ContentSection title="LITERARY" bgColor="bg-green-600" viewAllUrl="/category/literary">
          {loading ? (
            <div className="text-center text-gray-500 mt-4">Loading literary articles...</div>
          ) : error ? (
            <div className="text-center text-red-600 mt-4">{error}</div>
          ) : literaryArticles.length === 0 ? (
            <div className="text-center text-gray-500 mt-4">No literary articles available.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
              {literaryArticles.map(article => (
                <ArticleCard
                  key={article.id}
                  articleId={article.id}
                  imageUrl={article.featured_image || PLACEHOLDER_IMAGE}
                  title={article.title}
                  excerpt={article.excerpt}
                  category={article.categories && article.categories.length > 0 ? article.categories[0].name : 'Literary'}
                  slug={article.slug}
                  onClick={() => navigate(`/article/${article.slug}`)}
                />
              ))}
            </div>
          )}
        </ContentSection>
        
        <ContentSection title="SPECIALS" bgColor="bg-purple-600" viewAllUrl="/category/specials">
          {loading ? (
            <div className="text-center text-gray-500 mt-4">Loading specials articles...</div>
          ) : error ? (
            <div className="text-center text-red-600 mt-4">{error}</div>
          ) : specialsArticles.length === 0 ? (
            <div className="text-center text-gray-500 mt-4">No specials articles available.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
              {specialsArticles.map(article => (
                <ArticleCard
                  key={article.id}
                  articleId={article.id}
                  imageUrl={article.featured_image || PLACEHOLDER_IMAGE}
                  title={article.title}
                  excerpt={article.excerpt}
                  category={article.categories && article.categories.length > 0 ? article.categories[0].name : 'Specials'}
                  slug={article.slug}
                  onClick={() => navigate(`/article/${article.slug}`)}
                />
              ))}
            </div>
          )}
        </ContentSection>
        
        <ContentSection title="OPINION" bgColor="bg-gray-700" viewAllUrl="/category/opinion">
          {loading ? (
            <div className="text-center text-gray-500 mt-4">Loading opinion articles...</div>
          ) : error ? (
            <div className="text-center text-red-600 mt-4">{error}</div>
          ) : opinionArticles.length === 0 ? (
            <div className="text-center text-gray-500 mt-4">No opinion articles available.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
              {opinionArticles.map(article => (
                <ArticleCard
                  key={article.id}
                  articleId={article.id}
                  imageUrl={article.featured_image || PLACEHOLDER_IMAGE}
                  title={article.title}
                  excerpt={article.excerpt}
                  category={article.categories && article.categories.length > 0 ? article.categories[0].name : 'Opinion'}
                  slug={article.slug}
                  onClick={() => navigate(`/article/${article.slug}`)}
                />
              ))}
            </div>
          )}
        </ContentSection>
        
        <ContentSection title="ART" bgColor="bg-indigo-500" viewAllUrl="/category/art">
          {loading ? (
            <div className="text-center text-gray-500 mt-4">Loading art articles...</div>
          ) : error ? (
            <div className="text-center text-red-600 mt-4">{error}</div>
          ) : artArticles.length === 0 ? (
            <div className="text-center text-gray-500 mt-4">No art articles available.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
              {artArticles.map(article => (
                <ArticleCard
                  key={article.id}
                  articleId={article.id}
                  imageUrl={article.featured_image || PLACEHOLDER_IMAGE}
                  title={article.title}
                  excerpt={article.excerpt}
                  category={article.categories && article.categories.length > 0 ? article.categories[0].name : 'Art'}
                  slug={article.slug}
                  onClick={() => navigate(`/article/${article.slug}`)}
                />
              ))}
            </div>
          )}
        </ContentSection>
        
        <ContentSection title="FEATURES" bgColor="bg-yellow-500" viewAllUrl="/category/features">
          {loading ? (
            <div className="text-center text-gray-500 mt-4">Loading features articles...</div>
          ) : error ? (
            <div className="text-center text-red-600 mt-4">{error}</div>
          ) : featuresArticles.length === 0 ? (
            <EmptyState categoryName="Features" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
              {featuresArticles.map(article => (
                <ArticleCard
                  key={article.id}
                  articleId={article.id}
                  imageUrl={article.featured_image || PLACEHOLDER_IMAGE}
                  title={article.title}
                  excerpt={article.excerpt}
                  category={article.categories && article.categories.length > 0 ? article.categories[0].name : 'Features'}
                  slug={article.slug}
                  onClick={() => navigate(`/article/${article.slug}`)}
                />
              ))}
            </div>
          )}
        </ContentSection>
        
        <ContentSection title="SPORTS" bgColor="bg-red-600" viewAllUrl="/category/sports">
          {loading ? (
            <div className="text-center text-gray-500 mt-4">Loading sports articles...</div>
          ) : error ? (
            <div className="text-center text-red-600 mt-4">{error}</div>
          ) : sportsArticles.length === 0 ? (
            <div className="text-center text-gray-500 mt-4">No sports articles available.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
              {sportsArticles.map(article => (
                <ArticleCard
                  key={article.id}
                  articleId={article.id}
                  imageUrl={article.featured_image || PLACEHOLDER_IMAGE}
                  title={article.title}
                  excerpt={article.excerpt}
                  category={article.categories && article.categories.length > 0 ? article.categories[0].name : 'Sports'}
                  slug={article.slug}
                  onClick={() => navigate(`/article/${article.slug}`)}
                />
              ))}
            </div>
          )}
        </ContentSection>
      </main>
      <Footer />
    </div>
  );
}
