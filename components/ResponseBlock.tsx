import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { AnalysisSection, Source } from '../types';
import { 
  ShieldAlert, 
  BrainCircuit, 
  EyeOff, 
  GitCompare, 
  Lightbulb, 
  TrendingUp, 
  HelpCircle, 
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  BookOpen,
  Brain,
  CheckCircle2,
  Minus,
  Plus,
  Loader2
} from 'lucide-react';

interface SectionConfig {
  icon: React.ElementType;
  color: string;
  border: string;
  bg: string;
  glow?: boolean;
}

const TYPE_CONFIG: Record<AnalysisSection['type'], SectionConfig> = {
  fact: { icon: ShieldAlert, color: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-900/50', bg: 'bg-blue-50 dark:bg-blue-950/20' },
  motivation: { icon: BrainCircuit, color: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-900/50', bg: 'bg-purple-50 dark:bg-purple-950/20' },
  blindspot: { icon: EyeOff, color: 'text-slate-600 dark:text-slate-400', border: 'border-slate-200 dark:border-slate-700/50', bg: 'bg-slate-100 dark:bg-slate-900/40' },
  contradiction: { icon: GitCompare, color: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-900/50', bg: 'bg-orange-50 dark:bg-orange-950/20' },
  synthesis: { icon: Lightbulb, color: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-200 dark:border-cyan-500/30', bg: 'bg-cyan-50 dark:bg-cyan-950/30', glow: true },
  scenario: { icon: TrendingUp, color: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-900/50', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
  question: { icon: HelpCircle, color: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-900/50', bg: 'bg-indigo-50 dark:bg-indigo-950/20' },
  blackswan: { icon: AlertTriangle, color: 'text-red-600 dark:text-red-500', border: 'border-red-200 dark:border-red-900/50', bg: 'bg-red-50 dark:bg-red-950/20' },
};

// --- Custom Markdown Renderer (Memoized) ---
const InlineStyleRenderer = React.memo(({ text, sources }: { text: string, sources: Source[] }) => {
  const parts = useMemo(() => {
    const boldParts = text.split(/(\*\*.*?\*\*)/g);
    return boldParts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} className="font-semibold text-slate-900 dark:text-slate-100">{part.slice(2, -2)}</strong>;
      }
      const subParts = part.split(/(\[\d+\]|\[🔍\d+\])/g);
      return (
        <span key={idx}>
          {subParts.map((subPart, subIdx) => {
            const match = subPart.match(/\[(\d+|🔍\d+)\]/);
            if (match) {
              const idStr = match[1];
              const isSearch = idStr.startsWith('🔍');
              const cleanId = idStr.replace('🔍', '');
              const source = sources.find(s => s.id === cleanId);
              return (
                <sup key={subIdx} className="mx-0.5">
                  <button 
                    className={`text-[10px] font-bold hover:underline px-1 py-0.5 rounded cursor-pointer transition-transform duration-200 hover:scale-125 inline-block ${isSearch ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50' : 'text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-900/50'}`}
                    title={source ? `${source.title} (${source.publisher})` : 'Source'}
                    onClick={(e) => {
                      e.stopPropagation();
                      const el = document.getElementById(`source-${cleanId}`);
                      const sourcesHeader = document.getElementById('sources-header');
                      if (sourcesHeader) {
                          sourcesHeader.click();
                          setTimeout(() => {
                             el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                             el?.classList.add('ring-2', 'ring-cyan-500');
                             setTimeout(() => el?.classList.remove('ring-2', 'ring-cyan-500'), 2000);
                          }, 100);
                      }
                    }}
                  >
                    {idStr}
                  </button>
                </sup>
              );
            }
            return subPart;
          })}
        </span>
      );
    });
  }, [text, sources]);

  return <>{parts}</>;
});

const RenderMarkdown: React.FC<{ content: string, sources: Source[] }> = React.memo(({ content, sources }) => {
  const elements = useMemo(() => {
    const lines = content.split('\n');
    const els: React.ReactNode[] = [];
    
    let currentListType: 'ul' | 'ol' | null = null;
    let currentListItems: React.ReactNode[] = [];

    const flushList = (keyPrefix: string) => {
      if (currentListType === 'ul') {
        els.push(
          <ul key={`${keyPrefix}-ul`} className="list-disc pl-5 mb-3 space-y-2 md:space-y-1 text-slate-700 dark:text-slate-300">
            {currentListItems}
          </ul>
        );
      } else if (currentListType === 'ol') {
        els.push(
          <ol key={`${keyPrefix}-ol`} className="list-decimal pl-5 mb-3 space-y-2 md:space-y-1 text-slate-700 dark:text-slate-300">
            {currentListItems}
          </ol>
        );
      }
      currentListType = null;
      currentListItems = [];
    };

    lines.forEach((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) {
        flushList(`br-${i}`);
        return;
      }
      const ulMatch = line.match(/^[\*\-]\s+(.*)/);
      const olMatch = line.match(/^(\d+)\.\s+(.*)/);
      const hMatch = line.match(/^(#{1,6})\s+(.*)/);

      if (ulMatch) {
        if (currentListType === 'ol') flushList(`switch-${i}`);
        currentListType = 'ul';
        currentListItems.push(<li key={`li-${i}`}><InlineStyleRenderer text={ulMatch[1]} sources={sources} /></li>);
      } else if (olMatch) {
        if (currentListType === 'ul') flushList(`switch-${i}`);
        currentListType = 'ol';
        currentListItems.push(<li key={`li-${i}`} value={olMatch[1]}><InlineStyleRenderer text={olMatch[2]} sources={sources} /></li>);
      } else {
        flushList(`text-${i}`);
        if (hMatch) {
          const level = hMatch[1].length;
          const className = level <= 3 ? "text-lg font-bold mt-4 mb-2 text-slate-800 dark:text-slate-100" : "font-bold mt-3 mb-1 text-slate-800 dark:text-slate-200";
          els.push(<div key={`h-${i}`} className={className}><InlineStyleRenderer text={hMatch[2]} sources={sources} /></div>);
        } else {
          els.push(<p key={`p-${i}`} className="mb-3 leading-relaxed text-slate-700 dark:text-slate-300"><InlineStyleRenderer text={line} sources={sources} /></p>);
        }
      }
    });
    flushList('final');
    return els;
  }, [content, sources]);

  return <>{elements}</>;
});

// --- Thinking Block Component (Memoized) ---

const ThinkingBlock: React.FC<{ process: string[], isComplete: boolean }> = React.memo(({ process, isComplete }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  
  const toggleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);
  
  useEffect(() => {
    if (!isCollapsed && !isComplete) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [process.length, isCollapsed, isComplete]); // Depend on length, not array reference if possible

  return (
    <div className={`
      rounded-lg border overflow-hidden mb-6 md:mb-8 transition-all duration-500 shadow-sm will-change-transform
      ${isComplete 
        ? 'border-fuchsia-200 dark:border-fuchsia-900/30 bg-white dark:bg-slate-900' 
        : 'border-fuchsia-400 dark:border-fuchsia-700 bg-fuchsia-50 dark:bg-fuchsia-950/20 shadow-[0_0_15px_-3px_rgba(217,70,239,0.2)]'
      }
    `}>
      {/* Header */}
      <div 
        onClick={toggleCollapse}
        className={`
          px-4 py-3 md:px-5 flex items-center justify-between border-b transition-colors cursor-pointer
          ${isComplete 
             ? 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800' 
             : 'bg-fuchsia-100/50 dark:bg-fuchsia-900/30 border-fuchsia-200 dark:border-fuchsia-800/50'
          }
        `}
      >
        <div className="flex items-center space-x-2.5">
          {isComplete ? (
             <Brain className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
          ) : (
             <Brain className="w-5 h-5 text-fuchsia-600 dark:text-fuchsia-400 animate-pulse flex-shrink-0" />
          )}
          
          <span className={`font-bold tracking-wide text-xs md:text-sm uppercase ${isComplete ? 'text-slate-600 dark:text-slate-400' : 'text-fuchsia-700 dark:text-fuchsia-400'}`}>
            {isComplete ? 'Reasoning Complete' : 'AI Reasoning'}
          </span>
          
          {isComplete && <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-1 flex-shrink-0" />}
        </div>

        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded transition-colors text-slate-400`}>
            {isCollapsed ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {/* Content */}
      {(!isCollapsed) && (
        <div className="px-4 py-4 md:px-6 md:py-5 max-h-[500px] overflow-y-auto font-mono text-sm leading-relaxed text-slate-700 dark:text-slate-300 bg-white/50 dark:bg-transparent animate-in slide-in-from-top-2 duration-300">
          {/* If empty state (initial) */}
          {process.length === 0 && !isComplete && (
             <div className="text-fuchsia-400/70 italic animate-pulse">Initializing reasoning protocols...</div>
          )}

          {process.map((paragraph, i) => (
            <div key={i} className="mb-4 animate-in fade-in slide-in-from-left-2 duration-500">
               <p className="whitespace-pre-wrap break-words">{paragraph}</p>
               {/* Separator dots */}
               {i < process.length - 1 && (
                 <div className="flex items-center space-x-1 my-3 opacity-30 pl-1">
                   <span className="w-1 h-1 rounded-full bg-slate-400 dark:bg-slate-500"></span>
                   <span className="w-1 h-1 rounded-full bg-slate-400 dark:bg-slate-500"></span>
                   <span className="w-1 h-1 rounded-full bg-slate-400 dark:bg-slate-500"></span>
                 </div>
               )}
            </div>
          ))}

          {/* Active Thinking Indicator */}
          {!isComplete && process.length > 0 && (
            <div className="flex items-center space-x-2 mt-6 text-fuchsia-500 dark:text-fuchsia-400 animate-in fade-in duration-300 pl-1">
              <span className="text-xs font-medium uppercase tracking-widest opacity-80">Thinking</span>
              <div className="flex space-x-1">
                 <span className="w-1.5 h-1.5 rounded-full bg-current animate-[bounce_1s_infinite_0ms]"></span>
                 <span className="w-1.5 h-1.5 rounded-full bg-current animate-[bounce_1s_infinite_200ms]"></span>
                 <span className="w-1.5 h-1.5 rounded-full bg-current animate-[bounce_1s_infinite_400ms]"></span>
              </div>
            </div>
          )}
          
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}, (prev, next) => {
  return prev.isComplete === next.isComplete && prev.process.length === next.process.length && prev.process[prev.process.length-1] === next.process[next.process.length-1];
});

// --- Section Card Component (Memoized) ---

const SectionCard: React.FC<{ 
  section: AnalysisSection; 
  sources: Source[]; 
  isOpen: boolean; 
  onToggle: () => void 
}> = React.memo(({ section, sources, isOpen, onToggle }) => {
  const config = TYPE_CONFIG[section.type];
  const Icon = config.icon;
  
  // Feedback state
  const [feedbackMode, setFeedbackMode] = useState<'idle' | 'up' | 'down' | 'submitted'>('idle');
  const [feedbackText, setFeedbackText] = useState('');
  
  const handleFeedbackClick = useCallback((e: React.MouseEvent, type: 'up' | 'down') => {
    e.stopPropagation();
    setFeedbackMode(prev => prev === type ? 'idle' : type);
    setFeedbackText('');
  }, []);

  const submitFeedback = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setFeedbackMode('submitted');
    setTimeout(() => {
      setFeedbackMode('idle');
      setFeedbackText('');
    }, 2500);
  }, []);
  
  const skipFeedback = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setFeedbackMode('idle');
    setFeedbackText('');
  }, []);

  return (
    <div className={`
      rounded-xl border transition-all duration-300 overflow-hidden hover:scale-[1.01] active:scale-[0.995] will-change-transform
      ${config.bg} ${config.border}
      ${isOpen ? 'shadow-md' : 'shadow-sm hover:shadow-md'}
    `}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left focus:outline-none"
      >
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg bg-white/60 dark:bg-black/20 ${config.color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <h3 className={`font-semibold text-base md:text-lg text-slate-800 dark:text-slate-100 ${config.glow ? 'drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : ''}`}>
            {section.title}
          </h3>
        </div>
        
        {/* Feedback Buttons */}
        <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0 ml-2">
          <div className="flex items-center space-x-1 border-r border-slate-300 dark:border-slate-700/50 pr-2 md:pr-4" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={(e) => handleFeedbackClick(e, 'up')}
              className={`p-2 rounded-md transition-all duration-200 hover:scale-110 active:scale-95 transform-gpu ${feedbackMode === 'up' ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'text-slate-400 hover:text-green-500 hover:bg-slate-800/50'}`}
            >
              <ThumbsUp className="w-4 h-4 md:w-3.5 md:h-3.5" />
            </button>
            <button 
              onClick={(e) => handleFeedbackClick(e, 'down')}
              className={`p-2 rounded-md transition-all duration-200 hover:scale-110 active:scale-95 transform-gpu ${feedbackMode === 'down' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : 'text-slate-400 hover:text-red-500 hover:bg-slate-800/50'}`}
            >
              <ThumbsDown className="w-4 h-4 md:w-3.5 md:h-3.5" />
            </button>
          </div>
          <div className={`transition-transform duration-300 text-slate-400 dark:text-slate-500 ${isOpen ? 'rotate-180' : ''}`}>
             <ChevronDown className="w-5 h-5" />
          </div>
        </div>
      </button>
      
      {/* Inline Feedback Form */}
      {(feedbackMode === 'up' || feedbackMode === 'down') && (
        <div 
          className="px-4 md:px-5 py-4 border-t border-slate-200 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/40 animate-in slide-in-from-top-2 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center mb-2">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
               {feedbackMode === 'up' ? '💬 What did you find helpful? (Optional)' : '💬 What could be improved? (Optional)'}
            </span>
          </div>
          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            className="w-full h-20 md:h-16 p-3 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-sm md:text-xs mb-3"
            placeholder="Type your feedback here..."
          />
          <div className="flex justify-end space-x-2">
             <button onClick={skipFeedback} className="px-3 py-2 md:py-1.5 text-sm md:text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:underline">
                Skip
             </button>
             <button onClick={submitFeedback} className="px-3 py-2 md:py-1.5 text-sm md:text-xs bg-cyan-600 hover:bg-cyan-500 text-white rounded-md shadow-sm transition-all duration-200 hover:scale-105 active:scale-95 transform-gpu">
                Submit Feedback
             </button>
          </div>
        </div>
      )}

      {/* Success Message */}
      {feedbackMode === 'submitted' && (
        <div className="px-5 py-2 border-t border-slate-200 dark:border-slate-800/50 bg-green-50/50 dark:bg-green-900/20 text-center animate-in fade-in duration-300">
          <span className="text-xs font-medium text-green-600 dark:text-green-400">✓ Thanks for your feedback!</span>
        </div>
      )}
      
      {isOpen && (
        <div className="px-4 pb-5 md:px-6 md:pb-6 pt-0 animate-in slide-in-from-top-2 duration-300 will-change-contents">
          <div className="h-px w-full bg-slate-200/50 dark:bg-slate-700/30 mb-4"></div>
          <div className="text-sm md:text-base leading-relaxed text-slate-700 dark:text-slate-300">
            <RenderMarkdown content={section.content} sources={sources} />
          </div>
        </div>
      )}
    </div>
  );
});

// --- Main Response Block (Memoized) ---

export const ResponseBlock: React.FC<{ 
  sections: AnalysisSection[], 
  sources: Source[], 
  thinkingProcess?: string[],
  isThinkingComplete?: boolean 
}> = React.memo(({ sections, sources, thinkingProcess, isThinkingComplete }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [allExpanded, setAllExpanded] = useState(false);
  const [isSourcesOpen, setIsSourcesOpen] = useState(false);

  // Load sources collapsed preference
  useEffect(() => {
    const saved = localStorage.getItem('dcom_sources_expanded');
    if (saved === 'true') {
      setIsSourcesOpen(true);
    }
  }, []);

  const toggleSources = useCallback(() => {
    setIsSourcesOpen(prev => {
      const newState = !prev;
      localStorage.setItem('dcom_sources_expanded', newState.toString());
      return newState;
    });
  }, []);

  const toggleSection = useCallback((id: string) => {
    setExpandedSections(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(id)) {
        newExpanded.delete(id);
      } else {
        newExpanded.add(id);
      }
      return newExpanded;
    });
  }, []);
  
  // Effect to sync allExpanded state (but avoid render loop)
  useEffect(() => {
      setAllExpanded(expandedSections.size === sections.length && sections.length > 0);
  }, [expandedSections.size, sections.length]);

  const toggleAll = useCallback(() => {
    setAllExpanded(prev => {
      const newState = !prev;
      if (newState) {
        setExpandedSections(new Set(sections.map(s => s.id)));
      } else {
        setExpandedSections(new Set());
      }
      return newState;
    });
  }, [sections]);

  return (
    <div className="space-y-4 md:space-y-6 w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
      
      {(thinkingProcess && (thinkingProcess.length > 0 || !isThinkingComplete)) && (
        <ThinkingBlock 
          process={thinkingProcess || []} 
          isComplete={!!isThinkingComplete}
        />
      )}

      {/* Post-Thinking Loading State */}
      {isThinkingComplete && sections.length === 0 && (
        <div className="flex items-center space-x-3 p-4 bg-slate-100 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800 max-w-fit animate-in fade-in duration-300">
          <Loader2 className="w-4 h-4 text-cyan-500 animate-spin" />
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Synthesizing answer...
          </span>
        </div>
      )}

      {sections.length > 0 && (
        <div className="flex justify-end animate-in fade-in duration-500 delay-300">
          <button 
            onClick={toggleAll}
            className="text-xs font-medium text-cyan-600 dark:text-cyan-400 hover:underline flex items-center p-2"
          >
            {allExpanded ? 'Collapse All' : 'Expand All'}
          </button>
        </div>
      )}

      <div className="space-y-3">
        {sections.map((section) => (
          <SectionCard 
            key={section.id} 
            section={section} 
            sources={sources} 
            isOpen={expandedSections.has(section.id)}
            onToggle={() => toggleSection(section.id)}
          />
        ))}
      </div>
      
      {/* Collapsible Sources Section */}
      {sources.length > 0 && sections.length > 0 && (
        <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button 
            id="sources-header"
            onClick={toggleSources}
            className="flex items-center justify-between w-full py-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition-colors px-2 -mx-2 group"
          >
            <div className="flex items-center text-sm font-semibold text-slate-700 dark:text-slate-300">
              <BookOpen className="w-4 h-4 mr-2" />
              <span>Sources Cited</span>
              <span className="ml-2 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs py-0.5 px-2 rounded-full group-hover:bg-slate-300 dark:group-hover:bg-slate-700 transition-colors">
                {sources.length}
              </span>
            </div>
            <div className={`transition-transform duration-200 text-slate-400 ${isSourcesOpen ? 'rotate-180' : ''}`}>
               <ChevronDown className="w-5 h-5" />
            </div>
          </button>

          {isSourcesOpen && (
            <div className="grid grid-cols-1 gap-2 mt-3 animate-in slide-in-from-top-2 duration-300 will-change-contents">
              {sources.map((source) => (
                <div 
                  id={`source-${source.id}`}
                  key={source.id} 
                  className="flex items-start text-xs text-slate-600 dark:text-slate-400 p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all duration-200 hover:translate-x-1"
                >
                  <span className={`font-mono mr-3 shrink-0 ${source.id.toString().startsWith('🔍') ? 'text-indigo-600 dark:text-indigo-400' : 'text-cyan-600 dark:text-cyan-500'}`}>[{source.id}]</span>
                  <div className="min-w-0">
                    <a href={source.url} target="_blank" rel="noopener noreferrer" className="font-medium hover:text-cyan-600 dark:hover:text-cyan-400 hover:underline transition-colors block break-all">
                      {source.title}
                    </a>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-slate-400 dark:text-slate-600">
                       <span>{source.publisher}</span>
                       <span>•</span>
                       <span>{source.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});