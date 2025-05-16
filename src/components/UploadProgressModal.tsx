import React from 'react';

interface UploadProgressModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  progress?: number; // Progress in percentage (0-100)
  message?: string;
}

const UploadProgressModal: React.FC<UploadProgressModalProps> = ({ isOpen = false, onClose, progress = 0, message = "Uploading..." }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded shadow-lg text-center">
        <h2 className="text-lg font-bold mb-2">Upload Progress</h2>
        <p className="text-gray-700 mb-4">{message}</p>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 dark:bg-gray-700">
          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">{progress}% Complete</p>
        {/* Optional close button, might be closed programmatically */}
        {/* <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-300 text-gray-800 rounded">Cancel</button> */}
      </div>
    </div>
  );
};

export default UploadProgressModal; 