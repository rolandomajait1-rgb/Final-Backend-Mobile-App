import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function UnsubscribePage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const token = searchParams.get('token');
  const unsubscribed = searchParams.get('unsubscribed');
  const error = searchParams.get('error');

  useEffect(() => {
    if (unsubscribed === '1') {
      setStatus('success');
    } else if (error) {
      setStatus('error');
    } else if (!token) {
      setStatus('invalid');
    }
  }, [token, unsubscribed, error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8"
      >
        {status === 'loading' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Processing...</h2>
            <p className="text-gray-600">Please wait while we unsubscribe you.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Successfully Unsubscribed</h2>
            <p className="text-gray-600 mb-6">
              You have been unsubscribed from La Verdad Herald newsletter. 
              You will no longer receive email updates from us.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              We're sorry to see you go! If you change your mind, you can always subscribe again from our website.
            </p>
            <Link
              to="/"
              className="inline-block bg-cyan-600 text-white px-6 py-3 rounded-lg hover:bg-cyan-700 transition-colors"
            >
              Return to Homepage
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Unsubscribe Failed</h2>
            <p className="text-gray-600 mb-6">
              {error === 'invalid_token' 
                ? 'The unsubscribe link is invalid or has expired.'
                : 'An error occurred while processing your request.'}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Please try clicking the unsubscribe link in your email again, or contact us for assistance.
            </p>
            <div className="space-y-3">
              <Link
                to="/contact"
                className="block bg-cyan-600 text-white px-6 py-3 rounded-lg hover:bg-cyan-700 transition-colors"
              >
                Contact Support
              </Link>
              <Link
                to="/"
                className="block text-cyan-600 hover:text-cyan-700 transition-colors"
              >
                Return to Homepage
              </Link>
            </div>
          </div>
        )}

        {status === 'invalid' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Invalid Link</h2>
            <p className="text-gray-600 mb-6">
              This unsubscribe link appears to be invalid or incomplete.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Please use the unsubscribe link from your email, or contact us if you need help.
            </p>
            <div className="space-y-3">
              <Link
                to="/contact"
                className="block bg-cyan-600 text-white px-6 py-3 rounded-lg hover:bg-cyan-700 transition-colors"
              >
                Contact Support
              </Link>
              <Link
                to="/"
                className="block text-cyan-600 hover:text-cyan-700 transition-colors"
              >
                Return to Homepage
              </Link>
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} La Verdad Herald. All rights reserved.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
