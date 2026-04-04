export interface ResearchResult {
  source_url: string;
  title: string;
  content_summary: string;
  relevance_score: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface Session {
  id: string;
  title: string;
  updated_at: string;
}

export interface SessionMessage {
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface SessionDetail extends Session {
  messages: SessionMessage[];
}
