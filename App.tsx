import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Layout, History, Settings, LogOut, PlusCircle, UserCircle, Moon, Sun, BrainCircuit, Menu, X } from 'lucide-react';
import { AnalysisMode, AnalysisResponse, Message, ClarificationQuestion, ChatSession } from './types';
import { InputArea } from './components/InputArea';
import { ResponseBlock } from './components/ResponseBlock';
import { LoadingIndicator } from './components/LoadingIndicator';
import { ClarificationModal } from './components/ClarificationModal';
import { generateAnalysisStream, generateClarificationQuestions } from './services/mockService';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';

type View = 'chat' | 'history' | 'settings';

function App() {
  const [currentView, setCurrentView] = useState<View>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStreamingMessageId, setCurrentStreamingMessageId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return (saved === 'dark' || saved === 'light') ? saved : 'light';
    }
    return 'light';
  });

  const [language, setLanguage] = useState<'EN' | 'AR'>('EN');
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [deepThinkingEnabled, setDeepThinkingEnabled] = useState(false);
  const [refineEnabled, setRefineEnabled] = useState(false);
  
  // Clarification Modal State
  const [showClarification, setShowClarification] = useState(false);
  const [pendingQuery, setPendingQuery] = useState<{text: string, mode: AnalysisMode, web: boolean, deep: boolean} | null>(null);
  const [clarificationQuestions, setClarificationQuestions] = useState<ClarificationQuestion[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(0);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Smart scroll logic: Only scroll when a NEW message is added
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      prevMessagesLengthRef.current = messages.length;
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }, [messages.length]);

  // Save chat to history logic wrapped in useCallback but triggered by effect
  const saveSessionToHistory = useCallback((msgs: Message[]) => {
    const sessionId = msgs[0]?.id; // Use first message ID as session ID
    if (!sessionId) return;

    const session: ChatSession = {
      id: sessionId,
      title: (msgs[0].content as string).substring(0, 50) + "...",
      preview: "Analysis: " + (msgs[0].content as string).substring(0, 100),
      timestamp: Date.now(),
      messages: msgs
    };

    try {
      const existing = localStorage.getItem('chat_history');
      let history: ChatSession[] = existing ? JSON.parse(existing) : [];
      // Update existing or add new
      const index = history.findIndex(h => h.id === sessionId);
      if (index >= 0) {
        history[index] = session;
      } else {
        history.unshift(session);
      }
      localStorage.setItem('chat_history', JSON.stringify(history));
    } catch (e) {
      console.error("Save history error", e);
    }
  }, []);

  // Save chat to history effect
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === 'ai') {
        saveSessionToHistory(messages);
      }
    }
  }, [messages, isLoading, saveSessionToHistory]);

  const executeAnalysis = useCallback(async (text: string, mode: AnalysisMode, useWeb: boolean, useDeepThinking: boolean) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
      mode
    };
    
    const aiMsgId = (Date.now() + 1).toString();
    const aiMsgPlaceholder: Message = {
        id: aiMsgId,
        role: 'ai',
        content: { sections: [], sources: [], thinkingProcess: [] },
        timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg, aiMsgPlaceholder]);
    setIsLoading(true);
    setCurrentStreamingMessageId(aiMsgId);

    try {
      await generateAnalysisStream(
        text, 
        useDeepThinking, 
        mode, 
        useWeb, 
        (partialResponse) => {
           setMessages(prev => prev.map(msg => 
             msg.id === aiMsgId 
             ? { ...msg, content: partialResponse } 
             : msg
           ));
        }
      );
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setIsLoading(false);
      setCurrentStreamingMessageId(null);
    }
  }, []);

  const handleSend = useCallback(async (text: string, mode: AnalysisMode, useWeb: boolean, useDeepThinking: boolean, refine: boolean) => {
    setRefineEnabled(refine); 
    setDeepThinkingEnabled(useDeepThinking);

    // Only show clarification if explicitly enabled
    if (refine && text.length < 150) {
      setPendingQuery({ text, mode, web: useWeb, deep: useDeepThinking });
      setIsLoading(true);
      const questions = await generateClarificationQuestions(text);
      setIsLoading(false);
      
      if (questions.length > 0) {
        setClarificationQuestions(questions);
        setShowClarification(true);
        return;
      }
    }
    executeAnalysis(text, mode, useWeb, useDeepThinking);
  }, [executeAnalysis]);

  const handleClarificationConfirm = useCallback((refinedQuestion: string) => {
    setShowClarification(false);
    if (pendingQuery) {
      executeAnalysis(refinedQuestion, pendingQuery.mode, pendingQuery.web, pendingQuery.deep);
      setPendingQuery(null);
    }
  }, [pendingQuery, executeAnalysis]);

  const handleClarificationSkip = useCallback(() => {
    setShowClarification(false);
    if (pendingQuery) {
      executeAnalysis(pendingQuery.text, pendingQuery.mode, pendingQuery.web, pendingQuery.deep);
      setPendingQuery(null);
    }
  }, [pendingQuery, executeAnalysis]);

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setCurrentView('chat');
    setIsSidebarOpen(false);
  }, []);

  const handleViewChange = useCallback((view: View) => {
    setCurrentView(view);
    setIsSidebarOpen(false);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  const toggleWebSearch = useCallback(() => setWebSearchEnabled(prev => !prev), []);
  const toggleDeepThinking = useCallback(() => setDeepThinkingEnabled(prev => !prev), []);
  const toggleRefine = useCallback(() => setRefineEnabled(prev => !prev), []);

  const handleHistorySelect = useCallback((sessionId: string) => {
    try {
      const existing = localStorage.getItem('chat_history');
      if (existing) {
        const history: ChatSession[] = JSON.parse(existing);
        const session = history.find(s => s.id === sessionId);
        if (session) {
          setMessages(session.messages);
          setCurrentView('chat');
          setIsSidebarOpen(false);
        }
      }
    } catch (e) {
      console.error("Load session error", e);
    }
  }, []);

  const handleSuggestionClick = useCallback((text: string, mode: AnalysisMode) => {
    handleSend(text, mode, false, false, false);
  }, [handleSend]);

  // Determine if we should show the generic loading indicator
  const showGenericLoader = isLoading && (!deepThinkingEnabled || (messages.length > 0 && messages[messages.length-1].role === 'ai' && !(messages[messages.length-1].content as AnalysisResponse).thinkingProcess?.length));

  return (
    <div className="flex h-screen font-sans selection:bg-cyan-500/30 overflow-hidden">
      
      {/* Clarification Modal */}
      {showClarification && pendingQuery && (
        <ClarificationModal 
          originalQuestion={pendingQuery.text}
          questions={clarificationQuestions}
          onConfirm={handleClarificationConfirm}
          onSkip={handleClarificationSkip}
        />
      )}

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 md:hidden will-change-opacity transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 md:w-20 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 
        transform transition-transform duration-300 ease-in-out md:translate-x-0 will-change-transform
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        flex flex-col items-center py-6 shadow-xl md:shadow-none
      `}>
        {/* Mobile Close Button */}
        <button 
          onClick={() => setIsSidebarOpen(false)}
          className="absolute top-4 right-4 md:hidden p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="mb-8 p-2 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-lg shadow-[0_0_15px_-3px_rgba(6,182,212,0.5)] flex-shrink-0 hover:scale-105 transition-transform duration-300">
          <BrainCircuit className="w-6 h-6 text-white" />
        </div>
        
        <nav className="flex-1 flex flex-col space-y-6 w-full px-4 md:px-0 md:items-center overflow-y-auto">
          <button 
            onClick={handleNewChat}
            className="flex items-center md:justify-center space-x-3 md:space-x-0 p-3 rounded-xl bg-slate-200 dark:bg-slate-800/50 hover:bg-cyan-100 dark:hover:bg-cyan-500/20 text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all duration-200 hover:scale-105 active:scale-95 w-full md:w-auto transform-gpu" 
            title="New Analysis"
          >
            <PlusCircle className="w-6 h-6 flex-shrink-0" />
            <span className="md:hidden font-medium">New Analysis</span>
          </button>
          
          <button 
            onClick={() => handleViewChange('history')}
            className={`flex items-center md:justify-center space-x-3 md:space-x-0 p-3 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 w-full md:w-auto transform-gpu ${currentView === 'history' ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
          >
            <History className="w-6 h-6 flex-shrink-0" />
            <span className="md:hidden font-medium">History</span>
          </button>

          <button 
            onClick={() => handleViewChange('settings')}
            className={`flex items-center md:justify-center space-x-3 md:space-x-0 p-3 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 w-full md:w-auto transform-gpu ${currentView === 'settings' ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
          >
            <Settings className="w-6 h-6 flex-shrink-0" />
            <span className="md:hidden font-medium">Settings</span>
          </button>
        </nav>

        <button className="mt-auto p-3 text-slate-400 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-all duration-200 hover:scale-105 active:scale-95 flex items-center md:justify-center space-x-3 md:space-x-0 w-full md:w-auto px-4 md:px-0 transform-gpu">
          <LogOut className="w-6 h-6 flex-shrink-0" />
          <span className="md:hidden font-medium">Log Out</span>
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300 w-full">
        
        {/* Header */}
        <header className="h-16 flex-shrink-0 border-b border-slate-200 dark:border-slate-800/50 flex items-center justify-between px-4 md:px-6 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-sm z-10 sticky top-0 transition-colors duration-300">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors hover:scale-105 active:scale-95"
            >
              <Menu className="w-6 h-6" />
            </button>
            <BrainCircuit className="w-6 h-6 text-black dark:text-white hidden sm:block" />
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-800 dark:text-slate-100 leading-none">
                DCOM
              </h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-medium mt-0.5 hidden sm:block">Deep Contextual Output Model</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Theme Toggle in Header */}
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all duration-200 hover:scale-110 active:scale-95 transform-gpu"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button 
              onClick={() => setLanguage(prev => prev === 'EN' ? 'AR' : 'EN')}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-all duration-200 hover:scale-105 active:scale-95 px-2 py-1 transform-gpu"
            >
              {language === 'EN' ? 'EN' : 'AR'} | {language === 'EN' ? 'AR' : 'EN'}
            </button>
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center cursor-pointer hover:border-cyan-500 transition-all duration-200 hover:scale-105 active:scale-95 transform-gpu">
               <UserCircle className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            </div>
          </div>
        </header>

        {/* View Switcher */}
        <div className="flex-1 overflow-y-auto relative scroll-smooth" ref={messagesContainerRef}>
          {currentView === 'history' && <HistoryView onSelectSession={handleHistorySelect} />}
          {currentView === 'settings' && (
            <SettingsView 
              theme={theme} 
              toggleTheme={toggleTheme}
              language={language}
              setLanguage={setLanguage}
              webSearchEnabled={webSearchEnabled}
              toggleWebSearch={toggleWebSearch}
              deepThinkingEnabled={deepThinkingEnabled}
              toggleDeepThinking={toggleDeepThinking}
              refineEnabled={refineEnabled}
              toggleRefine={toggleRefine}
            />
          )}
          
          {currentView === 'chat' && (
            <div className="min-h-full flex flex-col">
              
              {/* Empty State / Welcome */}
              {messages.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 text-center animate-in fade-in duration-700">
                  <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-cyan-500/10 to-purple-600/10 dark:from-cyan-900/20 dark:to-purple-900/20 rounded-3xl flex items-center justify-center mb-6 md:mb-8 border border-slate-200 dark:border-slate-800 rotate-3 transition-all hover:rotate-0 hover:scale-105 duration-500 shadow-lg shadow-cyan-500/5 transform-gpu">
                    <BrainCircuit className="w-10 h-10 md:w-12 md:h-12 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-light text-slate-800 dark:text-slate-200 mb-3 tracking-tight">
                    Welcome to <span className="font-bold text-black dark:text-white">DCOM</span>
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed text-sm px-4">
                    Advanced reasoning engine for complex economic, financial, and geopolitical analysis.
                    Synthesizing 60+ intelligence streams.
                  </p>
                  
                  {/* Suggestion Chips */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8 md:mt-12 w-full max-w-2xl px-4">
                    <button 
                      onClick={() => handleSuggestionClick("Will the US dollar lose its reserve currency status in the next 20 years?", "strategic")}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-cyan-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-md text-left group shadow-sm transform-gpu"
                    >
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-cyan-600 dark:group-hover:text-cyan-400">Future of USD Hegemony</span>
                      <p className="text-xs text-slate-500 mt-1">Timeline analysis of reserve status & crypto impact</p>
                    </button>
                    <button 
                      onClick={() => handleSuggestionClick("Semiconductor Supply Chain vulnerabilities in Taiwan-US-China triangle", "strategic")}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-cyan-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-md text-left group shadow-sm transform-gpu"
                    >
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-cyan-600 dark:group-hover:text-cyan-400">Semiconductor Supply Chain</span>
                      <p className="text-xs text-slate-500 mt-1">Vulnerabilities in Taiwan-US-China triangle</p>
                    </button>
                  </div>
                </div>
              )}

              {/* Chat Stream */}
              <div className="flex-1 w-full max-w-5xl mx-auto px-2 md:px-4 py-8 space-y-6 md:space-y-8">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    
                    {/* Message Header */}
                    <div className="flex items-center space-x-2 mb-2 px-1">
                      {msg.role === 'ai' ? (
                        <>
                          <div className="w-5 h-5 rounded bg-cyan-100 dark:bg-cyan-900/50 border border-cyan-200 dark:border-cyan-500/30 flex items-center justify-center">
                            <BrainCircuit className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                          </div>
                          <span className="text-xs font-bold text-cyan-600 dark:text-cyan-500 uppercase tracking-wider">DCOM Core</span>
                        </>
                      ) : (
                        <>
                          <span className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">You</span>
                        </>
                      )}
                    </div>

                    {/* Content */}
                    {msg.role === 'user' ? (
                      <div className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-4 py-3 md:px-5 md:py-3 rounded-2xl rounded-tr-none max-w-full md:max-w-xl text-base md:text-lg border border-slate-200 dark:border-slate-700 shadow-sm break-words">
                        {msg.content as string}
                      </div>
                    ) : (
                      // Render structured AI response
                      <ResponseBlock 
                        sections={(msg.content as AnalysisResponse).sections} 
                        sources={(msg.content as AnalysisResponse).sources} 
                        thinkingProcess={(msg.content as AnalysisResponse).thinkingProcess}
                        isThinkingComplete={(msg.content as AnalysisResponse).isThinkingComplete}
                      />
                    )}
                  </div>
                ))}
                
                {showGenericLoader && (
                  <div className="w-full max-w-4xl">
                     <LoadingIndicator />
                  </div>
                )}
                
                <div ref={messagesEndRef} className="h-4" />
              </div>
            </div>
          )}
        </div>

        {/* Footer Input - Only show in chat view */}
        {currentView === 'chat' && (
          <div className="z-20 w-full bg-slate-50 dark:bg-slate-950">
             <InputArea 
               onSend={handleSend} 
               disabled={isLoading} 
               defaultDeepThinking={deepThinkingEnabled}
               defaultRefine={refineEnabled}
             />
          </div>
        )}

      </main>
    </div>
  );
}

export default App;