import React, { useState, useEffect } from "react";
import { FiBarChart, FiPlus, FiFileText, FiUsers, FiActivity } from 'react-icons/fi';
import Header from "../components/Header";
import Navigation from "../components/HeaderLink";
import { AdminSidebar } from "../components/AdminSidebar";
import { getUserRole } from '../utils/auth';

import axios from '../utils/axiosConfig';

export default function AuditTrail() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const sidebarLinks = [
    { label: "Statistics", icon: <FiBarChart size={16} />, to: "/admin/statistics" },
    { label: "Create Article", icon: <FiPlus size={16} />, to: "/admin/create-article" },
    { label: "Draft Articles", icon: <FiFileText size={16} />, to: "/admin/draft-articles" },
    { label: "Manage Moderators", icon: <FiUsers size={16} />, to: "/admin/manage-moderators" },
    { label: "Audit Trail", icon: <FiActivity size={16} />, to: "/admin/audit-trail", active: true },
  ];

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  useEffect(() => {
    document.title = getUserRole() === 'moderator' ? 'MODERATOR | Dashboard' : 'ADMIN | Dashboard';
  }, []);

  const fetchAuditLogs = async () => {
    try {
      const response = await axios.get('/api/admin/audit-logs');
      setAuditLogs(response.data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
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

        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-6xl w-full">
            <div className="w-full border border-gray-400 shadow-sm bg-white">
            <div className="grid grid-cols-12 bg-[#9FB6C3] border-b border-gray-400">
              <div className="col-span-2 px-4 py-3 font-bold text-black text-center border-r border-gray-400 flex items-center justify-center">Action</div>
              <div className="col-span-4 px-4 py-3 font-bold text-black text-center border-r border-gray-400 flex items-center justify-center">Title of the article</div>
              <div className="col-span-3 px-4 py-3 font-bold text-black text-center border-r border-gray-400 flex items-center justify-center">User</div>
              <div className="col-span-3 px-4 py-3 font-bold text-black text-center flex items-center justify-center">Timestamp</div>
            </div>
            {loading ? (
              <div className="grid grid-cols-12 border-b border-gray-400 bg-white h-12">
                <div className="col-span-12 px-4 flex items-center justify-center text-black text-sm">
                  Loading audit logs...
                </div>
              </div>
            ) : auditLogs.length > 0 ? (
              auditLogs.map((log, index) => (
                <div key={index} className="grid grid-cols-12 border-b border-gray-400 last:border-b-0 bg-white h-12">
                  <div className={`col-span-2 px-4 flex items-center justify-center border-r border-gray-400 text-sm font-medium ${
                    log.action === 'Published' ? 'text-[#2D9CDB]' : 'text-[#EB5757]'
                  }`}>
                    {log.action}
                  </div>
                  <div className="col-span-4 px-4 flex items-center justify-center border-r border-gray-400 text-black text-sm">
                    {log.article_title || 'N/A'}
                  </div>
                  <div className="col-span-3 px-4 flex items-center justify-center border-r border-gray-400 text-black text-sm">
                    {log.user_email || 'Unknown'}
                  </div>
                  <div className="col-span-3 px-4 flex items-center justify-center text-black text-sm">
                    {new Date(log.created_at).toLocaleDateString()} {new Date(log.created_at).toLocaleTimeString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="grid grid-cols-12 border-b border-gray-400 bg-white h-12">
                <div className="col-span-12 px-4 flex items-center justify-center text-gray-500 text-sm">
                  No audit logs found
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}