import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js';

interface SettingsContextType {
  flashcardShowDiacritics: boolean;
  setFlashcardShowDiacritics: (show: boolean) => void;
  translationShowDiacritics: boolean;
  setTranslationShowDiacritics: (show: boolean) => void;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [flashcardShowDiacritics, setFlashcardShowDiacriticsState] = useState(true);
  const [translationShowDiacritics, setTranslationShowDiacriticsState] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from Supabase user metadata
  const loadSettings = async (user: User | null) => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const flashcardSettings = user.user_metadata?.flashcardSettings;
      const translateSettings = user.user_metadata?.translateSettings;

      if (flashcardSettings?.showDiacritics !== undefined) {
        setFlashcardShowDiacriticsState(flashcardSettings.showDiacritics);
      }

      if (translateSettings?.showDiacritics !== undefined) {
        setTranslationShowDiacriticsState(translateSettings.showDiacritics);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Save flashcard diacritics setting to Supabase
  const saveFlashcardDiacriticsSetting = async (showDiacritics: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const currentFlashcardSettings = user.user_metadata?.flashcardSettings || {};
      
      await supabase.auth.updateUser({
        data: {
          flashcardSettings: {
            ...currentFlashcardSettings,
            showDiacritics
          }
        }
      });
    } catch (error) {
      console.error('Error saving flashcard diacritics setting:', error);
    }
  };

  // Save translation diacritics setting to Supabase
  const saveTranslationDiacriticsSetting = async (showDiacritics: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const currentTranslateSettings = user.user_metadata?.translateSettings || {};
      
      await supabase.auth.updateUser({
        data: {
          translateSettings: {
            ...currentTranslateSettings,
            showDiacritics
          }
        }
      });
    } catch (error) {
      console.error('Error saving translation diacritics setting:', error);
    }
  };

  const setFlashcardShowDiacritics = (show: boolean) => {
    setFlashcardShowDiacriticsState(show);
    saveFlashcardDiacriticsSetting(show);
  };

  const setTranslationShowDiacritics = (show: boolean) => {
    setTranslationShowDiacriticsState(show);
    saveTranslationDiacriticsSetting(show);
  };

  useEffect(() => {
    // Load initial settings
    const getInitialUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      await loadSettings(user);
    };

    getInitialUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await loadSettings(session?.user || null);
      } else if (event === 'SIGNED_OUT') {
        // Reset to defaults when signed out
        setFlashcardShowDiacriticsState(true);
        setTranslationShowDiacriticsState(true);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        flashcardShowDiacritics,
        setFlashcardShowDiacritics,
        translationShowDiacritics,
        setTranslationShowDiacritics,
        isLoading,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}; 