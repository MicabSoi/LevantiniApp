import React from 'react';

interface UploadProgressModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  progress?: number; // Keep as number for the bar
  message?: string; // Add message prop
}

const UploadProgressModal: React.FC<UploadProgressModalProps> = ({ isOpen = false, onClose, progress = 0, message = "Uploading..." }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white dark:bg-dark-200 p-6 rounded shadow-lg text-center text-gray-800 dark:text-gray-100">
        <h2 className="text-lg font-bold mb-2">Upload Progress</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-4">{message}</p>
        {typeof progress === 'number' && !isNaN(progress) && (
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 dark:bg-gray-700">
            <div className="bg-emerald-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
        )}
        {typeof progress === 'number' && !isNaN(progress) && (
          <p className="text-sm text-gray-600 dark:text-gray-400">{progress}% Complete</p>
        )}
        {/* Optional close button, might be closed programmatically */}
        {/* <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-300 text-gray-800 rounded">Cancel</button> */}
      </div>
    </div>
  );
};

export default UploadProgressModal; 