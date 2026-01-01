export type AnalysisMode = 'strategic' | 'quick' | 'future' | 'compare';

export interface Source {
  id: string;
  title: string;
  url?: string;
  publisher: string;
  date: string;
}

export interface AnalysisSection {
  id: string;
  title: string;
  type: 'fact' | 'motivation' | 'blindspot' | 'contradiction' | 'synthesis' | 'scenario' | 'question' | 'blackswan';
  content: string;
  isOpen?: boolean;
}

export interface AnalysisResponse {
  sections: AnalysisSection[];
  sources: Source[];
  thinkingProcess?: string[]; // Array of paragraphs
  isThinkingComplete?: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string | AnalysisResponse;
  timestamp: number;
  mode?: AnalysisMode;
}

export interface ChatSession {
  id: string;
  title: string;
  preview: string;
  timestamp: number;
  messages: Message[];
}

export interface UserSettings {
  language: 'EN' | 'AR';
  defaultMode: AnalysisMode;
  webSearchEnabled: boolean;
  deepThinkingEnabled: boolean;
  clarificationEnabled: boolean; 
  refineEnabled: boolean; 
  theme: 'dark' | 'light';
}

export interface KnowledgeItem {
  metadata: {
    unique_id: string;
    title: string;
    author: string;
    year: number | null;
    source_type: string;
    knowledge_domain: string;
  };
  core_theses: string[];
  strategic_insights: string[];
  contradictions: string[];
  key_metrics: string[];
  one_powerful_quote: string;
  distillation_250: string;
}

export interface ClarificationQuestion {
  id: string;
  text: string;
  options: string[];
}