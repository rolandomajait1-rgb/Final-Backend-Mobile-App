import React, { useState } from 'react';
import { FaHandPaper } from 'react-icons/fa';
import axios from '../utils/axiosConfig';

export default function Feedback() {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/contact/feedback', { feedback, email });
      setIsSubmitted(true);
      setFeedback('');
      setEmail('');
      setTimeout(() => { setIsOpen(false); setIsSubmitted(false); }, 3000);
    } catch {
      alert('Failed to send feedback. Please try again.');
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-cyan-700 text-white p-3 rounded-full shadow-lg hover:bg-cyan-800 transition-colors duration-300 flex items-center justify-center"
        aria-label="Open feedback form"
      >
        <FaHandPaper className="text-xl" />
      </button>

      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 bg-white rounded-lg shadow-xl p-6 border border-gray-200">
          <h3 className="text-xl font-semibold text-cyan-800 mb-4">Send Feedback</h3>
          {isSubmitted ? (
            <div className="text-center text-green-600 font-medium">
              Thank you for your feedback!
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="feedback" className="block text-gray-700 text-sm font-medium mb-2">
                  Your Feedback:
                </label>
                <textarea
                  id="feedback"
                  name="feedback"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline resize-none"
                  rows="4"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Enter your feedback here..."
                ></textarea>
              </div>
              <div className="mb-4">
                <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-2">
                  Your Email:
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-cyan-700 hover:bg-cyan-800 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Send Feedback
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
                  