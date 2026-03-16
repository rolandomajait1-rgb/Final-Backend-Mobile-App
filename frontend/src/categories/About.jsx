import React, { useState, useEffect } from 'react';
import axios from '../utils/axiosConfig';
import DOMPurify from 'dompurify';
import TeamMemberCard from '../components/TeamCard';
import Header from '../components/Header';
import Navigation from '../components/HeaderLink';
import Footer from '../components/Footer';
import { sanitizeImageSrc } from '../utils/safeUrl';

const initialTeamMembers = [
  { name: 'Amber Princess Rosana', role: 'UI/UX Designer', image: null },
  { name: 'Jeremy Ortega', role: 'Project Manager', image: null },
  { name: 'Estela Mae Jalac', role: 'Quality Assurance', image: null },
  { name: 'Lei Ann Judea', role: 'Business Analyst', image: null },
  { name: 'Rolando Majait', role: 'Developer', image: null },
  { name: 'Juan Miguel Ramirez', role: 'UI/UX Designer', image: null },
];

const About  = () => {
  const [teamMembers, setTeamMembers] = useState(initialTeamMembers);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedMemberIndex, setSelectedMemberIndex] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const response = await axios.get('/api/team-members');
      if (response.data && response.data.length > 0) {
        setTeamMembers(response.data);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const handleEditPhoto = (memberName) => {
    const index = teamMembers.findIndex(m => m.name === memberName);
    setSelectedMemberIndex(index);
    setEditName(teamMembers[index].name);
    setEditRole(teamMembers[index].role);
    setShowUploadModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (selectedMemberIndex !== null) {
      setLoading(true);
      try {
        const memberData = {
          id: teamMembers[selectedMemberIndex].id,
          name: DOMPurify.sanitize(editName),
          role: DOMPurify.sanitize(editRole),
          image: sanitizeImageSrc(
            previewUrl || teamMembers[selectedMemberIndex].image,
            null
          )
        };

        await axios.post('/api/team-members/update', memberData);
        
        const updatedMembers = teamMembers.map((member, idx) => 
          idx === selectedMemberIndex
            ? { ...member, name: editName, role: editRole, image: previewUrl || member.image }
            : member
        );
        setTeamMembers(updatedMembers);
        alert('Team member updated successfully!');
        setShowUploadModal(false);
        setPreviewUrl(null);
        setSelectedMemberIndex(null);
      } catch (error) {
        console.error('Error updating team member:', error);
        alert('Failed to update team member. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <>
      <Header />
      <Navigation />
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-4xl font-light text-center text-gray-800 mb-12">
            Meet Our Team
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <TeamMemberCard
                key={index}
                name={member.name}
                role={member.role}
                image={member.image}
                onEdit={handleEditPhoto}
              />
            ))}
          </div>
        </div>
      </section>
      <Footer/>

      {showUploadModal && selectedMemberIndex !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Edit Team Member</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-bold mb-2">Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-bold mb-2">Role</label>
              <input
                type="text"
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            
            {previewUrl && (
              <div className="mb-4 flex justify-center">
                <img
                  src={sanitizeImageSrc(previewUrl, 'https://placehold.co/128x128/e2e8f0/64748b?text=Preview')}
                  alt="Preview"
                  className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                />
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-sm font-bold mb-2">Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setPreviewUrl(null);
                  setSelectedMemberIndex(null);
                }}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={loading}
                className="flex-1 bg-[#2a5a82] hover:bg-[#1e4a61] text-white font-bold py-2 px-4 rounded disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default About;

