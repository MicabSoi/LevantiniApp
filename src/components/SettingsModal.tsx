import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Add props for initial settings and save handler if needed
  // For now, we'll use localStorage directly
}

// Define interface for hotkey settings structure
export interface HotkeySettings {
  undo: string;
  next: string;
  quality0: string;
  quality1: string;
  quality2: string;
  quality3: string;
}

// Default hotkeys
const DEFAULT_HOTKEYS: HotkeySettings = {
  undo: 'z',
  next: ' ', // spacebar
  quality0: '0',
  quality1: '1',
  quality2: '2',
  quality3: '3',
};

// localStorage key
const HOTKEY_STORAGE_KEY = 'flashcard_hotkeys';

// Helper function to load hotkeys from localStorage
export function loadHotkeys(): HotkeySettings {
  const savedHotkeys = localStorage.getItem(HOTKEY_STORAGE_KEY);
  if (savedHotkeys) {
    try {
      const parsed = JSON.parse(savedHotkeys);
      // Basic validation to ensure all keys exist
      if (Object.keys(parsed).length === Object.keys(DEFAULT_HOTKEYS).length &&
          Object.keys(DEFAULT_HOTKEYS).every(key => parsed.hasOwnProperty(key)))
      {
        return parsed;
      } else {
         console.warn('Invalid hotkeys found in localStorage, using defaults.');
         return DEFAULT_HOTKEYS;
      }
    } catch (e) {
      console.error('Failed to parse hotkeys from localStorage:', e);
      return DEFAULT_HOTKEYS;
    }
  }
  return DEFAULT_HOTKEYS;
}

// Helper to save hotkeys to localStorage
const saveHotkeys = (hotkeys: HotkeySettings) => {
  localStorage.setItem(HOTKEY_STORAGE_KEY, JSON.stringify(hotkeys));
};

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [hotkeySettings, setHotkeySettings] = useState<HotkeySettings>(loadHotkeys());
  const [capturingKeyFor, setCapturingKeyFor] = useState<keyof HotkeySettings | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Load settings on mount
  useEffect(() => {
    setHotkeySettings(loadHotkeys());
  }, [isOpen]); // Reload when modal opens

  // Handle key capture
  useEffect(() => {
    if (capturingKeyFor && inputRef.current) {
      inputRef.current.focus();
      const handleKeyDown = (event: KeyboardEvent) => {
        event.preventDefault(); // Prevent default behavior
        event.stopPropagation(); // Stop event propagation

        const newHotkey = event.key;
        setHotkeySettings(prev => ({
          ...prev,
          [capturingKeyFor]: newHotkey,
        }));
        setCapturingKeyFor(null); // Stop capturing
      };

      inputRef.current.addEventListener('keydown', handleKeyDown);

      return () => {
        if (inputRef.current) {
           inputRef.current.removeEventListener('keydown', handleKeyDown);
        }
      };
    }
  }, [capturingKeyFor]);

  const handleSave = () => {
    saveHotkeys(hotkeySettings);
    onClose();
  };

  const handleCancel = () => {
    // Optionally reload original settings or just close
    setHotkeySettings(loadHotkeys()); // Revert to saved settings on cancel
    setCapturingKeyFor(null); // Stop capturing if in progress
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-200 p-6 rounded-lg shadow-lg w-full max-w-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">Settings</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-dark-100 text-gray-600 dark:text-gray-400">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold text-gray-700 dark:text-gray-300">Hotkeys</h4>
          {
            Object.keys(hotkeySettings as HotkeySettings).map(key => {
              // Change label from 'Quality' to 'Review Rating'
              let hotkeyName = key.replace(/([A-Z])/g, ' $1').trim();
              if (hotkeyName.startsWith('quality')) {
                hotkeyName = hotkeyName.replace('quality', 'Review Rating');
              }
              // Show 'spacebar' if the value is a space character
              const displayValue = hotkeySettings[key as keyof HotkeySettings] === ' '
                ? 'spacebar'
                : hotkeySettings[key as keyof HotkeySettings];
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
                      className={`w-24 p-1 text-center border rounded-md mr-2 cursor-pointer text-gray-900 dark:text-white ${capturingKeyFor === key ? 'ring-2 ring-emerald-500' : 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-dark-100'}`}
                      onClick={() => setCapturingKeyFor(key as keyof HotkeySettings)}
                    />
                     {capturingKeyFor === key && <span className="text-sm text-emerald-600 dark:text-emerald-400">Press a key...</span>}
                  </div>
                </div>
              );
            })
          }
           {/* Hidden input for key capturing */}
           {/* <input ref={inputRef} type="text" className="absolute -left-full" /> */}

        </div>

        <div className="flex justify-end space-x-4 mt-6">
          <button onClick={handleCancel} className="px-4 py-2 rounded-md bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-400 dark:hover:bg-gray-600">
            Cancel
          </button>
          <button onClick={handleSave} className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700">
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal; 