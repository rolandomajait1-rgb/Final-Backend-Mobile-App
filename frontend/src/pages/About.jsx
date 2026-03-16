import React, { useState } from 'react';
import TeamMemberCard from '../components/TeamCard';
import Header from '../components/Header';
import Navigation from '../components/HeaderLink';
import Footer from '../components/Footer';


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
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleEditPhoto = (memberName) => {
    setSelectedMember(memberName);
    setShowUploadModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile && previewUrl) {
      setTeamMembers(prev => 
        prev.map(member => 
          member.name === selectedMember 
            ? { ...member, image: previewUrl }
            : member
        )
      );
      alert(`Photo uploaded successfully for ${selectedMember}!`);
      setShowUploadModal(false);
      setSelectedFile(null);
      setPreviewUrl(null);
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

      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Upload Photo</h2>
            <p className="text-gray-600 mb-4">Upload photo for {selectedMember}</p>
            
            {previewUrl && (
              <div className="mb-4 flex justify-center">
                <img src={previewUrl} alt="Preview" className="w-32 h-32 rounded-full object-cover border-4 border-gray-200" />
              </div>
            )}
            
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full border border-gray-300 rounded px-3 py-2 mb-6"
            />
            
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFile(null);
                  setPreviewUrl(null);
                }}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!selectedFile}
                className="flex-1 bg-[#2a5a82] hover:bg-[#1e4a61] text-white font-bold py-2 px-4 rounded disabled:opacity-50"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default About;
