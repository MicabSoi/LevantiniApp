import React, { useState, useEffect } from 'react';
import { User, MapPin, Star, Trophy, BookOpen, GraduationCap } from 'lucide-react';
import { supabase } from '../lib/supabaseClient'; // Corrected import path
import EditProfileModal from './EditProfileModal'; // Import the new modal component
import SuccessNotificationModal from './SuccessNotificationModal'; // Import the success modal

// Define a type for the updatedProfile parameter in handleSaveProfile
interface UpdatedProfileData {
  name: string;
  password?: string;
}

const Profile = () => {
  // This would come from your user context/state management
  const [userProfile, setUserProfile] = useState({
    name: "John Doe",
    email: "", // Initialize email as empty
    country: "United States",
    level: 12,
    joinDate: "2024-01-15",
    totalXP: 2450,
    nextLevelXP: 3000,
    achievements: [
      { id: 1, name: "First Word", description: "Added your first word to your ocabulary", icon: BookOpen },
      { id: 2, name: "Grammar Master", description: "Completed all basic grammar lessons", icon: GraduationCap },
    ]
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(userProfile);
  const [showEditModal, setShowEditModal] = useState(false); // State to control modal visibility
  const [showNotificationModal, setShowNotificationModal] = useState(false); // Use a more general name
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationTitle, setNotificationTitle] = useState(''); // State for notification title

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Update both userProfile and editedProfile with fetched data
        const profileData = {
          name: user.user_metadata.name || "User", // Fallback if name is not set
          email: user.email || "",
          country: userProfile.country, // Country is not in Supabase auth user by default
          level: userProfile.level,
          joinDate: user.created_at || userProfile.joinDate,
          totalXP: userProfile.totalXP,
          nextLevelXP: userProfile.nextLevelXP,
          achievements: userProfile.achievements,
        };
        setUserProfile(profileData);
        setEditedProfile(profileData); 
      }
    };

    fetchUser();
  }, []); // Empty dependency array means this effect runs once on mount

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedProfile({ ...editedProfile, [name]: value });
  };

  const handleSaveProfile = async (updatedProfile: UpdatedProfileData) => {
    let nameUpdateError = null;
    let passwordUpdateError = null;
    let nameUpdated = false;
    let passwordUpdated = false;

    // Update name if it has changed
    if (updatedProfile.name !== userProfile.name) {
      const { data, error } = await supabase.auth.updateUser({
        data: { name: updatedProfile.name } // Supabase uses 'data' for non-password updates
      });
      if (error) {
        nameUpdateError = error;
        console.error('Error updating user name:', error);
      } else {
        console.log('User name updated successfully:', data);
        setUserProfile(prevState => ({ ...prevState, name: updatedProfile.name }));
        setEditedProfile(prevState => ({...prevState, name: updatedProfile.name}));
        nameUpdated = true;
      }
    }

    // Update password if provided
    if (updatedProfile.password) {
      const { error } = await supabase.auth.updateUser({
        password: updatedProfile.password
      });
      if (error) {
        passwordUpdateError = error;
        console.error('Error updating user password:', error);
      } else {
        console.log('User password updated successfully.');
        passwordUpdated = true;
      }
    }

    setShowEditModal(false); // Close the edit modal first

    if (!nameUpdateError && !passwordUpdateError) {
      if (nameUpdated || passwordUpdated) { // Check if at least one field was updated successfully
        if (nameUpdated && passwordUpdated) {
          setNotificationMessage('Your name and password have been updated successfully!');
        } else if (nameUpdated) {
          setNotificationMessage('Your name has been updated successfully!');
        } else if (passwordUpdated) {
          setNotificationMessage('Your password has been updated successfully!');
        }
        setNotificationTitle('Success!');
      } else {
        setNotificationMessage('No changes were made to your profile.');
        setNotificationTitle('Info'); // Or a different title for no changes
      }
    } else {
      // Handle errors
      let errorMessage = "Profile update failed:\n\n";
      if (nameUpdateError) {
        errorMessage += `Name update error: ${nameUpdateError.message}\n`;
      }
      if (passwordUpdateError) {
        errorMessage += `${passwordUpdateError.message}\n`;
      }
      errorMessage += "\nPlease try again.";
      setNotificationMessage(errorMessage);
      setNotificationTitle('Error'); // Set title to Error
      console.error("Profile update failed:", nameUpdateError, passwordUpdateError);
    }

    setShowNotificationModal(true); // Show the notification modal (success or error)
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditedProfile(userProfile); // Revert changes if modal is closed without saving
  };

  const handleCloseNotificationModal = () => {
    setShowNotificationModal(false);
    // If the notification was an error, reopen the edit modal
    if (notificationTitle === 'Error') {
      // No need to reset editedProfile here, as the user might want to fix the existing input
      // setEditedProfile(userProfile); // Only reset if you want to clear the form on error close
      setShowEditModal(true);
    }
    setNotificationMessage('');
    setNotificationTitle('');
  };

  // Calculate level progress percentage
  const levelProgress = (userProfile.totalXP / userProfile.nextLevelXP) * 100;

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="bg-white dark:bg-dark-200 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-dark-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
              <User size={40} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-bold">{userProfile.name}</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">{userProfile.email}</p>
              <div className="flex items-center text-gray-600 dark:text-gray-400 mt-1">
                <MapPin size={16} className="mr-1" />
                <span>{userProfile.country}</span>
              </div>
              <div className="flex items-center mt-2">
                <Star size={16} className="text-emerald-400 mr-1" />
                <span className="font-medium">Level {userProfile.level}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => {
              setEditedProfile(userProfile); // Ensure modal opens with current profile data
              setShowEditModal(true);
            }}
            className="bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-md hover:bg-emerald-200 dark:hover:bg-emerald-800"
          >
            Edit Profile
          </button>
        </div>
      </div>

      {/* Level Progress */}
      <div className="bg-white dark:bg-dark-200 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-dark-100">
        <h3 className="font-bold mb-4">Level Progress</h3>
        <div className="mb-2 flex justify-between text-sm">
          <span>XP: {userProfile.totalXP}</span>
          <span>Next Level: {userProfile.nextLevelXP}</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-dark-100 rounded-full h-2.5">
          <div 
            className="bg-emerald-600 h-2.5 rounded-full"
            style={{ width: `${levelProgress}%` }}
          ></div>
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-white dark:bg-dark-200 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-dark-100">
        <h3 className="font-bold mb-4">Achievements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {userProfile.achievements.map(achievement => {
            const Icon = achievement.icon;
            return (
              <div key={achievement.id} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-dark-100 rounded-lg">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-full">
                  <Icon size={20} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-medium">{achievement.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{achievement.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Join Date */}
      <div className="text-center text-sm text-gray-600 dark:text-gray-400">
        Member since {new Date(userProfile.joinDate).toLocaleDateString()}
      </div>

      {showEditModal && (
        <EditProfileModal
          isOpen={showEditModal}
          onClose={handleCloseEditModal}
          onSave={handleSaveProfile}
          initialProfile={editedProfile}
        />
      )}

      {showNotificationModal && (
        <SuccessNotificationModal
          isOpen={showNotificationModal}
          onClose={handleCloseNotificationModal}
          message={notificationMessage}
          title={notificationTitle}
        />
      )}
    </div>
  );
};

export default Profile;


