import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navigation from "../components/HeaderLink";
import { FiBarChart, FiPlus, FiFileText as FiFile, FiUsers, FiActivity } from 'react-icons/fi';
import Header from "../components/Header";
import { AdminSidebar } from "../components/AdminSidebar";
import { getUserRole } from '../utils/auth';
import axios from '../utils/axiosConfig';

export default function EditArticleInline() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [author, setAuthor] = useState("");
  const [status, setStatus] = useState("published");
  const [isFormValid, setIsFormValid] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);

  const sidebarLinks = [
    { label: "Statistics", icon: <FiBarChart size={16} />, to: "/admin/statistics" },
    { label: "Create Article", icon: <FiPlus size={16} />, to: "/admin/create-article" },
    { label: "Draft Articles", icon: <FiFile size={16} />, to: "/admin/draft-articles" },
    { label: "Manage Moderators", icon: <FiUsers size={16} />, to: "/admin/manage-moderators" },
    { label: "Audit Trail", icon: <FiActivity size={16} />, to: "/admin/audit-trail" },
  ];

  useEffect(() => {
    document.title = getUserRole() === 'moderator' ? 'MODERATOR | Dashboard' : 'ADMIN | Dashboard';
  }, []);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [catRes, authRes] = await Promise.all([
          axios.get('/api/categories'),
          axios.get('/api/authors', { params: { per_page: 50 } }),
        ]);
        setCategories(catRes.data || []);
        setAuthors(authRes.data?.data || []);
      } catch (err) {
        console.error('Error fetching meta:', err);
      }
    };
    fetchMeta();
  }, []);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const response = await axios.get(`/api/articles/${id}`);
        const article = response.data;
        setTitle(article.title || '');
        setContent(article.content || '');
        setAuthor(article.author?.user?.name || article.author?.name || article.author_name || '');
        setCategory(article.categories?.[0]?.name || '');
        setTags(article.tags?.map(tag => tag.name).join(', ') || '');
        setStatus(article.status || 'published');
      } catch (error) {
        console.error('Error fetching article:', error);
        alert('Failed to load article.');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchArticle();
  }, [id]);

  useEffect(() => {
    setIsFormValid(!!(title.trim() && category && content.trim() && tags.trim() && author.trim()));
  }, [title, category, content, tags, author]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) setImage(file);
  };

  const handleUpdate = async () => {
    if (!isFormValid) {
      alert("Please fill in all required fields.");
      return;
    }

    setIsUpdating(true);
    try {
      const formData = new FormData();
      formData.append('_method', 'PUT');
      formData.append('title', title);
      formData.append('category', category);
      formData.append('content', content);
      formData.append('tags', tags);
      formData.append('author', author);
      formData.append('status', status);
      if (image) formData.append('featured_image', image);

      await axios.post(`/api/articles/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      alert("Article updated successfully!");
      navigate('/admin');
    } catch (error) {
      console.error('Update error:', error);
      alert(`Error: ${error.response?.data?.error || error.response?.data?.message || error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-100">
        <Header />
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-xl text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

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

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto text-left">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold">Edit Article</h2>
            </div>

            <div className="p-8 bg-white rounded-lg border border-gray-300 shadow-sm flex flex-col gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  placeholder="Enter article title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                <select
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Select Author</option>
                  {authors.map((a) => (
                    <option key={a.id} value={a.name}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
                <label
                  htmlFor="cover-image-inline"
                  className="border-2 border-dashed border-gray-400 rounded-lg bg-gray-50 text-center p-5 cursor-pointer flex flex-col items-center justify-center min-h-40"
                >
                  {image ? (
                    <img src={URL.createObjectURL(image)} alt="Cover Preview" className="max-w-full max-h-64 rounded-lg object-cover" />
                  ) : (
                    <>
                      <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-sm text-gray-500 mt-2">Click or drag image to upload</p>
                    </>
                  )}
                  <input id="cover-image-inline" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. sports, news"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Article Content</label>
                <textarea
                  placeholder="Write your article here..."
                  rows={10}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleUpdate}
                  disabled={!isFormValid || isUpdating}
                  className={`px-8 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isFormValid && !isUpdating ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  }`}
                >
                  {isUpdating ? 'Updating...' : 'Update'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/admin')}
                  className="px-8 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
