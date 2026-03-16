import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import HeaderLink from '../components/HeaderLink';
import Calendar from '../components/Calendar';
import IconMailSvg from '../assets/Request Coverage Button.svg';
import IconHandSvg from '../assets/Send Feeback Button.svg';
import IconDocumentSvg from '../assets/Join the Herald Button.svg';

/* --- Main Contact Section --- */
const ContactSection = ({ showFeedbackForm, setShowFeedbackForm }) => {
  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestData, setRequestData] = useState({ eventName: '', date: '', description: '', contactEmail: '', location: '', highlights: '', requestorName: '', designation: '' });
  const [isRequestSubmitted, setIsRequestSubmitted] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const navigate = useNavigate();

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/contact/feedback', { feedback, email });
      if (response.status === 200) {
        setIsSubmitted(true);
        setFeedback('');
        setEmail('');
        setTimeout(() => {
          setShowFeedbackForm(false);
          setIsSubmitted(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        eventName: requestData.eventName,
        date: selectedDate.toISOString().split('T')[0],
        description: requestData.description,
        contactEmail: requestData.contactEmail,
        location: requestData.location,
        highlights: requestData.highlights,
        requestorName: requestData.requestorName,
        designation: requestData.designation
      };
      console.log('Submitting:', submitData);
      const response = await axios.post('/api/contact/request-coverage', submitData);
      if (response.status === 200) {
        setIsRequestSubmitted(true);
        setRequestData({ eventName: '', date: '', description: '', contactEmail: '', location: '', highlights: '', requestorName: '', designation: '' });
        setSelectedDate(new Date());
        setTimeout(() => {
          setShowRequestForm(false);
          setIsRequestSubmitted(false);
        }, 3000);
      } else {
        const errorData = await response.json();
        console.error('Server error:', errorData);
        alert('Failed to submit: ' + (errorData.message || 'Please check all required fields'));
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Error submitting request: ' + error.message);
    }
  };



  return (
    // We'll use a CSS gradient for the background to mimic the image.
    // Note: Tailwind doesn't do complex gradients by default,
    // so we use arbitrary properties `bg-[radial-gradient(...)]`
    <div className="w-full bg-[#EBF0F3]">

      {/* 1. Top Banner */}
       <div className="bg-news-bg bg-cover bg-center h-20" style={{
          backgroundImage: `linear-gradient(to right, #2a5a82 20%, rgba(42,90,130,0.2)), url('/images/bg.jpg' )`
        }}>
          <h1 className="text-5xl font-bold text-white justify-center flex items-center h-full md-8">CONTACT US</h1>
        </div>
      {/* 2. Main Content Area */}
      <div className="max-w-4xl px-6 py-20 mx-auto text-center">
       
        {/* Feedback Form */}
        {showFeedbackForm && (
          <div className="mt-8 w-full max-w-2xl mx-auto animate-fade-in">
            <div className="bg-white rounded-lg shadow-lg border border-gray-300 p-8">
              <div className="text-left space-y-4 mb-8">
                <h1 className="text-4xl font-serif font-normal text-black tracking-wide">Send us Feedback</h1>
                <p className="text-lg text-black font-normal">Got suggestions? We'd love to hear them!</p>
              </div>
              {isSubmitted ? (
                <div className="text-center text-green-600 font-medium text-xl">
                  Thank you for your feedback!
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="space-y-8">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-black text-left">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="Enter your email..."
                      className="w-full p-4 border border-gray-500 rounded text-gray-700 placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black text-lg"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-black text-left">Feedback</label>
                    <textarea
                      id="feedback"
                      name="feedback"
                      rows={8}
                      placeholder="Enter text here..."
                      className="w-full p-4 border border-gray-500 rounded text-gray-700 placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black resize-none text-lg"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex justify-center gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowFeedbackForm(false)}
                      className="w-full sm:w-1/4 md:w-1/4 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2.5 px-8 rounded text-lg transition-all shadow-sm hover:shadow-md"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="w-full sm:w-1/4 md:w-1/4 bg-[#265C79] hover:bg-[#1e4a61] text-white font-bold py-2.5 px-8 rounded text-lg transition-all shadow-sm hover:shadow-md"
                    >
                      Submit
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Text Content */}
        {!showFeedbackForm && !showRequestForm && (
          <>
            <h3 className="text-4xl text-left font-bold sans-serif text-[#30577E] mb-4 pt-2">
              Do you have any ideas you would like to share with La Verdad Herald?
            </h3>
            <p className="max-w-3xl  text-left text-gray-700 py-4 mb-4">
              Do you know any upcoming event that you would like La Verdad Herald to cover? Do you have any ideas you want to share? Do you want to be part of La Verdad Herald? Click on buttons below to apply.
            </p>
          </>
        )}

        {/* Request Coverage Form */}
        {showRequestForm && (
          <div className="mt-10 w-full max-w-2xl mx-auto animate-fade-in text-left">
            <div className="bg-white rounded-lg shadow-lg border border-gray-300 p-8">
            <h1 className="text-3xl font-serif font-normal text-black mb-4 tracking-wide text-center">Request Coverage</h1>
            {isRequestSubmitted ? (
              <div className="text-center text-green-600 font-medium text-xl">
                Thank you for your request!
              </div>
            ) : (
              <form onSubmit={handleRequestSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-sm font-bold text-black">Name of the Event</label>
                  <input
                    type="text"
                    id="eventName"
                    name="eventName"
                    placeholder="Enter text here..."
                    className="w-full p-2 border border-gray-500 rounded text-gray-700 placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                    value={requestData.eventName}
                    onChange={(e) => setRequestData({ ...requestData, eventName: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-bold text-black">Purpose / Significance</label>
                  <input
                    type="text"
                    id="description"
                    name="description"
                    placeholder="Enter text here..."
                    className="w-full p-2 border border-gray-500 rounded text-gray-700 placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                    value={requestData.description}
                    onChange={(e) => setRequestData({ ...requestData, description: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-bold text-black">Location</label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    placeholder="Enter text here..."
                    className="w-full p-2 border border-gray-500 rounded text-gray-700 placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                    value={requestData.location || ''}
                    onChange={(e) => setRequestData({ ...requestData, location: e.target.value })}
                  />
                </div>
                <div className="space-y-1 relative">
                  <label className="block text-sm font-bold text-black">Date and Time</label>
                  <input
                    type="text"
                    id="date"
                    name="date"
                    readOnly
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="w-full p-2 border border-gray-500 rounded text-gray-700 focus:outline-none focus:border-black focus:ring-1 focus:ring-black cursor-pointer"
                    value={selectedDate.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                    placeholder="Select date and time..."
                  />
                  {showCalendar && (
                    <Calendar
                      selectedDate={selectedDate}
                      onDateSelect={(date) => {
                        setSelectedDate(date);
                        setRequestData({ ...requestData, date: date.toISOString() });
                      }}
                      onClose={() => setShowCalendar(false)}
                    />
                  )}
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-bold text-black">Event Highlights</label>
                  <input
                    type="text"
                    id="highlights"
                    name="highlights"
                    placeholder="Enter text here..."
                    className="w-full p-2 border border-gray-500 rounded text-gray-700 placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                    value={requestData.highlights || ''}
                    onChange={(e) => setRequestData({ ...requestData, highlights: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-bold text-black">Full Name of Requestor</label>
                  <input
                    type="text"
                    id="requestorName"
                    name="requestorName"
                    placeholder="Enter your name here..."
                    className="w-full p-2 border border-gray-500 rounded text-gray-700 placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                    value={requestData.requestorName || ''}
                    onChange={(e) => setRequestData({ ...requestData, requestorName: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-bold text-black">Designation</label>
                  <input
                    type="text"
                    id="designation"
                    name="designation"
                    placeholder="Enter your name here..."
                    className="w-full p-2 border border-gray-500 rounded text-gray-700 placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                    value={requestData.designation || ''}
                    onChange={(e) => setRequestData({ ...requestData, designation: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-bold text-black">Organizer / Office Coordinator</label>
                  <input
                    type="text"
                    id="contactEmail"
                    name="contactEmail"
                    placeholder="Enter your name here..."
                    className="w-full p-2 border border-gray-500 rounded text-gray-700 placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                    value={requestData.contactEmail}
                    onChange={(e) => setRequestData({ ...requestData, contactEmail: e.target.value })}
                  />
                </div>
                <div className="pt-4 text-center">
                  <p className="text-sm italic text-black">*Kindly complete and submit this form at least two weeks prior to the event.</p>
                </div>
                <div className="flex justify-center gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowRequestForm(false)}
                    className="w-full sm:w-1/4 md:w-1/4 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2.5 px-8 rounded text-lg transition-all shadow-sm hover:shadow-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-1/4 md:w-1/4 bg-[#265C79] hover:bg-[#1e4a61] text-white font-bold py-2.5 px-8 rounded text-lg transition-all shadow-sm hover:shadow-md"
                  >
                    Submit
                  </button>
                </div>
              </form>
            )}
            </div>
          </div>
        )}

        {/* 3. Button Grid */}
        {!showFeedbackForm && !showRequestForm && (
          <div className="grid grid-cols-1 gap-0 mt-8 md:grid-cols-3 md:gap-2">

            {/* Card 1: Request Coverage */}
            <button
              onClick={() => setShowRequestForm(true)}
              className="transition hover:scale-105"
            >
              <img src={IconMailSvg} alt="Request Coverage" className="w-48 h-auto mx-auto" />
            </button>

            {/* Card 2: Send Feedback */}
            <button
              onClick={() => setShowFeedbackForm(true)}
              className="transition hover:scale-105"
            >
              <img src={IconHandSvg} alt="Send Feedback" className="w-48 h-auto mx-auto" />
            </button>

            {/* Card 3: Join the Herald */}
            <button
              onClick={() => navigate('/membership-form')}
              className="transition hover:scale-105"
            >
              <img src={IconDocumentSvg} alt="Join the Herald" className="w-48 h-auto mx-auto" />
            </button>

          </div>
        )}
      </div>
    </div>
  );
};

/* --- Example Usage --- */
import axios from '../utils/axiosConfig';

export default function ContactUs() {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  return (
    <>
    <div className="flex flex-col min-h-screen">
      <Header />
      <HeaderLink />

      <main className="grow">
        <ContactSection showFeedbackForm={showFeedbackForm} setShowFeedbackForm={setShowFeedbackForm} />
      </main>

      <Footer />
    </div>
    </>
  );
}
