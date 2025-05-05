import React, { useState } from 'react';
import { X } from 'lucide-react';

interface CreateDeckModalProps {
  onClose: () => void;
  onSubmit: (name: string, description: string, emoji: string) => void;
}

const EMOJI_OPTIONS = ['📚', '✏️', '🎯', '🌟', '💡', '🔤', '📝', '🎨', '🎵', '🌍'];

const CreateDeckModal: React.FC<CreateDeckModalProps> = ({ onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('📚');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(name, description, selectedEmoji);
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
              Choose an Emoji
            </label>
            <div className="grid grid-cols-5 gap-2">
              {EMOJI_OPTIONS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`text-2xl p-2 rounded-lg ${
                    selectedEmoji === emoji
                      ? 'bg-emerald-100 dark:bg-emerald-900/30'
                      : 'hover:bg-gray-100 dark:hover:bg-dark-100'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Deck Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-dark-100 dark:bg-dark-300 rounded-lg"
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
              className="w-full p-2 border border-gray-300 dark:border-dark-100 dark:bg-dark-300 rounded-lg"
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

