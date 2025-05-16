import React from 'react';

interface SuccessNotificationModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  message?: string;
}

const SuccessNotificationModal: React.FC<SuccessNotificationModalProps> = ({ isOpen = false, onClose, message = "Operation successful!" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded shadow-lg text-center">
        <h2 className="text-lg font-bold text-green-600 mb-2">Success</h2>
        <p className="text-gray-700 mb-4">{message}</p>
        <button onClick={onClose} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Close</button>
      </div>
    </div>
  );
};

export default SuccessNotificationModal; 