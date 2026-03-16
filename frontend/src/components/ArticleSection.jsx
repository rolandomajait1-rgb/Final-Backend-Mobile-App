import ArticleCard from './ArticleCard';

export default function ArticleSection({ title, articles = [] }) {
  return (
    <section>
      <h2 className="text-2xl font-bold mb-4">
        {title}{' '}
        <span className="text-gray-500 font-normal ml-2">| {articles.length}</span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article, index) => (
          <ArticleCard key={article.id || index} article={article} />
        ))}
      </div>
    </section>
  );
}
