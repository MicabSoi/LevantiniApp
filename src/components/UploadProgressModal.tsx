import React from 'react';
import { X, CheckCircle, AlertCircle, Upload } from 'lucide-react';

interface UploadProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  uploadProgress: number;
  totalUploads: number;
  completedUploads: number;
  errors: string[];
}

const UploadProgressModal: React.FC<UploadProgressModalProps> = ({
  isOpen,
  onClose,
  uploadProgress,
  totalUploads,
  completedUploads,
  errors
}) => {
  if (!isOpen) return null;

  const isComplete = completedUploads === totalUploads;
  const hasErrors = errors.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-dark-200 rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Upload Progress
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Progress: {completedUploads} / {totalUploads}
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                {Math.round(uploadProgress)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-dark-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  isComplete
                    ? hasErrors
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center space-x-2">
            {isComplete ? (
              hasErrors ? (
                <>
                  <AlertCircle size={20} className="text-yellow-500" />
                  <span className="text-yellow-700 dark:text-yellow-300">
                    Upload completed with warnings
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle size={20} className="text-green-500" />
                  <span className="text-green-700 dark:text-green-300">
                    Upload completed successfully
                  </span>
                </>
              )
            ) : (
              <>
                <Upload size={20} className="text-emerald-500 animate-pulse" />
                <span className="text-gray-700 dark:text-gray-300">
                  Uploading progress data...
                </span>
              </>
            )}
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-red-700 dark:text-red-300">
                Errors:
              </h4>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                <ul className="space-y-1">
                  {errors.map((error, index) => (
                    <li key={index} className="text-sm text-red-700 dark:text-red-300">
                      • {error}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Close Button */}
          {isComplete && (
            <div className="flex justify-end pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadProgressModal; 