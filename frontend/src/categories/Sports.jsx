import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axiosConfig';
import getCategoryColor from '../utils/getCategoryColor';
import { Calendar, Pencil, Trash2 } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import HeaderLink from '../components/HeaderLink';
import ArticleCard from '../components/ArticleCard';
import { isAdmin } from '../utils/auth';
import logo from '../assets/images/logo.svg';



const RelatedCard = ({ article, onClick }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col group cursor-pointer hover:shadow-md transition-all" onClick={onClick}>
    <div className="relative h-44 overflow-hidden">
      <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
    </div>
    <div className="p-5 flex flex-col grow">
      <div className="flex justify-between items-start mb-3">
        <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${getCategoryColor(article.category)}`}>{article.category}</span>
        <span className="text-gray-500 text-xs font-medium">{article.date}</span>
      </div>
      <h3 className="text-lg font-serif font-bold text-gray-900 mb-3 leading-tight group-hover:text-red-800 transition-colors line-clamp-2 text-left">
        {article.title}
      </h3>
      {article.excerpt && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed text-left">
          {article.excerpt}
        </p>
      )}
      <div className="mt-auto text-right">
        <p className="text-sm text-gray-500 font-medium">{article.author}</p>
      </div>
    </div>
  </div>
);

const LatestCard = ({ article, onClick, onEdit, onDelete }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col sm:flex-row mb-4 group cursor-pointer hover:shadow-md transition-all" onClick={onClick}>
    <div className="sm:w-1/3 relative overflow-hidden h-48 sm:h-auto">
      <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      {(onEdit || onDelete) && (
        <div className="absolute top-2 right-2 flex gap-1">
          {onEdit && (
            <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-1.5 bg-blue-500 text-white rounded shadow hover:bg-blue-600">
              <Pencil size={14}/>
            </button>
          )}
          {onDelete && (
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 bg-red-500 text-white rounded shadow hover:bg-red-600">
              <Trash2 size={14}/>
            </button>
          )}
        </div>
      )}
    </div>
    <div className="p-5 sm:w-2/3 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-0.5 rounded uppercase">{article.category}</span>
          <span className="text-gray-400 text-xs flex items-center gap-1 text-left"><Calendar size={12}/> {article.date}</span>
        </div>
        <h3 className="text-xl font-serif font-bold text-gray-900 mb-2 group-hover:text-blue-800 transition-colors text-left">
          {article.title}
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed line-clamp-2 text-left">
          {article.excerpt}
        </p>
      </div>
      <div className="text-right text-xs text-gray-500 font-medium mt-3">
        {article.author}
      </div>
    </div>
  </div>
);

const MostViewedCard = ({ article, onClick }) => (
  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-3 group cursor-pointer hover:border-red-300 transition-colors" onClick={onClick}>
    <div className="flex justify-between items-center mb-2">
      <span className="text-[10px] text-gray-400 text-left flex items-center gap-1"><Calendar size={10}/> {article.date}</span>
      <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">{article.category}</span>
    </div>
    <h4 className="text-sm font-bold text-gray-800 leading-snug mb-2 group-hover:text-red-700 text-left">
      {article.title}
    </h4>
    <p className="text-gray-600 text-xs leading-relaxed line-clamp-2 mb-2 text-left">
      {article.excerpt}
    </p>
    <div className="text-right text-xs text-gray-500 font-medium">
      {article.author}
    </div>
  </div>
);

export default function Sports() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage] = useState(1);
  const [relatedArticles, setRelatedArticles] = useState([]);

  const handleEdit = (articleId) => {
    navigate(`/admin/edit-article/${articleId}`);
  };

  const handleDelete = async (articleId) => {
    if (window.confirm('Are you sure you want to delete this article?')) {
      try {
        await axios.delete(`/api/articles/${articleId}`);
        setArticles(articles.filter(article => article.id !== articleId));
        alert('Article deleted successfully!');
      } catch (err) {
        console.error('Error deleting article:', err);
        alert('Failed to delete article');
      }
    }
  };

  useEffect(() => {
    const fetchSportsArticles = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get('/api/articles', {
          params: { category: 'sports', page: currentPage }
        });
        setArticles(response.data.data || []);
        
        // Fetch related articles for "More from this Category" section
        const relatedResponse = await axios.get('/api/articles', {
          params: { category: 'sports', limit: 12 }
        });
        const allRelated = relatedResponse.data.data || [];
        const displayedIds = response.data.data.map(article => article.id);
        const filteredRelated = allRelated.filter(article => !displayedIds.includes(article.id)).slice(0, 6);
        setRelatedArticles(filteredRelated);
      } catch (err) {
        console.error('Error fetching sports articles:', err);
        setError('Failed to load sports articles. Please try again later.');
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSportsArticles();
  }, [currentPage]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <HeaderLink />
       <div className="bg-news-bg bg-cover bg-center h-20" style={{
                  backgroundImage: `linear-gradient(to right, #B22222 20%, rgba(178,34,34,0.2)), url('/images/bg.jpg')`
                }}>
          <h1 className="text-5xl font-bold text-white justify-center flex items-center h-full md-8">SPORTS</h1>
        </div>
      <main className="max-w-7xl mx-auto p-4 md:p-8 mt-8 mb-8">
       
        {loading ? (
          <>
            {/* Top Section: Featured + Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden flex flex-col h-144">
                  <div className="relative">
                    <div className="bg-linear-to-r from-gray-100 via-gray-200 to-gray-100 w-full h-96 object-cover animate-pulse"></div>
                  </div>
                  <div className="p-3 flex flex-col grow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="bg-linear-to-r from-red-100 to-red-200 text-xs font-semibold uppercase px-3 py-2 rounded cursor-pointer hover:opacity-80 h-10 w-24 animate-pulse"></div>
                      <div className="bg-linear-to-r from-gray-100 to-gray-200 text-xs text-right flex items-center h-8 w-48 rounded animate-pulse"></div>
                    </div>
                    <div className="bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 font-bold text-gray-900 mb-3 line-clamp-2 text-left text-3xl h-20 rounded animate-pulse"></div>
                    <div className="space-y-4 mb-5 grow">
                      <div className="bg-linear-to-r from-gray-100 via-gray-200 to-gray-100 text-gray-600 line-clamp-3 text-left text-lg h-10 rounded animate-pulse"></div>
                      <div className="bg-linear-to-r from-gray-100 via-gray-200 to-gray-100 text-gray-600 line-clamp-3 text-left text-lg h-10 w-4/5 rounded animate-pulse"></div>
                      <div className="bg-linear-to-r from-gray-100 via-gray-200 to-gray-100 text-gray-600 line-clamp-3 text-left text-lg h-10 w-3/4 rounded animate-pulse"></div>
                    </div>
                    <div className="bg-linear-to-r from-gray-100 to-gray-200 text-gray-500 italic text-right font-medium text-sm h-8 w-48 ml-auto rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-1 flex flex-col gap-8">
                {Array.from({ length: 2 }).map((_, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden flex flex-col max-w-full">
                    <div className="relative">
                      <div className="bg-linear-to-r from-gray-100 via-gray-200 to-gray-100 w-full h-42 object-cover animate-pulse"></div>
                    </div>
                    <div className="p-3 flex flex-col grow">
                      <div className="flex justify-between items-start mb-3">
                        <div className="bg-linear-to-r from-red-100 to-red-200 text-xs font-semibold uppercase px-3 py-2 rounded cursor-pointer hover:opacity-80 h-8 w-22 animate-pulse"></div>
                        <div className="bg-linear-to-r from-gray-100 to-gray-200 text-xs text-right flex items-center h-6 w-32 rounded animate-pulse"></div>
                      </div>
                      <div className="bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 font-bold text-gray-900 mb-3 line-clamp-2 text-left text-base h-8 rounded animate-pulse"></div>
                      <div className="space-y-3 mb-4 grow">
                        <div className="bg-linear-to-r from-gray-100 via-gray-200 to-gray-100 text-gray-600 line-clamp-3 text-left text-xs h-6 rounded animate-pulse"></div>
                        <div className="bg-linear-to-r from-gray-100 via-gray-200 to-gray-100 text-gray-600 line-clamp-3 text-left text-xs h-6 w-4/5 rounded animate-pulse"></div>
                      </div>
                      <div className="bg-linear-to-r from-gray-100 to-gray-200 text-gray-500 italic text-right font-medium text-xs h-6 w-28 ml-auto rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* HR Divider */}
            <div className="bg-linear-to-r from-gray-200 to-gray-300 h-1 mt-8 mb-8 rounded animate-pulse"></div>
            
            {/* Bottom Section: Latests + Most Viewed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 text-3xl font-sans font-normal text-gray-800 mb-6 border-b-2 border-gray-300 pb-2 text-left h-12 rounded animate-pulse"></div>
                <div className="flex flex-col gap-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col sm:flex-row mb-4">
                      <div className="sm:w-1/3 relative overflow-hidden h-48 sm:h-auto">
                        <div className="bg-linear-to-r from-gray-100 via-gray-200 to-gray-100 w-full h-full animate-pulse"></div>
                      </div>
                      <div className="p-5 sm:w-2/3 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <div className="bg-linear-to-r from-red-100 to-red-200 text-xs font-bold px-2 py-0.5 rounded uppercase h-6 w-16 animate-pulse"></div>
                            <div className="bg-linear-to-r from-gray-100 to-gray-200 text-xs h-4 w-24 rounded animate-pulse"></div>
                          </div>
                          <div className="bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 text-xl font-serif font-bold text-gray-900 mb-2 text-left h-8 rounded animate-pulse"></div>
                          <div className="space-y-2">
                            <div className="bg-linear-to-r from-gray-100 via-gray-200 to-gray-100 text-gray-600 text-sm h-5 rounded animate-pulse"></div>
                            <div className="bg-linear-to-r from-gray-100 via-gray-200 to-gray-100 text-gray-600 text-sm h-5 w-3/4 rounded animate-pulse"></div>
                          </div>
                        </div>
                        <div className="bg-linear-to-r from-gray-100 to-gray-200 text-right text-xs text-gray-500 font-medium mt-3 h-4 w-20 ml-auto rounded animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="lg:col-span-1">
                <div className="bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 text-3xl font-sans font-normal text-gray-800 mb-6 border-b-2 border-gray-300 pb-2 text-left h-12 rounded animate-pulse"></div>
                <div className="flex flex-col gap-1">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-3">
                      <div className="flex justify-between items-center mb-2">
                        <div className="bg-linear-to-r from-gray-100 to-gray-200 text-[10px] h-3 w-16 rounded animate-pulse"></div>
                        <div className="bg-linear-to-r from-red-100 to-red-200 text-[10px] font-bold px-1.5 py-0.5 rounded border h-4 w-12 animate-pulse"></div>
                      </div>
                      <div className="bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 text-sm font-bold text-gray-800 leading-snug mb-2 h-6 rounded animate-pulse"></div>
                      <div className="space-y-1 mb-2">
                        <div className="bg-linear-to-r from-gray-100 via-gray-200 to-gray-100 text-gray-600 text-xs h-4 rounded animate-pulse"></div>
                        <div className="bg-linear-to-r from-gray-100 via-gray-200 to-gray-100 text-gray-600 text-xs h-4 w-2/3 rounded animate-pulse"></div>
                      </div>
                      <div className="bg-linear-to-r from-gray-100 to-gray-200 text-right text-xs text-gray-500 font-medium h-3 w-16 ml-auto rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : error ? (
          <div className="text-center text-red-600">{error}</div>
        ) : articles.length === 0 ? (
          <section className="text-center text-gray-500 justify-center py-5 mt-20">
            <div className="flex justify-center mb-4">
              <img src={logo} alt="La Verdad Herald Logo" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Nothing Published Yet</h1>
          Stay tuned, new stories will be up soon.
          </section>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Featured Article */}
              <div className="lg:col-span-2">
                  {articles[0] && (
                  <ArticleCard
                    key={articles[0].id}
                    imageUrl={articles[0].featured_image || 'https://via.placeholder.com/300x200?text=No+Image'}
                    title={articles[0].title}
                    snippet={articles[0].excerpt}
                    category={articles[0].categories && articles[0].categories.length > 0 ? articles[0].categories[0].name : 'Sports'}
                    author={articles[0].author && articles[0].author.user ? articles[0].author.user.name : 'Unknown Author'}
                    date={new Date(articles[0].published_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) + ' at ' + new Date(articles[0].published_at).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                    isLarge={true}
                    slug={articles[0].slug}
                    onEdit={isAdmin() ? handleEdit : undefined}
                    onDelete={isAdmin() ? handleDelete : undefined}
                    articleId={articles[0].id}
                  />
                )}
              </div>

              {/* Right Column: Sidebar Articles */}
              <div className="lg:col-span-1 flex flex-col gap-8">
                  {articles.slice(3, 6).map(article => (
                    <ArticleCard
                      key={article.id}
                      imageUrl={article.featured_image || 'https://placehold.co/300x200/e2e8f0/64748b?text=No+Image'}
                      title={article.title || 'No Title'}
                      snippet={article.excerpt || 'No excerpt available'}
                      category={article.categories && article.categories.length > 0 ? article.categories[0].name : 'Sports'}
                      author={article.author && article.author.user ? article.author.user.name : 'Unknown Author'}
                      date={article.published_at ? new Date(article.published_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) + ' at ' + new Date(article.published_at).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      }) : 'No date'}
                      horizontal={true}
                      slug={article.slug}
                      showRelated={true}
                      onEdit={isAdmin() ? () => handleEdit(article.id) : undefined}
                      onDelete={isAdmin() ? () => handleDelete(article.id) : undefined}
                      articleId={article.id}
                    />
                  ))}
              </div>

            </div>

            <hr className='border-gray-200 border-2 mt-8 mb-8'/>
            {/* BOTTOM SECTION: LATESTS + SIDEBAR */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
              
                <h3 className="text-3xl font-sans font-normal text-gray-800 mb-6 border-b-2 border-gray-300 pb-2 text-left h-12">
                  Latests
                </h3>
                <div className="flex flex-col gap-2">
                  {articles.slice(3).map(article => (
                    <ArticleCard
                      key={article.id}
                      imageUrl={article.featured_image || 'https://placehold.co/300x200/e2e8f0/64748b?text=No+Image'}
                      title={article.title || 'No Title'}
                      snippet={article.excerpt || 'No excerpt available'}
                      category={article.categories && article.categories.length > 0 ? article.categories[0].name : 'Sports'}
                      author={article.author && article.author.user ? article.author.user.name : 'Unknown Author'}
                      date={article.published_at ? new Date(article.published_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) + ' at ' + new Date(article.published_at).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      }) : 'No date'}
                      isMedium={true}
                      slug={article.slug}
                      showRelated={true}
                      onEdit={isAdmin() ? () => handleEdit(article.id) : undefined}
                      onDelete={isAdmin() ? () => handleDelete(article.id) : undefined}
                      articleId={article.id}
                    />
                  ))}
                </div>
              </div>

              <div className="lg:col-span-1">
                <h3 className="text-3xl font-sans font-normal text-gray-800 mb-6 border-b-2 border-gray-300 pb-2 text-left h-12">
                  Most Viewed
                </h3>
                <div className="flex flex-col gap-1">
                  {articles.slice(1, 6).map(article => (
                    <MostViewedCard
                      key={article.id}
                      article={{
                        title: article.title,
                        excerpt: article.excerpt || 'No excerpt available',
                        category: article.categories && article.categories.length > 0 ? article.categories[0].name : 'Sports',
                        date: new Date(article.published_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) + ' at ' + new Date(article.published_at).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        }),
                        author: article.author && article.author.user ? article.author.user.name : 'Unknown Author'
                      }}
                      onClick={() => navigate(`/article/${article.slug}`)}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            {/* Related Articles Section */}
            {relatedArticles.length > 0 && (
              <div className="mt-12 px-4">
                <div className="border-t-2 border-gray-200 pt-8">
                  <h2 className="text-3xl font-serif font-bold text-gray-900 mb-8 text-left">More from this Category</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {relatedArticles.map((relatedArticle) => (
                      <RelatedCard 
                        key={relatedArticle.id} 
                        article={{
                          title: relatedArticle.title,
                          category: relatedArticle.categories && relatedArticle.categories.length > 0 ? relatedArticle.categories[0].name : 'Sports',
                          date: new Date(relatedArticle.published_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }),
                          author: relatedArticle.author && relatedArticle.author.user ? relatedArticle.author.user.name : 'Unknown Author',
                          imageUrl: relatedArticle.featured_image || 'https://placehold.co/400x250/e2e8f0/64748b?text=No+Image',
                          excerpt: relatedArticle.excerpt
                        }}
                        onClick={() => navigate(`/article/${relatedArticle.slug}`)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}


