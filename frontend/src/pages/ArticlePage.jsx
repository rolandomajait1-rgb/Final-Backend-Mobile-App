import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import HeaderLink from '../components/HeaderLink';
import ArticleDetail from '../components/ArticleDetail';

export default function ArticlePage() {

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <HeaderLink />
      
      <main className="grow container mx-auto px-4 md:px-12 py-12">
        <ArticleDetail />
      </main>

      <Footer />
    </div>
  );
}