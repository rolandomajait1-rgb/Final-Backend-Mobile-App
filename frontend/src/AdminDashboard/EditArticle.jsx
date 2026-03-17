import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Upload, ChevronDown } from 'lucide-react';
import DOMPurify from 'dompurify';
import { Editor } from '@tinymce/tinymce-react';
import Header from "../components/Header";
import Navigation from '../components/HeaderLink';

import axios from '../utils/axiosConfig';
import { getStorageUrl } from '../utils/apiConfig';
import { sanitizeImageSrc } from '../utils/safeUrl';

export default function EditArticle() {
  const navigate = useNavigate();
  const { id } = useParams();
  const editorRef = useRef(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [author, setAuthor] = useState("");
  const [status, setStatus] = useState("published");
  const [isFormValid, setIsFormValid] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const fallbackImage = 'https://via.placeholder.com/300x200/e2e8f0/64748b?text=No+Image';

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
    const fetchAuthors = async () => {
      try {
        const response = await axios.get('/api/authors', { params: { per_page: 50 } });
        setAuthors(response.data?.data || []);
      } catch (error) {
        console.error('Error fetching authors:', error);
      }
    };
    fetchCategories();
    fetchAuthors();
  }, []);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const response = await axios.get(`/api/articles/${id}`);
        const article = response.data;
        setTitle(article.title || "");
        setAuthor(typeof article.author === 'string' ? article.author : (article.author?.name || article.author?.user?.name || ""));
        setCategory(article.categories?.[0]?.name || "");
        const tagsString = Array.isArray(article.tags)
          ? article.tags.map(tag => tag.name || tag).join(', ')
          : (article.tags || '');
        setTags(tagsString);
        setContent(DOMPurify.sanitize(article.content || ""));
        setCurrentImage(article.featured_image || null);
        setStatus(article.status || 'published');
      } catch (error) {
        console.error('Error fetching article:', error);
        alert(`Failed to load article: ${error.response?.status || 'network error'}`);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchArticle();
    }
  }, [id]);

  useEffect(() => {
    const valid = title.trim() && category && content.trim() && tags.trim() && String(author).trim();
    setIsFormValid(valid);
  }, [title, category, content, tags, author]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
    }
  };

  const validateForm = () => {
    if (!title.trim() || !category || !content.trim() || !tags.trim() || !String(author).trim()) {
      alert("Please fill in all required fields before updating.");
      return false;
    }
    return true;
  };

  const handleUpdate = async () => {
    if (!validateForm()) {
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
      if (image) {
        formData.append('featured_image', image);
      }

      const response = await axios.post(`/api/articles/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.status >= 200 && response.status < 300) {
        alert("Article updated successfully!");
        navigate('/admin');
      } else {
        throw new Error(`Failed to update article: ${response.status}`);
      }
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
          <div className="text-gray-500">Loading article...</div>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Navigation />
      <div className="p-4 md:p-8 font-sans text-gray-900 flex justify-center">
        <div className="w-full max-w-2xl">
          <h1 className="text-2xl font-serif  text-left font-bold mb-6 text-black tracking-tight">
            Edit Article
          </h1>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="title" className="block text-md font-normal text-left  text-gray-800">Title</label>
              <input 
                id="title"
                type="text" 
                value={title}
                placeholder="Enter article title"
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 border border-gray-400 rounded-md text-gray-800 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="author" className="block text-md font-normal text-left text-gray-800">Author</label>
              <select
                id="author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full p-2 border border-gray-400 rounded-md text-gray-800 bg-white focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
              >
                <option value="">Select Author</option>
                {authors.map((a) => (
                  <option key={a.id} value={a.name}>{a.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <div className="text-gray-700 font-medium text-sm">
                <h1>Cover image</h1>
              </div>
              <label
                htmlFor="cover-image"
                className="border-2 border-dashed border-gray-400 rounded-lg bg-gray-50 text-center p-5 cursor-pointer flex flex-col items-center justify-center min-h-40"
              >
                {(image || currentImage) ? (
                  <img
                    src={sanitizeImageSrc(
                      image
                        ? URL.createObjectURL(image)
                        : currentImage
                          ? getStorageUrl(
                              currentImage.startsWith('http')
                                ? currentImage
                                : (currentImage.startsWith('/storage/')
                                    ? currentImage
                                    : `/storage/${String(currentImage).replace(/^\/+/, '')}`)
                            )
                          : fallbackImage,
                      fallbackImage
                    )}
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
            </div>

            <div className="space-y-2">
               <label htmlFor="category" className="block text-md font-normal text-left text-gray-800">Category</label>
               <div className="relative">
                 <select 
                    id="category"
                    value={category}
                    placeholder="Select Category"
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2 border border-gray-400 rounded-md text-gray-800 appearance-none bg-white focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all cursor-pointer"
                 >
                   <option value="">Select Category</option>
                   {categories.map((cat) => (
                     <option key={cat.id} value={cat.name}>
                       {cat.name}
                     </option>
                   ))}
                 </select>
                 <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <ChevronDown className="text-gray-500" size={24} strokeWidth={1.5} />
                 </div>
               </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="tags" className="block text-md font-normal text-left text-gray-800">Tags</label>
              <input 
                id="tags"
                type="text" 
                value={tags}
                placeholder="Add tags"
                onChange={(e) => setTags(e.target.value)}
                className="w-full p-2 border border-gray-400 rounded-md text-gray-800 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="content" className="block text-md font-normal text-left text-gray-800">Article Content</label>
              <Editor
                apiKey={import.meta.env.VITE_TINYMCE_API_KEY || 'no-api-key'}
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
                  placeholder: 'Write your article content here...',
                }}
              />
            </div>

            <div className="pt-4 flex flex-col md:flex-row justify-end gap-2">
              <button 
                onClick={handleUpdate}
                disabled={!isFormValid || isUpdating}
                className="px-6 py-2 bg-[#5195ea] text-white font-bold rounded-md hover:bg-blue-600 transition-colors shadow-sm disabled:opacity-50"
              >
                {isUpdating ? 'Saving...' : 'Save'}
              </button>
              <button 
                onClick={() => navigate(-1)}
                className="px-6 py-2 bg-[#8d9896] text-white font-bold rounded-md hover:bg-gray-600 transition-colors shadow-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
