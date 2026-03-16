import React, { useState, useEffect } from "react";
import { IconUser, IconEye, IconArticle, IconHeart } from "@tabler/icons-react";
import { FiBarChart, FiPlus, FiFileText, FiUsers, FiActivity } from 'react-icons/fi';
import Header from "../components/Header";
import { AdminSidebar } from "../components/AdminSidebar";
import HeaderLink from "../components/HeaderLink";
import { getUserRole } from '../utils/auth';
import axios from '../utils/axiosConfig';

export default function Statistics({ onResetData }) {
  const [stats, setStats] = useState([
    { label: "Registered Users", value: 0, icon: <IconUser size={38} /> },
    { label: "Total Views", value: 0, icon: <IconEye size={38} /> },
    { label: "Published Articles", value: 0, icon: <IconArticle size={38} /> },
    { label: "Total Likes", value: 0, icon: <IconHeart size={38} /> },
  ]);

  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
    fetchRecentActivity();
  }, []);

  useEffect(() => {
    document.title = getUserRole() === 'moderator' ? 'MODERATOR | Dashboard' : 'ADMIN | Dashboard';
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/admin/dashboard-stats');
      
      const data = response.data;
      setStats([
        { label: "Registered Users", value: data.users || 0, icon: <IconUser size={38} /> },
        { label: "Total Views", value: data.views || 0, icon: <IconEye size={38} /> },
        { label: "Published Articles", value: data.articles || 0, icon: <IconArticle size={38} /> },
        { label: "Total Likes", value: data.likes || 0, icon: <IconHeart size={38} /> },
      ]);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const response = await axios.get('/api/admin/recent-activity');
      setRecentActivity(response.data);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  const sidebarLinks = [
    { label: "Statistics", icon: <FiBarChart size={16} />, to: "/admin/statistics", active: true },
    { label: "Create Article", icon: <FiPlus size={16} />, to: "/admin/create-article" },
    { label: "Draft Articles", icon: <FiFileText size={16} />, to: "/admin/draft-articles" },
    { label: "Manage Moderators", icon: <FiUsers size={16} />, to: "/admin/manage-moderators" },
    { label: "Audit Trail", icon: <FiActivity size={16} />, to: "/admin/audit-trail" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <HeaderLink />
      
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
          <div className="max-w-6xl mx-auto">
            <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              <p className="font-bold">Error loading statistics:</p>
              <p>{error}</p>
              <p className="text-sm mt-2">Please ensure the Laravel backend API endpoints are implemented.</p>
            </div>
          )}
          {onResetData && (
            <div className="flex justify-end mb-4">
              <button
                onClick={onResetData}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Reset Test Data
              </button>
            </div>
          )}
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 justify-center">
            {stats.map((item) => (
              <div key={item.label} className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                <div className="flex justify-center mb-3">
                  <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
                    {item.icon}
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-center mt-2">
                  {item.value.toLocaleString()}
                </h2>
                <p className="text-sm text-gray-500 text-center mt-1">
                  {item.label}
                </p>
              </div>
            ))}
          </div>

          <hr className="my-6" />

          {/* Recent Activity Table */}
          <h4 className="text-lg font-semibold mb-4 text-center">
            Recent Activity
          </h4>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 mt-4">
              <thead>
                <tr>
                  {["Action", "Article Title", "User", "Timestamp"].map((header) => (
                    <th
                      key={header}
                      className="text-center bg-blue-100 text-black border border-blue-300 p-3"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((a, index) => (
                  <tr key={index}>
                    <td className="text-center text-blue-900 border border-blue-300 p-3">
                      {a.action}
                    </td>
                    <td className="text-center border border-blue-300 p-3">
                      {a.title}
                    </td>
                    <td className="text-center border border-blue-300 p-3">
                      {a.user}
                    </td>
                    <td className="text-center border border-blue-300 p-3">
                      {a.timestamp}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}