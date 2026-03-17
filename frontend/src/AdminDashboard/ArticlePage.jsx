import React, { useEffect, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { FiBarChart, FiPlus, FiFileText, FiUsers, FiActivity } from 'react-icons/fi';
import DOMPurify from 'dompurify';
import Header from "../components/Header";
import Navigation from "../components/HeaderLink";
import { AdminSidebar } from "../components/AdminSidebar";
import { getUserRole, deleteArticle } from "../utils/auth";
import axios from '../utils/axiosConfig';

export default function ArticlePage() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const userRole = getUserRole();

  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const sidebarLinks = [
    { label: "Statistics", icon: <FiBarChart size={16} />, to: "/admin/statistics" },
    { label: "Create Article", icon: <FiPlus size={16} />, to: "/admin/create-article" },
    { label: "Draft Articles", icon: <FiFileText size={16} />, to: "/admin/draft-articles" },
    { label: "Manage Moderators", icon: <FiUsers size={16} />, to: "/admin/manage-moderators" },
    { label: "Audit Trail", icon: <FiActivity size={16} />, to: "/admin/audit-trail" },
  ];

  useEffect(() => {
    document.title = userRole === 'moderator' ? 'MODERATOR | Dashboard' : 'ADMIN | Dashboard';
  }, [userRole]);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const response = await axios.get(`/api/articles/${id}`);
        setArticle(response.data);
      } catch (err) {
        console.error('Error fetching article:', err);
        setError('Failed to load article.');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchArticle();
  }, [id]);

  const handleEdit = () => navigate(`/admin/edit-article/${id}`);

  const handleDelete = async () => {
    const success = await deleteArticle(id);
    if (success) navigate('/admin');
  };

  const showEditButton = userRole === 'admin' || userRole === 'moderator';
  const showDeleteButton = userRole === 'admin';

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <Navigation />
      <div className={`relative h-15 flex items-center justify-center ${userRole === 'moderator' ? 'bg-gradient-to-r from-orange-500 to-yellow-500' : 'bg-gradient-to-b from-blue-600 to-blue-800'}`}>
        <h1 className="text-white font-serif font-bold tracking-widest leading-none text-2xl drop-shadow-lg">
          {userRole === 'moderator' ? 'MODERATOR | Dashboard' : 'ADMIN | Dashboard'}
        </h1>
      </div>

      <div className="flex flex-1">
        {(() => {
          const filtered = userRole === 'moderator' ? sidebarLinks.filter(l => l.label !== 'Manage Moderators') : sidebarLinks;
          return <AdminSidebar links={filtered} />;
        })()}

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
              {state?.published && (
                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded mb-4">
                  Article Published Successfully!
                </div>
              )}

              {loading ? (
                <div className="text-center py-12 text-gray-500">Loading article...</div>
              ) : error ? (
                <div className="text-center py-12 text-red-500">{error}</div>
              ) : article ? (
                <>
                  <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded mb-2">
                    {article.categories?.[0]?.name || 'Uncategorized'}
                  </span>
                  <h2 className="text-2xl font-bold mb-2">{article.title}</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Written by <span className="font-medium text-blue-600">
                      {article.author?.user?.name || article.author_name || 'Unknown'}
                    </span><br />
                    {article.published_at
                      ? new Date(article.published_at).toLocaleString()
                      : new Date(article.created_at).toLocaleString()}
                  </p>

                  <div className="flex gap-3 mb-4">
                    {showEditButton && (
                      <button
                        onClick={handleEdit}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Edit
                      </button>
                    )}
                    {showDeleteButton && (
                      <button
                        onClick={handleDelete}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        Delete
                      </button>
                    )}
                  </div>

                  {article.featured_image && (
                    <img src={article.featured_image} alt="Article" className="w-full rounded-lg mb-4 object-cover max-h-96" />
                  )}

                  <div
                    className="prose max-w-none text-gray-800"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.content || '') }}
                  />

                  {article.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {article.tags.map((tag) => (
                        <span key={tag.id} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          #{tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
