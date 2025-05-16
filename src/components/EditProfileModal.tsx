import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedProfile: { name: string; password?: string }) => void;
  initialProfile: { name: string; email: string; country: string };
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, onSave, initialProfile }) => {
  const [name, setName] = useState(initialProfile.name);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    // Reset state when modal opens with new initialProfile (e.g., after saving)
    if (isOpen) {
      setName(initialProfile.name);
      setPassword(''); // Always clear password field on open
      setConfirmPassword(''); // Clear confirm password field
      setPasswordError(null); // Clear any previous errors
    }
  }, [isOpen, initialProfile]);

  if (!isOpen) return null;

  const handleSaveClick = () => {
    if (password && password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    setPasswordError(null); // Clear error if passwords match or password field is empty

    // Only include password in updatedProfile if it's not empty
    const updatedProfile = {
      name,
      ...(password && { password }), // Conditionally add password field
    };

    onSave(updatedProfile);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-dark-200 p-6 rounded-lg shadow-lg w-full max-w-sm"> {/* Using a max-width similar to SettingsModal */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">Edit Profile</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-dark-100 text-gray-600 dark:text-gray-400">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-900 dark:text-gray-300">Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 dark:border-dark-100 dark:bg-dark-300 dark:text-white rounded-md shadow-sm focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500"
            />
          </div>

          {/* Email Field (Non-editable) */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-900 dark:text-gray-300">Email</label>
            <input
              type="email"
              id="email"
              value={initialProfile.email}
              className="mt-1 block w-full p-2 border border-gray-300 dark:border-dark-100 dark:bg-dark-300 dark:text-gray-400 rounded-md shadow-sm cursor-not-allowed"
              disabled // Email is not editable
            />
          </div>

           {/* Country Field (Non-editable) */}
           <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-900 dark:text-gray-300">Country</label>
            <input
              type="text"
              id="country"
              value={initialProfile.country}
              className="mt-1 block w-full p-2 border border-gray-300 dark:border-dark-100 dark:bg-dark-300 dark:text-gray-400 rounded-md shadow-sm cursor-not-allowed"
              disabled // Country is not editable
            />
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-900 dark:text-gray-300">New Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 dark:border-dark-100 dark:bg-dark-300 dark:text-white rounded-md shadow-sm focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500"
              placeholder="Create new password"
            />
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-900 dark:text-gray-300">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 dark:border-dark-100 dark:bg-dark-300 dark:text-white rounded-md shadow-sm focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500"
              placeholder="Confirm new password"
            />
            {passwordError && <p className="text-red-500 text-sm mt-1">{passwordError}</p>}
          </div>
        </div>

        <div className="flex justify-end space-x-4 mt-6">
          <button 
            onClick={onClose} 
            className="px-4 py-2 rounded-md bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSaveClick} 
            className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal; 