import React from 'react';
import { NavLink } from 'react-router-dom';

export function AdminSidebar({ links }) {
  return (
    <div className="w-64 bg-cyan-800 border-gray-200  shadow-lg">
      <div className="space-y-2">
        {links.map((link, index) => (
          <NavLink
            key={index}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center p-3 no-underline font-normal transition-all duration-200 ${
                isActive || link.active
                  ? 'text-white bg-cyan-600 font-bold'
                  : 'text-white hover:bg-cyan-700'
              }`
            }
          >
            {link.icon}
            <span className="ml-3 text-sm">{link.label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
}
