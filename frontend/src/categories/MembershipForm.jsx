import React, { useState } from 'react';
import { Upload, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import HeaderLink from '../components/HeaderLink';

const MembershipFormContent = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    name: '',
    course: '',
    gender: '',
    photoName: null,
    pubName: '',
    classifications: {},
    pubOption: {},
    designations: {},
    specificPosition: '',
    consentFormName: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (category, item) => {
    setFormData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [item]: !prev[category][item]
      }
    }));
  };

  const handleFileChange = (e, fieldName) => {
    if (e.target.files && e.target.files[0]) {
      handleInputChange(fieldName, e.target.files[0].name);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const nextStep = () => {
    setStep(2);
    scrollToTop();
  };

  const prevStep = () => {
    setStep(1);
    scrollToTop();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await axios.post('/api/contact/join-herald', formData);
      if (response.status === 200) {
        setSubmitSuccess(true);
        alert('Application submitted successfully!');
        navigate('/contact-us');
      } else {
        alert('Failed to submit application. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error submitting application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 md:p-8 font-sans">
      <div className="bg-white w-full max-w-[850px] rounded-sm shadow-xl p-8 md:p-12 border border-gray-200 relative">
        
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-serif text-black tracking-tight">
            Membership Form
          </h1>
        </div>

        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            
            <div className="text-sm md:text-[0.95rem] leading-relaxed italic text-gray-800 text-justify mb-10 font-sans bg-gray-50/50 p-4 rounded border border-transparent hover:border-gray-100 transition-colors">
              <p className="mb-4">
                Data Privacy Notice: In compliance with data privacy laws such as, but not
                limited to, Republic Act No. 10173 (Data Privacy Act of 2012) and its implementing
                rules and regulations, we within the Organization of La Verdad Christian College
                (LVCC), collect and process your personal information in this membership form for
                personal information purposes only, keeping them securely and with
                confidentiality using our organizational, technical, and physical security
                measures, and retain them in accordance with our retention policy. We don't
                share them to any external group without your consent, unless otherwise stated
                in our privacy notice. You have the right to be informed, to object, to access, to
                rectify, to erase or to block the processing of your personal information, as well as
                your right to data portability, to file a complaint and be entitled to damages for
                violation of your rights under this data privacy.
              </p>
              <p>
                For your data privacy inquiries, you may reach our Data Protection Officer
                through: <a href="mailto:dpo@laverdad.edu.ph" className="text-blue-800 hover:underline">dpo@laverdad.edu.ph</a>
              </p>
            </div>

            <h2 className="text-3xl font-serif font-bold mb-6 text-black border-b border-gray-200 pb-2">
              Personal Information
            </h2>

            <form className="space-y-6 font-sans text-gray-800" onSubmit={(e) => e.preventDefault()}>
              
              <div>
                <label className="block font-bold text-lg mb-1 text-gray-900">
                  Name <span className="italic font-normal text-base text-gray-600">(Surname, Given Name, Middle Name)</span>
                </label>
                <input 
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter text here..." 
                  className="w-full border border-gray-400 p-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#265C79] focus:ring-1 focus:ring-[#265C79] rounded-sm transition-all"
                />
              </div>

              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-grow md:w-2/3">
                  <label className="block font-bold text-lg mb-1 text-gray-900">
                    Course & Year
                  </label>
                  <input 
                    type="text"
                    id="course"
                    name="course"
                    value={formData.course}
                    onChange={(e) => handleInputChange('course', e.target.value)}
                    placeholder="Enter text here..." 
                    className="w-full border border-gray-400 p-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#265C79] focus:ring-1 focus:ring-[#265C79] rounded-sm transition-all"
                  />
                </div>

                <div className="md:w-1/3">
                  <label className="block font-bold text-lg mb-1 text-gray-900">
                    Gender:
                  </label>
                  <div className="flex items-center gap-8 mt-3">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className={`w-5 h-5 border border-gray-500 flex items-center justify-center ${formData.gender === 'male' ? 'bg-[#265C79] border-[#265C79]' : 'bg-white'}`}>
                        {formData.gender === 'male' && <Check size={14} color="white" />}
                      </div>
                      <input 
                        type="radio"
                        id="gender-male"
                        name="gender" 
                        className="hidden" 
                        checked={formData.gender === 'male'}
                        onChange={() => handleInputChange('gender', 'male')}
                      />
                      <span className="text-gray-700 text-lg group-hover:text-[#265C79]">Male</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className={`w-5 h-5 border border-gray-500 flex items-center justify-center ${formData.gender === 'female' ? 'bg-[#265C79] border-[#265C79]' : 'bg-white'}`}>
                        {formData.gender === 'female' && <Check size={14} color="white" />}
                      </div>
                      <input 
                        type="radio"
                        id="gender-female"
                        name="gender" 
                        className="hidden" 
                        checked={formData.gender === 'female'}
                        onChange={() => handleInputChange('gender', 'female')}
                      />
                      <span className="text-gray-700 text-lg group-hover:text-[#265C79]">Female</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-2">
                <label className="block font-bold text-lg mb-1 text-gray-900">
                  Upload Photo (1 x 1)
                </label>
                <div className="relative w-full">
                    <div className={`w-full border border-gray-400 p-3 rounded-sm cursor-pointer hover:bg-gray-50 transition-colors flex items-center gap-3 ${formData.photoName ? 'bg-blue-50 border-blue-300' : ''}`}>
                    <Upload className="w-5 h-5 text-gray-400" />
                    <span className={`${formData.photoName ? 'text-blue-800 font-medium' : 'text-gray-400'}`}>
                        {formData.photoName || "Click to upload image..."}
                    </span>
                    </div>
                    <input 
                        type="file"
                        id="photo"
                        name="photo"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'photoName')}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                    />
                </div>
              </div>

              <div className="flex justify-end mt-10 pt-2">
                <button 
                  type="button"
                  onClick={nextStep}
                  className="bg-[#265C79] hover:bg-[#1e4a61] text-white font-bold py-2.5 px-8 rounded text-lg transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                >
                  Next <ChevronRight size={20} />
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
             <h2 className="text-3xl font-serif font-bold mb-6 text-black border-b border-gray-200 pb-2">
              Publication Information
            </h2>

            <form className="space-y-6 font-sans text-gray-800" onSubmit={(e) => e.preventDefault()}>
                
                <div>
                    <label className="block font-bold text-lg mb-1 text-gray-900">Publication Name:</label>
                    <input 
                        type="text"
                        id="pubName"
                        name="pubName"
                        value={formData.pubName}
                        onChange={(e) => handleInputChange('pubName', e.target.value)}
                        placeholder="Enter text here..." 
                        className="w-full border border-gray-400 p-2.5 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#265C79] focus:ring-1 focus:ring-[#265C79] rounded-sm"
                    />
                </div>

                <div>
                    <label className="block font-bold text-lg mb-2 text-gray-900">Publication Classification</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-y-3 gap-x-4">
                        {['Broadsheet', 'Tabloid', 'Magazine/Issue', 'Literary Folio', 'News Letter', 'Radio Production'].map((item) => (
                            <label key={item} className="flex items-center gap-2 cursor-pointer">
                                <div className={`w-4 h-4 border border-gray-500 flex-shrink-0 flex items-center justify-center ${formData.classifications[item] ? 'bg-[#265C79] border-[#265C79]' : 'bg-white'}`}>
                                    {formData.classifications[item] && <Check size={12} color="white" />}
                                </div>
                                <input type="checkbox" className="hidden" onChange={() => handleCheckboxChange('classifications', item)} checked={!!formData.classifications[item]} />
                                <span className="text-sm text-gray-800">{item}</span>
                            </label>
                        ))}
                    </div>
                    <div className="mt-2">
                        <label className="text-sm text-gray-800 block mb-1">Others, please specify:</label>
                        <input 
                            type="text" 
                            placeholder="Enter text here..." 
                            className="w-full border border-gray-400 p-2 text-gray-700 rounded-sm focus:outline-none focus:border-[#265C79]"
                        />
                    </div>
                </div>

                <div>
                    <label className="block font-bold text-lg mb-2 text-gray-900">Publishing Option</label>
                    <div className="flex gap-8 mb-2">
                        {['Print', 'Online'].map((item) => (
                            <label key={item} className="flex items-center gap-2 cursor-pointer">
                                <div className={`w-4 h-4 border border-gray-500 flex-shrink-0 flex items-center justify-center ${formData.pubOption[item] ? 'bg-[#265C79] border-[#265C79]' : 'bg-white'}`}>
                                    {formData.pubOption[item] && <Check size={12} color="white" />}
                                </div>
                                <input type="checkbox" className="hidden" onChange={() => handleCheckboxChange('pubOption', item)} checked={!!formData.pubOption[item]} />
                                <span className="text-sm text-gray-800">{item}</span>
                            </label>
                        ))}
                    </div>
                    <label className="text-sm text-gray-800 block mb-1">Others, please specify:</label>
                     <input 
                        type="text" 
                        placeholder="Enter text here..." 
                        className="w-full border border-gray-400 p-2 text-gray-700 rounded-sm focus:outline-none focus:border-[#265C79]"
                    />
                </div>

                <div>
                    <label className="block font-bold text-lg mb-2 text-gray-900">Membership Designation</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-y-3 gap-x-4">
                         {[
                             'Photojournalist Staff', 'Cartoonist Staff', 'Graphic Artist Staff',
                             'Layout Artist Staff', 'Technical Staff', 'Multimedia Staff',
                             'Writer Staff', 'Editorial Board Member', 'Newscaster',
                             'Contributor/Researcher', 'Reporter'
                         ].map((item) => (
                            <label key={item} className="flex items-center gap-2 cursor-pointer">
                                <div className={`w-4 h-4 border border-gray-500 flex-shrink-0 flex items-center justify-center ${formData.designations[item] ? 'bg-[#265C79] border-[#265C79]' : 'bg-white'}`}>
                                    {formData.designations[item] && <Check size={12} color="white" />}
                                </div>
                                <input type="checkbox" className="hidden" onChange={() => handleCheckboxChange('designations', item)} checked={!!formData.designations[item]} />
                                <span className="text-sm text-gray-800">{item}</span>
                            </label>
                        ))}
                    </div>
                    <div className="mt-2">
                        <label className="text-sm text-gray-800 block mb-1">Others, please specify:</label>
                        <input 
                            type="text" 
                            placeholder="Enter text here..." 
                            className="w-full border border-gray-400 p-2 text-gray-700 rounded-sm focus:outline-none focus:border-[#265C79]"
                        />
                    </div>
                </div>

                <div>
                    <label className="block font-bold text-lg mb-1 text-gray-900">Specific Position:</label>
                    <input 
                        type="text"
                        id="specificPosition"
                        name="specificPosition"
                        value={formData.specificPosition}
                        onChange={(e) => handleInputChange('specificPosition', e.target.value)}
                        placeholder="Enter text here..." 
                        className="w-full border border-gray-400 p-2.5 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#265C79] focus:ring-1 focus:ring-[#265C79] rounded-sm"
                    />
                </div>

                 <div className="mt-2">
                    <label className="block font-bold text-lg mb-1 text-gray-900">
                      Upload Parental Consent Form
                    </label>
                    <div className="relative w-full">
                        <div className={`w-full border border-gray-400 p-3 rounded-sm cursor-pointer hover:bg-gray-50 transition-colors flex items-center gap-3 ${formData.consentFormName ? 'bg-blue-50 border-blue-300' : ''}`}>
                        <Upload className="w-5 h-5 text-gray-400" />
                        <span className={`${formData.consentFormName ? 'text-blue-800 font-medium' : 'text-gray-400'}`}>
                            {formData.consentFormName || "Click to upload file..."}
                        </span>
                        </div>
                        <input 
                            type="file"
                            id="consentForm"
                            name="consentForm"
                            onChange={(e) => handleFileChange(e, 'consentFormName')}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                        />
                    </div>
                </div>

                <div className="flex justify-between mt-10 pt-4 border-t border-gray-100">
                    <button 
                        type="button"
                        onClick={prevStep}
                        className="bg-[#265C79] hover:bg-[#1e4a61] text-white font-bold py-2.5 px-8 rounded text-lg transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                    >
                        <ChevronLeft size={20} /> Back
                    </button>
                    
                    <button 
                        type="submit"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-[#265C79] hover:bg-[#1e4a61] text-white font-bold py-2.5 px-8 rounded text-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit'}
                    </button>
                </div>

            </form>
          </div>
        )}

      </div>
    </div>
  );
};

import axios from '../utils/axiosConfig';

export default function MembershipForm() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <HeaderLink />
      <main className="grow">
        <MembershipFormContent />
      </main>
      <Footer />
    </div>
  );
}
