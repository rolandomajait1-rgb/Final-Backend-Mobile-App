import React, { useState, useEffect } from "react";
import { FiBarChart, FiPlus, FiFileText as FiFile, FiUsers, FiActivity } from 'react-icons/fi';
import { Plus, Pencil, Trash2, Upload, Calendar } from 'lucide-react';
import Header from "../components/Header";
import { AdminSidebar } from "../components/AdminSidebar";
import { getUserRole } from '../utils/auth';
import Navigation from "../components/HeaderLink";
import axios from '../utils/axiosConfig';

const DraftItem = ({ id, title, category, date, summary, author, featuredImage, onEdit, onDelete, onPublish }) => (
  <div className="flex flex-col lg:flex-row gap-4 mb-6">
    <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col sm:flex-row">
      <div className="sm:w-1/3 relative bg-gray-200">
        <img 
          src={featuredImage || "https://placehold.co/600x350/333/FFF?text=NO+IMAGE"} 
          alt="Article Banner" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="sm:w-2/3 p-6 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-2">
            <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 uppercase rounded-sm">
              {category}
            </span>
            <div className="flex items-center text-gray-400 text-xs">
              <Calendar size={12} className="mr-1" />
              {date}
            </div>
          </div>
          <h3 className="text-2xl font-serif font-bold text-black mb-3">
            {title}
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            {summary}
          </p>
        </div>
        <div className="text-right text-xs text-gray-500 font-medium">
          {author}
        </div>
      </div>
    </div>
    <div className="w-full lg:w-48 bg-gray-100 rounded-lg border border-gray-200 flex lg:flex-col items-center justify-center gap-6 p-4 shadow-sm">
      <button onClick={() => onEdit(id)} className="flex items-center gap-3 text-gray-800 hover:text-black transition-colors font-medium group">
        <div className="bg-transparent group-hover:bg-gray-200 p-1 rounded">
          <Pencil size={24} strokeWidth={2} />
        </div>
        <span className="text-lg">Edit</span>
      </button>
      <button onClick={() => onDelete(id)} className="flex items-center gap-3 text-red-500 hover:text-red-700 transition-colors font-medium group">
        <div className="bg-transparent group-hover:bg-red-100 p-1 rounded">
          <Trash2 size={24} strokeWidth={2} />
        </div>
        <span className="text-lg">Delete</span>
      </button>
      <button onClick={() => onPublish(id)} className="flex items-center gap-3 text-sky-500 hover:text-sky-700 transition-colors font-medium group">
        <div className="bg-transparent group-hover:bg-sky-100 p-1 rounded">
          <Upload size={24} strokeWidth={2} />
        </div>
        <span className="text-lg">Publish</span>
      </button>
    </div>
  </div>
);

export default function DraftArticles() {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);

  const sidebarLinks = [
    { label: "Statistics", icon: <FiBarChart size={16} />, to: "/admin/statistics" },
    { label: "Create Article", icon: <FiPlus size={16} />, to: "/admin/create-article" },
    { label: "Draft Articles", icon: <FiFile size={16} />, to: "/admin/draft-articles", active: true },
    { label: "Manage Moderators", icon: <FiUsers size={16} />, to: "/admin/manage-moderators" },
    { label: "Audit Trail", icon: <FiActivity size={16} />, to: "/admin/audit-trail" },
  ];

  useEffect(() => {
    fetchDrafts();
  }, []);

  useEffect(() => {
    document.title = getUserRole() === 'moderator' ? 'MODERATOR | Dashboard' : 'ADMIN | Dashboard';
  }, []);

  const fetchDrafts = async () => {
    try {
      const response = await axios.get('/api/articles', {
        params: {
          status: 'draft',
          limit: 50,
        },
      });
      setDrafts(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching drafts:', error);
      setDrafts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id) => {
    window.location.href = `/admin/edit-article/${id}`;
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this draft?')) {
      try {
        const response = await axios.delete(`/api/articles/${id}`);

        if (response.status >= 200 && response.status < 300) {
          fetchDrafts();
          alert('Draft deleted successfully!');
        } else {
          alert(`Delete failed: ${response.status}`);
        }
      } catch (error) {
        console.error('Error deleting draft:', error);
        alert('Failed to delete draft');
      }
    }
  };

  const handlePublish = async (id) => {
    if (window.confirm('Are you sure you want to publish this article?')) {
      try {
        const draft = drafts.find((item) => item.id === id);
        if (!draft) {
          alert('Draft not found.');
          return;
        }

        const category = draft.categories?.[0]?.name || '';
        const authorName = draft.author?.user?.name || draft.author?.name || '';
        const tags = Array.isArray(draft.tags)
          ? draft.tags.map((tag) => tag.name || tag).join(', ')
          : '';

        if (!category || !authorName || !tags) {
          alert('Draft is missing category, author, or tags. Open edit first, then publish.');
          return;
        }

        const response = await axios.put(`/api/articles/${id}`, {
          title: draft.title,
          content: draft.content,
          category,
          tags,
          author: authorName,
          status: 'published',
        });

        if (response.status >= 200 && response.status < 300) {
          fetchDrafts();
          alert('Article published successfully!');
        } else {
          alert(`Publish failed: ${response.status}`);
        }
      } catch (error) {
        console.error('Error publishing article:', error);
        alert(error.response?.data?.error || error.response?.data?.message || `Failed to publish article: ${error.message}`);
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <Navigation />
      <div className={`relative h-15 flex items-center justify-center ${getUserRole() === 'moderator' ? 'bg-gradient-to-r from-orange-500 to-yellow-500' : 'bg-gradient-to-b from-blue-600 to-blue-800'}`}>
        <h1 className="text-white font-serif font-bold tracking-widest leading-none text-2xl drop-shadow-lg">
          {getUserRole() === 'moderator' ? 'MODERATOR | Dashboard' : 'ADMIN | Dashboard'}
        </h1>
      </div>

      <div className="flex flex-1">
        {(() => {
          const filtered = getUserRole() === 'moderator' ? sidebarLinks.filter(l => l.label !== 'Manage Moderators') : sidebarLinks;
          return <AdminSidebar links={filtered} />;
        })()}

        <div className="flex flex-col h-full bg-gray-50">
          <div className="p-8 flex flex-col flex-1">
            <div className="flex items-center gap-4 mb-6">
              <h1 className="text-4xl font-serif font-bold text-black">Drafts</h1>
              <button className="hover:bg-gray-200 p-2 rounded-full transition-colors">
                <Plus size={32} className="text-black stroke-[2.5]" />
              </button>
            </div>
            <div className={`flex-1 ${loading ? 'flex justify-center items-center' : ''}`}>
              {loading ? (
                <div className="text-center">Loading drafts...</div>
              ) : drafts.length > 0 ? (
                <div className="space-y-2">
                  {drafts.map((draft) => (
                    <DraftItem
                      key={draft.id}
                      id={draft.id}
                      title={draft.title}
                      category={draft.categories?.[0]?.name || 'Uncategorized'}
                      date={new Date(draft.created_at).toLocaleDateString()}
                      summary={draft.content?.substring(0, 200) + '...' || 'No content available'}
                      author={draft.author?.user?.name || 'Unknown Author'}
                      featuredImage={draft.featured_image}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onPublish={handlePublish}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-gray-500">No drafts found.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
