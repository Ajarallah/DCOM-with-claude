import React, { useState, useEffect, useCallback } from 'react';
import { Send, Globe, Check, Brain, MessageCircleQuestion } from 'lucide-react';
import { ANALYSIS_MODES } from '../constants';
import { AnalysisMode } from '../types';

interface InputAreaProps {
  onSend: (text: string, mode: AnalysisMode, useWeb: boolean, useDeepThinking: boolean, refine: boolean) => void;
  disabled?: boolean;
  defaultDeepThinking?: boolean;
  defaultRefine?: boolean;
}

export const InputArea: React.FC<InputAreaProps> = React.memo(({ 
  onSend, 
  disabled, 
  defaultDeepThinking = false,
  defaultRefine = false 
}) => {
  const [text, setText] = useState('');
  const [selectedMode, setSelectedMode] = useState<AnalysisMode>('strategic');
  const [useWeb, setUseWeb] = useState(false);
  const [useDeepThinking, setUseDeepThinking] = useState(defaultDeepThinking);
  const [useRefine, setUseRefine] = useState(defaultRefine);
  const [hoveredMode, setHoveredMode] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setUseDeepThinking(defaultDeepThinking);
  }, [defaultDeepThinking]);

  useEffect(() => {
    setUseRefine(defaultRefine);
  }, [defaultRefine]);

  // Debounce the submit to prevent double-clicks
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !disabled && !isSubmitting) {
      setIsSubmitting(true);
      onSend(text, selectedMode, useWeb, useDeepThinking, useRefine);
      setText('');
      
      // Reset submitting state after a short delay
      setTimeout(() => setIsSubmitting(false), 500);
    }
  }, [text, disabled, isSubmitting, onSend, selectedMode, useWeb, useDeepThinking, useRefine]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  const handleModeSelect = useCallback((modeId: AnalysisMode) => {
    setSelectedMode(modeId);
    // Find the mode to get the example
    const modeObj = ANALYSIS_MODES.find(m => m.id === modeId);
    // Only populate if text is empty to avoid overwriting user input
    if (modeObj && text.trim() === '') {
      setText(modeObj.example);
    }
  }, [text]);

  const isAnalyzeDisabled = !text.trim() || disabled || isSubmitting;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-4 md:pb-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-visible backdrop-blur-sm transition-colors duration-300 flex flex-col md:block md:relative transform-gpu">
        
        {/* Input Field */}
        <form onSubmit={handleSubmit} className="contents md:block">
          {/* Compact Input Area */}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What are the main risks of current inflation?"
            className="w-full bg-transparent text-base md:text-lg text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 p-3 md:p-4 md:pb-20 focus:outline-none resize-none min-h-[60px] md:min-h-[70px] rounded-t-2xl"
            style={{ fontSize: '16px' }} // Prevent iOS zoom
            disabled={disabled}
            spellCheck={false}
          />

          {/* Controls Bar */}
          <div className="bg-white dark:bg-slate-900 px-3 md:px-4 pb-3 md:pb-4 pt-2 border-t border-slate-100 dark:border-slate-800/50 rounded-b-2xl md:absolute md:bottom-0 md:left-0 md:right-0">
            
            {/* Modes Grid - Compact Version */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 md:gap-2 mb-3">
              {ANALYSIS_MODES.map((mode) => {
                const Icon = mode.icon;
                const isSelected = selectedMode === mode.id;
                return (
                  <div 
                    key={mode.id} 
                    className="relative"
                    onMouseEnter={() => setHoveredMode(mode.id)}
                    onMouseLeave={() => setHoveredMode(null)}
                  >
                    <button
                      type="button"
                      onClick={() => handleModeSelect(mode.id as AnalysisMode)}
                      className={`
                        w-full flex flex-row items-center justify-center space-x-1.5 md:space-x-2 px-2 h-[34px] md:h-[36px] rounded-lg border transition-all duration-200 hover:scale-105 active:scale-95 transform-gpu
                        ${isSelected 
                          ? 'bg-slate-100 dark:bg-slate-800 border-cyan-500/50 text-cyan-600 dark:text-cyan-400 shadow-sm' 
                          : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300'
                        }
                      `}
                    >
                      <Icon className="w-3 h-3 md:w-3.5 md:h-3.5 flex-shrink-0" />
                      <span className="text-[11px] md:text-xs font-semibold whitespace-nowrap overflow-hidden text-ellipsis">{mode.label}</span>
                    </button>
                    
                    {/* Tooltip (Desktop Only) */}
                    <div className="hidden md:block">
                    {hoveredMode === mode.id && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-3 bg-slate-800 dark:bg-slate-700 text-white text-xs rounded-xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200 pointer-events-none border border-slate-600/50 will-change-transform">
                        <div className="font-bold mb-1 text-cyan-400 text-sm">{mode.useCase}</div>
                        <div className="italic text-slate-300 border-t border-slate-600/50 pt-1 mt-1 leading-relaxed">
                          " {mode.example} "
                        </div>
                        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-800 dark:bg-slate-700 rotate-45 border-r border-b border-slate-600/50"></div>
                      </div>
                    )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setUseWeb(!useWeb)}
                  className={`
                    flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] md:text-xs font-medium transition-all duration-200 hover:scale-105 active:scale-95 border h-[28px] md:h-[30px] transform-gpu
                    ${useWeb 
                      ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30' 
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }
                  `}
                >
                  <Globe className="w-3 h-3" />
                  <span>Web Search</span>
                </button>

                <button
                  type="button"
                  onClick={() => setUseDeepThinking(!useDeepThinking)}
                  className={`
                    flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] md:text-xs font-medium transition-all duration-200 hover:scale-105 active:scale-95 border h-[28px] md:h-[30px] transform-gpu
                    ${useDeepThinking 
                      ? 'bg-fuchsia-50 dark:bg-fuchsia-950/30 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-200 dark:border-fuchsia-500/30' 
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }
                  `}
                >
                  <Brain className="w-3 h-3" />
                  <span>Thinking</span>
                </button>

                <button
                  type="button"
                  onClick={() => setUseRefine(!useRefine)}
                  className={`
                    flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] md:text-xs font-medium transition-all duration-200 hover:scale-105 active:scale-95 border h-[28px] md:h-[30px] transform-gpu
                    ${useRefine 
                      ? 'bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-500/30' 
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }
                  `}
                >
                  <MessageCircleQuestion className="w-3 h-3" />
                  <span>Refine</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={isAnalyzeDisabled}
                className={`
                  w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-1.5 rounded-lg font-medium transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg h-[34px] md:h-[36px] text-sm transform-gpu
                  ${isAnalyzeDisabled
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
                    : 'bg-cyan-600 text-white hover:bg-cyan-500 shadow-cyan-500/20 active:scale-95'
                  }
                `}
              >
                <span>Analyze</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
});