import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Calendar, DollarSign, Clock, ChevronRight } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  budget: number;
  required_skills: string[];
  deadline: string;
  created_at: string;
  status: 'open' | 'assigned' | 'completed';
}

const TaskList: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTasks();

    // Subscribe to changes
    const subscription = supabase
      .channel('tasks_channel')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'tasks' 
      }, () => {
        fetchTasks();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchTasks = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setTasks(data || []);
    } catch (err) {
      setError('Failed to fetch tasks');
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-md">
        {error}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No tasks available. Be the first to post a task!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <div 
          key={task.id} 
          className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-emerald-500 transition-colors"
        >
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-lg font-semibold">{task.title}</h3>
            <span className={`
              px-2 py-1 rounded-full text-sm
              ${task.status === 'open' ? 'bg-green-100 text-green-800' : 
                task.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'}
            `}>
              {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
            </span>
          </div>

          <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
            {task.description}
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            {task.required_skills.map((skill, index) => (
              <span 
                key={index}
                className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-md text-sm"
              >
                {skill}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center">
              <DollarSign size={16} className="mr-1" />
              ${task.budget.toFixed(2)}
            </div>
            <div className="flex items-center">
              <Calendar size={16} className="mr-1" />
              {new Date(task.deadline).toLocaleDateString()}
            </div>
            <div className="flex items-center">
              <Clock size={16} className="mr-1" />
              {new Date(task.created_at).toLocaleDateString()}
            </div>
            <button className="flex items-center text-emerald-600 hover:text-emerald-700">
              View Details
              <ChevronRight size={16} className="ml-1" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TaskList;

