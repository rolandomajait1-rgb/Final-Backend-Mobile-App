import React from 'react';
import { Edit2 } from 'lucide-react';
import { getStorageUrl } from '../utils/apiConfig';
import { sanitizeImageSrc } from '../utils/safeUrl';

const TeamMemberCard = ({ name, role, image, onEdit }) => {
  const userRole = localStorage.getItem('user_role');
  const isAdmin = userRole === 'admin';
  const fallbackImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2a5a82&color=fff&size=200`;
  const resolvedImage = image ? getStorageUrl(image) || image : fallbackImage;
  const safeImage = sanitizeImageSrc(resolvedImage, fallbackImage);

  return (
    <div className="border border-gray-300 p-6 flex flex-col items-center text-center h-100 justify-center relative">
      <div className="relative">
        <img 
          src={safeImage}
          alt={name}
          className="w-50 h-50 rounded-full mb-4 object-cover"
        />
        {isAdmin && (
          <button
            onClick={() => onEdit && onEdit(name)}
            className="absolute top-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors shadow-md"
            title="Edit Photo"
          >
            <Edit2 size={16} />
          </button>
        )}
      </div>
      
      <h3 className="text-xl font-semibold text-gray-900">{name}</h3>
      <p className="text-gray-600">{role}</p>
    </div>
  );
};

export default TeamMemberCard;
