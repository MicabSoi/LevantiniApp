import React from 'react';
import { useProgress } from '../context/ProgressContext';
import { useLessonProgress } from '../hooks/useLessonProgress';

const ProgressDebug: React.FC = () => {
  const { userProgress, lessonProgress, stats, loading, error, refreshProgress } = useProgress();
  const { completeLessonWithScore, isLessonCompleted } = useLessonProgress();

  const testLessonId = '657b5aef-23e3-462c-9f61-c134a855b269'; // Lesson 1.1

  const handleTestCompletion = async () => {
    console.log('🧪 Testing lesson completion with ProgressDebug...');
    await completeLessonWithScore(testLessonId, 85);
    console.log('🧪 Test lesson marked complete, now refreshing context...');
    await refreshProgress(); // Manually refresh the context
    console.log('🧪 Progress context refreshed after test completion.');
  };

  if (loading) return <div>Loading progress...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <h3 className="text-lg font-bold mb-4">Progress Debug</h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold">User Progress:</h4>
          <pre className="text-xs bg-gray-200 dark:bg-gray-700 p-2 rounded">
            {JSON.stringify(userProgress, null, 2)}
          </pre>
        </div>

        <div>
          <h4 className="font-semibold">Lesson Progress ({lessonProgress.length} lessons):</h4>
          <pre className="text-xs bg-gray-200 dark:bg-gray-700 p-2 rounded max-h-32 overflow-y-auto">
            {JSON.stringify(lessonProgress, null, 2)}
          </pre>
        </div>

        <div>
          <h4 className="font-semibold">Stats:</h4>
          <pre className="text-xs bg-gray-200 dark:bg-gray-700 p-2 rounded">
            {JSON.stringify(stats, null, 2)}
          </pre>
        </div>

        <div>
          <h4 className="font-semibold">Test Lesson (1.1):</h4>
          <p>ID: {testLessonId}</p>
          <p>Completed: {isLessonCompleted(testLessonId) ? 'Yes' : 'No'}</p>
          <button 
            onClick={handleTestCompletion}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Mark Test Lesson Complete (85%)
          </button>
          
          <div className="mt-4">
            <h5 className="font-medium">All Lesson IDs in Progress:</h5>
            <div className="text-xs bg-gray-200 dark:bg-gray-700 p-2 rounded max-h-20 overflow-y-auto">
              {lessonProgress.map(lp => (
                <div key={lp.id}>
                  {lp.lesson_id} - {lp.completed ? 'Completed' : 'Not completed'}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressDebug; 