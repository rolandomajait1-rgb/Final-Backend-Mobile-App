import React, { useState, useEffect } from "react";
import { FiBarChart, FiPlus, FiFileText, FiUsers, FiActivity } from 'react-icons/fi';
import Header from "../components/Header";
import Navigation from "../components/HeaderLink";
import { AdminSidebar } from "../components/AdminSidebar";
import { getUserRole } from '../utils/auth';
import axios from '../utils/axiosConfig';

const ACTION_COLORS = {
  created:  'text-green-600',
  updated:  'text-blue-600',
  deleted:  'text-red-600',
  Published:'text-blue-600',
  published:'text-blue-600',
  delete:   'text-red-600',
  update:   'text-blue-600',
  create:   'text-green-600',
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    + ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

export default function AuditTrail() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const sidebarLinks = [
    { label: "Statistics",        icon: <FiBarChart size={16} />,  to: "/admin/statistics" },
    { label: "Create Article",    icon: <FiPlus size={16} />,      to: "/admin/create-article" },
    { label: "Draft Articles",    icon: <FiFileText size={16} />,  to: "/admin/draft-articles" },
    { label: "Manage Moderators", icon: <FiUsers size={16} />,     to: "/admin/manage-moderators" },
    { label: "Audit Trail",       icon: <FiActivity size={16} />,  to: "/admin/audit-trail", active: true },
  ];

  useEffect(() => {
    document.title = getUserRole() === 'moderator' ? 'MODERATOR | Dashboard' : 'ADMIN | Dashboard';
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/admin/audit-logs');
      // Backend now returns paginated response; extract data array
      setAuditLogs(response.data?.data || response.data || []);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError('Failed to load audit logs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = auditLogs.filter((log) => {
    const q = search.toLowerCase();
    return (
      (log.action || '').toLowerCase().includes(q) ||
      (log.article_title || '').toLowerCase().includes(q) ||
      (log.user_email || '').toLowerCase().includes(q)
    );
  });

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
          const links = getUserRole() === 'moderator'
            ? sidebarLinks.filter(l => l.label !== 'Manage Moderators')
            : sidebarLinks;
          return <AdminSidebar links={links} />;
        })()}

        <div className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">

            {/* Search + Refresh */}
            <div className="flex items-center gap-3 mb-4">
              <input
                type="text"
                placeholder="Search by action, title, or user..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border border-gray-400 rounded px-3 py-2 text-sm w-80 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={fetchAuditLogs}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
              >
                Refresh
              </button>
              <span className="text-sm text-gray-500 ml-auto">
                {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
              </span>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                {error}
              </div>
            )}

            <div className="w-full border border-gray-400 shadow-sm bg-white">
              {/* Header */}
              <div className="grid grid-cols-12 bg-[#9FB6C3] border-b border-gray-400">
                <div className="col-span-2 px-4 py-3 font-bold text-black text-center border-r border-gray-400">Action</div>
                <div className="col-span-4 px-4 py-3 font-bold text-black text-center border-r border-gray-400">Title / Model</div>
                <div className="col-span-3 px-4 py-3 font-bold text-black text-center border-r border-gray-400">User</div>
                <div className="col-span-3 px-4 py-3 font-bold text-black text-center">Timestamp</div>
              </div>

              {loading ? (
                <div className="h-16 flex items-center justify-center text-gray-500 text-sm">
                  Loading audit logs...
                </div>
              ) : filtered.length > 0 ? (
                filtered.map((log, index) => (
                  <div key={index} className="grid grid-cols-12 border-b border-gray-200 last:border-b-0 bg-white hover:bg-gray-50 min-h-12">
                    <div className={`col-span-2 px-4 py-3 flex items-center justify-center border-r border-gray-200 text-sm font-semibold capitalize ${ACTION_COLORS[log.action] || 'text-gray-700'}`}>
                      {log.action}
                    </div>
                    <div className="col-span-4 px-4 py-3 flex items-center justify-center border-r border-gray-200 text-black text-sm text-center">
                      {log.article_title || log.model_type?.split('\\').pop() || 'N/A'}
                    </div>
                    <div className="col-span-3 px-4 py-3 flex items-center justify-center border-r border-gray-200 text-black text-sm">
                      {log.user_email || log.user?.email || 'Unknown'}
                    </div>
                    <div className="col-span-3 px-4 py-3 flex items-center justify-center text-gray-600 text-sm">
                      {formatDate(log.created_at)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-16 flex items-center justify-center text-gray-500 text-sm">
                  {search ? 'No results match your search.' : 'No audit logs found.'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
