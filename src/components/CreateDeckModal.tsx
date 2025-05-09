import React, { useState } from 'react';
import { X } from 'lucide-react';

interface CreateDeckModalProps {
  onClose: () => void;
  onSubmit: (name: string, description: string, emoji: string) => void;
}

const EMOJI_OPTIONS = ['📚', '✏️', '🎯', '🌟', '💡', '🔤', '📝', '🎨', '🎵', '🌍'];

export const CreateDeckModal: React.FC<CreateDeckModalProps> = ({ onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('📚');
  const [customIcon, setCustomIcon] = useState('');
  const [usingCustom, setUsingCustom] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(name, description, usingCustom && customIcon ? customIcon : selectedEmoji);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-dark-200 rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-dark-100">
          <h2 className="text-lg font-bold">Create New Deck</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Choose an Icon
            </label>
            <div className="grid grid-cols-5 gap-2 mb-2">
              {EMOJI_OPTIONS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => { setSelectedEmoji(emoji); setUsingCustom(false); }}
                  className={`text-2xl p-2 rounded-lg ${
                    !usingCustom && selectedEmoji === emoji
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-500'
                      : 'hover:bg-gray-100 dark:hover:bg-dark-100 border border-transparent'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                value={customIcon}
                onChange={e => {
                  const value = e.target.value;
                  // Only allow one grapheme cluster (single character or complex emoji)
                  if (value === '' || [...value].length <= 1) {
                    setCustomIcon(value);
                    setUsingCustom(true);
                  } else if ([...value].length > 1 && value.startsWith(customIcon)) {
                    // If trying to type more than one, but the start is the current customIcon, ignore the extra input
                    // This prevents the input from clearing if the user types extra characters after the first one
                  } else {
                     // If the input is something else, potentially a paste, only take the first grapheme
                     setCustomIcon([...value][0] || '');
                     setUsingCustom(true);
                  }
                }}
                placeholder="Enter your own icon (emoji or character)"
                className={`w-32 p-2 border rounded-lg text-base text-center bg-white dark:bg-dark-300 text-gray-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white ${usingCustom ? 'border-emerald-500' : 'border-gray-300 dark:border-dark-100'}`}
                onFocus={() => setUsingCustom(true)}
              />
              <button
                type="button"
                className={`px-3 py-2 rounded-lg font-semibold border ${usingCustom ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-500 text-emerald-700 dark:text-emerald-300' : 'bg-gray-100 dark:bg-dark-100 border-gray-300 dark:border-dark-100 text-gray-700 dark:text-gray-300'}`}
                onClick={() => setUsingCustom(true)}
              >
                Custom Icon
              </button>
              {usingCustom && customIcon && (
                <button
                  type="button"
                  className="ml-2 text-xs text-gray-500 hover:text-red-500"
                  onClick={() => { setCustomIcon(''); setUsingCustom(false); }}
                >
                  Clear
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">You can select an icon above or type your own (emoji or character).</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Deck Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-dark-100 dark:bg-dark-300 rounded-lg focus:outline-none focus:border-black dark:focus:border-white"
              placeholder="Enter deck name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-dark-100 dark:bg-dark-300 rounded-lg focus:outline-none focus:border-black dark:focus:border-white"
              placeholder="Enter deck description"
              rows={3}
              required
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              Create Deck
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


