import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import Header from '../components/Header';
import Navigation from '../components/HeaderLink';
import Footer from '../components/Footer';
import axios from '../utils/axiosConfig';

const SearchResultCard = ({ imageUrl, title, excerpt, category, date, author, onClick }) => (
  <div onClick={onClick} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row mb-6 hover:shadow-md transition-shadow cursor-pointer group">
    <div className="md:w-1/3 relative overflow-hidden h-48 md:h-auto">
      <img src={imageUrl} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
    </div>
    <div className="p-6 md:w-2/3 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded uppercase">{category}</span>
          <div className="flex items-center text-gray-400 text-xs">
            <Calendar size={12} className="mr-1" />{date}
          </div>
        </div>
        <h3 className="text-2xl font-serif font-bold text-gray-900 mb-3 group-hover:text-blue-800 transition-colors">{title}</h3>
        <p className="text-gray-600 text-sm leading-relaxed mb-4">{excerpt}</p>
      </div>
      <div className="text-right text-xs text-gray-500 font-medium">{author}</div>
    </div>
  </div>
);

export default function TagSearchResults() {
  const { tag } = useParams();
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  const hashtags = [
    '#LVCCTeachers', '#MyTeacherMyHero', '#LVCCSocialWork', '#LVCCSWSAP',
    '#NSED2025', '#EarthquakeDrillSeminar', '#BasicJournalismTraining',
    '#NationalPressFreedomDay', '#RamonMagsaysay118', '#CoroDeLaVerdad',
    '#HappyNationalHeroesDay',
  ];

  useEffect(() => {
    if (!tag) return;
    const fetchArticlesByTag = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/articles/search', { params: { q: tag } });
        setArticles(response.data.data || []);
      } catch (err) {
        console.error('Error fetching articles by tag:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchArticlesByTag();
  }, [tag]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <Navigation />
      <main className="grow">
        <div
          className="text-white py-8 px-4 md:px-12 mb-8 shadow-inner"
          style={{ backgroundImage: 'linear-gradient(to right, rgba(59, 130, 246, 0.5), rgba(165, 243, 252, 0.5)), url(/images/bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
          <div className="container mx-auto flex justify-between items-center">
            <h2 className="text-4xl font-bold font-sans">#{tag}</h2>
            <span className="font-medium bg-white/20 px-4 py-1 rounded-full text-sm backdrop-blur-sm">
              Articles Found: {articles.length}
            </span>
          </div>
        </div>

        <div className="container mx-auto px-4 md:px-12 flex flex-col lg:flex-row gap-12">
          <div className="lg:w-2/3">
            <h3 className="text-2xl font-serif text-gray-800 mb-6 pb-2 border-b border-gray-300 text-left">Latest Articles</h3>
            {loading ? (
              <div className="flex justify-center items-center text-gray-500 animate-pulse">Loading articles...</div>
            ) : articles.length > 0 ? (
              articles.map(article => (
                <SearchResultCard
                  key={article.id}
                  imageUrl={article.featured_image || 'https://placehold.co/600x400/3b82f6/ffffff?text=No+Image'}
                  title={article.title}
                  category={article.categories?.[0]?.name || 'Uncategorized'}
                  date={article.published_at ? new Date(article.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                  excerpt={article.excerpt}
                  author={article.author?.user?.name || 'Unknown'}
                  onClick={() => navigate(`/article/${article.slug}`)}
                />
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">No articles found for this tag.</div>
            )}
          </div>

          <div className="lg:w-1/3">
            <h3 className="text-2xl font-serif text-gray-800 mb-6 pb-2 border-b border-gray-300">Explore</h3>
            <div className="flex flex-wrap gap-2">
              {hashtags.map(hashtag => (
                <button
                  key={hashtag}
                  className="px-3 py-1 bg-white border border-gray-300 rounded-full text-sm text-gray-600 hover:bg-gray-100 hover:border-gray-400 transition-all"
                  onClick={() => navigate(`/tag/${hashtag.replace('#', '')}`)}
                >
                  {hashtag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
