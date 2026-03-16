import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import axios from '../utils/axiosConfig';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. Please check your email for the correct link.');
      return;
    }

    axios.get('/api/email/verify-token', {
      params: { token },
      timeout: 60000,
      headers: { Accept: 'application/json' }
    })
    .then(response => {
      setStatus('success');
      setMessage('Your email has been verified successfully!');
      setTimeout(() => navigate('/login?verified=1'), 2000);
    })
    .catch(error => {
      setStatus('error');
      setMessage(error.response?.data?.message || 'Verification failed. The link may have expired.');
    });
  }, [searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
        <div className="mb-4">
          {status === 'verifying' && (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          )}
          {status === 'error' && (
            <svg className="h-12 w-12 text-red-600 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>
        <h1 className="text-2xl font-bold mb-4">Email Verification</h1>
        <p className={`text-lg mb-6 ${
          status === 'success' ? 'text-green-600' : 
          status === 'error' ? 'text-red-600' : 
          'text-blue-600'
        }`}>
          {message}
        </p>
        {status === 'error' && (
          <div className="space-y-2">
            <Link 
              to="/login" 
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              Go to Login
            </Link>
            <p className="text-sm text-gray-600">Need a new link? Try logging in and use &quot;Resend Verification Email&quot;.</p>
          </div>
        )}
      </div>
    </div>
  );
}
