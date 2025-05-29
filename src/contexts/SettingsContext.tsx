import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';

interface SettingsContextType {
  // Flashcard-specific settings
  flashcardShowDiacritics: boolean;
  setFlashcardShowDiacritics: (show: boolean) => void;
  
  // Translation-specific settings
  translationShowDiacritics: boolean;
  setTranslationShowDiacritics: (show: boolean) => void;
  
  // Loading state
  isLoadingSettings: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [flashcardShowDiacritics, setFlashcardShowDiacriticsState] = useState(true);
  const [translationShowDiacritics, setTranslationShowDiacriticsState] = useState(true);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  // Load settings from Supabase on mount and when user changes
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoadingSettings(true);
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data?.user) {
          // If not authenticated, use defaults
          setFlashcardShowDiacriticsState(true);
          setTranslationShowDiacriticsState(true);
          setIsLoadingSettings(false);
          return;
        }

        const userMetadata = data.user.user_metadata || {};
        
        // Load flashcard settings
        if (userMetadata.flashcardSettings?.showDiacritics !== undefined) {
          setFlashcardShowDiacriticsState(userMetadata.flashcardSettings.showDiacritics);
        } else {
          setFlashcardShowDiacriticsState(true); // Default
        }
        
        // Load translation settings
        if (userMetadata.translateSettings?.showDiacritics !== undefined) {
          setTranslationShowDiacriticsState(userMetadata.translateSettings.showDiacritics);
        } else {
          setTranslationShowDiacriticsState(true); // Default
        }
      } catch (error) {
        console.error('Error loading settings from Supabase:', error);
        // Use defaults on error
        setFlashcardShowDiacriticsState(true);
        setTranslationShowDiacriticsState(true);
      } finally {
        setIsLoadingSettings(false);
      }
    };

    loadSettings();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadSettings();
    });

    return () => subscription.unsubscribe();
  }, []);

  // Save flashcard diacritics setting to Supabase
  const setFlashcardShowDiacritics = async (show: boolean) => {
    setFlashcardShowDiacriticsState(show);
    
    try {
      const { data: userData, error: fetchUserError } = await supabase.auth.getUser();
      if (fetchUserError || !userData?.user) {
        console.error('Error fetching user for flashcard settings:', fetchUserError);
        return;
      }

      const existingMetadata = userData.user.user_metadata || {};
      await supabase.auth.updateUser({
        data: {
          ...existingMetadata,
          flashcardSettings: { 
            ...existingMetadata.flashcardSettings, 
            showDiacritics: show 
          }
        }
      });
      
      console.log('Flashcard diacritics setting saved to Supabase:', show);
    } catch (error) {
      console.error('Error saving flashcard diacritics setting to Supabase:', error);
    }
  };

  // Save translation diacritics setting to Supabase
  const setTranslationShowDiacritics = async (show: boolean) => {
    setTranslationShowDiacriticsState(show);
    
    try {
      const { data: userData, error: fetchUserError } = await supabase.auth.getUser();
      if (fetchUserError || !userData?.user) {
        console.error('Error fetching user for translation settings:', fetchUserError);
        return;
      }

      const existingMetadata = userData.user.user_metadata || {};
      await supabase.auth.updateUser({
        data: {
          ...existingMetadata,
          translateSettings: { 
            ...existingMetadata.translateSettings, 
            showDiacritics: show 
          }
        }
      });
      
      console.log('Translation diacritics setting saved to Supabase:', show);
    } catch (error) {
      console.error('Error saving translation diacritics setting to Supabase:', error);
    }
  };

  const value = {
    flashcardShowDiacritics,
    setFlashcardShowDiacritics,
    translationShowDiacritics,
    setTranslationShowDiacritics,
    isLoadingSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}; 