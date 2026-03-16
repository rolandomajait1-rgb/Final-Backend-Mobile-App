import React, { useEffect } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { FiBarChart, FiPlus, FiFileText, FiUsers, FiActivity } from 'react-icons/fi';
import Header from "../components/Header";
import Navigation from "../components/HeaderLink";
import { AdminSidebar } from "../components/AdminSidebar";
import { getUserRole } from '../utils/auth';
import { deleteArticle } from "../utils/auth";

export default function ArticlePage() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const userRole = localStorage.getItem('user_role');

  const handleEdit = () => {
    navigate(`/admin/edit-article/${id}`);
  };

  const handleDelete = async () => {
    const success = await deleteArticle(id);
    if (success) {
      navigate('/admin/statistics');
    }
  };

  const sidebarLinks = [
    { label: "Statistics", icon: <FiBarChart size={16} />, to: "/admin/statistics" },
    { label: "Create Article", icon: <FiPlus size={16} />, to: "/admin/create-article" },
    { label: "Draft Articles", icon: <FiFileText size={16} />, to: "/admin/draft-articles" },
    { label: "Manage Moderators", icon: <FiUsers size={16} />, to: "/admin/manage-moderators" },
    { label: "Audit Trail", icon: <FiActivity size={16} />, to: "/admin/audit-trail" },
  ];

  useEffect(() => {
    document.title = getUserRole() === 'moderator' ? 'Moderator | Dashboard' : 'Admin | Dashboard';
  }, []);

  // Mock article data - replace with actual data fetching
  const article = {
    id: parseInt(id),
    title: "Sample Article Title",
    category: "News",
    author: "admin1@laverdad.edu.ph",
    date: "10/18/2025 10:30 AM",
    image: "https://via.placeholder.com/800x400?text=Article+Image",
    content: "This is the full content of the article. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    tag: "Sample Tag"
  };

  if (!article) return <div className="text-gray-500">Article not found.</div>;

  const showEditButton = userRole === 'admin' || userRole === 'moderator';
  const showDeleteButton = userRole === 'admin';

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <Navigation />
      
      <div className="relative h-15 flex items-center justify-center bg-linear-to-b from-blue-600 to-blue-800">
        <h1 className="text-white font-serif font-bold tracking-widest leading-none text-2xl drop-shadow-lg">
          {getUserRole() === 'moderator' ? 'MODERATOR | Dashboard' : 'ADMIN | Dashboard'}
        </h1>
      </div>

      <div className="flex flex-1">
        {(() => {
          const filtered = getUserRole() === 'moderator' ? sidebarLinks.filter(l => l.label !== 'Manage Moderators') : sidebarLinks;
          return <AdminSidebar links={filtered} />;
        })()}

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
              {/* ✅ Show success message only if redirected after publishing */}
              {state?.published && (
                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded mb-4">
                  Article Published Successfully!
                </div>
              )}

              <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded mb-2">
                {article.category}
              </span>
              <h2 className="text-2xl font-bold mb-2">{article.title}</h2>
              <p className="text-sm text-gray-600 mb-4">
                Written by <span className="font-medium text-blue-600">{article.author}</span><br />
                {article.date}
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

              <img src={article.image} alt="Article" className="w-full rounded-lg mb-4" />
              <p className="text-gray-800">{article.content}</p>

              <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-4">
                {article.tag}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
