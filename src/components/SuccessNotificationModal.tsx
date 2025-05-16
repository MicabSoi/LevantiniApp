import React from 'react';

interface SuccessNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  title?: string;
}

const SuccessNotificationModal: React.FC<SuccessNotificationModalProps> = ({ isOpen, onClose, message, title = "Success!" }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose} // Close if clicking outside the modal content area
    >
      <div 
        className="bg-white dark:bg-dark-200 p-6 rounded-lg shadow-lg w-full max-w-sm text-center"
        onClick={(e) => e.stopPropagation()} // Prevent click inside from closing modal
      >
        <h3 className={`text-lg font-semibold ${title === "Success!" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"} mb-4`}>{title}</h3>
        <p className="text-gray-700 dark:text-gray-300 mb-6">{message}</p>
        <button
          onClick={onClose}
          className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50"
        >
          Okay
        </button>
      </div>
    </div>
  );
};

export default SuccessNotificationModal; 