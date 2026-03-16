import React, { useState, useEffect } from 'react';
import { Mail, Lock, LogOut, Edit2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axiosConfig';
import Header from '../components/Header';
import Footer from '../components/Footer';
import HeaderLink from '../components/HeaderLink';
import ArticleCard from '../components/ArticleCard';

const ProfileSidebar = ({ user, onLogout, onChangePassword }) => (
  <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 flex flex-col items-center text-center h-fit sticky top-20">
    <div className="w-32 h-32 mb-4 relative">
      <div className="w-full h-full rounded-full border-4 border-blue-900/10 p-1">
        <img src={user?.avatar || 'https://ui-avatars.com/api/?name=User&background=0D47A1&color=fff&size=128'} alt="Profile" className="w-full h-full rounded-full object-cover" />
      </div>
    </div>
    <h2 className="font-serif text-2xl font-bold text-gray-900 mb-1">{user?.name || 'User Name'}</h2>
    <p className="text-sm text-gray-500 mb-6">Joined {user?.joined || 'N/A'}</p>
    <div className="w-full space-y-4 text-left">
      <div>
        <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-1">
          <Mail size={16} /> Email
        </label>
        <div className="bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm text-gray-600 break-all">
          {user?.email || 'user@example.com'}
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="flex items-center gap-2 text-sm font-bold text-gray-800">
            <Lock size={16} /> Password
          </label>
          <button onClick={onChangePassword} className="text-xs flex items-center gap-1 text-gray-500 border border-gray-300 px-2 py-0.5 rounded hover:bg-gray-50">
            Change Password <Edit2 size={10} />
          </button>
        </div>
        <div className="text-xs text-gray-500 mb-1">Last configured: {user?.lastConfigured || 'N/A'}</div>
        <div className="bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm text-gray-600">
          <span>••••••••••••••</span>
        </div>
      </div>
      <hr className="my-4 border-gray-200 pt-50" />
      <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-300 rounded text-gray-700 font-medium hover:bg-gray-50 transition">
        <LogOut size={18} /> Log Out
      </button>
    </div>
  </div>
);



const Pagination = () => (
  <div className="flex justify-center items-center gap-2 mt-8">
    <button className="w-10 h-10 flex items-center justify-center rounded bg-slate-300 text-white hover:bg-slate-400 transition disabled:opacity-50">
      <ChevronLeft size={20} />
    </button>
    <button className="w-10 h-10 flex items-center justify-center rounded bg-slate-700 text-white font-bold shadow-md">1</button>
    <button className="w-10 h-10 flex items-center justify-center rounded bg-slate-300 text-slate-600 font-bold hover:bg-slate-400 hover:text-white transition">2</button>
    <button className="w-10 h-10 flex items-center justify-center rounded bg-slate-300 text-slate-600 font-bold hover:bg-slate-400 hover:text-white transition">3</button>
    <button className="w-10 h-10 flex items-center justify-center rounded bg-slate-300 text-white hover:bg-slate-400 transition">
      <ChevronRight size={20} />
    </button>
  </div>
);

const AccountPage = () => {
  const [userData, setUserData] = useState(null);
  const [sharedArticles, setSharedArticles] = useState([]);
  const [likedArticles, setLikedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ current_password: '', password: '', password_confirmation: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      navigate('/login');
      return;
    }

    const abortController = new AbortController();

    const fetchData = async () => {
      try {
        const [userResponse, sharedResponse, likedResponse] = await Promise.all([
          axios.get('/api/user', { signal: abortController.signal }),
          axios.get('/api/user/shared-articles', { signal: abortController.signal }),
          axios.get('/api/user/liked-articles', { signal: abortController.signal })
        ]);

        const userWithJoinedDate = {
          ...userResponse.data,
          name: userResponse.data.name,
          email: userResponse.data.email,
          avatar: userResponse.data.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(userResponse.data.name)}&background=0D47A1&color=fff&size=128`,
          joined: new Date(userResponse.data.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          lastConfigured: '10/22/2025'
        };
        setUserData(userWithJoinedDate);
        
        const transformArticle = (article) => {
          const formatDate = (dateString) => {
            if (!dateString) return 'N/A';
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) + 
                   ' at ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
          };
          
          return {
            ...article,
            author: article.author?.user?.name || article.author?.name || 'Unknown',
            category: article.categories?.[0]?.name || 'Uncategorized',
            image: article.featured_image_url || article.featured_image || 'https://via.placeholder.com/800x600',
            date: formatDate(article.published_at || article.created_at),
            excerpt: article.excerpt || article.content?.substring(0, 100) + '...' || ''
          };
        };
        
        setSharedArticles((sharedResponse.data.data || []).map(transformArticle));
        setLikedArticles((likedResponse.data.data || []).map(transformArticle));
      } catch (err) {
        if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED' || err.message?.includes('cancel')) {
          return;
        }
        if (err.response && err.response.status === 401) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_email');
          navigate('/login');
          return;
        }
        console.error('Fetch error:', err);
        setError(`Failed to fetch data: ${err.response?.data?.message || err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      abortController.abort();
    };
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await axios.post('/api/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_email');
      navigate('/');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/change-password', passwordData);
      alert('Password changed successfully!');
      setShowPasswordModal(false);
      setPasswordData({ current_password: '', password: '', password_confirmation: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to change password');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Header />
      <HeaderLink/>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          <div className="w-full lg:w-1/3 xl:w-1/4 shrink-0">
            <ProfileSidebar user={userData} onLogout={handleLogout} onChangePassword={() => setShowPasswordModal(true)} />
          </div>

          <div className="flex-1 min-w-0">
            
            <div className="mb-16">
              <div className="flex items-baseline gap-2 mb-6 border-b border-gray-200 pb-2">
                <h2 className="text-2xl font-bold text-gray-900">Shared Articles</h2>
                <span className="text-gray-500 text-xl font-light">| {sharedArticles.length}</span>
              </div>
              
              {sharedArticles.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No shared articles yet</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {sharedArticles.map(article => (
                      <ArticleCard 
                        key={article.id}
                        articleId={article.id}
                        slug={article.slug}
                        title={article.title}
                        excerpt={article.excerpt}
                        featured_image={article.featured_image_url || article.featured_image}
                        categories={article.categories}
                        published_at={article.published_at || article.created_at}
                        author={article.author}
                      />
                    ))}
                  </div>
                  <Pagination />
                </>
              )}
            </div>

            <div>
              <div className="flex items-baseline gap-2 mb-6 border-b border-gray-200 pb-2">
                <h2 className="text-2xl font-bold text-gray-900">Liked Articles</h2>
                <span className="text-gray-500 text-xl font-light">| {likedArticles.length}</span>
              </div>
              
              {likedArticles.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No liked articles yet</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {likedArticles.map((article) => (
                      <ArticleCard 
                        key={`liked-${article.id}`}
                        articleId={article.id}
                        slug={article.slug}
                        title={article.title}
                        excerpt={article.excerpt}
                        featured_image={article.featured_image_url || article.featured_image}
                        categories={article.categories}
                        published_at={article.published_at || article.created_at}
                        author={article.author}
                      />
                    ))}
                  </div>
                  <Pagination />
                </>
              )}
            </div>

          </div>
        </div>
      </main>

      <Footer />

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-6">Change Password</h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">Current Password</label>
                <input
                  type="password"
                  value={passwordData.current_password}
                  onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">New Password</label>
                <input
                  type="password"
                  value={passwordData.password}
                  onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                  minLength={8}
                  pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}"
                  title="Password must contain at least 8 characters, including uppercase, lowercase, and numbers"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.password_confirmation}
                  onChange={(e) => setPasswordData({ ...passwordData, password_confirmation: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#265C79] hover:bg-[#1e4a61] text-white font-bold py-2 px-4 rounded"
                >
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountPage;
