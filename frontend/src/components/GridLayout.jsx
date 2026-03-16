import React from 'react';
import { Pencil, Trash2, Calendar } from 'lucide-react';
import { isAdmin, isModerator } from '../utils/auth';

// Main Featured Article Card (Large, left side)
export const MainFeaturedCard = ({ article, onEdit, onDelete }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col sm:flex-row mb-4 group cursor-pointer hover:shadow-md transition-all">
    <div className="sm:w-1/3 relative overflow-hidden h-48 sm:h-auto">
      <img src={article.imageUrl || article.featured_image} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      {(isAdmin() || isModerator()) && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); onEdit(article.id); }} className="p-1.5 bg-blue-500 text-white rounded shadow hover:bg-blue-600"><Pencil size={12}/></button>
          {isAdmin() && <button onClick={(e) => { e.stopPropagation(); onDelete && onDelete(article.id); }} className="p-1.5 bg-red-500 text-white rounded shadow hover:bg-red-600"><Trash2 size={12}/></button>}
        </div>
      )}
    </div>
    <div className="p-5 sm:w-2/3 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded uppercase">{article.category}</span>
          <span className="text-gray-400 text-xs flex items-center gap-1"><Calendar size={12}/> {article.date}</span>
        </div>
        <h3 className="text-xl font-serif font-bold text-gray-900 mb-2 group-hover:text-blue-800 transition-colors">
          {article.title}
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
          {article.excerpt}
        </p>
      </div>
      <div className="text-right text-xs text-gray-500 font-medium mt-3">
        {article.author}
      </div>
    </div>
  </div>
);

// Sub Featured Cards (Right side, stacked)
export const SubFeaturedCard = ({ article, onEdit, onDelete }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col group cursor-pointer flex-1">
    <div className="h-30 overflow-hidden relative shrink-0">
      <img src={article.imageUrl || article.featured_image} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      {(isAdmin() || isModerator()) && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); onEdit(article.id); }} className="p-1.5 bg-blue-500 text-white rounded shadow hover:bg-blue-600"><Pencil size={14}/></button>
          {isAdmin() && <button onClick={(e) => { e.stopPropagation(); onDelete && onDelete(article.id); }} className="p-1.5 bg-red-500 text-white rounded shadow hover:bg-red-600"><Trash2 size={14}/></button>}
        </div>
      )}
    </div>
    <div className="p-4 flex flex-col grow">
       <div className="flex justify-between items-center mb-2">
         <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">{article.category}</span>
       </div>
       <h3 className="text-sm md:text-md font-serif font-bold text-gray-900 mb-2 leading-snug group-hover:text-blue-800 transition-colors line-clamp-3">
         {article.title}
       </h3>
       <p className="text-xs text-gray-500 font-medium mt-auto text-right">{article.date}</p>
    </div>
  </div>
);

// Latest Articles Card (Horizontal layout)
export const LatestCard = ({ article, onEdit, onDelete }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col sm:flex-row mb-4 group cursor-pointer hover:shadow-md transition-all">
    <div className="sm:w-1/3 relative overflow-hidden h-44 sm:h-auto">
      <img src={article.imageUrl || article.featured_image} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      {(isAdmin() || isModerator()) && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); onEdit(article.id); }} className="p-1.5 bg-blue-500 text-white rounded shadow hover:bg-blue-600"><Pencil size={12}/></button>
          {isAdmin() && <button onClick={(e) => { e.stopPropagation(); onDelete && onDelete(article.id); }} className="p-1.5 bg-red-500 text-white rounded shadow hover:bg-red-600"><Trash2 size={12}/></button>}
        </div>
      )}
    </div>
    <div className="p-5 sm:w-2/3 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded uppercase">{article.category}</span>
          <span className="text-gray-400 text-xs flex items-center gap-1"><Calendar size={12}/> {article.date}</span>
        </div>
        <h3 className="text-xl font-serif font-bold text-gray-900 mb-2 group-hover:text-blue-800 transition-colors">
          {article.title}
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
          {article.excerpt}
        </p>
      </div>
      <div className="text-right text-xs text-gray-500 font-medium mt-3">
        {article.author}
      </div>
    </div>
  </div>
);

// Most Viewed Sidebar Card (Compact)
export const MostViewedCard = ({ article }) => (
  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-3 group cursor-pointer hover:border-blue-300 transition-colors">
    <div className="flex justify-between items-center mb-2">
      <span className="text-[10px] text-gray-400">{article.date}</span>
      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">{article.category}</span>
    </div>
    <h4 className="text-sm font-bold text-gray-800 leading-snug mb-2 group-hover:text-blue-700">
      {article.title}
    </h4>
  </div>
);

// Main Grid Layout Component
export const ArticleGrid = ({ mainFeatured, subFeatured, latests, mostViewed, onEdit, onDelete }) => (
  <div className="container mx-auto px-4 md:px-12 py-8">
    {/* Section Header */}
    <div className="flex justify-center mb-8">
      <div className="bg-[#1E4B7A] text-white px-12 py-2 rounded shadow-md relative">
         <h2 className="text-3xl font-serif font-bold tracking-wide">NEWS</h2>
      </div>
    </div>

    {/* FEATURED SECTION */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12 items-stretch">
      {/* Main Feature */}
      <div className="lg:col-span-2 min-h-[500px]">
        <MainFeaturedCard article={mainFeatured} onEdit={onEdit} onDelete={onDelete} />
      </div>
      
      {/* Sub Features */}
      <div className="lg:col-span-1 flex flex-col gap-6 h-full">
        {subFeatured.map((article, idx) => (
          <SubFeaturedCard key={idx} article={article} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
    </div>

    {/* BOTTOM SECTION: LATESTS + SIDEBAR */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <h3 className="text-2xl font-sans font-normal text-gray-800 mb-6 border-b border-gray-300 pb-2">
          Latests
        </h3>
        <div className="flex flex-col gap-2">
          {latests.map((article, idx) => (
            <LatestCard key={idx} article={article} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      </div>

      <div className="lg:col-span-1">
         <h3 className="text-2xl font-sans font-normal text-gray-800 mb-6 border-b border-gray-300 pb-2">
          Most Viewed
        </h3>
        <div className="flex flex-col gap-1">
          {mostViewed.map((article, idx) => (
            <MostViewedCard key={idx} article={article} />
          ))}
        </div>
      </div>
    </div>
  </div>
);