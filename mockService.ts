import { GoogleGenAI } from "@google/genai";
import { KNOWLEDGE_BASE } from '../constants';
import { AnalysisResponse, AnalysisSection, Source, AnalysisMode, ClarificationQuestion } from '../types';

// Initialize the API client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Parses the raw markdown text from the model into structured AnalysisSections.
 */
const parseSections = (text: string): AnalysisSection[] => {
  const sections: AnalysisSection[] = [];
  const regex = /##\s+(.*?)\n([\s\S]*?)(?=##|$)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const title = match[1].trim();
    const content = match[2].trim();
    let type: AnalysisSection['type'] = 'fact';

    if (title.toLowerCase().includes('synthesis')) type = 'synthesis';
    else if (title.toLowerCase().includes('fact')) type = 'fact';
    else if (title.toLowerCase().includes('insight')) type = 'motivation';
    else if (title.toLowerCase().includes('contradiction') || title.toLowerCase().includes('risk')) type = 'contradiction';
    else if (title.toLowerCase().includes('metric')) type = 'fact';
    else if (title.toLowerCase().includes('scenario')) type = 'scenario';
    else if (title.toLowerCase().includes('question')) type = 'question';
    else if (title.toLowerCase().includes('blind')) type = 'blindspot';
    else if (title.toLowerCase().includes('black swan')) type = 'blackswan';

    sections.push({
      id: title.toLowerCase().replace(/\s+/g, '-'),
      title: title,
      type: type,
      content: content,
      isOpen: false 
    });
  }

  return sections;
};

const parseGroundingSources = (groundingMetadata: any): Source[] => {
  if (!groundingMetadata || !groundingMetadata.groundingChunks) return [];
  const sources: Source[] = [];
  groundingMetadata.groundingChunks.forEach((chunk: any, index: number) => {
    if (chunk.web && chunk.web.uri) {
      sources.push({
        id: `🔍${index + 1}`,
        title: chunk.web.title || "Web Source",
        url: chunk.web.uri,
        publisher: new URL(chunk.web.uri).hostname.replace('www.', ''),
        date: "Recent"
      });
    }
  });
  return sources;
};

export const generateClarificationQuestions = async (query: string): Promise<ClarificationQuestion[]> => {
  try {
    const modelId = 'gemini-3-flash-preview'; 
    const response = await ai.models.generateContent({
      model: modelId,
      contents: [{ 
        role: 'user', 
        parts: [{ 
          text: `You are an expert analyst helper. The user asked: "${query}". 
          Generate 3 clarifying questions to narrow down the scope for a deep strategic analysis. 
          Return ONLY a JSON array with this structure: 
          [{"id": "q1", "text": "Question text?", "options": ["Option 1", "Option 2", "Option 3"]}]
          Do not wrap in markdown code blocks.` 
        }] 
      }],
      config: { responseMimeType: 'application/json' }
    });

    if (response.text) {
      return JSON.parse(response.text.trim());
    }
    return [];
  } catch (e) {
    console.error("Failed to generate clarification", e);
    return [];
  }
};

/**
 * Stage 1: Generate Internal Monologue (Thinking)
 */
const generateThinkingStream = async (
  query: string,
  onThoughtUpdate: (paragraphs: string[]) => void
): Promise<string> => {
  const thinkingSystemPrompt = `
    You are an AI assistant engaging in "Deep Thinking" mode. 
    Your goal is to show your INTERNAL REASONING PROCESS before answering the user's question.
    
    The user asked: "${query}"

    INSTRUCTIONS:
    1. Write your thoughts as a natural internal monologue.
    2. Be casual, exploratory, and conversational (e.g., "Hmm, let me see...", "Wait, I should check...", "This implies that...").
    3. Break down the problem step-by-step.
    4. Consider different angles, historical precedents, and data points.
    5. Do NOT provide the final structured answer yet. Just show the journey of getting there.
    6. Write 3-5 short paragraphs.
  `;

  // UPDATED: Ensure Pro model is used for deep reasoning
  const thinkingModelId = 'gemini-3-pro-preview'; 

  let thinkingParagraphs: string[] = [];
  let buffer = "";

  try {
    const streamResult = await ai.models.generateContentStream({
      model: thinkingModelId,
      contents: [{ role: 'user', parts: [{ text: thinkingSystemPrompt }] }],
    });

    for await (const chunk of streamResult) {
      const text = chunk.text;
      if (text) {
        for (const char of text) {
          buffer += char;
          
          if (buffer.endsWith('\n\n') || (buffer.length > 200 && buffer.endsWith('. '))) {
             thinkingParagraphs.push(buffer.trim());
             buffer = "";
             onThoughtUpdate([...thinkingParagraphs]);
             await new Promise(resolve => setTimeout(resolve, 800));
          }
        }
      }
    }
    // Flush remaining buffer
    if (buffer.trim()) {
      thinkingParagraphs.push(buffer.trim());
      onThoughtUpdate([...thinkingParagraphs]);
    }

    return thinkingParagraphs.join('\n\n');

  } catch (e) {
    console.error("Thinking generation failed", e);
    return "Analyzing query directly...";
  }
};

/**
 * Stage 2: Generate Structured Analysis
 */
const generateStructuredAnalysis = async (
  query: string,
  thinkingContext: string,
  mode: AnalysisMode,
  useWeb: boolean,
  onAnalysisUpdate: (text: string, sources: Source[]) => void
) => {
  // UPDATED: Ensure Pro model is used for deep analysis
  const modelId = 'gemini-3-pro-preview'; 
  
  const systemInstruction = `
You are StratIntel AI, an elite strategic intelligence engine.
Your goal is to provide deep, multi-dimensional analysis based on the user's query and your internal reasoning.

USER QUERY: "${query}"

YOUR INTERNAL REASONING (Context):
"${thinkingContext}"

KNOWLEDGE BASE SUMMARY:
${KNOWLEDGE_BASE.map(k => `- ${k.metadata.title}: ${k.distillation_250}`).join('\n')}

INSTRUCTIONS:
1. Provide the final structured analysis.
2. If "Search" is enabled, integrate live web data and cite it.
3. Format output with strict Markdown headers:
   ## Executive Synthesis
   ## Core Theses & Hard Facts
   ## Strategic Insights
   ## Contradictions & Risks
   ## Key Metrics
   ## Future Scenarios
   ## Strategic Questions

4. Style: Professional, objective, dense.
5. Mode: ${mode.toUpperCase()}.
`;

  const config: any = { systemInstruction };
  if (useWeb) {
    config.tools = [{ googleSearch: {} }];
  }

  let fullText = "";
  let sources: Source[] = [];

  try {
    const streamResult = await ai.models.generateContentStream({
      model: modelId,
      contents: [{ role: 'user', parts: [{ text: "Proceed with the structured analysis." }] }],
      config: config
    });

    for await (const chunk of streamResult) {
      if (chunk.candidates && chunk.candidates[0]) {
         const parts = chunk.candidates[0].content.parts;
         for (const part of parts) {
            if (part.text) {
               fullText += part.text;
               onAnalysisUpdate(fullText, sources);
            }
         }
         
         if (chunk.candidates[0].groundingMetadata) {
            const webSources = parseGroundingSources(chunk.candidates[0].groundingMetadata);
            webSources.forEach(ws => {
              if (!sources.find(s => s.url === ws.url)) {
                sources.push(ws);
              }
            });
            onAnalysisUpdate(fullText, sources);
         }
      }
    }
  } catch (e) {
    console.error("Analysis generation failed", e);
    throw e;
  }
};

/**
 * Main Orchestrator Function
 */
export const generateAnalysisStream = async (
  query: string, 
  useDeepThinking: boolean, 
  mode: AnalysisMode,
  useWeb: boolean,
  onUpdate: (response: AnalysisResponse) => void
): Promise<void> => {
  
  const staticSources: Source[] = KNOWLEDGE_BASE.slice(0, 5).map((k, i) => ({
    id: (i + 1).toString(),
    title: k.metadata.title,
    publisher: k.metadata.author,
    date: k.metadata.year ? k.metadata.year.toString() : 'N/A',
    url: '#'
  }));

  let currentThinking: string[] = [];
  let currentSections: AnalysisSection[] = [];
  let currentSources: Source[] = [...staticSources];
  let isThinkingComplete = false;

  // Helper to emit updates
  const emit = () => {
    onUpdate({
      sections: currentSections,
      sources: currentSources,
      thinkingProcess: useDeepThinking ? currentThinking : undefined,
      isThinkingComplete: isThinkingComplete
    });
  };

  // Initial Update
  emit();

  try {
    let thinkingContext = "";

    // --- STEP 1: THINKING (If Enabled) ---
    if (useDeepThinking) {
      thinkingContext = await generateThinkingStream(query, (paragraphs) => {
        currentThinking = paragraphs;
        emit();
      });
      isThinkingComplete = true;
      emit(); // Mark thinking as done in UI
    }

    // --- STEP 2: ANALYSIS ---
    await generateStructuredAnalysis(
      query,
      thinkingContext,
      mode,
      useWeb,
      (text, newSources) => {
        currentSections = parseSections(text);
        // Merge sources uniquely
        newSources.forEach(ns => {
           if (!currentSources.find(s => s.url === ns.url)) {
              currentSources.push(ns);
           }
        });
        emit();
      }
    );

  } catch (error) {
    console.error("Orchestration Error:", error);
    currentSections = [
      {
          id: 'error',
          title: 'Analysis Interrupted',
          type: 'blindspot',
          content: 'The intelligence core encountered a disruption. Please retry your query.',
          isOpen: true
      }
    ];
    isThinkingComplete = true;
    emit();
  }
};