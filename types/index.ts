// types/index.ts

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Agent {
  id: string;
  name: string;
  description?: string;
  capabilities: string[];
  status?: string;
}

export type MessageType = 'user' | 'agent' | 'error';

export interface Message {
  type: MessageType;
  content: string;
  timestamp: string; // ISO
}

export interface RequestPayload {
  agentId?: string;
  request: string;
  priority: number;
  modelOverride?: string | null;
  autoRoute: boolean;
  // Exam Readiness Agent specific fields
  subject?: string;
  assessment_type?: 'quiz' | 'exam' | 'assignment';
  difficulty?: 'easy' | 'medium' | 'hard';
  question_count?: number;
  type_counts?: {
    mcq?: number;
    short_text?: number;
    essay?: number;
    coding?: number;
    math?: number;
  };
  pdf_input_paths?: string[];
  use_rag?: boolean;
  rag_top_k?: number;
  rag_max_chars?: number;
  export_pdf?: boolean;
  pdf_output_filename?: string;
}

export interface RequestResponseMetadata {
  executionTime: number; // milliseconds
  agentTrace: string[];
  participatingAgents: string[];
  cached?: boolean;
  pdf_exported?: boolean;
  pdf_path?: string;
  rag_pdfs_loaded?: string[];
}

export interface ErrorInfo {
  code?: string;
  message?: string;
  details?: string;
}

export interface RequestResponse {
  response?: string | AssessmentResponse;
  agentId?: string;
  status?: string; // e.g. "clarification_needed"
  clarifying_questions?: string[];
  intent_info?: any;
  timestamp: string; // ISO
  metadata?: RequestResponseMetadata;
  error?: ErrorInfo;
}

// Exam Readiness Agent specific response types
export interface Question {
  question_id: string;
  question_text: string;
  question_type: 'mcq' | 'short_text' | 'essay' | 'coding' | 'math';
  options: string[];
  correct_answer: string;
  explanation?: string;
  expected_keywords?: string[];
}

export interface AssessmentMetadata {
  created_by: string;
  allow_latex: boolean;
  used_rag: boolean;
  type_distribution: {
    mcq?: number;
    short_text?: number;
    essay?: number;
    coding?: number;
    math?: number;
  };
}

export interface AssessmentResponse {
  title: string;
  description: string;
  assessment_type: 'quiz' | 'exam' | 'assignment';
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  total_questions: number;
  questions: Question[];
  created_at: string;
  metadata: AssessmentMetadata;
}
