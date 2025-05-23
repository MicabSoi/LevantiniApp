import React, { useState, useEffect } from 'react';
import { User, MapPin, Star, Trophy, BookOpen, GraduationCap, LucideIcon } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import EditProfileModal, { UserProfile } from './EditProfileModal'; // Corrected import for UserProfile
import SuccessNotificationModal from './SuccessNotificationModal';

// Define a type for the updatedProfile parameter in handleSaveProfile
interface UpdatedProfileData {
  name?: string;
  email?: string;
  country?: string;
  password?: string;
}

const Profile = () => {
  // This would come from your user context/state management
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile> | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationTitle, setNotificationTitle] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Construct a UserProfile object from fetched data and existing profile data
        const profileData: UserProfile = {
          name: user.user_metadata?.name || "User",
          email: user.email || "",
          country: user.user_metadata?.country || userProfile?.country || "",
          level: userProfile?.level || 12,
          joinDate: user.created_at || userProfile?.joinDate || "",
          totalXP: userProfile?.totalXP || 0,
          nextLevelXP: userProfile?.nextLevelXP || 100,
          achievements: userProfile?.achievements || [],
          user_metadata: user.user_metadata || {},
        };
        setUserProfile(profileData);
        setEditedProfile(profileData);
      } else {
        setUserProfile(null);
        setEditedProfile(null);
      }
    };

    fetchUser();
  }, [userProfile]); // Added userProfile to dependency array

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditedProfile((prev: Partial<UserProfile> | null) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async (updatedProfile: Partial<UserProfile>) => {
    let nameUpdateError: any = null; // Use any for error types for now
    let emailUpdateError: any = null;
    let countryUpdateError: any = null;
    let passwordUpdateError: any = null;

    let nameUpdated = false;
    let emailUpdated = false;
    let countryUpdated = false;
    let passwordUpdated = false;

    // Update name if it has changed and is provided
    if (updatedProfile.name !== undefined && userProfile?.name !== updatedProfile.name) {
      const { data, error } = await supabase.auth.updateUser({
        data: { ...userProfile?.user_metadata, name: updatedProfile.name } // Preserve other metadata
      });
      if (error) {
        nameUpdateError = error;
        console.error('Error updating user name:', error);
      } else {
        console.log('User name updated successfully:', data);
        // Update userProfile state with new name
        setUserProfile(prev => prev ? { ...prev, name: updatedProfile.name as string } : null);
        nameUpdated = true;
      }
    }

    // Update email if provided and has changed
    if (updatedProfile.email !== undefined && userProfile?.email !== updatedProfile.email) {
      const { data, error } = await supabase.auth.updateUser({
        email: updatedProfile.email
      });
      if (error) {
        emailUpdateError = error;
        console.error('Error updating user email:', error);
      } else {
        console.log('User email updated successfully:', data);
        // Update userProfile state with new email
        setUserProfile(prev => prev ? { ...prev, email: updatedProfile.email as string } : null);
        emailUpdated = true;
      }
    }

    // Update country if provided and has changed (assuming country is stored in user_metadata)
    if (updatedProfile.country !== undefined && userProfile?.country !== updatedProfile.country) {
        const { data, error } = await supabase.auth.updateUser({
            data: { ...userProfile?.user_metadata, country: updatedProfile.country } // Add or update country in metadata
        });
        if (error) {
            countryUpdateError = error;
            console.error('Error updating user country:', error);
          } else {
            console.log('User country updated successfully:', data);
             // Update userProfile state with new country
            setUserProfile(prev => prev ? { ...prev, country: updatedProfile.country as string } : null);
            countryUpdated = true;
          }
    }

    // Update password if provided and not empty
    if (updatedProfile.password && updatedProfile.password !== '') {
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

    // Show notification based on results
    if (nameUpdateError || emailUpdateError || countryUpdateError || passwordUpdateError) {
      // Handle errors
      let errorMessage = "Profile update failed:\n\n";
      if (nameUpdateError) {
        errorMessage += `Name update error: ${nameUpdateError.message}\n`;
      }
      if (emailUpdateError) {
        errorMessage += `Email update error: ${emailUpdateError.message}\n`;
      }
      if (countryUpdateError) {
        errorMessage += `Country update error: ${countryUpdateError.message}\n`;
      }
      if (passwordUpdateError) {
        errorMessage += `Password update error: ${passwordUpdateError.message}\n`;
      }
      errorMessage += "\nPlease try again.";
      setNotificationMessage(errorMessage);
      setNotificationTitle('Error'); // Set title to Error
      console.error("Profile update failed:", nameUpdateError, passwordUpdateError, emailUpdateError, countryUpdateError);
    } else if (nameUpdated || emailUpdated || countryUpdated || passwordUpdated) {
       let successMessage = '';
        if(nameUpdated) successMessage += 'Name updated. \n';
        if(emailUpdated) successMessage += 'Email updated. \n';
        if(countryUpdated) successMessage += 'Country updated. \n';
        if(passwordUpdated) successMessage += 'Password updated. \n';
        setNotificationMessage(successMessage.trim());
        setNotificationTitle('Success!');
    } else {
      setNotificationMessage('No changes were made to your profile.');
      setNotificationTitle('Info'); // Or a different title for no changes
    }

    setShowNotificationModal(true); // Show the notification modal (success or error)
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    // Revert changes if modal is closed without saving, only if userProfile is loaded
    if (userProfile) {
      setEditedProfile(userProfile); 
    }
  };

  const handleCloseNotificationModal = () => {
    setShowNotificationModal(false);
    // If the notification was an error, reopen the edit modal with current editedProfile state
    if (notificationTitle === 'Error') {
       setShowEditModal(true);
    }
    setNotificationMessage('');
    setNotificationTitle('');
  };

  // Calculate level progress percentage only if userProfile is loaded
  const levelProgress = userProfile ? (userProfile.totalXP / userProfile.nextLevelXP) * 100 : 0;

  // Render nothing or a loading state if userProfile is null
  if (!userProfile) {
    return (
       <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-300">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    ); // Or a loading spinner
  }

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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {userProfile.achievements.length > 0 ? (
            userProfile.achievements.map((achievement: { id: number; name: string; description: string; icon: LucideIcon }, index: number) => (
              <div key={index} className="flex items-center p-4 bg-gray-50 dark:bg-dark-100 rounded-md">
                {/* Use React.createElement to render the Lucide icon component */}
                {React.createElement(achievement.icon, { size: 24, className: 'text-yellow-500 mr-3' })}
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-gray-100">{achievement.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{achievement.description}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-600 dark:text-gray-400">No achievements yet.</p>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && userProfile && editedProfile && (
        <EditProfileModal
          isOpen={showEditModal}
          onClose={handleCloseEditModal}
          userProfile={userProfile}
          onSave={handleSaveProfile}
        />
      )}

      {/* Notification Modal */}
      <SuccessNotificationModal
        isOpen={showNotificationModal}
        onClose={handleCloseNotificationModal}
        title={notificationTitle}
        message={notificationMessage}
      />
    </div>
  );
};

export default Profile;



