import React from 'react';
import { Settings, Globe, Moon, Sun, Shield, Brain, MessageCircleQuestion } from 'lucide-react';

interface SettingsViewProps {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  language: 'EN' | 'AR';
  setLanguage: (lang: 'EN' | 'AR') => void;
  webSearchEnabled: boolean;
  toggleWebSearch: () => void;
  deepThinkingEnabled: boolean;
  toggleDeepThinking: () => void;
  refineEnabled: boolean;
  toggleRefine: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = React.memo(({ 
  theme, toggleTheme, 
  language, setLanguage,
  webSearchEnabled, toggleWebSearch,
  deepThinkingEnabled, toggleDeepThinking,
  refineEnabled, toggleRefine
}) => {
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8 animate-in fade-in duration-500">
       <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 md:mb-8 flex items-center">
        <Settings className="w-6 h-6 mr-3 text-cyan-600 dark:text-cyan-500" />
        Platform Settings
      </h2>

      <div className="space-y-6">
        {/* Section */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="px-4 md:px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <h3 className="font-semibold text-slate-700 dark:text-slate-200">Analysis Preferences</h3>
          </div>
          <div className="p-4 md:p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-medium block text-sm md:text-base">Default Analysis Mode</label>
                <p className="text-slate-500 text-xs md:text-sm">Preferred depth for new chats</p>
              </div>
              <select className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-300 text-sm focus:outline-none focus:border-cyan-500">
                <option>Strategic Analysis</option>
                <option>Quick Synthesis</option>
                <option>Future Scenarios</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-medium block text-sm md:text-base">Auto-Web Enrichment</label>
                <p className="text-slate-500 text-xs md:text-sm">Always include live data search</p>
              </div>
              <button 
                onClick={toggleWebSearch}
                className={`w-11 h-6 rounded-full relative transition-colors duration-200 flex-shrink-0 ${webSearchEnabled ? 'bg-cyan-500' : 'bg-slate-300 dark:bg-slate-800'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform duration-200 ${webSearchEnabled ? 'left-6' : 'left-1'}`}></div>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 pr-4">
                <Brain className="w-5 h-5 text-fuchsia-500 flex-shrink-0" />
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-medium block text-sm md:text-base">Enable Deep Thinking by default</label>
                  <p className="text-slate-500 text-xs md:text-sm">Show AI reasoning process for all queries</p>
                </div>
              </div>
              <button 
                onClick={toggleDeepThinking}
                className={`w-11 h-6 rounded-full relative transition-colors duration-200 flex-shrink-0 ${deepThinkingEnabled ? 'bg-fuchsia-500' : 'bg-slate-300 dark:bg-slate-800'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform duration-200 ${deepThinkingEnabled ? 'left-6' : 'left-1'}`}></div>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 pr-4">
                <MessageCircleQuestion className="w-5 h-5 text-teal-500 flex-shrink-0" />
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-medium block text-sm md:text-base">Enable question refinement</label>
                  <p className="text-slate-500 text-xs md:text-sm">AI will ask clarifying questions</p>
                </div>
              </div>
              <button 
                onClick={toggleRefine}
                className={`w-11 h-6 rounded-full relative transition-colors duration-200 flex-shrink-0 ${refineEnabled ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-800'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform duration-200 ${refineEnabled ? 'left-6' : 'left-1'}`}></div>
              </button>
            </div>
          </div>
        </div>

        {/* Section */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="px-4 md:px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <h3 className="font-semibold text-slate-700 dark:text-slate-200">Interface</h3>
          </div>
          <div className="p-4 md:p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Globe className="w-5 h-5 text-slate-400" />
                <span className="text-slate-700 dark:text-slate-300 text-sm md:text-base">Language</span>
              </div>
              <div className="flex bg-slate-100 dark:bg-slate-950 rounded-lg p-1 border border-slate-200 dark:border-slate-800">
                <button 
                  onClick={() => setLanguage('EN')}
                  className={`px-3 py-1 rounded text-sm transition-all ${language === 'EN' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 shadow-sm' : 'text-slate-500'}`}
                >
                  EN
                </button>
                <button 
                  onClick={() => setLanguage('AR')}
                  className={`px-3 py-1 rounded text-sm transition-all ${language === 'AR' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 shadow-sm' : 'text-slate-500'}`}
                >
                  AR
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {theme === 'dark' ? <Moon className="w-5 h-5 text-slate-400" /> : <Sun className="w-5 h-5 text-orange-400" />}
                <span className="text-slate-700 dark:text-slate-300 text-sm md:text-base">Theme</span>
              </div>
               <button 
                onClick={toggleTheme}
                className="text-sm font-medium text-cyan-600 dark:text-cyan-400 hover:underline"
              >
                Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
              </button>
            </div>
          </div>
        </div>

        {/* Section */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="px-4 md:px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <h3 className="font-semibold text-slate-700 dark:text-slate-200">Knowledge Base</h3>
          </div>
          <div className="p-4 md:p-6">
            <div className="flex items-start space-x-4">
              <Shield className="w-6 h-6 text-emerald-500 mt-1 flex-shrink-0" />
              <div>
                <p className="text-slate-700 dark:text-slate-300 font-medium text-sm md:text-base">Verified Sources Active</p>
                <p className="text-slate-500 text-xs md:text-sm mt-1">
                  Connected to 64 premium intelligence streams including Bloomberg Terminal, Stratfor, Oxford Economics, and internal geopolitical dossiers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});