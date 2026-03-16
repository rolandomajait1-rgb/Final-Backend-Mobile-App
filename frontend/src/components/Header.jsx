import { FaUser } from 'react-icons/fa';
import { FiLogOut } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from '../utils/axiosConfig';

function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const role = localStorage.getItem('user_role');
    setIsLoggedIn(!!token);
    setUserRole(role);
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post('/api/logout');
    } catch (err) {
      // proceed regardless
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_email');
      localStorage.removeItem('user_role');
      localStorage.removeItem('user_name');
      navigate('/login');
    }
  };



  const handleAdminAccess = () => {
    navigate('/admin/statistics');
  };

  return (
    <header
      className="flex w-full items-center px-8 py-6 bg-cover bg-right"
      style={{
        backgroundImage: `linear-gradient(to right, #2a5a82 20%, rgba(42,90,130,0.2)), url('/images/header.png')`
      }}
    >

      {/* Invisible spacer to push content to center */}
      <div className="flex-1"></div>

      {/* === CENTERED CONTENT === */}
      <div className="flex flex-col items-center gap-2">
        {/* Images */}
        <div className="flex items-center gap-6">
          <img
            src="/images/logo.svg"
            alt="La Verdad Logo"
            className="h-[70px] w-auto cursor-pointer"
            onClick={() => {
              if (isLoggedIn && (userRole === 'admin' || userRole === 'moderator')) {
                navigate('/admin');
              } else {
                navigate('/home');
              }
            }}
          />

          <img
            src="/images/la verdad herald.svg"
            alt="La Verdad Herald"
            className="h-[50px] w-auto cursor-pointer"
            onClick={() => {
              if (isLoggedIn && (userRole === 'admin' || userRole === 'moderator')) {
                navigate('/admin');
              } else {
                navigate('/home');
              }
            }}
          />
        </div>
      </div>

      {/* Invisible spacer to balance the layout */}
      <div className="flex-1"></div>

      {/* === RIGHT SIDE === */}
      <div className="flex items-center gap-4 relative">
        {/* Admin icon - only show if admin or moderator is logged in */}
        {isLoggedIn && (userRole === 'admin' || userRole === 'moderator') && (
          <button
            onClick={handleAdminAccess}
            className="flex h-[50px] w-[50px] items-center justify-center rounded-full shadow-md hover:bg-yellow-500 transition-colors cursor-pointer"
            title="Admin Dashboard"
          >
            <img
              src="/images/dashboard.svg"
              alt="Admin Dashboard"
              className="h-[30px] w-auto brightness-0 invert pointer-events-none"
            />
          </button>
        )}
        {isLoggedIn ? (
          <div className="relative flex items-center gap-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex h-[50px] w-[50px] items-center justify-center rounded-full bg-white/90 shadow-md hover:bg-white transition-colors"
              title="My Account"
            >
              <FaUser className="text-2xl text-[#2a5a82]" />
            </button>
            <button
              onClick={handleLogout}
              className="flex h-[50px] w-[50px] items-center justify-center rounded-full bg-white/90 shadow-md hover:bg-red-100 transition-colors"
              title="Log Out"
            >
              <FiLogOut className="text-2xl text-red-500" />
            </button>
          </div>
        ) : (
          <Link to="/login">
            <div className="flex h-[50px] w-[50px] items-center justify-center rounded-full bg-white/90 shadow-md hover:bg-white transition-colors">
              <FaUser className="text-2xl text-[#2a5a82]" />
            </div>
          </Link>
        )}
      </div>


    </header>
  );
}

export default Header;
