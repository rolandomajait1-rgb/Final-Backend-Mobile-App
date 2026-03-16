import React, { useEffect } from "react";
import { FiBarChart, FiPlus, FiFileText, FiUsers, FiActivity } from 'react-icons/fi';

import Header from "../components/Header";
import { AdminSidebar } from "../components/AdminSidebar";
import { getUserRole } from '../utils/auth';
import Navigation from "../components/HeaderLink";
import Statistics from "../AdminDashboard/Statistics";

export default function OpenAdminDashboard() {
  useEffect(() => {
    document.title = getUserRole() === 'moderator' ? 'Moderator | Dashboard' : 'Admin | Dashboard';
  }, []);




  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <Navigation/>
      
      <div className={`relative h-15 flex items-center justify-center ${getUserRole() === 'moderator' ? 'bg-gradient-to-r from-orange-500 to-yellow-500' : 'bg-gradient-to-b from-blue-600 to-blue-800'}`}>
        <h1 className="text-white font-serif font-bold tracking-widest leading-none text-2xl drop-shadow-lg">
          {getUserRole() === 'moderator' ? 'MODERATOR| Dashboard' : 'ADMIN | Dashboard'}
        </h1>
      </div>

      <div className="flex flex-1">
        {(() => {
          const sidebarLinks = [
            { label: "Statistics", icon: <FiBarChart size={16} />, to: "/admin/statistics", active: true },
            { label: "Create Article", icon: <FiPlus size={16} />, to: "/admin/create-article" },
            { label: "Draft Articles", icon: <FiFileText size={16} />, to: "/admin/draft-articles" },
            { label: "Manage Moderators", icon: <FiUsers size={16} />, to: "/admin/manage-moderators" },
            { label: "Audit Trail", icon: <FiActivity size={16} />, to: "/admin/audit-trail" }
          ];
          const filtered = getUserRole() === 'moderator' ? sidebarLinks.filter(l => l.label !== 'Manage Moderators') : sidebarLinks;
          return <AdminSidebar links={filtered} />;
        })()}
        <Statistics />
      </div>
    </div>
  );
}
