import React, { useEffect, useState, useCallback } from 'react';
import { MessageSquare, Search, Clock, ChevronRight, Trash2 } from 'lucide-react';
import { ChatSession } from '../types';

interface HistoryViewProps {
  onSelectSession: (sessionId: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = React.memo(({ onSelectSession }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadHistory = () => {
      try {
        const saved = localStorage.getItem('chat_history');
        if (saved) {
          const parsed = JSON.parse(saved);
          // Ensure sorted by newest first
          setSessions(parsed.sort((a: ChatSession, b: ChatSession) => b.timestamp - a.timestamp));
        }
      } catch (e) {
        console.error("Failed to load history", e);
      }
    };
    loadHistory();
  }, []);

  const handleDelete = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSessions(prev => {
        const newSessions = prev.filter(s => s.id !== id);
        localStorage.setItem('chat_history', JSON.stringify(newSessions));
        return newSessions;
    });
  }, []);

  const filteredSessions = sessions.filter(s => 
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.preview.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8 animate-in fade-in duration-500">
      <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center">
        <Clock className="w-6 h-6 mr-3 text-cyan-600 dark:text-cyan-500" />
        Analysis History
      </h2>
      
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search past briefings..." 
          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-12 pr-4 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-cyan-500/50 shadow-sm transition-colors text-base"
        />
      </div>

      <div className="space-y-4">
        {filteredSessions.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p>No past analysis found.</p>
          </div>
        ) : (
          filteredSessions.map((session) => (
            <div 
              key={session.id} 
              onClick={() => onSelectSession(session.id)}
              className="group bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 md:p-5 hover:border-cyan-500/30 dark:hover:border-slate-700 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg cursor-pointer relative transform-gpu"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 pr-4 md:pr-8">
                  <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-1">
                    {session.title || "Untitled Analysis"}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 line-clamp-2">{session.preview}</p>
                </div>
                <div className="flex items-center space-x-2 md:space-x-3">
                   <button 
                     onClick={(e) => handleDelete(e, session.id)}
                     className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all duration-200 hover:scale-110 hover:rotate-6 z-10 transform-gpu"
                     title="Delete"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                   <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-cyan-500 transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 dark:text-slate-500">
                <span className="flex items-center">
                  <MessageSquare className="w-3 h-3 mr-1" />
                  {session.messages[0]?.mode ? session.messages[0].mode.toUpperCase() : 'ANALYSIS'}
                </span>
                <span className="hidden sm:inline">•</span>
                <span>{new Date(session.timestamp).toLocaleDateString()}</span>
                <span className="hidden sm:inline">•</span>
                <span>{new Date(session.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
});