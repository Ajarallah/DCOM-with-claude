import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingIndicator: React.FC = () => {
  return (
    <div className="flex items-center space-x-3 p-4 bg-slate-100 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800 max-w-fit animate-in fade-in duration-300">
      <Loader2 className="w-4 h-4 text-cyan-500 animate-spin" />
      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
        Initializing analysis protocol...
      </span>
    </div>
  );
};