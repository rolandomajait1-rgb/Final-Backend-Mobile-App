import React from 'react';

// Simple Document icon
const DocumentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

export default function EmptyState({ categoryName }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-gray-50 rounded-md">
      <DocumentIcon />
      <p className="text-gray-500 mt-4">
        No publications available in this category ({categoryName}) yet.
      </p>
    </div>
  );
}