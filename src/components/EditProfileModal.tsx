import React from 'react';

interface EditProfileModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen = false, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded shadow-lg">
        <h2 className="text-lg font-bold mb-4">Edit Profile (Placeholder)</h2>
        <button onClick={onClose} className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded">Close</button>
      </div>
    </div>
  );
};

export default EditProfileModal; 