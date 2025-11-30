export type CitationStyle = 'None' | 'APA' | 'MLA' | 'Chicago' | 'Harvard' | 'IEEE';
export type SourceType = 'None' | 'article' | 'book' | 'web';

export interface Metadata {
  title?: string;
  author?: string; // UI uses single author input; backend normalizes
  year?: string;
  journal?: string;
  publisher?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  url?: string;
  isbn?: string; // optional; most styles omit ISBN in final citation
}

export interface Payload {
  style?: CitationStyle; // when 'None' or undefined, agent infers automatically
  source_type?: SourceType; // when 'None' or undefined, agent infers automatically
  raw_text?: string;
  metadata?: Metadata;
}

export interface AgentSpecificData {
  intent: string; // e.g., 'generate_citation'
  payload: Payload;
}

export interface OutputResult {
  formatted_citation: string;
  style_used: string;
  confidence: number;
  errors_detected: string[];
  suggestions: string[];
  // LLM-only suggestions for UI Gemini icon
  suggestions_llm?: string[];
  parsed_metadata?: Metadata; // auto-filled metadata derived from query
  // Metadata before applying any LLM changes (for revert)
  pre_llm_metadata?: Metadata;
  // Per-field LLM changes for apply/revert UX
  llm_applied_changes?: { field: string; before: any; after: any; source?: 'LLM' }[];
  source_type_used?: SourceType; // inferred source type from query/extraction
}

export interface AgentOutput {
  status: string;
  result: OutputResult;
  meta: {
    agent: 'citation_manager';
    version: string;
    timestamp: string;
  };
}
