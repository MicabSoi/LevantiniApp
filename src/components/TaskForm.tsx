import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { PlusCircle, Loader2 } from 'lucide-react';

interface TaskFormProps {
  onSuccess?: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ onSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [skills, setSkills] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const { data, error: submitError } = await supabase
        .from('tasks')
        .insert([
          {
            title,
            description,
            budget: parseFloat(budget),
            required_skills: skills.split(',').map(s => s.trim()),
            deadline: new Date(deadline).toISOString(),
          }
        ])
        .select();

      if (submitError) throw submitError;

      // Reset form
      setTitle('');
      setDescription('');
      setBudget('');
      setSkills('');
      setDeadline('');
      
      if (onSuccess) onSuccess();
    } catch (err) {
      setError('Failed to create task. Please try again.');
      console.error('Error creating task:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md"
          rows={4}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Budget ($)
        </label>
        <input
          type="number"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md"
          min="0"
          step="0.01"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Required Skills (comma-separated)
        </label>
        <input
          type="text"
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md"
          placeholder="React, TypeScript, Node.js"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Deadline
        </label>
        <input
          type="datetime-local"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 disabled:bg-emerald-400 flex items-center justify-center"
      >
        {isSubmitting ? (
          <>
            <Loader2 size={18} className="mr-2 animate-spin" />
            Creating Task...
          </>
        ) : (
          <>
            <PlusCircle size={18} className="mr-2" />
            Create Task
          </>
        )}
      </button>
    </form>
  );
};

export default TaskForm;

