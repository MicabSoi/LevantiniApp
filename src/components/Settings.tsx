import React, { useState, useEffect } from 'react';
import { Moon, Sun, Check } from 'lucide-react';

interface Tab {
  id: string;
  name: string;
  icon: string;
}

const availableTabs: Tab[] = [
  { id: 'daily', name: 'Daily Words', icon: '📅' },
  { id: 'wordbank', name: 'Vocabulary', icon: '📚' },
  { id: 'translate', name: 'Translate', icon: '🔄' },
  { id: 'dictionary', name: 'Dictionary', icon: '📖' },
  { id: 'alphabet', name: 'Alphabet', icon: '🔤' },
  { id: 'pronunciation', name: 'Pronunciation', icon: '🗣️' },
  { id: 'grammar', name: 'Grammar', icon: '📝' }
];

const Settings = () => {
  const [apiKey, setApiKey] = useState('');
  const [savedApiKey, setSavedApiKey] = useState(() => {
    return localStorage.getItem('openai_api_key') || '';
  });

  const saveApiKey = () => {
    if (apiKey) {
      localStorage.setItem('openai_api_key', apiKey);
      setSavedApiKey(apiKey);
      setApiKey('');
    }
  };

  const clearApiKey = () => {
    setApiKey('');
    setSavedApiKey('');
    localStorage.removeItem('openai_api_key');
  };

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  const [selectedTabs, setSelectedTabs] = useState<string[]>(() => {
    const saved = localStorage.getItem('quickStartTabs');
    return saved ? JSON.parse(saved) : ['daily', 'wordbank', 'translate'];
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('quickStartTabs', JSON.stringify(selectedTabs));
  }, [selectedTabs]);

  const toggleTab = (tabId: string) => {
    setSelectedTabs(prev => {
      if (prev.includes(tabId)) {
        return prev.filter(id => id !== tabId);
      }
      if (prev.length < 3) {
        return [...prev, tabId];
      }
      return prev;
    });
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-6">Settings</h2>

      {/* Theme Settings */}
      <div className="mb-8 bg-white dark:bg-dark-200 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-100 dark:shadow-black/10">
        <h3 className="font-bold mb-4">Theme</h3>
        <div className="flex items-center justify-between">
          <span className="text-gray-700 dark:text-gray-100">Dark Mode</span>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
              isDarkMode ? 'bg-emerald-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isDarkMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
            {isDarkMode ? (
              <Moon size={12} className="absolute right-1 text-white" />
            ) : (
              <Sun size={12} className="absolute left-1 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* Quick Start Customization */}
      <div className="mb-8 bg-white dark:bg-dark-200 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-100 dark:shadow-black/10">
        <h3 className="font-bold mb-4">Quick Start Customization</h3>
        <p className="text-sm text-gray-600 dark:text-gray-200 mb-4">
          Select up to three tabs to display in your Quick Start section
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {availableTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => toggleTab(tab.id)}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                selectedTabs.includes(tab.id)
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center">
                <span className="mr-2">{tab.icon}</span>
                <span className="font-medium">{tab.name}</span>
              </div>
              {selectedTabs.includes(tab.id) && (
                <Check size={18} className="text-emerald-600" />
              )}
            </button>
          ))}
        </div>
      </div>
      
      {/* OpenAI API Settings */}
      <div className="mb-8 bg-white dark:bg-dark-200 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-100 dark:shadow-black/10">
        <h3 className="font-bold mb-4">OpenAI API Settings</h3>
        <p className="text-sm text-gray-600 dark:text-gray-200 mb-3">
          Enter your OpenAI API key to enable unlimited translations. Your key is stored locally in your browser.
        </p>
        <div className="flex mb-3">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="flex-1 p-2 border border-gray-300 dark:border-gray-600 dark:bg-dark-100 rounded-l-md focus:ring-emerald-500 focus:border-emerald-500 dark:text-gray-100 dark:placeholder-gray-500"
          />
          <button
            onClick={saveApiKey}
            className="bg-emerald-600 text-white px-3 rounded-r-md hover:bg-emerald-700"
            disabled={!apiKey}
          >
            <Check size={18} />
          </button>
        </div>
        {savedApiKey && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-emerald-600">API key saved</span>
            <button
              onClick={clearApiKey}
              className="text-xs text-red-600 hover:text-red-800"
            >
              Clear API key
            </button>
          </div>
        )}
      </div>

      {/* Language Settings Placeholder */}
      <div className="mb-8 bg-white dark:bg-dark-200 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-100 dark:shadow-black/10">
        <h3 className="font-bold mb-4">Language Settings</h3>
        <p className="text-gray-500 dark:text-gray-200 italic">
          Language settings will be available in a future update.
        </p>
      </div>

      {/* Notifications Placeholder */}
      <div className="bg-white dark:bg-dark-200 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-100 dark:shadow-black/10">
        <h3 className="font-bold mb-4">Notifications</h3>
        <p className="text-gray-500 dark:text-gray-200 italic">
          Notification settings will be available in a future update.
        </p>
      </div>
    </div>
  );
};

export default Settings;

