import React, { useMemo } from 'react';
import { X, AlertCircle } from 'lucide-react';

const BatchUploadProgress = ({ uploadProgress }) => {
  // Calculate overall progress
  const { totalProgress, currentFileName, failedFiles } = useMemo(() => {
    const entries = Object.values(uploadProgress);
    if (entries.length === 0) return {
      totalProgress: 0,
      currentFileName: '',
      failedFiles: 0
    };

    // Get the first (and should be only) batch progress entry
    const batch = entries[0];

    return {
      totalProgress: batch.progress || 0,
      currentFileName: batch.filename || '',
      failedFiles: batch.status === 'error' ? 1 : 0
    };
  }, [uploadProgress]);

  if (Object.keys(uploadProgress).length === 0) return null;

  return (
    <div className="p-3 bg-next-dark rounded-next border border-next-white/20">
      <div className="flex justify-between items-center mb-2">
        <div className="text-next-white text-sm">
          {currentFileName}
          {failedFiles > 0 && (
            <span className="ml-2 text-next-red text-xs flex items-center">
              <AlertCircle className="h-3.5 w-3.5 mr-1" /> Upload failed
            </span>
          )}
        </div>
        <span className="text-next-blue font-mono text-xs">
          {totalProgress}%
        </span>
      </div>

      <div className="w-full h-2 bg-next-black/50 rounded-sm overflow-hidden border border-next-white/10">
        <div
          className={`h-full transition-all duration-300 ${failedFiles > 0 ? 'bg-next-red' : 'bg-next-blue'}`}
          style={{ width: `${totalProgress}%` }}
        />
      </div>

      {/* Error display */}
      {failedFiles > 0 && Object.entries(uploadProgress)
        .filter(([_, status]) => status.status === 'error')
        .map(([id, status]) => (
          <div key={id} className="mt-2 bg-next-red/10 border-l-2 border-next-red p-2 text-next-white text-xs rounded-sm">
            <div className="flex items-center">
              <X className="h-3.5 w-3.5 mr-1 text-next-red" />
              {status.error}
            </div>
          </div>
        ))}
    </div>
  );
};

export default BatchUploadProgress;