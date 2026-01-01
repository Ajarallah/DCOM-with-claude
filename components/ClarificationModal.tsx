import React, { useState, useCallback } from 'react';
import { MessageCircleQuestion, X, Sparkles } from 'lucide-react';
import { ClarificationQuestion } from '../types';

interface ClarificationModalProps {
  originalQuestion: string;
  questions: ClarificationQuestion[];
  onConfirm: (refinedQuestion: string) => void;
  onSkip: () => void;
}

export const ClarificationModal: React.FC<ClarificationModalProps> = React.memo(({
  originalQuestion,
  questions,
  onConfirm,
  onSkip
}) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelect = useCallback((qId: string, option: string) => {
    setAnswers(prev => ({ ...prev, [qId]: option }));
  }, []);

  const handleContinue = useCallback(() => {
    setIsSubmitting(true);
    // Simulate refinement delay
    setTimeout(() => {
        // Construct a refined string based on answers
        let refinement = "";
        Object.entries(answers).forEach(([id, answer]) => {
            refinement += ` [Context: ${answer}]`;
        });
        onConfirm(`${originalQuestion}${refinement}`);
    }, 800);
  }, [answers, originalQuestion, onConfirm]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-slate-800 dark:to-slate-900 p-4 md:p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start flex-shrink-0">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-cyan-100 dark:bg-cyan-900/50 rounded-full hidden sm:block">
              <MessageCircleQuestion className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-slate-100">Let me clarify your question</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Help me understand a few details to provide better analysis.
              </p>
            </div>
          </div>
          <button onClick={onSkip} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all duration-200 hover:scale-110 active:scale-95 p-1 transform-gpu">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 space-y-6 overflow-y-auto">
          {questions.map((q) => (
            <div key={q.id} className="space-y-3">
              <h4 className="font-medium text-slate-800 dark:text-slate-200 text-sm md:text-base">{q.text}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {q.options.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleSelect(q.id, option)}
                    className={`
                      text-left px-4 py-3 rounded-lg border text-sm transition-all duration-200 flex items-center min-h-[50px] hover:translate-x-1 hover:shadow-md transform-gpu
                      ${answers[q.id] === option
                        ? 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-500 text-cyan-700 dark:text-cyan-300 shadow-sm ring-1 ring-cyan-500'
                        : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-cyan-300 dark:hover:border-slate-600'
                      }
                    `}
                  >
                    <span className={`w-4 h-4 rounded-full border mr-3 flex-shrink-0 flex items-center justify-center ${answers[q.id] === option ? 'border-cyan-500 bg-cyan-500' : 'border-slate-300 dark:border-slate-600'}`}>
                      {answers[q.id] === option && <span className="w-1.5 h-1.5 bg-white rounded-full"></span>}
                    </span>
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 md:p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col-reverse sm:flex-row justify-end gap-3 flex-shrink-0">
          <button 
            onClick={onSkip}
            className="px-5 py-3 md:py-2.5 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-all hover:underline w-full sm:w-auto text-center"
          >
            Skip All
          </button>
          <button 
            onClick={handleContinue}
            disabled={isSubmitting}
            className="px-6 py-3 md:py-2.5 text-sm font-medium bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg shadow-lg shadow-cyan-500/20 flex items-center justify-center transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:hover:scale-100 w-full sm:w-auto transform-gpu"
          >
            {isSubmitting ? (
               <>
                 <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                 Refining...
               </>
            ) : (
               <>
                 <Sparkles className="w-4 h-4 mr-2" />
                 Continue to Analysis
               </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
});