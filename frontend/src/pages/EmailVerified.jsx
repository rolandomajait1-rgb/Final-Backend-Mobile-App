import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function EmailVerified() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);
  const verified = searchParams.get('verified') === '1';
  const error = searchParams.get('error');
  const message = searchParams.get('message');

  useEffect(() => {
    if (verified && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (verified && countdown === 0) {
      navigate('/login?verified=1');
    }
  }, [countdown, verified, navigate]);

  const handleLoginNow = () => {
    navigate('/login?verified=1');
  };

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg text-center">
          <div className="mb-6">
            <svg className="mx-auto h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="mb-4 text-3xl font-bold text-gray-800">Verification Failed</h2>
          <p className="mb-6 text-gray-600">
            {error === 'invalid_verification_link' 
              ? 'Invalid or expired verification link. Please request a new one.'
              : 'Something went wrong. Please try again.'}
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full rounded-md bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (message === 'already_verified') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg text-center">
          <div className="mb-6">
            <svg className="mx-auto h-16 w-16 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="mb-4 text-3xl font-bold text-gray-800">Already Verified</h2>
          <p className="mb-6 text-gray-600">
            Your email is already verified. You can log in to your account.
          </p>
          <button
            onClick={handleLoginNow}
            className="w-full rounded-md bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 transition-colors"
          >
            Proceed to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg text-center">
        <div className="mb-6">
          <svg className="mx-auto h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="mb-4 text-3xl font-bold text-gray-800">Email Verified!</h2>
        <p className="mb-6 text-gray-600">
          Your email has been successfully verified. You can now log in to your account.
        </p>
        <div className="mb-6">
          <p className="text-sm text-gray-500">
            Redirecting to login in {countdown} seconds...
          </p>
        </div>
        <button
          onClick={handleLoginNow}
          className="w-full rounded-md bg-green-600 px-6 py-3 text-white font-semibold hover:bg-green-700 transition-colors"
        >
          Proceed to Login Now
        </button>
      </div>
    </div>
  );
}
