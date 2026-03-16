import React, { useState, useEffect } from "react";
import { FiBarChart, FiPlus, FiFileText, FiUsers, FiActivity } from 'react-icons/fi';
import { Plus } from 'lucide-react';
import Header from "../components/Header";
import { AdminSidebar } from "../components/AdminSidebar";
import Navigation from "../components/HeaderLink";
import { getUserRole } from '../utils/auth';

import axios from '../utils/axiosConfig';

export default function ManageModerators() {
  const [moderators, setModerators] = useState([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);

  const sidebarLinks = [
    { label: "Statistics", icon: <FiBarChart size={16} />, to: "/admin/statistics" },
    { label: "Create Article", icon: <FiPlus size={16} />, to: "/admin/create-article" },
    { label: "Draft Articles", icon: <FiFileText size={16} />, to: "/admin/draft-articles" },
    { label: "Manage Moderators", icon: <FiUsers size={16} />, to: "/admin/manage-moderators", active: true },
    { label: "Audit Trail", icon: <FiActivity size={16} />, to: "/admin/audit-trail" },
  ];

  useEffect(() => {
    fetchModerators();
  }, []);

  useEffect(() => {
    document.title = getUserRole() === 'moderator' ? 'MODERATOR | Dashboard' : 'ADMIN | Dashboard';
  }, []);

  const fetchModerators = async () => {
    try {
      const response = await axios.get('/api/admin/moderators');
      setModerators(response.data || []);
    } catch (error) {
      console.error('Error fetching moderators:', error);
    } finally {
      setLoading(false);
    }
  };

  const addModerator = async () => {
    if (!email.trim()) {
      alert('Please enter an email address');
      return;
    }

    try {
      await axios.post('/api/admin/moderators', { email });
      setEmail('');
      fetchModerators();
      alert('Moderator added successfully!');
    } catch (error) {
      console.error('Error adding moderator:', error);
      alert(error.response?.data?.message || error.response?.data?.error || 'Failed to add moderator');
    }
  };

  const removeModerator = async (moderatorId) => {
    if (window.confirm('Are you sure you want to remove this moderator?')) {
      try {
        const response = await axios.delete(`/api/admin/moderators/${moderatorId}`);

        if (response.status >= 200 && response.status < 300) {
          setModerators(prev => prev.filter(mod => mod.id !== moderatorId));
          alert('Moderator removed successfully!');
        }
      } catch (error) {
        console.error('Error removing moderator:', error);
        alert('Failed to remove moderator');
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <Navigation/>
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

        <main className="flex-1 bg-white relative overflow-y-auto">
          <div className="p-8">
            <h2 className="text-3xl font-serif font-bold text-black mb-6">
              Moderators
            </h2>

            {/* Controls Section */}
            <div className="flex items-center gap-4 mb-6">
              <button 
                onClick={addModerator}
                className="flex items-center gap-2 bg-[#E1E1E1] hover:bg-[#d1d1d1] px-4 py-2 rounded-sm text-black font-medium transition-colors shadow-sm border border-gray-300"
              >
                Add moderator
                <Plus size={20} className="stroke-2" />
              </button>
              <input 
                type="email" 
                placeholder="Enter email here..." 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addModerator()}
                className="border border-gray-400 rounded-sm px-3 py-2 w-80 focus:outline-none focus:border-blue-600 text-sm bg-white"
              />
            </div>

            {/* Moderators Table */}
            <div className="w-full border border-gray-400 shadow-sm">
              {/* Header */}
              <div className="grid grid-cols-12 bg-[#A9C1D6] border-b border-gray-400">
                <div className="col-span-6 px-4 py-3 font-bold text-black text-center border-r border-gray-400 flex items-center justify-center">
                  Email
                </div>
                <div className="col-span-4 px-4 py-3 font-bold text-black text-center border-r border-gray-400 flex items-center justify-center">
                  Date Added
                </div>
                <div className="col-span-2 px-4 py-3 bg-[#A9C1D6]"></div>
              </div>

              {/* Rows */}
              {loading ? (
                <div className="grid grid-cols-12 border-b border-gray-400 bg-white h-12">
                  <div className="col-span-12 px-4 flex items-center justify-center text-black text-sm">
                    Loading moderators...
                  </div>
                </div>
              ) : moderators.length > 0 ? (
                moderators.map((mod) => (
                  <div key={mod.id} className="grid grid-cols-12 border-b border-gray-400 last:border-b-0 bg-white h-12">
                    <div className="col-span-6 px-4 flex items-center justify-center border-r border-gray-400 text-black text-sm">
                      {mod.email}
                    </div>
                    <div className="col-span-4 px-4 flex items-center justify-center border-r border-gray-400 text-black text-sm">
                      {new Date(mod.created_at).toLocaleDateString()} {new Date(mod.created_at).toLocaleTimeString()}
                    </div>
                    <div 
                      onClick={() => removeModerator(mod.id)}
                      className="col-span-2 bg-[#E0E0E0] hover:bg-[#d4d4d4] cursor-pointer transition-colors flex items-center justify-center text-black text-sm font-normal"
                    >
                      Remove
                    </div>
                  </div>
                ))
              ) : (
                <div className="grid grid-cols-12 border-b border-gray-400 bg-white h-12">
                  <div className="col-span-12 px-4 flex items-center justify-center text-gray-500 text-sm">
                    No moderators found
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
