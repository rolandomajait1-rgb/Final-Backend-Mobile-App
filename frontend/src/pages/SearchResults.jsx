import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from '../utils/axiosConfig';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const [results, setResults] = useState([]);
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';

  useEffect(() => {
    if (!query) return;
    const search = async () => {
      try {
        const response = await axios.get('/api/articles/search', { params: { q: query } });
        setResults(response.data.data || []);
      } catch (err) {
        console.error('Search error:', err);
      }
    };
    search();
  }, [query]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Search Results for "{query}"</h1>
      
      {results.length > 0 ? (
        <div>
          <h2 className="text-xl font-semibold mb-4">Articles ({results.length})</h2>
          <div className="space-y-6">
            {results.map(article => (
              <div
                key={article.id}
                onClick={() => navigate(`/article/${article.slug}`)}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex gap-2 mb-2">
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                    {article.categories?.[0]?.name || 'Uncategorized'}
                  </span>
                </div>
                <h2 className="text-xl font-semibold mb-2">{article.title}</h2>
                <p className="text-gray-600 mb-2">{article.excerpt}</p>
                <div className="text-sm text-gray-500">
                  {article.author?.user?.name || 'Unknown'}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : query ? (
        <p className="text-gray-600">No articles found matching your search.</p>
      ) : null}
    </div>
  );
};

export default SearchResults;