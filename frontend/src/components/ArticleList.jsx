import React from 'react';
import ArticleCard from './ArticleCard';

const ArticleList = ({ title, articles, showOnlyPublished = true }) => {
  // Filter articles to show only published ones
  const filteredArticles = showOnlyPublished 
    ? articles?.filter(article => article.isPublished !== false)
    : articles;

  // If no articles are provided, show a message
  if (!filteredArticles || filteredArticles.length === 0) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">{title}</h2>
        <p className="text-gray-500">No published articles to display.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredArticles.map((article) => (
          <ArticleCard
            key={article.id}
            category={article.categories && article.categories.length > 0 ? article.categories[0].name : 'Uncategorized'}
            title={article.title}
            author={article.author && article.author.user ? article.author.user.name : 'Unknown Author'}
            date={new Date(article.published_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }) + ' at ' + new Date(article.published_at).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            })}
            imageUrl={article.featured_image_url}
            excerpt={article.excerpt}
            slug={article.slug}
            isPublished={article.isPublished !== false}
            articleId={article.id}
          />
        ))}
      </div>
    </div>
  );
};

export default ArticleList;
