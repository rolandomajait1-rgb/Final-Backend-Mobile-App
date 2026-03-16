import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FiBarChart, FiPlus, FiFileText as FiFile, FiUsers, FiActivity } from 'react-icons/fi';
import { X, Plus } from 'lucide-react';
import { Editor } from '@tinymce/tinymce-react';
import Header from "../components/Header";
import Navigation from "../components/HeaderLink";
import { AdminSidebar } from "../components/AdminSidebar";
import { getUserRole } from '../utils/auth';
import axios from '../utils/axiosConfig';

export default function CreateArticle() {
  const navigate = useNavigate();
  const editorRef = useRef(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [authorName, setAuthorName] = useState("");
  const [isFormValid, setIsFormValid] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [categories, setCategories] = useState([]);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('/api/categories');
        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);



  useEffect(() => {
    const valid = title.trim() && category && content.trim() && tags.length > 0 && authorName.trim();
    setIsFormValid(valid);
  }, [title, category, content, tags, authorName]);

  const sidebarLinks = [
    { label: "Statistics", icon: <FiBarChart size={16} />, to: "/admin/statistics" },
    { label: "Create Article", icon: <FiPlus size={16} />, to: "/admin/create-article", active: true },
    { label: "Draft Articles", icon: <FiFile size={16} />, to: "/admin/draft-articles" },
    { label: "Manage Moderators", icon: <FiUsers size={16} />, to: "/admin/manage-moderators" },
    { label: "Audit Trail", icon: <FiActivity size={16} />, to: "/admin/audit-trail" },
  ];

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim().startsWith('#') ? newTag.trim() : `#${newTag.trim()}`]);
      setNewTag('');
    }
  };

  const removeTag = (index) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const validateForm = () => {
    if (!title.trim() || !category || !content.trim() || tags.length === 0 || !authorName.trim()) {
      alert("Please fill in all required fields before publishing.");
      return false;
    }
    return true;
  };

  const handleSaveDraft = async () => {
    if (!title.trim()) {
      alert("Please enter a title before saving draft.");
      return;
    }
    if (!category) {
      alert("Please select a category before saving draft.");
      return;
    }
    if (!authorName.trim()) {
      alert("Please enter an author name before saving draft.");
      return;
    }

    setIsSavingDraft(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('category_id', category);
      // TinyMCE already outputs HTML, no need to format
      formData.append('content', content);
      
      // Send tags as array, not comma-separated string
      const tagArray = tags.map(tag => tag.replace('#', ''));
      tagArray.forEach(tag => {
        formData.append('tags[]', tag);
      });
      
      formData.append('status', 'draft');
      formData.append('author_name', authorName);

      if (image) {
        formData.append('featured_image', image);
      }

      const response = await axios.post('/api/articles', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      alert("Draft saved successfully!");
      navigate('/admin/draft-articles');
    } catch (error) {
      console.error('Save draft error:', error);
      alert(`Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handlePublish = async () => {
    if (!validateForm()) {
      return;
    }

    setIsPublishing(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('category_id', category);
      // TinyMCE already outputs HTML, no need to format
      formData.append('content', content);
      
      // Send tags as array, not comma-separated string
      const tagArray = tags.map(tag => tag.replace('#', ''));
      tagArray.forEach(tag => {
        formData.append('tags[]', tag);
      });
      
      formData.append('status', 'published');
      formData.append('author_name', authorName);

      if (image) {
        formData.append('featured_image', image);
      }

      await axios.post('/api/articles', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      alert("Article published successfully!");
      navigate('/admin');
    } catch (error) {
      console.error('Publish error:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'Failed to publish article. ';
      
      if (error.response?.data?.errors) {
        // Laravel validation errors
        const errors = error.response.data.errors;
        errorMessage += Object.entries(errors)
          .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
          .join('\n');
      } else if (error.response?.data?.message) {
        errorMessage += error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage += error.response.data.error;
      } else {
        errorMessage += error.message;
      }
      
      alert(errorMessage);
    } finally {
      setIsPublishing(false);
    }
  };
  
  const dashboardTitle = getUserRole() === 'moderator' ? 'MODERATOR | Dashboard' : 'ADMIN | Dashboard';
  const isMod = getUserRole() === 'moderator';
  
  useEffect(() => {
    document.title = dashboardTitle;
  }, [dashboardTitle]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <Navigation/>
      <div className={`relative h-15 flex items-center justify-center ${isMod ? 'bg-gradient-to-r from-orange-500 to-yellow-500' : 'bg-gradient-to-b from-blue-600 to-blue-800'}`}>
        <h1 className="text-white font-serif font-bold tracking-widest leading-none text-2xl drop-shadow-lg">
          {dashboardTitle}
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
              <h2 className="text-2xl font-semibold">
                Create New Article
              </h2>
            </div>
            

            <div className="p-8 bg-white rounded-lg border border-gray-300 shadow-sm flex flex-col gap-5">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  id="title"
                  type="text"
                  placeholder="Enter article title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="authorName" className="block text-sm font-medium text-gray-700 mb-1">Author Name</label>
                  <input
                    id="authorName"
                    type="text"
                    placeholder="Enter author name"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="block text-gray-700 font-medium text-sm">
                <h1>Cover image</h1>
              </div>
              <label
                htmlFor="cover-image"
                className="border-2 border-dashed border-gray-400 rounded-lg bg-gray-50 text-center p-5 cursor-pointer flex flex-col items-center justify-center min-h-40"
              >
                {image ? (
                  <img
                    src={URL.createObjectURL(image)}
                    alt="Cover Preview"
                    className="max-w-full max-h-64 rounded-lg object-cover"
                  />
                ) : (
                  <>
                    <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm text-gray-500 mt-2">Click or drag image to upload</p>
                  </>
                )}
                <input
                  id="cover-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="newTag" className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  
                  <div className="flex flex-wrap gap-3 mb-2">
                    {tags.map((tag, index) => (
                      <div key={index} className="flex items-center bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium border border-gray-300">
                        <button onClick={() => removeTag(index)} className="mr-2 hover:text-black">
                          <X size={14} strokeWidth={3} />
                        </button>
                        {tag}
                      </div>
                    ))}
                  </div>

                  <div className="relative">
                    <button 
                      type="button"
                      onClick={addTag}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-black transition-colors cursor-pointer"
                    >
                      <Plus size={24} strokeWidth={1.5} />
                    </button>
                    <input 
                      id="newTag"
                      type="text" 
                      placeholder="Add Tags"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="w-full p-2 pl-12 border border-gray-400 rounded-md text-gray-800 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all placeholder-gray-400"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">Article Content</label>
                <Editor
                  apiKey="no-api-key"
                  onInit={(evt, editor) => editorRef.current = editor}
                  value={content}
                  onEditorChange={(newContent) => setContent(newContent)}
                  init={{
                    height: 500,
                    menubar: true,
                    plugins: [
                      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                      'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                    ],
                    toolbar: 'undo redo | blocks | ' +
                      'bold italic forecolor | alignleft aligncenter ' +
                      'alignright alignjustify | bullist numlist outdent indent | ' +
                      'removeformat | help',
                    content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                    placeholder: 'Type your article content here...',
                  }}
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={!isFormValid || isPublishing}
                  className={`px-8 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isFormValid && !isPublishing
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  }`}
                >
                  {isPublishing ? 'Publishing...' : 'Publish'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={!title.trim() || isSavingDraft}
                  className={`px-8 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                    title.trim() && !isSavingDraft
                      ? 'bg-gray-600 text-white hover:bg-gray-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isSavingDraft ? 'Saving...' : 'Save Draft'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(getUserRole() === 'moderator' ? '/moderator' : '/admin')}
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