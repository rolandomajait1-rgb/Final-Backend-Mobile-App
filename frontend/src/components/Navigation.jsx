import React from 'react';
import { Link } from 'react-router-dom';
import SearchBar from './SearchBar';

const Navigation = () => {
  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-blue-600">
            La Verdad Herald
          </Link>
          
          <div className="flex items-center space-x-6">
            <Link to="/" className="hover:text-blue-600">Home</Link>
            <Link to="/category/news" className="hover:text-blue-600">News</Link>
            <Link to="/category/article" className="hover:text-blue-600">Articles</Link>
            <SearchBar />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;