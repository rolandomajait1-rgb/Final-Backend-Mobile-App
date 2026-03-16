import React, { useState } from 'react';
import axios from '../utils/axiosConfig';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaFacebook, FaEnvelope } from 'react-icons/fa';
import { getAuthToken } from '../utils/auth';
import logo from '../assets/images/logo.svg';
import Bgfooter from '../assets/images/bgfooter.png';
import LaVerdadHerald from '../assets/images/la verdad herald.svg';

function Footer() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = !!getAuthToken();
  const isLandingPage = location.pathname === '/';
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  const handleCategoryClick = (e) => {
    if (isLandingPage || !isAuthenticated) {
      e.preventDefault();
      navigate('/login');
    }
  };



  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    setSubscribing(true);
    try {
      await axios.post('/api/contact/subscribe', { email });
      alert('Successfully subscribed to newsletter!');
      setEmail('');
    } catch {
      alert('Failed to subscribe. Please try again.');
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <footer 
      className="text-white pt-8 pb-8 px-2 md:px-10 font-sans w-full mt-auto relative z-10"
      style={{
        backgroundColor: '#265F7C',
        backgroundImage: `linear-gradient(to right, #265F7C 0%, #265F7C 50%, transparent 70%), url(${Bgfooter})`,
        backgroundSize: 'auto, contain',
        backgroundPosition: 'left, right center',
        backgroundRepeat: 'no-repeat, no-repeat',
      }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between gap-8 md:gap-12 mb-8 items-start">
          {/* Branding Section */}
          <div className="lg:w-1/3">
            <div className="flex items-center gap-2 mb-2">
              <img src={logo} alt="La Verdad Herald Logo" className="h-14 w-14" />
              <img src={LaVerdadHerald} alt="La Verdad Herald" className="h-8 w-auto" />
            </div>
            <p className="text-sm text-gray-300 leading-relaxed max-w-sm text-left">
              The LA VERDAD HERALD is the Official Higher Education Student Publication of La Verdad Christian College, Inc.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="lg:w-1/3 grid grid-cols-3 gap-y-4 gap-x-2 text-sm font-bold text-left tracking-wider text-gray-100">
            <Link to="/category/news" onClick={(e) => handleCategoryClick(e, 'news')} className="hover:text-cyan-400 transition-colors">NEWS</Link>
            <Link to="/category/literary" onClick={(e) => handleCategoryClick(e, 'literary')} className="hover:text-cyan-400 transition-colors">LITERARY</Link>
            <Link to="/category/art" onClick={(e) => handleCategoryClick(e, 'art')} className="hover:text-cyan-400 transition-colors">ART</Link>
            
            <Link to="/category/sports" onClick={(e) => handleCategoryClick(e, 'sports')} className="hover:text-cyan-400 transition-colors">SPORTS</Link>
            <Link to="/category/features" onClick={(e) => handleCategoryClick(e, 'features')} className="hover:text-cyan-400 transition-colors">FEATURES</Link>
            <Link to="/about" onClick={handleCategoryClick} className="hover:text-cyan-400 transition-colors">ABOUT</Link>
            
            <Link to="/category/opinion" onClick={(e) => handleCategoryClick(e, 'opinion')} className="hover:text-cyan-400 transition-colors">OPINION</Link>
            <Link to="/category/specials" onClick={(e) => handleCategoryClick(e, 'specials')} className="hover:text-cyan-400 transition-colors">SPECIALS</Link>
            <Link to="/contact" onClick={handleCategoryClick} className="hover:text-cyan-400 transition-colors whitespace-nowrap">CONTACT US</Link>
          </div>

          {/* Subscribe Section */}
          <div className="lg:w-1/3 flex flex-col lg:items-end w-full">
            <p className="text-sm text-gray-200 mb-4 lg:text-right">
              Never miss a story. Subscribe for email updates from La Verdad Herald.
            </p>
            <form onSubmit={handleSubscribe} className="flex w-full max-w-md items-center justify-center">
              <input 
                type="email"
                name="email"
                id="footer-email"
                placeholder="Email address" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="grow p-2 text-gray-800 outline-none rounded-l-sm bg-white"
                required
              />
              <button 
                type="submit"
                disabled={subscribing}
                className="bg-cyan-700 hover:bg-cyan-900 text-white font-bold px-4 py-3 rounded-r-sm transition-colors text-sm uppercase tracking-wide disabled:opacity-50"
              >
                {subscribing ? 'Subscribing...' : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-whit my-8"></div>

        {/* Bottom Socials & Copy */}
        <div className="flex flex-col items-center gap-6">
          <div className="flex gap-4">
            <a href="#" className="w-10 h-10 border border-white rounded-full flex items-center justify-center hover:bg-white hover:text-cyan-800 transition-all group">
              <FaFacebook size={18} />
            </a>
            <a href="#" className="w-10 h-10 border border-white rounded-full flex items-center justify-center hover:bg-white hover:text-cyan-800 transition-all group">
              <FaEnvelope size={18} />
            </a>
          </div>
          <p className="text-s text-white text-center font-light">
            © {new Date().getFullYear()} La Verdad Herald - La Verdad Christian College Apalit. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
