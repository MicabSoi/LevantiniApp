import React from 'react';

interface UploadProgressModalProps {
  isOpen: boolean;
  progress: string; // e.g., "Uploading... 4/10 synced"
}

const UploadProgressModal: React.FC<UploadProgressModalProps> = ({ isOpen, progress }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-300 p-6 rounded-lg shadow-lg text-center">
        <p className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Uploading Results</p>
        <div className="flex items-center justify-center">
          {/* Basic Spinner */}
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          <p className="ml-4 text-gray-700 dark:text-gray-300">{progress}</p>
        </div>
      </div>
    </div>
  );
};

export default UploadProgressModal; 