import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient'; // Import Supabase client
import { User } from '@supabase/supabase-js'; // Import User type

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSave: (settings: StudySettings) => void; // Callback to update StudySession state
}

// Define interface for ALL study settings
export interface StudySettings {
  study_direction: 'en-ar' | 'ar-en';
  show_transliteration: boolean;
  hotkeys: HotkeySettings;
}

export interface HotkeySettings {
  undo: string;
  next: string;
  quality0: string;
  quality1: string;
  quality2: string;
  quality3: string;
}

// Default study settings
const DEFAULT_STUDY_SETTINGS: StudySettings = {
  study_direction: 'en-ar',
  show_transliteration: true,
  hotkeys: {
    undo: 'z',
    next: ' ', // spacebar
    quality0: '0',
    quality1: '1',
    quality2: '2',
    quality3: '3',
  },
};

// Helper function to load study settings from Supabase or return defaults
export async function loadStudySettings(user: User | null): Promise<StudySettings> {
  if (!user) {
    console.log("No user logged in, using default study settings.");
    // Optionally, load from localStorage as a fallback for non-logged-in users if desired
    // For now, just return defaults.
    return DEFAULT_STUDY_SETTINGS;
  }
  try {
    const { data, error } = await supabase.rpc('get_or_create_user_settings');
    if (error) throw error;
    if (data) {
      // Ensure hotkeys are valid, merge with defaults if not fully formed
      const loadedHotkeys = data.hotkeys || {};
      const validHotkeys = { ...DEFAULT_STUDY_SETTINGS.hotkeys, ...loadedHotkeys };
      
      return {
        study_direction: data.study_direction || DEFAULT_STUDY_SETTINGS.study_direction,
        show_transliteration: typeof data.show_transliteration === 'boolean' ? data.show_transliteration : DEFAULT_STUDY_SETTINGS.show_transliteration,
        hotkeys: validHotkeys,
      };
    }
  } catch (err) {
    console.error('Failed to load study settings from Supabase:', err);
  }
  return DEFAULT_STUDY_SETTINGS; // Fallback to defaults on error
}

// Helper to save study settings to Supabase
const saveStudySettingsToSupabase = async (user: User | null, settings: StudySettings) => {
  if (!user) {
    console.warn("No user logged in, cannot save settings to Supabase.");
    // Optionally, save to localStorage as a fallback
    // localStorage.setItem(STUDY_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    return;
  }
  try {
    const { error } = await supabase
      .from('user_study_settings')
      .upsert({
        user_id: user.id,
        study_direction: settings.study_direction,
        show_transliteration: settings.show_transliteration,
        hotkeys: settings.hotkeys,
        updated_at: new Date().toISOString(),
      });
    if (error) throw error;
    console.log('Study settings saved to Supabase.');
  } catch (err) {
    console.error('Failed to save study settings to Supabase:', err);
  }
};

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSettingsSave }) => {
  const [currentSettings, setCurrentSettings] = useState<StudySettings>(DEFAULT_STUDY_SETTINGS);
  const [capturingKeyFor, setCapturingKeyFor] = useState<keyof HotkeySettings | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
    });
  }, []);

  // Load settings when modal opens or user changes
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      loadStudySettings(currentUser).then(settings => {
        setCurrentSettings(settings);
        setIsLoading(false);
      });
    }
  }, [isOpen, currentUser]);

  // Handle key capture
  useEffect(() => {
    if (capturingKeyFor && inputRef.current) {
      inputRef.current.focus();
      const handleKeyDown = (event: KeyboardEvent) => {
        event.preventDefault();
        event.stopPropagation();
        const newHotkey = event.key === ' ' ? 'spacebar' : event.key; // Store spacebar explicitly
        setCurrentSettings(prev => ({
          ...prev,
          hotkeys: {
            ...prev.hotkeys,
            [capturingKeyFor]: newHotkey,
          }
        }));
        setCapturingKeyFor(null);
      };
      const currentInputRef = inputRef.current;
      currentInputRef.addEventListener('keydown', handleKeyDown);
      return () => {
        currentInputRef.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [capturingKeyFor]);

  const handleSave = async () => {
    setIsLoading(true);
    await saveStudySettingsToSupabase(currentUser, currentSettings);
    onSettingsSave(currentSettings); // Update parent state
    setIsLoading(false);
    onClose();
  };

  const handleCancel = () => {
    // Re-load settings to revert changes
    if (currentUser) {
      setIsLoading(true);
      loadStudySettings(currentUser).then(settings => {
        setCurrentSettings(settings);
        setIsLoading(false);
      });
    } else {
      setCurrentSettings(DEFAULT_STUDY_SETTINGS);
    }
    setCapturingKeyFor(null);
    onClose();
  };

  const handleSettingChange = (field: keyof StudySettings, value: any) => {
    setCurrentSettings(prev => ({
      ...prev,
      [field]: value,
    }));
  };
  
  const handleHotkeySettingChange = (field: keyof HotkeySettings, value: string) => {
    setCurrentSettings(prev => ({
        ...prev,
        hotkeys: {
            ...prev.hotkeys,
            [field]: value,
        }
    }));
  };


  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-dark-200 p-6 rounded-lg shadow-lg w-full max-w-md"> {/* Increased max-width */}
        <div className="flex justify-between items-center mb-6"> {/* Increased margin-bottom */}
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">Study Settings</h3> {/* Increased text size */}
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-dark-100 text-gray-600 dark:text-gray-400">
            <X size={24} /> {/* Increased icon size */}
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading settings...</div>
        ) : (
          <div className="space-y-6"> {/* Increased spacing */}
            {/* Study Direction Setting */}
            <div>
              <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Study Direction</h4>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="study_direction"
                    value="en-ar"
                    checked={currentSettings.study_direction === 'en-ar'}
                    onChange={() => handleSettingChange('study_direction', 'en-ar')}
                    className="form-radio text-emerald-600"
                  />
                  <span className="text-gray-800 dark:text-gray-200">English → Arabic</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="study_direction"
                    value="ar-en"
                    checked={currentSettings.study_direction === 'ar-en'}
                    onChange={() => handleSettingChange('study_direction', 'ar-en')}
                    className="form-radio text-emerald-600"
                  />
                  <span className="text-gray-800 dark:text-gray-200">Arabic → English</span>
                </label>
              </div>
            </div>

            {/* Show Transliteration Setting */}
            <div>
              <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Transliteration</h4>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentSettings.show_transliteration}
                  onChange={(e) => handleSettingChange('show_transliteration', e.target.checked)}
                  className="form-checkbox text-emerald-600 h-5 w-5" // Tailwind classes for styling
                />
                <span className="text-gray-800 dark:text-gray-200">Show Transliteration</span>
              </label>
            </div>
            
            {/* Hotkeys Settings */}
            <div>
              <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Hotkeys</h4>
              <div className="space-y-3"> {/* Inner spacing for hotkeys */}
                {
                  Object.keys(currentSettings.hotkeys as HotkeySettings).map(key => {
                    let hotkeyName = key.replace(/([A-Z])/g, ' $1').trim();
                    if (hotkeyName.startsWith('quality')) {
                      const qualityMatch = hotkeyName.match(/^quality(\d+)$/);
                      if (qualityMatch && qualityMatch[1]) {
                        const qualityNumber = parseInt(qualityMatch[1], 10) + 1;
                        hotkeyName = `Review Rating ${qualityNumber}`;
                      } else {
                        hotkeyName = hotkeyName.replace('quality', 'Review Rating');
                      }
                    }
                    const displayValue = currentSettings.hotkeys[key as keyof HotkeySettings] === ' ' ? 'spacebar' : currentSettings.hotkeys[key as keyof HotkeySettings];
                    return (
                      <div key={key} className="flex justify-between items-center">
                        <label htmlFor={key} className="text-gray-800 dark:text-gray-200 capitalize">{hotkeyName}</label>
                        <div className="flex items-center">
                          <input
                            ref={capturingKeyFor === key ? inputRef : null}
                            type="text"
                            id={key}
                            value={displayValue}
                            readOnly
                            className={`w-28 p-2 text-center border rounded-md mr-2 cursor-pointer text-gray-900 dark:text-white ${capturingKeyFor === key ? 'ring-2 ring-emerald-500' : 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-dark-100'}`}
                            onClick={() => setCapturingKeyFor(key as keyof HotkeySettings)}
                          />
                          {capturingKeyFor === key && <span className="text-sm text-emerald-600 dark:text-emerald-400">Press a key...</span>}
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-4 mt-8"> {/* Increased margin-top */}
          <button 
            onClick={handleCancel} 
            className="px-6 py-2 rounded-md bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            className="px-6 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center"
            disabled={isLoading}
          >
            {isLoading && <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

// Hotkeys are loaded in StudySession.tsx and passed if needed, or StudySession loads them directly.
// This export is kept if other components might need to load hotkeys independently, but for study session settings,
// they are part of the larger StudySettings object.
// export { loadHotkeys }; // loadHotkeys is now part of loadStudySettings
export default SettingsModal; 